import { describe, expect, it } from 'vitest';
import { glareEvents } from '../src/engine/export';
import { buildCalendar } from '../src/engine/ics';
import { findSeasons, scanYear, seasonShift } from '../src/engine/scan';
import { defaultState, toCommute } from '../src/engine/state';
import { dayIndexOf } from '../src/engine/time';

describe('calendar export of glare drives', () => {
  const state = defaultState(2026);
  const commute = toCommute(state);
  const scan = scanYear(commute);
  const seasons = findSeasons(scan);
  const shifts = seasons.map((s) => seasonShift(commute, scan, s));

  it('makes one event per driving day with glare, per drive', () => {
    const events = glareEvents(state, scan, seasons, shifts, 0);
    const expected = scan.days.reduce((n, d) => n + (d.driving ? d.legs.filter((l) => l.glareMinutes > 0).length : 0), 0);
    expect(events).toHaveLength(expected);
    expect(new Set(events.map((e) => e.uid)).size).toBe(events.length);
  });

  it('skips days before the given day', () => {
    const from = dayIndexOf(2026, 9, 24);
    const events = glareEvents(state, scan, seasons, shifts, from);
    for (const e of events) expect(e.start).toBeGreaterThanOrEqual(Date.UTC(2026, 8, 24));
  });

  it('starts each event at the local departure time (Arizona, UTC−7)', () => {
    const e = glareEvents(state, scan, seasons, shifts, 0).find((x) => x.summary.includes('morning'))!;
    const d = new Date(e.start);
    expect(d.getUTCHours() * 60 + d.getUTCMinutes()).toBe(state.out.depart + 7 * 60);
    expect(e.end - e.start).toBe(state.out.duration * 60_000);
  });

  it('describes each drive with computed numbers only', () => {
    const e = glareEvents(state, scan, seasons, shifts, 0)[0];
    expect(e.description).toMatch(/\d+ min with the sun in your eyes, worst at \d{1,2}:\d{2} [AP]M: sun \d+° up/);
    const ics = buildCalendar(glareEvents(state, scan, seasons, shifts, 0), Date.UTC(2026, 8, 24));
    expect(ics.match(/BEGIN:VEVENT/g)?.length).toBeGreaterThan(10);
  });
});
