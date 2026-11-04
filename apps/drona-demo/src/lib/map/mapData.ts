/**
 * The map's one data state.
 *
 * Everything the map draws is derived here from the network subset a scene hands
 * it, in plain longitude/latitude, and the same structure feeds both views: the flat
 * map and the globe read identical nodes and identical routes. Switching views
 * changes the camera, never the data — so the two can never tell the reviewer
 * different things.
 *
 * Lines run **plant → buyer only**. A line per supplier was the old map's failure:
 * eighty hairlines into Chennai say "many" and nothing else. Suppliers are placed,
 * not connected; their relationship to the plant is the premise of the whole screen
 * and does not need drawing eighty times.
 *
 * Pure. No React, no DOM.
 */
import { chainLayer } from "./chainModel";
import { subTierLayer } from "./subtierLayer";
import { boundsOf, type Bounds } from "./framing";
import { greatCircle } from "./flowPath";
import type { LonLat } from "./mercator";
import type { Confidence, DependencyChain } from "@/lib/network/dependencies";
import type { ResolvedSubTierNode, SubTierNetwork } from "@/lib/network/subtier";
import type { SubTierFilter } from "@/lib/network/subtier/filter";
import type { Concern, Destination, Plant, Supplier } from "@/lib/network/types";

export type MapNodeKind = "plant" | "supplier" | "destination" | "upstream" | "subtier";

export interface MapNode {
  readonly id: string;
  readonly kind: MapNodeKind;
  readonly position: LonLat;
  /** Hover-card line 1. */
  readonly title: string;
  /** Hover-card line 2 — city, region, country. */
  readonly place: string;
  /** Concern-bearing nodes only: Tier-1 suppliers. Null for everything else. */
  readonly concern: Concern | null;
  /** Scene 3 only — how well Drona knows this upstream node is there. */
  readonly confidence?: Confidence;
  /** What the node is, when the kind alone does not say: "Steel processor". */
  readonly role?: string;
  readonly commitmentIds: readonly string[];
  /** The full record, for the detail panel. Suppliers only. */
  readonly supplier?: Supplier;
  /** Scene 2 sub-tier parties only — role, sources, signals, weak link, abroad. */
  readonly subtier?: ResolvedSubTierNode;
}

export type FlowKind = "delivery" | "dependency";

export interface MapFlow {
  readonly id: string;
  readonly kind: FlowKind;
  readonly path: readonly LonLat[];
  /** Dependency edges only. Decides solid, faded or dotted. */
  readonly confidence?: Confidence;
  /** Delivery lines only — the order the line carries, for highlighting. */
  readonly commitmentId?: string;
}

export interface MapData {
  readonly plant: MapNode;
  readonly suppliers: readonly MapNode[];
  readonly destinations: readonly MapNode[];
  /** Behind the Tier-1s: Scene 3's chain, or Scene 2's selected sub-tier network. */
  readonly upstream: readonly MapNode[];
  readonly flows: readonly MapFlow[];
  /** Every node's position, boxed — what the scene frames when it has no opinion. */
  readonly bounds: Bounds | null;
}

export const lonLat = (c: { readonly lon: number; readonly lat: number }): LonLat => [
  c.lon,
  c.lat,
];

export function supplierNode(supplier: Supplier): MapNode {
  return {
    id: supplier.id,
    kind: "supplier",
    position: lonLat(supplier.coordinate),
    title: supplier.name,
    place: `${supplier.city}, ${supplier.region}, ${supplier.country}`,
    concern: supplier.concern,
    commitmentIds: supplier.commitmentIds,
    supplier,
  };
}

export function buildMapData({
  plant,
  suppliers,
  destinations,
  chain = null,
  production = null,
}: {
  readonly plant: Plant;
  readonly suppliers: readonly Supplier[];
  readonly destinations: readonly Destination[];
  readonly chain?: DependencyChain | null;
  /** Scene 2 once resolved: the selected Tier-1's network, filtered as the legend says. */
  readonly production?: {
    readonly network: SubTierNetwork | null;
    readonly filter: SubTierFilter;
  } | null;
}): MapData {
  const plantNode: MapNode = {
    id: plant.id,
    kind: "plant",
    position: lonLat(plant.coordinate),
    title: plant.name,
    place: `${plant.city}, ${plant.country}`,
    concern: null,
    commitmentIds: [],
  };

  const supplierNodes = suppliers.map(supplierNode);

  const destinationNodes: MapNode[] = destinations.map((d) => ({
    id: d.id,
    kind: "destination",
    position: lonLat(d.coordinate),
    title: d.customer,
    place: `${d.city}, ${d.country}`,
    concern: null,
    commitmentIds: [d.commitmentId],
  }));

  /* Scene 3 swaps vocabularies: the chain's dependency edges replace the delivery
     lines, never sit beside them. An unannotated delivery line next to a dotted
     dependency would read as "verified" — the one claim the chain has not earned.
     The production view makes the same swap for the same reason. */
  const layer = chain
    ? chainLayer(chain)
    : production
      ? subTierLayer({ plant, tierOnes: suppliers, ...production })
      : null;

  const deliveries: MapFlow[] = destinationNodes.map((node) => ({
    id: `flow:${node.id}`,
    kind: "delivery",
    path: greatCircle(plantNode.position, node.position),
    commitmentId: node.commitmentIds[0],
  }));

  const upstream = layer?.nodes ?? [];
  const all = [plantNode, ...supplierNodes, ...destinationNodes, ...upstream];

  return {
    plant: plantNode,
    suppliers: supplierNodes,
    destinations: destinationNodes,
    upstream,
    flows: layer ? layer.flows : deliveries,
    bounds: boundsOf(all.map((n) => n.position)),
  };
}
