/**
 * Glare geometry: when is a low sun "in the driver's eyes"?
 *
 * The sun counts as glare for a driver facing `heading` when all hold:
 *   1. it is above the horizon (apparent centre elevation >= 0°);
 *   2. it is no higher than `maxElevation` above the horizon (default 25°);
 *   3. it is within `maxOffset` of the direction of travel, left or right (default 25°).
 * Conditions 2 and 3 are the ~25° horizontal and vertical angles used in the
 * sun-glare road-safety literature (see docs/ARCHITECTURE.md › Glare model).
 *
 * That box is the outer "dazzle" zone. Inside it, severity uses the angle θ
 * between the sun and the driver's horizontal line of sight. Disability
 * (veiling) glare falls off roughly with 1/θ² (the Stiles–Holladay relation),
 * so θ ≤ 15° ("glare", counted by default) and θ ≤ 8° ("blinding") mark about
 * 3× and 10× the veiling glare of a sun at the 25° edge.
 */

import { mod } from './solar';

const RAD = Math.PI / 180;
const DEG = 180 / Math.PI;

export interface GlareLimits {
  /** Highest sun elevation, in degrees, of the outer glare zone. */
  maxElevation: number;
  /** Widest horizontal angle off the direction of travel, in degrees, of the outer glare zone. */
  maxOffset: number;
  /**
   * The weakest level that counts as "the sun in your eyes" for the calendar,
   * the seasons and the planner: 1 = anywhere in the 25° zone, 2 = within 15°
   * of your line of sight (default), 3 = within 8°.
   */
  minLevel: 1 | 2 | 3;
}

export const DEFAULT_LIMITS: GlareLimits = { maxElevation: 25, maxOffset: 25, minLevel: 2 };

/** 0 none · 1 dazzle (outer zone) · 2 glare (θ ≤ 15°) · 3 blinding (θ ≤ 8°) */
export type GlareLevel = 0 | 1 | 2 | 3;

export const LEVEL_NAMES: Record<GlareLevel, string> = {
  0: 'Clear',
  1: 'Dazzle',
  2: 'Glare',
  3: 'Blinding',
};

/** Line-of-sight angle, in degrees, at or inside which each level starts. */
export const LEVEL_ANGLES: Record<1 | 2 | 3, number> = { 1: 25, 2: 15, 3: 8 };

/** θ thresholds (degrees) for the severe and blinding bands. */
export const SEVERE_ANGLE = 15;
export const BLINDING_ANGLE = 8;

/** Signed angle from the direction of travel to the sun, in (-180, 180]. Negative = left. */
export function relativeAzimuth(sunAzimuth: number, heading: number): number {
  const d = mod(sunAzimuth - heading + 180, 360) - 180;
  return d === -180 ? 180 : d;
}

/** Angle in degrees between the sun and the driver's horizontal line of sight. */
export function lineOfSightAngle(elevation: number, relAzimuth: number): number {
  const c = Math.cos(elevation * RAD) * Math.cos(relAzimuth * RAD);
  return Math.acos(Math.max(-1, Math.min(1, c))) * DEG;
}

export interface GlareReading {
  level: GlareLevel;
  /** Angle between sun and line of sight, degrees. */
  angle: number;
  /** Signed horizontal offset from the direction of travel, degrees (negative = left). */
  offset: number;
  elevation: number;
}

export function glareLevel(
  sunAzimuth: number,
  sunElevation: number,
  heading: number,
  limits: GlareLimits = DEFAULT_LIMITS,
): GlareLevel {
  if (sunElevation < 0 || sunElevation > limits.maxElevation) return 0;
  const off = relativeAzimuth(sunAzimuth, heading);
  if (Math.abs(off) > limits.maxOffset) return 0;
  const theta = lineOfSightAngle(sunElevation, off);
  if (theta <= BLINDING_ANGLE) return 3;
  if (theta <= SEVERE_ANGLE) return 2;
  return 1;
}

export function glareReading(
  sunAzimuth: number,
  sunElevation: number,
  heading: number,
  limits: GlareLimits = DEFAULT_LIMITS,
): GlareReading {
  const offset = relativeAzimuth(sunAzimuth, heading);
  return {
    level: glareLevel(sunAzimuth, sunElevation, heading, limits),
    angle: lineOfSightAngle(sunElevation, offset),
    offset,
    elevation: sunElevation,
  };
}

/** Compass words for a heading: 0 → "north", 112.5 → "east-southeast". */
export function compassWord(heading: number): string {
  const words = [
    'north', 'north-northeast', 'northeast', 'east-northeast',
    'east', 'east-southeast', 'southeast', 'south-southeast',
    'south', 'south-southwest', 'southwest', 'west-southwest',
    'west', 'west-northwest', 'northwest', 'north-northwest',
  ];
  return words[Math.round(mod(heading, 360) / 22.5) % 16];
}

/** Short cardinal form for a heading: "E", "ESE". */
export function compassAbbrev(heading: number): string {
  const abbr = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  return abbr[Math.round(mod(heading, 360) / 22.5) % 16];
}

/** "eastbound" style word for the four main directions, else "heading 112°". */
export function travelWord(heading: number): string {
  const h = mod(heading, 360);
  const near = (a: number) => Math.abs(relativeAzimuth(h, a)) <= 22.5;
  if (near(0)) return 'northbound';
  if (near(90)) return 'eastbound';
  if (near(180)) return 'southbound';
  if (near(270)) return 'westbound';
  return `heading ${Math.round(h)}°`;
}
