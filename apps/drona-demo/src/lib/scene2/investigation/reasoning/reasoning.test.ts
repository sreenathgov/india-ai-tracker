import { describe, expect, it } from "vitest";

import { INVESTIGATIONS, investigationFor } from "../registry";
import type { ActionKind } from "../types";
import { actionPosture, buildReasoningGraph, decisionPathClaimIds } from "./index";

const DURGAPUR = "sup:durgapur-heat-treatment";

describe.each(INVESTIGATIONS.map((inv) => [inv.supplierId, inv] as const))("buildReasoningGraph — %s", (_, inv) => {
  it("has one node per claim, plus one per dependency and action actually pointed to", () => {
    const graph = buildReasoningGraph(inv);
    const usedDependencyIds = new Set(inv.claims.flatMap((c) => c.affectedDependencyIds));
    const usedActionIds = new Set(inv.claims.flatMap((c) => c.affectedActionIds));
    expect(graph.nodes.length).toBe(inv.claims.length + usedDependencyIds.size + usedActionIds.size);
  });

  it("resolves every affectedDependencyIds and affectedActionIds entry to a real node in this investigation", () => {
    for (const claim of inv.claims) {
      for (const depId of claim.affectedDependencyIds) {
        expect(inv.dependencies.some((d) => d.id === depId)).toBe(true);
      }
      for (const actionId of claim.affectedActionIds) {
        expect(inv.actions.some((a) => a.id === actionId)).toBe(true);
      }
    }
  });

  it("draws every edge between nodes that exist in the graph", () => {
    const graph = buildReasoningGraph(inv);
    const ids = new Set(graph.nodes.map((n) => n.id));
    for (const edge of graph.edges) {
      expect(ids.has(edge.fromId)).toBe(true);
      expect(ids.has(edge.toId)).toBe(true);
    }
  });
});

describe("actionPosture", () => {
  it("classifies every action kind as verificatory or interventionary", () => {
    const kinds: readonly ActionKind[] = ["verify", "reserve", "resequence", "qualify", "procure", "hold"];
    for (const kind of kinds) {
      expect(actionPosture(kind)).toBe(kind === "verify" ? "verificatory" : "interventionary");
    }
  });
});

describe("decisionPathClaimIds", () => {
  it("returns only controlling-materiality claims, in fracture-path order, for Durgapur", () => {
    const inv = investigationFor("c1", DURGAPUR)!;
    const ids = decisionPathClaimIds(inv);
    expect(ids.length).toBeGreaterThan(0);
    expect(new Set(ids)).toEqual(new Set(inv.claims.filter((c) => c.materiality === "controlling").map((c) => c.id)));

    const stageOrder = inv.fracturePath.flatMap((step) => step.claimIds).filter((id) => ids.includes(id));
    const seen = new Set<string>();
    const dedupedStageOrder = stageOrder.filter((id) => (seen.has(id) ? false : (seen.add(id), true)));
    expect(ids.slice(0, dedupedStageOrder.length)).toEqual(dedupedStageOrder);
  });

  it("is a subset of the controlling claims for every authored investigation", () => {
    for (const inv of INVESTIGATIONS) {
      const ids = decisionPathClaimIds(inv);
      const controlling = new Set(inv.claims.filter((c) => c.materiality === "controlling").map((c) => c.id));
      expect(ids.every((id) => controlling.has(id))).toBe(true);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });
});
