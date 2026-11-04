import { describe, expect, it } from "vitest";

import { evidenceMark } from "./epistemic";
import { CONFIDENCE_RANK, type Confidence } from "@/lib/network/dependencies";

const STATES = Object.keys(CONFIDENCE_RANK) as Confidence[];

describe("evidenceMark", () => {
  it("gives every confidence state a mark", () => {
    for (const state of STATES) {
      expect(evidenceMark(state)).toBeDefined();
    }
  });

  it("makes all four states visually distinguishable from one another", () => {
    /* The sketch's requirement is that known, inferred and unknown *look* different.
       Two states collapsing onto the same treatment would not fail any render — it
       would quietly turn an inference into a fact, which is the failure this whole
       scene exists to prevent. So distinctness is asserted rather than eyeballed. */
    const marks = STATES.map((s) => JSON.stringify(evidenceMark(s)));
    expect(new Set(marks).size).toBe(STATES.length);
  });

  it("draws only verified relationships solid and at full strength", () => {
    for (const state of STATES) {
      const mark = evidenceMark(state);
      if (state === "verified") {
        expect(mark.fill).toBe("solid");
        expect(mark.dash).toBeNull();
        expect(mark.opacity).toBe("var(--evidence-verified-opacity)");
      } else {
        expect(mark.fill).not.toBe("solid");
        expect(mark.opacity).toBe("var(--evidence-inferred-opacity)");
      }
    }
  });

  it("breaks the line as the relationship weakens, never before", () => {
    expect(evidenceMark("inferred").dash).toBeNull();
    expect(evidenceMark("low").dash).not.toBeNull();
    expect(evidenceMark("missing").dash).not.toBeNull();
    expect(evidenceMark("low").dash).not.toBe(evidenceMark("missing").dash);
  });

  it("reads every value from the token file rather than restating it", () => {
    /* A copied `0.6` here would survive a token change and silently desynchronise the
       map from the rest of the surface. */
    for (const state of STATES) {
      const mark = evidenceMark(state);
      expect(mark.opacity.startsWith("var(--evidence-")).toBe(true);
      if (mark.dash) expect(mark.dash.startsWith("var(--evidence-")).toBe(true);
    }
  });
});
