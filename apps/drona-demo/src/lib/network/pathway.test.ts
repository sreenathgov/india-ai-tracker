import { describe, expect, it } from "vitest";

import { dependencyChain, tracedComponents } from "./dependencies";
import {
  componentSummary,
  contributingConditions,
  formatDay,
  productionPathway,
  weakLink,
  weeks,
} from "./pathway";

const MAIN_SHAFT = "cmp:main-shaft-forging";
const TRACED = tracedComponents().map((c) => c.id);

describe("productionPathway", () => {
  it("names the sketch's six stages in production order", () => {
    expect(productionPathway(MAIN_SHAFT).map((s) => s.name)).toEqual([
      "Steel allocation",
      "Forging",
      "Heat treatment",
      "Machining",
      "Inspection",
      "Delivery",
    ]);
  });

  it("gives every stage a status and a stated reason", () => {
    for (const id of TRACED) {
      const stages = productionPathway(id);
      expect(stages.length).toBe(6);
      for (const stage of stages) {
        expect(["clear", "exposed", "downstream"]).toContain(stage.status);
        expect(stage.note.length).toBeGreaterThan(10);
      }
    }
  });

  it("marks exactly one stage as the entry point", () => {
    for (const id of TRACED) {
      const exposed = productionPathway(id).filter((s) => s.status === "exposed");
      expect(exposed).toHaveLength(1);
    }
  });

  it("makes every stage after the entry point downstream, and none before it", () => {
    /* The transmission claim: trouble enters once and is inherited, never re-caused.
       A `clear` stage appearing after an `exposed` one would say the pathway recovers
       on its own, which is the opposite of what the weak-link copy asserts. */
    for (const id of TRACED) {
      const stages = productionPathway(id);
      const entry = stages.findIndex((s) => s.status === "exposed");
      expect(stages.slice(0, entry).every((s) => s.status === "clear")).toBe(true);
      expect(stages.slice(entry + 1).every((s) => s.status === "downstream")).toBe(true);
    }
  });

  it("returns nothing for an untraced assembly rather than six clear stages", () => {
    expect(productionPathway("cmp:tower-plate")).toEqual([]);
  });
});

describe("weakLink", () => {
  it("names the main shaft's raw-material dependency at steel allocation", () => {
    const link = weakLink(MAIN_SHAFT)!;
    expect(link.title).toBe("Raw-material dependency");
    expect(link.stage.name).toBe("Steel allocation");
    expect(link.stage.status).toBe("exposed");
  });

  it("carries the sketch's four facts, each derived", () => {
    const link = weakLink(MAIN_SHAFT)!;
    expect(link.facts).toHaveLength(4);

    const text = link.facts.join(" ");
    expect(text).toContain("2 approved sources");
    expect(text).toContain("Eastern India");
    expect(text).toContain("5 days of confirmed material coverage");
    expect(text).toContain("8 weeks to qualify");
  });

  it("withholds the shared-geography fact when the model does not support it", () => {
    const link = weakLink("cmp:tower-section-set")!;
    expect(link.facts.join(" ")).not.toContain("one geography");
  });

  it("resolves for every traced assembly", () => {
    for (const id of TRACED) {
      expect(weakLink(id)).toBeDefined();
    }
    expect(weakLink("cmp:tower-plate")).toBeUndefined();
  });
});

