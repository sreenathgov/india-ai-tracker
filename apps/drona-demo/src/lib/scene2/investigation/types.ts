/**
 * A supplier investigation: why Drona flagged one supplier on one order, how it
 * knows, what could weaken the finding, and what it would verify next.
 *
 * It references the order, the supplier and the assemblies by id and never copies
 * them. Units affected, the action window and the band are derived from the bill of
 * materials and the assessment at render time (`select.ts`), so the investigation
 * cannot disagree with the workbench it opens from.
 *
 * Every record here is synthetic. The suppliers, sources and figures are invented
 * for the demonstration and must never read as real companies or real incidents.
 */

/* ── Claims ─────────────────────────────────────────────────────────────────── */

/**
 * What kind of statement a claim is. The four are never collapsed: an observation
 * is read off a record; an inference is drawn from observations; a forecast states
 * a probability over a horizon; a scenario is a conditional ("if … then …").
 */
export type ClaimType = "observation" | "inference" | "forecast" | "scenario";

/** Qualitative only. Drona does not show confidence as a percentage. */
export type ClaimConfidence = "low" | "moderate" | "high";

/** How much the claim carries the finding. */
export type ClaimMateriality = "controlling" | "contributing" | "contextual";

/**
 * Whether the evidence behind a claim comes from sources that could not have
 * copied each other. Two documents from one supplier are one source.
 */
export type SourceIndependence = "independent" | "related" | "single-source" | "drona-derived";

export interface ForecastHorizon {
  readonly fromDays: number;
  readonly toDays: number;
  /** What the horizon is measured from, in words. */
  readonly basis: string;
}

/** A typed quantity a claim rests on, so figures are data rather than prose. */
export interface ClaimFigure {
  readonly key: string;
  readonly label: string;
  readonly value: number;
  readonly unit: "days" | "percent" | "lakh" | "units";
  /** For a range: the upper bound. `value` is then the lower bound. */
  readonly upTo?: number;
}

export interface Claim {
  readonly id: string;
  readonly claim: string;
  /** Concise graph title; the inspector always retains the complete statement. */
  readonly title?: string;
  /** Explicit reasoning links, separate from the physical dependency graph. */
  readonly supportingClaimIds?: readonly string[];
  readonly contextClaimIds?: readonly string[];
  readonly claimType: ClaimType;
  readonly confidence: ClaimConfidence;
  readonly materiality: ClaimMateriality;
  /** Observations: when it was seen. ISO date. */
  readonly observedAt?: string;
  /** Inferences, forecasts and scenarios: from when the claim holds. ISO date. */
  readonly validFrom?: string;
  /** Forecasts and scenarios only. */
  readonly forecastHorizon?: ForecastHorizon;
  readonly supportingEvidenceIds: readonly string[];
  readonly contradictingEvidenceIds: readonly string[];
  readonly sourceIndependence: SourceIndependence;
  /** A rival reading of this one claim, when it has its own. */
  readonly competingExplanation?: string;
  /** What, if found, would show the claim wrong. */
  readonly falsifiers: readonly string[];
  readonly affectedDependencyIds: readonly string[];
  readonly affectedActionIds: readonly string[];
  readonly figures?: readonly ClaimFigure[];
}

/* ── Provenance ─────────────────────────────────────────────────────────────── */

export type EvidenceSourceType =
  | "oem-record"
  | "supplier-record"
  | "erp-planning"
  | "supplier-communication"
  | "logistics-intelligence"
  | "market-data"
  | "financial-data"
  | "external-intelligence"
  | "regulatory-source"
  | "drona-analysis";

export interface EvidenceIndependence {
  readonly kind: SourceIndependence;
  /** Evidence ids this item shares an origin with. */
  readonly relatedTo: readonly string[];
}

/**
 * One piece of evidence. Source names are generic by design ("Global Shipping
 * Intelligence"), never a named publication. Which claims it supports is derived
 * from the claims (`claimsSupportedBy`), not stored twice.
 */
export interface EvidenceItem {
  readonly id: string;
  readonly sourceType: EvidenceSourceType;
  readonly sourceName: string;
  /** ISO date; use sourceDateKind to distinguish publication from review. */
  readonly sourceDate: string;
  readonly sourceDateKind?: "published" | "reviewed" | "authored";
  /** When Drona retrieved or observed it. ISO date-time. */
  readonly retrievedAt: string;
  /** What the source covers, in a phrase. */
  readonly scope: string;
  readonly independence: EvidenceIndependence;
  readonly synthetic: boolean;
  /** Public authority links are real; private case records remain authored. */
  readonly url?: string;
  /** Full authored extract, available from the evidence register. */
  readonly excerpt?: string;
  readonly limitation?: string;
  readonly eventAt?: string;
}

/* ── Time ───────────────────────────────────────────────────────────────────── */

/**
 * The regulatory clock, kept distinct because a proposal, its adoption, its legal
 * effect and its enforcement are four different dates that move an order differently.
 */
export type RegulatoryStage = "proposal" | "adoption" | "legal-effect" | "enforcement";

