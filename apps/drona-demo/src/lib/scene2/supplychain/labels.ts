import type { ConcernState, EvidenceState, GraphNodeType, GraphRelation } from "./types";

/**
 * The graph's vocabulary in the reviewer's words.
 *
 * Kept apart from the model so the data stays typed and terse, and apart from the
 * components so the canvas, the inspector and the legend cannot name the same state
 * three ways.
 */

export const NODE_TYPE_LABEL: Readonly<Record<GraphNodeType, string>> = {
  order: "Order",
  component: "Component",
  supplier: "Supplier",
  material: "Material",
  process: "Process",
  facility: "Facility",
  route: "Route",
  regulatory: "Regulatory",
  authority: "Human approval authority",
};

/** Read from the dependent to the dependency: "the order requires the component". */
export const RELATION_LABEL: Readonly<Record<GraphRelation, string>> = {
  requires: "requires",
  "supplied-by": "supplied by",
  "sourced-from": "sourced from",
  "processed-at": "processed at",
  "depends-on": "depends on",
  "qualified-through": "qualified through",
  "routed-through": "routed through",
  "uses-material": "uses",
  "shares-capacity-with": "shares capacity with",
  "requires-approval-from": "requires approval from",
};

export const EVIDENCE_LABEL: Readonly<Record<EvidenceState, string>> = {
  verified: "Verified",
  inferred: "Inferred",
  unresolved: "Unresolved",
};

/** What the shape means, for the legend. Never "risk" — this axis is not severity. */
export const EVIDENCE_MEANING: Readonly<Record<EvidenceState, string>> = {
  verified: "Established against a record Drona holds",
  inferred: "Reasoned from adjacent records, not stated anywhere",
  unresolved: "Named, with nothing behind it yet",
};

export const CONCERN_LABEL: Readonly<Record<ConcernState, string>> = {
  normal: "Context",
  active: "Under investigation",
  exposed: "Exposed dependency",
  unresolved: "Unresolved dependency",
  mitigation: "Possible alternate",
};

export const CONCERN_MEANING: Readonly<Record<ConcernState, string>> = {
  normal: "In the network, not in this concern",
  active: "The supplier this investigation is about",
  exposed: "The concern travels through here",
  unresolved: "It may travel through here; Drona cannot yet say",
  mitigation: "A route out, if it can be qualified",
};

/** The supplier tier, worded so it can never be read onto a material or a process. */
export const TIER_LABEL: Readonly<Record<1 | 2 | 3, string>> = {
  1: "Tier 1",
  2: "Tier 2",
  3: "Tier 3",
};
