/**
 * Every figure the concern band shows, derived from the authored network.
 *
 * Nothing here produces a composite index or a percentage-of-health. A single
 * number that blends unlike exposures is a risk score wearing different clothes,
 * and it is exactly what the surface must not offer: it replaces an explanation
 * with a verdict. These are counts and ratios that can each be traced back to the
 * records that produced them.
 */
import {
  COMMITMENTS,
  SUPPLIERS,
  suppliersForCommitment,
} from "./gazetteer";
import type { Commitment, Concern, Supplier } from "./types";

export interface ConcernDistribution {
  readonly low: number;
  readonly elevated: number;
  readonly critical: number;
  readonly total: number;
  readonly countries: number;
}

export function concernDistribution(
  suppliers: readonly Supplier[] = SUPPLIERS
): ConcernDistribution {
  const counts: Record<Concern, number> = { low: 0, elevated: 0, critical: 0 };
  const countries = new Set<string>();
  for (const supplier of suppliers) {
    counts[supplier.concern] += 1;
    countries.add(supplier.country);
  }
  return { ...counts, total: suppliers.length, countries: countries.size };
}

export interface ExposureRatio {
  readonly mitigated: number;
  readonly total: number;
}

/**
 * An exposure is a supplier in elevated or critical concern. It is mitigated when a
 * qualified alternative has been confirmed.
 *
 * Written as a ratio rather than a percentage on purpose: "6 of 30" resists being
 * read as a performance score in a way "20%" does not.
 */
export function exposureRatio(
  suppliers: readonly Supplier[] = SUPPLIERS
): ExposureRatio {
  const exposed = suppliers.filter((s) => s.concern !== "low");
  return {
    mitigated: exposed.filter((s) => s.mitigated).length,
    total: exposed.length,
  };
}

export interface NearestDelivery {
  readonly commitment: Commitment;
  readonly days: number;
}

/**
 * Days until the nearest required delivery date. Time always matters, and nothing
 * else on Scene 1 carries it.
 *
 * `asOf` is injected rather than read from the clock so the figure is deterministic
 * in tests and identical on every machine the demo runs on.
 */
export function nearestDelivery(
  asOf: Date,
  commitments: readonly Commitment[] = COMMITMENTS
): NearestDelivery | null {
  const dayMs = 86_400_000;
  const startOfDay = Date.UTC(
    asOf.getUTCFullYear(),
    asOf.getUTCMonth(),
    asOf.getUTCDate()
  );

  const ranked = commitments
    .map((commitment) => ({
      commitment,
      days: Math.round((Date.parse(commitment.requiredBy) - startOfDay) / dayMs),
    }))
    .filter((entry) => Number.isFinite(entry.days))
    .sort((a, b) => a.days - b.days);

  return ranked[0] ?? null;
}

/**
 * How many production commitments currently touch at least one supplier in
 * elevated or critical concern. Derived from the supplier bindings, not from the
 * commitment's own authored concern — if the two ever disagree, the bindings win,
 * because they are the evidence.
 */
export function commitmentsUnderConcern(
  commitments: readonly Commitment[] = COMMITMENTS
): readonly Commitment[] {
  return commitments.filter((commitment) =>
    suppliersForCommitment(commitment.id).some((s) => s.concern !== "low")
  );
}

/** The worst concern actually present among a commitment's suppliers. */
export function derivedCommitmentConcern(commitmentId: string): Concern {
  const suppliers = suppliersForCommitment(commitmentId);
  if (suppliers.some((s) => s.concern === "critical")) return "critical";
  if (suppliers.some((s) => s.concern === "elevated")) return "elevated";
  return "low";
}

/* ── Band tones ─────────────────────────────────────────────────────────────
   The concern band fills each figure with a concern colour. The colour is a
   state the figure is already in, read off the records — never a threshold on a
   blended number. Each rule below is one sentence a reviewer can check. */

const RANK: Record<Concern, number> = { low: 0, elevated: 1, critical: 2 };

/** Elevated while any exposure still lacks a confirmed alternative; low once none does. */
export const exposureTone = (ratio: ExposureRatio): Concern =>
  ratio.mitigated < ratio.total ? "elevated" : "low";

/** The worst concern any of these commitments touches through its suppliers. */
export function worstCommitmentConcern(commitments: readonly Commitment[]): Concern {
  return commitments
    .map((c) => derivedCommitmentConcern(c.id))
    .reduce<Concern>((worst, next) => (RANK[next] > RANK[worst] ? next : worst), "low");
}

export interface CriticalConcentration {
  readonly criticalCount: number;
  /** How many of those critical suppliers serve the same pair of commitments. */
  readonly sharedCount: number;
  readonly sharedCommitmentIds: readonly string[];
}

/**
 * The pattern Drona opens Scene 1 with: whether critical concern is spread across
 * the network or concentrated on a few commitments. Concentration, not breadth, is
 * what makes a hundred-supplier network handleable — so it is computed, not asserted.
 */
export function criticalConcentration(
  suppliers: readonly Supplier[] = SUPPLIERS
): CriticalConcentration {
  const critical = suppliers.filter((s) => s.concern === "critical");

  const pairCounts = new Map<string, number>();
  for (const supplier of critical) {
    const ids = [...supplier.commitmentIds].sort();
    for (let i = 0; i < ids.length; i += 1) {
      for (let j = i + 1; j < ids.length; j += 1) {
        const key = `${ids[i]}|${ids[j]}`;
        pairCounts.set(key, (pairCounts.get(key) ?? 0) + 1);
      }
    }
  }

  let bestKey: string | null = null;
  let bestCount = 0;
  for (const [key, count] of pairCounts) {
    if (count > bestCount) {
      bestKey = key;
      bestCount = count;
    }
  }

  return {
    criticalCount: critical.length,
    sharedCount: bestCount,
    sharedCommitmentIds: bestKey ? bestKey.split("|") : [],
  };
}

/** Plural-safe day phrasing. Small, but it is on screen constantly. */
export const days = (n: number): string => `${n} ${n === 1 ? "day" : "days"}`;
