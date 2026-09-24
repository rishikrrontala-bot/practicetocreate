import { describe, expect, it } from 'vitest';
import { buildCalendar, escapeText, foldLine, formatUtc } from '../src/engine/ics';

describe('iCalendar export', () => {
  const ics = buildCalendar(
    [
      {
        uid: 'lowsun-2026-03-16-out@rishikrrontala-bot.github.io',
        start: Date.UTC(2026, 2, 16, 14, 15),
        end: Date.UTC(2026, 2, 16, 14, 40),
        summary: 'Low sun: eastbound drive, 7:15–7:40 AM',
        description: 'Sun 9° up, 3° left of straight ahead at 7:31; leave 17 min later to miss it.',
        alarmMinutes: 60,
      },
    ],
    Date.UTC(2026, 8, 24, 3, 0),
  );

  it('uses CRLF line endings and wraps the calendar', () => {
    expect(ics.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true);
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
    expect(ics.replace(/\r\n/g, '')).not.toMatch(/\n/);
  });

  it('writes UTC timestamps', () => {
    expect(formatUtc(Date.UTC(2026, 1, 4, 12, 25))).toBe('20260204T122500Z');
    expect(ics).toContain('DTSTART:20260316T141500Z');
    expect(ics).toContain('DTEND:20260316T144000Z');
  });

  it('includes a display alarm ahead of the drive', () => {
    expect(ics).toContain('BEGIN:VALARM');
    expect(ics).toContain('TRIGGER:-PT60M');
  });

  it('escapes commas, semicolons and newlines', () => {
    expect(escapeText('a, b; c\nd\\e')).toBe('a\\, b\\; c\\nd\\\\e');
    expect(ics).toContain('SUMMARY:Low sun: eastbound drive\\, 7:15–7:40 AM');
  });

  it('folds long lines at 75 octets without splitting multi-byte characters', () => {
    const long = 'DESCRIPTION:' + '°'.repeat(60);
    const folded = foldLine(long);
    for (const line of folded.split('\r\n')) expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
    expect(folded.replace(/\r\n /g, '')).toBe(long);
    for (const line of ics.split('\r\n')) expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
  });

  it('gives every event the required properties', () => {
    for (const key of ['UID:', 'DTSTAMP:', 'DTSTART:', 'DTEND:', 'SUMMARY:']) expect(ics).toContain(key);
  });
});
