import { describe, expect, it } from "vitest";
import { INITIAL_REGULATORY_STATE as initial, REGULATORY_CASE, REGULATORY_CASES, findingFor, latestReadiness, regulatoryReducer as reduce, type RegulatoryEvent, type RegulatoryState } from "./state";
import { regulatoryInvestigation, regulatorySummary } from "./investigation";
import { regulatoryGraph } from "./graph";
import { layoutGraph } from "@/lib/scene2/supplychain/layout";
import { fitFrame } from "@/lib/scene2/supplychain/frame";
import { applyView, DEFAULT_VIEW } from "@/lib/scene2/supplychain/view";
import { withRegulatoryActions } from "./workbench";
import { investigationHeader, investigationFor } from "@/lib/scene2/investigation";
import { supplierRecords } from "@/lib/scene2/supplierView";
import { dronaAssistant } from "@/lib/portfolio/assistant";
import { activityFeed } from "@/lib/portfolio/activity";
import { DEPENDENCY_TYPES, dependencyTotalOfType, commitmentsWithType, portfolioRows, mitigationTotals } from "@/lib/portfolio/portfolio";

const scope = (state = initial) => reduce(state, { type: "record-scope", answer: "covered" });
const gap = () => reduce(scope(), { type: "record-readiness", answer: "gap" });

describe("public signal → scoped inquiry → confirmed warning", () => {
  it("opens with public law and an authored plan, without private scope or readiness evidence", () => {
    const inv = regulatoryInvestigation(initial);
    expect(findingFor(initial)).toBe("applicability-review");
    expect(inv.evidence.filter((e) => e.synthetic)).toHaveLength(1);
    expect(inv.claims.some((c) => c.id === "cbam-cl-readiness")).toBe(false);
    expect(inv.claims.find((c) => c.id === "cbam-cl-entry")?.claimType).toBe("scenario");
    expect(inv.temporal.regulatory).toEqual({ stage: "legal-effect", at: "2026-01-01" });
  });
  it("refuses to confirm a gap before shipment applicability is established", () => {
    expect(reduce(initial, { type: "record-readiness", answer: "gap" })).toBe(initial);
  });
  it.each(["unknown", "refused", "delayed"] as const)("keeps a %s scope response unresolved", (answer) => {
    const state = reduce(initial, { type: "record-scope", answer });
    expect(findingFor(state)).toBe("applicability-review");
    expect(reduce(state, { type: "record-readiness", answer: "gap" })).toBe(state);
    expect(state.records[0].answer).toBe(answer);
  });
  it("does not turn an empty importer file into a legal failure", () => {
    expect(findingFor(scope())).toBe("readiness-review");
    expect(latestReadiness(scope())).toBeUndefined();
    expect(regulatorySummary(scope())).toContain("unconfirmed");
  });
  it.each(["unknown", "refused", "delayed"] as const)("retains a %s importer reply without inventing a negative answer", (answer) => {
    const state = reduce(scope(), { type: "record-readiness", answer });
    expect(findingFor(state)).toBe("readiness-review");
    expect(latestReadiness(state)?.answer).toBe(answer);
    expect(dronaAssistant(state).reasoning[2].state).toBe("unresolved");
    expect(regulatoryGraph(state).nodes.some((n) => n.concern === "exposed")).toBe(false);
  });
  it("confirms the bounded gap only on an explicit answer covering both eligible routes", () => {
    const state = gap(), inv = regulatoryInvestigation(state);
    expect(findingFor(state)).toBe("gap-confirmed");
    expect(latestReadiness(state)?.detail).toMatch(/neither.*nor/);
    const answer = inv.claims.find((c) => c.id === "cbam-cl-readiness")!;
    expect(answer.claimType).toBe("observation");
    expect(answer.supportingEvidenceIds).toEqual([latestReadiness(state)!.id]);
    expect(regulatoryGraph(state).nodes.some((n) => n.concern === "exposed")).toBe(true);
    expect(inv.claims.find((c) => c.id === "cbam-cl-entry")!.claimType).toBe("scenario");
  });
  it.each(["authorised", "application"] as const)("closes only the readiness condition on the checked %s route", (answer) => {
    const state = reduce(gap(), { type: "record-readiness", answer });
    expect(findingFor(state)).toBe("condition-evidenced");
    expect(regulatorySummary(state)).toContain("does not establish customs admission");
    expect(state.assessments.map((a) => a.finding)).toEqual(["applicability-review", "readiness-review", "gap-confirmed", "condition-evidenced"]);
    expect(state.records).toHaveLength(3);
    expect(regulatoryInvestigation(state).evidence.some((e) => e.scope.includes("neither a valid CBAM authorisation"))).toBe(true);
  });
  it("closes this path when a scoped exclusion is supplied", () => {
    const state = reduce(gap(), { type: "record-scope", answer: "excluded" });
    expect(findingFor(state)).toBe("scope-excluded");
    expect(latestReadiness(state)).toBeUndefined();
  });
  it("requires a fresh readiness check after scope changes, including a second covered shipment check", () => {
    const ready = reduce(scope(), { type: "record-readiness", answer: "authorised" });
    const changed = scope(ready);
    expect(findingFor(changed)).toBe("readiness-review");
    expect(changed.records).toHaveLength(3);
    expect(changed.assessments[3].predecessor).toBe(3);
  });
  it("can replay every historical assessment from its original record prefix", () => {
    const state = reduce(gap(), { type: "record-readiness", answer: "application" });
    for (const [i, a] of state.assessments.entries()) expect(findingFor({ ...state, records: state.records.slice(0, i) })).toBe(a.finding);
    expect(state.records.map((r) => Date.parse(r.receivedAt))).toEqual([...state.records.map((r) => Date.parse(r.receivedAt))].sort());
    expect(reduce(state, { type: "reset" })).toBe(initial);
  });
});

