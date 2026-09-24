import { describe, expect, it } from 'vitest';
import { DEFAULT_LIMITS } from '../src/engine/glare';
import {
  bestShift,
  findSeasons,
  glareGrid,
  headingAt,
  legDuration,
  scanLegDay,
  scanYear,
  seasonDays,
  seasonShift,
  summarize,
  sunGrid,
  type Commute,
} from '../src/engine/scan';
import { ZoneYear, dayIndexOf } from '../src/engine/time';

const WEEKDAYS = [false, true, true, true, true, true, false];

function tucson(overrides: Partial<Commute> = {}): Commute {
  return {
    lat: 32.2319,
    lon: -110.9501,
    timeZone: 'America/Phoenix',
    year: 2026,
    legs: [
      { id: 'out', label: 'Morning', depart: 7 * 60 + 15, segments: [{ heading: 90, minutes: 25 }] },
      { id: 'back', label: 'Evening', depart: 17 * 60 + 20, segments: [{ heading: 270, minutes: 25 }] },
    ],
    days: WEEKDAYS,
    limits: DEFAULT_LIMITS,
    ...overrides,
  };
}

describe('legs', () => {
  it('knows the heading at each minute of a multi-segment drive', () => {
    const leg = { id: 'x', label: 'x', depart: 0, segments: [{ heading: 90, minutes: 10 }, { heading: 0, minutes: 5 }] };
    expect(legDuration(leg)).toBe(15);
    expect(headingAt(leg, 0)).toBe(90);
    expect(headingAt(leg, 9)).toBe(90);
    expect(headingAt(leg, 10)).toBe(0);
    expect(headingAt(leg, 99)).toBe(0);
  });
});

describe('scanning one drive', () => {
  const c = tucson();
  const zone = new ZoneYear(2026, c.timeZone);

  it('finds glare on an eastbound drive into the March sunrise', () => {
    const r = scanLegDay(c, zone, c.legs[0], 3, 16);
    expect(r.glareMinutes).toBeGreaterThan(0);
    expect(r.peakLevel).toBeGreaterThanOrEqual(2);
    expect(r.peakAngle).toBeLessThanOrEqual(15);
  });

  it('finds none at midsummer, when the 7:15 sun is already high in the northeast', () => {
    expect(scanLegDay(c, zone, c.legs[0], 6, 21).glareMinutes).toBe(0);
  });

  it('finds none driving away from the sun', () => {
    const away = tucson({ legs: [{ id: 'w', label: 'w', depart: 7 * 60 + 15, segments: [{ heading: 270, minutes: 25 }] }] });
    expect(scanLegDay(away, zone, away.legs[0], 3, 16).glareMinutes).toBe(0);
  });

  it('counts only the level the user chose', () => {
    const strict = tucson({ limits: { ...DEFAULT_LIMITS, minLevel: 3 } });
    const loose = tucson({ limits: { ...DEFAULT_LIMITS, minLevel: 1 } });
    const s = scanLegDay(strict, zone, strict.legs[0], 3, 16).glareMinutes;
    const d = scanLegDay(c, zone, c.legs[0], 3, 16).glareMinutes;
    const l = scanLegDay(loose, zone, loose.legs[0], 3, 16).glareMinutes;
    expect(s).toBeLessThanOrEqual(d);
    expect(d).toBeLessThanOrEqual(l);
  });
});

