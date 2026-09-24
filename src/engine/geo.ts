/**
 * Directions on the Earth: the bearing of a street from two points on it, and
 * the correction from a phone's magnetic compass to true north.
 */

import { mod } from './solar';

const RAD = Math.PI / 180;
const DEG = 180 / Math.PI;

/** Initial great-circle bearing from point A to point B, degrees clockwise from true north. */
export function bearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const p1 = lat1 * RAD;
  const p2 = lat2 * RAD;
  const dl = (lon2 - lon1) * RAD;
  const y = Math.sin(dl) * Math.cos(p2);
  const x = Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(dl);
  return mod(Math.atan2(y, x) * DEG, 360);
}

/** Great-circle distance in metres (haversine, mean Earth radius). */
export function distance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6_371_008.8;
  const dp = (lat2 - lat1) * RAD;
  const dl = (lon2 - lon1) * RAD;
  const a = Math.sin(dp / 2) ** 2 + Math.cos(lat1 * RAD) * Math.cos(lat2 * RAD) * Math.sin(dl / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}

/** True heading from a magnetic compass heading and the local declination (east positive). */
export function magneticToTrue(magneticHeading: number, declination: number): number {
  return mod(magneticHeading + declination, 360);
}

/**
 * Parse a coordinate pair typed or pasted by a person:
 *   "40.7527, -73.9818"   "40.7527 -73.9818"   "40°45'10\"N 73°58'54\"W"
 *   a Google Maps URL containing "@40.7527,-73.9818" or "?q=40.75,-73.98"
 */
export function parseCoordinates(text: string): { lat: number; lon: number } | null {
  const t = text.trim();
  const at = t.match(/@(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/) ?? t.match(/[?&](?:q|ll|query)=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/);
  if (at) return valid(Number(at[1]), Number(at[2]));

  const dms = [...t.matchAll(/(\d+(?:\.\d+)?)\s*°\s*(?:(\d+(?:\.\d+)?)\s*['′]\s*)?(?:(\d+(?:\.\d+)?)\s*["″]\s*)?([NSEW])/gi)];
  if (dms.length === 2) {
    const toDeg = (m: RegExpMatchArray) => {
      const v = Number(m[1]) + Number(m[2] ?? 0) / 60 + Number(m[3] ?? 0) / 3600;
      return /[SW]/i.test(m[4]) ? -v : v;
    };
    const a = dms[0];
    const b = dms[1];
    const aIsLat = /[NS]/i.test(a[4]);
    return valid(toDeg(aIsLat ? a : b), toDeg(aIsLat ? b : a));
  }

  const plain = t.match(/^(-?\d+(?:\.\d+)?)\s*[,\s]\s*(-?\d+(?:\.\d+)?)$/);
  if (plain) return valid(Number(plain[1]), Number(plain[2]));
  return null;
}

function valid(lat: number, lon: number): { lat: number; lon: number } | null {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;
  return { lat, lon };
}

/** "40.7527° N, 73.9818° W" */
export function formatCoordinates(lat: number, lon: number, digits = 4): string {
  const ns = lat >= 0 ? 'N' : 'S';
  const ew = lon >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(digits)}° ${ns}, ${Math.abs(lon).toFixed(digits)}° ${ew}`;
}
