import { describe, expect, it } from "vitest";
import { SUPPLY_CHAIN_GRAPHS, supplyChainGraphFor } from "./index";
import { applyView, DEFAULT_VIEW, isFiltered, setMode, setTier, toggleKind, withheldCount } from "./view";
import type { GraphView } from "./view";

const deccan = supplyChainGraphFor("c1", "sup:deccan-mainshaft-forgings")!;
const count = (view: GraphView) => applyView(deccan, view).nodes.length;

describe("the three view modes", () => {
  it("opens on the critical path", () => {
    expect(DEFAULT_VIEW.mode).toBe("critical");
  });

  it("widens at each step, and each step differs from the last", () => {
    const critical = count(DEFAULT_VIEW);
    const relevant = count(setMode(DEFAULT_VIEW, "relevant"));
    const mapped = count(setMode(DEFAULT_VIEW, "mapped"));
    expect(critical).toBeLessThan(relevant);
    expect(relevant).toBeLessThan(mapped);
  });

  it("shows only the critical path by default", () => {
    const visible = applyView(deccan, DEFAULT_VIEW);
    for (const node of visible.nodes) expect(deccan.criticalPathIds.has(node.id)).toBe(true);
  });

  it("keeps background parties out of every view but 'all mapped'", () => {
    for (const mode of ["critical", "relevant"] as const) {
      const visible = applyView(deccan, setMode(DEFAULT_VIEW, mode));
      expect(visible.nodes.some((node) => node.context)).toBe(false);
    }
    expect(applyView(deccan, setMode(DEFAULT_VIEW, "mapped")).nodes.some((node) => node.context)).toBe(true);
  });

  it("never marks a background party as being in concern", () => {
    for (const graph of SUPPLY_CHAIN_GRAPHS.values()) {
      for (const node of graph.nodes) {
        if (node.context) expect(node.concern).toBe("normal");
      }
    }
  });
});

describe("the depth control", () => {
  it("resolves fewer objects at each shallower tier", () => {
    /* Background plate suppliers still reach Tier 3; regulatory requirements never acquire supplier tiers. */
    const tiruchi = supplyChainGraphFor("c1", "sup:tiruchi-tower-sections")!;
    const relevant = setMode(DEFAULT_VIEW, "mapped");
    const at = (tier: 1 | 2 | 3) => applyView(tiruchi, setTier(relevant, tier)).nodes.length;
    expect(at(1)).toBeLessThan(at(2));
    expect(at(2)).toBeLessThan(at(3));
  });

  it("keeps the order and the component at every depth", () => {
    const visible = applyView(deccan, setTier(setMode(DEFAULT_VIEW, "relevant"), 1));
    expect(visible.nodes.some((node) => node.type === "order")).toBe(true);
    expect(visible.nodes.some((node) => node.type === "component")).toBe(true);
  });
});

describe("object filters", () => {
  it("toggles without mutating the view it was given", () => {
    const before = DEFAULT_VIEW;
    const after = toggleKind(before, "material");
    expect(before.hidden.has("material")).toBe(false);
    expect(after.hidden.has("material")).toBe(true);
    expect(toggleKind(after, "material").hidden.has("material")).toBe(false);
    expect(isFiltered(before)).toBe(false);
    expect(isFiltered(after)).toBe(true);
  });

  it("still shows a hidden object where the concern runs through it", () => {
    const view = toggleKind(setMode(DEFAULT_VIEW, "relevant"), "material");
    const visible = applyView(deccan, view);
    const materials = visible.nodes.filter((node) => node.type === "material");
    expect(materials.length).toBeGreaterThan(0);
    for (const node of materials) expect(["active", "exposed", "unresolved"]).toContain(node.concern);
  });

  it("drops whatever a filter cuts adrift", () => {
    const view = toggleKind(setMode(DEFAULT_VIEW, "mapped"), "supplier");
    const visible = applyView(deccan, view);
    const present = new Set(visible.nodes.map((node) => node.id));
    for (const node of visible.nodes) {
      if (node.parentId) expect(present.has(node.parentId)).toBe(true);
    }
  });

  it("counts what it is holding back", () => {
    const wide = setMode(DEFAULT_VIEW, "mapped");
    expect(withheldCount(deccan, wide)).toBe(0);
    expect(withheldCount(deccan, DEFAULT_VIEW)).toBeGreaterThan(0);
  });
});

describe("every case", () => {
  it("opens on a readable critical path, never on one lone card", () => {
    for (const graph of SUPPLY_CHAIN_GRAPHS.values()) {
      const visible = applyView(graph, DEFAULT_VIEW);
      expect(visible.nodes.length).toBeGreaterThanOrEqual(4);
      expect(visible.nodes.length).toBeLessThan(graph.nodes.length);
    }
  });

  it("draws no edge to a card that is not on screen", () => {
    for (const graph of SUPPLY_CHAIN_GRAPHS.values()) {
      for (const mode of ["critical", "relevant", "mapped"] as const) {
        const visible = applyView(graph, setMode(DEFAULT_VIEW, mode));
        const present = new Set(visible.nodes.map((node) => node.id));
        for (const edge of visible.edges) {
          expect(present.has(edge.fromId)).toBe(true);
          expect(present.has(edge.toId)).toBe(true);
        }
      }
    }
  });
});
