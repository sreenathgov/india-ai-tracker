import { describe, expect, it } from "vitest";

import { DURGAPUR } from "./cases/durgapur";
import { forecastQualifier } from "./forecast";
import type { Claim } from "./types";

const claimIn = (id: string): Claim => {
  const found = DURGAPUR.claims.find((c) => c.id === id);
  if (!found) throw new Error(`no claim ${id}`);
  return found;
};

describe("forecastQualifier", () => {
  it("qualifies a forecast by how far, by when and how firmly", () => {
    const q = forecastQualifier(claimIn("dg-signal-4"));
    expect(q).toEqual({
      magnitude: "Implied replacement-cost movement +11% to +17%",
      horizon: "45–60 days, base case, from the assessment date",
      confidence: "moderate",
    });
  });

  it("qualifies the conclusion, which has a horizon but no magnitude", () => {
    const q = forecastQualifier(claimIn("dg-conclusion"));
    expect(q?.magnitude).toBeNull();
    expect(q?.horizon).toBe(
      "34–83 days, from the end of confirmed cover to the end of the remaining route requirement"
    );
  });

  it("reads a window that opens now as a window, not as a range from zero", () => {
    expect(forecastQualifier(claimIn("dg-mitigation"))?.horizon).toBe(
      "within 34 days, the window in which an early purchase is still ahead of the shortfall"
    );
  });

  it("leaves money and day figures to the claim's own sentence", () => {
    /* The mitigation says ₹62 / ₹21 / ₹41 lakh in words; repeating them is noise. */
    expect(forecastQualifier(claimIn("dg-mitigation"))?.magnitude).toBeNull();
  });

  it("does not qualify an observation or an inference", () => {
    expect(forecastQualifier(claimIn("dg-signal-5"))).toBeNull();
    expect(forecastQualifier(claimIn("dg-dependency"))).toBeNull();
  });

  it("signs a fall as a fall", () => {
    const falling: Claim = {
      ...claimIn("dg-signal-4"),
      figures: [{ key: "k", label: "Implied movement", value: -4, unit: "percent" }],
    };
    expect(forecastQualifier(falling)?.magnitude).toBe("Implied movement −4%");
  });
});
