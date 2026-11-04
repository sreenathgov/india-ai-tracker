import type { GraphLayout } from "./layout";
import type { VisibleGraph } from "./view";

/**
 * The tier labels drawn above a cluster of cards, not on any one of them.
 *
 * Tier only ever describes a supplier relationship, so a label only ever
 * sits over a group of supplier cards at the same depth of dependency — a
 * material or a process never gets one, and Tier-1 never gets one either:
 * it is the subject the whole canvas already opens on.
 */
export interface TierCluster {
  readonly tier: 2 | 3;
  readonly label: string;
  readonly x: number;
  readonly y: number;
}

const CLUSTER_LABEL: Readonly<Record<2 | 3, string>> = {
  2: "Tier-2 suppliers",
  3: "Tier-3+ suppliers",
};

const LABEL_GAP = 18;

export function tierClusters(graph: VisibleGraph, layout: GraphLayout): readonly TierCluster[] {
  const groups = new Map<2 | 3, { minX: number; minY: number }>();
  for (const node of graph.nodes) {
    if (node.type !== "supplier") continue;
    const tier = node.tier ?? 1;
    if (tier <= 1) continue;
    const bucket: 2 | 3 = tier === 2 ? 2 : 3;
    const box = layout.boxes.get(node.id);
    if (!box) continue;
    const current = groups.get(bucket);
    groups.set(bucket, {
      minX: current ? Math.min(current.minX, box.x) : box.x,
      minY: current ? Math.min(current.minY, box.y) : box.y,
    });
  }

  return [...groups.entries()]
    .sort(([a], [b]) => a - b)
    .map(([tier, { minX, minY }]) => ({
      tier,
      label: CLUSTER_LABEL[tier],
      x: minX,
      y: Math.max(0, minY - LABEL_GAP),
    }));
}
