/**
 * "Henge" finder: the dates the rising or setting sun lines up with a street.
 *
 * Manhattanhenge is the famous case: twice a year the setting sun sits exactly
 * at the end of Manhattan's cross streets. Every straight street has its own
 * alignment days. They're beautiful from the sidewalk and blinding from the
 * driver's seat, so the same geometry doubles as a public check of this engine
 * against a published answer.
 *
 * Method (as the Hayden Planetarium describes its own calculation): walk every
 * day of the year; find the moment the sun's azimuth reaches the street's
 * bearing (299.1° for Manhattan); read the sun's altitude at that moment; keep
 * the days when that altitude is closest to the published targets, 0.5° for
 * "full sun" (the disc's lower edge on the New Jersey horizon) and 0.25° for
 * "half sun".
 */

import { sunPosition } from './solar';
import { relativeAzimuth } from './glare';
import { ZoneYear, dateOfDayIndex, daysInYear } from './time';

const MINUTE = 60_000;

/** Semi-diameter of the sun's disc, degrees (mean). */
export const SUN_RADIUS = 0.266;

export interface HengeEvent {
  event: 'sunrise' | 'sunset';
  month: number;
  day: number;
  /** Local minute of day at which the sun reaches the street's bearing. */
  minute: number;
  /** Sun altitude at that moment, degrees. */
  altitude: number;
  /** How far the altitude is from the target on this, the closest, day. */
  miss: number;
}

/**
 * The instant on a local date when the sun's azimuth reaches `azimuth`,
 * searching the morning (sunrise side) or the afternoon (sunset side).
 * Returns null if the sun never points that way on that half of the day.
 */
export function azimuthCrossing(
  lat: number,
  lon: number,
  zone: ZoneYear,
  month: number,
  day: number,
  azimuth: number,
  side: 'sunrise' | 'sunset',
): number | null {
  const from = zone.toUtc(month, day, side === 'sunrise' ? 0 : 12 * 60);
  const to = zone.toUtc(month, day, side === 'sunrise' ? 12 * 60 : 24 * 60);
  const f = (t: number) => relativeAzimuth(sunPosition(t, lat, lon).azimuth, azimuth);
  const step = 5 * MINUTE;
  let a = from;
  let fa = f(a);
  for (let b = from + step; b <= to; b += step) {
    const fb = f(b);
    // The azimuth sweeps clockwise through the day, so look for - → +, near the target.
    if (fa < 0 && fb >= 0 && fb - fa < 90) {
      let lo = a;
      let hi = b;
      while (hi - lo > 500) {
        const m = (lo + hi) / 2;
        if (f(m) < 0) lo = m;
        else hi = m;
      }
      return (lo + hi) / 2;
    }
    a = b;
    fa = fb;
  }
  return null;
}

/**
 * Dates in `year` when the sun stands at `altitude` degrees just as it reaches
 * the street bearing `azimuth` (so it hangs exactly at the end of the street).
 */
export function findHenges(
  lat: number,
  lon: number,
  timeZone: string,
  year: number,
  azimuth: number,
  altitude: number,
  event: 'sunrise' | 'sunset' = 'sunset',
): HengeEvent[] {
  const zone = new ZoneYear(year, timeZone);
  const n = daysInYear(year);
  const samples: { i: number; t: number; alt: number }[] = [];
  for (let i = 0; i < n; i++) {
    const { month, day } = dateOfDayIndex(year, i);
    const t = azimuthCrossing(lat, lon, zone, month, day, azimuth, event);
    if (t === null) continue;
    samples.push({ i, t, alt: sunPosition(t, lat, lon).elevation });
  }
  const events: HengeEvent[] = [];
  for (let k = 1; k < samples.length; k++) {
    const p = samples[k - 1];
    const q = samples[k];
    if (q.i !== p.i + 1) continue;
    const dp = p.alt - altitude;
    const dq = q.alt - altitude;
    if (dp === 0 || dp * dq < 0) {
      // Only alignments near the horizon count (not the sun passing the bearing high in the sky).
      if (Math.abs(dp) > 3 || Math.abs(dq) > 3) continue;
      const best = Math.abs(dp) <= Math.abs(dq) ? p : q;
      const { month, day } = dateOfDayIndex(year, best.i);
      const local = best.t / MINUTE + zone.offsetAt(best.t);
      events.push({
        event,
        month,
        day,
        minute: ((local % 1440) + 1440) % 1440,
        altitude: best.alt,
        miss: Math.abs(best.alt - altitude),
      });
    }
  }
  return events;
}

/** The published Manhattanhenge parameters (Hayden Planetarium, AMNH). */
export const MANHATTAN = {
  lat: 40.7527, // 42nd St at Fifth Ave
  lon: -73.9818,
  timeZone: 'America/New_York',
  gridAzimuth: 299.1,
  fullAltitude: 0.5,
  halfAltitude: 0.25,
} as const;

/** AMNH's published 2026 dates and times (EDT), for the in-page proof and the tests. */
export const AMNH_2026 = [
  { kind: 'full', month: 5, day: 29, minute: 20 * 60 + 13 },
  { kind: 'half', month: 5, day: 28, minute: 20 * 60 + 14 },
  { kind: 'full', month: 7, day: 11, minute: 20 * 60 + 20 },
  { kind: 'half', month: 7, day: 12, minute: 20 * 60 + 21 },
] as const;
