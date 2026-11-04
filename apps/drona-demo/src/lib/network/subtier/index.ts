/**
 * The sub-tier registry: five authored networks, validated and resolved once.
 *
 * Authoring (`deccan.ts` …) says who supplies whom and how that is known. This file
 * derives everything that follows from it — a node's tier, its establishing
 * confidence, whether it is shared, the route from the weak link to the Tier-1 —
 * so none of those can be written down wrong.
 *
 * It throws at module load on anything a reviewer would otherwise meet as a blank
 * or a lie on screen: an edge to a party that does not exist, a party listed twice,
 * a party nothing connects to the Tier-1, a weak link that is not in the network.
 * The same discipline as `bom.ts`.
 */
import { CONFIDENCE_MEANING, CONFIDENCE_RANK, type Confidence } from "@/lib/network/confidence";
import { SUPPLIERS } from "@/lib/network/gazetteer";
import { TIER1, expandNode, nodeId, type AuthoredNetwork, type NodeRow } from "./author";
import { DECCAN } from "./deccan";
import { KOVAI } from "./kovai";
import { LUDHIANA } from "./ludhiana";
import { SAURASHTRA } from "./saurashtra";
import { SHARED_ROWS } from "./shared";
import { TIRUCHI } from "./tiruchi";
import type {
  ResolvedSubTierNode,
  SubTierEdge,
  SubTierNetwork,
  SubTierNode,
} from "./types";

export * from "./types";

const AUTHORED: readonly AuthoredNetwork[] = [DECCAN, SAURASHTRA, KOVAI, TIRUCHI, LUDHIANA];

const SHARED_BY_KEY: ReadonlyMap<string, NodeRow> = new Map(
  SHARED_ROWS.map((row) => [row[0], row] as const)
);

const keyOf = (entry: NodeRow | string): string => (typeof entry === "string" ? entry : entry[0]);

function fail(supplierId: string, message: string): never {
  throw new Error(`subtier: ${supplierId}: ${message}`);
}

/* A party written inline in two networks is two records that can drift apart. If it
   is really one party it belongs in `shared.ts`; if not, it needs its own key. */
AUTHORED.flatMap((network) => network.nodes.filter((e): e is NodeRow => typeof e !== "string"))
  .reduce((seen, row) => {
    if (seen.has(row[0])) throw new Error(`subtier: "${row[0]}" is authored inline twice — declare it in shared.ts`);
    if (SHARED_BY_KEY.has(row[0])) throw new Error(`subtier: "${row[0]}" shadows a shared party`);
    return new Set([...seen, row[0]]);
  }, new Set<string>());

/** How many networks each party appears in — the fact "shared" is derived from. */
const APPEARANCES: ReadonlyMap<string, number> = AUTHORED.reduce((counts, network) => {
  const next = new Map(counts);
  new Set(network.nodes.map(keyOf)).forEach((key) => next.set(key, (next.get(key) ?? 0) + 1));
  return next;
}, new Map<string, number>());

function authoredNodes(network: AuthoredNetwork): readonly SubTierNode[] {
  const seen = new Set<string>();
  return network.nodes.map((entry) => {
    const key = keyOf(entry);
    if (seen.has(key)) fail(network.supplierId, `node "${key}" is listed twice`);
    seen.add(key);
    const row = typeof entry === "string" ? SHARED_BY_KEY.get(entry) : entry;
    if (!row) fail(network.supplierId, `shared node "${key}" is not declared in shared.ts`);
    const node = expandNode(row);
    if (!Number.isFinite(node.coordinate.lon) || !Number.isFinite(node.coordinate.lat)) {
      fail(network.supplierId, `node "${key}" has no coordinate`);
    }
    return node;
  });
}

function authoredEdges(network: AuthoredNetwork, ids: ReadonlySet<string>): readonly SubTierEdge[] {
  const endpoint = (key: string): string => {
    if (key === TIER1) return network.supplierId;
    const id = nodeId(key);
    if (!ids.has(id)) fail(network.supplierId, `edge endpoint "${key}" is not a node in this network`);
    return id;
  };
  return network.edges.map(([from, to, confidence, holding, basis]) => {
    if (from === TIER1) fail(network.supplierId, "the Tier-1 cannot supply its own sub-tier");
    return {
      fromId: endpoint(from),
      toId: endpoint(to),
      confidence,
      holding,
      basis: basis ?? CONFIDENCE_MEANING[confidence],
    };
  });
}

/**
 * The edge that carries a node one step nearer the Tier-1. A direct edge wins; among
 * equals the better-evidenced one wins, because that is the relationship that put
 * the node on the map.
 */
function establishingEdge(
  id: string,
  edges: readonly SubTierEdge[],
  tierOneId: string
): SubTierEdge | undefined {
  return edges
    .filter((edge) => edge.fromId === id)
    .slice()
    .sort(
      (a, b) =>
        Number(b.toId === tierOneId) - Number(a.toId === tierOneId) ||
        CONFIDENCE_RANK[a.confidence] - CONFIDENCE_RANK[b.confidence]
    )[0];
}

/**
 * The edge that holds a trace node in the drawn chain: to the Tier-1 if it has one,
 * else to another trace node, best evidence first.
 */
