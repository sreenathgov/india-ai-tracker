import { describe, expect, it } from "vitest";
import { INITIAL_REGULATORY_STATE, regulatoryReducer } from "@/lib/regulatory/state";
import { guideStep, resultCopy, guideAct, financialGuideCopy, GUIDE_STEPS, TOUR_SUPPLIER } from "./model";

const order = { scene: 2, commitmentId: "c1" };
const investigation = { supplierId: TOUR_SUPPLIER };
describe("guided case progression", () => {
  it("requires the real order, completed assessment and target investigation", () => {
    expect(guideStep({ scene: 1, commitmentId: null }, null, INITIAL_REGULATORY_STATE)).toBe("map");
    expect(guideStep({ scene: 1, commitmentId: null }, null, INITIAL_REGULATORY_STATE, true)).toBe("risks");
    expect(guideStep({ scene: 1, commitmentId: null }, null, INITIAL_REGULATORY_STATE, true, true)).toBe("capital");
    expect(guideStep({ scene: 1, commitmentId: null }, null, INITIAL_REGULATORY_STATE, true, true, false, true)).toBe("exposure");
    expect(guideStep({ scene: 1, commitmentId: null }, null, INITIAL_REGULATORY_STATE, true, true, true, true)).toBe("order");
    expect(guideStep({ ...order, assessmentStatus: "not_assessed" }, null, INITIAL_REGULATORY_STATE)).toBe("assessment");
    expect(guideStep({ ...order, assessmentStatus: "analysing" }, null, INITIAL_REGULATORY_STATE)).toBe("assessment");
    expect(guideStep({ ...order, assessmentStatus: "available" }, null, INITIAL_REGULATORY_STATE)).toBe("investigate");
    expect(guideStep(order, { supplierId: "sup:deccan-mainshaft-forgings" }, INITIAL_REGULATORY_STATE)).toBe("investigate");
  });
  it("shows the order introduction after actual navigation and before supplier inquiry", () => {
    expect(guideStep(order, null, INITIAL_REGULATORY_STATE, true, true, true, true, false)).toBe("order-overview");
    expect(guideAct("order-overview")).toBe(2);
    expect(guideStep(order, null, INITIAL_REGULATORY_STATE, true, true, true, true, true)).toBe("investigate");
    expect(guideStep(order, investigation, INITIAL_REGULATORY_STATE, true, true, true, true, false)).toBe("scope");
  });
  it("does not advance unknown, declined or delayed answers into a gap", () => {
    for (const answer of ["unknown", "refused", "delayed"] as const) {
      const unresolvedScope = regulatoryReducer(INITIAL_REGULATORY_STATE, { type: "record-scope", answer });
      expect(guideStep(order, investigation, unresolvedScope)).toBe("scope");
      const covered = regulatoryReducer(INITIAL_REGULATORY_STATE, { type: "record-scope", answer: "covered" });
      const unresolvedReadiness = regulatoryReducer(covered, { type: "record-readiness", answer });
      expect(guideStep(order, investigation, unresolvedReadiness)).toBe("readiness");
    }
  });
  it("reopens scope after a revised scope invalidates the old readiness receipt", () => {
    const covered = regulatoryReducer(INITIAL_REGULATORY_STATE, { type: "record-scope", answer: "covered" });
    const gap = regulatoryReducer(covered, { type: "record-readiness", answer: "gap" });
    expect(guideStep(order, investigation, gap)).toBe("result");
    const revised = regulatoryReducer(gap, { type: "record-scope", answer: "unknown" });
    expect(guideStep(order, investigation, revised)).toBe("scope");
  });
  it("describes exclusion, evidenced readiness and a gap as different outcomes", () => {
    expect(resultCopy("gap-confirmed").body).toContain("neither eligible entry route");
    expect(resultCopy("gap-confirmed").body).toContain("Customs refusal and delivery delay have not been established");
    expect(resultCopy("scope-excluded").body).toContain("excludes this shipment");
    expect(resultCopy("condition-evidenced").body).toContain("supports an eligible entry route");
  });
});


describe("approved portfolio-to-case arc", () => {
  it("keeps capital before money and orders, and starts Act Two at the actual order", () => {
    expect(GUIDE_STEPS.slice(0, 5)).toEqual(["map", "risks", "capital", "exposure", "order"]);
    for (const step of GUIDE_STEPS.slice(0, 5)) expect(guideAct(step)).toBe(1);
    expect(guideAct(guideStep({ scene: 2, commitmentId: "c1", assessmentStatus: "available" }, null, INITIAL_REGULATORY_STATE))).toBe(2);
    expect(guideAct("scope")).toBe(2);
  });
  it("keeps the portfolio and order narration tied to the revised assessment", () => {
    expect(financialGuideCopy("exposure", INITIAL_REGULATORY_STATE).body).toContain("$8.6M");
    expect(financialGuideCopy("order", INITIAL_REGULATORY_STATE).body).toContain("$6.4M");
    const excluded = regulatoryReducer(INITIAL_REGULATORY_STATE, { type: "record-scope", answer: "excluded" });
    expect(financialGuideCopy("exposure", excluded).body).toContain("$3.8M");
    expect(financialGuideCopy("order", excluded).body).toContain("$1.6M");
  });
});


describe("supplier overview observation", () => {
  it("follows the planning brief and completed assessment without opening a case", () => {
    expect(guideStep(order, null, INITIAL_REGULATORY_STATE, true, true, true, true, false, false)).toBe("order-overview");
    expect(guideStep({ ...order, assessmentStatus: "analysing" }, null, INITIAL_REGULATORY_STATE, true, true, true, true, true, false)).toBe("assessment");
    expect(guideStep(order, null, INITIAL_REGULATORY_STATE, true, true, true, true, true, false)).toBe("supplier-overview");
    expect(guideAct("supplier-overview")).toBe(2);
    expect(guideStep(order, null, INITIAL_REGULATORY_STATE, true, true, true, true, true, true)).toBe("investigate");
    expect(guideStep(order, investigation, INITIAL_REGULATORY_STATE, true, true, true, true, true, false)).toBe("scope");
  });
});
