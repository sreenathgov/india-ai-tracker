import { describe, expect, it } from "vitest";

import {
  BOM,
  bandFor,
  bandRollup,
  bandedBom,
  bandedFor,
  bomCommitment,
  bomFor,
  commitmentForComponent,
  componentById,
  hasBom,
  rollupFor,
  componentsInBand,
  criticalComponents,
  exposureRollup,
  totalParts,
  type ComponentGroup,
} from "./bom";
import { suppliersForCommitment, SUPPLIERS } from "./gazetteer";
import type { Commitment, Supplier } from "./types";

const commitment = bomCommitment();

/* The figures the three bento cards put on screen. They are asserted here and
   nowhere else in the codebase, so a change to the bill of materials moves the
   cards and breaks this file — which is the point. A view that hard-codes them
   would let the model and the screen drift apart in silence. */
describe("exposure rollup — the figures Scene 2 shows", () => {
  const rollup = exposureRollup();

  it("resolves 438 required components", () => {
    expect(rollup.totalParts).toBe(438);
  });

  it("puts 327 components, 17 suppliers in low current concern", () => {
    expect(rollup.low.parts).toBe(327);
    expect(rollup.low.suppliers).toBe(17);
  });

  it("puts 83 components, 19 suppliers at elevated risk over 55 turbines", () => {
    expect(rollup.elevated.parts).toBe(83);
    expect(rollup.elevated.suppliers).toBe(19);
    expect(rollup.elevated.turbines).toBe(55);
  });

  /* The five foundry and fabrication Tier-1s, and nothing else. */
  it("puts 28 components, 5 suppliers at critical risk over 40 turbines", () => {
    expect(rollup.critical.parts).toBe(28);
    expect(rollup.critical.suppliers).toBe(5);
    expect(rollup.critical.turbines).toBe(40);
  });

  it("reports 60 units clear of critical risk and only 40 clear of everything", () => {
    expect(rollup.unitsClearOfCritical).toBe(60);
    expect(rollup.unitsFullyClear).toBe(40);
  });

  /* The trap this guards: "60 currently clear" reads as an all-clear, and 20 of
     those 60 are not. If the two figures ever converge, a card is lying. The
     difference is the units whose worst dependency is elevated — not the elevated
     band's turbine count, which also covers units already counted as critical. */
  it("keeps the two clear figures apart, because they mean different things", () => {
    expect(rollup.unitsFullyClear).toBeLessThan(rollup.unitsClearOfCritical);
    expect(rollup.unitsClearOfCritical - rollup.unitsFullyClear).toBe(20);
  });
});

/* Integrity holds for every order Drona has a bill of materials for, not only the
   one the demo opens first — a second order is where a hand-authored table drifts. */
describe.each(["c1", "c2"])("bill of materials integrity — %s", (id) => {
  const bom = bomFor(id);
  const order = bomCommitment(id);

  it("bands every assembly exactly once", () => {
    const banded = bandedFor(id);
    expect(banded).toHaveLength(bom.length);
    const rollups = (["low", "elevated", "critical"] as const).map((b) =>
      bandRollup(b, banded)
    );
    expect(rollups.reduce((n, r) => n + r.assemblies, 0)).toBe(bom.length);
    expect(rollups.reduce((n, r) => n + r.parts, 0)).toBe(totalParts(bom));
  });

  it("binds every assembly to a supplier that actually serves this commitment", () => {
    const eligible = new Set(suppliersForCommitment(id).map((s) => s.id));
    for (const component of bom) {
      expect(eligible.has(component.supplierId)).toBe(true);
    }
  });

  it("gives every Tier-1 supplier on the commitment exactly one assembly", () => {
    const bound = bom.map((c) => c.supplierId);
    expect(new Set(bound).size).toBe(bound.length);
    expect(bound).toHaveLength(suppliersForCommitment(id).length);
  });

  it("keeps turbine ranges inside the commitment's unit count", () => {
    for (const component of bom) {
      expect(component.turbines.from).toBeGreaterThanOrEqual(1);
      expect(component.turbines.to).toBeLessThanOrEqual(order.units);
      expect(component.turbines.to).toBeGreaterThanOrEqual(component.turbines.from);
    }
  });

  it("never claims fewer approved sources than one", () => {
    for (const component of bom) {
      expect(component.approvedSources).toBeGreaterThanOrEqual(1);
    }
  });

  it("gives every assembly a stable, unique id that resolves back to this order", () => {
    expect(new Set(bom.map((c) => c.id)).size).toBe(bom.length);
    for (const component of bom) {
      expect(componentById(component.id)).toBe(component);
      expect(commitmentForComponent(component.id)?.id).toBe(id);
    }
  });
});

