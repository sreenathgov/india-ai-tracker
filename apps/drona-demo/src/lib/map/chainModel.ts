/**
 * Scene 3's dependency chain, placed on the map.
 *
 * The map stops being a network overview here and becomes a **causal dependency
 * map**: the same mounted map, the same camera, but what is drawn is one chain of
 * custody for one assembly, each link at the strength of the evidence behind it.
 *
 * Upstream nodes sit at their real coordinates rather than in a tidy ladder. A
 * ladder would be easier to read and would throw away the one fact the scene is
 * built to show — that both approved mills are in the same part of the country.
 * Geography *is* the finding, so geography stays.
 *
 * Nothing here decides an epistemic state; every node and edge carries through the
 * state `dependencies.ts` derived. This module only places it.
 *
 * Pure. No React, no DOM.
 */
import { greatCircle } from "./flowPath";
import type { LonLat } from "./mercator";
import type { MapFlow, MapNode } from "./mapData";
import type { DependencyChain } from "@/lib/network/dependencies";

export interface ChainLayer {
  readonly nodes: readonly MapNode[];
  readonly flows: readonly MapFlow[];
}

const at = (c: { readonly lon: number; readonly lat: number }): LonLat => [c.lon, c.lat];

/**
 * The upstream nodes and the dependency edges between them.
 *
 * The plant and the Tier-1 supplier are already in the map data, so this adds only
 * what is new — the tiers above Tier 1 — plus the Tier-1 → plant edge, the one link
 * that is actually contracted and therefore the only one drawn at full strength.
 */
export function chainLayer(chain: DependencyChain): ChainLayer {
  const plant = at(chain.plant.coordinate);
  const supplier = at(chain.supplier.coordinate);

  const positionFor = (id: string): LonLat | null => {
    if (id === chain.supplier.id) return supplier;
    const upstream = chain.upstream.find((u) => u.node.id === id);
    return upstream ? at(upstream.node.coordinate) : null;
  };

  const nodes: MapNode[] = chain.upstream.map((resolved) => ({
    id: resolved.node.id,
    kind: "upstream",
    position: at(resolved.node.coordinate),
    title: resolved.node.name,
    place: `${resolved.node.city}, ${resolved.node.country}`,
    concern: null,
    confidence: resolved.confidence,
    role: `${resolved.node.role} · Tier ${resolved.node.tier}`,
    commitmentIds: [],
  }));

  /* The contracted link, drawn solid. Without one verified edge on screen,
     "inferred" has nothing to be weaker *than*. */
  const flows: MapFlow[] = [
    {
      id: "dep:tier1",
      kind: "dependency",
      path: greatCircle(supplier, plant, 24),
      confidence: "verified",
    },
  ];

  for (const edge of chain.edges) {
    const from = positionFor(edge.fromId);
    const to = positionFor(edge.toId);
    /* A node the chain names but cannot place does not draw its edge. The map may
       under-show; it must never guess a location to keep a line unbroken. */
    if (!from || !to) continue;
    flows.push({
      id: `dep:${edge.fromId}->${edge.toId}`,
      kind: "dependency",
      path: greatCircle(from, to, 24),
      confidence: edge.confidence,
    });
  }

  return { nodes, flows };
}

/** Every position the chain occupies, for framing Scene 3. */
export function chainPositions(chain: DependencyChain): readonly LonLat[] {
  return [
    at(chain.plant.coordinate),
    at(chain.supplier.coordinate),
    ...chain.upstream.map((u) => at(u.node.coordinate)),
  ];
}
