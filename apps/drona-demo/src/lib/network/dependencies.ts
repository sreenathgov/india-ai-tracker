/**
 * The upstream dependency chain behind a critical assembly — Scene 3's spine.
 *
 * ── Everything here is invented. ──────────────────────────────────────────────
 * Synthetic, like the rest of the network. No mill, processor, certificate or
 * qualification interval describes an actual company or commercial arrangement.
 *
 * **The point of this file is that Drona knows these things to different degrees.**
 *
 * Scene 1 knew where suppliers were. Scene 2 knew what this order needed from them.
 * Scene 3 asks what sits *behind* the supplier — and behind Tier 1, knowledge stops
 * being a record and starts being an inference. A purchase order is a fact. A steel
 * processor named on a material certificate is a reasonable reading of a document.
 * An approved mill that has never shipped against this programme is a name on a
 * list and nothing more.
 *
 * So confidence is authored **on the edge, not on the node**, and a node's state is
 * derived from the edge that establishes it (`upstreamNodes` below). That ordering
 * is the whole design: a node is only as well known as the relationship that put it
 * there. Authoring both separately would let them disagree, and the first time they
 * disagreed the map would be quietly asserting something the evidence did not say.
 *
 * This is the same discipline as `types.ts`'s "may under-show, never guess", and as
 * CLAUDE.md rule 6 — an absence must be visible as an absence. A hollow node is that
 * rule with a shape.
 */
import { DEMO_NOW } from "@/lib/demo/clock";
import { PLANT, SUPPLIERS } from "./gazetteer";
import {
  BOM_COMMITMENT_ID,
  bandedFor,
  commitmentForComponent,
  componentById,
  criticalComponents,
} from "./bom";
import type { ComponentGroup } from "./bom";
import { shiftDays } from "./programme";
import { ROLE_LABEL, subTierNetworkFor, traceEdge } from "./subtier";
import { broadRegion } from "./subtier/geography";
import type { Commitment, Coordinate, Plant, Supplier } from "./types";

/** The instant every derived date resolves from, as an ISO day. */
const TODAY = DEMO_NOW.toISOString().slice(0, 10);

import {
  CONFIDENCE_LABEL,
  CONFIDENCE_MEANING,
  CONFIDENCE_RANK,
  type Confidence,
} from "./confidence";

export { CONFIDENCE_LABEL, CONFIDENCE_MEANING, CONFIDENCE_RANK };
export type { Confidence };

/**
 * A node above Tier 1.
 *
 * Deliberately *not* a `Supplier`. A Supplier in this model is a Tier-1 party the
 * plant transacts with and holds concern state on; these are parties Drona has
 * reasoned its way to. Giving them the same type would invite them into Scene 1's
 * rollups, where they would silently inflate counts the business would not
 * recognise. They are a different kind of thing and they get a different type.
 */
export interface UpstreamNode {
  readonly id: string;
  readonly name: string;
  /** What it does, in the reviewer's words: "Steel processor", "Approved mill". */
  readonly role: string;
  readonly tier: 2 | 3;
  readonly city: string;
  readonly country: string;
  /** The shared-geography test reads this, so it is a field and not prose. */
  readonly region: string;
  readonly coordinate: Coordinate;
}

/** A dependency: `fromId` supplies `toId`. Confidence belongs here. */
export interface DependencyEdge {
  readonly fromId: string;
  readonly toId: string;
  readonly confidence: Confidence;
  /**
   * The artefact Drona is holding, in a few words — or, where there is none, the
   * absence named as plainly as a document would be.
   *
   * Authored beside `basis` rather than parsed out of it. The provenance ledger needs
   * to print *what* is held separately from *what it licenses*, and recovering the
   * first by reading the second would make a sentence's wording load-bearing.
   */
  readonly holding: string;
  /** Why Drona believes it, or — for `missing` — what it has instead of belief. */
  readonly basis: string;
}

/** An upstream node carrying the state of the edge that established it. */
export interface ResolvedNode {
  readonly node: UpstreamNode;
  readonly confidence: Confidence;
  readonly basis: string;
}

/* ── The authored upstream parties ────────────────────────────────────────────
   Real city names, invented companies — the same convention as the gazetteer, and
   the reason nothing here can be mistaken for a customer's actual supply base. */

/* Only Highland's transformer chain is still authored here. Wind Energy's five critical
   chains are drawn from the sub-tier networks (`derivedChains` below), so the party
   Scene 3 names and the party Scene 2 maps are one record, not two. */
const AUTHORED_UPSTREAM: readonly UpstreamNode[] = [
  {
    id: "u-silvassa-crgo",
    name: "Silvassa Core Steel Slitting",
    role: "Core-steel slitter",
    tier: 2,
    city: "Silvassa",
    country: "India",
    region: "Western India",
    coordinate: { lon: 73.02, lat: 20.27 },
  },
  {
    id: "u-ulsan-go-steel",
    name: "Ulsan Grain-Oriented Steel",
    role: "Approved mill",
    tier: 3,
    city: "Ulsan",
    country: "South Korea",
    region: "East Asia",
    coordinate: { lon: 129.31, lat: 35.54 },
  },
];

