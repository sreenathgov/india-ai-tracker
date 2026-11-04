/**
 * What the production view is showing of a sub-tier network: which roles, and
 * whether only flagged or only foreign parties.
 *
 * One value, read by both the map legend and the table beneath the risk view, so
 * the two can never disagree about what is on screen. Every change returns a new
 * filter.
 *
 * The weak link is always shown. Filtering out the one node the view exists to
 * explain would leave the "why" section pointing at something that is not there.
 */
import { SUBTIER_ROLES, type ResolvedSubTierNode, type SubTierRole } from "./types";

export interface SubTierFilter {
  readonly roles: ReadonlySet<SubTierRole>;
  readonly flaggedOnly: boolean;
  readonly abroadOnly: boolean;
}

export const ALL_SUBTIER: SubTierFilter = {
  roles: new Set(SUBTIER_ROLES),
  flaggedOnly: false,
  abroadOnly: false,
};

export function toggleRole(filter: SubTierFilter, role: SubTierRole): SubTierFilter {
  const roles = new Set(filter.roles);
  if (roles.has(role)) roles.delete(role);
  else roles.add(role);
  return { ...filter, roles };
}

export const toggleFlagged = (filter: SubTierFilter): SubTierFilter => ({
  ...filter,
  flaggedOnly: !filter.flaggedOnly,
});

export const toggleAbroad = (filter: SubTierFilter): SubTierFilter => ({
  ...filter,
  abroadOnly: !filter.abroadOnly,
});

export const isFiltered = (filter: SubTierFilter): boolean =>
  filter.flaggedOnly || filter.abroadOnly || filter.roles.size < SUBTIER_ROLES.length;

export function passes(entry: ResolvedSubTierNode, filter: SubTierFilter): boolean {
  if (entry.weakLink) return true;
  if (!filter.roles.has(entry.node.role)) return false;
  if (filter.flaggedOnly && entry.node.signals.length === 0) return false;
  if (filter.abroadOnly && !entry.abroad) return false;
  return true;
}
