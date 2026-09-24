import { describe, expect, it } from 'vitest';
import { findSeasons, scanYear, summarize } from '../src/engine/scan';
import { defaultState, toCommute } from '../src/engine/state';
import {
  formatRange,
  joinAnd,
  legName,
  nextGlare,
  plural,
  shiftAdvice,
  sideWord,
  sunPlacement,
  verdict,
} from '../src/engine/words';

describe('words', () => {
  it('pluralises', () => {
    expect(plural(1, 'day')).toBe('1 day');
    expect(plural(2, 'day')).toBe('2 days');
  });

  it('formats date ranges compactly', () => {
    expect(formatRange(2026, 48, 99)).toBe('Feb 18 – Apr 10');
    expect(formatRange(2026, 245, 267)).toBe('Sep 3 – 25');
    expect(formatRange(2026, 284, 61)).toBe('Oct 12 – Mar 3');
    expect(formatRange(2026, 10, 10)).toBe('Jan 11');
  });

  it('joins lists in English', () => {
    expect(joinAnd(['a'])).toBe('a');
    expect(joinAnd(['a', 'b'])).toBe('a and b');
    expect(joinAnd(['a', 'b', 'c'])).toBe('a, b and c');
  });

  it('turns shift advice into an instruction, or nothing', () => {
    expect(shiftAdvice({ earlier: null, later: 17 })).toBe('Leave 17 min later');
    expect(shiftAdvice({ earlier: 12, later: 20 })).toBe('Leave 12 min earlier or 20 min later');
    expect(shiftAdvice({ earlier: null, later: null })).toBeNull();
  });

  it('says where the sun is', () => {
    expect(sunPlacement(9.2, -3.1)).toBe('9° up, 3° left of straight ahead');
    expect(sunPlacement(4, 0.2)).toBe('4° up, dead ahead');
    expect(sideWord(100, 90)).toBe('ahead, 10° to the right');
    expect(sideWord(90, 90)).toBe('straight ahead');
  });

  it('names legs by the drives that are switched on', () => {
    const s = defaultState(2026);
    expect(legName(s, 0)).toBe('morning');
    expect(legName(s, 1)).toBe('evening');
    s.out.enabled = false;
    expect(legName(s, 0)).toBe('evening');
  });

  it('builds the verdict only from computed numbers', () => {
    const s = defaultState(2026);
    const scan = scanYear(toCommute(s));
    const sum = summarize(scan);
    const v = verdict(s, sum, findSeasons(scan));
    expect(v.count).toBe(sum.totalDays);
    expect(v.headline).toContain(String(sum.totalDays));
    expect(v.headline).toContain('2026');
    expect(v.lines).toHaveLength(2);
    expect(v.lines[0]).toMatch(/^Mornings, eastbound: /);
    expect(v.lines[1]).toMatch(/^Evenings, westbound: /);
    expect(v.lines[0]).toContain(`(${sum.perLeg[0]} drives)`);
  });

  it('says so plainly when a drive never meets a low sun', () => {
    const s = defaultState(2026);
    s.out.heading = 0; // due north, the sun is never ahead at 7:15 in Tucson
    s.back.heading = 180;
    s.back.depart = 12 * 60;
    const scan = scanYear(toCommute(s));
    const v = verdict(s, summarize(scan), findSeasons(scan));
    expect(v.count).toBe(0);
    expect(v.headline).toBe('Your drive stays out of the low sun all of 2026.');
    expect(v.lines).toEqual(['Mornings, northbound: clear all year.', 'Evenings, southbound: clear all year.']);
  });

  it('finds the next glare drive from a given day', () => {
    const s = defaultState(2026);
    const scan = scanYear(toCommute(s));
    const n = nextGlare(scan, 0)!;
    expect(n.day.driving).toBe(true);
    expect(n.day.legs[n.legIndex].glareMinutes).toBeGreaterThan(0);
    expect(nextGlare(scan, 400)).toBeNull();
  });
});
