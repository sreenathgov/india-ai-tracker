/** The investigation model's public surface. Components import from here. */
export * from "./types";
export { GROUNDING_SOURCES, unlocatedSources, type GroundingSource } from "./grounding";
export { INVESTIGATIONS, investigationFor } from "./registry";
export {
  actionWindow,
  affectedSerials,
  affectedUnits,
  claimsForEvidence,
  claimsSupportedBy,
  evidenceById,
  evidenceRegisterRows,
  evidenceState,
  investigationHeader,
  serialUnion,
  type ActionWindow,
  type EvidenceClaims,
  type EvidenceRegisterRow,
  type EvidenceState,
  type InvestigationHeaderFacts,
} from "./select";
export { forecastQualifier, type ForecastQualifier } from "./forecast";
export { explainClaim, type ClaimBasis, type ClaimTrail } from "./auditTrail";