describe("the registry", () => {
  it("keeps ids apart across orders, so the same assembly name is two assemblies", () => {
    const c1 = new Set(bomFor("c1").map((c) => c.id));
    expect(bomFor("c2").some((c) => c1.has(c.id))).toBe(false);
  });

  it("refuses to lend one order's bill of materials to another", () => {
    expect(hasBom("c3")).toBe(false);
    expect(() => bomFor("c3")).toThrow(/no bill of materials/);
  });
});

/* Highland Repower is the second shape: narrow and total where Wind Energy is broad
   and partial. One assembly, one supplier, every unit. */
describe("Highland Repower — a different exposure shape", () => {
  const rollup = rollupFor("c2");

  it("resolves 268 components across 60 turbines", () => {
    expect(rollup.units).toBe(60);
    expect(rollup.totalParts).toBe(268);
  });

  it("puts a single assembly, three parts, one supplier at critical risk — on every unit", () => {
    expect(rollup.critical).toMatchObject({ parts: 3, assemblies: 1, suppliers: 1, turbines: 60 });
    expect(rollup.unitsClearOfCritical).toBe(0);
    expect(rollup.unitsFullyClear).toBe(0);
  });

  it("puts 96 components, 11 suppliers at elevated risk and 169, 14 suppliers in low", () => {
    expect(rollup.elevated).toMatchObject({ parts: 96, suppliers: 11 });
    expect(rollup.low).toMatchObject({ parts: 169, suppliers: 14 });
  });

  it("leads its critical set with the single-source nacelle transformer", () => {
    const critical = criticalComponents(bandedFor("c2"));
    expect(critical).toHaveLength(1);
    expect(critical[0]?.component.id).toBe("cmp:c2-nacelle-transformer");
    expect(critical[0]?.component.approvedSources).toBe(1);
  });

  /* The demo's clearest cross-order point: suppliers that are critical risk on
     Wind Energy are not on Highland, because this order already holds their
     coverage. The supplier did not change; the order did. */
  it("bands Wind Energy's critical-concern suppliers elevated here, because coverage clears lead time", () => {
    const shared = new Set(criticalComponents().map((r) => r.supplier.id));
    const here = bandedFor("c2").filter((r) => shared.has(r.supplier.id));
    expect(here.length).toBeGreaterThanOrEqual(2);
    for (const row of here) {
      expect(row.supplier.concern).toBe("critical");
      expect(row.band).toBe("elevated");
    }
  });
});

/* These four cases are the argument Scene 2 makes. If `bandFor` ever collapses to
   "band = supplier concern", three of them fail — which is the alarm we want. */
