/**
 * The audit trail behind a single claim.
 *
 * Constitution Article VI treats provenance as structural. This resolves, for any
 * claim: what it rests on, whether it was observed or reasoned to, what would show
 * it wrong, where it sits on the fracture path, and what could be done about it.
 * Phase 4's evidence surfaces read from this rather than re-deriving it.
 */
import type {
  Claim,
  EvidenceItem,
  FractureStep,
  InvestigationAction,
  InvestigationDependency,
  SupplierInvestigation,
} from "./types";

export type ClaimBasis = "observed" | "inferred" | "forecast" | "scenario";

const BASIS: Readonly<Record<Claim["claimType"], ClaimBasis>> = {
  observation: "observed",
  inference: "inferred",
  forecast: "forecast",
  scenario: "scenario",
};

export interface ClaimTrail {
  readonly claim: Claim;
  /** Observed, or reasoned to — never collapsed into one word. */
  readonly basis: ClaimBasis;
  readonly evidence: readonly EvidenceItem[];
  readonly contradictions: readonly EvidenceItem[];
  readonly falsifiers: readonly string[];
  /** Where the claim sits on the fracture path, in one sentence. */
  readonly whyItMatters: string;
  /** The fracture-path steps this claim carries. */
  readonly path: readonly FractureStep[];
  readonly dependencies: readonly InvestigationDependency[];
  readonly actions: readonly InvestigationAction[];
  /** What is being assumed about the future, or null where nothing is. */
  readonly futureAssumption: string | null;
}

const MATERIALITY: Readonly<Record<Claim["materiality"], string>> = {
  controlling: "This claim carries the finding: if it falls, the assessment falls with it.",
  contributing: "This claim supports the finding without carrying it on its own.",
  contextual: "This claim sets context around the finding rather than driving it.",
};

const resolve = <T extends { readonly id: string }>(
  pool: readonly T[],
  ids: readonly string[]
): readonly T[] => ids.flatMap((id) => pool.filter((item) => item.id === id));

const futureAssumptionFor = (claim: Claim): string | null => {
  if (claim.claimType === "observation" || claim.claimType === "inference") return null;
  const horizon = claim.forecastHorizon;
  if (!horizon) return "Holds a view about a period that has not happened yet.";
  return `Holds over ${horizon.fromDays} to ${horizon.toDays} days — ${horizon.basis}.`;
};

const whyItMattersFor = (inv: SupplierInvestigation, claim: Claim, path: readonly FractureStep[]): string => {
  if (path.length === 0) return MATERIALITY[claim.materiality];
  const where = path.map((step) => step.label).join(" → ");
  const reaches = path.some((step) => step.stage === "commitment")
    ? ` It reaches ${inv.componentIds.length > 1 ? "the assemblies" : "the assembly"} on this order.`
    : "";
  return `${MATERIALITY[claim.materiality]} It carries the path at ${where}.${reaches}`;
};

/** The full trail behind one claim, or null where the investigation does not make it. */
export function explainClaim(
  inv: SupplierInvestigation,
  claimId: string
): ClaimTrail | null {
  const claim = inv.claims.find((c) => c.id === claimId);
  if (!claim) return null;

  const path = inv.fracturePath.filter((step) => step.claimIds.includes(claim.id));

  return {
    claim,
    basis: BASIS[claim.claimType],
    evidence: resolve(inv.evidence, claim.supportingEvidenceIds),
    contradictions: resolve(inv.evidence, claim.contradictingEvidenceIds),
    falsifiers: claim.falsifiers,
    whyItMatters: whyItMattersFor(inv, claim, path),
    path,
    dependencies: resolve(inv.dependencies, claim.affectedDependencyIds),
    actions: resolve(inv.actions, claim.affectedActionIds),
    futureAssumption: futureAssumptionFor(claim),
  };
}
