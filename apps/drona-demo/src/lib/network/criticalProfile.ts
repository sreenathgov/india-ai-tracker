/**
 * What the production view says about one critical Tier-1: the component, the kind
 * of risk, why, how urgent, how far it reaches, and how well Drona knows it.
 *
 * Synthetic, like the rest of `network/`.
 *
 * **Every label here is a one-sentence rule over records, and never a blend.**
 * Urgency and reach are categorical, and each carries the facts that produced it, so
 * a reviewer who disagrees can see which figure to argue with. There is no number
 * that combines them — the same discipline as `rollups.ts` and `pathway.ts`. The
 * risk model that would weigh signals against each other is not built yet; a
 * severity invented here would be read as one that had been measured.
 *
 * The rules:
 *
 * - **Urgency** bands the intervention window (confirmed coverage + programme
 *   margin): inside 30 days, inside six weeks, or beyond. It is *not* derived from
 *   whether qualifying an alternative fits — on this order it never does, so that
 *   rule would say the same thing five times. Whether it fits is shown beside it.
 * - **Reach** asks where the weak link's failure goes. If the weak party also sits
 *   behind another critical Tier-1, it *spreads across suppliers*. Otherwise, if it
 *   is this supplier's sole source for that input, it *stops this supplier*.
 *   Otherwise it *slows* it.
 * - **Confidence** is the weakest evidence on the traced chain.
 * - **Risk type** is the weak link's first signal, plus the other kinds found on
 *   the traced chain.
 */
import type { Confidence } from "./confidence";
import { bandedFor, criticalComponents, unitsExposed, type ComponentGroup } from "./bom";
import { dependencyChain, interventionWindow } from "./dependencies";
import { SUPPLIERS } from "./gazetteer";
import { weeks } from "./pathway";
import {
  sharedSubTiers,
  subTierNetworkFor,
  type RiskKind,
  type ResolvedSubTierNode,
} from "./subtier";
import type { Commitment, Supplier } from "./types";

export type UrgencyBand = "immediate" | "near" | "planned";

export const URGENCY_LABEL: Readonly<Record<UrgencyBand, string>> = {
  immediate: "Inside 30 days",
  near: "Inside six weeks",
  planned: "Beyond six weeks",
};

/* A month is read as 31 days so a 30-day window plus a day of rounding is still
   "inside 30 days" to the person reading it; six weeks is exact. */
const IMMEDIATE_MAX_DAYS = 31;
const NEAR_MAX_DAYS = 42;

const URGENCY_RANK: Readonly<Record<UrgencyBand, number>> = { immediate: 0, near: 1, planned: 2 };

export type ThreatReach = "spreads" | "stops" | "slows";

export const THREAT_LABEL: Readonly<Record<ThreatReach, string>> = {
  spreads: "Spreads across suppliers",
  stops: "Stops this supplier",
  slows: "Slows this supplier",
};

const THREAT_RANK: Readonly<Record<ThreatReach, number>> = { spreads: 0, stops: 1, slows: 2 };

const SOURCING_FACT = {
  sole: "is the sole source for its input",
  dual: "is one of two sources for its input",
  multi: "is one of several sources for its input",
} as const;

export interface Urgency {
  readonly band: UrgencyBand;
  readonly label: string;
  readonly rank: number;
  readonly windowDays: number;
  readonly qualificationFits: boolean;
  readonly facts: readonly string[];
}

export interface Threat {
  readonly reach: ThreatReach;
  readonly label: string;
  readonly rank: number;
  /** The other critical Tier-1s the weak party also sits behind, by name. */
  readonly sharedWith: readonly string[];
  readonly facts: readonly string[];
}

export interface CriticalProfile {
  readonly commitment: Commitment;
  readonly supplier: Supplier;
  readonly component: ComponentGroup;
  readonly unitsExposed: number;
  readonly weakLink: ResolvedSubTierNode;
  readonly riskType: { readonly primary: RiskKind; readonly contributing: readonly RiskKind[] };
  readonly why: { readonly mechanism: string; readonly conditions: readonly string[] };
  readonly urgency: Urgency;
  readonly threat: Threat;
  readonly confidence: Confidence;
}

