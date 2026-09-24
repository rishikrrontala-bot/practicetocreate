import '@fontsource/im-fell-french-canon/latin-400.css';
import '@fontsource-variable/atkinson-hyperlegible-next/wght.css';
import '@fontsource-variable/atkinson-hyperlegible-mono/wght.css';
import './styles/main.css';

import { compute, type Result } from './compute';
import { glareEvents } from './engine/export';
import { bearing, formatCoordinates, magneticToTrue, parseCoordinates } from './engine/geo';
import { travelWord } from './engine/glare';
import { AMNH_2026, MANHATTAN, azimuthCrossing } from './engine/henge';
import { buildCalendar } from './engine/ics';
import { sunPosition, mod } from './engine/solar';
import { PRESETS, decodeState, defaultState, encodeState, type AppState } from './engine/state';
import { ZoneYear, dateOfDayIndex, dayIndexOf, formatClock, formatDate, parseClock, wallClock } from './engine/time';
import { dayLabel, formatRange, legName, nextGlare, plural, shiftAdvice, verdict } from './engine/words';
import { Compass } from './ui/compass';
import { YearPlate, type Scrub } from './ui/plate';
import { WindshieldView } from './ui/view';

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ----------------------------------------------------------------------- state

const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
const thisYear = new Date().getFullYear();
let state: AppState = decodeState(location.hash, defaultState(thisYear));
let result: Result | null = null;
let first = true;

// ----------------------------------------------------------------------- worker

let worker: Worker | null = null;
try {
  worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
} catch {
  worker = null;
}
let requestId = 0;
let pending: ReturnType<typeof setTimeout> | null = null;

function request(): void {
  if (pending) clearTimeout(pending);
  pending = setTimeout(run, first ? 0 : 40);
}

function run(): void {
  const id = ++requestId;
  const snapshot = structuredClone(state);
  if (worker) {
    worker.onmessage = (e: MessageEvent<{ id: number; result?: Result; error?: string }>) => {
      if (e.data.id !== requestId) return;
      if (e.data.result) render(e.data.result, snapshot);
      else console.warn('Low Sun worker failed, computing on the page instead:', e.data.error);
    };
    worker.onerror = () => {
      worker = null;
      render(compute(snapshot), snapshot);
    };
    worker.postMessage({ id, state: snapshot });
  } else {
    render(compute(snapshot), snapshot);
  }
}

// ----------------------------------------------------------------------- UI parts

const plate = new YearPlate($('year-field'));
const view = new WindshieldView($('view'));
const outCompass = new Compass($('out-compass'), 'Morning drive direction');
const backCompass = new Compass($('back-compass'), 'Evening drive direction');

function todayIndexFor(s: AppState): number {
  const now = wallClock(Date.now(), s.timeZone);
  if (now.year !== s.year) return now.year > s.year ? 400 : -1;
  return dayIndexOf(s.year, now.month, now.day);
}

function render(r: Result, s: AppState): void {
  result = r;
  const today = todayIndexFor(s);
  plate.setToday(today >= 0 && today < 400 ? today : -1);
  plate.update(r, s, first && !reduceMotion);

  // Verdict.
  const v = verdict(s, r.summary, r.seasons);
  const h1 = $('verdict');
  if (v.count > 0) {
    const parts = v.headline.split(String(v.count));
    h1.replaceChildren(parts[0], Object.assign(document.createElement('em'), { textContent: String(v.count) }), parts.slice(1).join(String(v.count)));
  } else {
    h1.textContent = v.headline;
  }
  $('verdict-lines').replaceChildren(...v.lines.map((line) => Object.assign(document.createElement('li'), { textContent: line })));

  const now = wallClock(Date.now(), s.timeZone);
  const legEnds = [s.out, s.back].filter((l) => l.enabled).map((l) => l.depart + l.duration);
  const next = nextGlare(r.scan, Math.max(0, today), now.hour * 60 + now.minute, legEnds);
  const nextEl = $('verdict-next');
  if (today >= 400 || today < 0) nextEl.textContent = '';
  else if (next) {
    const which = legName(s, next.legIndex);
    const when = next.day.index === today ? 'today' : next.day.index === today + 1 ? 'tomorrow' : dayLabel(next.day);
    nextEl.textContent = `Next: ${when}, your ${which} drive.`;
  } else nextEl.textContent = `No more glare drives in ${s.year}.`;

  $('plate-year-meta').textContent = `${formatCoordinates(s.lat, s.lon, 2)} · ${s.timeZone.replace('_', ' ')}`;

  renderSeasons(r, s);
  outCompass.setSunArcs(sunArc(r, 'rise'), null);
  backCompass.setSunArcs(null, sunArc(r, 'set'));

  // First paint: put the cursor on the worst glare moment of the year so Plate II shows it.
  if (first) {
    const w = r.summary.worst;
    if (w) {
      const d = r.scan.days[w.index];
      const leg = legName(s, w.legIndex) === 'morning' ? s.out : s.back;
      plate.setScrub({ day: d.index, minute: leg.depart + d.legs[w.legIndex].peakMinute });
    } else plate.setScrub({ day: Math.max(0, Math.min(364, today)), minute: s.out.depart });
    first = false;
  } else {
    plate.setScrub(plate.getScrub());
  }
  document.body.dataset.ready = 'true';
}