export interface TemporalState {
  /** When the underlying event happened, if known. */
  readonly eventAt?: string;
  /** When it was first published anywhere. */
  readonly publishedAt?: string;
  /** When Drona first observed it. */
  readonly observedAt: string;
  /** When this assessment was made; the action window counts from here. */
  readonly assessedAt: string;
  readonly forecastHorizon?: ForecastHorizon;
  readonly regulatory?: { readonly stage: RegulatoryStage; readonly at: string };
}

/* ── The finding ────────────────────────────────────────────────────────────── */

export type Mechanism =
  | "material-commitment"
  | "supplier-liquidity"
  | "hidden-upstream-concentration"
  | "technical-disposition"
  | "shared-resource-congestion"
  | "material-allocation"
  | "regulatory-import-readiness"
  | "input-price-and-availability";

/**
 * The fracture path, always these five stages in this order. The production stage
 * is a step on the supplier's route, not a solved milestone framework.
 */
export type FractureStage = "condition" | "dependency" | "supplier" | "production" | "commitment";

export const FRACTURE_STAGES: readonly FractureStage[] = [
  "condition",
  "dependency",
  "supplier",
  "production",
  "commitment",
];

export interface FractureStep {
  readonly stage: FractureStage;
  /** A short name for the step, e.g. "Charge material". */
  readonly label: string;
  readonly statement: string;
  readonly claimIds: readonly string[];
}

export type DependencyKind = "material" | "process-input" | "processing" | "capacity" | "logistics" | "finance" | "technical-authority" | "regulatory";

export interface InvestigationDependency {
  readonly id: string;
  readonly label: string;
  readonly kind: DependencyKind;
  /** The sub-tier party this dependency is on, when one is authored. */
  readonly subTierNodeId?: string;
}

export interface UnresolvedItem {
  readonly id: string;
  readonly statement: string;
  /** The next-best evidence request that would resolve it. */
  readonly resolvedBy?: string;
}

export interface CompetingExplanation {
  readonly statement: string;
  readonly falsifiers: readonly string[];
  readonly claimIds: readonly string[];
}

export interface EvidenceRequest {
  readonly id: string;
  readonly request: string;
  /** Who holds it: a role, never a named person. */
  readonly owner: string;
  /** What it would settle. */
  readonly resolves: string;
}

export type InterventionStance = "verify-first" | "act-now" | "hold-for-disposition" | "prepare";

export interface InterventionPosture {
  readonly stance: InterventionStance;
  readonly summary: string;
}

export type FinanceRelevanceState =
  | "potentially-relevant"
  | "not-presently-relevant"
  | "closed-pending-technical-disposition";

/**
 * Whether working capital bears on *this exposure*. Separate from the standing
 * working-capital pathway, which stays available to the supplier either way. The
 * chain, when present, is the order of conditions that must each be evidenced.
 */
export interface FinanceRelevance {
  readonly state: FinanceRelevanceState;
  readonly reason: string;
  readonly chain?: readonly string[];
}

export type ActionKind = "verify" | "reserve" | "resequence" | "qualify" | "procure" | "hold";

export interface InvestigationAction {
  readonly id: string;
  readonly label: string;
  readonly kind: ActionKind;
  readonly feasibility: "feasible" | "conditional" | "not-yet-assessed";
  readonly condition: string;
}

/** Research the case is built on. Internal only; never rendered. */
export interface InvestigationGrounding {
  readonly groundingRefs: readonly string[];
  readonly syntheticAssumptions: readonly string[];
}

export interface InvestigationStatus {
  readonly label: string;
  /** ISO date. */
  readonly since: string;
}

export interface SupplierInvestigation {
  readonly id: string;
  readonly orderId: string;
  readonly supplierId: string;
  /** The assemblies on this order the investigation concerns. References, not copies. */
  readonly componentIds: readonly string[];
  readonly status: InvestigationStatus;
  readonly primaryMechanism: Mechanism;
  readonly secondaryMechanisms: readonly Mechanism[];
  /** One sentence: the mechanism, never a verdict on the supplier. */
  readonly flagSentence: string;
  readonly fracturePath: readonly FractureStep[];
  readonly claims: readonly Claim[];
  readonly unresolved: readonly UnresolvedItem[];
  readonly competingExplanation: CompetingExplanation;
  readonly nextBestEvidence: readonly EvidenceRequest[];
  readonly interventionPosture: InterventionPosture;
  readonly financeRelevance: FinanceRelevance;
  readonly dependencies: readonly InvestigationDependency[];
  readonly evidence: readonly EvidenceItem[];
  readonly actions: readonly InvestigationAction[];
  readonly temporal: TemporalState;
  /** A process-input figure that is not the component's coverage, when the case has one. */
  readonly inputCover?: { readonly label: string; readonly days: number; readonly requiredDays: number };
  readonly regulatory?: {
    readonly rule: string;
    readonly jurisdiction: string;
    readonly legalStatus: "In force";
    readonly effectiveOn: string;
    readonly entryOn: string;
    readonly finding: import("@/lib/regulatory/state").Finding;
    readonly assessmentVersion: number;
  };
  readonly material?: {
    readonly finding: import("./inquiry").MaterialFinding;
    readonly assessmentVersion: number;
    readonly needOn: string;
    readonly actBy: string;
    readonly receiptFrom: string;
    readonly receiptTo: string;
    readonly closed: boolean;
    readonly currentActionId: string;
  };
  readonly grounding: InvestigationGrounding;
}