function urgencyBand(windowDays: number): UrgencyBand {
  if (windowDays <= IMMEDIATE_MAX_DAYS) return "immediate";
  if (windowDays <= NEAR_MAX_DAYS) return "near";
  return "planned";
}

const supplierName = (id: string): string => SUPPLIERS.find((s) => s.id === id)?.name ?? id;

function profileFor(commitment: Commitment, component: ComponentGroup, supplier: Supplier): CriticalProfile | undefined {
  const network = subTierNetworkFor(supplier.id);
  const chain = dependencyChain(component.id);
  if (!network || !chain) return undefined;

  const weak = network.nodes.find((n) => n.weakLink)!;
  const trace = network.weakLink.trace.map((id) => network.nodes.find((n) => n.node.id === id)!);
  const window = interventionWindow(chain);
  const units = unitsExposed(component);

  const primary = weak.node.signals[0]!.kind;
  const contributing = [
    ...new Set(trace.flatMap((n) => n.node.signals.map((s) => s.kind))),
  ].filter((kind) => kind !== primary);

  const band = urgencyBand(window.totalDays);
  const urgency: Urgency = {
    band,
    label: URGENCY_LABEL[band],
    rank: URGENCY_RANK[band],
    windowDays: window.totalDays,
    qualificationFits: window.qualificationFits,
    facts: [
      `${window.totalDays}-day window: ${window.coverageDays} days of confirmed coverage and ${window.marginDays} of margin`,
      window.qualificationFits
        ? `Qualifying an alternative, about ${weeks(window.qualificationDays)} weeks, fits inside it`
        : `Qualifying an alternative takes about ${weeks(window.qualificationDays)} weeks, ${window.shortfallDays} days longer than the window`,
    ],
  };

  const sharedWith = (sharedSubTiers().find((s) => s.node.id === weak.node.id)?.supplierIds ?? [])
    .filter((id) => id !== supplier.id)
    .map(supplierName);
  const reach: ThreatReach = sharedWith.length > 0 ? "spreads" : weak.node.sourcing === "sole" ? "stops" : "slows";
  const threat: Threat = {
    reach,
    label: THREAT_LABEL[reach],
    rank: THREAT_RANK[reach],
    sharedWith,
    facts: [
      `${units} of ${commitment.units} turbines`,
      `${weak.node.name} ${SOURCING_FACT[weak.node.sourcing]}`,
      ...(sharedWith.length > 0 ? [`Also behind ${sharedWith.join(" and ")}`] : []),
    ],
  };

  return {
    commitment,
    supplier,
    component,
    unitsExposed: units,
    weakLink: weak,
    riskType: { primary, contributing },
    why: { mechanism: network.weakLink.mechanism, conditions: network.weakLink.conditions },
    urgency,
    threat,
    confidence: chain.weakestConfidence,
  };
}

/**
 * One profile per critical assembly whose Tier-1 has a mapped network, most urgent
 * first and, within a band, furthest-reaching first. An order with no mapped
 * network returns an empty list; the view says so rather than guessing.
 */
export function criticalProfiles(commitmentId: string): readonly CriticalProfile[] {
  return criticalComponents(bandedFor(commitmentId))
    .map(({ component, supplier }) => {
      const chain = dependencyChain(component.id);
      return chain ? profileFor(chain.commitment, component, supplier) : undefined;
    })
    .filter((p): p is CriticalProfile => p !== undefined)
    .slice()
    .sort((a, b) => a.urgency.rank - b.urgency.rank || a.threat.rank - b.threat.rank);
}

export function criticalProfile(commitmentId: string, supplierId: string): CriticalProfile | undefined {
  return criticalProfiles(commitmentId).find((p) => p.supplier.id === supplierId);
}
