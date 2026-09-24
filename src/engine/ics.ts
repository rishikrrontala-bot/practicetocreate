/**
 * iCalendar (RFC 5545) export: one event per glare drive, with an alarm.
 *
 * The file is built entirely on the device and handed to the user as a
 * download; importing it into Apple Calendar, Google Calendar or Outlook puts
 * each glare drive on the calendar they already use, with a reminder far
 * enough ahead to leave earlier.
 */

export interface IcsEvent {
  uid: string;
  /** UTC instants, ms. */
  start: number;
  end: number;
  summary: string;
  description: string;
  /** Minutes before the start to alert; omit for no alarm. */
  alarmMinutes?: number;
}

/** Escape TEXT values: backslash, semicolon, comma and newlines (RFC 5545 §3.3.11). */
export function escapeText(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}

/** 20260204T122500Z */
export function formatUtc(ms: number): string {
  const d = new Date(ms);
  const p = (n: number, w = 2) => String(n).padStart(w, '0');
  return (
    `${p(d.getUTCFullYear(), 4)}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}` +
    `T${p(d.getUTCHours())}${p(d.getUTCMinutes())}${p(d.getUTCSeconds())}Z`
  );
}

/**
 * Fold a content line to at most 75 octets per physical line (RFC 5545 §3.1),
 * never splitting a UTF-8 multi-byte character.
 */
export function foldLine(line: string): string {
  const encoder = new TextEncoder();
  if (encoder.encode(line).length <= 75) return line;
  const out: string[] = [];
  let current = '';
  let currentBytes = 0;
  let limit = 75;
  for (const ch of line) {
    const b = encoder.encode(ch).length;
    if (currentBytes + b > limit) {
      out.push(current);
      current = '';
      currentBytes = 0;
      limit = 74; // continuation lines start with a space
    }
    current += ch;
    currentBytes += b;
  }
  if (current) out.push(current);
  return out.join('\r\n ');
}

export function buildCalendar(events: IcsEvent[], stamp: number, name = 'Low Sun glare drives'): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Rishik Rontala//Low Sun//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeText(name)}`,
  ];
  for (const e of events) {
    lines.push(
      'BEGIN:VEVENT',
      `UID:${e.uid}`,
      `DTSTAMP:${formatUtc(stamp)}`,
      `DTSTART:${formatUtc(e.start)}`,
      `DTEND:${formatUtc(e.end)}`,
      `SUMMARY:${escapeText(e.summary)}`,
      `DESCRIPTION:${escapeText(e.description)}`,
      'TRANSP:TRANSPARENT',
    );
    if (e.alarmMinutes !== undefined && e.alarmMinutes > 0) {
      lines.push(
        'BEGIN:VALARM',
        'ACTION:DISPLAY',
        `DESCRIPTION:${escapeText(e.summary)}`,
        `TRIGGER:-PT${Math.round(e.alarmMinutes)}M`,
        'END:VALARM',
      );
    }
    lines.push('END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return lines.map(foldLine).join('\r\n') + '\r\n';
}
