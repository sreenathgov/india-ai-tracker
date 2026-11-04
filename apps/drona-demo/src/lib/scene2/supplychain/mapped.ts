import { ROLE_LABEL, subTierNetworkFor } from "@/lib/network/subtier";
import type { SubTierEdge, SubTierNode } from "@/lib/network/subtier";
import type { Confidence } from "@/lib/network/confidence";
import type { AuthoredEdge, AuthoredNode, CaseGraph, EvidenceState } from "./types";

/**
 * The difference between the relevant network and everything mapped.
 *
 * A case file authors the objects this commitment's concern actually runs through.
 * Drona holds a good deal more behind the same Tier-1 — the gas contract, the
 * abrasives distributor, the calibration house — and a reader is entitled to ask
 * what else is back there. That is the "All mapped" view, and the answer is drawn
 * from the sub-tier records already in the app rather than authored a second time,
 * so the two surfaces cannot come to disagree about who supplies whom.
 *
 * Everything this adds is marked `context: true`: background Drona holds, not a
 * finding about this order. Context objects are never in concern, which is what
 * keeps the critical path unchanged when the view widens.
 *
 * Every party it adds is a **supplier**, whatever it sells. A sub-tier role says
 * what a firm supplies, not what kind of object it is: "Katni Refractories" is a
 * company, and typing it as a material would put a commodity's name on a card that
 * means a counterparty. What that firm supplies is its second line.
 */

/** The sub-tier model has four confidence levels; the graph draws three shapes. */
const EVIDENCE_OF_CONFIDENCE: Readonly<Record<Confidence, EvidenceState>> = {
  verified: "verified",
  inferred: "inferred",
  low: "inferred",
  missing: "unresolved",
};

const SOURCING_FACT: Readonly<Record<SubTierNode["sourcing"], string>> = {
  sole: "Single source on record",
  dual: "Two sources on record",
  multi: "Several sources on record",
};

const contextKey = (nodeId: string): string => `ctx-${nodeId.replace(/^st:/, "")}`;

const place = (node: SubTierNode): string =>
  node.country === "India" ? `${node.city}, ${node.region}` : `${node.city}, ${node.country}`;

const contextNode = (node: SubTierNode, confidence: Confidence): AuthoredNode => ({
  key: contextKey(node.id),
  type: "supplier",
  name: node.name,
  detail: node.sources,
  place: place(node),
  evidence: EVIDENCE_OF_CONFIDENCE[confidence],
  concern: "normal",
  facts: [
    { label: "Supplies", value: node.sources },
    { label: "Role", value: ROLE_LABEL[node.role] },
    { label: "Sourcing", value: SOURCING_FACT[node.sourcing] },
    { label: "Relevance", value: "Mapped behind this supplier; not on this commitment's path" },
  ],
  subTierNodeId: node.id,
  context: true,
});

/**
 * Widen a case graph with the rest of what Drona holds behind its Tier-1.
 *
 * Parties the case already names are skipped, matched on `subTierNodeId`, so a
 * dependency that matters keeps its authored concern, facts and provenance instead
 * of being duplicated as background. A party that sits behind another party keeps
 * that shape where the party it supplies came through too, and otherwise attaches
 * to the Tier-1 — a node with no line back to the order would explain nothing.
 */
export function withMappedContext(source: CaseGraph): CaseGraph {
  const network = subTierNetworkFor(source.supplierId);
  if (!network) return source;

  /* The Tier-1 is the supplier the order reaches through its component. */
  const tierOne = source.nodes.find((node) => node.type === "supplier" && node.subTierNodeId === undefined);
  if (!tierOne) return source;

  /** Sub-tier record → the case's own node for it, where the case names one. */
  const authored = new Map(
    source.nodes
      .filter((node) => node.subTierNodeId !== undefined)
      .map((node) => [node.subTierNodeId!, node.key] as const),
  );

  const added = new Map<string, AuthoredNode>();
  for (const resolved of network.nodes) {
    if (authored.has(resolved.node.id)) continue;
    added.set(resolved.node.id, contextNode(resolved.node, resolved.confidence));
  }
  if (added.size === 0) return source;

  /**
   * Who each new party hangs from.
   *
   * A sub-tier edge reads `fromId` supplies `toId`, which is this graph's direction
   * reversed: the party being supplied is the dependent, so it is the parent here.
   * Where that party is one the case already names, the new node joins the authored
   * branch rather than being re-parented to the Tier-1, which is what keeps the
   * widened view agreeing with the sub-tier table about who supplies whom.
   */
  const parentEdge = new Map<string, SubTierEdge>();
  for (const edge of network.edges) {
    if (added.has(edge.fromId)) parentEdge.set(edge.fromId, edge);
  }

  const parentKey = (edge: SubTierEdge | undefined): string => {
    if (!edge) return tierOne.key;
    if (added.has(edge.toId)) return contextKey(edge.toId);
    return authored.get(edge.toId) ?? tierOne.key;
  };

  const edges: AuthoredEdge[] = [];
  for (const [nodeId, node] of added) {
    const edge = parentEdge.get(nodeId);
    edges.push({
      from: parentKey(edge),
      to: node.key,
      relation: "depends-on",
      evidence: edge ? EVIDENCE_OF_CONFIDENCE[edge.confidence] : node.evidence,
      concern: "normal",
      /* `holding` is what the sub-tier record rests the relationship on. */
      basis: edge?.holding || "Held behind this supplier in Drona's sub-tier records",
    });
  }

  return {
    ...source,
    nodes: [...source.nodes, ...added.values()],
    edges: [...source.edges, ...edges],
  };
}
