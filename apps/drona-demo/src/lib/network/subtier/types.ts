/**
 * The sub-tier model: what sits behind a critical Tier-1, and how well Drona knows it.
 *
 * ── Everything here is invented. ──────────────────────────────────────────────
 *
 * Three rules shape these types.
 *
 * *A node's tier is not a property of the node.* Durgapur Special Steels is Tier 2
 * to a ring forger that buys its blooms directly and Tier 3 to a shaft forger that
 * buys through a processor. So the authored node carries no tier; the network
 * derives it from the edges (`index.ts`).
 *
 * *Confidence lives on the edge*, exactly as in `dependencies.ts`. A node is only as
 * well known as the relationship that put it on the map.
 *
 * *Signals are metadata, not a verdict.* A signal names a kind of risk and says in a
 * sentence what was observed. It has no level and no number — the risk model that
 * would weigh them is not built yet, and a severity invented here would be read as
 * one that had been measured.
 */
import type { Confidence } from "@/lib/network/confidence";
import type { Coordinate, Sourcing } from "@/lib/network/types";

/**
 * What the node is to the Tier-1, which decides its map glyph.
 *
 * Six roles because six is what a foundry or fabrication buyer actually manages:
 * the metal, the chemistry that changes it, the things consumed making it, the work
 * bought in, the movement of it, and the traders in between.
 */
export type SubTierRole =
  | "raw-material"
  | "alloy-chemical"
  | "consumable"
  | "process-service"
  | "logistics"
  | "distributor";

export const SUBTIER_ROLES: readonly SubTierRole[] = [
  "raw-material",
  "alloy-chemical",
  "consumable",
  "process-service",
  "logistics",
  "distributor",
];

export const ROLE_LABEL: Readonly<Record<SubTierRole, string>> = {
  "raw-material": "Raw material",
  "alloy-chemical": "Alloy & chemical",
  consumable: "Consumable",
  "process-service": "Process service",
  logistics: "Logistics",
  distributor: "Distributor",
};

/**
 * The kinds of risk the company brain names, split the way it splits them: what
 * happens inside a supplier's operation, and what arrives from outside it.
 */
export type RiskKind =
  | "material"
  | "capacity"
  | "quality"
  | "sub-tier"
  | "logistics"
  | "working-capital"
  | "geopolitical"
  | "trade-regulatory"
  | "commodity"
  | "geospatial";

export const RISK_KIND_LABEL: Readonly<Record<RiskKind, string>> = {
  material: "Material",
  capacity: "Capacity",
  quality: "Quality",
  "sub-tier": "Sub-tier",
  logistics: "Logistics",
  "working-capital": "Working capital",
  geopolitical: "Geopolitical",
  "trade-regulatory": "Trade & regulatory",
  commodity: "Commodity",
  geospatial: "Geospatial",
};

export const EXTERNAL_KINDS: ReadonlySet<RiskKind> = new Set<RiskKind>([
  "geopolitical",
  "trade-regulatory",
  "commodity",
  "geospatial",
]);

/** How the Tier-1 buys from this node. */
export type Channel = "direct" | "distributor" | "service";

export const CHANNEL_LABEL: Readonly<Record<Channel, string>> = {
  direct: "Direct",
  distributor: "Via distributor",
  service: "Service",
};

export interface SubTierSignal {
  readonly kind: RiskKind;
  /** What was observed, in one sentence. Never a score, never a level. */
  readonly note: string;
}

/** A party behind a Tier-1, as authored — no tier, no confidence. */
export interface SubTierNode {
  readonly id: string;
  readonly name: string;
  readonly role: SubTierRole;
  /** What is bought from it, in the words a purchase order would use. */
  readonly sources: string;
  readonly city: string;
  /** State in India, country elsewhere — the shared-geography test reads it. */
  readonly region: string;
  readonly country: string;
  readonly coordinate: Coordinate;
  readonly channel: Channel;
  /** The Tier-1's approved-source position for this input. */
  readonly sourcing: Sourcing;
  readonly signals: readonly SubTierSignal[];
  /** Set when this party is itself a Tier-1 supplier to the plant. */
  readonly tierOneId?: string;
}

/** `fromId` supplies `toId`. `toId` is a node id or the network's Tier-1 id. */
export interface SubTierEdge {
  readonly fromId: string;
  readonly toId: string;
  readonly confidence: Confidence;
  readonly holding: string;
  readonly basis: string;
}

/** A node as it sits in one network: its derived tier and establishing confidence. */
export interface ResolvedSubTierNode {
  readonly node: SubTierNode;
  readonly tier: 2 | 3;
  /** The confidence of the edge that carries it one step nearer the Tier-1. */
  readonly confidence: Confidence;
  readonly weakLink: boolean;
  readonly abroad: boolean;
  /** True when the same party sits behind another critical Tier-1 as well. */
  readonly shared: boolean;
}

/**
 * The one place a network is most likely to give way — the mechanism the view's
 * "why" section tells. Authored, because it is a judgement about the records; the
 * facts it rests on (sourcing, route, confidence) are derived from them.
 */
export interface WeakLink {
  readonly nodeId: string;
  /** Node ids Scene 3 draws, nearest the Tier-1 first. Always includes `nodeId`. */
  readonly trace: readonly string[];
  readonly mechanism: string;
  readonly conditions: readonly string[];
}

export interface SubTierNetwork {
  readonly supplierId: string;
  readonly nodes: readonly ResolvedSubTierNode[];
  readonly edges: readonly SubTierEdge[];
  readonly weakLink: WeakLink;
  /** Node ids from the weak link to the Tier-1, weak link first. */
  readonly weakLinkRoute: readonly string[];
}
