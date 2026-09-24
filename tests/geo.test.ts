import { describe, expect, it } from 'vitest';
import { bearing, distance, formatCoordinates, magneticToTrue, parseCoordinates } from '../src/engine/geo';

describe('bearings', () => {
  it('points east along the equator and north along a meridian', () => {
    expect(bearing(0, 0, 0, 1)).toBeCloseTo(90, 6);
    expect(bearing(10, 20, 11, 20)).toBeCloseTo(0, 6);
    expect(bearing(11, 20, 10, 20)).toBeCloseTo(180, 6);
  });

  it('recovers the Manhattan grid from two points on 42nd Street', () => {
    // 42nd St at 1st Ave → 42nd St at 12th Ave (westbound), approximate points on the street
    const b = bearing(40.7489, -73.9681, 40.7625, -73.9998);
    expect(Math.abs(b - 299.1)).toBeLessThan(2);
  });

  it('measures distance', () => {
    expect(distance(0, 0, 0, 1) / 1000).toBeCloseTo(111.2, 0);
  });

  it('corrects a magnetic heading with the local declination', () => {
    expect(magneticToTrue(90, -13)).toBe(77);
    expect(magneticToTrue(355, 10)).toBe(5);
  });
});

describe('typed coordinates', () => {
  it('reads decimal pairs', () => {
    expect(parseCoordinates('40.7527, -73.9818')).toEqual({ lat: 40.7527, lon: -73.9818 });
    expect(parseCoordinates('32.2319 -110.9501')).toEqual({ lat: 32.2319, lon: -110.9501 });
  });

  it('reads degrees, minutes and seconds', () => {
    const p = parseCoordinates('40°45\'10"N 73°58\'54"W')!;
    expect(p.lat).toBeCloseTo(40.7528, 3);
    expect(p.lon).toBeCloseTo(-73.9817, 3);
  });

  it('reads a map link', () => {
    expect(parseCoordinates('https://www.google.com/maps/@40.7527,-73.9818,15z')).toEqual({ lat: 40.7527, lon: -73.9818 });
    expect(parseCoordinates('https://maps.google.com/?q=32.23,-110.95')).toEqual({ lat: 32.23, lon: -110.95 });
  });

  it('rejects nonsense', () => {
    expect(parseCoordinates('hello')).toBeNull();
    expect(parseCoordinates('95, 10')).toBeNull();
  });

  it('formats coordinates', () => {
    expect(formatCoordinates(40.7527, -73.9818)).toBe('40.7527° N, 73.9818° W');
  });
});
