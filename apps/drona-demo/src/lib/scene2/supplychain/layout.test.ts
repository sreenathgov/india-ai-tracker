import { describe, expect, it } from "vitest";
import { supplyChainGraphFor, SUPPLY_CHAIN_GRAPHS } from "./index";
import { edgePath, FAN_ROWS, fanPath, layoutGraph, sizeOf } from "./layout";
import { applyView, DEFAULT_VIEW, setMode } from "./view";

const deccan = supplyChainGraphFor("c1", "sup:deccan-mainshaft-forgings")!;
const critical = applyView(deccan, DEFAULT_VIEW);

describe("layoutGraph", () => {
  it("survives an empty view", () => {
    const empty = layoutGraph({ nodes: [], edges: [] });
    expect([empty.boxes.size, empty.width, empty.height]).toEqual([0, 0, 0]);
  });

  it("places every visible card exactly once", () => {
    const layout = layoutGraph(critical);
    expect(layout.boxes.size).toBe(critical.nodes.length);
    for (const node of critical.nodes) expect(layout.boxes.has(node.id)).toBe(true);
  });

  it("puts the same graph in the same place every time", () => {
    const a = layoutGraph(critical);
    const b = layoutGraph(critical);
    for (const [id, box] of a.boxes) expect(b.boxes.get(id)).toEqual(box);
  });

  it("runs the order left and each step of the network to its right", () => {
    const layout = layoutGraph(critical);
    for (const node of critical.nodes) {
      if (!node.parentId) continue;
      const parent = layout.boxes.get(node.parentId);
      if (!parent) continue;
      expect(layout.boxes.get(node.id)!.x).toBeGreaterThan(parent.x + parent.width - 1);
    }
  });

  it("sits a parent at the midpoint of what it depends on", () => {
    const wide = applyView(deccan, setMode(DEFAULT_VIEW, "relevant"));
    const layout = layoutGraph(wide);
    const processor = wide.nodes.find((node) => node.name === "Jalna Alloy Supply")!;
    const sources = wide.nodes.filter((node) => node.parentId === processor.id);
    expect(sources.length).toBeGreaterThanOrEqual(2);
    const centres = sources.map((node) => layout.boxes.get(node.id)!.cy).sort((a, b) => a - b);
    const midpoint = (centres[0] + centres[centres.length - 1]) / 2;
    expect(layout.boxes.get(processor.id)!.cy).toBeCloseTo(midpoint, 6);
  });

  it("never overlaps two cards", () => {
    for (const graph of SUPPLY_CHAIN_GRAPHS.values()) {
      const visible = applyView(graph, setMode(DEFAULT_VIEW, "mapped"));
      const boxes = [...layoutGraph(visible).boxes.values()];
      for (let i = 0; i < boxes.length; i += 1) {
        for (let j = i + 1; j < boxes.length; j += 1) {
          const a = boxes[i];
          const b = boxes[j];
          const apart =
            a.x + a.width <= b.x || b.x + b.width <= a.x || a.y + a.height <= b.y || b.y + b.height <= a.y;
          expect(apart, `${a.id} overlaps ${b.id}`).toBe(true);
        }
      }
    }
  });

  it("keeps every card inside the canvas it reports", () => {
    const layout = layoutGraph(critical);
    for (const box of layout.boxes.values()) {
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.y).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(layout.width);
      expect(box.y + box.height).toBeLessThanOrEqual(layout.height);
    }
  });

  it("draws a deeper supplier smaller than the Tier-1", () => {
    const wide = applyView(deccan, setMode(DEFAULT_VIEW, "relevant"));
    const tierOne = wide.nodes.find((node) => node.type === "supplier" && node.tier === 1)!;
    const deeper = wide.nodes.find((node) => node.type === "supplier" && (node.tier ?? 1) > 1)!;
    expect(sizeOf(deeper)[0]).toBeLessThan(sizeOf(tierOne)[0]);
  });
});

describe("edgePath", () => {
  const a = { id: "a", x: 0, y: 0, width: 100, height: 50, cx: 50, cy: 25 };
  const b = { id: "b", x: 200, y: 120, width: 100, height: 50, cx: 250, cy: 145 };

  it("leaves the dependent's right edge and arrives at the dependency's left", () => {
    expect(edgePath(a, b)).toMatch(/^M 100 25 C .* 200 145$/);
  });

  it("drops a lateral connection below both cards instead of stepping right", () => {
    const lateral = edgePath(a, b, true);
    expect(lateral).toMatch(/^M 50 50 C /);
    expect(lateral).toContain("192");
  });
});

/**
 * "All mapped" hangs everything Drona holds behind the Tier-1 off one card. Stacked
 * in a single column that is a wall no canvas can show, so a wide fan of background
 * parties is packed into lanes and its connectors are bundled over the top.
 */
describe("a wide fan of background parties", () => {
  const mapped = applyView(deccan, setMode(DEFAULT_VIEW, "mapped"));
  const layout = layoutGraph(mapped);
  const fan = [...layout.fans.values()][0];

  it("packs into lanes rather than one tall column", () => {
    expect(layout.fans.size).toBeGreaterThan(0);
    expect(Math.max(...fan.lanes.values())).toBeGreaterThan(0);
  });

  it("stays shorter than the column it would have made unpacked", () => {
    const members = fan.lanes.size;
    expect(members).toBeGreaterThan(FAN_ROWS);
    const tops = [...fan.lanes.keys()].map((id) => layout.boxes.get(id)!.y);
    expect(Math.max(...tops) - Math.min(...tops)).toBeLessThan((members - 1) * 130);
  });

  it("gives each lane its own band, so no two lanes overlap", () => {
    const bands = [...new Set(fan.lanes.values())].sort((a, b) => a - b);
    expect(bands.length).toBeGreaterThan(1);
    /* Read each lane's span, and check the next one starts to the right of it. */
    const spans = bands.map((band) => {
      const boxes = [...fan.lanes.entries()]
        .filter(([, lane]) => lane === band)
        .map(([id]) => layout.boxes.get(id)!);
      return [Math.min(...boxes.map((b) => b.x)), Math.max(...boxes.map((b) => b.x + b.width))];
    });
    for (let i = 1; i < spans.length; i += 1) expect(spans[i][0]).toBeGreaterThan(spans[i - 1][1]);
  });

  it("runs the bundle above every card it serves", () => {
    for (const id of fan.lanes.keys()) expect(fan.railY).toBeLessThan(layout.boxes.get(id)!.y);
  });
});

describe("fanPath", () => {
  const parent = { id: "p", x: 0, y: 300, width: 100, height: 50, cx: 50, cy: 325 };
  const child = { id: "c", x: 400, y: 100, width: 100, height: 50, cx: 450, cy: 125 };
  const route = { railY: 60, riserX: 160, laneX: [380, 620], lanes: new Map([["c", 0]]) };

  it("leaves the parent, rises to the rail and drops into the card's left edge", () => {
    const d = fanPath(parent, child, route, 0);
    expect(d.startsWith("M 100 325")).toBe(true);
    expect(d.endsWith("400 125")).toBe(true);
    expect(d).toContain("60");
  });

  it("drops a second lane at its own x, not the first lane's", () => {
    expect(fanPath(parent, child, route, 1)).toContain("620");
  });
});
