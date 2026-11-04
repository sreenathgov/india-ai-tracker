import { describe, expect, it } from "vitest";
import { commitmentValueLabel, expiredWindow } from "./decision";
import { investigationHeader } from "./select";
describe("commercial value and dated stakes", () => {
  it("never substitutes portfolio or procurement finance for a missing affected-line value", () => {
    expect(commitmentValueLabel()).toBe("Awaiting master data");
    expect(commitmentValueLabel({ amount: 100000, currency: "INR", orderLineIds: [], asOf: "2026-11-02", source: "ERP" })).toBe("Awaiting master data");
  });
  it("retains currency and zero on a scoped, attributed commercial input", () => {
    expect(commitmentValueLabel({ amount: 0, currency: "INR", orderLineIds: ["line-1"], asOf: "2026-11-02", source: "ERP" })).toContain("0");
    expect(commitmentValueLabel({ amount: NaN, currency: "INR", orderLineIds: ["line-1"], asOf: "2026-11-02", source: "ERP" })).toBe("Awaiting master data");
  });
  it("uses the material response deadline against the fixed demo clock", () => {
    const facts = investigationHeader("c1", "sup:deccan-mainshaft-forgings", true)!;
    expect(facts.window?.closesOn).toBe("2026-11-06");
    expect(expiredWindow(facts)).toBe(false);
  });
});
