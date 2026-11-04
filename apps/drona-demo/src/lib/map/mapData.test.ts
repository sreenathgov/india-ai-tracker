import { describe, expect, it } from "vitest";

import { dependencyChain } from "@/lib/network/dependencies";
import { DESTINATIONS, PLANT, SUPPLIERS, suppliersForCommitment } from "@/lib/network/gazetteer";
import { chainPositions } from "./chainModel";
import { buildMapData } from "./mapData";

const CHAIN_ID = "cmp:tower-flange";

describe("buildMapData — Scene 1", () => {
  const data = buildMapData({ plant: PLANT, suppliers: SUPPLIERS, destinations: DESTINATIONS });

  it("places every node it is given, in lon/lat", () => {
    expect(data.plant.position).toEqual([PLANT.coordinate.lon, PLANT.coordinate.lat]);
    expect(data.suppliers).toHaveLength(80);
    expect(data.destinations).toHaveLength(5);
    expect(data.upstream).toHaveLength(0);
  });

  it("draws lines plant → buyer only — never from a supplier", () => {
    expect(data.flows).toHaveLength(DESTINATIONS.length);
    for (const flow of data.flows) {
      expect(flow.kind).toBe("delivery");
      expect(flow.path[0][0]).toBeCloseTo(PLANT.coordinate.lon, 6);
    }
    const supplierIds = new Set(SUPPLIERS.map((s) => s.id));
    expect(data.flows.some((f) => supplierIds.has(f.id.replace("flow:", "")))).toBe(false);
  });

  it("ties each delivery line to the order it carries", () => {
    expect(data.flows.map((f) => f.commitmentId).sort()).toEqual(
      DESTINATIONS.map((d) => d.commitmentId).sort()
    );
  });

  it("carries concern on Tier-1 suppliers only", () => {
    expect(data.plant.concern).toBeNull();
    expect(data.destinations.every((d) => d.concern === null)).toBe(true);
    expect(data.suppliers.every((s) => s.concern !== null && s.supplier)).toBe(true);
  });

  it("boxes the whole network", () => {
    expect(data.bounds).not.toBeNull();
    expect(data.bounds!.west).toBeLessThan(-90);
    expect(data.bounds!.east).toBeGreaterThan(130);
  });
});

describe("buildMapData — a single order", () => {
  it("holds only what the scene hands it", () => {
    const suppliers = suppliersForCommitment("c1");
    const destinations = DESTINATIONS.filter((d) => d.commitmentId === "c1");
    const data = buildMapData({ plant: PLANT, suppliers, destinations });
    expect(data.suppliers).toHaveLength(suppliers.length);
    expect(data.flows).toHaveLength(1);
    expect(data.flows[0].commitmentId).toBe("c1");
  });
});

describe("buildMapData — Scene 3 dependency chain", () => {
  const chain = dependencyChain(CHAIN_ID);

  it("has an authored chain to draw", () => {
    expect(chain).toBeDefined();
  });

  it("replaces delivery lines with dependency edges, never shows both", () => {
    const data = buildMapData({
      plant: PLANT,
      suppliers: [chain!.supplier],
      destinations: [],
      chain,
    });
    expect(data.flows.length).toBeGreaterThan(0);
    expect(data.flows.every((f) => f.kind === "dependency")).toBe(true);
    expect(data.upstream).toHaveLength(chain!.upstream.length);
  });

  it("draws the contracted Tier-1 link verified and every other edge at its own state", () => {
    const data = buildMapData({ plant: PLANT, suppliers: [chain!.supplier], destinations: [], chain });
    const [tier1, ...rest] = data.flows;
    expect(tier1.confidence).toBe("verified");
    expect(rest.map((f) => f.confidence)).toEqual(chain!.edges.map((e) => e.confidence));
  });

  it("carries each upstream node's establishing confidence onto the map", () => {
    const data = buildMapData({ plant: PLANT, suppliers: [chain!.supplier], destinations: [], chain });
    expect(data.upstream.map((n) => n.confidence)).toEqual(chain!.upstream.map((u) => u.confidence));
    expect(data.upstream.every((n) => n.concern === null)).toBe(true);
  });

  it("frames the chain across every tier it occupies", () => {
    expect(chainPositions(chain!)).toHaveLength(2 + chain!.upstream.length);
  });
});
