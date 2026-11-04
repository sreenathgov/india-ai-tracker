import { describe, expect, it } from "vitest";

import { MAX_LATITUDE, TILE_SIZE, fromWorldPixels, toWorldPixels } from "./mercator";

describe("Web-Mercator world pixels", () => {
  it("puts the null island at the centre of the world square", () => {
    expect(toWorldPixels([0, 0], 0)).toEqual([TILE_SIZE / 2, TILE_SIZE / 2]);
  });

  it("doubles the world per zoom level", () => {
    const [x0] = toWorldPixels([90, 0], 0);
    const [x1] = toWorldPixels([90, 0], 1);
    expect(x1).toBeCloseTo(x0 * 2, 9);
  });

  it("puts north up — a higher latitude is a smaller y", () => {
    expect(toWorldPixels([0, 50], 0)[1]).toBeLessThan(toWorldPixels([0, 10], 0)[1]);
  });

  it("round-trips a position at any zoom", () => {
    for (const zoom of [0, 1.35, 4, 8]) {
      const [lon, lat] = fromWorldPixels(toWorldPixels([80.05, 12.92], zoom), zoom);
      expect(lon).toBeCloseTo(80.05, 9);
      expect(lat).toBeCloseTo(12.92, 9);
    }
  });

  it("clamps the poles instead of running to infinity", () => {
    const [, y] = toWorldPixels([0, 90], 0);
    expect(Number.isFinite(y)).toBe(true);
    expect(fromWorldPixels([0, y], 0)[1]).toBeCloseTo(MAX_LATITUDE, 4);
  });
});
