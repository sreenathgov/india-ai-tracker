import { describe, expect, it } from "vitest";

import { distanceKm, dotted, greatCircle } from "./flowPath";
import type { LonLat } from "./mercator";

const CHENNAI: LonLat = [80.05, 12.92];
const ESBJERG: LonLat = [8.45, 55.47];
const KITAKYUSHU: LonLat = [130.88, 33.88];
const CORPUS: LonLat = [-97.4, 27.8];

describe("distanceKm", () => {
  it("is zero for a point and itself", () => {
    expect(distanceKm(CHENNAI, CHENNAI)).toBeCloseTo(0, 6);
  });

  it("gets a known route roughly right — Chennai to Esbjerg is about 7,700 km", () => {
    expect(distanceKm(CHENNAI, ESBJERG)).toBeGreaterThan(7500);
    expect(distanceKm(CHENNAI, ESBJERG)).toBeLessThan(7850);
  });
});

describe("greatCircle", () => {
  it("starts and ends exactly on its endpoints", () => {
    const path = greatCircle(CHENNAI, KITAKYUSHU, 32);
    expect(path).toHaveLength(33);
    expect(path[0][0]).toBeCloseTo(CHENNAI[0], 9);
    expect(path[0][1]).toBeCloseTo(CHENNAI[1], 9);
    expect(path[32][0]).toBeCloseTo(KITAKYUSHU[0], 9);
    expect(path[32][1]).toBeCloseTo(KITAKYUSHU[1], 9);
  });

  it("bows toward the pole, as a real route does", () => {
    const path = greatCircle(CHENNAI, ESBJERG, 16);
    const midpoint = path[8];
    expect(midpoint[1]).toBeGreaterThan((CHENNAI[1] + ESBJERG[1]) / 2);
  });

  it("never jumps more than 180° of longitude between neighbours", () => {
    const path = greatCircle(KITAKYUSHU, CORPUS, 64);
    for (let i = 1; i < path.length; i += 1) {
      expect(Math.abs(path[i][0] - path[i - 1][0])).toBeLessThan(180);
    }
  });

  it("does not divide by zero for coincident points", () => {
    expect(greatCircle(CHENNAI, CHENNAI)).toEqual([CHENNAI, CHENNAI]);
  });
});

describe("dotted", () => {
  it("spaces dots evenly along the ground", () => {
    const path = greatCircle(CHENNAI, ESBJERG, 64);
    const dots = dotted(path, 400);
    const total = distanceKm(CHENNAI, ESBJERG);
    expect(dots.length).toBe(Math.floor(total / 400) + 1);
    for (let i = 1; i < dots.length; i += 1) {
      expect(distanceKm(dots[i - 1], dots[i])).toBeCloseTo(400, -1);
    }
  });

  it("returns nothing for an empty path or a nonsense spacing", () => {
    expect(dotted([], 100)).toEqual([]);
    expect(dotted([CHENNAI, ESBJERG], 0)).toEqual([]);
  });
});
