import { describe, expect, it } from "vitest";
import {
  clampScale,
  fitFrame,
  frameOn,
  LEGIBLE_SCALE,
  MAX_SCALE,
  MIN_SCALE,
  PAD,
  panBy,
  zoomAt,
} from "./frame";
import { supplyChainGraphFor } from "./index";
import { layoutGraph } from "./layout";
import { applyView, DEFAULT_VIEW, setMode } from "./view";

const deccan = supplyChainGraphFor("c1", "sup:deccan-mainshaft-forgings")!;
const layout = layoutGraph(applyView(deccan, DEFAULT_VIEW));

describe("clampScale", () => {
  it("never magnifies past the designed card size", () => {
    expect(clampScale(2.4)).toBe(MAX_SCALE);
  });

  it("keeps a card legible at the far end", () => {
    expect(clampScale(0.05)).toBe(MIN_SCALE);
  });
});

describe("fitFrame", () => {
  it("returns an identity frame rather than dividing by a zero dimension", () => {
    expect(fitFrame(layout, { width: 0, height: 600 })).toEqual({ scale: 1, x: 0, y: 0 });
    expect(fitFrame({ boxes: new Map(), fans: new Map(), anchorId: null, width: 0, height: 0 }, { width: 900, height: 600 })).toEqual({
      scale: 1,
      x: 0,
      y: 0,
    });
  });

  it("shrinks a graph wider than the canvas until the whole path is in view", () => {
    /* Wide enough that the whole path still fits at a legible size — past that the
       canvas frames instead of shrinking, which the next case covers. */
    const viewport = { width: layout.width * LEGIBLE_SCALE + PAD * 4, height: layout.height + 400 };
    const frame = fitFrame(layout, viewport);
    expect(frame.scale).toBeLessThan(1);
    expect(layout.width * frame.scale).toBeLessThanOrEqual(viewport.width - PAD * 2 + 0.001);
  });

  it("stops shrinking at the legibility floor, and lets the reader pan the rest", () => {
    /* A canvas this narrow cannot hold the graph at a size anyone could read, so the
       canvas holds a legible scale and pans instead of shrinking to the zoom floor. */
    expect(fitFrame(layout, { width: 300, height: 300 }).scale).toBe(LEGIBLE_SCALE);
  });

  it("leaves a graph that already fits at full size, centred", () => {
    const viewport = { width: layout.width + 400, height: layout.height + 400 };
    const frame = fitFrame(layout, viewport);
    expect(frame.scale).toBe(1);
    expect(frame.x).toBeCloseTo((viewport.width - layout.width) / 2);
    expect(frame.y).toBeCloseTo((viewport.height - layout.height) / 2);
  });
});

describe("panBy", () => {
  it("moves without touching the zoom, and without mutating the frame", () => {
    const frame = { scale: 0.8, x: 10, y: 20 };
    const moved = panBy(frame, 5, -7);
    expect(moved).toEqual({ scale: 0.8, x: 15, y: 13 });
    expect(frame).toEqual({ scale: 0.8, x: 10, y: 20 });
  });
});

describe("zoomAt", () => {
  it("keeps whatever is under the pointer under the pointer", () => {
    const frame = { scale: 0.8, x: 40, y: 60 };
    const [px, py] = [300, 220];
    /* The graph coordinate beneath the pointer, before and after. */
    const before = [(px - frame.x) / frame.scale, (py - frame.y) / frame.scale];
    const zoomed = zoomAt(frame, 0.8, px, py);
    const after = [(px - zoomed.x) / zoomed.scale, (py - zoomed.y) / zoomed.scale];
    expect(after[0]).toBeCloseTo(before[0]);
    expect(after[1]).toBeCloseTo(before[1]);
  });

  it("stops at the bounds rather than running past them", () => {
    expect(zoomAt({ scale: 1, x: 0, y: 0 }, 3, 100, 100).scale).toBe(MAX_SCALE);
    expect(zoomAt({ scale: MIN_SCALE, x: 0, y: 0 }, 0.5, 100, 100).scale).toBe(MIN_SCALE);
  });
});

describe("frameOn", () => {
  const viewport = { width: 800, height: 500 };
  const box = { x: 0, y: 0, width: 200, height: 80 };

  it("leaves a card that is already on screen exactly where it is", () => {
    const frame = { scale: 1, x: 200, y: 150 };
    expect(frameOn(frame, box, viewport)).toBe(frame);
  });

  it("pulls a card back from beyond the right edge without zooming out", () => {
    const frame = { scale: 1, x: 900, y: 150 };
    const moved = frameOn(frame, box, viewport);
    expect(moved.scale).toBe(1);
    expect(moved.x + box.width).toBeCloseTo(viewport.width - PAD);
  });

  it("pulls a card back from above the top edge", () => {
    const moved = frameOn({ scale: 1, x: 200, y: -140 }, box, viewport);
    expect(moved.y).toBeCloseTo(PAD);
  });
});

/**
 * Some graphs are simply larger than any canvas at a size anyone can read. Shrinking
 * them to the floor produced an unreadable graph that still did not fit — so past the
 * legibility threshold the canvas stops fitting and starts framing: it holds a
 * readable size, puts the order at the left, and lets the reader pan.
 */
describe("fitFrame past the legibility threshold", () => {
  const mapped = layoutGraph(applyView(deccan, setMode(DEFAULT_VIEW, "mapped")));
  const viewport = { width: 1153, height: 400 };

  it("frames at a readable scale instead of shrinking to the floor", () => {
    const frame = fitFrame(mapped, viewport);
    expect(frame.scale).toBe(LEGIBLE_SCALE);
    expect(frame.scale).toBeGreaterThan(MIN_SCALE);
  });

  it("puts the order at the left rather than centring a graph that overflows", () => {
    expect(fitFrame(mapped, viewport).x).toBe(PAD);
  });

  it("opens on the supplier under investigation", () => {
    const frame = fitFrame(mapped, viewport);
    const anchor = mapped.boxes.get(mapped.anchorId!)!;
    const top = frame.y + anchor.y * frame.scale;
    expect(top).toBeGreaterThanOrEqual(0);
    expect(top + anchor.height * frame.scale).toBeLessThanOrEqual(viewport.height);
  });

  it("never leaves a gap above or below a graph taller than the canvas", () => {
    const frame = fitFrame(mapped, viewport);
    expect(frame.y).toBeLessThanOrEqual(PAD);
    expect(frame.y + mapped.height * frame.scale).toBeGreaterThanOrEqual(viewport.height - PAD);
  });

  it("still fits and centres a graph that fits at a readable size", () => {
    const frame = fitFrame(layout, { width: layout.width + 400, height: layout.height + 400 });
    expect(frame.scale).toBe(1);
  });
});

/**
 * A graph that overflows by a hair should be clipped by a hair. Reserving a margin on
 * an edge the reader cannot reach the end of costs real graph for no readable gain.
 */
describe("fitFrame when the graph barely overflows", () => {
  it("clips by the overflow and no more", () => {
    /* Four pixels shy of holding the whole graph at a legible size. */
    const height = Math.round(layout.height * LEGIBLE_SCALE) - 4;
    const frame = fitFrame(layout, { width: 400, height });
    const content = layout.height * frame.scale;
    expect(frame.y).toBeGreaterThan(-(content - height) - 0.001);
    expect(frame.y).toBeLessThanOrEqual(0);
  });
});
