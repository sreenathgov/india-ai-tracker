import { mappedSuppliers } from "./mappedSuppliers";
import { findingFor, latestReadiness, latestScope, REGULATORY_CASE, type RegulatoryState } from "@/lib/regulatory/state";

export const ORDER_QUESTIONS = [
  { id: "regulatory", label: "How could CBAM affect the tower-section shipment?" },
  { id: "evidence", label: "What CBAM evidence is still needed?" },
  { id: "network", label: "How much of this order’s supplier network is mapped?" },
] as const;
export type OrderQuestion = typeof ORDER_QUESTIONS[number]["id"] | "unsupported";

const normaliseQuestion = (text: string): string => text.toLowerCase().replace(/[’']/g, "").replace(/[?!.]+$/g, "").trim().replace(/\s+/g, " ");
/** Match the visible suggestions and a small set of topic-specific paraphrases. */
export function orderQuestionFor(text: string): OrderQuestion {
  const normalised = normaliseQuestion(text);
  const suggested = ORDER_QUESTIONS.find(question => normaliseQuestion(question.label) === normalised);
  if (suggested) return suggested.id;
  if (/\bcbam\b/.test(normalised)) {
    if (/\b(evidence|documents?|records?|confirm|checks?|readiness)\b/.test(normalised)) return "evidence";
    if (/\b(affect|impact|mean|why|how|explain|relevant|apply|applies|applicability)\b/.test(normalised)) return "regulatory";
  }
  if (/\b(suppliers?|upstream|sub[- ]?tier)\b/.test(normalised) && /\b(mapped|mapping|coverage|how much|how many)\b/.test(normalised)) return "network";
  return "unsupported";
}

/** Pure read-only projection. Store question intent in the UI, so answers always
 * follow the latest received sample evidence rather than caching an old finding. */
export function orderAnswer(question: OrderQuestion, orderId: string, assessed: boolean, state: RegulatoryState): readonly string[] {
  if (question === "unsupported") return ["This demonstration supports the three suggested questions. Choose one to explore the order, evidence or mapped network. Live AI is not connected."];
  if (question === "network") {
    const mapped = mappedSuppliers(orderId);
    return [
      `${mapped.total} distinct suppliers are registered in the available network: ${mapped.direct} direct and ${mapped.upstream} additional upstream parties. Shared suppliers are counted once.`,
      `Upstream detail is available behind ${mapped.expandedRoots} direct suppliers. These records show where to investigate; they do not confirm every party’s participation in this order. Coverage is partial.`,
    ];
  }
  if (!assessed) return ["This order has no completed detailed assessment. Review the planning brief and available bill of materials before drawing a risk conclusion. Use the header assessment control when the required inputs are available."];
  if (orderId !== REGULATORY_CASE.orderId) return ["This demo’s authored investigation covers the Wind Energy order. For this order, review the planning brief and supplier records; no additional case-specific answer is authored here."];
  const finding = findingFor(state);
  const closed = finding === "scope-excluded" || finding === "condition-evidenced";
  if (question === "regulatory") {
    const context = "For Tiruchi’s tower sections going to Denmark, Drona separates shipment applicability from importer readiness. The first check establishes whether the actual import is covered; the second examines evidence for the responsible importer’s readiness.";
    const current = finding === "scope-excluded"
      ? "The sample customs-owner record excludes this shipment from the selected obligation. This concern is closed for that shipment; other supplier commitments remain separate."
      : finding === "condition-evidenced"
      ? "The scoped importer-readiness condition is evidenced in the sample record. That closes this condition; reporting, costs and customs admission remain separate checks."
      : finding === "gap-confirmed"
      ? "The sample importer reply explicitly confirms a readiness gap for the planned import. It needs follow-up with the importer; it does not establish that the whole production order will be delayed."
      : finding === "readiness-review"
      ? "The sample scope check records this shipment as covered. Importer readiness remains under review; missing evidence does not confirm a gap."
      : "Applicability remains under review. A Denmark destination prompts a check; it does not establish that CBAM applies or that the shipment will be delayed.";
    return [context, current];
  }
  if (closed) return [finding === "scope-excluded"
    ? "The sample customs-owner check excludes this shipment. Retain the scope record and review it if the shipment changes."
    : "The scoped importer-readiness condition is evidenced. Retain the checked record and review it if the import or responsible party changes.",
    "Continue reviewing other open supplier conditions. Closing this case does not clear the whole order."];
  if (finding === "applicability-review") {
    const answer = latestScope(state)?.answer;
    const prefix = answer === "unknown" ? "The scope owner has not established applicability. " : answer === "refused" ? "The scope owner declined the requested check. " : answer === "delayed" ? "The scope owner’s response is delayed. " : "";
    return [prefix + "Ask OEM logistics or the customs broker to confirm the actual shipped article, customs procedure, importer and exemption position for the tower sections.", "A Denmark destination prompts a check; it does not establish CBAM applicability. Supplier location alone does not confirm the obligation."];
  }
  const readiness = latestReadiness(state)?.answer;
  if (finding === "gap-confirmed") return ["The importer explicitly confirmed a readiness gap in the sample record. Request owner-checked evidence of a valid authorisation or qualifying application route covering this planned import.", "The importer or indirect customs representative owns that evidence. Silence, a delayed reply or an unchecked document does not close the condition."];
  const prefix = readiness === "unknown" ? "Readiness remains unknown. " : readiness === "refused" ? "The readiness owner declined the requested position. " : readiness === "delayed" ? "The readiness response is delayed. " : "";
  return [prefix + "Shipment scope is covered in the sample record. Ask the importer or indirect customs representative for evidence of a valid authorisation or qualifying application route covering this import.", "Missing documentation is an open question, not proof that authorisation is absent."];
}