/** The range of sunrise (or sunset) azimuths over the year, from the grid. */
function sunArc(r: Result, which: 'rise' | 'set'): [number, number] | null {
  const g = r.grid;
  let lo = 360;
  let hi = 0;
  for (let d = 0; d < g.days; d += 3) {
    const m = which === 'rise' ? g.sunrise[d] : g.sunset[d];
    if (Number.isNaN(m)) continue;
    const row = Math.min(g.rows - 1, Math.round(m / g.step));
    const az = g.azimuth[d * g.rows + row];
    lo = Math.min(lo, az);
    hi = Math.max(hi, az);
  }
  return lo < hi ? [lo, hi] : null;
}

function onScrub(sc: Scrub): void {
  if (!result) return;
  const s = state;
  const zone = new ZoneYear(s.year, s.timeZone);
  const d = dateOfDayIndex(s.year, sc.day);
  const t = zone.toUtc(d.month, d.day, sc.minute);
  const p = sunPosition(t, s.lat, s.lon);
  // Which way are you facing? The drive you're in, or the one on that side of noon.
  const inLeg = (leg: AppState['out']) => leg.enabled && sc.minute >= leg.depart && sc.minute <= leg.depart + leg.duration;
  let heading: number;
  let facing: string;
  if (inLeg(s.out)) {
    heading = s.out.heading;
    facing = 'on your morning drive';
  } else if (inLeg(s.back)) {
    heading = s.back.heading;
    facing = 'on your evening drive';
  } else {
    const morningSide = sc.minute < 12 * 60 + 30;
    const useOut = (morningSide && s.out.enabled) || !s.back.enabled;
    heading = useOut ? s.out.heading : s.back.heading;
    facing = `facing your ${useOut ? 'morning' : 'evening'} direction`;
  }
  const out = view.update({ sunAzimuth: p.azimuth, sunElevation: p.elevation, heading, limits: s.limits });
  $('view-meta').textContent = `${dayLabel({ ...d })} · ${formatClock(sc.minute)} · ${travelWord(heading)}`;
  $('scrub-readout').textContent = `${dayLabel(d)}, ${formatClock(sc.minute)}, ${facing}. ${out.text}`;
}
plate.onScrub = onScrub;

// ----------------------------------------------------------------------- seasons

