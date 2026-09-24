/**
 * The whole app state as plain data, with a compact, shareable URL-hash form
 * (so a judge's deep link opens exactly the commute being described).
 */

import { DEFAULT_LIMITS, type GlareLimits } from './glare';
import { mod } from './solar';
import type { Commute, Leg } from './scan';
import { isValidTimeZone } from './time';

export interface LegState {
  /** Degrees true. */
  heading: number;
  /** Minutes after midnight. */
  depart: number;
  /** Minutes. */
  duration: number;
  enabled: boolean;
}

export interface AppState {
  place: string;
  lat: number;
  lon: number;
  timeZone: string;
  year: number;
  out: LegState;
  back: LegState;
  /** Sun..Sat */
  days: boolean[];
  limits: GlareLimits;
}

export interface Preset {
  id: string;
  label: string;
  note: string;
  state: Omit<AppState, 'year'>;
}

const WEEKDAYS = [false, true, true, true, true, true, false];

/**
 * Sample commutes on streets whose direction is documented: the Manhattan grid
 * (29° off true north; AMNH uses 299.1° for the cross streets) and the
 * true-cardinal mile grids of Tucson, Chicago and Salt Lake City. Coordinates are
 * approximate city-centre points.
 */
export const PRESETS: Preset[] = [
  {
    id: 'tucson',
    label: 'Tucson, AZ',
    note: 'An east–west arterial on the mile grid. Tucson is where Mitra (2014) measured sun-glare crashes.',
    state: {
      place: 'Tucson, AZ',
      lat: 32.2319,
      lon: -110.9501,
      timeZone: 'America/Phoenix',
      out: { heading: 90, depart: 7 * 60 + 15, duration: 25, enabled: true },
      back: { heading: 270, depart: 17 * 60 + 20, duration: 25, enabled: true },
      days: WEEKDAYS,
      limits: DEFAULT_LIMITS,
    },
  },
  {
    id: 'manhattan',
    label: 'Manhattan, NY',
    note: 'Crosstown on 42nd Street, along the grid bearing AMNH uses for Manhattanhenge (299.1°).',
    state: {
      place: 'Manhattan, NY',
      lat: 40.7527,
      lon: -73.9818,
      timeZone: 'America/New_York',
      out: { heading: 119.1, depart: 7 * 60 + 30, duration: 20, enabled: true },
      back: { heading: 299.1, depart: 19 * 60 + 45, duration: 20, enabled: true },
      days: WEEKDAYS,
      limits: DEFAULT_LIMITS,
    },
  },
  {
    id: 'chicago',
    label: 'Chicago, IL',
    note: 'An east–west street on Chicago’s true-cardinal grid.',
    state: {
      place: 'Chicago, IL',
      lat: 41.8781,
      lon: -87.6298,
      timeZone: 'America/Chicago',
      out: { heading: 90, depart: 7 * 60 + 20, duration: 30, enabled: true },
      back: { heading: 270, depart: 17 * 60 + 30, duration: 30, enabled: true },
      days: WEEKDAYS,
      limits: DEFAULT_LIMITS,
    },
  },
  {
    id: 'saltlake',
    label: 'Salt Lake City, UT',
    note: 'An east–west street on the city’s true-cardinal grid.',
    state: {
      place: 'Salt Lake City, UT',
      lat: 40.7608,
      lon: -111.891,
      timeZone: 'America/Denver',
      out: { heading: 90, depart: 7 * 60 + 25, duration: 20, enabled: true },
      back: { heading: 270, depart: 17 * 60 + 40, duration: 20, enabled: true },
      days: WEEKDAYS,
      limits: DEFAULT_LIMITS,
    },
  },
];

export function defaultState(year: number): AppState {
  return { ...structuredClone(PRESETS[0].state), year };
}

export function toCommute(s: AppState): Commute {
  const legs: Leg[] = [];
  if (s.out.enabled) {
    legs.push({ id: 'out', label: 'Morning drive', depart: s.out.depart, segments: [{ heading: s.out.heading, minutes: s.out.duration }] });
  }
  if (s.back.enabled) {
    legs.push({ id: 'back', label: 'Evening drive', depart: s.back.depart, segments: [{ heading: s.back.heading, minutes: s.back.duration }] });
  }
  return { lat: s.lat, lon: s.lon, timeZone: s.timeZone, year: s.year, legs, days: s.days, limits: s.limits };
}

// ---------------------------------------------------------------------------
// URL hash: #at=32.2319,-110.9501&tz=America/Phoenix&out=90@07:15+25&back=270@17:20+25&days=0111110&lvl=2&y=2026&p=Tucson%2C%20AZ

const r4 = (n: number) => Math.round(n * 1e4) / 1e4;
const r1 = (n: number) => Math.round(n * 10) / 10;
const hhmm = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

function encodeLeg(l: LegState): string {
  return l.enabled ? `${r1(l.heading)}@${hhmm(l.depart)}+${l.duration}` : 'off';
}

export function encodeState(s: AppState): string {
  const p = new URLSearchParams();
  p.set('at', `${r4(s.lat)},${r4(s.lon)}`);
  p.set('tz', s.timeZone);
  p.set('out', encodeLeg(s.out));
  p.set('back', encodeLeg(s.back));
  p.set('days', s.days.map((d) => (d ? '1' : '0')).join(''));
  p.set('lvl', String(s.limits.minLevel));
  p.set('y', String(s.year));
  p.set('p', s.place);
  return p.toString();
}

function decodeLeg(text: string | null, fallback: LegState): LegState {
  if (text === null) return fallback;
  if (text === 'off') return { ...fallback, enabled: false };
  const m = text.match(/^(-?\d+(?:\.\d+)?)@(\d{1,2}):(\d{2})\+(\d{1,3})$/);
  if (!m) return fallback;
  const heading = Math.round(mod(Number(m[1]), 360) * 10) / 10;
  const depart = Number(m[2]) * 60 + Number(m[3]);
  const duration = Number(m[4]);
  if (depart >= 1440 || Number(m[3]) > 59 || duration < 1 || duration > 180) return fallback;
  return { heading, depart, duration, enabled: true };
}

/** Parse a hash (with or without the leading '#'); unknown or invalid fields fall back to `base`. */
export function decodeState(hash: string, base: AppState): AppState {
  const p = new URLSearchParams(hash.replace(/^#/, ''));
  const s: AppState = structuredClone(base);
  const at = p.get('at')?.split(',').map(Number);
  if (at && at.length === 2 && at.every(Number.isFinite) && Math.abs(at[0]) <= 90 && Math.abs(at[1]) <= 180) {
    s.lat = at[0];
    s.lon = at[1];
  }
  const tz = p.get('tz');
  if (tz && isValidTimeZone(tz)) s.timeZone = tz;
  s.out = decodeLeg(p.get('out'), s.out);
  s.back = decodeLeg(p.get('back'), s.back);
  const days = p.get('days');
  if (days && /^[01]{7}$/.test(days)) s.days = [...days].map((c) => c === '1');
  const lvl = p.get('lvl');
  if (lvl === '1' || lvl === '2' || lvl === '3') s.limits = { ...s.limits, minLevel: Number(lvl) as 1 | 2 | 3 };
  const y = Number(p.get('y'));
  if (Number.isInteger(y) && y >= 1900 && y <= 2100) s.year = y;
  const place = p.get('p');
  if (place) s.place = place.slice(0, 60);
  return s;
}
