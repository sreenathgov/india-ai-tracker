/**
 * Lines on the map, as point lists.
 *
 * A plant-to-buyer line is drawn along the great circle — the route a ship's
 * navigator would recognise — rather than as a straight Mercator segment, which on a
 * world map reads as a ruler laid across the continents. The same point list feeds
 * the flat map and the globe, so the two views can never disagree about a route.
 *
 * Dotted lines are sampled here as points rather than dashed in the shader. That is
 * what keeps the map inside its three approved packages: dash patterns in deck.gl
 * live in `@deck.gl/extensions`, which the founder gate did not admit.
 *
 * Pure. No React, no DOM.
 */
import type { LonLat } from "./mercator";

const RAD = Math.PI / 180;
const DEG = 180 / Math.PI;
const EARTH_RADIUS_KM = 6371;

type Vec3 = readonly [number, number, number];

const toVec = ([lon, lat]: LonLat): Vec3 => [
  Math.cos(lat * RAD) * Math.cos(lon * RAD),
  Math.cos(lat * RAD) * Math.sin(lon * RAD),
  Math.sin(lat * RAD),
];

const toLonLat = ([x, y, z]: Vec3): LonLat => [
  Math.atan2(y, x) * DEG,
  Math.atan2(z, Math.hypot(x, y)) * DEG,
];

/** Central angle between two positions, in radians. */
export function centralAngle(a: LonLat, b: LonLat): number {
  const [ax, ay, az] = toVec(a);
  const [bx, by, bz] = toVec(b);
  /* atan2(|a×b|, a·b) rather than acos(a·b): acos loses all precision near zero,
     which is exactly where two positions in the same town sit. */
  const cross = Math.hypot(ay * bz - az * by, az * bx - ax * bz, ax * by - ay * bx);
  return Math.atan2(cross, ax * bx + ay * by + az * bz);
}

export const distanceKm = (a: LonLat, b: LonLat): number =>
  centralAngle(a, b) * EARTH_RADIUS_KM;

/**
 * The great circle from `a` to `b`, as `segments + 1` positions.
 *
 * Longitudes are unwrapped so consecutive points never jump by more than 180° — a
 * path that crossed the antimeridian would otherwise draw a line straight back across
 * the whole map.
 */
export function greatCircle(a: LonLat, b: LonLat, segments = 64): readonly LonLat[] {
  const omega = centralAngle(a, b);
  if (omega < 1e-9) return [a, b];

  const va = toVec(a);
  const vb = toVec(b);
  const sinOmega = Math.sin(omega);
  const points: LonLat[] = [];
  let previousLon: number | null = null;

  for (let i = 0; i <= segments; i += 1) {
    const t = i / segments;
    const ka = Math.sin((1 - t) * omega) / sinOmega;
    const kb = Math.sin(t * omega) / sinOmega;
    const [lon, lat] = toLonLat([
      ka * va[0] + kb * vb[0],
      ka * va[1] + kb * vb[1],
      ka * va[2] + kb * vb[2],
    ]);
    let unwrapped = lon;
    if (previousLon !== null) {
      while (unwrapped - previousLon > 180) unwrapped -= 360;
      while (unwrapped - previousLon < -180) unwrapped += 360;
    }
    previousLon = unwrapped;
    points.push([unwrapped, lat]);
  }
  return points;
}

/**
 * Evenly spaced points along a path, for a dotted line.
 *
 * Spacing is in kilometres of ground distance, so a short edge and a long one carry
 * the same rhythm instead of the long one's dots drifting apart.
 */
export function dotted(path: readonly LonLat[], spacingKm: number): readonly LonLat[] {
  if (path.length === 0 || spacingKm <= 0) return [];
  const dots: LonLat[] = [path[0]];
  let carried = 0;

  for (let i = 1; i < path.length; i += 1) {
    const from = path[i - 1];
    const to = path[i];
    const length = distanceKm(from, to);
    let along = spacingKm - carried;
    while (along <= length) {
      const t = along / length;
      dots.push([from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t]);
      along += spacingKm;
    }
    carried = length - (along - spacingKm);
  }
  return dots;
}
