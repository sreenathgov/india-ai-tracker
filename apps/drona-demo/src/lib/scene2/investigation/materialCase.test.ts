import { describe, expect, it } from "vitest";
import { INITIAL_INQUIRY, MATERIAL_CASE, supplierInquiryReducer, type OwnerReply, type QuestionId, type SupplierInquiryState } from "./inquiry";
import { projectMaterialInvestigation, projectMaterialGraph } from "./materialCase";
import { buildReasoningGraph, materialDecisionGraph, layoutReasoningGraph } from "./reasoning";
import { INITIAL_REGULATORY_STATE, regulatoryReducer } from "@/lib/regulatory/state";
import { exposureSummary, linkedPurchaseValue } from "@/lib/portfolio/commercial";
import { investigationHeader } from "./select";
const reply = (state: SupplierInquiryState, questionId: QuestionId, answer: OwnerReply) => supplierInquiryReducer(state, { type: "reply", questionId, answer });
const noCover = reply(reply(INITIAL_INQUIRY, "allocation", "no"), "dealer-stock", "no");
const branches = [INITIAL_INQUIRY, ...(["unknown", "refused", "delayed", "yes"] as const).map(answer => reply(INITIAL_INQUIRY, "allocation", answer)), reply(reply(INITIAL_INQUIRY, "allocation", "no"), "dealer-stock", "yes"), noCover, reply(noCover, "arrival", "yes"), reply(noCover, "arrival", "no")];
describe("material forecast and its dependent projections", () => {
  it("has a prospective, arithmetically grounded response window, separate from BOM cover", () => {
    const inv = projectMaterialInvestigation();
    expect((Date.parse(MATERIAL_CASE.needOn) - Date.parse(MATERIAL_CASE.actBy)) / 86400000).toBe(6);
    const facts = investigationHeader("c1", MATERIAL_CASE.supplierId, true, inv)!;
    expect(facts.window).toEqual({ days: 4, closesOn: "2026-11-06" });
    expect(facts.linkedCommitmentValue?.amount).toBe(1_600_000);
    expect(facts.unitsAffected).toBe(12);
    expect(inv.claims.find(c => c.id === "dc-receipt")?.forecastHorizon).toMatchObject({ fromDays: 13, toDays: 15 });
  });
  it.each(branches.map((state, index) => [index, state] as const))("resolves every provenance and reasoning reference in branch %s", (_, state) => {
    const inv = projectMaterialInvestigation(state), graph = projectMaterialGraph(state);
    const evidence = new Set(inv.evidence.map(e => e.id)), claims = new Set(inv.claims.map(c => c.id));
    const dependencies = new Set(inv.dependencies.map(d => d.id)), actions = new Set(inv.actions.map(a => a.id));
    for (const claim of inv.claims) {
      for (const id of [...claim.supportingEvidenceIds, ...claim.contradictingEvidenceIds]) expect(evidence.has(id), id).toBe(true);
      for (const id of claim.supportingClaimIds ?? []) expect(claims.has(id), id).toBe(true);
      for (const id of claim.affectedDependencyIds) expect(dependencies.has(id), id).toBe(true);
      for (const id of claim.affectedActionIds) expect(actions.has(id), id).toBe(true);
    }
    for (const item of [...graph.nodes, ...graph.edges]) {
      for (const id of item.evidenceIds) expect(evidence.has(id), id).toBe(true);
      for (const id of item.reasoningClaimIds) expect(claims.has(id), id).toBe(true);
    }
    for (const source of inv.evidence) {
      expect(source.synthetic).toBe(true); expect(source.url).toBeUndefined();
      expect(source.sourceDate <= inv.temporal.assessedAt).toBe(true);
      expect(source.retrievedAt.slice(0, 10) <= inv.temporal.assessedAt).toBe(true);
    }
    const reasoning = buildReasoningGraph(inv), focused = materialDecisionGraph(inv, reasoning);
    const nodes = new Set(focused.nodes.map(n => n.id));
    for (const edge of focused.edges) expect(nodes.has(edge.fromId) && nodes.has(edge.toId)).toBe(true);
    expect(new Set(focused.nodes.map(n => n.column)).size).toBe(4);
    const layout = layoutReasoningGraph(focused), boxes = [...layout.boxes.values()];
    expect(layout.height).toBeLessThanOrEqual(288);
    for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i], b = boxes[j];
      expect(a.x + a.width <= b.x || b.x + b.width <= a.x || a.y + a.height <= b.y || b.y + b.height <= a.y).toBe(true);
    }
  });
  it("adds owner records to the graph and retains the original forecast under counterevidence", () => {
    const state = reply(noCover, "arrival", "no"), inv = projectMaterialInvestigation(state);
    expect(inv.material).toMatchObject({ finding: "arrival-revised", closed: true, assessmentVersion: 4, receiptFrom: "2026-11-10" });
    expect(inv.claims.find(c => c.id === "dc-receipt")?.contradictingEvidenceIds).toContain("dc-ev-reply-3");
    expect(inv.unresolved).toHaveLength(0);
    expect(projectMaterialGraph(state).nodes.find(n => n.id === "sc:dc-route")?.detail).toContain("10–11");
    expect(buildReasoningGraph(inv).edges.some(e => e.kind === "supports-claim")).toBe(true);
  });
  it("closes or confirms only the scoped $1.6M exposure, with no double count or lost underlying value", () => {
    const protectedState = reply(INITIAL_INQUIRY, "allocation", "yes");
    expect(exposureSummary(INITIAL_REGULATORY_STATE, undefined, undefined, undefined, protectedState)).toMatchObject({ totalCents: 700_000_000, confirmedCents: 0 });
    const gap = reply(noCover, "arrival", "yes");
    expect(exposureSummary(INITIAL_REGULATORY_STATE, undefined, undefined, undefined, gap)).toMatchObject({ totalCents: 860_000_000, confirmedCents: 160_000_000 });
    const regClosed = regulatoryReducer(INITIAL_REGULATORY_STATE, { type: "record-scope", answer: "excluded" });
    expect(exposureSummary(regClosed, "c1", undefined, undefined, protectedState).totalCents).toBe(0);
    expect(linkedPurchaseValue("c1", MATERIAL_CASE.supplierId)?.amount).toBe(1_600_000);
    expect(investigationHeader("c2", MATERIAL_CASE.supplierId, true)?.hasInvestigation).toBe(false);
  });
  it.each(["unknown", "refused", "delayed"] as const)("keeps %s outside the confirmed-exposure total", answer => {
    const state = reply(noCover, "arrival", answer);
    expect(exposureSummary(INITIAL_REGULATORY_STATE, undefined, undefined, undefined, state).confirmedCents).toBe(0);
    expect(projectMaterialInvestigation(state).unresolved.some(item => item.id === "dc-un-eta")).toBe(true);
  });
});
