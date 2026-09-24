import { describe, expect, it } from 'vitest';
import { ephemeris, julianDay, refraction, sunPosition } from '../src/engine/solar';

describe('solar position (NOAA / Meeus)', () => {
  it('matches the NREL SPA reference case to within 0.02°', () => {
    // Reda & Andreas (2004), NREL/TP-560-34302, Table A5.1: Golden, Colorado,
    // 17 Oct 2003 12:30:30 MST (UTC-7). Topocentric zenith 50.11162°, azimuth 194.34024°.
    const ms = Date.UTC(2003, 9, 17, 19, 30, 30);
    const p = sunPosition(ms, 39.742476, -105.1786);
    expect(Math.abs(90 - p.elevation - 50.11162)).toBeLessThan(0.02);
    expect(Math.abs(p.azimuth - 194.34024)).toBeLessThan(0.02);
  });

  it('computes the Julian Day of the J2000.0 epoch', () => {
    expect(julianDay(Date.UTC(2000, 0, 1, 12))).toBe(2451545.0);
  });

  it('puts the 2026 June solstice within an hour of the published instant (21 Jun 08:24 UTC)', () => {
    let best = -Infinity;
    let at = 0;
    for (let t = Date.UTC(2026, 5, 20); t < Date.UTC(2026, 5, 23); t += 10 * 60_000) {
      const d = ephemeris(t).declination;
      if (d > best) {
        best = d;
        at = t;
      }
    }
    expect(Math.abs(at - Date.UTC(2026, 5, 21, 8, 24))).toBeLessThan(60 * 60_000);
    expect(best * (180 / Math.PI)).toBeCloseTo(23.44, 1);
  });

  it('puts the 2026 March equinox within 30 minutes of the published instant (20 Mar 14:46 UTC)', () => {
    let at = 0;
    let prev = -1;
    for (let t = Date.UTC(2026, 2, 19); t < Date.UTC(2026, 2, 22); t += 60_000) {
      const d = ephemeris(t).declination;
      if (prev < 0 && d >= 0) at = t;
      prev = d;
    }
    expect(Math.abs(at - Date.UTC(2026, 2, 20, 14, 46))).toBeLessThan(30 * 60_000);
  });

  it('has the sun in the east in the morning, south at local noon and west in the evening (northern mid-latitudes)', () => {
    // New York, 15 Apr 2026 (EDT = UTC-4)
    const lat = 40.75;
    const lon = -73.98;
    const morning = sunPosition(Date.UTC(2026, 3, 15, 11, 0), lat, lon); // 7:00 EDT
    const noon = sunPosition(Date.UTC(2026, 3, 15, 16, 56), lat, lon); // ~solar noon
    const evening = sunPosition(Date.UTC(2026, 3, 15, 23, 0), lat, lon); // 19:00 EDT
    expect(morning.azimuth).toBeGreaterThan(70);
    expect(morning.azimuth).toBeLessThan(110);
    expect(Math.abs(noon.azimuth - 180)).toBeLessThan(3);
    expect(evening.azimuth).toBeGreaterThan(250);
    expect(evening.azimuth).toBeLessThan(290);
  });

  it('has the noon sun in the north in the southern hemisphere', () => {
    // Sydney, solar noon on 15 Jan 2026 is about 01:10 UTC
    const p = sunPosition(Date.UTC(2026, 0, 15, 2, 12), -33.87, 151.21);
    expect(p.azimuth > 330 || p.azimuth < 30).toBe(true);
  });

  it('applies about 0.57° of refraction at the horizon and none near the zenith', () => {
    expect(refraction(0)).toBeCloseTo(0.482, 2);
    expect(refraction(-0.3)).toBeGreaterThan(0.5);
    expect(refraction(89)).toBe(0);
    expect(refraction(45)).toBeCloseTo(0.0161, 3);
  });
});
