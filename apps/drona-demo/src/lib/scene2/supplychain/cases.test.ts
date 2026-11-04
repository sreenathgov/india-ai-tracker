import { describe, expect, it } from "vitest";
import { SUBTIER_NODES } from "@/lib/network/subtier";
import { SUPPLIERS } from "@/lib/network/suppliers";
import { investigationFor } from "@/lib/scene2/investigation";
import { SUPPLY_CHAIN_GRAPHS } from "./index";
import type { DependencyGraph } from "./types";

const cases = [...SUPPLY_CHAIN_GRAPHS.entries()];

describe("every case graph", () => {
  it.each(cases)("%s answers the question it exists to answer", (_key, graph) => {
    const root = graph.nodes.find((node) => node.id === graph.rootId)!;
    expect(root.type).toBe("order");
    expect(graph.nodes.filter((node) => node.type === "component").length).toBeGreaterThanOrEqual(1);
    expect(graph.nodes.some((node) => node.type === "supplier" && node.concern === "active")).toBe(true);
    expect(graph.nodes.some((node) => node.concern === "exposed" || node.concern === "unresolved")).toBe(true);
  });

  it.each(cases)("%s explains every object it puts in concern", (_key, graph) => {
    for (const node of graph.nodes) {
      if (node.concern === "normal" || node.concern === "active") continue;
      expect(node.concernNote, `${node.name} carries concern without a reason`).toBeTruthy();
    }
  });

  it.each(cases)("%s gives every relationship a basis", (_key, graph) => {
    for (const edge of graph.edges) expect(edge.basis.length).toBeGreaterThan(0);
  });

  it.each(cases)("%s resolves every sub-tier party it claims", (_key, graph) => {
    for (const node of graph.nodes) {
      if (node.subTierNodeId) expect(SUBTIER_NODES.has(node.subTierNodeId)).toBe(true);
    }
  });
});

/** The Phase 4B hooks: every id a node cites must exist in the investigation. */
const registers = (graph: DependencyGraph) => {
  const inv = investigationFor(graph.orderId, graph.supplierId);
  if (!inv) throw new Error(`no investigation for ${graph.supplierId}`);
  return {
    evidence: new Set(inv.evidence.map((item) => item.id)),
    claims: new Set(inv.claims.map((claim) => claim.id)),
    dependencies: new Set(inv.dependencies.map((dependency) => dependency.id)),
  };
};

describe("the Phase 4B hooks", () => {
  it.each(cases)("%s cites evidence that exists", (_key, graph) => {
    const { evidence } = registers(graph);
    for (const item of [...graph.nodes, ...graph.edges]) {
      for (const id of item.evidenceIds) expect(evidence, `${id} is not in the register`).toContain(id);
    }
  });

  it.each(cases)("%s cites reasoning claims that exist", (_key, graph) => {
    const { claims } = registers(graph);
    for (const item of [...graph.nodes, ...graph.edges]) {
      for (const id of item.reasoningClaimIds) expect(claims, `${id} is not a claim`).toContain(id);
    }
  });

  it.each(cases)("%s names dependencies that exist", (_key, graph) => {
    const { dependencies } = registers(graph);
    for (const node of graph.nodes) {
      if (node.dependencyId) expect(dependencies, `${node.dependencyId} is not a dependency`).toContain(node.dependencyId);
    }
  });

  it.each(cases)("%s wires provenance into the path the concern travels", (_key, graph) => {
    const onPath = graph.nodes.filter((node) => node.concern === "exposed");
    const wired = onPath.filter((node) => node.evidenceIds.length > 0 || node.reasoningClaimIds.length > 0);
    expect(wired.length).toBeGreaterThanOrEqual(Math.ceil(onPath.length / 2));
  });
});

describe("the flagship finding", () => {
  const deccan = SUPPLY_CHAIN_GRAPHS.get("c1:sup:deccan-mainshaft-forgings")!;

  it("links the held producer and proposed domestic cover behind the dealer", () => {
    const processor = deccan.nodes.find((node) => node.name === "Jalna Alloy Supply")!;
    const behind = deccan.edges.filter((edge) => edge.fromId === processor.id && edge.relation === "sourced-from");
    expect(behind.length).toBeGreaterThanOrEqual(2);
    const sources = behind.map((edge) => deccan.nodes.find((node) => node.id === edge.toId)!);
    for (const source of sources) expect(source.parentId).toBe(processor.id);
  });

  it("reaches the dealer through the order-specific billet allocation", () => {
    const processor = deccan.nodes.find((node) => node.name === "Jalna Alloy Supply")!;
    const parents = deccan.edges.filter((edge) => edge.toId === processor.id);
    expect(parents.length).toBe(1);
  });
});

describe("the regulatory readiness finding", () => {
  const tiruchi = SUPPLY_CHAIN_GRAPHS.get("c1:sup:tiruchi-tower-sections")!;
  it("keeps published law separate from unresolved shipment applicability", () => {
    const rule = tiruchi.nodes.find((n) => n.name === "EU CBAM")!;
    const scope = tiruchi.nodes.find((n) => n.name === "Shipment scope check")!;
    expect(rule.evidence).toBe("verified");
    expect(scope.evidence).toBe("unresolved");
    expect(tiruchi.nodes.some((n) => n.concern === "exposed")).toBe(false);
    expect(tiruchi.nodes.some((n) => /repair|rework/i.test(n.name))).toBe(false);
  });
});

describe("the forward-looking case", () => {
  const durgapur = SUPPLY_CHAIN_GRAPHS.get("c1:sup:durgapur-heat-treatment")!;

  it("holds no node for the forecast itself", () => {
    for (const node of durgapur.nodes) {
      expect(node.name.toLowerCase()).not.toMatch(/forecast|forward curve|price/);
    }
  });

  it("carries the forward curve on the material it constrains", () => {
    const quench = durgapur.nodes.find((node) => node.name === "Approved quench medium")!;
    expect(quench.type).toBe("material");
    expect(quench.evidenceIds).toContain("dg-ev-forward-curve");
  });

  it("runs the concern out to a route without turning the route into the finding", () => {
    const lane = durgapur.nodes.find((node) => node.type === "route")!;
    expect(lane.concern).toBe("exposed");
    expect(lane.evidence).toBe("inferred");
  });
});

/**
 * The graph and the workspace header name the same company, so they must name the
 * same place. A card that says one city while the header says another reads as two
 * narratives about one supplier.
 */
describe("the anchor supplier's place", () => {
  it.each(cases)("%s agrees with the supplier record", (_key, graph) => {
    const record = SUPPLIERS.find((supplier) => supplier.id === graph.supplierId)!;
    const anchor = graph.nodes.find(
      (node) => node.type === "supplier" && (node.tier ?? 1) === 1
    )!;
    expect(anchor.place).toBe(`${record.city}, ${record.region}`);
  });
});
