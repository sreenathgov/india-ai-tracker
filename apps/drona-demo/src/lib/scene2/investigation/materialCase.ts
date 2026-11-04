import { DECCAN } from "./cases/deccan";
import { deccanInquiry, INITIAL_INQUIRY, latestMaterialReply, MATERIAL_CASE, MATERIAL_FINDING_LABEL, materialConditionClosed, type SupplierInquiryState } from "./inquiry";
import type { Claim, EvidenceItem, SupplierInvestigation } from "./types";
import { DECCAN_GRAPH } from "../supplychain/cases/deccan";
import { buildGraph } from "../supplychain/build";
import { withMappedContext } from "../supplychain/mapped";
import type { AuthoredNode } from "../supplychain/types";

const REQUEST_FOR = { allocation: "dc-req-stock", "dealer-stock": "dc-req-dealer", arrival: "dc-req-eta" } as const;
/** Derive every case surface from the same recorded session answers. No evidence is silently rewritten. */
export function projectMaterialInvestigation(state: SupplierInquiryState = INITIAL_INQUIRY): SupplierInvestigation {
  const decision = deccanInquiry(state), closed = materialConditionClosed(state);
  const replyEvidence: EvidenceItem[] = state.replies.map((reply, index) => ({
    id: `dc-ev-reply-${index + 1}`, sourceType: "supplier-communication", sourceName: `${reply.owner} · sample reply ${index + 1}`,
    sourceDate: MATERIAL_CASE.assessedOn, sourceDateKind: "authored", retrievedAt: "2026-11-02T08:00:00Z",
    scope: `${reply.question} Answer: ${reply.answer}.`, independence: { kind: "related", relatedTo: reply.questionId === "allocation" ? ["dc-ev-plan"] : ["dc-ev-order"] }, synthetic: true,
    excerpt: reply.answer === "yes" && reply.questionId === "allocation" ? "Stores confirms: the full required approved billet lot is received, usable and allocated to PO-2026-0417 / turbines 41–52. Allocation and usable-status references are attached to this sample record. No material for this lot depends on AF-884."
      : reply.answer === "no" && reply.questionId === "allocation" ? "Stores confirms an outstanding balance for the scoped main-shaft lot. Existing usable, allocated material does not cover the full requirement. The uncovered allocation remains linked to Jalna’s inbound billet."
      : reply.answer === "yes" && reply.questionId === "dealer-stock" ? "Dealer confirmation: unaffected, approved local billet covers the outstanding quantity and is reserved to this order. Release, transport and intake are planned for usable receipt at Deccan on 11 Nov. Receipt is not yet complete."
      : reply.answer === "no" && reply.questionId === "dealer-stock" ? "Dealer confirms no unaffected, approved local stock is reserved or available for the outstanding order quantity within the need date. The current inbound shipment remains the planned supply."
      : reply.answer === "yes" && reply.questionId === "arrival" ? "Dealer logistics reconfirms AF-884 usable receipt at Deccan on 15–17 Nov, conditional on release after the minimum hold and unchanged clearance, transport and intake. The plan remains later than the 12 Nov material need."
      : reply.answer === "no" && reply.questionId === "arrival" ? "Revised sample plan: the carrier has released the scoped shipment onto an earlier feasible movement. Dated clearance, inland movement and intake assumptions put usable receipt at Deccan on 10–11 Nov. This supersedes the earlier usable-receipt estimate; receipt has not occurred."
      : reply.meaning,
    limitation: "Authored response selected by the viewer; no real call, attachment or supplier contact. A reply records what its owner reports, not independent verification of a completed outcome.",
  }));
  const replyClaims: Claim[] = state.replies.map((reply, index) => ({
    id: `dc-reply-${index + 1}`, title: `${reply.questionId === "allocation" ? "On-site allocation" : reply.questionId === "dealer-stock" ? "Unaffected dealer cover" : "Revised arrival check"}: ${reply.answer}`,
    claim: `${reply.owner} reports: ${reply.meaning}`, claimType: "observation", confidence: reply.answer === "yes" || reply.answer === "no" ? "high" : "moderate", materiality: "contributing", observedAt: MATERIAL_CASE.assessedOn,
    supportingEvidenceIds: [replyEvidence[index].id], contradictingEvidenceIds: [], sourceIndependence: "single-source",
    falsifiers: ["A corrected, dated owner record for the same order, quantity and milestone."], affectedDependencyIds: [reply.questionId === "arrival" ? "dc-dep-route" : "dc-dep-billet"], affectedActionIds: [],
  }));
  const protectionEvidence = replyEvidence.filter((_, i) => {
    const r = state.replies[i];
    return (r.questionId !== "arrival" && r.answer === "yes") || (r.questionId === "arrival" && r.answer === "no");
  }).map(e => e.id);
  const responseEvidence = replyEvidence.filter((_, i) => state.replies[i].answer === "yes" || state.replies[i].answer === "no").map(e => e.id);
  const currentActionId = closed ? "dc-act-monitor" : decision.finding === "timing-gap" ? "dc-act-reserve" : decision.question.id === "arrival" ? "dc-act-eta" : "dc-act-cover";
  const answered = new Set(state.replies.filter(r => r.answer === "yes" || r.answer === "no").map(r => REQUEST_FOR[r.questionId]));
  const claims: Claim[] = DECCAN.claims.map(claim => claim.id === "dc-impact" ? { ...claim, contradictingEvidenceIds: protectionEvidence, supportingEvidenceIds: [...claim.supportingEvidenceIds, ...(decision.finding === "timing-gap" ? responseEvidence : [])] }
    : claim.id === "dc-receipt" && decision.finding === "arrival-revised" ? { ...claim, title: "Original forecast: 15–17 Nov", contradictingEvidenceIds: protectionEvidence } : claim);
  if (state.replies.length) claims.push(...replyClaims, {
    id: "dc-current-assessment", title: closed ? "This condition is controlled" : decision.finding === "timing-gap" ? "Timing gap supported" : "Stock coverage still unresolved",
    claim: `${decision.headline} ${decision.summary}`, claimType: "inference", confidence: "moderate", materiality: "controlling", validFrom: MATERIAL_CASE.assessedOn,
    supportingEvidenceIds: responseEvidence.length ? responseEvidence : replyEvidence.map(e => e.id), supportingClaimIds: ["dc-impact", ...replyClaims.map(c => c.id)], contradictingEvidenceIds: [], sourceIndependence: "drona-derived",
    falsifiers: ["New scoped evidence changes the quantity, usable allocation, receipt timing or material need date."], affectedDependencyIds: ["dc-dep-billet"], affectedActionIds: [currentActionId],
  });
  return { ...DECCAN,
    flagSentence: decision.headline, status: { label: MATERIAL_FINDING_LABEL[decision.finding], since: MATERIAL_CASE.assessedOn },
    claims, evidence: [...DECCAN.evidence, ...replyEvidence],
    fracturePath: DECCAN.fracturePath.map(step => ({ ...step, claimIds: [...step.claimIds, ...replyClaims.filter((_, i) => step.stage === (state.replies[i].questionId === "arrival" ? "dependency" : "supplier")).map(c => c.id), ...(step.stage === "commitment" && state.replies.length ? ["dc-current-assessment"] : [])] })),
    unresolved: closed ? [] : DECCAN.unresolved.filter(item => !item.resolvedBy || !answered.has(item.resolvedBy as typeof REQUEST_FOR[keyof typeof REQUEST_FOR])),
    nextBestEvidence: closed ? [] : DECCAN.nextBestEvidence.filter(item => !answered.has(item.id as typeof REQUEST_FOR[keyof typeof REQUEST_FOR])),
    interventionPosture: { stance: decision.finding === "timing-gap" ? "act-now" : "verify-first", summary: decision.question.action },
    actions: [...DECCAN.actions, ...(closed ? [{ id: "dc-act-monitor", label: "Monitor the evidenced cover", kind: "verify" as const, feasibility: "feasible" as const, condition: decision.question.action }] : [])],
    material: { ...DECCAN.material!, finding: decision.finding, closed, assessmentVersion: 1 + state.replies.length, currentActionId, receiptFrom: decision.finding === "arrival-revised" ? "2026-11-10" : MATERIAL_CASE.receiptFrom, receiptTo: decision.finding === "arrival-revised" ? "2026-11-11" : MATERIAL_CASE.receiptTo },
  };
}

