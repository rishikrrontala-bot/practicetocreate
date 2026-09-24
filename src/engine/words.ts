/**
 * Every sentence Low Sun says about a commute is built here from computed
 * numbers, never from canned copy, so the words can't claim what the maths
 * didn't find. Pure and unit-tested.
 */

import { LEVEL_NAMES, relativeAzimuth, travelWord, type GlareLevel } from './glare';
import type { AppState } from './state';
import type { DayResult, Season, ShiftAdvice, Summary, YearScan } from './scan';
import { dateOfDayIndex, formatClock, formatDate, monthName, weekdayName } from './time';

export function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}

/** "Feb 18 – Apr 10", "Sep 3 – 25", "Oct 12 – Mar 3" */
export function formatRange(year: number, startIndex: number, endIndex: number): string {
  const a = dateOfDayIndex(year, startIndex);
  const b = dateOfDayIndex(year, endIndex);
  if (startIndex === endIndex) return formatDate(a.month, a.day);
  if (a.month === b.month && startIndex < endIndex) return `${monthName(a.month)} ${a.day} – ${b.day}`;
  return `${formatDate(a.month, a.day)} – ${formatDate(b.month, b.day)}`;
}

export function legName(state: AppState, legIndex: number): 'morning' | 'evening' {
  const enabled = [state.out.enabled, state.back.enabled];
  // Leg indexes count only enabled legs: if the morning leg is off, index 0 is the evening.
  if (!enabled[0]) return 'evening';
  return legIndex === 0 ? 'morning' : 'evening';
}

export function legHeading(state: AppState, legIndex: number): number {
  return legName(state, legIndex) === 'morning' ? state.out.heading : state.back.heading;
}

export interface Verdict {
  /** The headline sentence. */
  headline: string;
  /** The number the headline is about (for emphasis in the UI). */
  count: number;
  /** One line per leg with its seasons. */
  lines: string[];
}

export function verdict(state: AppState, summary: Summary, seasons: Season[]): Verdict {
  const count = summary.totalDays;
  const year = state.year;
  const legs = [state.out.enabled, state.back.enabled].filter(Boolean).length;
  if (legs === 0) {
    return { headline: 'Add a drive to see its glare calendar.', count: 0, lines: [] };
  }
  const headline =
    count === 0
      ? `Your drive stays out of the low sun all of ${year}.`
      : `In ${year} you’ll drive into a low sun on ${plural(count, 'day')}.`;

  const lines: string[] = [];
  const legCount = summary.perLeg.length;
  for (let i = 0; i < legCount; i++) {
    const name = legName(state, i);
    const dir = travelWord(legHeading(state, i));
    const own = seasons.filter((s) => s.legIndex === i);
    const label = `${name === 'morning' ? 'Mornings' : 'Evenings'}, ${dir}`;
    if (own.length === 0) {
      lines.push(`${label}: clear all year.`);
    } else {
      const ranges = own.map((s) => formatRange(year, s.startIndex, s.endIndex));
      lines.push(`${label}: ${joinAnd(ranges)} (${plural(summary.perLeg[i], 'drive')}).`);
    }
  }
  return { headline, count, lines };
}

export function joinAnd(items: string[]): string {
  if (items.length <= 1) return items.join('');
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

/** "Leave 17 min later", "Leave 12 min earlier or 20 min later", or null. */
export function shiftAdvice(a: ShiftAdvice): string | null {
  const parts: string[] = [];
  if (a.earlier !== null && a.earlier > 0) parts.push(`${a.earlier} min earlier`);
  if (a.later !== null && a.later > 0) parts.push(`${a.later} min later`);
  if (parts.length === 0) return null;
  return `Leave ${parts.join(' or ')}`;
}

/** Where the sun is, in words: "9° up, 3° left of straight ahead". */
export function sunPlacement(elevation: number, offset: number): string {
  const up = `${Math.max(0, elevation).toFixed(0)}° up`;
  const side = Math.abs(offset) < 0.5 ? 'dead ahead' : `${Math.abs(offset).toFixed(0)}° ${offset < 0 ? 'left' : 'right'} of straight ahead`;
  return `${up}, ${side}`;
}

/**
 * The next glare drive on or after `todayIndex`, if any, in this scan's year.
 * With `nowMinute` and each leg's end time (minutes after midnight), drives that
 * have already finished today are skipped.
 */
export function nextGlare(
  scan: YearScan,
  todayIndex: number,
  nowMinute = -1,
  legEnds: number[] = [],
): { day: DayResult; legIndex: number } | null {
  for (let i = Math.max(0, todayIndex); i < scan.days.length; i++) {
    const d = scan.days[i];
    if (!d.driving) continue;
    const legIndex = d.legs.findIndex(
      (l, k) => l.glareMinutes > 0 && !(i === todayIndex && nowMinute >= 0 && legEnds[k] !== undefined && legEnds[k] <= nowMinute),
    );
    if (legIndex >= 0) return { day: d, legIndex };
  }
  return null;
}

export function dayLabel(d: { month: number; day: number; weekday: number }): string {
  return `${weekdayName(d.weekday)} ${formatDate(d.month, d.day)}`;
}

/** Summary line for one leg on one day, e.g. for the calendar event or a readout. */
export function legDayLine(
  state: AppState,
  legIndex: number,
  day: DayResult,
): string {
  const l = day.legs[legIndex];
  const depart = legName(state, legIndex) === 'morning' ? state.out.depart : state.back.depart;
  if (l.glareMinutes === 0) return `${dayLabel(day)}: clear.`;
  const at = formatClock(depart + l.peakMinute);
  return `${dayLabel(day)}: ${plural(l.glareMinutes, 'minute')} of ${LEVEL_NAMES[l.peakLevel as GlareLevel].toLowerCase()}, worst at ${at}, sun ${sunPlacement(l.peakElevation, l.peakOffset)}.`;
}

/** Which way to look for the sun, relative to the direction of travel. */
export function sideWord(sunAzimuth: number, heading: number): string {
  const off = relativeAzimuth(sunAzimuth, heading);
  if (Math.abs(off) <= 2) return 'straight ahead';
  if (Math.abs(off) >= 178) return 'straight behind';
  const side = off < 0 ? 'left' : 'right';
  if (Math.abs(off) < 90) return `ahead, ${Math.round(Math.abs(off))}° to the ${side}`;
  return `behind, to the ${side}`;
}
