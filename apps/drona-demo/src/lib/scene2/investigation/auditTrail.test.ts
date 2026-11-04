import { describe, expect, it } from "vitest";

import { explainClaim } from "./auditTrail";
import { INVESTIGATIONS } from "./registry";

describe("explainClaim", () => {
  it.each(INVESTIGATIONS.map((inv) => [inv.supplierId, inv] as const))(
    "answers every audit question for the controlling claim of %s",
    (_id, inv) => {
      const controlling = inv.claims.find((c) => c.materiality === "controlling");
      expect(controlling).toBeDefined();
      const trail = explainClaim(inv, controlling!.id)!;

      /* What evidence is behind it, and is it observed or inferred? */
      expect(trail.claim.id).toBe(controlling!.id);
      expect(trail.evidence.map((e) => e.id)).toEqual(controlling!.supportingEvidenceIds);
      expect(["observed", "inferred", "forecast", "scenario"]).toContain(trail.basis);
      /* What contradicts it, and what would show it wrong? */
      expect(trail.contradictions.map((e) => e.id)).toEqual(controlling!.contradictingEvidenceIds);
      expect(trail.falsifiers).toEqual(controlling!.falsifiers);
      /* Why it matters: where it sits on the fracture path. */
      expect(trail.whyItMatters.length).toBeGreaterThan(0);
      /* What could be done. */
      expect(trail.actions.map((a) => a.id)).toEqual(controlling!.affectedActionIds);
    }
  );

  it("carries the future assumption only for forecasts and scenarios", () => {
    for (const inv of INVESTIGATIONS) {
      for (const claim of inv.claims) {
        const trail = explainClaim(inv, claim.id)!;
        if (claim.claimType === "observation") expect(trail.futureAssumption).toBeNull();
        if (claim.claimType === "forecast") expect(trail.futureAssumption).not.toBeNull();
      }
    }
  });

  it("returns null for a claim the investigation does not make", () => {
    expect(explainClaim(INVESTIGATIONS[0]!, "no-such-claim")).toBeNull();
  });
});
