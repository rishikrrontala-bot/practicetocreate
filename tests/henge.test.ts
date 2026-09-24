import { describe, expect, it } from 'vitest';
import { AMNH_2026, MANHATTAN as M, azimuthCrossing, findHenges } from '../src/engine/henge';
import { sunPosition } from '../src/engine/solar';
import { ZoneYear } from '../src/engine/time';

describe('Manhattanhenge 2026 (the public check)', () => {
  const zone = new ZoneYear(2026, M.timeZone);

  it.each(AMNH_2026)(
    'on AMNH’s date ($kind sun, $month/$day) the sun reaches the grid bearing at AMNH’s published minute',
    ({ month, day, minute }) => {
      const t = azimuthCrossing(M.lat, M.lon, zone, month, day, M.gridAzimuth, 'sunset');
      expect(t).not.toBeNull();
      const local = (t! / 60_000 + zone.offsetAt(t!)) % 1440;
      // AMNH publishes whole minutes; allow the rounding either way.
      expect(Math.abs(local - minute)).toBeLessThan(1.5);
      // …and the sun is right on the horizon, within a degree.
      const alt = sunPosition(t!, M.lat, M.lon).elevation;
      expect(alt).toBeGreaterThan(0);
      expect(alt).toBeLessThan(1.2);
    },
  );

  it('predicts the alignment dates within 3 days of AMNH (the exact altitude convention is not published)', () => {
    const full = findHenges(M.lat, M.lon, M.timeZone, 2026, M.gridAzimuth, M.fullAltitude);
    const half = findHenges(M.lat, M.lon, M.timeZone, 2026, M.gridAzimuth, M.halfAltitude);
    expect(full).toHaveLength(2);
    expect(half).toHaveLength(2);
    const dist = (e: { month: number; day: number }, month: number, day: number) =>
      Math.abs(Date.UTC(2026, e.month - 1, e.day) - Date.UTC(2026, month - 1, day)) / 86_400_000;
    expect(dist(full[0], 5, 29)).toBeLessThanOrEqual(3);
    expect(dist(full[1], 7, 11)).toBeLessThanOrEqual(3);
    expect(dist(half[0], 5, 28)).toBeLessThanOrEqual(3);
    expect(dist(half[1], 7, 12)).toBeLessThanOrEqual(3);
  });

  it('finds a sunrise alignment for the eastbound direction in winter', () => {
    const ev = findHenges(M.lat, M.lon, M.timeZone, 2026, 119.1, 0.5, 'sunrise');
    expect(ev.length).toBe(2);
    expect([12, 1]).toContain(ev[0].month);
  });
});
