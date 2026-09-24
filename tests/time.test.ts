import { describe, expect, it } from 'vitest';
import {
  ZoneYear,
  dateOfDayIndex,
  dayIndexOf,
  daysInYear,
  formatClock,
  isValidTimeZone,
  offsetMinutes,
  parseClock,
  wallClock,
  zonedToUtc,
} from '../src/engine/time';

describe('time zones', () => {
  it('reads offsets on both sides of US daylight saving (2026: Mar 8 and Nov 1)', () => {
    expect(offsetMinutes(Date.UTC(2026, 2, 7, 12), 'America/New_York')).toBe(-300);
    expect(offsetMinutes(Date.UTC(2026, 2, 9, 12), 'America/New_York')).toBe(-240);
    expect(offsetMinutes(Date.UTC(2026, 10, 2, 12), 'America/New_York')).toBe(-300);
  });

  it('keeps Arizona on standard time all year', () => {
    expect(offsetMinutes(Date.UTC(2026, 0, 15), 'America/Phoenix')).toBe(-420);
    expect(offsetMinutes(Date.UTC(2026, 6, 15), 'America/Phoenix')).toBe(-420);
    expect(new ZoneYear(2026, 'America/Phoenix').transitions).toHaveLength(0);
  });

  it('maps a 7:25 departure to the right UTC instant before and after the clocks change', () => {
    expect(zonedToUtc(2026, 3, 6, 7 * 60 + 25, 'America/New_York')).toBe(Date.UTC(2026, 2, 6, 12, 25));
    expect(zonedToUtc(2026, 3, 9, 7 * 60 + 25, 'America/New_York')).toBe(Date.UTC(2026, 2, 9, 11, 25));
  });

  it('finds the exact DST transitions of a year', () => {
    const z = new ZoneYear(2026, 'America/New_York');
    expect(z.transitions.map((t) => new Date(t.at).toISOString())).toEqual([
      '2026-03-08T07:00:00.000Z',
      '2026-11-01T06:00:00.000Z',
    ]);
  });

  it('handles southern-hemisphere daylight saving (Sydney)', () => {
    const z = new ZoneYear(2026, 'Australia/Sydney');
    expect(z.transitions).toHaveLength(2);
    expect(z.offsetAt(Date.UTC(2026, 0, 10))).toBe(660);
    expect(z.offsetAt(Date.UTC(2026, 6, 10))).toBe(600);
  });

  it('agrees with the slow path on every day of the year', () => {
    for (const tz of ['America/New_York', 'America/Phoenix', 'Europe/London', 'Australia/Sydney', 'Asia/Kolkata']) {
      const z = new ZoneYear(2026, tz);
      for (let i = 0; i < 365; i += 7) {
        const { month, day } = dateOfDayIndex(2026, i);
        for (const minute of [5 * 60, 7 * 60 + 25, 17 * 60 + 40]) {
          expect(z.toUtc(month, day, minute)).toBe(zonedToUtc(2026, month, day, minute, tz));
        }
      }
    }
  });

  it('round-trips wall clock readings', () => {
    const t = zonedToUtc(2026, 7, 4, 18 * 60 + 5, 'America/Chicago');
    expect(wallClock(t, 'America/Chicago')).toMatchObject({ year: 2026, month: 7, day: 4, hour: 18, minute: 5 });
  });

  it('validates zone names', () => {
    expect(isValidTimeZone('America/Denver')).toBe(true);
    expect(isValidTimeZone('Mars/Olympus_Mons')).toBe(false);
  });
});

describe('calendar helpers', () => {
  it('counts leap years', () => {
    expect(daysInYear(2026)).toBe(365);
    expect(daysInYear(2028)).toBe(366);
  });

  it('converts day indexes both ways', () => {
    expect(dateOfDayIndex(2026, 0)).toMatchObject({ month: 1, day: 1, weekday: 4 });
    expect(dateOfDayIndex(2026, 364)).toMatchObject({ month: 12, day: 31 });
    expect(dayIndexOf(2026, 5, 29)).toBe(148);
  });
});

describe('clock text', () => {
  it('formats minutes of the day', () => {
    expect(formatClock(445)).toBe('7:25 AM');
    expect(formatClock(0)).toBe('12:00 AM');
    expect(formatClock(12 * 60)).toBe('12:00 PM');
    expect(formatClock(20 * 60 + 13)).toBe('8:13 PM');
    expect(formatClock(445, '24h')).toBe('07:25');
  });

  it('parses the ways people type times', () => {
    expect(parseClock('7:25')).toBe(445);
    expect(parseClock('07:25')).toBe(445);
    expect(parseClock('7:25 pm')).toBe(19 * 60 + 25);
    expect(parseClock('12:05 a.m.')).toBe(5);
    expect(parseClock('19:25')).toBe(19 * 60 + 25);
    expect(parseClock('25:00')).toBeNull();
    expect(parseClock('7:61')).toBeNull();
    expect(parseClock('13:00 pm')).toBeNull();
    expect(parseClock('soon')).toBeNull();
  });
});
