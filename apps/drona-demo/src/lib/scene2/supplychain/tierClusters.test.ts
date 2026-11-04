import { describe, expect, it } from "vitest";
import { supplyChainGraphFor } from "./index";
import { applyView, DEFAULT_VIEW, setMode } from "./view";
import { layoutGraph } from "./layout";
import { tierClusters } from "./tierClusters";

const deccan = supplyChainGraphFor("c1", "sup:deccan-mainshaft-forgings")!;

describe("tierClusters", () => {
  it("never labels the Tier-1 supplier", () => {
    const wide = applyView(deccan, setMode(DEFAULT_VIEW, "relevant"));
    const layout = layoutGraph(wide);
    const clusters = tierClusters(wide, layout);
    expect(clusters.every((cluster) => Number(cluster.tier) !== 1)).toBe(true);
  });

  it("labels a deeper tier once, above its topmost card", () => {
    const wide = applyView(deccan, setMode(DEFAULT_VIEW, "relevant"));
    const layout = layoutGraph(wide);
    const clusters = tierClusters(wide, layout);
    const deeperTiers = new Set(
      wide.nodes
        .filter((node) => node.type === "supplier" && (node.tier ?? 1) > 1)
        .map((node) => node.tier!)
    );
    expect(clusters.length).toBe(deeperTiers.size);
    for (const cluster of clusters) {
      const membersAtTier = wide.nodes.filter((node) => node.type === "supplier" && node.tier === cluster.tier);
      const topY = Math.min(...membersAtTier.map((node) => layout.boxes.get(node.id)!.y));
      expect(cluster.y).toBeLessThan(topY);
    }
  });

  it("produces nothing when no deeper supplier is visible", () => {
    const critical = applyView(deccan, DEFAULT_VIEW);
    const tierOneOnly = applyView(deccan, setMode({ ...DEFAULT_VIEW, tier: 1 }, "critical"));
    const layout = layoutGraph(tierOneOnly);
    const clusters = tierClusters(tierOneOnly, layout);
    for (const cluster of clusters) expect(cluster.tier).not.toBe(1);
    expect(critical.nodes.length).toBeGreaterThan(0);
  });
});