describe("contributingConditions", () => {
  it("does not invent geographic concentration for the imported billet and domestic-cover route", () => {
    expect(contributingConditions(MAIN_SHAFT).map((c) => c.title)).toEqual([
      "Timing vulnerability",
      "External condition",
    ]);
  });

  it("states supplier concentration only where sources genuinely share a region", () => {
    const hub = contributingConditions("cmp:rotor-hub-casting").map((c) => c.id);
    expect(hub).toContain("single-source");
    expect(hub).not.toContain("concentration");
    expect(contributingConditions("cmp:main-bearing-housing").map((c) => c.id)).toContain(
      "concentration"
    );
    const plate = contributingConditions("cmp:tower-section-set").map((c) => c.id);
    expect(plate).not.toContain("concentration");
    expect(plate).not.toContain("single-source");
  });

  it("gives each production route its own stages", () => {
    expect(productionPathway("cmp:rotor-hub-casting").find((s) => s.status === "exposed")?.name).toBe(
      "Melt & nodularise"
    );
    expect(productionPathway("cmp:main-bearing-housing").find((s) => s.status === "exposed")?.name).toBe(
      "Charge make-up"
    );
    expect(productionPathway("cmp:tower-section-set").find((s) => s.status === "exposed")?.name).toBe(
      "Plate allocation"
    );
    expect(productionPathway("cmp:tower-flange").find((s) => s.status === "exposed")?.name).toBe(
      "Inspection"
    );
  });

  it("writes conditions as prose, not as labels", () => {
    /* A condition is a claim about the world; a claim needs a sentence. Anything
       short enough to read as a chip has lost the reasoning it was supposed to carry. */
    for (const id of TRACED) {
      for (const condition of contributingConditions(id)) {
        expect(condition.body.length).toBeGreaterThan(120);
        expect(condition.body).toMatch(/\.\s|\.$/);
      }
    }
  });

  it("puts the derived shortfall into the timing condition", () => {
    const timing = contributingConditions(MAIN_SHAFT).find((c) => c.id === "timing")!;
    /* 5 coverage + 4 margin = 9; 56 to qualify; 47 short. */
    expect(timing.body).toContain("5 days");
    expect(timing.body).toContain("4 days of margin");
    expect(timing.body).toContain("9 days in total");
    expect(timing.body).toContain("47 days longer");
  });
});

describe("componentSummary", () => {
  it("derives the header from the chain and its order", () => {
    const summary = componentSummary(dependencyChain(MAIN_SHAFT)!);
    expect(summary.name).toBe("Main Shaft Forging");
    expect(summary.system).toBe("Drivetrain");
    expect(summary.unitsExposed).toBe(12);
    expect(summary.totalUnits).toBe(100);
    expect(summary.requiredBy).toBe("2026-11-18");
    expect(summary.unitsExposed).toBeLessThan(summary.totalUnits);
  });
});

describe("formatting", () => {
  it("formats a day unambiguously and in UTC", () => {
    expect(formatDay("2026-11-18")).toBe("18 Nov 2026");
    expect(formatDay("2026-01-05")).toBe("05 Jan 2026");
  });

  it("rounds to whole weeks", () => {
    expect(weeks(56)).toBe(8);
    expect(weeks(49)).toBe(7);
    expect(weeks(84)).toBe(12);
  });
});

/* Highland's critical assembly is not forged, and is single-sourced. The pathway
   and the weak link must say both, rather than borrowing the forging's shape. */
describe("a single-source, non-forged pathway", () => {
  const id = "cmp:c2-nacelle-transformer";

  it("uses the transformer's own route, not the forging's", () => {
    const names = productionPathway(id).map((s) => s.name);
    expect(names).toContain("Winding");
    expect(names).not.toContain("Forging");
    expect(productionPathway(id)[0]?.status).toBe("exposed");
  });

  it("states one approved source in the singular", () => {
    const link = weakLink(id);
    expect(link?.title).toBe("Single-source dependency");
    expect(link?.facts[0]).toMatch(/^One approved source/);
    expect(link?.facts.join(" ")).not.toContain("1 approved sources");
  });

  it("raises single-source and timing conditions against Highland's own margin", () => {
    const ids = contributingConditions(id).map((c) => c.id);
    expect(ids).toEqual(["single-source", "timing", "external"]);
    const timing = contributingConditions(id).find((c) => c.id === "timing");
    expect(timing?.body).toContain("4 days of margin");
  });
});
