import type { DependencyGraph, GraphEdge, GraphNode, GraphNodeType, SupplierTier } from "./types";

/**
 * How much of the network is on screen.
 *
 * `critical` is the default and the point of the surface: the dependencies this
 * concern actually travels through, and the spine back to the order. `relevant` is
 * everything Drona judged to bear on this commitment. `mapped` is everything Drona
 * holds behind this supplier, most of which has nothing to do with today.
 */
export type ViewMode = "critical" | "relevant" | "mapped";

/** The object kinds a reader can put away. Order and component are never hidden. */
export type ObjectKind = Extract<GraphNodeType, "supplier" | "material" | "process" | "facility" | "route">;

export const OBJECT_KINDS: readonly ObjectKind[] = ["supplier", "material", "process", "facility", "route"];

export interface GraphView {
  readonly mode: ViewMode;
  /** How many supplier relationships deep to resolve. */
  readonly tier: SupplierTier;
  readonly hidden: ReadonlySet<ObjectKind>;
}

export const DEFAULT_VIEW: GraphView = { mode: "critical", tier: 3, hidden: new Set() };

export const setMode = (view: GraphView, mode: ViewMode): GraphView => ({ ...view, mode });
export const setTier = (view: GraphView, tier: SupplierTier): GraphView => ({ ...view, tier });

export function toggleKind(view: GraphView, kind: ObjectKind): GraphView {
  const hidden = new Set(view.hidden);
  if (hidden.has(kind)) hidden.delete(kind);
  else hidden.add(kind);
  return { ...view, hidden };
}

export const isFiltered = (view: GraphView): boolean => view.hidden.size > 0;

/**
 * The two nodes a filter may never remove.
 *
 * The supplier under investigation and anything the concern demonstrably travels
 * through stay on screen whatever the reader has put away, for the same reason the
 * sub-tier table always shows its weak link: filtering out the one object the view
 * exists to explain would leave the explanation pointing at nothing.
 */
const pinned = (node: GraphNode): boolean => node.concern === "active" || node.concern === "exposed" || node.concern === "unresolved";

const keeps = (node: GraphNode, view: GraphView, graph: DependencyGraph): boolean => {
  if (node.type === "order" || node.type === "component") return true;
  if (node.context && view.mode !== "mapped") return false;
  if (view.mode === "critical" && !graph.criticalPathIds.has(node.id)) return false;
  if (node.tierScope > view.tier) return false;
  if (pinned(node)) return true;
  return !view.hidden.has(node.type as ObjectKind);
};

export interface VisibleGraph {
  readonly nodes: readonly GraphNode[];
  readonly edges: readonly GraphEdge[];
}

/**
 * Apply a view, then drop whatever the view has cut adrift.
 *
 * A node whose parent has gone would otherwise float in its column with no line back
 * to the order — which is exactly the reading this surface exists to prevent. So the
 * survivors are taken by descent from the order rather than by filter alone.
 */
export function applyView(graph: DependencyGraph, view: GraphView): VisibleGraph {
  const eligible = new Set(graph.nodes.filter((node) => keeps(node, view, graph)).map((node) => node.id));
  const byId = new Map(graph.nodes.map((node) => [node.id, node]));
  const kept = new Set<string>();
  for (const node of graph.nodes) {
    if (!eligible.has(node.id)) continue;
    const chain: string[] = [];
    let cursor: GraphNode | undefined = node;
    let rooted = false;
    while (cursor) {
      if (kept.has(cursor.id)) {
        rooted = true;
        break;
      }
      if (!eligible.has(cursor.id)) break;
      chain.push(cursor.id);
      if (cursor.parentId === null) {
        rooted = true;
        break;
      }
      cursor = byId.get(cursor.parentId);
    }
    if (rooted) for (const id of chain) kept.add(id);
  }
  return {
    nodes: graph.nodes.filter((node) => kept.has(node.id)),
    edges: graph.edges.filter((edge) => kept.has(edge.fromId) && kept.has(edge.toId)),
  };
}

/** How many objects the current view is holding back, for the mode control's note. */
export const withheldCount = (graph: DependencyGraph, view: GraphView): number =>
  graph.nodes.length - applyView(graph, view).nodes.length;