describe("one evidence state across the demo", () => {
  it.each([{ width: 1000, height: 240 }, { width: 760, height: 350 }])("keeps both regulatory checks and the rule visible in the desktop canvas %j", (viewport) => {
    const visible = applyView(regulatoryGraph(gap()), DEFAULT_VIEW);
    const layout = layoutGraph(visible), frame = fitFrame(layout, viewport);
    expect(visible.nodes.filter((n) => n.type === "regulatory")).toHaveLength(3);
    for (const box of layout.boxes.values()) {
      expect(frame.x + box.x * frame.scale).toBeGreaterThanOrEqual(0);
      expect(frame.y + box.y * frame.scale).toBeGreaterThanOrEqual(0);
      expect(frame.x + (box.x + box.width) * frame.scale).toBeLessThanOrEqual(viewport.width);
      expect(frame.y + (box.y + box.height) * frame.scale).toBeLessThanOrEqual(viewport.height);
    }
  });
  const events: RegulatoryEvent[] = [{ type: "record-scope", answer: "covered" }, { type: "record-readiness", answer: "gap" }, { type: "record-readiness", answer: "application" }, { type: "record-scope", answer: "unknown" }];
  const states: RegulatoryState[] = [initial];
  for (const event of events) states.push(reduce(states[states.length - 1], event));
  it.each(states.map((state) => [findingFor(state), state] as const))("keeps Overview, graph, header, activity and portfolio aligned at %s", (_label, state) => {
    const inv = regulatoryInvestigation(state), graph = regulatoryGraph(state);
    const facts = investigationHeader("c1", REGULATORY_CASE.supplierId, true, inv)!;
    expect(facts.status).toEqual(inv.status);
    expect(facts.window).toBeNull();
    expect(facts.regulatory?.entryOn).toBe("2026-11-16");
    expect(facts.unitsAffected).toBe(28);
    expect(dronaAssistant(state).note).toContain(inv.status.label);
    expect(portfolioRows(state).find((r) => r.commitment.id === "c1")!.cues.join(" ")).toContain(inv.status.label.toLowerCase());
    if (state.records.length) expect(activityFeed(state)[0].text).toContain(inv.status.label);
    const evidence = new Set(inv.evidence.map((e) => e.id));
    const claims = new Set(inv.claims.map((c) => c.id));
    for (const object of [...graph.nodes, ...graph.edges]) {
      for (const id of object.evidenceIds) expect(evidence.has(id), id).toBe(true);
      for (const id of object.reasoningClaimIds) expect(claims.has(id), id).toBe(true);
    }
    for (const node of graph.nodes.filter((n) => n.type === "regulatory")) expect(node.tier).toBeUndefined();
    for (const c of inv.claims) for (const id of c.supportingEvidenceIds) expect(evidence.has(id)).toBe(true);
  });
  it("closes the regulatory action without changing component criticality", () => {
    const original = supplierRecords("c1", true);
    const ready = reduce(scope(), { type: "record-readiness", answer: "authorised" });
    const before = withRegulatoryActions(original, gap()).find((r) => r.supplier.id === REGULATORY_CASE.supplierId)!;
    const after = withRegulatoryActions(original, ready).find((r) => r.supplier.id === REGULATORY_CASE.supplierId)!;
    expect(before.action).not.toBeNull();
    expect(after.action).toBeNull();
    expect(after.band).toBe(before.band);
    expect(mitigationTotals(ready)).toEqual({ verified: 13, underReview: 4, unknowns: 4 });
    expect(dependencyTotalOfType("regulatory")).toBe(1); // A closed case remains mapped.
  });
  it("counts one distinct mapped case, removes the quality category and avoids External overlap", () => {
    expect(dependencyTotalOfType("regulatory")).toBe(new Set(REGULATORY_CASES.map((c) => c.id)).size);
    expect(commitmentsWithType("regulatory").map((c) => c.id)).toEqual(["c1"]);
    expect(DEPENDENCY_TYPES.some((t) => String(t.id) === "quality")).toBe(false);
    expect(DEPENDENCY_TYPES.find((t) => t.id === "external")!.definition).toContain("Non-regulatory");
    expect(investigationFor("c1", "sup:kovai-castings-machining")).toBeNull();
  });
  it("uses current public authority while identifying every private record as authored", () => {
    const inv = regulatoryInvestigation(gap());
    for (const e of inv.evidence) {
      expect(e.sourceDate <= inv.temporal.assessedAt).toBe(true);
      expect(Date.parse(e.retrievedAt)).toBeLessThan(Date.parse("2026-11-03"));
      if (e.synthetic) expect(e.url).toBeUndefined();
      else expect(new URL(e.url!).hostname).toMatch(/^(taxation-customs.ec.europa.eu|eur-lex.europa.eu)$/);
    }
    const text = JSON.stringify(inv);
    expect(text).toContain("permitted emissions/default-value");
    expect(text).not.toMatch(/weld repair|rework campaign|UT indication|\d+%.*probability/);
  });
});
