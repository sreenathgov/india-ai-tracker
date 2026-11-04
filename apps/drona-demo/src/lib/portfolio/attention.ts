/** Portfolio narrative for the selected regulatory case; figures come from its BOM. */
import { formatUSD } from "./commercial";
import { affectedUnits } from "@/lib/scene2/investigation/select";
import { commitmentById } from "@/lib/network/gazetteer";
import type { Confidence } from "@/lib/network/confidence";
import { regulatorySummary } from "@/lib/regulatory/investigation";
import { INITIAL_REGULATORY_STATE, REGULATORY_CASE, findingFor, findingClosed, latestScope, latestReadiness, type RegulatoryState } from "@/lib/regulatory/state";

export interface EvidenceItem {
  readonly label: string; readonly detail: string; readonly confidence: Confidence; readonly confidenceLabel: string;
}
export interface NordvindAttention {
  readonly unitsExposed: number; readonly unitsTotal: number; readonly windowDays: number;
  readonly unresolvedPaths: number; readonly evidence: readonly EvidenceItem[];
}
/** Legacy identifier retained to avoid unrelated renames; all displayed names are fictional. */
export function nordvindAttention(state: RegulatoryState = INITIAL_REGULATORY_STATE): NordvindAttention {
  const scope = latestScope(state), readiness = latestReadiness(state), finding = findingFor(state);
  const privateItem = (label: string, detail: string, held: boolean): EvidenceItem => ({ label, detail, confidence: held ? "verified" : "missing", confidenceLabel: held ? "Supplied demo record" : "Unresolved" });
  return {
    unitsExposed: affectedUnits(REGULATORY_CASE.orderId, REGULATORY_CASE.supplierId),
    unitsTotal: commitmentById(REGULATORY_CASE.orderId)!.units,
    windowDays: (Date.parse(REGULATORY_CASE.entryOn) - Date.parse(REGULATORY_CASE.assessedOn)) / 86400000,
    unresolvedPaths: findingClosed(finding) ? 0 : (scope?.answer === "covered" ? 1 : 2),
    evidence: [
      { label: "EU CBAM · public requirement", detail: "Definitive regime in force from 1 Jan 2026; shipment scope, threshold and exceptions must be checked.", confidence: "verified", confidenceLabel: "Public authority reviewed" },
      privateItem("Actual shipment scope", scope?.detail ?? "Article, customs procedure, importer and exception position not supplied.", !!scope),
      privateItem("Importer readiness", readiness?.detail ?? "Authorisation or qualifying application route not yet established; an empty file is not a negative answer.", !!readiness),
    ],
  };
}
export interface ChangeItem { readonly when: string; readonly text: string; }
export interface DronaBriefing { readonly primary: string; readonly supporting: string; readonly evidence: readonly EvidenceItem[]; readonly changes: readonly ChangeItem[]; }
export const CHANGES: readonly ChangeItem[] = [
  { when: "Today, 09:00", text: "CBAM requirement attached to the Denmark tower-section import for an applicability check." },
  { when: "Today, 09:05", text: "Scope and importer-readiness questions prepared for authorised owners; no response assumed." },
  { when: "Earlier snapshot", text: "Illustrative working-capital activity remains separate from the regulatory case." },
];
export function dronaBriefing(capital: { readonly weekCents: number; readonly pathways: number }, state: RegulatoryState = INITIAL_REGULATORY_STATE): DronaBriefing {
  const a = nordvindAttention(state);
  return { primary: `Wind Energy Coastal: ${regulatorySummary(state)} ${a.unitsExposed} of ${a.unitsTotal} units depend on these section sets.`, supporting: `The authored finance snapshot shows ${formatUSD(capital.weekCents)} across ${capital.pathways} pathways. Finance cannot substitute for an eligible regulatory route.`, evidence: a.evidence, changes: CHANGES };
}
