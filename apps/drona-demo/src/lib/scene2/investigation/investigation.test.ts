import { describe, expect, it } from "vitest";

import { componentById } from "@/lib/network/bom";
import { SUBTIER_NODES } from "@/lib/network/subtier";
import { GROUNDING_SOURCES } from "./grounding";
import { KOVAI } from "./cases/kovai";
import { INVESTIGATIONS, investigationFor } from "./registry";
import { FRACTURE_STAGES, type SupplierInvestigation } from "./types";

const CASES = {
  saurashtra: "sup:saurashtra-ductile-castings",
  deccan: "sup:deccan-mainshaft-forgings",
  tiruchi: "sup:tiruchi-tower-sections",
  durgapur: "sup:durgapur-heat-treatment",
} as const;

const get = (key: keyof typeof CASES | "kovai"): SupplierInvestigation => {
  if (key === "kovai") return KOVAI;
  const inv = investigationFor("c1", CASES[key]);
  if (!inv) throw new Error(`missing investigation: ${key}`);
  return inv;
};

/** Every string a reviewer can be shown: the investigation without its internal grounding. */
const visibleText = (inv: SupplierInvestigation): string => {
  const { grounding: _grounding, ...shown } = inv;
  return JSON.stringify(shown);
};

describe("the four active investigations", () => {
  it("covers exactly the four active authored suppliers on Wind Energy", () => {
    expect(INVESTIGATIONS.map((i) => i.supplierId).sort()).toEqual(Object.values(CASES).slice().sort());
    expect(INVESTIGATIONS.every((i) => i.orderId === "c1")).toBe(true);
    expect(new Set(INVESTIGATIONS.map((i) => i.id)).size).toBe(INVESTIGATIONS.length);
  });

  describe.each(Object.keys(CASES) as (keyof typeof CASES)[])("%s", (key) => {
    const inv = get(key);
    const claimIds = new Set(inv.claims.map((c) => c.id));
    const evidenceIds = new Set(inv.evidence.map((e) => e.id));
    const dependencyIds = new Set(inv.dependencies.map((d) => d.id));
    const actionIds = new Set(inv.actions.map((a) => a.id));

    it("references assemblies this supplier holds on this order", () => {
      expect(inv.componentIds.length).toBeGreaterThan(0);
      for (const id of inv.componentIds) expect(componentById(id)?.supplierId).toBe(inv.supplierId);
    });

    it("has at least one observation, one inference and a forecast or scenario", () => {
      const types = inv.claims.map((c) => c.claimType);
      expect(types).toContain("observation");
      expect(types).toContain("inference");
      expect(types.some((t) => t === "forecast" || t === "scenario")).toBe(true);
    });

    it("walks the fracture path through all five stages, in order", () => {
      expect(inv.fracturePath.map((s) => s.stage)).toEqual(FRACTURE_STAGES);
      for (const step of inv.fracturePath) {
        expect(step.claimIds.length).toBeGreaterThan(0);
        for (const id of step.claimIds) expect(claimIds.has(id)).toBe(true);
      }
    });

    it("states a competing explanation with falsifiers, a next request and a posture", () => {
      expect(inv.competingExplanation.statement.length).toBeGreaterThan(20);
      expect(inv.competingExplanation.falsifiers.length).toBeGreaterThan(0);
      for (const id of inv.competingExplanation.claimIds) expect(claimIds.has(id)).toBe(true);
      expect(inv.nextBestEvidence.length).toBeGreaterThan(0);
      expect(inv.interventionPosture.summary.length).toBeGreaterThan(20);
      expect(inv.unresolved.length).toBeGreaterThan(0);
    });

    it("resolves every reference it makes", () => {
      const requestIds = new Set(inv.nextBestEvidence.map((r) => r.id));
      for (const claim of inv.claims) {
        for (const id of [...claim.supportingEvidenceIds, ...claim.contradictingEvidenceIds]) {
          expect(evidenceIds.has(id), `${claim.id} → ${id}`).toBe(true);
        }
        for (const id of claim.affectedDependencyIds) expect(dependencyIds.has(id), `${claim.id} → ${id}`).toBe(true);
        for (const id of claim.affectedActionIds) expect(actionIds.has(id), `${claim.id} → ${id}`).toBe(true);
      }
      for (const item of inv.evidence) for (const id of item.independence.relatedTo) expect(evidenceIds.has(id)).toBe(true);
      for (const item of inv.unresolved) if (item.resolvedBy) expect(requestIds.has(item.resolvedBy)).toBe(true);
      for (const dep of inv.dependencies) {
        if (dep.subTierNodeId) expect(SUBTIER_NODES.has(dep.subTierNodeId), dep.subTierNodeId).toBe(true);
      }
    });

    it("keeps claim types honest about time", () => {
      for (const claim of inv.claims) {
        if (claim.claimType === "observation") {
          expect(claim.observedAt, claim.id).toBeDefined();
          expect(claim.forecastHorizon, claim.id).toBeUndefined();
        } else {
          expect(claim.validFrom, claim.id).toBeDefined();
        }
        if (claim.claimType === "forecast") expect(claim.forecastHorizon, claim.id).toBeDefined();
        if (claim.claimType !== "observation") expect(claim.falsifiers.length, claim.id).toBeGreaterThan(0);
      }
    });

    it("distinguishes real linked authority from authored private records", () => {
      for (const item of inv.evidence) {
        expect(item.synthetic).toBe(!item.url);
        if (item.url) expect(new URL(item.url).hostname).toMatch(/^(taxation-customs.ec.europa.eu|eur-lex.europa.eu)$/);
        expect(item.sourceName).not.toMatch(/Reuters|Bloomberg|Platts|Argus|Lloyd|Financial Times|Economic Times|S&P|ICIS/);
      }
    });

    it("never calls the supplier high risk, promises a price, or shows a confidence percentage", () => {
      const text = visibleText(inv);
      expect(text).not.toMatch(/high[- ]risk/i);
      expect(text).not.toMatch(/inevitabl/i);
      expect(text).not.toMatch(/will (rise|increase|go up)/i);
      expect(text).not.toMatch(/\d+\s?%\s*(confiden|likel|probab|certain)/i);
      expect(text).not.toMatch(/Nordex|Synergy/);
    });

    it("grounds itself in located research, internally", () => {
      expect(inv.grounding.groundingRefs.length).toBeGreaterThan(0);
      for (const ref of inv.grounding.groundingRefs) {
        if (ref.startsWith("https://")) {
          expect(inv.evidence.some((item) => item.url === ref && !item.synthetic)).toBe(true);
          continue;
        }
        const source = ref.split(":")[0]!;
        expect(GROUNDING_SOURCES[source], ref).toBeDefined();
      }
      expect(inv.grounding.syntheticAssumptions.length).toBeGreaterThan(0);
    });
  });
});

