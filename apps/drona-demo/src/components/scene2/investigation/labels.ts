import type {
  ClaimConfidence,
  ClaimType,
  DependencyKind,
  EvidenceSourceType,
  FinanceRelevanceState,
  FractureStage,
  InterventionStance,
  Mechanism,
  SourceIndependence,
} from "@/lib/scene2/investigation";

/**
 * The model's vocabulary in the reviewer's words.
 *
 * Kept apart from the model so the data stays typed and terse, and apart from the
 * components so two surfaces cannot name the same state two ways.
 */

export const MECHANISM_LABEL: Readonly<Record<Mechanism, string>> = {
  "regulatory-import-readiness": "Regulatory · import readiness",
  "material-commitment": "Material commitment",
  "supplier-liquidity": "Supplier liquidity",
  "hidden-upstream-concentration": "Hidden upstream concentration",
  "technical-disposition": "Technical disposition",
  "shared-resource-congestion": "Shared-resource congestion",
  "material-allocation": "Material allocation",
  "input-price-and-availability": "Input price and availability",
};

/** The path reads left to right; these name what each step is, not what it says. */
export const STAGE_LABEL: Readonly<Record<FractureStage, string>> = {
  condition: "Condition",
  dependency: "Dependency",
  supplier: "Supplier consequence",
  production: "Production step",
  commitment: "Commitment consequence",
};

export const REGULATORY_STAGE_LABEL: Readonly<Record<FractureStage, string>> = { condition: "Published rule", dependency: "Applicability", supplier: "Accountable owner", production: "Import timing", commitment: "Order dependency" };

/** Inference, forecast and scenario are never collapsed into one word. */
export const CLAIM_TYPE_LABEL: Readonly<Record<ClaimType, string>> = {
  observation: "Observation",
  inference: "Inference",
  forecast: "Forecast",
  scenario: "Scenario",
};

/** Qualitative, and written as a word so it can never be read as a measurement. */
export const CONFIDENCE_LABEL: Readonly<Record<ClaimConfidence, string>> = {
  low: "Low",
  moderate: "Moderate",
  high: "High",
};

export const DEPENDENCY_KIND_LABEL: Readonly<Record<DependencyKind, string>> = {
  material: "Material",
  "process-input": "Process input",
  processing: "Processing",
  capacity: "Capacity",
  logistics: "Logistics",
  finance: "Finance",
  "technical-authority": "Technical authority",
  regulatory: "Regulatory",
};

export const SOURCE_TYPE_LABEL: Readonly<Record<EvidenceSourceType, string>> = {
  "oem-record": "OEM record",
  "supplier-record": "Supplier record",
  "erp-planning": "Planning system",
  "supplier-communication": "Supplier communication",
  "logistics-intelligence": "Logistics intelligence",
  "market-data": "Market data",
  "financial-data": "Financial data",
  "external-intelligence": "External intelligence",
  "regulatory-source": "Regulatory source",
  "drona-analysis": "Drona analysis",
};

/** The five reader-facing buckets a source type sorts into, for the Evidence Register's filter chips. */
export type EvidenceFilterGroup = "internal" | "supplier" | "external" | "market" | "regulatory";

export const EVIDENCE_FILTER_GROUP: Readonly<Record<EvidenceSourceType, EvidenceFilterGroup>> = {
  "oem-record": "internal",
  "erp-planning": "internal",
  "drona-analysis": "internal",
  "supplier-record": "supplier",
  "supplier-communication": "supplier",
  "logistics-intelligence": "external",
  "external-intelligence": "external",
  "market-data": "market",
  "financial-data": "market",
  "regulatory-source": "regulatory",
};

export type EvidenceFilter = "all" | EvidenceFilterGroup | "contradicting" | "unresolved";

export const EVIDENCE_FILTER_LABEL: Readonly<Record<EvidenceFilter, string>> = {
  all: "All",
  internal: "Internal",
  supplier: "Supplier",
  external: "External",
  market: "Market",
  regulatory: "Regulatory",
  contradicting: "Contradicting",
  unresolved: "Unresolved",
};

export const INDEPENDENCE_LABEL: Readonly<Record<SourceIndependence, string>> = {
  independent: "Independent",
  related: "Related source",
  "single-source": "Single source",
  "drona-derived": "Drona-derived",
};

export const STANCE_LABEL: Readonly<Record<InterventionStance, string>> = {
  "verify-first": "Verify before acting",
  "act-now": "Act now",
  "hold-for-disposition": "Hold for technical disposition",
  prepare: "Prepare the mitigation",
};

/** Relevance to this exposure. The standing pathway is a separate sentence. */
export const FINANCE_STATE_LABEL: Readonly<Record<FinanceRelevanceState, string>> = {
  "potentially-relevant": "Potentially relevant",
  "not-presently-relevant": "Not presently relevant",
  "closed-pending-technical-disposition": "Closed pending technical disposition",
};

export const FEASIBILITY_LABEL: Readonly<Record<"feasible" | "conditional" | "not-yet-assessed", string>> = {
  feasible: "Feasible",
  conditional: "Conditional",
  "not-yet-assessed": "Not yet assessed",
};

/** The standing pathway line, worded once and reused wherever finance is named. */
export const STANDING_PATHWAY_NOTE =
  "The standing working-capital pathway remains available to this supplier; the lender retains credit authority.";
