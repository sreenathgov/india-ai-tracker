/**
 * The production-network model.
 *
 * One discipline governs every record here: **the map may under-show, it must never
 * guess.** A node without coordinates simply does not draw. That is the correct
 * failure mode, and it is the same rule as "no silent failures" — an absence is
 * visible as an absence rather than being invented into a plausible position.
 *
 * All data in this demo is synthetic. Nothing here represents an actual customer,
 * supplier or commercial relationship.
 */

/**
 * Scene 1's ambient state bands.
 *
 * Deliberately *concern*, not *risk*. Scene 1 has done no causal work: it reports
 * where attention is concentrated, not why. The word only becomes "risk" in Scenes
 * 2 and 3, where an exposure is evaluated against a specific bill of materials,
 * supplier set, procurement plan and delivery date — and can therefore be explained.
 */
export type Concern = "low" | "elevated" | "critical";

/** Severity order, for rollups. Never rendered as a number. */
export const CONCERN_RANK: Readonly<Record<Concern, number>> = {
  low: 0,
  elevated: 1,
  critical: 2,
};

export function worstConcern(levels: readonly Concern[]): Concern {
  return levels.reduce<Concern>(
    (worst, level) => (CONCERN_RANK[level] > CONCERN_RANK[worst] ? level : worst),
    "low"
  );
}

/** Geographic coordinate as authored. Absent geography means the node does not draw. */
export interface Coordinate {
  readonly lon: number;
  readonly lat: number;
}

export type NodeKind = "plant" | "supplier" | "destination";

interface NetworkNodeBase {
  readonly id: string;
  readonly kind: NodeKind;
  readonly city: string;
  readonly country: string;
  readonly coordinate: Coordinate;
}

/** The manufacturing plant. Exactly one, and categorically distinct from suppliers. */
export interface Plant extends NetworkNodeBase {
  readonly kind: "plant";
  readonly name: string;
}

/** What a supplier makes for us — the turbine system its parts belong to. */
export type SupplyCategory =
  | "Drivetrain"
  | "Rotor"
  | "Nacelle"
  | "Electrical"
  | "Tower"
  | "Controls";

/** Our approved-source position for this supplier's parts: how replaceable it is. */
export type Sourcing = "sole" | "dual" | "multi";

/** Where the supplier stands in our qualification process. */
export type Approval = "approved" | "conditional" | "in-qualification";

export interface Supplier extends NetworkNodeBase {
  readonly kind: "supplier";
  /** Synthetic, and plainly so. Nothing may read as a real company. */
  readonly name: string;
  /** State or province, for grouping within a country. */
  readonly region: string;
  readonly tier: 1;
  readonly category: SupplyCategory;
  /** What we source from this supplier, in the words the documents use. */
  readonly supplies: readonly string[];
  readonly sourcing: Sourcing;
  readonly approval: Approval;
  /** Days from order release to delivery at the plant. */
  readonly leadTimeDays: number;
  /** Synthetic certificates on file. */
  readonly certifications: readonly string[];
  readonly concern: Concern;
  /** The production commitments this supplier currently feeds. */
  readonly commitmentIds: readonly string[];
  /**
   * True when a qualified alternative has been confirmed for this exposure.
   * Only meaningful where concern is elevated or critical — a supplier in low
   * concern is not an exposure to mitigate.
   */
  readonly mitigated: boolean;
}

/** An outbound purchase-order endpoint — where finished turbines are delivered. */
export interface Destination extends NetworkNodeBase {
  readonly kind: "destination";
  readonly customer: string;
  readonly commitmentId: string;
}

export interface Commitment {
  readonly id: string;
  /** The order as the business names it, e.g. "100 Wind Turbines — Coastal Programme". */
  readonly name: string;
  readonly buyer: string;
  readonly destinationId: string;
  /** ISO date. Time always matters; it is never left implicit. */
  readonly requiredBy: string;
  /** Days of slack against the required delivery date, as currently understood. */
  readonly marginDays: number;
  readonly units: number;
  readonly concern: Concern;
  readonly reference: string;
}

export type NetworkNode = Plant | Supplier | Destination;
