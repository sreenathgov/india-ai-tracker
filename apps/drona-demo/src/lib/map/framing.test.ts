import { describe, expect, it } from "vitest";

import {
  CHROME_INSETS,
  COMPACT_INSETS,
  chromeInsets,
  MAX_FRAME_ZOOM,
  MIN_ZOOM,
  boundsOf,
  frameBounds,
  frameGlobe,
  sphericalCentre,
  globeZoomAdjust,
  toGlobeZoom,
  toMapZoom,
  wholeGlobeZoom,
} from "./framing";
import { toWorldPixels, type LonLat } from "./mercator";

describe("boundsOf", () => {
  it("boxes every position", () => {
    expect(
      boundsOf([
        [80, 13],
        [8, 55],
        [-97, 28],
      ])
    ).toEqual({ west: -97, south: 13, east: 80, north: 55 });
  });

  it("returns null for nothing, rather than a box around nowhere", () => {
    expect(boundsOf([])).toBeNull();
  });
});

describe("frameBounds", () => {
  const INDIA = { west: 68, south: 8, east: 92, north: 30 };

  it("keeps the whole box inside the padded viewport", () => {
    const { longitude, latitude, zoom } = frameBounds(INDIA, 1000, 700, 50);
    const centre = toWorldPixels([longitude, latitude], zoom);
    const nw = toWorldPixels([INDIA.west, INDIA.north], zoom);
    const se = toWorldPixels([INDIA.east, INDIA.south], zoom);
    expect(centre[0] - nw[0]).toBeLessThanOrEqual(450 + 1e-6);
    expect(se[0] - centre[0]).toBeLessThanOrEqual(450 + 1e-6);
    expect(centre[1] - nw[1]).toBeLessThanOrEqual(300 + 1e-6);
    expect(se[1] - centre[1]).toBeLessThanOrEqual(300 + 1e-6);
  });

  it("keeps the box clear of uneven insets, such as a legend along the bottom", () => {
    const insets = { top: 60, right: 40, bottom: 110, left: 40 };
    const width = 1000;
    const height = 460;
    const { longitude, latitude, zoom } = frameBounds(INDIA, width, height, insets);
    const centre = toWorldPixels([longitude, latitude], zoom);
    const nw = toWorldPixels([INDIA.west, INDIA.north], zoom);
    const se = toWorldPixels([INDIA.east, INDIA.south], zoom);
    // Screen position = world offset from the camera centre + half the viewport.
    const screen = (p: readonly number[]) => [
      p[0] - centre[0] + width / 2,
      p[1] - centre[1] + height / 2,
    ];
    const [left, top] = screen(nw);
    const [right, bottom] = screen(se);
    expect(left).toBeGreaterThanOrEqual(insets.left - 1e-6);
    expect(top).toBeGreaterThanOrEqual(insets.top - 1e-6);
    expect(right).toBeLessThanOrEqual(width - insets.right + 1e-6);
    expect(bottom).toBeLessThanOrEqual(height - insets.bottom + 1e-6);
    // The height binds here, so the box is centred in the room the insets leave.
    expect((top + bottom) / 2).toBeCloseTo((insets.top + height - insets.bottom) / 2, 6);
  });

  it("zooms further into a smaller box", () => {
    const wide = frameBounds({ west: -100, south: -40, east: 135, north: 60 }, 1000, 700);
    const narrow = frameBounds(INDIA, 1000, 700);
    expect(narrow.zoom).toBeGreaterThan(wide.zoom);
  });

  it("caps a single point at the frame limit instead of zooming forever", () => {
    const point = frameBounds({ west: 80, south: 13, east: 80, north: 13 }, 1000, 700);
    expect(point.zoom).toBe(MAX_FRAME_ZOOM);
    expect(point.longitude).toBeCloseTo(80, 6);
    expect(point.latitude).toBeCloseTo(13, 6);
  });

  it("never frames wider than the minimum zoom, even in a tiny viewport", () => {
    const world = frameBounds({ west: -180, south: -80, east: 180, north: 80 }, 80, 80);
    expect(world.zoom).toBe(MIN_ZOOM);
  });
});

