/**
 * The authoring grammar for sub-tier networks: tuple rows a person can read down
 * and edit, the same convention as `suppliers.ts`.
 *
 * A network lists its nodes either as full rows or as the key of a party declared
 * once in `shared.ts`. A shared party is one record, not two copies that could drift
 * — which matters, because the shared parties are the finding.
 */
import type { Confidence } from "@/lib/network/confidence";
import type { Sourcing } from "@/lib/network/types";
import type { Channel, RiskKind, SubTierNode, SubTierRole } from "./types";

export type SignalRow = readonly [kind: RiskKind, note: string];

export type NodeRow = readonly [
  key: string,
  name: string,
  role: SubTierRole,
  sources: string,
  city: string,
  region: string,
  country: string,
  lon: number,
  lat: number,
  channel: Channel,
  sourcing: Sourcing,
  signals: readonly SignalRow[],
  tierOneId?: string,
];

/** The network's own Tier-1, written in edge rows as the destination. */
export const TIER1 = "@tier1";

export type EdgeRow = readonly [
  from: string,
  to: string,
  confidence: Confidence,
  holding: string,
  basis?: string,
];

export interface AuthoredNetwork {
  readonly supplierId: string;
  /** Full rows, or the key of a party declared in `shared.ts`. */
  readonly nodes: readonly (NodeRow | string)[];
  readonly edges: readonly EdgeRow[];
  readonly weakLink: {
    readonly key: string;
    /**
     * The parties Scene 3 draws for this weak link, nearest the Tier-1 first — the
     * route and the alternatives that bear on it. Authored, because which parties
     * bear on a mechanism is a judgement; that they connect is checked.
     */
    readonly trace: readonly string[];
    readonly mechanism: string;
    readonly conditions: readonly string[];
  };
}

export const nodeId = (key: string): string => `st:${key}`;

export function expandNode(row: NodeRow): SubTierNode {
  const [key, name, role, sources, city, region, country, lon, lat, channel, sourcing, signals, tierOneId] =
    row;
  return {
    id: nodeId(key),
    name,
    role,
    sources,
    city,
    region,
    country,
    coordinate: { lon, lat },
    channel,
    sourcing,
    signals: signals.map(([kind, note]) => ({ kind, note })),
    ...(tierOneId ? { tierOneId } : {}),
  };
}