export function projectMaterialGraph(state: SupplierInquiryState = INITIAL_INQUIRY) {
  const inv = projectMaterialInvestigation(state), closed = inv.material!.closed;
  const latest = (id: "allocation" | "dealer-stock" | "arrival") => {
    const reply = latestMaterialReply(state, id); if (!reply) return [];
    return [`dc-ev-reply-${state.replies.lastIndexOf(reply) + 1}`];
  };
  const nodes: AuthoredNode[] = DECCAN_GRAPH.nodes.map(node => {
    if (node.key === "dc-billet") return { ...node, concern: closed ? "mitigation" : latestMaterialReply(state, "allocation")?.answer === "no" ? "exposed" : "unresolved", detail: closed ? "Stock or timing cover evidenced" : latestMaterialReply(state, "allocation")?.answer === "no" ? "Uncovered balance reported" : "Current stock cover needs confirmation", concernNote: closed ? "Recorded sample evidence controls this specific material condition; other production dependencies remain separate." : "Only the uncovered quantity depends on timely incoming supply.", facts: [{ label: "Need date", value: "12 Nov · usable at Deccan" }, { label: "Current coverage", value: inv.material!.finding === "stock-protected" ? "Full usable, allocated on-site stock reported" : inv.material!.finding === "dealer-cover" ? "Unaffected dealer lot reserved · usable receipt 11 Nov" : inv.material!.finding === "arrival-revised" ? "Earlier usable receipt 10–11 Nov reported" : latestMaterialReply(state, "allocation")?.answer === "no" ? "On-site cover incomplete; dealer and receipt checks determine exposure" : "Usable order allocation not yet confirmed" }], evidenceIds: [...(node.evidenceIds ?? []), ...latest("allocation"), ...latest("dealer-stock")], reasoningClaimIds: [...(node.reasoningClaimIds ?? []), ...(state.replies.length ? ["dc-current-assessment"] : [])] };
    if (node.key === "dc-route") return { ...node, concern: closed ? "normal" : "exposed", detail: inv.material!.finding === "arrival-revised" ? "Revised usable receipt: 10–11 Nov" : node.detail, concernNote: inv.material!.finding === "arrival-revised" ? "The original hold-based forecast is superseded by the dated sample logistics plan." : node.concernNote, evidenceIds: [...(node.evidenceIds ?? []), ...latest("arrival")], facts: [...(node.facts ?? []).filter(f => f.label !== "Receipt range" && f.label !== "Timing gap"), { label: "Current usable receipt", value: inv.material!.finding === "arrival-revised" ? "10–11 Nov · revised owner plan" : "15–17 Nov · conditional forecast" }] };
    if (closed && node.key === "dc-jalna") return { ...node, concern: "normal", concernNote: "The scoped material condition is controlled by recorded stock or timing evidence.", facts: [...(node.facts ?? []).filter(f => f.label !== "Local stock"), { label: "Current dealer cover", value: inv.material!.finding === "dealer-cover" ? "Unaffected local lot reserved · usable receipt 11 Nov" : "Order protected by separate stock or timing evidence" }], evidenceIds: [...(node.evidenceIds ?? []), ...latest("dealer-stock")] };
    if (closed && (node.key === "dc-varna" || node.key === "dc-alternate")) return { ...node, concern: "normal" };
    return node;
  });
  return buildGraph(withMappedContext({ ...DECCAN_GRAPH, nodes, edges: DECCAN_GRAPH.edges.map(edge => closed ? { ...edge, concern: "normal" } : edge) }));
}
