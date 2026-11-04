/**
 * Zoom-aware aggregation for the supplier layer.
 *
 * At world zoom fifty Indian suppliers occupy a thumbnail of the subcontinent and
 * would render as a pile of overlapping icons. Collapsing them is not a workaround:
 * **concentration is the analytical point of Scene 1**, and a cluster states it
 * directly — a ring sized by count, coloured by the worst concern present.
 *
 * Clusters are **derived, never authored**. Nothing in the data says "Pune belt";
 * the grouping falls out of the coordinates and the current zoom, in the screen's
 * own pixel space, so it stays honest as the camera moves and cannot drift from the
 * data.
 *
 * Pure. No React, no DOM.
 */
import { toWorldPixels, fromWorldPixels, type LonLat } from "./mercator";
import type { MapNode } from "./mapData";
import { worstConcern, type Concern } from "@/lib/network/types";

/** Icons closer than this on screen, in CSS pixels, merge into one cluster. */
export const CLUSTER_RADIUS_PX = 34;

/**
 * Past this zoom every supplier stands alone regardless of proximity. Suppliers in
 * the same town would otherwise stay merged at every depth.
 */
export const CLUSTER_RESOLVE_ZOOM = 7;

export interface SupplierCluster {
  /** Stable for a given membership: derived from member ids, not an index. */
  readonly id: string;
  readonly position: LonLat;
  readonly members: readonly MapNode[];
  readonly count: number;
  readonly worstConcern: Concern;
  readonly breakdown: Readonly<Record<Concern, number>>;
  readonly resolved: boolean;
}

interface Placed {
  readonly node: MapNode;
  readonly px: readonly [number, number];
}

function toCluster(members: readonly Placed[], zoom: number): SupplierCluster {
  const breakdown: Record<Concern, number> = { low: 0, elevated: 0, critical: 0 };
  let sx = 0;
  let sy = 0;
  for (const m of members) {
    breakdown[m.node.concern ?? "low"] += 1;
    sx += m.px[0];
    sy += m.px[1];
  }
  const nodes = members.map((m) => m.node);
  const ids = nodes.map((n) => n.id).sort();
  const resolved = members.length === 1;
  return {
    id: resolved ? nodes[0].id : `cluster:${ids[0]}+${ids.length}`,
    position: resolved
      ? nodes[0].position
      : fromWorldPixels([sx / members.length, sy / members.length], zoom),
    members: nodes,
    count: members.length,
    worstConcern: worstConcern(nodes.map((n) => n.concern ?? "low")),
    breakdown,
    resolved,
  };
}

/**
 * Group supplier nodes for the given zoom.
 *
 * Greedy agglomeration against a running centroid, over input sorted by position,
 * so the result depends only on geography and zoom — never on authoring order.
 * Nothing is dropped: every input appears in exactly one cluster, so the counts on
 * screen always sum to the network.
 */
export function clusterSuppliers(
  nodes: readonly MapNode[],
  zoom: number
): readonly SupplierCluster[] {
  const placed: Placed[] = nodes
    .map((node) => ({ node, px: toWorldPixels(node.position, zoom) }))
    .sort((a, b) => a.px[0] - b.px[0] || a.px[1] - b.px[1] || (a.node.id < b.node.id ? -1 : 1));

  if (zoom >= CLUSTER_RESOLVE_ZOOM) return placed.map((p) => toCluster([p], zoom));

  const groups: Placed[][] = [];
  const centroids: [number, number][] = [];

  for (const candidate of placed) {
    const index = centroids.findIndex(
      (c) => Math.hypot(candidate.px[0] - c[0], candidate.px[1] - c[1]) <= CLUSTER_RADIUS_PX
    );
    if (index === -1) {
      groups.push([candidate]);
      centroids.push([candidate.px[0], candidate.px[1]]);
      continue;
    }
    const group = [...groups[index], candidate];
    groups[index] = group;
    const c = centroids[index];
    centroids[index] = [
      c[0] + (candidate.px[0] - c[0]) / group.length,
      c[1] + (candidate.px[1] - c[1]) / group.length,
    ];
  }

  return groups.map((g) => toCluster(g, zoom));
}

/**
 * The zoom at which a cluster breaks apart — what a click on it flies to.
 * One and a half levels in, capped at the resolve threshold.
 */
export const drillZoom = (zoom: number): number =>
  Math.min(CLUSTER_RESOLVE_ZOOM, Math.max(zoom + 1.5, 3.2));
