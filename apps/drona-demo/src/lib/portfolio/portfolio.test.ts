import { describe, expect, it } from "vitest";

import { CAPITAL_SNAPSHOT, capitalTotals, formatUSD } from "./commercial";
import { COMMITMENTS } from "@/lib/network/gazetteer";
import { dronaBriefing, nordvindAttention } from "./attention";
import {
  DEPENDENCY_TYPES,
  commitmentsWithType,
  dependencyCount,
  dependencyTotalOfType,
  mitigationTotals,
  portfolioRows,
  portfolioSummary,
} from "./portfolio";

const BANNED = /risk score|AI platform|underwriting engine|guaranteed finance|prevention|No Risk|Good Morning/i;

const briefing = () =>
  dronaBriefing({ weekCents: CAPITAL_SNAPSHOT.thisWeek.cents, pathways: CAPITAL_SNAPSHOT.thisWeek.pathways });

describe("portfolio summary", () => {
  it("holds five commitments as three new, one action, one monitoring", () => {
    const s = portfolioSummary();
    expect(s.commitments).toBe(COMMITMENTS.length);
    expect(s.byState).toEqual({ new: 3, action: 1, monitoring: 1 });
    expect(s.earliestWindowDays).toBe(14);
  });

  it("counts 21 mapped dependencies, all accounted for by mitigation status", () => {
    const s = portfolioSummary();
    expect(s.criticalDependencies).toBe(21);
    const m = mitigationTotals();
    expect(m).toEqual({ verified: 12, underReview: 5, unknowns: 4 });
    expect(m.verified + m.underReview + m.unknowns).toBe(21);
  });

  it("sums the matrix to the brief, by commitment and by type", () => {
    expect([dependencyCount("c1"), dependencyCount("c5")]).toEqual([13, 8]);
    expect(DEPENDENCY_TYPES.map((t) => dependencyTotalOfType(t.id))).toEqual([7, 5, 1, 3, 2, 2, 1]);
    /* NEW orders are not yet assessed and carry none — Highland included. */
    expect(dependencyCount("c4")).toBe(0);
    expect(dependencyCount("c2")).toBe(0);
  });

  it("lists commitments carrying a type, most first, and leaves out those with none", () => {
    expect(commitmentsWithType("material").map((c) => c.id)).toEqual(["c1", "c5"]);
    expect(commitmentsWithType("external").map((c) => c.id)).toEqual(["c5"]);
  });
});

describe("portfolio rows", () => {
  it("orders rows by state and recommends Wind Energy only", () => {
    const rows = portfolioRows();
    expect(rows.map((r) => r.commitment.id)).toEqual(["c4", "c2", "c3", "c1", "c5"]);
    expect(rows.filter((r) => r.recommended).map((r) => r.commitment.id)).toEqual(["c1"]);
  });

  it("words each state's cues", () => {
    const byId = Object.fromEntries(portfolioRows().map((r) => [r.commitment.id, r.cues.join(" · ")]));
    expect(byId.c4).toContain("SAP plan received 4 min ago");
    expect(byId.c1).toBe("13 critical dependencies · 28 units depend on tower sections · applicability under review");
    expect(byId.c2).toBe("SAP plan received 12 min ago · 26 planned Tier-1s");
    expect(byId.c5).toBe("8 critical dependencies · No material change · 1d");
  });
});

describe("working capital", () => {
  it("keeps disbursed and sanctioned-but-undisbursed USD states distinct", () => {
    expect(formatUSD(capitalTotals().disbursedCents)).toBe("$1.8M");
    expect(formatUSD(capitalTotals().sanctionedUndisbursedCents)).toBe("$600K");
  });

  it("reaches 42 suppliers across three tiers", () => {
    expect(capitalTotals().suppliers).toBe(42);
    expect(capitalTotals().tiers).toBe(3);
  });
});

describe("Drona's attention note", () => {
  it("derives Wind Energy's figures from Scene 2's records", () => {
    const a = nordvindAttention();
    expect(a).toMatchObject({ unitsExposed: 28, unitsTotal: 100, windowDays: 14, unresolvedPaths: 2 });
    expect(a.evidence.length).toBe(3);
  });

  it("reproduces the brief's copy", () => {
    const b = briefing();
    expect(b.primary).toBe(
      "Wind Energy Coastal: A Danish destination makes CBAM worth checking. The actual shipped article, importer and exception position are still needed before this becomes an applicable obligation. 28 of 100 units depend on these section sets."
    );
    expect(b.supporting).toBe(
      "The authored finance snapshot shows $300K across 8 pathways. Finance cannot substitute for an eligible regulatory route."
    );
  });

  it("carries no banned term, and no talk of risk, anywhere on the surface", () => {
    const text = JSON.stringify([briefing(), portfolioRows(), DEPENDENCY_TYPES]);
    expect(text).not.toMatch(BANNED);
    expect(text).not.toMatch(/\brisk/i);
  });
});
