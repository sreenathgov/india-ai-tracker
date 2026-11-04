import { DEMO_NOW } from "@/lib/demo/clock";
import type { InvestigationHeaderFacts, SupplierInvestigation } from "./index";
import { findingFor, type RegulatoryState } from "@/lib/regulatory/state";
import { regulatorySummary } from "@/lib/regulatory/investigation";
import type { WorkingQuestion } from "./inquiry";

/** The value of explicitly mapped affected lines, never a proxy for expected loss. */
export interface LinkedCommitmentValue {
  readonly amount: number;
  readonly currency: string;
  readonly orderLineIds: readonly string[];
  readonly asOf: string;
  readonly source: string;
  readonly basis?: string;
}
export function commitmentValueLabel(value?: LinkedCommitmentValue): string {
  if (!value || !Number.isFinite(value.amount) || value.amount < 0 || !/^[A-Z]{3}$/.test(value.currency) || !value.orderLineIds.length || !Number.isFinite(Date.parse(value.asOf)) || !value.source.trim()) return "Awaiting master data";
  return new Intl.NumberFormat(value.currency === "USD" ? "en-US" : "en-IN", { style: "currency", currency: value.currency, maximumFractionDigits: 0 }).format(value.amount);
}
export const isDeccan = (facts: Pick<InvestigationHeaderFacts, "orderId" | "supplierId">): boolean => facts.orderId === "c1" && facts.supplierId === "sup:deccan-mainshaft-forgings";
export const expiredWindow = (facts: InvestigationHeaderFacts): boolean => Boolean(facts.window && facts.window.closesOn < DEMO_NOW.toISOString().slice(0, 10));

export function regulatoryHeadline(state: RegulatoryState): string {
  switch (findingFor(state)) {
    case "applicability-review": return "Could CBAM hold up these tower sections?";
    case "readiness-review": return "Scope is confirmed. Is the importer ready?";
    case "gap-confirmed": return "The importer confirms an entry-readiness gap.";
    case "condition-evidenced": return "An eligible route is evidenced for the planned entry.";
    case "scope-excluded": return "This shipment is excluded on the checked scope.";
  }
}
export function regulatoryQuestion(state: RegulatoryState, stage: "scope" | "readiness"): WorkingQuestion {
  const finding = findingFor(state);
  if (stage === "scope") return {
    id: "scope", question: "Are these tower sections within CBAM scope for the 16 November Denmark entry?",
    owner: "OEM logistics / customs broker", evidence: "The goods/classification, procedure, importer, thresholds, exceptions and basis for the scope conclusion.",
    callNote: "Ask the customs owner, not the tower vendor. No means an actual out-of-scope conclusion; an incomplete check belongs in Unknown.",
    yes: "Covered scope is confirmed by the sample owner record. Next check the responsible importer’s eligible route.",
    no: "An out-of-scope conclusion is confirmed by the sample check. Retain its exact basis; it applies to this shipment only.",
    action: finding === "scope-excluded" ? "Retain the checked exclusion basis and reopen this condition if the goods, importer or procedure changes." : "Obtain the scoped applicability check and agree when the importer-readiness answer is needed.",
    timing: "Owner: OEM logistics / customs broker · useful reply-by time to be agreed.",
  };
  return {
    id: "readiness", question: "Does valid authorisation or a qualifying application route cover this importer and the 16 November entry?",
    owner: "Importer / indirect customs representative", evidence: "The authorisation/account or qualifying application reference, status, validity and coverage of this importer and entry.",
    callNote: "Ask about both eligible routes. No authorisation alone does not establish that no qualifying application route exists. An explicit No remains evidence even without an attachment.",
    yes: "The sample customs-owner record checks an eligible route for this entry. This closes this readiness condition only.",
    no: "The importer explicitly reports neither eligible route available. This supports a readiness-gap warning, not a prediction that customs has already refused the goods.",
    action: finding === "gap-confirmed" ? "Escalate the readiness gap to OEM logistics. Establish a lawful route and feasible timing before relying on the planned entry." : finding === "condition-evidenced" ? "Retain the checked route reference and monitor validity. Review other import and delivery conditions separately." : "Have the importer confirm an eligible entry route and the preparation time it requires.",
    timing: "Owner: importer / indirect customs representative · latest useful action time unconfirmed.",
  };
}
export function defaultDecision(inv: SupplierInvestigation): { headline: string; summary: string; question: WorkingQuestion } {
  const request = inv.nextBestEvidence[0];
  return { headline: inv.flagSentence, summary: inv.unresolved[0]?.statement ?? inv.interventionPosture.summary, question: {
    id: request?.id ?? inv.id, question: request?.request ?? "Keep the recorded condition under review.", owner: request?.owner ?? "Order planning",
    evidence: request?.resolves ?? "A change to the current evidence basis.", callNote: "Keep the answer scoped to this order, part, site, quantity and date.",
    yes: "", no: "", action: inv.interventionPosture.summary, timing: "Confirm feasibility and timing with the responsible owner before acting.",
  } };
}
export const regulatoryDecision = (state: RegulatoryState) => ({ headline: regulatoryHeadline(state), summary: findingFor(state) === "applicability-review" ? "The Denmark entry may fall within CBAM. Shipment scope and the importer’s eligible route still need owner confirmation." : regulatorySummary(state) });
