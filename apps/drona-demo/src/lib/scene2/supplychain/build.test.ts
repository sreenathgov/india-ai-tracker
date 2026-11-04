import { describe, expect, it } from "vitest";
import { buildGraph, graphNodeId } from "./build";
import { SUPPLY_CHAIN_GRAPHS } from "./index";
import type { CaseGraph } from "./types";

const order = { key: "o", type: "order", name: "Order", detail: "", evidence: "verified", concern: "normal" } as const;
const part = { key: "p", type: "component", name: "Part", detail: "", evidence: "verified", concern: "normal" } as const;
const requires = { from: "o", to: "p", relation: "requires", evidence: "verified", concern: "normal", basis: "BOM" } as const;

const minimal: CaseGraph = { orderId: "c1", supplierId: "sup:x", rootKey: "o", nodes: [order, part], edges: [requires] };

describe("buildGraph", () => {
  it("refuses a duplicate key", () => {
    expect(() => buildGraph({ ...minimal, nodes: [order, part, part] })).toThrow(/duplicate node p/);
  });

  it("refuses a missing root", () => {
    expect(() => buildGraph({ ...minimal, rootKey: "nope" })).toThrow(/missing root/);
  });

  it("refuses an edge naming an unknown node", () => {
    expect(() => buildGraph({ ...minimal, edges: [requires, { ...requires, to: "ghost" }] })).toThrow(/unknown node ghost/);
  });

  it("refuses a node with no line back to the order", () => {
    const loose = { ...part, key: "loose" };
    expect(() => buildGraph({ ...minimal, nodes: [order, part, loose] })).toThrow(/loose does not reach o/);
  });

  it("refuses a dependence edge that does not lead away from the order", () => {
    expect(() => buildGraph({ ...minimal, edges: [requires, { ...requires, from: "p", to: "o" }] })).toThrow(
      /does not lead away from the order/,
    );
  });

  it("gives every node an id, a depth and a parent, and the order none", () => {
    const graph = buildGraph(minimal);
    const root = graph.nodes.find((node) => node.id === graphNodeId("o"))!;
    const child = graph.nodes.find((node) => node.id === graphNodeId("p"))!;
    expect(graph.rootId).toBe(graphNodeId("o"));
    expect([root.depth, root.parentId]).toEqual([0, null]);
    expect([child.depth, child.parentId]).toEqual([1, graphNodeId("o")]);
  });

  it("defaults provenance to empty rather than absent", () => {
    const graph = buildGraph(minimal);
    for (const node of graph.nodes) {
      expect(node.evidenceIds).toEqual([]);
      expect(node.reasoningClaimIds).toEqual([]);
    }
    expect(graph.edges[0].evidenceIds).toEqual([]);
  });
});

describe("tier", () => {
  it("counts supplier relationships only, and only suppliers carry one", () => {
    for (const graph of SUPPLY_CHAIN_GRAPHS.values()) {
      for (const node of graph.nodes) {
        if (node.type === "supplier") expect(node.tier).toBeGreaterThanOrEqual(1);
        else expect(node.tier).toBeUndefined();
      }
    }
  });

  it("puts the Tier-1 supplier one supplier relationship from the order", () => {
    for (const graph of SUPPLY_CHAIN_GRAPHS.values()) {
      const tierOnes = graph.nodes.filter((node) => node.type === "supplier" && node.tier === 1);
      expect(tierOnes.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("gives a material the tier of the supplier it hangs from, not one of its own", () => {
    const deccan = SUPPLY_CHAIN_GRAPHS.get("c1:sup:deccan-mainshaft-forgings")!;
    const billet = deccan.nodes.find((node) => node.name.includes("billet"))!;
    expect(billet.type).toBe("material");
    expect(billet.tier).toBeUndefined();
    expect(billet.tierScope).toBe(1);
  });
});

describe("the critical path", () => {
  it("holds everything in concern", () => {
    for (const graph of SUPPLY_CHAIN_GRAPHS.values()) {
      for (const node of graph.nodes) {
        if (node.concern !== "normal") expect(graph.criticalPathIds.has(node.id)).toBe(true);
      }
    }
  });

  it("reconnects every member to the order", () => {
    const byId = new Map<string, string | null>();
    for (const graph of SUPPLY_CHAIN_GRAPHS.values()) {
      byId.clear();
      for (const node of graph.nodes) byId.set(node.id, node.parentId);
      for (const id of graph.criticalPathIds) {
        let cursor: string | null | undefined = id;
        while (cursor && byId.get(cursor)) cursor = byId.get(cursor)!;
        expect(cursor).toBe(graph.rootId);
      }
    }
  });

  it("does not hold a quiet branch that leads nowhere", () => {
    const durgapur = SUPPLY_CHAIN_GRAPHS.get("c1:sup:durgapur-heat-treatment")!;
    const line = durgapur.nodes.find((node) => node.name === "Sealed quench line")!;
    expect(line.concern).toBe("normal");
    expect(durgapur.criticalPathIds.has(line.id)).toBe(false);
  });
});
