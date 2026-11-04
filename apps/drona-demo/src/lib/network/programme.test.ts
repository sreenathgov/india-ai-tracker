import { describe, expect, it } from "vitest";

import { BOM, bomCommitment } from "./bom";
import { procurementCoverage, productionWindow, shiftDays } from "./programme";

const commitment = bomCommitment();

describe("shiftDays", () => {
  it("moves a date backwards across a month boundary", () => {
    expect(shiftDays("2026-11-18", -9)).toBe("2026-11-09");
    expect(shiftDays("2026-11-09", -91)).toBe("2026-08-10");
  });

  it("is its own inverse", () => {
    expect(shiftDays(shiftDays("2026-11-18", -37), 37)).toBe("2026-11-18");
  });
});

describe("production window", () => {
  const window = productionWindow();

  it("ends exactly the programme margin before the required delivery date", () => {
    expect(window.endsOn).toBe(
      shiftDays(commitment.requiredBy, -commitment.marginDays)
    );
  });

  it("starts where the longest lead time on the released revision forces it to", () => {
    const longest = Math.max(...BOM.map((c) => c.leadTimeDays));
    expect(window.longestLeadDays).toBe(longest);
    expect(window.startsOn).toBe(shiftDays(window.endsOn, -longest));
  });

  it("opens before it closes", () => {
    expect(window.startsOn < window.endsOn).toBe(true);
  });
});

describe("procurement coverage", () => {
  const coverage = procurementCoverage();

  it("counts every assembly on the released revision", () => {
    expect(coverage.total).toBe(BOM.length);
  });

  /* The header must not be able to read as "procurement: done". If coverage ever
     reaches every assembly, the critical band is empty and Scene 3 has nothing to
     explain — so this assertion is load-bearing for the whole demo, not cosmetic. */
  it("never confirms coverage on every assembly", () => {
    expect(coverage.confirmed).toBeLessThan(coverage.total);
    expect(coverage.confirmed).toBeGreaterThan(0);
  });
});