const TIER1 = "@tier1";

type EdgeRow = readonly [
  from: string,
  to: string,
  confidence: Confidence,
  holding: string,
  basis: string,
];

/* ── The authored dependencies ────────────────────────────────────────────────
   Keyed by the BOM assembly whose chain they describe. `toId` is either that
   assembly's Tier-1 supplier (written as `TIER1`, resolved below) or another
   upstream node, so a chain can be any depth without the table knowing about it. */

const AUTHORED_CHAIN_ROWS: Readonly<Record<string, readonly EdgeRow[]>> = {
  /* Highland Repower's one critical assembly. The chain is short and the weakness
     is not concentration but its limit case: there is only one of everything. */
  "cmp:c2-nacelle-transformer": [
    [
      "u-silvassa-crgo",
      TIER1,
      "inferred",
      "Core-lamination packing lists, two deliveries",
      "Named as the slitting route on packing lists for the core laminations in two delivered transformers. Drona has no contract between this plant and the slitter.",
    ],
    [
      "u-ulsan-go-steel",
      "u-silvassa-crgo",
      "low",
      "One coil certificate",
      "Grain-oriented coil traced to a single mill from one coil certificate. No other mill is recorded behind the slitter, for this grade or any other.",
    ],
  ],
};

/* ── Chains derived from the sub-tier networks ────────────────────────────────
   One per critical assembly on the Wind Energy order whose Tier-1 has a mapped
   network. The chain is that network's weak-link trace: the parties that bear on
   the mechanism, each held in place by the edge the network already records. */

function derivedChains(): {
  readonly nodes: readonly UpstreamNode[];
  readonly rows: Readonly<Record<string, readonly EdgeRow[]>>;
} {
  const nodes: UpstreamNode[] = [];
  const rows: Record<string, readonly EdgeRow[]> = {};
  criticalComponents(bandedFor(BOM_COMMITMENT_ID)).forEach(({ component }) => {
    const network = subTierNetworkFor(component.supplierId);
    if (!network) return;
    const { trace } = network.weakLink;
    rows[component.id] = trace.map((id) => {
      const resolved = network.nodes.find((n) => n.node.id === id)!;
      const { node } = resolved;
      if (!nodes.some((n) => n.id === id)) {
        nodes.push({
          id,
          name: node.name,
          role: ROLE_LABEL[node.role],
          tier: resolved.tier,
          city: node.city,
          country: node.country,
          region: broadRegion(node),
          coordinate: node.coordinate,
        });
      }
      const edge = traceEdge(id, trace, network.edges, network.supplierId)!;
      return [
        id,
        edge.toId === network.supplierId ? TIER1 : edge.toId,
        edge.confidence,
        edge.holding,
        edge.basis,
      ] as const;
    });
  });
  return { nodes, rows };
}

const DERIVED = derivedChains();

const CHAIN_ROWS: Readonly<Record<string, readonly EdgeRow[]>> = {
  ...DERIVED.rows,
  ...AUTHORED_CHAIN_ROWS,
};

const UPSTREAM_BY_ID = new Map(
  [...AUTHORED_UPSTREAM, ...DERIVED.nodes].map((n) => [n.id, n])
);

/** Weeks-to-qualify an alternative, per assembly. Authored; it is a procurement fact. */
const QUALIFICATION_DAYS: Readonly<Record<string, number>> = {
  "cmp:main-shaft-forging": 56,
  /* A new hub source means a new pattern, a first-article casting and its NDT. */
  "cmp:rotor-hub-casting": 98,
  "cmp:main-bearing-housing": 84,
  /* Plate from a new mill needs its own weld-procedure qualification. */
  "cmp:tower-section-set": 70,
  "cmp:tower-flange": 63,
  /* Transformer qualification includes a type test; it is the longest remedy here. */
  "cmp:c2-nacelle-transformer": 126,
};

export interface DependencyChain {
  readonly component: ComponentGroup;
  readonly plant: Plant;
  readonly supplier: Supplier;
  /** The order this chain was resolved against — carried, so nothing re-reads it. */
  readonly commitment: Commitment;
  /** Upstream of Tier 1, nearest first, each carrying its establishing confidence. */
  readonly upstream: readonly ResolvedNode[];
  readonly edges: readonly DependencyEdge[];
  /** The least-known state anywhere in the chain. What the chain is worth overall. */
  readonly weakestConfidence: Confidence;
}

/**
 * Assemble the chain for one critical assembly.
 *
 * Returns `undefined` rather than a stub when no chain is authored. Scene 3 offers
 * only what resolves, so an assembly Drona has not traced never appears as an empty
 * screen claiming to explain something.
 */
