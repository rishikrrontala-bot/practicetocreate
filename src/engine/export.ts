/**
 * Turn a year scan into calendar events: one per driving day with glare, per
 * drive, from `fromIndex` onward (past days are useless in a calendar).
 */

import type { IcsEvent } from './ics';
import type { Season, ShiftAdvice, YearScan } from './scan';
import { seasonDays } from './scan';
import type { AppState } from './state';
import { ZoneYear, formatClock } from './time';
import { legName, shiftAdvice, sunPlacement } from './words';
import { travelWord } from './glare';

const MINUTE = 60_000;

export function glareEvents(
  state: AppState,
  scan: YearScan,
  seasons: Season[],
  shifts: ShiftAdvice[],
  fromIndex: number,
  alarmMinutes = 60,
): IcsEvent[] {
  const zone = new ZoneYear(state.year, state.timeZone);
  // Advice per day comes from its season.
  const adviceByDay = new Map<string, string | null>();
  seasons.forEach((s, k) => {
    for (const i of seasonDays(s, scan.days.length)) adviceByDay.set(`${i}:${s.legIndex}`, shiftAdvice(shifts[k]));
  });
  const events: IcsEvent[] = [];
  for (const d of scan.days) {
    if (d.index < fromIndex || !d.driving) continue;
    d.legs.forEach((l, legIndex) => {
      if (l.glareMinutes === 0) return;
      const which = legName(state, legIndex);
      const leg = which === 'morning' ? state.out : state.back;
      const start = zone.toUtc(d.month, d.day, leg.depart);
      const dir = travelWord(leg.heading);
      const iso = `${state.year}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`;
      const advice = adviceByDay.get(`${d.index}:${legIndex}`);
      const lines = [
        `Low sun on your ${which} drive (${dir}, leaving ${formatClock(leg.depart)}).`,
        `${l.glareMinutes} min with the sun in your eyes, worst at ${formatClock(leg.depart + l.peakMinute)}: sun ${sunPlacement(l.peakElevation, l.peakOffset)}.`,
      ];
      if (advice) lines.push(`${advice} to miss it this season.`);
      lines.push('Computed by Low Sun for a clear sky. Buildings, trees and hills may hide it.');
      events.push({
        uid: `lowsun-${iso}-${which}-${Math.round(leg.heading)}@rishikrrontala-bot.github.io`,
        start,
        end: start + leg.duration * MINUTE,
        summary: `Low sun: ${which} drive, ${dir}`,
        description: lines.join('\n'),
        alarmMinutes,
      });
    });
  }
  return events;
}
