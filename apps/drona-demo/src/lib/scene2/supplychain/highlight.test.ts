import { describe, expect, it } from "vitest";
import { highlightFor, NO_HIGHLIGHT } from "./highlight";
import { supplyChainGraphFor } from "./index";
import type { GraphEdge, GraphNode } from "./types";
import { applyView, DEFAULT_VIEW, setMode, type VisibleGraph } from "./view";

const deccan = supplyChainGraphFor("c1", "sup:deccan-mainshaft-forgings")!;
const visible = applyView(deccan, setMode(DEFAULT_VIEW, "relevant"));

/** The node furthest from the order, so the chain back to it has something to prove. */
const deepest = [...visible.nodes].sort((a, b) => b.depth - a.depth)[0];

describe("highlightFor", () => {
  it("holds nothing up when nothing is held", () => {
    expect(highlightFor(visible, null)).toBe(NO_HIGHLIGHT);
  });

  it("holds nothing up for a card that is not on the canvas", () => {
    expect(highlightFor(visible, "sc:c1:nothing")).toBe(NO_HIGHLIGHT);
  });

  it("includes the card itself and everything directly connected to it", () => {
    const { nodeIds, edgeIds } = highlightFor(visible, deepest.id);
    expect(nodeIds.has(deepest.id)).toBe(true);
    for (const edge of visible.edges) {
      if (edge.fromId !== deepest.id && edge.toId !== deepest.id) continue;
      expect(edgeIds.has(edge.id)).toBe(true);
      expect(nodeIds.has(edge.fromId) && nodeIds.has(edge.toId)).toBe(true);
    }
  });

  it("carries the line back to the order, however deep the card sits", () => {
    const { nodeIds } = highlightFor(visible, deepest.id);
    const byId = new Map(visible.nodes.map((node) => [node.id, node] as const));
    let cursor = deepest.parentId;
    while (cursor) {
      expect(nodeIds.has(cursor)).toBe(true);
      cursor = byId.get(cursor)?.parentId ?? null;
    }
    expect(nodeIds.has(deccan.rootId)).toBe(true);
  });

  it("leaves the rest of the network out, rather than lighting the whole graph", () => {
    const { nodeIds } = highlightFor(visible, deccan.rootId);
    expect(nodeIds.size).toBeLessThan(visible.nodes.length);
  });

  it("terminates on a parent cycle instead of looping forever", () => {
    const node = (id: string, parentId: string | null): GraphNode => ({
      id,
      type: "supplier",
      name: id,
      detail: "",
      evidence: "verified",
      concern: "normal",
      facts: [],
      context: false,
      depth: 1,
      tierScope: 1,
      parentId,
      evidenceIds: [],
      reasoningClaimIds: [],
    });
    const edge: GraphEdge = {
      id: "e",
      fromId: "a",
      toId: "b",
      relation: "depends-on",
      evidence: "verified",
      concern: "normal",
      basis: "",
      evidenceIds: [],
      reasoningClaimIds: [],
    };
    const looped: VisibleGraph = { nodes: [node("a", "b"), node("b", "a")], edges: [edge] };
    expect([...highlightFor(looped, "a").nodeIds].sort()).toEqual(["a", "b"]);
  });
});
