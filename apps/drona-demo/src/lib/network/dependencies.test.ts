import { describe, expect, it } from "vitest";

import {
  CONFIDENCE_LABEL,
  CONFIDENCE_MEANING,
  dependencyChain,
  interventionWindow,
  sourceConcentration,
  tracedComponents,
  weakest,
} from "./dependencies";
import { criticalComponents, unitsExposed } from "./bom";
import { subTierNetworkFor } from "./subtier";

const MAIN_SHAFT = "cmp:main-shaft-forging";

describe("dependencyChain", () => {
  it("resolves the main shaft to the five-node chain the scene draws", () => {
    const chain = dependencyChain(MAIN_SHAFT)!;
    expect(chain).toBeDefined();

    /* Plant + Tier 1 + three upstream = the sketch's five nodes. */
    expect(1 + 1 + chain.upstream.length).toBe(5);
    expect(chain.plant.city).toBe("Chennai");
    expect(chain.supplier.name).toBe("Deccan Mainshaft Forgings");
    expect(chain.upstream.map((u) => u.node.name)).toEqual([
      "Jalna Alloy Supply",
      "Varna Alloy Works",
      "Angul Long Products",
    ]);
  });

  it("retains held route evidence and the unconfirmed alternate as distinct states", () => {
    const chain = dependencyChain(MAIN_SHAFT)!;
    expect(chain.upstream.map((u) => u.confidence)).toEqual(["verified", "verified", "missing"]);
    expect(chain.weakestConfidence).toBe("missing");
  });

  it("derives every node's confidence from the edge that established it", () => {
    /* The load-bearing invariant: confidence is authored once, on the edge. If a node
       could carry its own, the map could show a solid node behind a dotted line — an
       inference drawn as a fact, which is the one thing Scene 3 must never do. */
    for (const id of tracedComponents().map((c) => c.id)) {
      const chain = dependencyChain(id)!;
      for (const resolved of chain.upstream) {
        const edge = chain.edges.find((e) => e.fromId === resolved.node.id)!;
        expect(resolved.confidence).toBe(edge.confidence);
        expect(resolved.basis).toBe(edge.basis);
      }
    }
  });

  it("never presents a whole chain as verified", () => {
    /* A sub-tier edge can be verified — a mill certificate names the mill — but no
       traced chain is verified end to end. A chain that claimed to be would be the
       failure mode this model exists to prevent: an inference drawn as a fact. */
    for (const id of tracedComponents().map((c) => c.id)) {
      expect(dependencyChain(id)!.weakestConfidence).not.toBe("verified");
    }
  });

  it("draws each Wind Energy chain from its sub-tier network's weak-link trace", () => {
    for (const component of tracedComponents("c1")) {
      const network = subTierNetworkFor(component.supplierId)!;
      const chain = dependencyChain(component.id)!;
      expect(chain.upstream.map((u) => u.node.id)).toEqual(network.weakLink.trace);
      expect(chain.upstream.map((u) => u.node.id)).toContain(network.weakLink.nodeId);
    }
  });

  it("returns undefined for an assembly with no traced chain", () => {
    expect(dependencyChain("cmp:tower-plate")).toBeUndefined();
    expect(dependencyChain("not-a-component")).toBeUndefined();
  });

  it("binds every chain to the order it was resolved against", () => {
    const chain = dependencyChain(MAIN_SHAFT)!;
    expect(chain.commitment.units).toBe(100);
    expect(chain.commitment.requiredBy).toBe("2026-11-18");
  });
});

describe("tracedComponents", () => {
  it("offers only assemblies that actually resolve", () => {
    const traced = tracedComponents();
    expect(traced.length).toBeGreaterThan(0);
    for (const component of traced) {
      expect(dependencyChain(component.id)).toBeDefined();
    }
  });

  it("leads with the most units exposed", () => {
    const traced = tracedComponents();
    const most = Math.max(...traced.map(unitsExposed));
    expect(unitsExposed(traced[0]!)).toBe(most);
    expect(traced[0]?.id).toBe("cmp:tower-section-set");
  });

  it("traces all five critical assemblies on the Wind Energy order", () => {
    expect(tracedComponents("c1")).toHaveLength(5);
  });

  it("offers only critical-band assemblies", () => {
    const critical = new Set(criticalComponents().map((b) => b.component.id));
    for (const component of tracedComponents()) {
      expect(critical.has(component.id)).toBe(true);
    }
  });
});

