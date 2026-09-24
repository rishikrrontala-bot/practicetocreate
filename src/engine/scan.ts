/**
 * The year scan: every minute of every commute, for a whole calendar year.
 *
 * Pure functions over plain data, so they run identically in the page, in the
 * Web Worker and in the unit tests.
 */

import { sunPosition } from './solar';
import { DEFAULT_LIMITS, glareLevel, glareReading, type GlareLevel, type GlareLimits } from './glare';
import { ZoneYear, dateOfDayIndex, daysInYear } from './time';

const MINUTE = 60_000;

/** One straight stretch of a drive. */
export interface Segment {
  /** Direction of travel, degrees clockwise from true north. */
  heading: number;
  /** How long this stretch takes, in minutes. */
  minutes: number;
}

export interface Leg {
  id: string;
  label: string;
  /** Departure, minutes after local midnight. */
  depart: number;
  segments: Segment[];
}

export interface Commute {
  lat: number;
  lon: number;
  timeZone: string;
  year: number;
  legs: Leg[];
  /** Which weekdays you drive, Sunday = index 0. */
  days: boolean[];
  limits: GlareLimits;
}

export function legDuration(leg: Leg): number {
  return leg.segments.reduce((s, g) => s + Math.max(0, g.minutes), 0);
}

/** The heading being driven `minute` minutes after departure. */
export function headingAt(leg: Leg, minute: number): number {
  let t = 0;
  for (const s of leg.segments) {
    t += s.minutes;
    if (minute < t) return s.heading;
  }
  return leg.segments[leg.segments.length - 1]?.heading ?? 0;
}

// ---------------------------------------------------------------------------
// The sun grid behind the plate: az/el for every `step` minutes of every day.

export interface SunGrid {
  year: number;
  days: number;
  step: number; // minutes
  rows: number; // samples per day
  azimuth: Float32Array; // [day * rows + row]
  elevation: Float32Array;
  /** Local minute-of-day of sunrise/sunset per day (NaN when the sun doesn't rise/set). */
  sunrise: Float32Array;
  sunset: Float32Array;
}

export function sunGrid(lat: number, lon: number, timeZone: string, year: number, step = 5): SunGrid {
  const zone = new ZoneYear(year, timeZone);
  const days = daysInYear(year);
  const rows = Math.round(1440 / step);
  const azimuth = new Float32Array(days * rows);
  const elevation = new Float32Array(days * rows);
  const sunrise = new Float32Array(days).fill(NaN);
  const sunset = new Float32Array(days).fill(NaN);

  for (let d = 0; d < days; d++) {
    const { month, day } = dateOfDayIndex(year, d);
    const midnight = zone.toUtc(month, day, 0);
    const offsetMid = zone.offsetAt(midnight);
    let prevEl = NaN;
    for (let r = 0; r < rows; r++) {
      const minute = r * step;
      // Fast path: same offset as midnight unless a DST change happens today.
      let t = midnight + minute * MINUTE;
      const o = zone.offsetAt(t);
      if (o !== offsetMid) t = zone.toUtc(month, day, minute);
      const p = sunPosition(t, lat, lon);
      azimuth[d * rows + r] = p.azimuth;
      elevation[d * rows + r] = p.elevation;
      if (r > 0) {
        if (prevEl < 0 && p.elevation >= 0 && Number.isNaN(sunrise[d])) {
          sunrise[d] = minute - step * (p.elevation / (p.elevation - prevEl));
        }
        if (prevEl >= 0 && p.elevation < 0) {
          sunset[d] = minute - step * (p.elevation / (p.elevation - prevEl));
        }
      }
      prevEl = p.elevation;
    }
  }
  return { year, days, step, rows, azimuth, elevation, sunrise, sunset };
}

