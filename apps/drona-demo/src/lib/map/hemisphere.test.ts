import { describe, expect, it } from "vitest";

import { wholeGlobeZoom } from "./framing";
import { angularCos, facesCamera, horizonCos } from "./hemisphere";

describe("angularCos", () => {
  it("is 1 for the same point and -1 for its antipode", () => {
    expect(angularCos([80, 13], [80, 13])).toBeCloseTo(1, 10);
    expect(angularCos([80, 13], [-100, -13])).toBeCloseTo(-1, 10);
  });

  it("is 0 a quarter of the way round", () => {
    expect(angularCos([0, 0], [90, 0])).toBeCloseTo(0, 10);
  });
});

describe("horizonCos", () => {
  it("sees most of a hemisphere when the whole globe is in view", () => {
    const zoom = wholeGlobeZoom(1036, 463, 20);
    const cos = horizonCos(zoom, 20, 463);
    expect(cos).toBeGreaterThan(0);
    expect(cos).toBeLessThan(0.4);
  });

  it("sees a smaller cap the closer the camera comes", () => {
    expect(horizonCos(5, 20, 463)).toBeGreaterThan(horizonCos(2, 20, 463));
  });

  it("never exceeds 1", () => {
    expect(horizonCos(20, 0, 463)).toBeLessThanOrEqual(1);
  });
});

describe("facesCamera", () => {
  const facing = { centre: [78, 20] as const, minCos: 0.25 };

  it("keeps a mark near the camera's target", () => {
    expect(facesCamera([80, 13], facing)).toBe(true);
  });

  it("drops a mark on the far side of the world", () => {
    expect(facesCamera([-97, 28], facing)).toBe(false);
  });
});
