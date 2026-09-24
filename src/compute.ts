/**
 * Everything the page shows, computed from one AppState. Runs in the Web Worker
 * (src/worker.ts); the same function is called directly when workers are
 * unavailable, so the page never depends on them.
 */

import { findHenges, SUN_RADIUS, type HengeEvent } from './engine/henge';
import {
  findSeasons,
  glareGrid,
  scanYear,
  seasonShift,
  summarize,
  sunGrid,
  type Season,
  type ShiftAdvice,
  type Summary,
  type SunGrid,
  type YearScan,
} from './engine/scan';
import { toCommute, type AppState } from './engine/state';

export interface Result {
  gridKey: string;
  grid: SunGrid;
  glare: Uint8Array;
  scan: YearScan;
  seasons: Season[];
  shifts: ShiftAdvice[];
  summary: Summary;
  /** Sunrise alignments for the morning heading and sunset alignments for the evening heading. */
  henges: { morning: HengeEvent[]; evening: HengeEvent[] };
  ms: number;
}

let cachedGrid: { key: string; grid: SunGrid } | null = null;

export function gridKey(s: AppState): string {
  return `${s.lat.toFixed(4)},${s.lon.toFixed(4)},${s.timeZone},${s.year}`;
}

export function compute(state: AppState): Result {
  const t0 = performance.now();
  const key = gridKey(state);
  if (!cachedGrid || cachedGrid.key !== key) {
    cachedGrid = { key, grid: sunGrid(state.lat, state.lon, state.timeZone, state.year, 5) };
  }
  const grid = cachedGrid.grid;
  const headings: number[] = [];
  if (state.out.enabled) headings.push(state.out.heading);
  if (state.back.enabled) headings.push(state.back.heading);
  const glare = glareGrid(grid, headings, state.limits);

  const commute = toCommute(state);
  const scan = scanYear(commute);
  const seasons = findSeasons(scan);
  const shifts = seasons.map((s) => seasonShift(commute, scan, s, 60));
  const summary = summarize(scan);

  // A street's own "henge": the full disc sitting on a flat horizon at the end of the road.
  const alt = SUN_RADIUS + 0.2;
  const henges = {
    morning: state.out.enabled ? findHenges(state.lat, state.lon, state.timeZone, state.year, state.out.heading, alt, 'sunrise') : [],
    evening: state.back.enabled ? findHenges(state.lat, state.lon, state.timeZone, state.year, state.back.heading, alt, 'sunset') : [],
  };

  return { gridKey: key, grid, glare, scan, seasons, shifts, summary, henges, ms: performance.now() - t0 };
}
