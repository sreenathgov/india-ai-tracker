import { describe, expect, it } from "vitest";

import { flipKeyframes, OVERLAY_TIMING } from "./flip";

const card = { x: 100, y: 500, width: 300, height: 200 };
const overlay = { x: 400, y: 200, width: 600, height: 400 };

describe("flipKeyframes", () => {
  it("starts at the card's centre and ends at rest", () => {
    const frames = flipKeyframes(card, overlay, false);
    const first = frames[0]!;
    const last = frames[frames.length - 1]!;
    /* Card centre (250, 600) minus overlay centre (700, 400). */
    expect(first.transform).toMatch(/^translate\(-450px, 200px\) scale\(/);
    expect(first.opacity).toBe(0);
    expect(last.transform).toBe("translate(0px, 0px) scale(1)");
    expect(last.opacity).toBe(1);
  });

  it("holds scale within a restrained range, never collapsing or overshooting", () => {
    const tiny = flipKeyframes({ x: 0, y: 0, width: 10, height: 10 }, overlay, false);
    const scale = Number(/scale\(([\d.]+)\)/.exec(String(tiny[0]!.transform))![1]);
    expect(scale).toBeGreaterThanOrEqual(0.72);
    expect(scale).toBeLessThanOrEqual(1);
    const big = flipKeyframes({ x: 0, y: 0, width: 2000, height: 2000 }, overlay, false);
    expect(String(big[0]!.transform)).toMatch(/scale\(1\)$/);
  });

  it("fades only when motion is reduced", () => {
    const frames = flipKeyframes(card, overlay, true);
    expect(frames).toEqual([{ opacity: 0 }, { opacity: 1 }]);
  });

  it("falls back to a quiet rise when there is no origin", () => {
    const frames = flipKeyframes(null, overlay, false);
    expect(frames[0]!.transform).toBe("translate(0px, 6px) scale(0.98)");
  });

  it("keeps durations inside the brief's 180–320ms window", () => {
    for (const ms of [OVERLAY_TIMING.inMs, OVERLAY_TIMING.outMs]) {
      expect(ms).toBeGreaterThanOrEqual(180);
      expect(ms).toBeLessThanOrEqual(320);
    }
  });
});
