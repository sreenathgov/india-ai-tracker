import { nordvindAttention } from "./attention";
import { INITIAL_REGULATORY_STATE, FINDING_LABEL, findingFor, latestScope, latestReadiness, type RegulatoryState } from "@/lib/regulatory/state";
export type ReasoningState = "verified" | "inferred" | "unresolved";
export interface ReasoningLine { readonly state: ReasoningState; readonly text: string; }
export interface DronaAssistant { readonly headline: string; readonly observation: string; readonly note: string; readonly reasoning: readonly ReasoningLine[]; }
export function dronaAssistant(state: RegulatoryState = INITIAL_REGULATORY_STATE): DronaAssistant {
  const a = nordvindAttention(state), finding = findingFor(state), scope = latestScope(state), readiness = latestReadiness(state);
  return {
    headline: "Wind Energy · CBAM readiness.",
    observation: `${a.unitsExposed} of ${a.unitsTotal} units depend on the tower-section shipment to Denmark.`,
    note: `${FINDING_LABEL[finding]} · planned entry 16 Nov.`,
    reasoning: [
      { state: "verified", text: "CBAM is in force. Public rules alone do not establish shipment scope." },
      { state: "inferred", text: scope?.answer === "covered" ? "The supplied customs check establishes a covered import." : scope?.answer === "excluded" ? "The owner-checked exclusion closes this shipment's path." : "India → EU and the actual shipped article determine what to investigate." },
      { state: finding === "gap-confirmed" || finding === "condition-evidenced" || finding === "scope-excluded" ? "verified" : "unresolved", text: readiness ? FINDING_LABEL[finding] : scope?.answer === "excluded" ? "Retain the exclusion record and monitor changes." : "Ask the customs owner, then the importer. Missing evidence is not failure." },
    ],
  };
}
