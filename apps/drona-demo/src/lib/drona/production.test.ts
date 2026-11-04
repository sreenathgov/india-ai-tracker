import { describe, expect, it } from "vitest";

import { criticalProfile, criticalProfiles } from "@/lib/network/criticalProfile";
import { productionBriefing, supplierBriefing } from "./production";

const BANNED = /risk score|AI platform|underwriting engine|guaranteed finance|prevention|No Risk|Good Morning/i;
/* Advice words: actions are verification, never a directive to switch or buy. */
const DIRECTIVE = /\b(switch to|you should|must (buy|order)|recommend (buying|switching)|replace (the )?supplier)\b/i;

describe("productionBriefing", () => {
  it("states the order's five critical Tier-1s and its tightest window as known", () => {
    const { whyFlagged } = productionBriefing("c1");
    const known = whyFlagged.filter((s) => s.standing === "known").map((s) => s.text).join(" ");
    expect(known).toContain("Five assemblies");
    expect(known).toContain("9 days");
    expect(known).toContain("Deccan Mainshaft Forgings");
  });

  it("names the weak links that are not independent, as inferred", () => {
    const inferred = productionBriefing("c1").whyFlagged.find((s) => s.standing === "inferred");
    expect(inferred?.text).toMatch(/^One of the five weak link/);
    expect(inferred?.text).toContain("Nagpur Nodularisers");
  });

  it("says so, rather than staying silent, when no network is mapped", () => {
    const { whyFlagged } = productionBriefing("c2");
    expect(whyFlagged).toHaveLength(1);
    expect(whyFlagged[0]?.standing).toBe("unknown");
  });
});

describe("supplierBriefing", () => {
  it("gives every critical supplier known facts, an inferred weak link and next evidence", () => {
    criticalProfiles("c1").forEach((p) => {
      const b = supplierBriefing(p);
      expect(b.whatMattersNow.some((s) => s.standing === "known")).toBe(true);
      expect(b.whatMattersNow.some((s) => s.standing === "inferred" && s.text.includes(p.weakLink.node.name))).toBe(true);
      expect(b.suggestedActions.length).toBeGreaterThanOrEqual(2);
      b.suggestedActions.forEach((s) => {
        expect(s.standing).toBe("next");
        expect(s.text).toMatch(/^(Confirm|Verify|Request)\b/);
      });
    });
  });

  it("asks about independence when the weak link spreads, and about a second source when it stops", () => {
    const shared = supplierBriefing(criticalProfile("c1", "sup:saurashtra-ductile-castings")!);
    expect(shared.suggestedActions.map((s) => s.text).join(" ")).toContain("independent capacity");
    const tiruchi = supplierBriefing(criticalProfile("c1", "sup:tiruchi-tower-sections")!);
    expect(tiruchi.suggestedActions.map((s) => s.text).join(" ")).toContain("second source");
  });

  it("states the uncorroborated link on Deccan's chain as unknown", () => {
    const deccan = supplierBriefing(criticalProfile("c1", "sup:deccan-mainshaft-forgings")!);
    const unknown = deccan.whatMattersNow.find((s) => s.standing === "unknown");
    expect(unknown?.text).toContain("Evidence missing");
  });

  it("keeps grade codes intact mid-sentence", () => {
    const tiruchi = supplierBriefing(criticalProfile("c1", "sup:tiruchi-tower-sections")!);
    expect(tiruchi.suggestedActions.map((s) => s.text).join(" ")).toContain("S355NL");
  });

  it("carries no banned term and no directive", () => {
    const text = JSON.stringify([
      productionBriefing("c1"),
      productionBriefing("c2"),
      ...criticalProfiles("c1").map(supplierBriefing),
    ]);
    expect(text).not.toMatch(BANNED);
    expect(text).not.toMatch(DIRECTIVE);
    expect(text).not.toMatch(/\d+%|\/\s*10\b/);
  });
});
