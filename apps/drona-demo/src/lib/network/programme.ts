/**
 * The programme metadata Scene 2's order header puts on screen.
 *
 * Every field here is **derived from the bill of materials and the commitment**,
 * never authored beside them. An order header is exactly the place where a demo
 * quietly starts lying: the dates look like metadata, nobody checks them, and they
 * drift away from the model they are supposed to describe. Deriving them means a
 * change to a lead time moves the production period, and a test catches it if it
 * does not.
 */
import { BOM, bomCommitment, type ComponentGroup } from "@/lib/network/bom";
import type { Commitment } from "@/lib/network/types";

const DAY_MS = 86_400_000;

/** ISO date in, ISO date out. UTC only — the demo clock has no timezone. */
export function shiftDays(iso: string, days: number): string {
  const at = new Date(`${iso}T00:00:00Z`).getTime() + days * DAY_MS;
  return new Date(at).toISOString().slice(0, 10);
}

export interface ProductionWindow {
  /** When the longest-lead assembly must already be committed. */
  readonly startsOn: string;
  /** When the last unit must leave the line to keep the programme margin intact. */
  readonly endsOn: string;
  readonly longestLeadDays: number;
  readonly days: number;
}

/**
 * The production period.
 *
 * It ends `marginDays` before the required delivery date — that is what margin
 * means — and it begins where the longest procurement lead time on the released
 * revision forces it to begin. Neither end is a choice; both fall out of the data.
 */
export function productionWindow(
  commitment: Commitment = bomCommitment(),
  bom: readonly ComponentGroup[] = BOM
): ProductionWindow {
  const longestLeadDays = bom.reduce((max, c) => Math.max(max, c.leadTimeDays), 0);
  const endsOn = shiftDays(commitment.requiredBy, -commitment.marginDays);
  const startsOn = shiftDays(endsOn, -longestLeadDays);
  return { startsOn, endsOn, longestLeadDays, days: longestLeadDays };
}

export interface ProcurementCoverage {
  /** Assemblies whose confirmed material coverage reaches their own lead time. */
  readonly confirmed: number;
  readonly total: number;
}

/**
 * Procurement status as a ratio, not a word.
 *
 * "Procurement: complete" would be the comfortable phrasing and it would be false —
 * every assembly is ordered, but coverage runs out before the lead time on several
 * of them. The ratio says the true thing in the same amount of space.
 */
export function procurementCoverage(
  bom: readonly ComponentGroup[] = BOM
): ProcurementCoverage {
  return {
    confirmed: bom.filter((c) => c.coverageDays >= c.leadTimeDays).length,
    total: bom.length,
  };
}