function renderSeasons(r: Result, s: AppState): void {
  const list = $('season-list');
  const lede = $('seasons-lede');
  if (r.seasons.length === 0) {
    lede.textContent = 'None. At these times and in these directions, a low sun never sits within your chosen angle of the road ahead.';
    list.replaceChildren();
  } else {
    lede.textContent = `${plural(r.seasons.length, 'season')} this year. Each is a run of days when the sun sits within your chosen angle of the road ahead on that drive, with the smallest change of departure time that clears every drive in it.`;
    list.replaceChildren(
      ...r.seasons.map((season, k) => {
        const li = document.createElement('li');
        li.className = 'season';
        const which = legName(s, season.legIndex);
        const leg = which === 'morning' ? s.out : s.back;
        const worst = r.scan.days[season.worstIndex];
        const wl = worst.legs[season.legIndex];
        const advice = shiftAdvice(r.shifts[k]);

        const head = document.createElement('div');
        head.innerHTML = `<span class="season__range"></span><span class="season__leg"></span>`;
        head.querySelector('.season__range')!.textContent = formatRange(s.year, season.startIndex, season.endIndex);
        head.querySelector('.season__leg')!.textContent = `${which} drive · ${travelWord(leg.heading)} · ${formatClock(leg.depart)}`;

        const facts = document.createElement('dl');
        facts.className = 'season__facts';
        const add = (dt: string, dd: string) => {
          facts.append(Object.assign(document.createElement('dt'), { textContent: dt }), Object.assign(document.createElement('dd'), { textContent: dd }));
        };
        add('Drives affected', plural(season.drivingDays, 'drive'));
        add('Typical', `${plural(season.typicalMinutes, 'minute')} of the ${leg.duration}-minute drive`);
        add('Worst', `${dayLabel(worst)}, ${formatClock(leg.depart + wl.peakMinute)}: sun ${Math.max(0, wl.peakElevation).toFixed(0)}° up, ${Math.abs(wl.peakOffset).toFixed(0)}° ${wl.peakOffset < 0 ? 'left' : 'right'}`);

        const action = document.createElement('div');
        action.className = 'season__action';
        const p = document.createElement('p');
        p.className = 'season__advice';
        p.textContent = advice ? `${advice} to miss it` : 'No departure within an hour either side avoids it: consider another road';
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn btn--paper';
        btn.textContent = 'Show the worst morning'.replace('morning', which === 'morning' ? 'morning' : 'evening');
        btn.addEventListener('click', () => {
          plate.setScrub({ day: worst.index, minute: leg.depart + wl.peakMinute });
          $('plate-view').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
          $('year-scrub').focus({ preventScroll: true });
        });
        action.append(p, btn);
        li.append(head, facts, action);
        return li;
      }),
    );
  }

  // The road's own "henge".
  const hn = $('henge-note');
  const parts: string[] = [];
  const fmt = (e: { month: number; day: number; minute: number }) => `${formatDate(e.month, e.day)} (${formatClock(e.minute)})`;
  if (r.henges.morning.length) parts.push(`the sunrise lines up exactly with your morning road on ${r.henges.morning.map(fmt).join(' and ')}`);
  if (r.henges.evening.length) parts.push(`the sunset lines up with your evening road on ${r.henges.evening.map(fmt).join(' and ')}`);
  hn.textContent = parts.length
    ? `Your road’s own Manhattanhenge: ${parts.join('; ')}. Beautiful from the sidewalk, blinding from the driver’s seat if you’re on it then.`
    : '';
}

// ----------------------------------------------------------------------- the slip

const presetSel = $<HTMLSelectElement>('preset');
presetSel.append(
  ...PRESETS.map((p) => Object.assign(document.createElement('option'), { value: p.id, textContent: p.label })),
  Object.assign(document.createElement('option'), { value: 'custom', textContent: 'Custom place' }),
);

const yearSel = $<HTMLSelectElement>('year');
for (let y = thisYear - 1; y <= thisYear + 3; y++) yearSel.append(Object.assign(document.createElement('option'), { value: String(y), textContent: String(y) }));

const daysBox = $('days');
['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach((name, i) => {
  const label = document.createElement('label');
  const input = Object.assign(document.createElement('input'), { type: 'checkbox', value: String(i) });
  input.setAttribute('aria-label', name);
  const span = document.createElement('span');
  span.textContent = name.slice(0, 2);
  span.setAttribute('aria-hidden', 'true');
  label.append(input, span);
  daysBox.append(label);
});

const hhmm = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

