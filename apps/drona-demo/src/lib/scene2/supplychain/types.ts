/**
 * The dependency graph for one supplier on one commitment.
 *
 * It answers one question: what does this supplier depend on for *this* production
 * commitment, and where does the current concern propagate through that network.
 * It is not a supplier master-data graph, not a company ontology viewer and not a
 * provenance graph — those are different surfaces with different anchors.
 *
 * Three rules hold the model together:
 *
 * 1. **Tier is derived, and only suppliers have one.** A tier counts supplier
 *    relationships along the path from the order. A material, a process, a facility
 *    or a route is never "Tier 2" — it belongs to the tier of the supplier it hangs
 *    from. Forcing every object into a supplier hierarchy would make the word
 *    meaningless in the one place it carries weight.
 * 2. **Evidence state and concern state are different axes.** How well Drona knows a
 *    thing is not how exposed it is. A verified dependency can be the worst one on
 *    screen, and an unresolved one may not matter at all.
 * 3. **Every node and edge can carry provenance.** `evidenceIds` and
 *    `reasoningClaimIds` are structural from the start, so Phase 4B reads them
 *    rather than retrofitting them into a graph that was never built for it.
 *
 * Everything authored against this model is synthetic.
 */

/** The eight object kinds the investigation graph can hold. */
export type GraphNodeType =
  | "order"
  | "component"
  | "supplier"
  | "material"
  | "process"
  | "facility"
  | "route"
  | "regulatory"
  | "authority";

/**
 * How one object depends on another. Read from the dependent to the dependency:
 * `{from: order, to: component, relation: "requires"}` is "the order requires the
 * component". `shares-capacity-with` is the one lateral relation — it does not
 * deepen the network, it says two branches are not independent.
 */
export type GraphRelation =
  | "requires"
  | "supplied-by"
  | "sourced-from"
  | "processed-at"
  | "depends-on"
  | "qualified-through"
  | "routed-through"
  | "uses-material"
  | "shares-capacity-with"
  | "requires-approval-from";

/** Lateral relations connect without adding depth, so they never set a tier. */
export const LATERAL_RELATIONS: ReadonlySet<GraphRelation> = new Set(["shares-capacity-with"]);

/**
 * How well Drona knows the object or the relationship.
 *
 * Drawn as three shapes, not three colours: solid, softened, open. An unresolved
 * dependency is a gap in the picture, not a red alarm — red here would say Drona
 * has found something bad, when what it has found is nothing at all.
 */
export type EvidenceState = "verified" | "inferred" | "unresolved";

/**
 * Where the current concern actually sits.
 *
 * `normal` is context and carries no colour. `active` is the supplier under
 * investigation. `exposed` is on the path the concern travels. `unresolved` is a
 * dependency the concern *may* travel through, which Drona cannot yet establish.
 * `mitigation` is a route out. Only the last four are emphasised, and only the
 * middle two carry concern ink, so the graph never floods.
 */
export type ConcernState = "normal" | "active" | "exposed" | "unresolved" | "mitigation";

/** Supplier relationships only. Three is the floor of the demo's resolution. */
export type SupplierTier = 1 | 2 | 3;

/** One line in the inspector: what the field is, and what it says here. */
export interface NodeFact {
  readonly label: string;
  readonly value: string;
}

/**
 * The Phase 4B hooks. Present on every node and every edge, empty where the case
 * has not wired them yet — an empty array is an honest "not yet", where an absent
 * field would be a model that cannot answer the question at all.
 */
export interface Provenance {
  /** Evidence items in the investigation's own register. */
  readonly evidenceIds: readonly string[];
  /** Claims whose reasoning depends on this node or relationship. */
  readonly reasoningClaimIds: readonly string[];
}

/** A node as a case file writes it. Ids are keys here; `build` prefixes them. */
export interface AuthoredNode extends Partial<Provenance> {
  readonly key: string;
  readonly type: GraphNodeType;
  readonly name: string;
  /** What it is, in a phrase. The card's second line. */
  readonly detail: string;
  readonly place?: string;
  readonly evidence: EvidenceState;
  readonly concern: ConcernState;
  /** Why it is in concern, in one sentence. Only where concern is not normal. */
  readonly concernNote?: string;
  /** Type-specific inspector fields, in reading order. */
  readonly facts?: readonly NodeFact[];
  /** The investigation dependency this node stands for, where it stands for one. */
  readonly dependencyId?: string;
  /** The sub-tier party record behind it, where Drona holds one. */
  readonly subTierNodeId?: string;
  /**
   * Background, not a finding.
   *
   * Set on the parties Drona holds behind this supplier that it did not judge to
   * bear on this commitment. They are the difference between "the relevant network"
   * and "everything mapped", and they are never authored by hand — `mapped.ts`
   * marks them when it pulls the sub-tier records in.
   */
  readonly context?: boolean;
}

export interface AuthoredEdge extends Partial<Provenance> {
  /** The dependent. */
  readonly from: string;
  /** What it depends on. */
  readonly to: string;
  readonly relation: GraphRelation;
  readonly evidence: EvidenceState;
  readonly concern: ConcernState;
  /** What the relationship rests on, in a phrase. */
  readonly basis: string;
}

export interface CaseGraph {
  readonly orderId: string;
  readonly supplierId: string;
  /** The root: the order node's key. Everything else reaches it. */
  readonly rootKey: string;
  readonly nodes: readonly AuthoredNode[];
  readonly edges: readonly AuthoredEdge[];
}

/** A node after resolution: depth, tier and provenance all settled. */
export interface GraphNode extends Provenance {
  readonly id: string;
  readonly type: GraphNodeType;
  readonly name: string;
  readonly detail: string;
  readonly place?: string;
  readonly evidence: EvidenceState;
  readonly concern: ConcernState;
  readonly concernNote?: string;
  readonly facts: readonly NodeFact[];
  readonly dependencyId?: string;
  readonly subTierNodeId?: string;
  /** Background Drona holds about the supplier, outside this commitment's network. */
  readonly context: boolean;
  /** Columns from the order. Layout only; it is not a tier. */
  readonly depth: number;
  /** Supplier nodes only: how many supplier relationships deep this party sits. */
  readonly tier?: SupplierTier;
  /** The tier this node belongs to — its own, or its nearest supplier ancestor's. */
  readonly tierScope: SupplierTier;
  /** The node it hangs from in the spanning tree. Null for the order. */
  readonly parentId: string | null;
}

export interface GraphEdge extends Provenance {
  readonly id: string;
  readonly fromId: string;
  readonly toId: string;
  readonly relation: GraphRelation;
  readonly evidence: EvidenceState;
  readonly concern: ConcernState;
  readonly basis: string;
}

export interface DependencyGraph {
  readonly orderId: string;
  readonly supplierId: string;
  readonly rootId: string;
  readonly nodes: readonly GraphNode[];
  readonly edges: readonly GraphEdge[];
  /** The nodes the concern travels through, and the spine reconnecting them. */
  readonly criticalPathIds: ReadonlySet<string>;
}