describe("sourceConcentration", () => {
  it("keeps the imported billet and domestic-cover origins geographically distinct", () => {
    const concentration = sourceConcentration(dependencyChain(MAIN_SHAFT)!);
    expect(concentration.sources).toBe(2);
    expect(concentration.regions).toEqual(["Bulgaria", "Eastern India"]);
    expect(concentration.shared).toBe(false);
    expect(concentration.via).toBe("Jalna Alloy Supply");
  });

  it("does not claim concentration when only one source is identified", () => {
    const concentration = sourceConcentration(dependencyChain("cmp:rotor-hub-casting")!);
    expect(concentration.sources).toBe(1);
    expect(concentration.shared).toBe(false);
  });

  it("counts a direct mill as a source even when it sits at tier 2", () => {
    /* Tiruchi buys plate straight from the domestic mill and imports through a
       stockist. Both are origins; they are not in one region. */
    const concentration = sourceConcentration(dependencyChain("cmp:tower-section-set")!);
    expect(concentration.sources).toBe(2);
    expect(concentration.shared).toBe(false);
    expect(concentration.via).toBeUndefined();
  });
});

describe("interventionWindow", () => {
  it("derives the window from coverage plus programme margin", () => {
    const chain = dependencyChain(MAIN_SHAFT)!;
    const window = interventionWindow(chain);

    expect(window.coverageDays).toBe(chain.component.coverageDays);
    expect(window.marginDays).toBe(chain.commitment.marginDays);
    expect(window.totalDays).toBe(window.coverageDays + window.marginDays);
  });

  it("dates the end of coverage from the demo clock, not the wall clock", () => {
    const window = interventionWindow(dependencyChain(MAIN_SHAFT)!);
    /* 18 Sep 2026 + 5 days. */
    expect(window.coverageEndsOn).toBe("2026-11-07");
  });

  it("proves qualification does not fit — the scene's whole timing finding", () => {
    /* "Timing vulnerability" must be a *result*, not a sentence someone typed. If
       this ever passes, the condition should stop being shown, and the test failing
       is how we would find out. */
    for (const component of tracedComponents()) {
      const window = interventionWindow(dependencyChain(component.id)!);
      expect(window.qualificationFits).toBe(false);
      expect(window.shortfallDays).toBe(window.qualificationDays - window.totalDays);
      expect(window.shortfallDays).toBeGreaterThan(0);
    }
  });
});

describe("weakest", () => {
  it("returns the least-known state present", () => {
    expect(weakest(["verified", "inferred"])).toBe("inferred");
    expect(weakest(["missing", "verified"])).toBe("missing");
    expect(weakest(["low", "inferred"])).toBe("low");
    expect(weakest([])).toBe("verified");
  });
});

describe("exposure figures", () => {
  it("derives units exposed from the serial range rather than a literal", () => {
    const chain = dependencyChain(MAIN_SHAFT)!;
    const { from, to } = chain.component.turbines;
    expect(unitsExposed(chain.component)).toBe(to - from + 1);
    expect(unitsExposed(chain.component)).toBe(12);
    expect(unitsExposed(chain.component)).toBeLessThan(chain.commitment.units);
  });
});

describe("disclosure copy", () => {
  it("has a meaning and a label for every confidence state", () => {
    for (const state of ["verified", "inferred", "low", "missing"] as const) {
      expect(CONFIDENCE_MEANING[state].length).toBeGreaterThan(20);
      expect(CONFIDENCE_LABEL[state].length).toBeGreaterThan(0);
    }
  });

  it("gives every edge a stated basis", () => {
    for (const component of tracedComponents()) {
      for (const edge of dependencyChain(component.id)!.edges) {
        expect(edge.basis.length).toBeGreaterThan(20);
      }
    }
  });
});

describe("chains resolve against their own order", () => {
  it("carries Highland's commitment on Highland's chain", () => {
    const chain = dependencyChain("cmp:c2-nacelle-transformer");
    expect(chain?.commitment.id).toBe("c2");
    expect(chain?.supplier.name).toBe("Bhiwadi Transformer Works");
    expect(interventionWindow(chain!).marginDays).toBe(4);
  });

  it("scopes the switcher to one order", () => {
    expect(tracedComponents("c2").map((c) => c.id)).toEqual(["cmp:c2-nacelle-transformer"]);
    expect(tracedComponents("c1").some((c) => c.id.startsWith("cmp:c2-"))).toBe(false);
  });

  it("reports one source, not a shared geography, behind a single source", () => {
    const concentration = sourceConcentration(dependencyChain("cmp:c2-nacelle-transformer")!);
    expect(concentration).toMatchObject({ sources: 1, shared: false });
  });
});
