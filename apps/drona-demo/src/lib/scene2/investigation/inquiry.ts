/** Session-only, authored material inquiry. No supplier is contacted. */
export const MATERIAL_CASE = { orderId: "c1", supplierId: "sup:deccan-mainshaft-forgings", assessedOn: "2026-11-02", needOn: "2026-11-12", actBy: "2026-11-06", receiptFrom: "2026-11-15", receiptTo: "2026-11-17" } as const;
export type OwnerReply = "yes" | "no" | "unknown" | "refused" | "delayed";
export const OWNER_REPLY_LABEL: Readonly<Record<OwnerReply, string>> = { yes: "Yes", no: "No", unknown: "Unknown", refused: "Declined to answer", delayed: "Awaiting reply" };
export interface WorkingQuestion {
  readonly id: string; readonly question: string; readonly owner: string; readonly evidence: string;
  readonly callNote: string; readonly yes: string; readonly no: string; readonly action: string; readonly timing: string;
}
export type QuestionId = "allocation" | "dealer-stock" | "arrival";
export type MaterialFinding = "forecast-review" | "stock-protected" | "dealer-cover" | "timing-gap" | "arrival-revised";
export interface PracticeReply { readonly questionId: QuestionId; readonly question: string; readonly owner: string; readonly answer: OwnerReply; readonly meaning: string }
export interface SupplierInquiryState { readonly replies: readonly PracticeReply[] }
export const INITIAL_INQUIRY: SupplierInquiryState = { replies: [] };
export type SupplierInquiryEvent = { readonly type: "reply"; readonly questionId: QuestionId; readonly answer: OwnerReply } | { readonly type: "reset" };
export const latestMaterialReply = (state: SupplierInquiryState, id: QuestionId) => [...state.replies].reverse().find(r => r.questionId === id);
export function materialFinding(state: SupplierInquiryState): MaterialFinding {
  const allocation = latestMaterialReply(state, "allocation")?.answer;
  const dealer = latestMaterialReply(state, "dealer-stock")?.answer;
  const arrival = latestMaterialReply(state, "arrival")?.answer;
  if (allocation === "yes") return "stock-protected";
  if (allocation === "no" && dealer === "yes") return "dealer-cover";
  if (allocation === "no" && dealer === "no" && arrival === "yes") return "timing-gap";
  if (allocation === "no" && dealer === "no" && arrival === "no") return "arrival-revised";
  return "forecast-review";
}
export const materialConditionClosed = (state: SupplierInquiryState) => ["stock-protected", "dealer-cover", "arrival-revised"].includes(materialFinding(state));
export const MATERIAL_FINDING_LABEL: Readonly<Record<MaterialFinding, string>> = {
  "forecast-review": "Forecast · coverage under review", "stock-protected": "On-site cover evidenced", "dealer-cover": "Dealer cover evidenced",
  "timing-gap": "Forecast supported · timing gap", "arrival-revised": "Earlier receipt evidenced",
};
const TIMING = "Respond by 6 Nov · six days for approved stock release, transport and intake before 12 Nov.";
export const MATERIAL_QUESTIONS: Readonly<Record<QuestionId, WorkingQuestion>> = {
  allocation: {
    id: "allocation", question: "Is all billet for this main-shaft lot already usable and allocated at Deccan?",
    owner: "Deccan planning / stores", evidence: "The 2 Nov stock-and-allocation record for PO-2026-0417, including usable quantity and lot references.",
    callNote: "Check the entire required quantity. Ordered or in transit is not on-site cover. Partial cover belongs in Unknown until the uncovered quantity is established.",
    yes: "The sample stores record covers the full lot. This removes the shipment dependency for these units; other production conditions remain open.",
    no: "The sample record shows an uncovered balance. Ask the dealer whether unaffected, approved local stock can cover it.",
    action: "Confirm on-site allocation first. If any billet is outstanding, check dealer stock and the usable-receipt date.", timing: TIMING,
  },
  "dealer-stock": {
    id: "dealer-stock", question: "Has the dealer reserved unaffected local stock that can be usable at Deccan by 12 Nov?",
    owner: "Jalna Alloy Supply / Deccan procurement", evidence: "The stock location, approved grade, uncovered quantity, order reservation and dated delivery-and-intake plan.",
    callNote: "A catalogue listing or an unallocated stock balance is insufficient. The Yes example includes a scoped reservation and a usable-receipt plan; it does not mean delivery is complete.",
    yes: "The sample dealer confirmation reserves approved local billet with usable receipt on 11 Nov. The specific incoming-shipment concern is controlled; monitor execution.",
    no: "No unaffected dealer cover is available for the outstanding quantity. Check whether the latest shipment schedule still misses the need date.",
    action: "Check the dealer’s local cover before relying on the affected inbound shipment.", timing: TIMING,
  },
  arrival: {
    id: "arrival", question: "Does the latest shipment plan still put usable billet after the 12 Nov need date?",
    owner: "Dealer logistics / Deccan material planning", evidence: "The shipment reference and updated usable-receipt range, including unloading, clearance, inland movement and intake.",
    callNote: "Port arrival and usable material at the forge are different milestones. No means a revised plan with usable receipt by 12 Nov; an unconfirmed ETA belongs in Unknown.",
    yes: "The sample owner update retains 15–17 Nov usable receipt. With no on-site or dealer cover, the timing-gap forecast is supported; production has not yet stopped.",
    no: "A revised sample logistics plan puts usable receipt on 10–11 Nov. This weakens the original timing forecast; retain and monitor its assumptions.",
    action: "Prepare approved domestic cover before 6 Nov. If it cannot meet the need date, agree partial supply or resequencing with order planning.", timing: TIMING,
  },
};
export function replyMeaning(question: WorkingQuestion, answer: OwnerReply): string {
  if (answer === "yes") return question.yes;
  if (answer === "no") return question.no;
  if (answer === "refused") return "The owner declined to answer. Keep the uncertainty visible and agree another evidence path; this is not a No.";
  if (answer === "delayed") return "The reply is pending. Keep the forecast under review and follow up before the response deadline; this is not a No.";
  return "The owner does not know. The question remains unresolved; this is not a No.";
}
export function deccanInquiry(state: SupplierInquiryState): { readonly question: WorkingQuestion; readonly conclusion: string | null; readonly headline: string; readonly summary: string; readonly finding: MaterialFinding } {
  const finding = materialFinding(state);
  const allocation = latestMaterialReply(state, "allocation")?.answer;
  const dealer = latestMaterialReply(state, "dealer-stock")?.answer;
  if (finding === "stock-protected") return { finding, question: { ...MATERIAL_QUESTIONS.allocation, action: "Retain the scoped allocation and monitor the forging milestone. Reopen this condition if the allocation changes.", timing: "Owner: Deccan planning / stores · next checkpoint: allocated-lot release." }, conclusion: "The full required lot is usable and allocated at Deccan.", headline: "Allocated stock protects this lot from the shipment hold.", summary: "The recorded sample stores evidence removes this upstream exposure for turbines 41–52. It does not establish overall production or delivery reliability." };
  if (finding === "dealer-cover") return { finding, question: { ...MATERIAL_QUESTIONS["dealer-stock"], action: "Monitor the reserved dealer lot through release, transport and usable receipt on 11 Nov.", timing: "Owner: dealer logistics / Deccan planning · usable receipt due 11 Nov." }, conclusion: "Unaffected dealer stock is reserved for usable receipt on 11 Nov.", headline: "Local cover can protect the forging date.", summary: "The sample reservation addresses this material gap. Receipt remains a future milestone; the shipment hold itself has not ended." };
  if (finding === "arrival-revised") return { finding, question: { ...MATERIAL_QUESTIONS.arrival, action: "Track the revised usable-receipt plan for 10–11 Nov. Reopen the warning if its route or intake assumptions change.", timing: "Owner: dealer logistics · monitor the revised 10–11 Nov receipt plan." }, conclusion: "The revised plan puts usable billet ahead of the need date.", headline: "New logistics evidence weakens the original forecast.", summary: "A dated sample plan replaces the 15–17 Nov estimate with 10–11 Nov. This timing concern closes on that basis; arrival has not yet occurred." };
  if (finding === "timing-gap") return { finding, question: MATERIAL_QUESTIONS.arrival, conclusion: "The uncovered billet is still expected after the need date.", headline: "The forging lot has a supported material timing gap.", summary: "Neither Deccan nor its dealer can cover the outstanding billet. Usable receipt is forecast for 15–17 Nov, against a 12 Nov need date. Act before the domestic-cover option closes." };
  return { finding, question: allocation === "no" ? dealer === "no" ? MATERIAL_QUESTIONS.arrival : MATERIAL_QUESTIONS["dealer-stock"] : MATERIAL_QUESTIONS.allocation, conclusion: null,
    headline: "A shipment hold could leave this forging lot short of billet.", summary: "Drona connects a maritime escalation to the dealer’s incoming billet. Usable receipt is forecast for 15–17 Nov; Deccan needs it on 12 Nov. Existing stock could still protect the order." };
}
export function supplierInquiryReducer(state: SupplierInquiryState, event: SupplierInquiryEvent): SupplierInquiryState {
  if (event.type === "reset") return INITIAL_INQUIRY;
  const current = deccanInquiry(state);
  if (current.conclusion || current.question.id !== event.questionId) return state;
  return { replies: [...state.replies, { questionId: event.questionId, question: current.question.question, owner: current.question.owner, answer: event.answer, meaning: replyMeaning(current.question, event.answer) }] };
}
