import type { VisibleGraph } from "./view";

export interface Highlight {
  readonly nodeIds: ReadonlySet<string>;
  readonly edgeIds: ReadonlySet<string>;
}

export const NO_HIGHLIGHT: Highlight = { nodeIds: new Set(), edgeIds: new Set() };

/**
 * What to hold up when the reader rests on a card.
 *
 * Its direct connections, and then the line back to the order — because the
 * question a reader asks of a card five columns deep is "and how does this reach
 * what we owe?", and the answer is the chain of parents, not the whole subgraph.
 * Everything not in the returned sets recedes rather than disappearing.
 */
export function highlightFor(graph: VisibleGraph, nodeId: string | null): Highlight {
  if (!nodeId) return NO_HIGHLIGHT;
  const nodes = new Map(graph.nodes.map((node) => [node.id, node] as const));
  if (!nodes.has(nodeId)) return NO_HIGHLIGHT;

  const nodeIds = new Set<string>([nodeId]);
  const edgeIds = new Set<string>();

  for (const edge of graph.edges) {
    if (edge.fromId !== nodeId && edge.toId !== nodeId) continue;
    edgeIds.add(edge.id);
    nodeIds.add(edge.fromId);
    nodeIds.add(edge.toId);
  }

  /* The way back to the order. Guarded against a cycle the builder should prevent. */
  let cursor = nodes.get(nodeId)?.parentId ?? null;
  const seen = new Set<string>();
  while (cursor && !seen.has(cursor)) {
    seen.add(cursor);
    nodeIds.add(cursor);
    const node = nodes.get(cursor);
    cursor = node?.parentId ?? null;
  }
  for (const edge of graph.edges) {
    if (nodeIds.has(edge.fromId) && nodeIds.has(edge.toId)) edgeIds.add(edge.id);
  }
  return { nodeIds, edgeIds };
}
