import type {
  AuthoredEdge,
  AuthoredNode,
  CaseGraph,
  DependencyGraph,
  GraphEdge,
  GraphNode,
  SupplierTier,
} from "./types";
import { LATERAL_RELATIONS } from "./types";

/** Keys are short in the case files; ids are unique across the app. */
export const graphNodeId = (key: string): string => `sc:${key}`;

const edgeId = (edge: AuthoredEdge): string => `${edge.from}>${edge.to}:${edge.relation}`;

/** Three is the demo's resolution floor; anything deeper still reads as Tier 3. */
const asTier = (n: number): SupplierTier => (n >= 3 ? 3 : n <= 1 ? 1 : 2);

interface Walked {
  readonly depth: number;
  readonly parentId: string | null;
  /** Supplier relationships between the order and this node, counting itself. */
  readonly supplierDepth: number;
}

/**
 * Breadth-first from the order, over dependence edges only.
 *
 * The walk settles three things at once: which column a node sits in, which node it
 * hangs from for the layout, and how many supplier relationships deep it is. Lateral
 * relations are skipped here — `shares-capacity-with` says two branches are not
 * independent, which is a fact about the network, not a step further into it.
 */
function walk(nodes: Map<string, AuthoredNode>, edges: readonly AuthoredEdge[], rootKey: string): Map<string, Walked> {
  const out = new Map<string, Walked>([[rootKey, { depth: 0, parentId: null, supplierDepth: 0 }]]);
  const children = new Map<string, string[]>();
  for (const edge of edges) {
    if (LATERAL_RELATIONS.has(edge.relation)) continue;
    const list = children.get(edge.from);
    if (list) list.push(edge.to);
    else children.set(edge.from, [edge.to]);
  }
  let frontier = [rootKey];
  while (frontier.length > 0) {
    const next: string[] = [];
    for (const key of frontier) {
      const here = out.get(key)!;
      for (const childKey of children.get(key) ?? []) {
        if (out.has(childKey)) continue;
        const child = nodes.get(childKey)!;
        out.set(childKey, {
          depth: here.depth + 1,
          parentId: graphNodeId(key),
          supplierDepth: here.supplierDepth + (child.type === "supplier" ? 1 : 0),
        });
        next.push(childKey);
      }
    }
    frontier = next;
  }
  return out;
}

/**
 * The nodes the concern travels through, and the spine that reconnects them to the
 * order.
 *
 * Derived rather than authored, because a hand-marked critical path is a second
 * place for the truth to live and the first place for it to drift. Anything not in
 * normal context pulls its own ancestors in with it — a dependency the reader cannot
 * trace back to the order they are looking at explains nothing.
 */
function criticalPath(resolved: readonly GraphNode[]): ReadonlySet<string> {
  const byId = new Map(resolved.map((node) => [node.id, node]));
  const out = new Set<string>();
  for (const node of resolved) {
    if (node.concern === "normal") continue;
    let cursor: GraphNode | undefined = node;
    while (cursor && !out.has(cursor.id)) {
      out.add(cursor.id);
      cursor = cursor.parentId ? byId.get(cursor.parentId) : undefined;
    }
  }
  return out;
}

/**
 * Resolve an authored case into a graph, refusing anything that would render a lie.
 *
 * The checks throw at module load, the way the sub-tier resolver does: a dangling
 * edge or an unreachable node is an authoring mistake, and a graph that quietly drops
 * one is worse than a graph that will not load. The depth invariant is the important
 * one — a dependence edge that does not go deeper is either a cycle or a lateral
 * relation authored as a vertical one, and both would put a node in the wrong tier.
 */
export function buildGraph(source: CaseGraph): DependencyGraph {
  const nodes = new Map<string, AuthoredNode>();
  for (const node of source.nodes) {
    if (nodes.has(node.key)) throw new Error(`supply chain: duplicate node ${node.key}`);
    nodes.set(node.key, node);
  }
  if (!nodes.has(source.rootKey)) throw new Error(`supply chain: missing root ${source.rootKey}`);
  for (const edge of source.edges) {
    for (const end of [edge.from, edge.to]) {
      if (!nodes.has(end)) throw new Error(`supply chain: edge ${edgeId(edge)} names unknown node ${end}`);
    }
  }

  const walked = walk(nodes, source.edges, source.rootKey);
  for (const key of nodes.keys()) {
    if (!walked.has(key)) throw new Error(`supply chain: ${key} does not reach ${source.rootKey}`);
  }
  for (const edge of source.edges) {
    if (LATERAL_RELATIONS.has(edge.relation)) continue;
    if (walked.get(edge.to)!.depth <= walked.get(edge.from)!.depth) {
      throw new Error(`supply chain: ${edgeId(edge)} does not lead away from the order`);
    }
  }

  const resolved: readonly GraphNode[] = source.nodes.map((node) => {
    const { depth, parentId, supplierDepth } = walked.get(node.key)!;
    return {
      id: graphNodeId(node.key),
      type: node.type,
      name: node.name,
      detail: node.detail,
      place: node.place,
      evidence: node.evidence,
      concern: node.concern,
      concernNote: node.concernNote,
      facts: node.facts ?? [],
      dependencyId: node.dependencyId,
      subTierNodeId: node.subTierNodeId,
      context: node.context ?? false,
      depth,
      parentId,
      /* Only suppliers carry a tier. A material is never "Tier 2". */
      tier: node.type === "supplier" ? asTier(supplierDepth) : undefined,
      tierScope: asTier(supplierDepth),
      evidenceIds: node.evidenceIds ?? [],
      reasoningClaimIds: node.reasoningClaimIds ?? [],
    };
  });

  const edges: readonly GraphEdge[] = source.edges.map((edge) => ({
    id: edgeId(edge),
    fromId: graphNodeId(edge.from),
    toId: graphNodeId(edge.to),
    relation: edge.relation,
    evidence: edge.evidence,
    concern: edge.concern,
    basis: edge.basis,
    evidenceIds: edge.evidenceIds ?? [],
    reasoningClaimIds: edge.reasoningClaimIds ?? [],
  }));

  return {
    orderId: source.orderId,
    supplierId: source.supplierId,
    rootId: graphNodeId(source.rootKey),
    nodes: resolved,
    edges,
    criticalPathIds: criticalPath(resolved),
  };
}
