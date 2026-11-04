import { describe, expect, it } from "vitest";

import { bandedFor, criticalComponents } from "./bom";
import { criticalProfile, criticalProfiles, THREAT_LABEL, URGENCY_LABEL } from "./criticalProfile";

const bySupplier = (id: string) => criticalProfile("c1", id)!;

describe("criticalProfiles", () => {
  it("profiles exactly the five critical Tier-1s on the Wind Energy order", () => {
    const expected = new Set(criticalComponents(bandedFor("c1")).map((c) => c.supplier.id));
    expect(new Set(criticalProfiles("c1").map((p) => p.supplier.id))).toEqual(expected);
  });

  it("returns nothing for an order with no mapped sub-tier network", () => {
    expect(criticalProfiles("c2")).toEqual([]);
    expect(criticalProfile("c2", "sup:bhiwadi-transformer-works")).toBeUndefined();
  });

  it("orders by urgency, then by reach", () => {
    const ranks = criticalProfiles("c1").map((p) => [p.urgency.rank, p.threat.rank] as const);
    const sorted = [...ranks].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    expect(ranks).toEqual(sorted);
  });
});

describe("urgency", () => {
  it("bands the window rather than scoring it", () => {
    expect(bySupplier("sup:deccan-mainshaft-forgings").urgency).toMatchObject({
      band: "immediate",
      windowDays: 9,
    });
    expect(bySupplier("sup:kovai-castings-machining").urgency.band).toBe("near");
    expect(bySupplier("sup:ludhiana-ring-forgings").urgency).toMatchObject({
      band: "planned",
      windowDays: 45,
    });
  });

  it("always carries the figures it was read from", () => {
    criticalProfiles("c1").forEach((p) => {
      expect(p.urgency.label).toBe(URGENCY_LABEL[p.urgency.band]);
      expect(p.urgency.facts.join(" ")).toContain(`${p.urgency.windowDays}-day window`);
      expect(p.urgency.qualificationFits).toBe(false);
    });
  });
});

describe("threat", () => {
  it("spreads when the weak link sits behind another critical Tier-1", () => {
    expect(bySupplier("sup:deccan-mainshaft-forgings").threat.reach).toBe("slows");
    expect(bySupplier("sup:saurashtra-ductile-castings").threat.reach).toBe("spreads");
  });

  it("stops the supplier when the weak link is a sole source nobody else shares", () => {
    expect(bySupplier("sup:tiruchi-tower-sections").threat.reach).toBe("stops");
    expect(bySupplier("sup:ludhiana-ring-forgings").threat.reach).toBe("stops");
  });

  it("states turbines, sourcing and sharing as facts beside the label", () => {
    const deccan = bySupplier("sup:deccan-mainshaft-forgings").threat;
    expect(deccan.label).toBe(THREAT_LABEL.slows);
    const text = deccan.facts.join(" · ");
    expect(text).toContain("12 of 100 turbines");
    expect(text).toContain("Varna Alloy Works");
    expect(deccan.sharedWith).toEqual([]);
  });
});

describe("risk type and confidence", () => {
  it("takes the primary kind from the weak link, and no two suppliers share one", () => {
    const kinds = criticalProfiles("c1").map((p) => p.riskType.primary);
    expect(new Set(kinds).size).toBe(5);
  });

  it("never repeats the primary kind among the contributing ones", () => {
    criticalProfiles("c1").forEach((p) =>
      expect(p.riskType.contributing).not.toContain(p.riskType.primary)
    );
  });

  it("reports the weakest evidence on the traced chain, never verified", () => {
    expect(bySupplier("sup:deccan-mainshaft-forgings").confidence).toBe("missing");
    criticalProfiles("c1").forEach((p) => expect(p.confidence).not.toBe("verified"));
  });
});

describe("why", () => {
  it("reads the mechanism and its conditions from the network", () => {
    criticalProfiles("c1").forEach((p) => {
      expect(p.why.mechanism.length).toBeGreaterThan(60);
      expect(p.why.conditions.length).toBeGreaterThanOrEqual(2);
      expect(p.weakLink.node.name.length).toBeGreaterThan(0);
    });
  });

  it("carries no number that is not a count, a day or a date", () => {
    criticalProfiles("c1").forEach((p) => {
      const text = JSON.stringify(p);
      expect(text).not.toMatch(/risk score|\d+\s*\/\s*10|\d+%/i);
    });
  });
});
