import * as Astronomy from 'astronomy-engine';
import type { PlanetName } from '@/types';

const MS_PER_DAY = 86_400_000;
const DEG = Math.PI / 180;

/** Ecliptic longitude in [0, 360). */
function norm360(value: number): number {
  return ((value % 360) + 360) % 360;
}

/** Signed difference a - b folded into [-180, 180). */
function signedDelta(a: number, b: number): number {
  return norm360(a - b + 180) - 180;
}

/**
 * Apparent geocentric tropical longitude of the Sun (true equinox of date),
 * degrees in [0, 360).
 */
export function sunLongitude(date: Date): number {
  return norm360(Astronomy.SunPosition(date).elon);
}

/**
 * Longitude of the TRUE (osculating) lunar ascending node, degrees, true
 * equinox of date.
 *
 * astronomy-engine has no continuous node, so it is derived the way Swiss
 * Ephemeris defines it: the node of the instantaneous orbital plane of the
 * Moon. With r and v the geocentric Moon position and velocity rotated into
 * the true ecliptic of date, the orbital angular momentum is h = r x v and
 * the ascending node longitude is atan2(h_x, -h_y).
 */
export function trueNodeLongitude(date: Date): number {
  const state = Astronomy.GeoMoonState(date);
  const rotation = Astronomy.Rotation_EQJ_ECT(date);
  const r = Astronomy.RotateVector(
    rotation,
    new Astronomy.Vector(state.x, state.y, state.z, state.t),
  );
  const v = Astronomy.RotateVector(
    rotation,
    new Astronomy.Vector(state.vx, state.vy, state.vz, state.t),
  );
  const hx = r.y * v.z - r.z * v.y;
  const hy = r.z * v.x - r.x * v.z;
  return norm360(Math.atan2(hx, -hy) / DEG);
}

const PLANET_BODIES = {
  Mercury: Astronomy.Body.Mercury,
  Venus: Astronomy.Body.Venus,
  Mars: Astronomy.Body.Mars,
  Jupiter: Astronomy.Body.Jupiter,
  Saturn: Astronomy.Body.Saturn,
  Uranus: Astronomy.Body.Uranus,
  Neptune: Astronomy.Body.Neptune,
  Pluto: Astronomy.Body.Pluto,
} as const;

/** Apparent geocentric longitude (aberration + light time) on the true ecliptic of date. */
function planetLongitude(body: Astronomy.Body, date: Date): number {
  const eqj = Astronomy.GeoVector(body, date, true);
  const ect = Astronomy.RotateVector(Astronomy.Rotation_EQJ_ECT(date), eqj);
  return norm360(Astronomy.SphereFromVector(ect).lon);
}

/**
 * Apparent geocentric tropical ecliptic longitudes (degrees, [0, 360)) of
 * the 13 Human Design bodies at an instant. Earth is the Sun + 180 and the
 * South Node is the North Node + 180.
 */
export function bodyLongitudes(date: Date): Record<PlanetName, number> {
  const sun = sunLongitude(date);
  const node = trueNodeLongitude(date);
  return {
    Sun: sun,
    Earth: norm360(sun + 180),
    Moon: norm360(Astronomy.EclipticGeoMoon(date).lon),
    NorthNode: node,
    SouthNode: norm360(node + 180),
    Mercury: planetLongitude(PLANET_BODIES.Mercury, date),
    Venus: planetLongitude(PLANET_BODIES.Venus, date),
    Mars: planetLongitude(PLANET_BODIES.Mars, date),
    Jupiter: planetLongitude(PLANET_BODIES.Jupiter, date),
    Saturn: planetLongitude(PLANET_BODIES.Saturn, date),
    Uranus: planetLongitude(PLANET_BODIES.Uranus, date),
    Neptune: planetLongitude(PLANET_BODIES.Neptune, date),
    Pluto: planetLongitude(PLANET_BODIES.Pluto, date),
  };
}

/**
 * The Design moment: the instant the Sun stood exactly 88 degrees of
 * ecliptic arc before its longitude at `birth`. Found by bisection over the
 * window 95..80 days before birth (the Sun moves 0.95-1.02 degrees per day,
 * so the root is always inside and the difference is monotonic).
 */
export function designMoment(birth: Date): Date {
  const target = norm360(sunLongitude(birth) - 88);
  let lo = birth.getTime() - 95 * MS_PER_DAY;
  let hi = birth.getTime() - 80 * MS_PER_DAY;
  for (let i = 0; i < 50; i++) {
    const mid = (lo + hi) / 2;
    if (signedDelta(sunLongitude(new Date(mid)), target) > 0) hi = mid;
    else lo = mid;
  }
  return new Date(Math.round((lo + hi) / 2));
}