export function traceEdge(
  id: string,
  trace: readonly string[],
  edges: readonly SubTierEdge[],
  tierOneId: string
): SubTierEdge | undefined {
  return establishingEdge(
    id,
    edges.filter((e) => e.toId === tierOneId || trace.includes(e.toId)),
    tierOneId
  );
}

/** Node ids from `start` to the Tier-1, following establishing edges. */
function routeToTierOne(
  start: string,
  edges: readonly SubTierEdge[],
  tierOneId: string,
  supplierId: string
): readonly string[] {
  const walk = (id: string, visited: readonly string[]): readonly string[] => {
    if (visited.includes(id)) fail(supplierId, `cycle through "${id}"`);
    const edge = establishingEdge(id, edges, tierOneId);
    if (!edge) fail(supplierId, `"${id}" does not reach the Tier-1`);
    const path = [...visited, id];
    return edge.toId === tierOneId ? path : walk(edge.toId, path);
  };
  return walk(start, []);
}

function resolve(network: AuthoredNetwork): SubTierNetwork {
  const { supplierId } = network;
  if (!SUPPLIERS.some((s) => s.id === supplierId)) fail(supplierId, "is not a supplier in the gazetteer");

  const nodes = authoredNodes(network);
  const ids = new Set(nodes.map((n) => n.id));
  const edges = authoredEdges(network, ids);

  const weakLinkId = nodeId(network.weakLink.key);
  if (!ids.has(weakLinkId)) fail(supplierId, `weak link "${network.weakLink.key}" is not a node`);

  const resolved: readonly ResolvedSubTierNode[] = nodes.map((node) => {
    // Throws if the node cannot reach the Tier-1 — an orphan is an authoring error.
    const route = routeToTierOne(node.id, edges, supplierId, supplierId);
    const edge = establishingEdge(node.id, edges, supplierId) as SubTierEdge;
    return {
      node,
      tier: route.length === 1 ? 2 : 3,
      confidence: edge.confidence,
      weakLink: node.id === weakLinkId,
      abroad: node.country !== "India",
      shared: (APPEARANCES.get(node.id.slice(3)) ?? 0) > 1,
    };
  });

  const trace = network.weakLink.trace.map(nodeId);
  if (!trace.includes(weakLinkId)) fail(supplierId, "the weak link's trace does not include it");
  trace.forEach((id) => {
    if (!ids.has(id)) fail(supplierId, `trace node "${id}" is not a node`);
    if (!traceEdge(id, trace, edges, supplierId)) {
      fail(supplierId, `trace node "${id}" has no edge to the Tier-1 or another trace node`);
    }
  });

  return {
    supplierId,
    nodes: resolved,
    edges,
    weakLink: {
      nodeId: weakLinkId,
      trace,
      mechanism: network.weakLink.mechanism,
      conditions: network.weakLink.conditions,
    },
    weakLinkRoute: routeToTierOne(weakLinkId, edges, supplierId, supplierId),
  };
}

function buildRegistry(): ReadonlyMap<string, SubTierNetwork> {
  const registry = new Map<string, SubTierNetwork>();
  AUTHORED.forEach((network) => {
    if (registry.has(network.supplierId)) fail(network.supplierId, "has two networks");
    registry.set(network.supplierId, resolve(network));
  });
  return registry;
}

/** Every mapped network, keyed by Tier-1 supplier id. */
export const SUBTIER_NETWORKS: ReadonlyMap<string, SubTierNetwork> = buildRegistry();

/** The network behind a Tier-1, or `undefined` when none is mapped — never a guess. */
export function subTierNetworkFor(supplierId: string): SubTierNetwork | undefined {
  return SUBTIER_NETWORKS.get(supplierId);
}

/** Every sub-tier party, once, by id. */
export const SUBTIER_NODES: ReadonlyMap<string, SubTierNode> = new Map(
  [...SUBTIER_NETWORKS.values()].flatMap((network) =>
    network.nodes.map((resolvedNode) => [resolvedNode.node.id, resolvedNode.node] as const)
  )
);

export interface SharedSubTier {
  readonly node: SubTierNode;
  /** The Tier-1s it sits behind, in registry order. */
  readonly supplierIds: readonly string[];
}

/** Parties behind more than one critical Tier-1 — the independence test. */
export function sharedSubTiers(): readonly SharedSubTier[] {
  return [...SUBTIER_NODES.values()]
    .map((node) => ({
      node,
      supplierIds: [...SUBTIER_NETWORKS.values()]
        .filter((network) => network.nodes.some((n) => n.node.id === node.id))
        .map((network) => network.supplierId),
    }))
    .filter((entry) => entry.supplierIds.length > 1);
}

/** The weakest evidence on a network's weak-link route. */
export function weakLinkConfidence(network: SubTierNetwork): Confidence {
  const levels = network.weakLinkRoute.map(
    (id) => (establishingEdge(id, network.edges, network.supplierId) as SubTierEdge).confidence
  );
  return levels.reduce<Confidence>(
    (worst, level) => (CONFIDENCE_RANK[level] > CONFIDENCE_RANK[worst] ? level : worst),
    "verified"
  );
}