describe("globe zoom", () => {
  /* deck.gl 9.4: diameter = 512 · 2^(z − log2(π·cos φ)). */
  const diameter = (zoom: number, latitude: number) =>
    512 * 2 ** (zoom - globeZoomAdjust(latitude));

  it("runs log2(π) ahead of the flat map at the equator", () => {
    expect(globeZoomAdjust(0)).toBeCloseTo(Math.log2(Math.PI), 10);
    expect(toGlobeZoom(2, 0)).toBeCloseTo(2 + Math.log2(Math.PI), 10);
  });

  it("stays finite at the poles", () => {
    expect(Number.isFinite(globeZoomAdjust(90))).toBe(true);
    expect(Number.isFinite(globeZoomAdjust(-90))).toBe(true);
  });

  it("converts back to the flat map, clamped to its range", () => {
    expect(toMapZoom(toGlobeZoom(3, 40), 40)).toBeCloseTo(3, 10);
    expect(toMapZoom(-5, 0)).toBe(MIN_ZOOM);
  });

  it("fits the whole globe inside the shorter side, with padding", () => {
    const zoom = wholeGlobeZoom(1200, 316, 20, 16);
    expect(diameter(zoom, 20)).toBeCloseTo(316 - 32, 6);
  });
});

describe("sphericalCentre", () => {
  it("is null for nothing", () => {
    expect(sphericalCentre([])).toBeNull();
  });

  it("follows where the points are, not the box around them", () => {
    const india: LonLat[] = Array.from({ length: 20 }, () => [78, 18]);
    const [lon] = sphericalCentre([...india, [-95, 30], [140, 36]])!;
    expect(lon).toBeGreaterThan(60);
    expect(lon).toBeLessThan(95);
  });

  it("averages across the antimeridian without swinging round the world", () => {
    const [lon] = sphericalCentre([
      [179, 0],
      [-179, 0],
    ])!;
    expect(Math.abs(lon)).toBeCloseTo(180, 6);
  });
});

describe("frameGlobe", () => {
  const world: LonLat[] = [
    ...Array.from({ length: 20 }, (): LonLat => [78, 18]),
    [-95, 30],
    [140, 36],
    [10, 55],
  ];

  it("is null for nothing", () => {
    expect(frameGlobe([], 1200, 316)).toBeNull();
  });

  it("shows the whole globe, facing the network, when the content wraps round it", () => {
    const framing = frameGlobe(world, 1200, 316)!;
    expect(framing.zoom).toBeCloseTo(wholeGlobeZoom(1200, 316, framing.latitude), 10);
    expect(framing.longitude).toBeGreaterThan(50);
  });

  it("keeps the flat map's centre and ground scale for a regional view", () => {
    const region: LonLat[] = [
      [70, 8],
      [90, 28],
    ];
    const flat = frameBounds(boundsOf(region)!, 1200, 600);
    const globe = frameGlobe(region, 1200, 600)!;
    expect(globe.longitude).toBeCloseTo(flat.longitude, 10);
    expect(globe.zoom).toBeCloseTo(toGlobeZoom(flat.zoom, flat.latitude), 10);
  });

  it("never frames smaller than the whole globe", () => {
    const globe = frameGlobe([[80, 13]], 1200, 600)!;
    expect(globe.zoom).toBeGreaterThanOrEqual(wholeGlobeZoom(1200, 600, 13));
  });
});

describe("chromeInsets", () => {
  it("keeps the side columns clear on a wide map", () => {
    expect(chromeInsets(1200)).toBe(CHROME_INSETS);
  });

  it("leaves a narrow column real room to frame into", () => {
    const insets = chromeInsets(330);
    expect(insets).toBe(COMPACT_INSETS);
    expect(330 - insets.left - insets.right).toBeGreaterThan(240);
  });
});
