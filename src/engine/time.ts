/**
 * Wall-clock time in an IANA time zone, without a date library.
 *
 * Commutes are defined in local clock time ("I leave at 7:25"), but the sun
 * runs on UTC. A driver's 7:25 is a different UTC instant before and after a
 * daylight-saving change, and Arizona never changes at all. Everything here is
 * derived from the platform's own tz database through Intl, so it is right for
 * every zone the browser knows.
 */

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const formatterCache = new Map<string, Intl.DateTimeFormat>();

function formatter(timeZone: string): Intl.DateTimeFormat {
  let f = formatterCache.get(timeZone);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
    });
    formatterCache.set(timeZone, f);
  }
  return f;
}

export interface WallClock {
  year: number;
  month: number; // 1-12
  day: number;
  hour: number;
  minute: number;
  second: number;
}

export function isValidTimeZone(timeZone: string): boolean {
  try {
    formatter(timeZone);
    return true;
  } catch {
    return false;
  }
}

/** The wall-clock reading in `timeZone` at the instant `ms`. */
export function wallClock(ms: number, timeZone: string): WallClock {
  const parts = formatter(timeZone).formatToParts(new Date(ms));
  const get = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour: get('hour') % 24,
    minute: get('minute'),
    second: get('second'),
  };
}

/** UTC offset of `timeZone` at instant `ms`, in minutes (New York in winter = -300). */
export function offsetMinutes(ms: number, timeZone: string): number {
  const w = wallClock(ms, timeZone);
  const asUtc = Date.UTC(w.year, w.month - 1, w.day, w.hour, w.minute, w.second);
  const floored = Math.floor(ms / 1000) * 1000;
  return Math.round((asUtc - floored) / MINUTE);
}

/**
 * The UTC instant at which the wall clock in `timeZone` reads the given local
 * time. In a spring-forward gap (a time that never happens) the result is the
 * instant the clock jumps past it; in a fall-back overlap the earlier of the two
 * instants is returned.
 */
export function zonedToUtc(
  year: number,
  month: number,
  day: number,
  minuteOfDay: number,
  timeZone: string,
): number {
  const naive = Date.UTC(year, month - 1, day) + minuteOfDay * MINUTE;
  const o1 = offsetMinutes(naive, timeZone);
  let t = naive - o1 * MINUTE;
  const o2 = offsetMinutes(t, timeZone);
  if (o2 !== o1) {
    const t2 = naive - o2 * MINUTE;
    // Prefer the candidate whose wall clock actually reads the requested time.
    t = offsetMinutes(t2, timeZone) === o2 ? t2 : t;
  }
  // Overlap: if an hour earlier also maps to the same wall time, take the earlier instant.
  const earlier = t - HOUR;
  if (offsetMinutes(earlier, timeZone) !== offsetMinutes(t, timeZone)) {
    const w = wallClock(earlier, timeZone);
    const wm = w.hour * 60 + w.minute;
    if (w.day === day && wm === minuteOfDay) return earlier;
  }
  return t;
}

/**
 * A fast offset lookup for one calendar year in one zone. Samples the offset
 * every six hours, then binary-searches each change to the minute, so a year
 * scan with hundreds of thousands of instants costs about 1,500 Intl calls.
 */
export class ZoneYear {
  readonly year: number;
  readonly timeZone: string;
  private readonly changes: { at: number; offset: number }[] = [];
  private readonly first: number;

  constructor(year: number, timeZone: string) {
    this.year = year;
    this.timeZone = timeZone;
    const start = Date.UTC(year, 0, 1) - 2 * DAY;
    const end = Date.UTC(year + 1, 0, 1) + 2 * DAY;
    const step = 6 * HOUR;
    this.first = offsetMinutes(start, timeZone);
    let prevT = start;
    let prevO = this.first;
    for (let t = start + step; t <= end; t += step) {
      const o = offsetMinutes(t, timeZone);
      if (o !== prevO) {
        let lo = prevT;
        let hi = t;
        while (hi - lo > MINUTE) {
          const mid = lo + Math.floor((hi - lo) / 2 / MINUTE) * MINUTE;
          if (offsetMinutes(mid, timeZone) === prevO) lo = mid;
          else hi = mid;
        }
        this.changes.push({ at: hi, offset: o });
        prevO = o;
      }
      prevT = t;
    }
  }

  /** Offset in minutes at instant `ms`. */
  offsetAt(ms: number): number {
    let o = this.first;
    for (const c of this.changes) {
      if (ms >= c.at) o = c.offset;
      else break;
    }
    return o;
  }

  /** Instants at which the offset changes during the year (DST transitions). */
  get transitions(): readonly { at: number; offset: number }[] {
    return this.changes;
  }

  /** UTC instant for a local wall-clock time on a local calendar date. */
  toUtc(month: number, day: number, minuteOfDay: number): number {
    const naive = Date.UTC(this.year, month - 1, day) + minuteOfDay * MINUTE;
    const o1 = this.offsetAt(naive - this.first * MINUTE);
    let t = naive - o1 * MINUTE;
    const o2 = this.offsetAt(t);
    if (o2 !== o1) t = naive - o2 * MINUTE;
    return t;
  }
}

/** Number of days in a year. */
export function daysInYear(year: number): number {
  return (Date.UTC(year + 1, 0, 1) - Date.UTC(year, 0, 1)) / DAY;
}

/** Month (1-12) and day for a zero-based day-of-year. */
export function dateOfDayIndex(year: number, index: number): { month: number; day: number; weekday: number } {
  const d = new Date(Date.UTC(year, 0, 1) + index * DAY);
  return { month: d.getUTCMonth() + 1, day: d.getUTCDate(), weekday: d.getUTCDay() };
}

/** Zero-based day-of-year for a month (1-12) and day. */
export function dayIndexOf(year: number, month: number, day: number): number {
  return Math.round((Date.UTC(year, month - 1, day) - Date.UTC(year, 0, 1)) / DAY);
}

/** "07:25" for minute-of-day 445. */
export function formatClock(minuteOfDay: number, style: '24h' | '12h' = '12h'): string {
  const m = ((Math.round(minuteOfDay) % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60);
  const mm = String(m % 60).padStart(2, '0');
  if (style === '24h') return `${String(h).padStart(2, '0')}:${mm}`;
  const suffix = h < 12 ? 'AM' : 'PM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${mm} ${suffix}`;
}

/** Parse "7:25", "07:25", "7:25 PM", "19:25" into minute-of-day, or null. */
export function parseClock(text: string): number | null {
  const m = text.trim().match(/^(\d{1,2}):(\d{2})\s*([ap]\.?m\.?)?$/i);
  if (!m) return null;
  let h = Number(m[1]);
  const min = Number(m[2]);
  if (min > 59) return null;
  const ampm = m[3]?.toLowerCase().replace(/\./g, '');
  if (ampm) {
    if (h < 1 || h > 12) return null;
    if (ampm === 'pm' && h !== 12) h += 12;
    if (ampm === 'am' && h === 12) h = 0;
  } else if (h > 23) return null;
  return h * 60 + min;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_LONG = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function monthName(month: number, long = false): string {
  return (long ? MONTHS_LONG : MONTHS)[month - 1];
}

export function weekdayName(weekday: number): string {
  return WEEKDAYS[weekday];
}

export function formatDate(month: number, day: number): string {
  return `${MONTHS[month - 1]} ${day}`;
}
