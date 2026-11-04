import { describe, expect, it } from "vitest";

import { SUPPLIERS } from "@/lib/network/gazetteer";
import { CLUSTER_RESOLVE_ZOOM, clusterSuppliers, drillZoom } from "./cluster";
import { supplierNode } from "./mapData";

const ALL = SUPPLIERS.map(supplierNode);
const INDIA = ALL.filter((n) => n.supplier?.country === "India");

describe("clusterSuppliers", () => {
  it("has 50 Indian suppliers to aggregate — the premise of the whole behaviour", () => {
    expect(INDIA).toHaveLength(50);
  });

  it("collapses the Indian base to a readable handful at the resting world view", () => {
    const clusters = clusterSuppliers(INDIA, 1.35);
    expect(clusters.length).toBeGreaterThanOrEqual(2);
    expect(clusters.length).toBeLessThanOrEqual(10);
  });

  it("resolves every supplier individually past the threshold", () => {
    const clusters = clusterSuppliers(INDIA, CLUSTER_RESOLVE_ZOOM);
    expect(clusters).toHaveLength(50);
    expect(clusters.every((c) => c.resolved)).toBe(true);
  });

  it("loosens grouping as the view goes in", () => {
    const counts = [1, 2, 3, 4, 5].map((z) => clusterSuppliers(INDIA, z).length);
    expect(counts[counts.length - 1]).toBeGreaterThan(counts[0]);
  });

  it("never drops a supplier, so the counts on screen always sum to the network", () => {
    for (const zoom of [0.6, 1.35, 2.5, 4, CLUSTER_RESOLVE_ZOOM]) {
      const clusters = clusterSuppliers(ALL, zoom);
      const members = clusters.flatMap((c) => c.members.map((m) => m.id));
      expect(members).toHaveLength(80);
      expect(new Set(members).size).toBe(80);
      expect(clusters.reduce((sum, c) => sum + c.count, 0)).toBe(80);
    }
  });

  it("colours a cluster by the worst concern present, not by the majority", () => {
    for (const cluster of clusterSuppliers(ALL, 1.35)) {
      const expected =
        cluster.breakdown.critical > 0
          ? "critical"
          : cluster.breakdown.elevated > 0
            ? "elevated"
            : "low";
      expect(cluster.worstConcern).toBe(expected);
    }
  });

  it("is independent of the order suppliers happen to be authored in", () => {
    const a = clusterSuppliers(ALL, 1.35).map((c) => c.id);
    const b = clusterSuppliers([...ALL].reverse(), 1.35).map((c) => c.id);
    expect(b).toEqual(a);
  });

  it("gives a lone supplier its own id, so a click on it is a click on the supplier", () => {
    const [single] = clusterSuppliers([ALL[0]], 1);
    expect(single.resolved).toBe(true);
    expect(single.id).toBe(ALL[0].id);
    expect(single.position).toEqual(ALL[0].position);
  });

  it("handles an empty network without inventing a cluster", () => {
    expect(clusterSuppliers([], 1)).toEqual([]);
  });
});

describe("drillZoom", () => {
  it("always goes in, and never past the resolve threshold", () => {
    for (const zoom of [0.6, 1.35, 3, 6, 6.9]) {
      expect(drillZoom(zoom)).toBeGreaterThan(zoom);
      expect(drillZoom(zoom)).toBeLessThanOrEqual(CLUSTER_RESOLVE_ZOOM);
    }
  });
});