describe("finance relevance, per exposure", () => {
  it("sets each case's state from its mechanism, not from its band", () => {
    expect(get("saurashtra").financeRelevance.state).toBe("potentially-relevant");
    expect(get("deccan").financeRelevance.state).toBe("not-presently-relevant");
    expect(get("kovai").financeRelevance.state).toBe("closed-pending-technical-disposition");
    expect(get("tiruchi").financeRelevance.state).toBe("not-presently-relevant");
    expect(get("durgapur").financeRelevance.state).toBe("potentially-relevant");
  });

  it("opens only through an evidenced chain where it is potentially relevant", () => {
    for (const key of ["saurashtra", "durgapur"] as const) {
      expect(get(key).financeRelevance.chain?.length ?? 0).toBeGreaterThanOrEqual(3);
    }
    expect(get("saurashtra").financeRelevance.reason).toMatch(/binding constraint/i);
  });

  it("keeps Kovai's finance closed until the technical disposition", () => {
    const kovai = get("kovai");
    expect(kovai.financeRelevance.reason).toMatch(/technical/i);
    expect(visibleText(kovai)).toMatch(/repair|recast/i);
    expect(visibleText(kovai)).toMatch(/heat/i);
  });
});

describe("Durgapur, the forward-looking case", () => {
  const inv = get("durgapur");
  const figure = (key: string) => inv.claims.flatMap((c) => c.figures ?? []).find((f) => f.key === key);

  it("states the conclusion as a probability, verbatim", () => {
    expect(inv.claims.map((c) => c.claim)).toContain(
      "Current evidence indicates a material probability that replacement cost and availability will tighten before this production route completes."
    );
  });

  it("types the price view as a forecast over a 45–60 day horizon at moderate confidence", () => {
    const forecasts = inv.claims.filter((c) => c.claimType === "forecast");
    expect(forecasts.length).toBeGreaterThan(0);
    const horizon = forecasts.find((c) => c.forecastHorizon?.fromDays === 45 && c.forecastHorizon.toDays === 60);
    expect(horizon).toBeDefined();
    expect(horizon?.confidence).toBe("moderate");
    expect(figure("replacement-cost-movement")).toMatchObject({ value: 11, upTo: 17, unit: "percent" });
  });

  it("keeps process-input cover distinct from component coverage", () => {
    expect(inv.inputCover).toEqual({ label: "Quench-medium cover", days: 34, requiredDays: 83 });
  });

  it("builds the finance requirement from the mitigation, and the gap from the two figures", () => {
    const purchase = figure("early-purchase")!;
    const liquidity = figure("available-liquidity")!;
    const gap = figure("liquidity-gap")!;
    expect([purchase.value, liquidity.value, gap.value]).toEqual([62, 21, 41]);
    expect(gap.value).toBe(purchase.value - liquidity.value);
    expect(inv.financeRelevance.chain?.[0]).toMatch(/exposure/i);
    expect(inv.financeRelevance.chain?.at(-1)).toMatch(/working capital/i);
  });

  it("reads six signals: five on record and one missing allocation", () => {
    const signals = inv.claims.filter((c) => c.id.startsWith("dg-signal-"));
    expect(signals).toHaveLength(5);
    expect(inv.unresolved.some((u) => /protected .*allocation/i.test(u.statement))).toBe(true);
  });

  it("names the absent allocation as its competing explanation", () => {
    expect(inv.competingExplanation.statement).toMatch(/allocation|fixed-price/i);
  });

  it("says plainly that its input chain is a synthetic extrapolation", () => {
    expect(inv.grounding.syntheticAssumptions.join(" ")).toMatch(/extrapolat/i);
  });
});
