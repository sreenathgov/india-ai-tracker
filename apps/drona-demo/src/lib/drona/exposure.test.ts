import { describe, expect, it } from "vitest";

import { exposureBriefing, exposurePrompts, STANDING_LABEL } from "./exposure";
import { tracedComponents } from "@/lib/network/dependencies";

const MAIN_SHAFT = "cmp:main-shaft-forging";
const TRACED = [...tracedComponents("c1"), ...tracedComponents("c2")].map((c) => c.id);

describe("exposureBriefing", () => {
  it("resolves for every traced assembly and for nothing else", () => {
    for (const id of TRACED) expect(exposureBriefing(id)).toBeDefined();
    expect(exposureBriefing("cmp:tower-plate")).toBeUndefined();
  });

  it("gives every sentence a declared standing", () => {
    /* The sketch's provenance requirement made structural: a statement cannot reach
       the screen without saying where it came from, so no future edit can slip an
       inference in as a fact simply by writing it confidently. */
    for (const id of TRACED) {
      const briefing = exposureBriefing(id)!;
      const all = [
        ...briefing.whyFlagged,
        ...briefing.whatMattersNow,
        ...briefing.whatIWouldVerifyNext,
      ];
      for (const statement of all) {
        expect(STANDING_LABEL[statement.standing]).toBeDefined();
        expect(statement.text.length).toBeGreaterThan(30);
      }
    }
  });

  it("says why it flagged this in three sentences, one of each standing", () => {
    const briefing = exposureBriefing(MAIN_SHAFT)!;
    expect(briefing.whyFlagged.map((s) => s.standing)).toEqual([
      "inferred",
      "known",
      "unknown",
    ]);
  });

  it("never marks the upstream picture as known", () => {
    /* The upstream chain is Drona's own resolution. If this ever passes as `known`,
       the surface is claiming the order documents something it does not. */
    for (const id of TRACED) {
      expect(exposureBriefing(id)!.whyFlagged[0]?.standing).toBe("inferred");
    }
  });

  it("offers three checks, all of them recommended evidence rather than findings", () => {
    for (const id of TRACED) {
      const next = exposureBriefing(id)!.whatIWouldVerifyNext;
      expect(next).toHaveLength(3);
      expect(next.every((s) => s.standing === "next")).toBe(true);
    }
  });

  it("states what matters now with the derived exposure and window", () => {
    const briefing = exposureBriefing(MAIN_SHAFT)!;
    const text = briefing.whatMattersNow.map((s) => s.text).join(" ");
    expect(text).toContain("12 of 100 turbines");
    /* 5 days of coverage + 4 of margin = 9 days — short enough to state in days.
       The model is the authority, and this test is what keeps it that way. */
    expect(text).toContain("window is 9 days");
    expect(text).toContain("5 days of coverage");
  });
});

describe("exposurePrompts", () => {
  it("offers the sketch's four prompts, with the exposure figure in the first", () => {
    const prompts = exposurePrompts(MAIN_SHAFT);
    expect(prompts.map((p) => p.id)).toEqual([
      "why-units",
      "evidence",
      "remove-flag",
      "action",
    ]);
    expect(prompts[0].prompt).toBe("Why does this affect only 12 turbines?");
  });

  it("answers every spoken prompt for every traced assembly", () => {
    for (const id of TRACED) {
      const prompts = exposurePrompts(id);
      expect(prompts).toHaveLength(4);
      for (const prompt of prompts) {
        if (prompt.kind !== "spoken") continue;
        expect(prompt.paragraphs.length).toBeGreaterThan(1);
        for (const paragraph of prompt.paragraphs) {
          expect(paragraph.length).toBeGreaterThan(40);
        }
      }
    }
  });

  it("answers the evidence prompt with the ledger rather than with prose", () => {
    /* The distinction is carried by the type, not by an id a component has to
       recognise. If this ever became a spoken answer again, the provenance rows
       would quietly collapse into a paragraph that can be skimmed past. */
    for (const id of TRACED) {
      const evidence = exposurePrompts(id).find((p) => p.id === "evidence")!;
      expect(evidence.kind).toBe("ledger");
      expect(evidence).not.toHaveProperty("paragraphs");
    }
  });

  it("returns nothing for an assembly with no traced chain", () => {
    expect(exposurePrompts("cmp:tower-plate")).toEqual([]);
  });
});

/* Highland's one exposure reaches every unit and has one approved source. Copy
   written for the flagship's shape — "only N", "the second source" — would be
   wrong on it, and wrong in a way an audience notices. */
describe("a whole-order, single-source exposure", () => {
  const TRANSFORMER = "cmp:c2-nacelle-transformer";

  it("asks why it affects every turbine, not why only some", () => {
    const [first] = exposurePrompts(TRANSFORMER);
    expect(first?.prompt).toBe("Why does this affect every turbine?");
  });

  it("never speaks of a second approved source that does not exist", () => {
    const briefing = exposureBriefing(TRANSFORMER)!;
    const all = [
      ...briefing.whyFlagged,
      ...briefing.whatMattersNow,
      ...briefing.whatIWouldVerifyNext,
    ]
      .map((s) => s.text)
      .join(" ");
    expect(all).not.toContain("second approved source");
    expect(all).toContain("one approved source");
    expect(all).toContain("60 of 60 turbines");
  });
});
