import { describe, expect, it } from "vitest";

import { COMMITMENTS, SUPPLIERS } from "./gazetteer";
import {
  commitmentsUnderConcern,
  concernDistribution,
  criticalConcentration,
  days,
  derivedCommitmentConcern,
  exposureRatio,
  exposureTone,
  nearestDelivery,
  worstCommitmentConcern,
} from "./rollups";

describe("concernDistribution", () => {
  it("matches the authored network exactly — the band must never round or estimate", () => {
    const d = concernDistribution();
    expect(d.total).toBe(80);
    expect(d.low).toBe(56);
    expect(d.elevated).toBe(14);
    expect(d.critical).toBe(10);
    expect(d.low + d.elevated + d.critical).toBe(d.total);
  });

  it("counts distinct countries rather than repeating the supplier total", () => {
    const d = concernDistribution();
    expect(d.countries).toBeGreaterThan(1);
    expect(d.countries).toBeLessThan(d.total);
  });

  it("returns a zeroed distribution for an empty network instead of throwing", () => {
    expect(concernDistribution([])).toEqual({
      low: 0,
      elevated: 0,
      critical: 0,
      total: 0,
      countries: 0,
    });
  });
});

describe("exposureRatio", () => {
  it("counts only elevated and critical suppliers as exposures", () => {
    const { mitigated, total } = exposureRatio();
    expect(total).toBe(24);
    expect(mitigated).toBe(6);
  });

  it("never counts a low-concern supplier as mitigated", () => {
    const low = SUPPLIERS.filter((s) => s.concern === "low");
    expect(exposureRatio(low)).toEqual({ mitigated: 0, total: 0 });
  });

  it("leaves the hardest exposures unmitigated, which is the honest picture", () => {
    const criticalMitigated = SUPPLIERS.filter(
      (s) => s.concern === "critical" && s.mitigated
    );
    expect(criticalMitigated).toHaveLength(0);
  });
});

describe("nearestDelivery", () => {
  it("is deterministic for a fixed asOf, independent of the wall clock", () => {
    const asOf = new Date("2026-09-18T00:00:00.000Z");
    const first = nearestDelivery(asOf);
    const second = nearestDelivery(asOf);
    expect(first?.commitment.id).toBe(second?.commitment.id);
    expect(first?.days).toBe(second?.days);
  });

  it("returns the soonest required delivery, not the first authored", () => {
    const asOf = new Date("2026-09-18T00:00:00.000Z");
    const result = nearestDelivery(asOf);
    expect(result).not.toBeNull();
    const soonest = [...COMMITMENTS].sort((a, b) =>
      a.requiredBy < b.requiredBy ? -1 : 1
    )[0];
    expect(result?.commitment.id).toBe(soonest.id);
    expect(result?.days).toBeGreaterThan(0);
  });

  it("ignores the time of day, so the figure does not flicker during a demo", () => {
    const morning = nearestDelivery(new Date("2026-09-18T04:00:00.000Z"));
    const evening = nearestDelivery(new Date("2026-09-18T22:30:00.000Z"));
    expect(morning?.days).toBe(evening?.days);
  });

  it("returns null rather than a placeholder when there is nothing to deliver", () => {
    expect(nearestDelivery(new Date("2026-09-18T00:00:00.000Z"), [])).toBeNull();
  });
});

describe("commitmentsUnderConcern", () => {
  it("derives four of five from the supplier bindings", () => {
    const under = commitmentsUnderConcern();
    expect(under).toHaveLength(4);
    expect(COMMITMENTS).toHaveLength(5);
  });

  it("agrees with the per-commitment derivation", () => {
    const under = new Set(commitmentsUnderConcern().map((c) => c.id));
    for (const commitment of COMMITMENTS) {
      const derived = derivedCommitmentConcern(commitment.id);
      expect(under.has(commitment.id)).toBe(derived !== "low");
    }
  });

  it("agrees with the concern authored on each commitment", () => {
    for (const commitment of COMMITMENTS) {
      expect(derivedCommitmentConcern(commitment.id)).toBe(commitment.concern);
    }
  });
});

describe("criticalConcentration", () => {
  it("finds the concentration Drona opens Scene 1 with", () => {
    const { criticalCount, sharedCount, sharedCommitmentIds } =
      criticalConcentration();
    expect(criticalCount).toBe(10);
    expect(sharedCount).toBe(6);
    expect(sharedCommitmentIds).toHaveLength(2);
  });

  it("reports no concentration when nothing is critical, rather than a stray pair", () => {
    const low = SUPPLIERS.filter((s) => s.concern === "low");
    expect(criticalConcentration(low)).toEqual({
      criticalCount: 0,
      sharedCount: 0,
      sharedCommitmentIds: [],
    });
  });
});

describe("days", () => {
  it("is plural-safe", () => {
    expect(days(1)).toBe("1 day");
    expect(days(0)).toBe("0 days");
    expect(days(37)).toBe("37 days");
  });
});

describe("band tones — the colour each figure is filled with", () => {
  it("fills mitigation elevated while any exposure lacks an alternative", () => {
    expect(exposureTone({ mitigated: 6, total: 24 })).toBe("elevated");
    expect(exposureTone({ mitigated: 24, total: 24 })).toBe("low");
    expect(exposureTone({ mitigated: 0, total: 0 })).toBe("low");
  });

  it("fills commitments with the worst concern any of them touches", () => {
    expect(worstCommitmentConcern(COMMITMENTS)).toBe("critical");
    expect(worstCommitmentConcern([])).toBe("low");
  });

  it("fills the nearest delivery with that order's own concern", () => {
    const nearest = nearestDelivery(new Date("2026-09-18T00:00:00Z"))!;
    expect(worstCommitmentConcern([nearest.commitment])).toBe(
      derivedCommitmentConcern(nearest.commitment.id)
    );
  });
});
