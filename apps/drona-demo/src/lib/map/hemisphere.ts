/**
 * Which marks the globe's camera can see.
 *
 * On the globe an icon is a flat card standing on the surface, facing the viewer.
 * Depth-tested, the lower half of every card sinks into the sphere and is hidden
 * by it — the clipped rings and half-glyphs the depth test produced. So the icon
 * layers draw without depth, and the far side is hidden here instead: a mark is
 * drawn only if it lies in front of the horizon the camera sees.
 *
 * Pure. No React, no DOM.
 */
import { globeZoomAdjust } from "./framing";
import type { LonLat } from "./mercator";

/** deck.gl GlobeView: camera height above the surface, in viewport heights. */
const CAMERA_ALTITUDE = 1.5;
/** deck.gl GlobeView: the globe's radius in world units at scale 1. */
const GLOBE_RADIUS = 256;
/** Marks this close to the limb are foreshortened to nothing; drop them a touch early. */
const LIMB_MARGIN = 0.03;

const RAD = Math.PI / 180;

function unit([lon, lat]: LonLat): readonly [number, number, number] {
  const c = Math.cos(lat * RAD);
  return [c * Math.cos(lon * RAD), c * Math.sin(lon * RAD), Math.sin(lat * RAD)];
}

/** Cosine of the angle between two points on the sphere, seen from its centre. */
export function angularCos(a: LonLat, b: LonLat): number {
  const [ax, ay, az] = unit(a);
  const [bx, by, bz] = unit(b);
  return ax * bx + ay * by + az * bz;
}

/**
 * The smallest `angularCos` from the camera's target that is still in view. A
 * camera at distance D from the centre (in radii) sees to cos θ = 1 / D; the
 * closer in, the smaller the cap it sees.
 */
export function horizonCos(zoom: number, latitude: number, viewportHeight: number): number {
  const radius = (GLOBE_RADIUS * 2 ** (zoom - globeZoomAdjust(latitude))) / viewportHeight;
  const distance = (radius + CAMERA_ALTITUDE) / radius;
  return Math.min(1, 1 / distance + LIMB_MARGIN);
}

export interface Facing {
  readonly centre: LonLat;
  readonly minCos: number;
}

export const facesCamera = (position: LonLat, facing: Facing): boolean =>
  angularCos(position, facing.centre) >= facing.minCos;
