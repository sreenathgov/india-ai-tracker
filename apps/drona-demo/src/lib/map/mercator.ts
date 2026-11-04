/**
 * Web-Mercator arithmetic, in deck.gl's units.
 *
 * deck.gl's `MapView` puts the whole world in a 512-pixel square at zoom 0 and
 * doubles it per zoom level. Clustering and framing both need that space, and both
 * need to be tested without a WebGL context — so the three formulas live here, pure,
 * rather than behind a `WebMercatorViewport` that a unit test would have to fake.
 *
 * Pure. No React, no DOM, no deck.gl.
 */

/** A geographic position as deck.gl consumes it: `[longitude, latitude]`. */
export type LonLat = readonly [number, number];

export const TILE_SIZE = 512;

/** Latitude Web-Mercator can show before the pole runs to infinity. */
export const MAX_LATITUDE = 85.051129;

const clampLat = (lat: number): number =>
  Math.max(-MAX_LATITUDE, Math.min(MAX_LATITUDE, lat));

/** Project to world pixels at the given zoom. Origin top-left, y down. */
export function toWorldPixels([lon, lat]: LonLat, zoom: number): readonly [number, number] {
  const scale = TILE_SIZE * 2 ** zoom;
  const phi = (clampLat(lat) * Math.PI) / 180;
  const x = ((lon + 180) / 360) * scale;
  const y = ((1 - Math.log(Math.tan(Math.PI / 4 + phi / 2)) / Math.PI) / 2) * scale;
  return [x, y];
}

/** The inverse of `toWorldPixels`. */
export function fromWorldPixels([x, y]: readonly [number, number], zoom: number): LonLat {
  const scale = TILE_SIZE * 2 ** zoom;
  const lon = (x / scale) * 360 - 180;
  const n = Math.PI * (1 - (2 * y) / scale);
  const lat = (Math.atan(Math.sinh(n)) * 180) / Math.PI;
  return [lon, lat];
}
