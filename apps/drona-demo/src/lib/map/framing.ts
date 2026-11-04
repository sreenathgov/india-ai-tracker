/**
 * Where the camera should rest for a set of positions.
 *
 * Scenes re-frame by handing the map the positions they care about; this turns that
 * into a deck.gl view state. It is Web-Mercator `fitBounds`, written out rather than
 * borrowed from `WebMercatorViewport`, so the framing each scene lands on is a tested
 * number and not a side effect of a class the tests cannot construct.
 *
 * Pure. No React, no DOM.
 */
import { fromWorldPixels, toWorldPixels, type LonLat } from "./mercator";

export interface Bounds {
  readonly west: number;
  readonly south: number;
  readonly east: number;
  readonly north: number;
}

export interface Framing {
  readonly longitude: number;
  readonly latitude: number;
  readonly zoom: number;
}

/** The world at rest: the whole network, India a little right of centre. */
export const WORLD_FRAMING: Framing = { longitude: 40, latitude: 22, zoom: 1.35 };

/** Never frame so tight that a single node fills the screen. */
export const MAX_FRAME_ZOOM = 6;
export const MIN_ZOOM = 0.6;
export const MAX_ZOOM = 9;

export function boundsOf(positions: readonly LonLat[]): Bounds | null {
  if (positions.length === 0) return null;
  let west = Infinity;
  let south = Infinity;
  let east = -Infinity;
  let north = -Infinity;
  for (const [lon, lat] of positions) {
    west = Math.min(west, lon);
    east = Math.max(east, lon);
    south = Math.min(south, lat);
    north = Math.max(north, lat);
  }
  return { west, south, east, north };
}

/** Room kept clear on each side of a framed box, CSS pixels. */
export interface Insets {
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
  readonly left: number;
}

/**
 * The room a framed scene keeps clear, so no mark sits under the map's chrome
 * (`components/map/MapChrome.tsx`). The key is a 176px column in the top-left
 * corner; the left inset clears it (12px margin + 176 + a little air). The projection
 * and zoom controls stand in the top-right corner, about 175px wide; the right inset
 * clears all of it. Both columns run the map's height, so the insets that bite are
 * the side ones: the map is wide and short, and width is the cheaper side to give up.
 * Change the chrome, change these — `sceneFraming.test.ts` holds every scene to them.
 */
export const CHROME_INSETS: Insets = { top: 32, right: 196, bottom: 32, left: 204 };

/**
 * Below this width the map is a column beside the working surface (Scenes 2–3), not
 * a band across it. Side insets of 400px would leave nothing to frame into, so the
 * key starts folded to its pill and the chrome is cleared from above instead: the
 * column is tall and narrow, and height is the cheaper side to give up.
 */
export const COMPACT_MAP_WIDTH = 640;
export const COMPACT_INSETS: Insets = { top: 96, right: 44, bottom: 40, left: 44 };

/**
 * Scene 1's map is a card in a bento, not a band: its title and scope sit top-left,
 * the controls top-right, and the key folds to a pill bottom-left. Clear the top.
 */
export const CARD_INSETS: Insets = { top: 84, right: 56, bottom: 48, left: 56 };

export type MapChromeLayout = "scene" | "card";

export const chromeInsets = (width: number, layout: MapChromeLayout = "scene"): Insets =>
  layout === "card" ? CARD_INSETS : width < COMPACT_MAP_WIDTH ? COMPACT_INSETS : CHROME_INSETS;

const toInsets = (padding: number | Insets): Insets =>
  typeof padding === "number"
    ? { top: padding, right: padding, bottom: padding, left: padding }
    : padding;

/**
 * Fit bounds into a viewport of `width × height` CSS pixels, keeping `padding` clear
 * — one number for every side, or per-side insets where chrome sits over the map.
 * The box is centred in the room the insets leave, not in the viewport. A single
 * point (or a degenerate box) frames at `MAX_FRAME_ZOOM`.
 */
