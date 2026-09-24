import { describe, expect, it } from 'vitest';
import {
  DEFAULT_LIMITS,
  compassAbbrev,
  compassWord,
  glareLevel,
  glareReading,
  lineOfSightAngle,
  relativeAzimuth,
  travelWord,
} from '../src/engine/glare';

describe('glare geometry', () => {
  it('measures the signed offset from the direction of travel, wrapping at north', () => {
    expect(relativeAzimuth(100, 90)).toBe(10);
    expect(relativeAzimuth(80, 90)).toBe(-10);
    expect(relativeAzimuth(5, 355)).toBe(10);
    expect(relativeAzimuth(355, 5)).toBe(-10);
    expect(relativeAzimuth(270, 90)).toBe(180);
  });

  it('measures the angle between the sun and the line of sight', () => {
    expect(lineOfSightAngle(0, 0)).toBeCloseTo(0);
    expect(lineOfSightAngle(10, 0)).toBeCloseTo(10);
    expect(lineOfSightAngle(0, -12)).toBeCloseTo(12);
    // 10° up and 10° across is a little over 14° away
    expect(lineOfSightAngle(10, 10)).toBeCloseTo(14.106, 2);
  });

  it('grades the sun straight ahead as blinding and at the edge of the zone as dazzle', () => {
    expect(glareLevel(90, 3, 90)).toBe(3);
    expect(glareLevel(100, 5, 90)).toBe(2); // ~11° away
    expect(glareLevel(110, 12, 90)).toBe(1); // ~23° away, still inside the 25° box
  });

  it('ignores a sun below the horizon, too high, or off to the side', () => {
    expect(glareLevel(90, -1, 90)).toBe(0);
    expect(glareLevel(90, 30, 90)).toBe(0);
    expect(glareLevel(130, 5, 90)).toBe(0);
    expect(glareLevel(90, 5, 270)).toBe(0); // sun behind you
  });

  it('respects custom zone limits', () => {
    expect(glareLevel(90, 30, 90, { ...DEFAULT_LIMITS, maxElevation: 35 })).toBe(1);
  });

  it('reports which side the sun is on', () => {
    const r = glareReading(80, 4, 90);
    expect(r.offset).toBe(-10);
    expect(r.level).toBe(2);
  });
});

describe('direction words', () => {
  it('names compass points', () => {
    expect(compassWord(0)).toBe('north');
    expect(compassWord(112.5)).toBe('east-southeast');
    expect(compassWord(359)).toBe('north');
    expect(compassAbbrev(299.1)).toBe('WNW');
  });

  it('names travel directions near the four main points', () => {
    expect(travelWord(90)).toBe('eastbound');
    expect(travelWord(270)).toBe('westbound');
    expect(travelWord(119.1)).toBe('heading 119°');
  });
});
