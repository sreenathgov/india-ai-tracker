import { describe, expect, it } from "vitest";
import { estimatedOrderValue } from "./orderValuation";
import { exposureSummary } from "./commercial";
import { INITIAL_REGULATORY_STATE, regulatoryReducer } from "@/lib/regulatory/state";

describe("market estimate separate from supplier exposure", () => {
  it("applies the dated USD/kW benchmark to the explicit fictional configuration", () => {
    const value = estimatedOrderValue("c1", 100)!;
    expect(value.assumedMWPerTurbine).toBe(3);
    expect(value.totalMW).toBe(300);
    expect(value.exactCents).toBe(29_940_000_000);
    expect(value.roundedCents).toBe(30_000_000_000);
    expect(value.benchmark.marketYear).toBe(2024);
  });
  it("does not invent a rating or valuation for another order or quantity", () => {
    expect(estimatedOrderValue("c2", 60)).toBeNull();
    expect(estimatedOrderValue("c1", 101)).toBeNull();
  });
  it("keeps the customer value estimate unchanged when supplier evidence closes exposure", () => {
    const closed = regulatoryReducer(INITIAL_REGULATORY_STATE, { type: "record-scope", answer: "excluded" });
    expect(exposureSummary(INITIAL_REGULATORY_STATE, "c1").totalCents).toBe(640_000_000);
    expect(exposureSummary(closed, "c1").totalCents).toBe(160_000_000);
    expect(estimatedOrderValue("c1", 100)?.roundedCents).toBe(30_000_000_000);
  });
});
