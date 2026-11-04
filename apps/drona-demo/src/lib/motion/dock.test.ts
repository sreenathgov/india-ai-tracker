import { describe, expect, it } from "vitest";

import { dockPanel, spotlightPath } from "./dock";

const VIEWPORT = { width: 1440, height: 900 } as const;

describe("dockPanel", () => {
  it("docks beside the card on the roomier side, top-aligned to it", () => {
    // Working capital: far right of the page, so the panel opens to its left.
    const origin = { x: 1100, y: 420, width: 320, height: 200 };
    const p = dockPanel(origin, VIEWPORT, 560);
    expect(p.side).toBe("left");
    expect(p.left).toBe(1100 - 16 - 560);
    expect(p.top).toBe(420);
  });

  it("opens to the right of a card on the left of the page", () => {
    const origin = { x: 16, y: 120, width: 560, height: 700 };
    const p = dockPanel(origin, VIEWPORT, 560);
    expect(p.side).toBe("right");
    expect(p.left).toBe(16 + 560 + 16);
  });

  it("lifts the panel so a card low on the page still leaves it room", () => {
    const origin = { x: 1100, y: 760, width: 320, height: 120 };
    const p = dockPanel(origin, VIEWPORT, 560);
    expect(p.top).toBeLessThan(760);
    expect(p.maxHeight).toBeGreaterThanOrEqual(420);
    expect(p.top + p.maxHeight).toBeLessThanOrEqual(900 - 16);
  });

  it("tucks against the card's edge when the roomier side is only a little short", () => {
    // Critical dependencies at 1440: 650px to its left, a 640px panel needs 672.
    const origin = { x: 650, y: 360, width: 430, height: 520 };
    const p = dockPanel(origin, VIEWPORT, 640);
    expect(p.side).toBe("left");
    expect(p.left).toBe(16);
    // Overlaps the card by at most the shortfall, so the card stays readable.
    expect(p.left + p.width - origin.x).toBeLessThanOrEqual(640 + 32 - 650);
  });

  it("tucks to the right margin when the right is the roomier, short side", () => {
    const origin = { x: 200, y: 100, width: 600, height: 400 };
    const p = dockPanel(origin, VIEWPORT, 700);
    expect(p.side).toBe("right");
    expect(p.left + p.width).toBe(1440 - 16);
  });

  it("never lets a tucked panel run past the viewport", () => {
    const origin = { x: 420, y: 100, width: 60, height: 200 };
    const p = dockPanel(origin, { width: 500, height: 800 }, 520);
    expect(p.left).toBeGreaterThanOrEqual(16);
    expect(p.left + p.width).toBeLessThanOrEqual(500 - 16);
  });

  it("centres when neither side has room", () => {
    const origin = { x: 200, y: 100, width: 1040, height: 400 };
    const p = dockPanel(origin, VIEWPORT, 720);
    expect(p.side).toBe("center");
    expect(p.left).toBe((1440 - 720) / 2);
  });

  it("centres without an origin", () => {
    const p = dockPanel(null, VIEWPORT, 560);
    expect(p.side).toBe("center");
    expect(p.top).toBeGreaterThanOrEqual(16);
  });

  it("never exceeds a narrow viewport", () => {
    const p = dockPanel(null, { width: 400, height: 700 }, 560);
    expect(p.left).toBe(16);
    expect(p.width).toBe(400 - 32);
  });
});

describe("spotlightPath", () => {
  it("is an even-odd path: the viewport, with the card cut out", () => {
    const d = spotlightPath(VIEWPORT, { x: 10, y: 20, width: 100, height: 50 }, 18);
    expect(d.startsWith("M0 0H1440V900H0Z")).toBe(true);
    expect(d).toContain("M28 20");
    expect((d.match(/A/g) ?? []).length).toBe(4);
  });

  it("clamps the radius to half the smaller side", () => {
    const d = spotlightPath(VIEWPORT, { x: 0, y: 0, width: 20, height: 10 }, 18);
    expect(d).toContain("A5 5");
  });
});
