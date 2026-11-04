import { describe, expect, it } from "vitest";
import { INITIAL_REGULATORY_STATE, regulatoryReducer } from "@/lib/regulatory/state";
import { commitmentById, supplierById } from "@/lib/network/gazetteer";
import { investigationHeader } from "@/lib/scene2/investigation/select";
import { ASSESSED_COMMERCIAL_ORDERS, CAPITAL_SNAPSHOT, PURCHASE_LINES, COMMERCIAL_CONDITIONS, exposureSummary, linkedPurchaseValue, capitalTotals, formatUSD } from "./commercial";

describe("fictional commercial exposure, separate from loss and funding", () => {
  it("counts each affected purchase line once even when multiple conditions share it", () => {
    const summary = exposureSummary();
    expect(summary).toMatchObject({ totalCents: 860_000_000, reviewCents: 860_000_000, confirmedCents: 0, orders: 2, suppliers: 3 });
    expect(summary.lines).toHaveLength(3);
    expect(COMMERCIAL_CONDITIONS).toHaveLength(4);
    expect(exposureSummary(INITIAL_REGULATORY_STATE, "c1").totalCents).toBe(640_000_000);
    expect(exposureSummary(INITIAL_REGULATORY_STATE, "c5").totalCents).toBe(220_000_000);
  });
  it("keeps a line in exposure when one of its overlapping conditions remains open", () => {
    const conditions = [...COMMERCIAL_CONDITIONS, { id: "test:second-tower-condition", lineIds: [PURCHASE_LINES[0].id], label: "Another scoped condition" }];
    const excluded = regulatoryReducer(INITIAL_REGULATORY_STATE, { type: "record-scope", answer: "excluded" });
    expect(exposureSummary(excluded, undefined, conditions).totalCents).toBe(860_000_000);
  });
  it("maps actual fictional identities and valid attributed integer amounts", () => {
    for (const line of PURCHASE_LINES) {
      expect(Number.isSafeInteger(line.committedCents) && line.committedCents >= 0).toBe(true);
      expect(commitmentById(line.orderId)).toBeDefined();
      expect(supplierById(line.supplierId)?.commitmentIds).toContain(line.orderId);
    }
    for (const condition of COMMERCIAL_CONDITIONS) for (const id of condition.lineIds) expect(PURCHASE_LINES.some(line => line.id === id)).toBe(true);
    expect(ASSESSED_COMMERCIAL_ORDERS).not.toContain("c2");
    expect(linkedPurchaseValue("c2", "sup:tiruchi-tower-sections")).toBeUndefined();
  });
  it("reclassifies a confirmed regulatory gap without changing total spend or claiming loss", () => {
    const covered = regulatoryReducer(INITIAL_REGULATORY_STATE, { type: "record-scope", answer: "covered" });
    const gap = regulatoryReducer(covered, { type: "record-readiness", answer: "gap" });
    expect(exposureSummary(gap)).toMatchObject({ totalCents: 860_000_000, confirmedCents: 480_000_000, reviewCents: 380_000_000 });
  });
  it.each(["unknown", "refused", "delayed"] as const)("does not turn %s into a confirmed gap", answer => {
    const covered = regulatoryReducer(INITIAL_REGULATORY_STATE, { type: "record-scope", answer: "covered" });
    const unresolved = regulatoryReducer(covered, { type: "record-readiness", answer });
    expect(exposureSummary(unresolved)).toMatchObject({ totalCents: 860_000_000, confirmedCents: 0 });
  });
  it("closes only the scoped condition, retains other exposure and keeps underlying case value", () => {
    const excluded = regulatoryReducer(INITIAL_REGULATORY_STATE, { type: "record-scope", answer: "excluded" });
    expect(exposureSummary(excluded)).toMatchObject({ totalCents: 380_000_000, orders: 2, suppliers: 2 });
    expect(exposureSummary(excluded, "c1").totalCents).toBe(160_000_000);
    const value = linkedPurchaseValue("c1", "sup:tiruchi-tower-sections")!;
    expect(value).toMatchObject({ amount: 4_800_000, currency: "USD", asOf: "2026-11-02", source: "Illustrative ERP snapshot" });
    expect(investigationHeader("c1", "sup:tiruchi-tower-sections", true)?.linkedCommitmentValue).toEqual(value);
  });
  it("keeps funding states and authored USD amounts separate from exposure", () => {
    expect(capitalTotals()).toEqual({ disbursedCents: 180_000_000, sanctionedUndisbursedCents: 60_000_000, suppliers: 42, tiers: 3 });
    expect(CAPITAL_SNAPSHOT.thisWeek.cents).toBeLessThanOrEqual(capitalTotals().disbursedCents);
    expect(formatUSD(exposureSummary().totalCents)).toBe("$8.6M");
    expect(formatUSD(480_000_000, false)).toBe("$4,800,000");
    expect(formatUSD(0)).toBe("$0");
  });
});