function fillSlip(): void {
  const s = state;
  const preset = PRESETS.find((p) => Math.abs(p.state.lat - s.lat) < 1e-4 && Math.abs(p.state.lon - s.lon) < 1e-4);
  presetSel.value = preset ? preset.id : 'custom';
  $<HTMLInputElement>('coords').value = `${s.lat.toFixed(4)}, ${s.lon.toFixed(4)}`;
  $('coords-note').textContent = `${s.place} · time zone ${s.timeZone}`;
  for (const [key, leg, compass] of [['out', s.out, outCompass], ['back', s.back, backCompass]] as const) {
    $<HTMLInputElement>(`${key}-on`).checked = leg.enabled;
    $<HTMLInputElement>(`${key}-time`).value = hhmm(leg.depart);
    $<HTMLInputElement>(`${key}-dur`).value = String(leg.duration);
    $<HTMLInputElement>(`${key}-heading`).value = String(Math.round(leg.heading * 10) / 10);
    $(`leg-${key}`).classList.toggle('is-off', !leg.enabled);
    compass.set(leg.heading);
  }
  $<HTMLInputElement>('back-reverse').checked = Math.abs(mod(s.back.heading - s.out.heading, 360) - 180) < 0.05;
  daysBox.querySelectorAll('input').forEach((inp, i) => (inp.checked = s.days[i]));
  document.querySelectorAll<HTMLInputElement>('input[name="level"]').forEach((r) => (r.checked = Number(r.value) === s.limits.minLevel));
  yearSel.value = String(s.year);
}

function changed(): void {
  history.replaceState(null, '', `#${encodeState(state)}`);
  request();
}

function setHeading(which: 'out' | 'back', heading: number, fromUser = true): void {
  const h = Math.round(mod(heading, 360) * 10) / 10;
  state[which].heading = h;
  if (which === 'out' && $<HTMLInputElement>('back-reverse').checked) state.back.heading = Math.round(mod(h + 180, 360) * 10) / 10;
  if (which === 'back' && fromUser) $<HTMLInputElement>('back-reverse').checked = Math.abs(mod(h - state.out.heading, 360) - 180) < 0.05;
  outCompass.set(state.out.heading);
  backCompass.set(state.back.heading);
  $<HTMLInputElement>('out-heading').value = String(state.out.heading);
  $<HTMLInputElement>('back-heading').value = String(state.back.heading);
  changed();
}

outCompass.onChange = (h) => setHeading('out', h);
backCompass.onChange = (h) => setHeading('back', h);

presetSel.addEventListener('change', () => {
  const p = PRESETS.find((x) => x.id === presetSel.value);
  if (!p) return;
  state = { ...structuredClone(p.state), year: state.year };
  fillSlip();
  first = true;
  changed();
});

yearSel.addEventListener('change', () => {
  state.year = Number(yearSel.value);
  changed();
});

$<HTMLInputElement>('coords').addEventListener('change', (e) => {
  const input = e.target as HTMLInputElement;
  const c = parseCoordinates(input.value);
  const note = $('coords-note');
  if (!c) {
    input.setAttribute('aria-invalid', 'true');
    note.textContent = 'Couldn’t read that. Try “40.7527, -73.9818” or paste a map link with coordinates in it.';
    note.classList.add('is-error');
    return;
  }
  input.removeAttribute('aria-invalid');
  note.classList.remove('is-error');
  void setPlace(c.lat, c.lon, 'Custom place');
});

async function setPlace(lat: number, lon: number, label: string): Promise<void> {
  let tz = state.timeZone;
  try {
    const { default: tzLookup } = await import('@photostructure/tz-lookup');
    tz = tzLookup(lat, lon);
  } catch {
    tz = localTz;
  }
  state = { ...state, lat, lon, timeZone: tz, place: label };
  fillSlip();
  first = true;
  changed();
}

$('locate').addEventListener('click', () => {
  const note = $('locate-note');
  if (!('geolocation' in navigator)) {
    note.textContent = 'This browser can’t share a location. Type coordinates instead.';
    return;
  }
  note.textContent = 'Asking your browser…';
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      note.textContent = 'Using your location. It stays on this device.';
      void setPlace(Math.round(pos.coords.latitude * 1e4) / 1e4, Math.round(pos.coords.longitude * 1e4) / 1e4, 'Your location');
    },
    (err) => {
      note.textContent = err.code === err.PERMISSION_DENIED ? 'Location permission was declined. Type coordinates instead.' : 'Couldn’t get a location. Type coordinates instead.';
    },
    { enableHighAccuracy: false, timeout: 10_000, maximumAge: 600_000 },
  );
});

