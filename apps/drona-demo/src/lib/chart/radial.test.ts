import { describe, expect, it } from "vitest";

import { arcPath, radialSegments } from "./radial";

const values = [
  { id: "a", value: 10 },
  { id: "b", value: 8 },
  { id: "c", value: 0 },
  { id: "d", value: 2 },
];

describe("radialSegments", () => {
  it("drops empty values and sweeps the circle less one gap per segment", () => {
    const segments = radialSegments(values, 2);
    expect(segments.map((s) => s.id)).toEqual(["a", "b", "d"]);
    const swept = segments.reduce((total, s) => total + (s.end - s.start), 0);
    expect(swept).toBeCloseTo(360 - 3 * 2);
  });

  it("sweeps each segment in proportion to its value", () => {
    const [a, b, d] = radialSegments(values, 2);
    const unit = (360 - 6) / 20;
    expect(a!.end - a!.start).toBeCloseTo(10 * unit);
    expect(b!.end - b!.start).toBeCloseTo(8 * unit);
    expect(d!.end - d!.start).toBeCloseTo(2 * unit);
  });

  it("starts at twelve o'clock and leaves a half gap either side", () => {
    const [a, b] = radialSegments(values, 2);
    expect(a!.start).toBeCloseTo(1);
    expect(b!.start - a!.end).toBeCloseTo(2);
  });

  it("returns nothing for an empty total", () => {
    expect(radialSegments([{ id: "x", value: 0 }], 2)).toEqual([]);
  });
});

describe("arcPath", () => {
  it("draws a quarter arc from twelve to three o'clock", () => {
    expect(arcPath(50, 50, 40, 0, 90)).toBe("M 50 10 A 40 40 0 0 1 90 50");
  });

  it("uses the large-arc flag past a half turn", () => {
    expect(arcPath(50, 50, 40, 0, 270)).toContain(" 0 1 1 ");
  });
});
