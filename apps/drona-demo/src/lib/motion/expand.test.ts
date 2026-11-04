import { describe, expect, it } from "vitest";

import { EXPAND_TIMING, contentFadeKeyframes, expandKeyframes } from "./expand";

const card = { x: 300, y: 500, width: 240, height: 160 };
const workspace = { x: 100, y: 100, width: 1200, height: 700 };

describe("expandKeyframes", () => {
  it("starts clipped to the card and ends at the full workspace", () => {
    const frames = expandKeyframes(card, workspace, false);
    /* top 400, right 1300 - 540 = 760, bottom 800 - 660 = 140, left 200. */
    expect(frames[0]!.clipPath).toBe("inset(400px 760px 140px 200px round 14px)");
    expect(frames.at(-1)!.clipPath).toBe("inset(0px 0px 0px 0px round 20px)");
    expect(frames.at(-1)!.opacity).toBe(1);
  });

  it("never scales, so text is never distorted", () => {
    for (const frame of expandKeyframes(card, workspace, false)) expect(frame.transform).toBeUndefined();
  });

  it("clamps a card lying partly outside the workspace", () => {
    const frames = expandKeyframes({ x: 20, y: 760, width: 240, height: 160 }, workspace, false);
    const insets = /inset\(([^)]+) round/.exec(String(frames[0]!.clipPath))![1]!.split(" ").map(parseFloat);
    for (const n of insets) expect(n).toBeGreaterThanOrEqual(0);
    expect(insets[0]! + insets[2]!).toBeLessThanOrEqual(workspace.height);
    expect(insets[1]! + insets[3]!).toBeLessThanOrEqual(workspace.width);
  });

  it("fades only when motion is reduced", () => {
    expect(expandKeyframes(card, workspace, true)).toEqual([{ opacity: 0 }, { opacity: 1 }]);
  });

  it("rises quietly when there is no card to grow from", () => {
    const frames = expandKeyframes(null, workspace, false);
    expect(frames[0]).toEqual({ opacity: 0, transform: "translateY(8px)" });
    expect(frames.at(-1)).toEqual({ opacity: 1, transform: "translateY(0px)" });
  });
});

describe("contentFadeKeyframes", () => {
  it("holds the content back until the container has mostly opened", () => {
    const frames = contentFadeKeyframes(false);
    expect(frames[0]).toEqual({ opacity: 0, offset: 0 });
    expect(frames[1]!.opacity).toBe(0);
    expect(frames[1]!.offset).toBeGreaterThanOrEqual(0.3);
    expect(frames.at(-1)).toEqual({ opacity: 1, offset: 1 });
  });

  it("does nothing extra under reduced motion", () => {
    expect(contentFadeKeyframes(true)).toEqual([{ opacity: 1 }, { opacity: 1 }]);
  });
});

describe("EXPAND_TIMING", () => {
  it("stays inside 220–320ms, open and close", () => {
    expect(EXPAND_TIMING.delayMs + EXPAND_TIMING.inMs).toBeLessThanOrEqual(320);
    expect(EXPAND_TIMING.inMs).toBeGreaterThanOrEqual(220);
    expect(EXPAND_TIMING.outMs).toBeGreaterThanOrEqual(220);
    expect(EXPAND_TIMING.outMs).toBeLessThanOrEqual(320);
    expect(EXPAND_TIMING.reducedMs).toBeLessThan(EXPAND_TIMING.outMs);
  });

  it("never overshoots", () => {
    const [, y1, , y2] = /cubic-bezier\(([^)]+)\)/.exec(EXPAND_TIMING.easing)![1]!.split(",").map(Number);
    expect(y1).toBeLessThanOrEqual(1);
    expect(y2).toBeLessThanOrEqual(1);
  });
});