for (const key of ['out', 'back'] as const) {
  $<HTMLInputElement>(`${key}-on`).addEventListener('change', (e) => {
    state[key].enabled = (e.target as HTMLInputElement).checked;
    $(`leg-${key}`).classList.toggle('is-off', !state[key].enabled);
    changed();
  });
  $<HTMLInputElement>(`${key}-time`).addEventListener('change', (e) => {
    const m = parseClock((e.target as HTMLInputElement).value);
    if (m === null) return;
    state[key].depart = m;
    changed();
  });
  $<HTMLInputElement>(`${key}-dur`).addEventListener('change', (e) => {
    const input = e.target as HTMLInputElement;
    const n = Math.round(Number(input.value));
    if (!Number.isFinite(n) || n < 1 || n > 180) {
      input.setAttribute('aria-invalid', 'true');
      return;
    }
    input.removeAttribute('aria-invalid');
    state[key].duration = n;
    changed();
  });
  $<HTMLInputElement>(`${key}-heading`).addEventListener('change', (e) => {
    const n = Number((e.target as HTMLInputElement).value);
    if (!Number.isFinite(n)) return;
    setHeading(key, n);
  });
}

$<HTMLInputElement>('back-reverse').addEventListener('change', (e) => {
  if ((e.target as HTMLInputElement).checked) setHeading('out', state.out.heading);
});

daysBox.addEventListener('change', () => {
  state.days = [...daysBox.querySelectorAll('input')].map((i) => i.checked);
  changed();
});

$('level').addEventListener('change', (e) => {
  const v = Number((e.target as HTMLInputElement).value);
  if (v === 1 || v === 2 || v === 3) {
    state.limits = { ...state.limits, minLevel: v };
    changed();
  }
});

// Two points on the road.
$('use-points').addEventListener('click', () => {
  const a = parseCoordinates($<HTMLInputElement>('from-pt').value);
  const b = parseCoordinates($<HTMLInputElement>('to-pt').value);
  const note = $('points-note');
  if (!a || !b) {
    note.textContent = 'Enter two coordinate pairs, the first where you start and the second further along the road.';
    return;
  }
  if (Math.abs(a.lat - b.lat) < 1e-6 && Math.abs(a.lon - b.lon) < 1e-6) {
    note.textContent = 'Those are the same point. Pick two points some distance apart.';
    return;
  }
  const h = bearing(a.lat, a.lon, b.lat, b.lon);
  note.textContent = `Heading ${h.toFixed(1)}° (${travelWord(h)}).`;
  setHeading('out', h);
});

// Aim with the phone's compass.
$('aim').addEventListener('click', async () => {
  const note = $('aim-note');
  type OrientationCtor = typeof DeviceOrientationEvent & { requestPermission?: () => Promise<'granted' | 'denied'> };
  const Ctor = (window as unknown as { DeviceOrientationEvent?: OrientationCtor }).DeviceOrientationEvent;
  if (!Ctor) {
    note.textContent = 'No compass here. On a laptop, drag the needle or use two points instead.';
    return;
  }
  try {
    if (typeof Ctor.requestPermission === 'function' && (await Ctor.requestPermission()) !== 'granted') {
      note.textContent = 'Compass permission was declined.';
      return;
    }
  } catch {
    note.textContent = 'Compass permission was declined.';
    return;
  }
  note.textContent = 'Hold the phone flat, top edge pointing along the road…';
  const readings: number[] = [];
  let magnetic = true;
  const handler = (e: DeviceOrientationEvent) => {
    const webkit = (e as DeviceOrientationEvent & { webkitCompassHeading?: number }).webkitCompassHeading;
    if (typeof webkit === 'number') readings.push(webkit);
    else if (e.absolute && e.alpha !== null) readings.push(mod(360 - e.alpha, 360));
  };
  window.addEventListener('deviceorientationabsolute', handler as EventListener);
  window.addEventListener('deviceorientation', handler);
  setTimeout(async () => {
    window.removeEventListener('deviceorientationabsolute', handler as EventListener);
    window.removeEventListener('deviceorientation', handler);
    if (readings.length < 3) {
      note.textContent = 'No compass readings came through. Try two points on the road instead.';
      return;
    }
    // Circular mean of the readings.
    const sx = readings.reduce((a, d) => a + Math.cos((d * Math.PI) / 180), 0);
    const sy = readings.reduce((a, d) => a + Math.sin((d * Math.PI) / 180), 0);
    let h = mod((Math.atan2(sy, sx) * 180) / Math.PI, 360);
    let decl = 0;
    if (magnetic) {
      try {
        const geomagnetism = (await import('geomagnetism')).default;
        decl = geomagnetism.model(new Date(), { allowOutOfBoundsModel: true }).point([state.lat, state.lon]).decl;
        h = magneticToTrue(h, decl);
      } catch {
        magnetic = false;
      }
    }
    note.textContent = `Heading ${h.toFixed(0)}° true${magnetic ? `, corrected for ${Math.abs(decl).toFixed(1)}° ${decl < 0 ? 'W' : 'E'} magnetic declination` : ''}.`;
    setHeading('out', h);
  }, 1500);
});

