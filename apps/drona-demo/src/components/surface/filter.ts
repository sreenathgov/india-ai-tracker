import type { CommitmentState, DependencyType, PortfolioRow } from "@/lib/portfolio/portfolio";
import { commitmentsWithType } from "@/lib/portfolio/portfolio";

/**
 * What narrows the commitment queue. Set from the state card or the ring, cleared
 * from the queue. One at a time: two stacked filters on five rows would hide more
 * than they show.
 */
export type SurfaceFilter =
  | { readonly kind: "state"; readonly state: CommitmentState }
  | { readonly kind: "type"; readonly type: DependencyType }
  | null;

export function applyFilter(rows: readonly PortfolioRow[], filter: SurfaceFilter): readonly PortfolioRow[] {
  if (!filter) return rows;
  if (filter.kind === "state") return rows.filter((r) => r.state === filter.state);
  const ids = new Set(commitmentsWithType(filter.type).map((c) => c.id));
  return rows.filter((r) => ids.has(r.commitment.id));
}

/** Clicking the active filter again clears it. */
export const toggleFilter = (current: SurfaceFilter, next: NonNullable<SurfaceFilter>): SurfaceFilter =>
  JSON.stringify(current) === JSON.stringify(next) ? null : next;
