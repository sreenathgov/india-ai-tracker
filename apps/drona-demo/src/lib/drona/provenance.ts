/**
 * The provenance ledger — every relationship in one chain, and what Drona holds for it.
 *
 * This is the file where the demo's central claim is cashed. Everywhere else, Drona
 * *says* it distinguishes what it knows from what it inferred; here a reviewer can
 * audit that sentence by sentence, relationship by relationship, and see the documents
 * — or the absence of documents — underneath each one.
 *
 * Three rules make it an audit rather than a credentials page.
 *
 * **The contract is a row, not a preamble.** The plant's purchase order with its Tier-1
 * supplier is the only relationship in this chain that is contracted, and it is listed
 * first, in the same table, in the same shape as everything else. Without one verified
 * row on screen the weaker ones have nothing to be weaker *than*, and the grammar reads
 * as styling — the same argument `map/epistemic.ts` makes about the map.
 *
 * **Absences are rows too.** A ledger that printed only the edges Drona could support
 * would be a sales document. The `missing` edges appear in sequence, with the same
 * weight of type, and their holding says plainly that there is nothing behind them.
 *
 * **Nothing is authored twice.** Every row is read off `dependencies.ts`; the counts are
 * derived from the rows. The only prose written here belongs to the contracted row,
 * which has no edge in the model because it is the model's starting point.
 */
import {
  CONFIDENCE_LABEL,
  CONFIDENCE_MEANING,
  dependencyChain,
  type Confidence,
  type DependencyChain,
} from "@/lib/network/dependencies";

/** One relationship, with its evidence. Rendered in order, nearest the plant first. */
export interface ProvenanceRow {
  readonly id: string;
  /** The party supplying, and what it does — in the reviewer's words, not a code. */
  readonly from: string;
  readonly fromRole: string;
  /** The party supplied. Every row names both ends; a source without a subject is a list. */
  readonly to: string;
  readonly confidence: Confidence;
  /** The one-word standing, and the sentence that says what it licenses. */
  readonly label: string;
  readonly meaning: string;
  /** The artefact held — or the absence, named. */
  readonly holding: string;
  /** What that artefact does and does not establish. */
  readonly basis: string;
  /**
   * True for the single contracted relationship.
   *
   * Carried as a field rather than inferred from `confidence === "verified"`: the two
   * happen to coincide today, and the day they stop coinciding the ledger must not
   * silently promote a verified inference into a contract.
   */
  readonly contracted: boolean;
}

export interface ProvenanceLedger {
  readonly rows: readonly ProvenanceRow[];
  /** Relationships Drona holds a contract for. */
  readonly contracted: number;
  /** Relationships Drona resolved itself, at any strength. */
  readonly resolved: number;
  /** Relationships with no supporting evidence at all. The number that matters. */
  readonly unevidenced: number;
  readonly weakest: Confidence;
}

/**
 * Assemble the ledger for one traced assembly.
 *
 * `undefined` when the assembly has no chain, for the same reason `dependencyChain`
 * returns `undefined`: an empty provenance panel would claim Drona had looked and found
 * nothing, when in fact it has not looked.
 */
export function provenanceLedger(
  componentId: string
): ProvenanceLedger | undefined {
  const chain = dependencyChain(componentId);
  if (!chain) return undefined;

  const contract: ProvenanceRow = {
    id: `contract:${chain.supplier.id}`,
    from: chain.supplier.name,
    fromRole: `Tier 1 · ${chain.supplier.city}`,
    to: chain.plant.name,
    confidence: "verified",
    label: CONFIDENCE_LABEL.verified,
    meaning: CONFIDENCE_MEANING.verified,
    holding: `Purchase order ${chain.commitment.reference}`,
    basis: `${chain.plant.name} holds a purchase order with ${chain.supplier.name} against ${chain.commitment.name}. This is the one relationship in this chain that is contracted; everything above it, Drona resolved.`,
    contracted: true,
  };

  const upstream: readonly ProvenanceRow[] = chain.edges.map((edge) => ({
    id: `${edge.fromId}→${edge.toId}`,
    from: nameOf(chain, edge.fromId),
    fromRole: roleOf(chain, edge.fromId),
    to: nameOf(chain, edge.toId),
    confidence: edge.confidence,
    label: CONFIDENCE_LABEL[edge.confidence],
    meaning: CONFIDENCE_MEANING[edge.confidence],
    holding: edge.holding,
    basis: edge.basis,
    contracted: false,
  }));

  const rows = [contract, ...upstream];

  return {
    rows,
    contracted: rows.filter((row) => row.contracted).length,
    resolved: rows.filter((row) => !row.contracted && row.confidence !== "missing")
      .length,
    unevidenced: rows.filter((row) => row.confidence === "missing").length,
    weakest: chain.weakestConfidence,
  };
}

/**
 * One sentence stating what the ledger adds up to.
 *
 * Derived from the counts rather than written beside them, so it cannot describe a
 * chain the rows do not show. It deliberately ends on the absences: a summary that
 * closed on the documents held would invert the emphasis the rows are arguing for.
 */
export function ledgerSummary(ledger: ProvenanceLedger): string {
  const relationships = `${ledger.rows.length} relationships stand behind this assembly`;
  const held = `${ledger.contracted} is contracted and ${ledger.resolved} ${ledger.resolved === 1 ? "was" : "were"} resolved from documents held elsewhere`;
  const gap =
    ledger.unevidenced === 0
      ? "none is unevidenced"
      : `${ledger.unevidenced} ${ledger.unevidenced === 1 ? "rests" : "rest"} on no evidence at all`;

  return `${relationships}: ${held}, and ${gap}.`;
}

/** Names are resolved from the chain, so an id can never reach the screen. */
function nameOf(chain: DependencyChain, id: string): string {
  if (id === chain.supplier.id) return chain.supplier.name;
  if (id === chain.plant.id) return chain.plant.name;
  return chain.upstream.find((u) => u.node.id === id)?.node.name ?? id;
}

function roleOf(chain: DependencyChain, id: string): string {
  if (id === chain.supplier.id) return `Tier 1 · ${chain.supplier.city}`;
  const found = chain.upstream.find((u) => u.node.id === id);
  return found ? `Tier ${found.node.tier} · ${found.node.city}` : "Not resolved";
}
