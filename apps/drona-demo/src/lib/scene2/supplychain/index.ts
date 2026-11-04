import { buildGraph } from "./build";
import { withMappedContext } from "./mapped";
import { DECCAN_GRAPH } from "./cases/deccan";
import { DURGAPUR_GRAPH } from "./cases/durgapur";
import { SAURASHTRA_GRAPH } from "./cases/saurashtra";
import { TIRUCHI_GRAPH } from "./cases/tiruchi";
import type { CaseGraph, DependencyGraph } from "./types";

/** The supply-chain model's public surface. Components import from here. */
export * from "./types";
export {
  CONCERN_LABEL,
  CONCERN_MEANING,
  EVIDENCE_LABEL,
  EVIDENCE_MEANING,
  NODE_TYPE_LABEL,
  RELATION_LABEL,
  TIER_LABEL,
} from "./labels";
export { buildGraph, graphNodeId } from "./build";
export {
  applyView,
  DEFAULT_VIEW,
  isFiltered,
  OBJECT_KINDS,
  setMode,
  setTier,
  toggleKind,
  withheldCount,
  type GraphView,
  type ObjectKind,
  type VisibleGraph,
  type ViewMode,
} from "./view";
export { edgePath, layoutGraph, sizeOf, type GraphLayout, type NodeBox } from "./layout";

const CASES: readonly CaseGraph[] = [DECCAN_GRAPH, SAURASHTRA_GRAPH, TIRUCHI_GRAPH, DURGAPUR_GRAPH];

const key = (orderId: string, supplierId: string): string => `${orderId}:${supplierId}`;

/**
 * One graph per case, widened once and built once.
 *
 * The background parties are folded in at authoring level rather than at render
 * time, so depth, tier and the critical path all fall out of a single resolution
 * pass and cannot differ between the three views. What the reader sees narrower is
 * the view filtering, not a second graph.
 */
export const SUPPLY_CHAIN_GRAPHS: ReadonlyMap<string, DependencyGraph> = new Map(
  CASES.map((source) => [key(source.orderId, source.supplierId), buildGraph(withMappedContext(source))]),
);

export const supplyChainGraphFor = (orderId: string, supplierId: string): DependencyGraph | undefined =>
  SUPPLY_CHAIN_GRAPHS.get(key(orderId, supplierId));
