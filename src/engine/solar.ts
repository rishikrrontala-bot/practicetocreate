/**
 * Solar position: the NOAA General Solar Position algorithm (after Meeus,
 * "Astronomical Algorithms", 1991), as used by NOAA's Solar Calculator.
 *
 * Accuracy: about 0.01° for dates between 1800 and 2100, far finer than the
 * several-degree geometry that decides whether the sun is in a driver's eyes.
 * Validated in tests/solar.test.ts against NREL's SPA reference case
 * (Reda & Andreas 2004, NREL/TP-560-34302).
 *
 * Conventions used across the engine:
 *   latitude  degrees, north positive
 *   longitude degrees, east positive (so New York is about -74)
 *   azimuth   degrees clockwise from true north (90 = east, 270 = west)
 *   elevation degrees above the horizon, apparent (refraction applied)
 */

const RAD = Math.PI / 180;
const DEG = 180 / Math.PI;

export interface SunPosition {
  /** Degrees clockwise from true north, in [0, 360). */
  azimuth: number;
  /** Apparent elevation above the horizon in degrees (atmospheric refraction included). */
  elevation: number;
  /** Geometric elevation, without refraction. */
  trueElevation: number;
  /** Solar declination in degrees. */
  declination: number;
  /** Equation of time in minutes. */
  equationOfTime: number;
}

/** Julian Day for a Unix timestamp in milliseconds (UTC). */
export function julianDay(ms: number): number {
  return ms / 86_400_000 + 2_440_587.5;
}

/** Julian centuries since J2000.0. */
export function julianCentury(jd: number): number {
  return (jd - 2_451_545.0) / 36_525;
}

/**
 * The parts of the solar position that depend only on the instant, not the
 * observer. Split out so a year scan can reuse them for many observers.
 */
export interface SolarEphemeris {
  declination: number; // radians
  equationOfTime: number; // minutes
}

export function ephemeris(ms: number): SolarEphemeris {
  const T = julianCentury(julianDay(ms));

  const L0 = mod(280.46646 + T * (36000.76983 + T * 0.0003032), 360); // geometric mean longitude
  const M = 357.52911 + T * (35999.05029 - 0.0001537 * T); // geometric mean anomaly
  const e = 0.016708634 - T * (0.000042037 + 0.0000001267 * T); // orbital eccentricity

  const Mr = M * RAD;
  const C =
    Math.sin(Mr) * (1.914602 - T * (0.004817 + 0.000014 * T)) +
    Math.sin(2 * Mr) * (0.019993 - 0.000101 * T) +
    Math.sin(3 * Mr) * 0.000289; // equation of centre

  const trueLong = L0 + C;
  const omega = 125.04 - 1934.136 * T;
  const apparentLong = trueLong - 0.00569 - 0.00478 * Math.sin(omega * RAD);

  const meanObliquity = 23 + (26 + (21.448 - T * (46.815 + T * (0.00059 - T * 0.001813))) / 60) / 60;
  const obliquity = meanObliquity + 0.00256 * Math.cos(omega * RAD);

  const declination = Math.asin(Math.sin(obliquity * RAD) * Math.sin(apparentLong * RAD));

  const y = Math.tan((obliquity / 2) * RAD) ** 2;
  const L0r = L0 * RAD;
  const eqTime =
    4 *
    DEG *
    (y * Math.sin(2 * L0r) -
      2 * e * Math.sin(Mr) +
      4 * e * y * Math.sin(Mr) * Math.cos(2 * L0r) -
      0.5 * y * y * Math.sin(4 * L0r) -
      1.25 * e * e * Math.sin(2 * Mr));

  return { declination, equationOfTime: eqTime };
}

/**
 * Atmospheric refraction in degrees for a geometric elevation, standard
 * atmosphere (NOAA Solar Calculator piecewise fit).
 */
export function refraction(elevationDeg: number): number {
  const e = elevationDeg;
  if (e > 85) return 0;
  const te = Math.tan(e * RAD);
  let arcsec: number;
  if (e > 5) arcsec = 58.1 / te - 0.07 / te ** 3 + 0.000086 / te ** 5;
  else if (e > -0.575) arcsec = 1735 + e * (-518.2 + e * (103.4 + e * (-12.79 + e * 0.711)));
  else arcsec = -20.772 / te;
  return arcsec / 3600;
}

/** Position of the sun for an observer at an instant (Unix ms, UTC). */
export function sunPosition(ms: number, lat: number, lon: number): SunPosition {
  const eph = ephemeris(ms);
  return sunPositionFromEphemeris(ms, lat, lon, eph);
}

export function sunPositionFromEphemeris(
  ms: number,
  lat: number,
  lon: number,
  eph: SolarEphemeris,
): SunPosition {
  const utcMinutes = mod(ms / 60_000, 1440);
  const trueSolarTime = mod(utcMinutes + eph.equationOfTime + 4 * lon, 1440);
  const hourAngle = (trueSolarTime / 4 - 180) * RAD; // negative in the morning

  const phi = lat * RAD;
  const dec = eph.declination;

  const cosZenith = clamp(
    Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(hourAngle),
    -1,
    1,
  );
  const zenith = Math.acos(cosZenith);
  const trueElevation = 90 - zenith * DEG;

  // Meeus 13.5: azimuth measured westward from south, shifted to clockwise-from-north.
  const az =
    Math.atan2(Math.sin(hourAngle), Math.cos(hourAngle) * Math.sin(phi) - Math.tan(dec) * Math.cos(phi)) * DEG +
    180;

  return {
    azimuth: mod(az, 360),
    elevation: trueElevation + refraction(trueElevation),
    trueElevation,
    declination: dec * DEG,
    equationOfTime: eph.equationOfTime,
  };
}

export function mod(a: number, n: number): number {
  return ((a % n) + n) % n;
}

export function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}