// ----------------------------------------------------------------------- actions

$('ics').addEventListener('click', () => {
  if (!result) return;
  const note = $('actions-note');
  const today = todayIndexFor(state);
  const from = today >= 400 ? 9999 : Math.max(0, today);
  const events = glareEvents(state, result.scan, result.seasons, result.shifts, from);
  if (events.length === 0) {
    note.textContent = today >= 400 ? `${state.year} is over. Pick this year or next.` : 'No glare drives left to add for this year.';
    return;
  }
  const ics = buildCalendar(events, Date.now(), `Low Sun: ${state.place}`);
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `low-sun-${state.year}.ics`;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  note.textContent = `Downloaded ${plural(events.length, 'glare drive')}, each with a reminder an hour before. Open the file to add them to your calendar.`;
});

$('share').addEventListener('click', async () => {
  const url = `${location.origin}${location.pathname}#${encodeState(state)}`;
  const note = $('actions-note');
  try {
    await navigator.clipboard.writeText(url);
    note.textContent = 'Link copied. It opens this exact commute.';
  } catch {
    note.textContent = url;
  }
});

// ----------------------------------------------------------------------- proof

function renderProof(): void {
  const zone = new ZoneYear(2026, MANHATTAN.timeZone);
  const tbody = document.querySelector('#proof-henge tbody')!;
  tbody.replaceChildren(
    ...AMNH_2026.map((e) => {
      const t = azimuthCrossing(MANHATTAN.lat, MANHATTAN.lon, zone, e.month, e.day, MANHATTAN.gridAzimuth, 'sunset');
      const tr = document.createElement('tr');
      const said = `${e.kind === 'full' ? 'Full' : 'Half'} sun · ${formatDate(e.month, e.day)} · ${formatClock(e.minute)}`;
      let got = 'n/a';
      let ok = false;
      if (t !== null) {
        const local = (((t / 60_000 + zone.offsetAt(t)) % 1440) + 1440) % 1440;
        const alt = sunPosition(t, MANHATTAN.lat, MANHATTAN.lon).elevation;
        got = `${formatClock(Math.round(local))}, sun ${alt.toFixed(2)}° up`;
        ok = Math.abs(local - e.minute) < 1.5;
      }
      tr.innerHTML = '<td></td><td></td>';
      tr.children[0].textContent = said;
      tr.children[1].textContent = got;
      if (ok) tr.children[1].classList.add('ok');
      return tr;
    }),
  );

  const spa = sunPosition(Date.UTC(2003, 9, 17, 19, 30, 30), 39.742476, -105.1786);
  const zen = 90 - spa.elevation;
  const rows: [string, string, string][] = [
    ['Zenith', '50.11162°', `${zen.toFixed(5)}° (Δ ${Math.abs(zen - 50.11162).toFixed(3)}°)`],
    ['Azimuth', '194.34024°', `${spa.azimuth.toFixed(5)}° (Δ ${Math.abs(spa.azimuth - 194.34024).toFixed(3)}°)`],
  ];
  document.querySelector('#proof-spa tbody')!.replaceChildren(
    ...rows.map(([a, b, c]) => {
      const tr = document.createElement('tr');
      tr.innerHTML = '<th scope="row"></th><td></td><td class="ok"></td>';
      tr.children[0].textContent = a;
      tr.children[1].textContent = b;
      tr.children[2].textContent = c;
      return tr;
    }),
  );
}

// ----------------------------------------------------------------------- boot

fillSlip();
request();
if ('requestIdleCallback' in window) requestIdleCallback(renderProof, { timeout: 1500 });
else setTimeout(renderProof, 300);

window.addEventListener('hashchange', () => {
  const next = decodeState(location.hash, state);
  if (encodeState(next) !== encodeState(state)) {
    state = next;
    fillSlip();
    request();
  }
});