export function frameBounds(
  bounds: Bounds,
  width: number,
  height: number,
  padding: number | Insets = 56
): Framing {
  const insets = toInsets(padding);
  const nw = toWorldPixels([bounds.west, bounds.north], 0);
  const se = toWorldPixels([bounds.east, bounds.south], 0);
  const spanX = Math.max(se[0] - nw[0], 1e-6);
  const spanY = Math.max(se[1] - nw[1], 1e-6);
  const usableW = Math.max(width - insets.left - insets.right, 1);
  const usableH = Math.max(height - insets.top - insets.bottom, 1);

  const zoom = Math.min(
    MAX_FRAME_ZOOM,
    Math.max(MIN_ZOOM, Math.log2(Math.min(usableW / spanX, usableH / spanY)))
  );
  /* The box's centre lands on the usable area's centre, which sits off the
     viewport's centre by half the difference between opposite insets. */
  const scale = 2 ** zoom;
  const shiftX = (insets.left - insets.right) / 2 / scale;
  const shiftY = (insets.top - insets.bottom) / 2 / scale;
  const [longitude, latitude] = fromWorldPixels(
    [(nw[0] + se[0]) / 2 - shiftX, (nw[1] + se[1]) / 2 - shiftY],
    0
  );
  return { longitude, latitude, zoom };
}

/* ─── The globe ───────────────────────────────────────────────────────────────
   deck.gl 9.4's globe reads zoom on the web-mercator scale, adjusted by latitude:
   at zoom z its diameter is 512 · 2^(z − log2(π·cos φ)) pixels. These helpers carry
   that rule, so the two views can be converted rather than guessed between. */

/** Web-mercator's own limit; the globe caps its latitude adjustment at the same place. */
const ADJUST_LATITUDE_CAP = 85.051129;

/** How many zoom levels the globe's number runs ahead of the flat map's at latitude φ. */
export function globeZoomAdjust(latitude: number): number {
  const lat = Math.max(-ADJUST_LATITUDE_CAP, Math.min(ADJUST_LATITUDE_CAP, latitude));
  return Math.log2(Math.PI * Math.cos((lat * Math.PI) / 180));
}

/** The globe zoom that draws the ground at the same scale as the flat map at `zoom`. */
export const toGlobeZoom = (zoom: number, latitude: number): number =>
  zoom + globeZoomAdjust(latitude);

/** The inverse, clamped to the flat map's range. */
export const toMapZoom = (zoom: number, latitude: number): number =>
  Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom - globeZoomAdjust(latitude)));

/** The zoom at which the whole globe sits inside the shorter side, with padding. */
export function wholeGlobeZoom(
  width: number,
  height: number,
  latitude: number,
  padding = 16
): number {
  const diameter = Math.max(Math.min(width, height) - padding * 2, 1);
  return Math.log2(diameter / 512) + globeZoomAdjust(latitude);
}

/**
 * Content wider than this, in degrees of longitude or latitude, cannot be seen from
 * any one side of a globe — so the globe shows itself whole rather than a crop.
 */
export const GLOBE_WHOLE_SPAN = 90;

/**
 * The middle of a set of positions on the sphere: the direction of their mean unit
 * vector. Unlike the centre of their bounding box it follows where the points
 * actually are — a network that is mostly India, with outliers in Texas and Japan,
 * centres near India rather than in the Atlantic.
 */
export function sphericalCentre(positions: readonly LonLat[]): LonLat | null {
  if (positions.length === 0) return null;
  const rad = Math.PI / 180;
  let x = 0;
  let y = 0;
  let z = 0;
  for (const [lon, lat] of positions) {
    const cosLat = Math.cos(lat * rad);
    x += cosLat * Math.cos(lon * rad);
    y += cosLat * Math.sin(lon * rad);
    z += Math.sin(lat * rad);
  }
  const horizontal = Math.hypot(x, y);
  if (horizontal < 1e-9 && Math.abs(z) < 1e-9) return positions[0];
  return [Math.atan2(y, x) / rad, Math.atan2(z, horizontal) / rad];
}

/**
 * Frame positions on the globe. Content that wraps too far round it for any crop
 * to hold is shown on the whole globe, turned to face the positions' spherical
 * centre; anything tighter keeps the flat framing's centre and ground scale. Never
 * smaller than the whole globe: past that there is only empty background.
 */
export function frameGlobe(
  positions: readonly LonLat[],
  width: number,
  height: number,
  padding: number | Insets = 56
): Framing | null {
  const bounds = boundsOf(positions);
  const centre = sphericalCentre(positions);
  if (!bounds || !centre) return null;
  const wraps =
    bounds.east - bounds.west > GLOBE_WHOLE_SPAN ||
    bounds.north - bounds.south > GLOBE_WHOLE_SPAN;
  if (wraps) {
    const [longitude, latitude] = centre;
    return { longitude, latitude, zoom: wholeGlobeZoom(width, height, latitude) };
  }
  const flat = frameBounds(bounds, width, height, padding);
  const whole = wholeGlobeZoom(width, height, flat.latitude);
  return { ...flat, zoom: Math.max(whole, toGlobeZoom(flat.zoom, flat.latitude)) };
}