/** Glare level per grid cell for a set of road directions (max over headings). */
export function glareGrid(grid: SunGrid, headings: number[], limits: GlareLimits = DEFAULT_LIMITS): Uint8Array {
  const out = new Uint8Array(grid.days * grid.rows);
  for (let i = 0; i < out.length; i++) {
    const el = grid.elevation[i];
    if (el < 0 || el > limits.maxElevation) continue;
    const az = grid.azimuth[i];
    let best = 0;
    for (const h of headings) {
      const l = glareLevel(az, el, h, limits);
      if (l > best) best = l;
    }
    out[i] = best;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Minute-by-minute scan of the commute itself.

export interface LegDay {
  /** Minutes of this drive with the sun in your eyes. */
  glareMinutes: number;
  /** Minutes after departure of the first and last glare minute (-1 if none). */
  first: number;
  last: number;
  peakLevel: GlareLevel;
  /** Minutes after departure of the worst moment. */
  peakMinute: number;
  peakAngle: number;
  peakElevation: number;
  /** Signed horizontal offset of the sun at the worst moment (negative = left). */
  peakOffset: number;
  peakHeading: number;
}

export interface DayResult {
  index: number;
  month: number;
  day: number;
  weekday: number;
  /** Whether you drive this weekday. */
  driving: boolean;
  legs: LegDay[];
}

const NO_GLARE: LegDay = {
  glareMinutes: 0,
  first: -1,
  last: -1,
  peakLevel: 0,
  peakMinute: -1,
  peakAngle: 180,
  peakElevation: NaN,
  peakOffset: NaN,
  peakHeading: NaN,
};

/** Scan one leg on one local date. `shift` moves the departure (minutes). */
export function scanLegDay(
  commute: Commute,
  zone: ZoneYear,
  leg: Leg,
  month: number,
  day: number,
  shift = 0,
): LegDay {
  const duration = legDuration(leg);
  if (duration <= 0) return NO_GLARE;
  const start = zone.toUtc(month, day, leg.depart + shift);
  let result: LegDay | null = null;
  for (let m = 0; m <= duration; m++) {
    const t = start + m * MINUTE;
    const p = sunPosition(t, commute.lat, commute.lon);
    if (p.elevation < 0 || p.elevation > commute.limits.maxElevation) continue;
    const heading = headingAt(leg, m);
    const r = glareReading(p.azimuth, p.elevation, heading, commute.limits);
    if (r.level < commute.limits.minLevel) continue;
    if (!result) result = { ...NO_GLARE, first: m };
    result.glareMinutes++;
    result.last = m;
    if (r.angle < result.peakAngle) {
      result.peakAngle = r.angle;
      result.peakLevel = r.level;
      result.peakMinute = m;
      result.peakElevation = r.elevation;
      result.peakOffset = r.offset;
      result.peakHeading = heading;
    }
  }
  return result ?? NO_GLARE;
}

export interface YearScan {
  commute: Commute;
  days: DayResult[];
}

export function scanYear(commute: Commute): YearScan {
  const zone = new ZoneYear(commute.year, commute.timeZone);
  const n = daysInYear(commute.year);
  const days: DayResult[] = [];
  for (let i = 0; i < n; i++) {
    const { month, day, weekday } = dateOfDayIndex(commute.year, i);
    const driving = commute.days[weekday] ?? false;
    const legs = commute.legs.map((leg) => scanLegDay(commute, zone, leg, month, day));
    days.push({ index: i, month, day, weekday, driving, legs });
  }
  return { commute, days };
}

// ---------------------------------------------------------------------------
// Seasons: runs of glare days, per leg.

export interface Season {
  legIndex: number;
  /**
   * Day indexes (inclusive) of the first and last driving day with glare. When
   * a winter season runs across New Year, `wraps` is true and startIndex (in
   * the autumn) is greater than endIndex (in the new year's winter).
   */
  startIndex: number;
  endIndex: number;
  wraps: boolean;
  /** Driving days in this run with any glare. */
  drivingDays: number;
  /** All calendar days in the run with glare at the departure time (driving or not). */
  calendarDays: number;
  peakLevel: GlareLevel;
  /** Day index of the worst morning/evening in the run. */
  worstIndex: number;
  /** Longest glare exposure on one drive in the run, minutes. */
  maxMinutes: number;
  /** Median glare minutes across driving days in the run. */
  typicalMinutes: number;
}

/**
 * Group glare days into seasons. Days with glare on the same leg belong to one
 * season while the gap between them is at most `maxGap` calendar days, which
 * bridges weekends and the odd edge day without merging spring and autumn.
 */
export function findSeasons(scan: YearScan, maxGap = 6): Season[] {
  const seasons: Season[] = [];
  scan.commute.legs.forEach((_, legIndex) => {
    let current: { days: DayResult[]; start: number; end: number } | null = null;
    const flush = () => {
      if (!current) return;
      const driving = current.days.filter((d) => d.driving);
      if (driving.length > 0) {
        let worst = driving[0];
        for (const d of driving) {
          const a = d.legs[legIndex];
          const w = worst.legs[legIndex];
          if (a.peakLevel > w.peakLevel || (a.peakLevel === w.peakLevel && a.glareMinutes > w.glareMinutes)) worst = d;
        }
        const minutes = driving.map((d) => d.legs[legIndex].glareMinutes).sort((a, b) => a - b);
        seasons.push({
          legIndex,
          startIndex: driving[0].index,
          endIndex: driving[driving.length - 1].index,
          wraps: false,
          drivingDays: driving.length,
          calendarDays: current.days.length,
          peakLevel: Math.max(...driving.map((d) => d.legs[legIndex].peakLevel)) as GlareLevel,
          worstIndex: worst.index,
          maxMinutes: minutes[minutes.length - 1],
          typicalMinutes: minutes[Math.floor((minutes.length - 1) / 2)],
        });
      }
      current = null;
    };
    const n = scan.days.length;
    // Start the walk just after a clear stretch, so a winter season that runs
    // across New Year is found as one season rather than two halves.
    let origin = 0;
    for (let i = n - 1, run = 0; i >= 0; i--) {
      run = scan.days[i].legs[legIndex].glareMinutes === 0 ? run + 1 : 0;
      if (run > maxGap) {
        origin = (i + run) % n;
        break;
      }
    }
    for (let k = 0; k < n; k++) {
      const d = scan.days[(origin + k) % n];
      if (d.legs[legIndex].glareMinutes === 0) continue;
      const pos = k; // position along the walk
      if (current && pos - current.end > maxGap) flush();
      if (!current) current = { days: [], start: pos, end: pos };
      current.days.push(d);
      current.end = pos;
    }
    flush();
  });
  for (const s of seasons) s.wraps = s.startIndex > s.endIndex;
  return seasons.sort((a, b) => a.startIndex - b.startIndex || a.legIndex - b.legIndex);
}

/** Day indexes covered by a season, in calendar order along the season (handles wrap). */
export function seasonDays(season: Season, daysInYearCount: number): number[] {
  const out: number[] = [];
  for (let i = season.startIndex; ; i = (i + 1) % daysInYearCount) {
    out.push(i);
    if (i === season.endIndex) break;
  }
  return out;
}

// ---------------------------------------------------------------------------
// The planner: how little do you need to move your departure?

export interface ShiftAdvice {
  /** Leave this many minutes earlier to avoid all glare (null if not within the search window). */
  earlier: number | null;
  /** Leave this many minutes later to avoid all glare (null if not within the search window). */
  later: number | null;
}

export function bestShift(
  commute: Commute,
  legIndex: number,
  month: number,
  day: number,
  maxShift = 60,
  zone: ZoneYear = new ZoneYear(commute.year, commute.timeZone),
): ShiftAdvice {
  const leg = commute.legs[legIndex];
  const clear = (shift: number) => scanLegDay(commute, zone, leg, month, day, shift).glareMinutes === 0;
  let earlier: number | null = null;
  let later: number | null = null;
  for (let s = 1; s <= maxShift && (earlier === null || later === null); s++) {
    if (earlier === null && clear(-s)) earlier = s;
    if (later === null && clear(s)) later = s;
  }
  return { earlier, later };
}

/**
 * One departure-time recommendation for a whole season: the smallest shift in
 * one direction that clears every driving day in the season.
 */
export function seasonShift(commute: Commute, scan: YearScan, season: Season, maxShift = 60): ShiftAdvice {
  const zone = new ZoneYear(commute.year, commute.timeZone);
  let earlier: number | null = 0;
  let later: number | null = 0;
  for (const i of seasonDays(season, scan.days.length)) {
    const d = scan.days[i];
    if (!d.driving || d.legs[season.legIndex].glareMinutes === 0) continue;
    const a = bestShift(commute, season.legIndex, d.month, d.day, maxShift, zone);
    earlier = earlier === null || a.earlier === null ? null : Math.max(earlier, a.earlier);
    later = later === null || a.later === null ? null : Math.max(later, a.later);
  }
  return { earlier, later };
}

// ---------------------------------------------------------------------------
// Headline numbers.

export interface Summary {
  /** Driving days with glare on each leg. */
  perLeg: number[];
  /** Distinct driving days with glare on any leg. */
  totalDays: number;
  /** Total glare minutes behind the wheel across the year. */
  totalMinutes: number;
  worst: { index: number; legIndex: number } | null;
}

export function summarize(scan: YearScan): Summary {
  const perLeg = scan.commute.legs.map(() => 0);
  let totalDays = 0;
  let totalMinutes = 0;
  let worst: Summary['worst'] = null;
  let worstKey = -1;
  for (const d of scan.days) {
    if (!d.driving) continue;
    let any = false;
    d.legs.forEach((l, i) => {
      if (l.glareMinutes > 0) {
        perLeg[i]++;
        any = true;
        totalMinutes += l.glareMinutes;
        const key = l.peakLevel * 1000 + l.glareMinutes;
        if (key > worstKey) {
          worstKey = key;
          worst = { index: d.index, legIndex: i };
        }
      }
    });
    if (any) totalDays++;
  }
  return { perLeg, totalDays, totalMinutes, worst };
}
