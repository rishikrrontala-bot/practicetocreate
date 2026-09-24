import { describe, expect, it } from 'vitest';
import { PRESETS, decodeState, defaultState, encodeState, toCommute } from '../src/engine/state';

describe('shareable state', () => {
  it('round-trips through the URL hash', () => {
    const s = defaultState(2026);
    s.out.heading = 101.3;
    s.back.enabled = false;
    s.limits = { ...s.limits, minLevel: 3 };
    s.days = [true, false, false, false, false, false, true];
    const back = decodeState('#' + encodeState(s), defaultState(2026));
    expect(back.out.heading).toBe(101.3);
    expect(back.back.enabled).toBe(false);
    expect(back.limits.minLevel).toBe(3);
    expect(back.days).toEqual(s.days);
    expect(back.timeZone).toBe('America/Phoenix');
    expect(back.place).toBe('Tucson, AZ');
  });

  it('falls back field by field on bad input', () => {
    const base = defaultState(2026);
    const s = decodeState('at=999,5&tz=Nowhere/Land&out=abc&days=12&lvl=9&y=3000', base);
    expect(s.lat).toBe(base.lat);
    expect(s.timeZone).toBe(base.timeZone);
    expect(s.out).toEqual(base.out);
    expect(s.days).toEqual(base.days);
    expect(s.limits.minLevel).toBe(2);
    expect(s.year).toBe(2026);
  });

  it('turns state into a commute with only the enabled legs', () => {
    const s = defaultState(2026);
    s.back.enabled = false;
    const c = toCommute(s);
    expect(c.legs).toHaveLength(1);
    expect(c.legs[0].segments[0]).toEqual({ heading: 90, minutes: 25 });
  });

  it('ships presets on documented street directions', () => {
    const manhattan = PRESETS.find((p) => p.id === 'manhattan')!;
    expect(manhattan.state.back.heading).toBe(299.1);
    for (const p of PRESETS) expect(p.state.lat).toBeGreaterThan(20);
  });
});