export function dependencyChain(componentId: string): DependencyChain | undefined {
  const component = componentById(componentId);
  const commitment = commitmentForComponent(componentId);
  const rows = CHAIN_ROWS[componentId];
  if (!component || !commitment || !rows) return undefined;

  const supplier = SUPPLIERS.find((s) => s.id === component.supplierId);
  if (!supplier) {
    throw new Error(`dependencies.ts: supplier ${component.supplierId} is not in the gazetteer`);
  }

  const edges: readonly DependencyEdge[] = rows.map(
    ([from, to, confidence, holding, basis]) => {
      const node = UPSTREAM_BY_ID.get(from);
      if (!node) throw new Error(`dependencies.ts: upstream ${from} is not defined`);
      return {
        fromId: from,
        toId: to === TIER1 ? supplier.id : to,
        confidence,
        holding,
        basis,
      };
    }
  );

  /* A node's state is the state of the edge that established it — never authored
     twice. Rows are already written nearest-first, so the walk preserves depth. */
  const upstream: readonly ResolvedNode[] = edges.map((edge) => ({
    node: UPSTREAM_BY_ID.get(edge.fromId)!,
    confidence: edge.confidence,
    basis: edge.basis,
  }));

  return {
    component,
    plant: PLANT,
    supplier,
    commitment,
    upstream,
    edges,
    weakestConfidence: weakest(edges.map((e) => e.confidence)),
  };
}

export function weakest(levels: readonly Confidence[]): Confidence {
  return levels.reduce<Confidence>(
    (worst, level) => (CONFIDENCE_RANK[level] > CONFIDENCE_RANK[worst] ? level : worst),
    "verified"
  );
}

/**
 * The assemblies Scene 3 can actually explain on one order — the switcher's set, in
 * band order. Scoped to the order, because the switcher must never offer a Wind Energy
 * forging from inside Highland's pathway.
 */
export function tracedComponents(
  commitmentId: string = BOM_COMMITMENT_ID
): readonly ComponentGroup[] {
  return criticalComponents(bandedFor(commitmentId))
    .map((b) => b.component)
    .filter((c) => CHAIN_ROWS[c.id] !== undefined);
}

/**
 * Whether every source behind this chain sits in one region.
 *
 * Derived, because it is the load-bearing claim of the whole scene: two approved
 * sources are a mitigation only if they can fail independently, and two names in the
 * same region are one dependency wearing two labels. Authoring "both concentrated in
 * the same geography" as a sentence would let it survive a change to the data.
 *
 * A *source* is an origin of the chain — a party nothing else in the chain feeds.
 * Not "every tier-3 node": a plate mill can sell straight to a fabricator and a
 * pig-iron furnace can sit behind a stockist, and the question is the same for both.
 */
export interface SourceConcentration {
  readonly sources: number;
  readonly regions: readonly string[];
  readonly shared: boolean;
  /** The one party every source feeds, when there is one — the processor or stockist. */
  readonly via?: string;
}

export function sourceConcentration(chain: DependencyChain): SourceConcentration {
  const origins = chain.upstream.filter(
    (u) => !chain.edges.some((edge) => edge.toId === u.node.id)
  );
  const regions = [...new Set(origins.map((u) => u.node.region))];
  const fed = [
    ...new Set(
      origins.map((u) => chain.edges.find((edge) => edge.fromId === u.node.id)?.toId)
    ),
  ];
  const via =
    fed.length === 1 ? chain.upstream.find((u) => u.node.id === fed[0])?.node.name : undefined;
  return {
    sources: origins.length,
    regions,
    shared: origins.length > 1 && regions.length === 1,
    ...(via ? { via } : {}),
  };
}

/**
 * How long there is to do anything about it, and whether the obvious remedy fits.
 *
 * The window is confirmed material coverage plus the order's programme margin: the
 * material on hand carries production until it runs out, and the margin is what is
 * left before the customer is missed. Qualifying an alternative source is the remedy
 * everyone reaches for first, so the model states plainly whether it can land inside
 * that window — for the critical assemblies it cannot, and *that* is the finding.
 */
export interface InterventionWindow {
  readonly coverageDays: number;
  readonly marginDays: number;
  readonly totalDays: number;
  /** ISO day on which confirmed material coverage is exhausted. */
  readonly coverageEndsOn: string;
  readonly qualificationDays: number;
  readonly qualificationFits: boolean;
  /** Days by which qualification overruns the window. Zero when it fits. */
  readonly shortfallDays: number;
}

export function interventionWindow(chain: DependencyChain): InterventionWindow {
  const { commitment } = chain;
  const coverageDays = chain.component.coverageDays;
  const marginDays = commitment.marginDays;
  const totalDays = coverageDays + marginDays;
  const qualificationDays = QUALIFICATION_DAYS[chain.component.id] ?? 0;

  return {
    coverageDays,
    marginDays,
    totalDays,
    coverageEndsOn: shiftDays(TODAY, coverageDays),
    qualificationDays,
    qualificationFits: qualificationDays > 0 && qualificationDays <= totalDays,
    shortfallDays: Math.max(0, qualificationDays - totalDays),
  };
}
