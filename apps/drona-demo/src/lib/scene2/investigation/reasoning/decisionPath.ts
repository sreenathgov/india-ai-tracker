import type { SupplierInvestigation } from "../types";

/**
 * The controlling-materiality claims, in the order the fracture path tells the
 * story — condition through commitment — so "Decision path" reads as the spine
 * of the case rather than an unordered subset. A controlling claim the fracture
 * path never names still belongs on the path; it's appended after the named run
 * rather than silently dropped.
 */
export function decisionPathClaimIds(inv: SupplierInvestigation): string[] {
  const controlling = new Set(inv.claims.filter((claim) => claim.materiality === "controlling").map((claim) => claim.id));
  const ordered: string[] = [];
  const seen = new Set<string>();

  for (const step of inv.fracturePath) {
    for (const claimId of step.claimIds) {
      if (controlling.has(claimId) && !seen.has(claimId)) {
        seen.add(claimId);
        ordered.push(claimId);
      }
    }
  }
  for (const claimId of controlling) {
    if (!seen.has(claimId)) {
      seen.add(claimId);
      ordered.push(claimId);
    }
  }
  return ordered;
}

/**
 * Claims a reader should expect Drona to be able to defend against: something
 * names a way this could be wrong. A claim qualifies if it carries its own
 * falsifiers, has evidence recorded against it, or is one of the claims the
 * investigation's competing explanation is contesting.
 */
export function challengedClaimIds(inv: SupplierInvestigation): string[] {
  const contested = new Set(inv.competingExplanation.claimIds);
  return inv.claims
    .filter(
      (claim) =>
        claim.falsifiers.length > 0 ||
        claim.contradictingEvidenceIds.length > 0 ||
        Boolean(claim.competingExplanation) ||
        contested.has(claim.id)
    )
    .map((claim) => claim.id);
}