describe('the year', () => {
  const c = tucson();
  const scan = scanYear(c);

  it('scans every day of the year and marks driving days', () => {
    expect(scan.days).toHaveLength(365);
    expect(scan.days.filter((d) => d.driving)).toHaveLength(261);
  });

  it('groups glare into spring and autumn seasons for each direction', () => {
    const seasons = findSeasons(scan);
    const morning = seasons.filter((s) => s.legIndex === 0);
    const evening = seasons.filter((s) => s.legIndex === 1);
    expect(morning.length).toBeGreaterThanOrEqual(2);
    expect(evening.length).toBeGreaterThanOrEqual(2);
    for (const s of seasons) {
      expect(s.drivingDays).toBeGreaterThan(0);
      expect(s.maxMinutes).toBeGreaterThanOrEqual(s.typicalMinutes);
    }
    // No glare days on the morning drive around midsummer or midwinter.
    const june = dayIndexOf(2026, 6, 21);
    const dec = dayIndexOf(2026, 12, 21);
    expect(scan.days[june].legs[0].glareMinutes).toBe(0);
    expect(scan.days[dec].legs[0].glareMinutes).toBe(0);
  });

  it('summarises the year consistently with the day results', () => {
    const sum = summarize(scan);
    const manual = scan.days.filter((d) => d.driving && d.legs.some((l) => l.glareMinutes > 0)).length;
    expect(sum.totalDays).toBe(manual);
    expect(sum.perLeg[0]).toBe(scan.days.filter((d) => d.driving && d.legs[0].glareMinutes > 0).length);
    expect(sum.worst).not.toBeNull();
  });

  it('suggests a departure shift that really clears the glare', () => {
    const zone = new ZoneYear(2026, c.timeZone);
    const day = scan.days.find((d) => d.driving && d.legs[0].glareMinutes > 0)!;
    const advice = bestShift(c, 0, day.month, day.day, 90, zone);
    expect(advice.earlier !== null || advice.later !== null).toBe(true);
    if (advice.later !== null) {
      expect(scanLegDay(c, zone, c.legs[0], day.month, day.day, advice.later).glareMinutes).toBe(0);
      if (advice.later > 1) {
        expect(scanLegDay(c, zone, c.legs[0], day.month, day.day, advice.later - 1).glareMinutes).toBeGreaterThan(0);
      }
    }
    if (advice.earlier !== null) {
      expect(scanLegDay(c, zone, c.legs[0], day.month, day.day, -advice.earlier).glareMinutes).toBe(0);
    }
  });

  it('gives one shift that clears a whole season', () => {
    const season = findSeasons(scan)[0];
    const advice = seasonShift(c, scan, season, 90);
    const zone = new ZoneYear(2026, c.timeZone);
    const leg = c.legs[season.legIndex];
    for (const i of seasonDays(season, 365)) {
      const d = scan.days[i];
      if (!d.driving) continue;
      if (advice.later !== null) expect(scanLegDay(c, zone, leg, d.month, d.day, advice.later).glareMinutes).toBe(0);
      if (advice.earlier !== null) expect(scanLegDay(c, zone, leg, d.month, d.day, -advice.earlier).glareMinutes).toBe(0);
    }
  });
});

describe('seasons across New Year', () => {
  it('joins an Oct–Mar winter season into one that wraps', () => {
    // Manhattan crosstown, eastbound at 7:30: the winter sunrise sits down the street.
    const c: Commute = {
      lat: 40.7527,
      lon: -73.9818,
      timeZone: 'America/New_York',
      year: 2026,
      legs: [{ id: 'out', label: 'Morning', depart: 7 * 60 + 30, segments: [{ heading: 119.1, minutes: 20 }] }],
      days: WEEKDAYS,
      limits: DEFAULT_LIMITS,
    };
    const seasons = findSeasons(scanYear(c));
    const winter = seasons.find((s) => s.wraps);
    expect(winter).toBeDefined();
    expect(winter!.startIndex).toBeGreaterThan(winter!.endIndex);
    const days = seasonDays(winter!, 365);
    expect(days[0]).toBe(winter!.startIndex);
    expect(days[days.length - 1]).toBe(winter!.endIndex);
  });
});

describe('the sun grid behind the plate', () => {
  const g = sunGrid(40.7527, -73.9818, 'America/New_York', 2026, 5);

  it('has 365 × 288 cells', () => {
    expect(g.rows).toBe(288);
    expect(g.azimuth.length).toBe(365 * 288);
  });

  it('puts New York sunrise and sunset at the solstice where NOAA does (about 5:25 AM and 8:31 PM EDT)', () => {
    const i = dayIndexOf(2026, 6, 21);
    expect(Math.abs(g.sunrise[i] - (5 * 60 + 25))).toBeLessThan(4);
    expect(Math.abs(g.sunset[i] - (20 * 60 + 31))).toBeLessThan(4);
  });

  it('marks glare cells only in the low-sun hours', () => {
    const cells = glareGrid(g, [119.1, 299.1]);
    const noonRow = 12 * 12;
    for (let d = 0; d < 365; d++) expect(cells[d * g.rows + noonRow]).toBe(0);
    expect(cells.some((v) => v === 3)).toBe(true);
  });
});
