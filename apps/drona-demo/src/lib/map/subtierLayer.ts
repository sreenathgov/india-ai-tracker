/**
 * One critical Tier-1's sub-tier network, placed on the map.
 *
 * Scene 2's map after the analysis resolves: the plant, the critical Tier-1s, and —
 * for the one the reviewer has selected — everyone behind it. The other four keep
 * their networks folded away; five networks at once is a hairball that says "many"
 * and nothing else.
 *
 * Like `chainModel.ts` this only places what the data already decided. Evidence
 * comes from each node's establishing edge; signals, the weak link and "abroad" come
 * from the network. Nothing here assesses a party.
 *
 * Pure. No React, no DOM.
 */
import { greatCircle } from "./flowPath";
import type { MapFlow, MapNode } from "./mapData";
import type { LonLat } from "./mercator";
import { passes, type SubTierFilter } from "@/lib/network/subtier/filter";
import { ROLE_LABEL, type SubTierNetwork } from "@/lib/network/subtier";
import type { Plant, Supplier } from "@/lib/network/types";

export interface SubTierLayer {
  readonly nodes: readonly MapNode[];
  readonly flows: readonly MapFlow[];
}

/* Local, not mapData's: mapData imports this module, so a value import back would be a cycle. */
const lonLat = (c: { readonly lon: number; readonly lat: number }): LonLat => [c.lon, c.lat];

/** Arc resolution. Sub-tier links are mostly short and domestic; 16 is smooth enough. */
const SEGMENTS = 16;

/**
 * The selected network's parties that pass the filter, and the edges between the
 * parties still on screen — plus a contracted plant ← Tier-1 link for every critical
 * Tier-1, drawn solid, so the weaker sub-tier links have something to be weaker than.
 *
 * An edge whose far end is filtered away is not drawn: a line to nothing would say
 * there is a party there the reviewer has just asked not to see.
 */
export function subTierLayer({
  plant,
  tierOnes,
  network,
  filter,
}: {
  readonly plant: Plant;
  readonly tierOnes: readonly Supplier[];
  readonly network: SubTierNetwork | null;
  readonly filter: SubTierFilter;
}): SubTierLayer {
  const plantAt = lonLat(plant.coordinate);
  const contracted: MapFlow[] = tierOnes.map((supplier) => ({
    id: `dep:plant<-${supplier.id}`,
    kind: "dependency",
    path: greatCircle(lonLat(supplier.coordinate), plantAt, SEGMENTS),
    confidence: "verified",
  }));

  if (!network) return { nodes: [], flows: contracted };

  const shown = network.nodes.filter((entry) => passes(entry, filter));
  const nodes: MapNode[] = shown.map((entry) => ({
    id: entry.node.id,
    kind: "subtier",
    position: lonLat(entry.node.coordinate),
    title: entry.node.name,
    place: `${entry.node.city}, ${entry.abroad ? entry.node.country : entry.node.region}`,
    concern: null,
    confidence: entry.confidence,
    role: `${ROLE_LABEL[entry.node.role]} · Tier ${entry.tier}`,
    commitmentIds: [],
    subtier: entry,
  }));

  const tierOne = tierOnes.find((s) => s.id === network.supplierId);
  const positions = new Map<string, LonLat>(nodes.map((n) => [n.id, n.position]));
  if (tierOne) positions.set(tierOne.id, lonLat(tierOne.coordinate));

  const edges: MapFlow[] = network.edges.flatMap((edge) => {
    const from = positions.get(edge.fromId);
    const to = positions.get(edge.toId);
    if (!from || !to) return [];
    return [
      {
        id: `dep:${edge.fromId}->${edge.toId}`,
        kind: "dependency" as const,
        path: greatCircle(from, to, SEGMENTS),
        confidence: edge.confidence,
      },
    ];
  });

  return { nodes, flows: [...contracted, ...edges] };
}

/**
 * What Scene 2 frames once resolved: the plant, the critical Tier-1s, and the
 * selected network's domestic parties. Imports are drawn where they are but not
 * framed on — fitting Ningbo and Stuttgart in would shrink India to a thumbnail,
 * and India is where the reviewer's question is.
 */
export function productionPositions({
  plant,
  tierOnes,
  network,
}: {
  readonly plant: Plant;
  readonly tierOnes: readonly Supplier[];
  readonly network: SubTierNetwork | null;
}): readonly LonLat[] {
  return [
    lonLat(plant.coordinate),
    ...tierOnes.map((s) => lonLat(s.coordinate)),
    ...(network?.nodes.filter((n) => !n.abroad).map((n) => lonLat(n.node.coordinate)) ?? []),
  ];
}