describe("risk is relative to the commitment, not a property of the supplier", () => {
  const base: ComponentGroup = {
    id: "cmp:test",
    name: "Test Assembly",
    system: "Drivetrain",
    partCount: 1,
    supplierId: "sup:test",
    approvedSources: 2,
    leadTimeDays: 60,
    coverageDays: 30,
    turbines: { from: 1, to: 10 },
  };
  const supplier = (concern: Supplier["concern"]): Supplier => ({
    id: "sup:test",
    kind: "supplier",
    name: "Test Supplier",
    city: "Nowhere",
    country: "Nowhere",
    coordinate: { lon: 0, lat: 0 },
    tier: 1,
    concern,
    commitmentIds: [commitment.id],
    mitigated: false,
    region: "Nowhere",
    category: "Drivetrain",
    supplies: ["Test Assembly"],
    sourcing: "dual",
    approval: "approved",
    leadTimeDays: 60,
    certifications: [],
  });
  const order = (marginDays: number): Commitment => ({ ...commitment, marginDays });

  it("a critical supplier that cannot be re-sourced in time is critical risk", () => {
    expect(bandFor(base, supplier("critical"), order(9)).band).toBe("critical");
  });

  it("the same critical supplier with coverage past its lead time is only elevated", () => {
    const covered = { ...base, coverageDays: 75 };
    expect(bandFor(covered, supplier("critical"), order(9)).band).toBe("elevated");
  });

  it("a low-concern supplier whose coverage runs out inside the margin is elevated", () => {
    const thin = { ...base, coverageDays: 65 };
    expect(bandFor(thin, supplier("low"), order(9)).band).toBe("elevated");
  });

  it("the same component is low risk once the programme has margin to absorb it", () => {
    const thin = { ...base, coverageDays: 65 };
    expect(bandFor(thin, supplier("low"), order(2)).band).toBe("low");
  });

  /* An elevated-concern assembly short of its own lead time must not be described
     as merely missing the margin — that understates it, and it must say what keeps
     it out of critical, because that is the condition a reviewer should watch. */
  it("says plainly when coverage misses the lead time itself, and why it is not critical", () => {
    const short = bandFor(base, supplier("elevated"), order(9));
    expect(short.band).toBe("elevated");
    expect(short.because).toContain("falls short of the 60-day lead time");
    expect(short.because).toContain("critical");
    expect(short.because).not.toContain("plus 9 days");

    const thin = bandFor({ ...base, coverageDays: 65 }, supplier("elevated"), order(9));
    expect(thin.because).toContain("plus 9 days");
  });

  /* The mirror of the critical case: concern is one input among four, so an
     elevated-concern supplier this order can comfortably re-source away from is
     low risk *here* — and the sentence must not claim a shortfall that is not there. */
  it("an elevated-concern supplier with coverage past lead time plus margin is low", () => {
    const covered = bandFor({ ...base, coverageDays: 80 }, supplier("elevated"), order(9));
    expect(covered.band).toBe("low");
    expect(covered.because).toContain("elevated concern");
    expect(covered.because).not.toContain("does not clear");
  });

  it("always states a cause alongside the band", () => {
    for (const entry of bandedBom()) {
      expect(entry.because.length).toBeGreaterThan(40);
      expect(entry.because).toContain(String(entry.component.leadTimeDays));
    }
  });
});

describe("critical components — Scene 3's entry set", () => {
  const critical = criticalComponents();

  it("is exactly the five foundry and fabrication assemblies", () => {
    expect(critical.map((r) => r.component.name).sort()).toEqual([
      "Main Bearing Housing",
      "Main Shaft Forging",
      "Rotor Hub Casting",
      "Tower Flange",
      "Tower Section Set",
    ]);
  });

  it("leads with the tower section set, exposing 28 of 100 turbines", () => {
    const lead = critical[0];
    expect(lead?.component.name).toBe("Tower Section Set");
    const span = lead!.component.turbines;
    expect(span.to - span.from + 1).toBe(28);
  });

  it("holds only assemblies whose coverage is short of their lead time", () => {
    for (const entry of critical) {
      expect(entry.component.coverageDays).toBeLessThan(entry.component.leadTimeDays);
      expect(entry.supplier.concern).toBe("critical");
    }
  });

  /* Scene 1 draws these nine nodes on the map; Scene 2 bands five of them
     critical. The other four already hold coverage past lead time on this order —
     the demo's clearest illustration that concern and risk are different words. */
  it("bands five of the nine critical-concern suppliers as critical risk", () => {
    const criticalConcern = SUPPLIERS.filter(
      (s) => s.commitmentIds.includes(commitment.id) && s.concern === "critical"
    );
    expect(criticalConcern).toHaveLength(9);
    expect(critical).toHaveLength(5);
  });
});

/* Scene 2's drill-down. The list under a card must be the card, itemised: if the
   rows and the headline ever disagree, one of them is wrong in front of an audience. */
describe("components in band — the list beneath each card", () => {
  const rollup = exposureRollup();

  it.each(["low", "elevated", "critical"] as const)(
    "itemises exactly the %s card's parts and suppliers",
    (band) => {
      const rows = componentsInBand(band);
      expect(rows.every((r) => r.band === band)).toBe(true);
      expect(rows.reduce((n, r) => n + r.component.partCount, 0)).toBe(rollup[band].parts);
      expect(new Set(rows.map((r) => r.supplier.id)).size).toBe(rollup[band].suppliers);
    }
  );

  it("orders by turbines exposed, so consequence reads first", () => {
    for (const band of ["low", "elevated", "critical"] as const) {
      const spans = componentsInBand(band).map(
        (r) => r.component.turbines.to - r.component.turbines.from + 1
      );
      expect(spans).toEqual([...spans].sort((a, b) => b - a));
    }
  });

  it("is the same ordering Scene 3 uses for its switcher", () => {
    expect(componentsInBand("critical").map((r) => r.component.id)).toEqual(
      criticalComponents().map((r) => r.component.id)
    );
  });
});
