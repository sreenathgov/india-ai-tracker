/**
 * The staged reasoning sequence: what Drona says it is doing while it assembles a
 * production commitment.
 *
 * **Two honesty constraints govern this file, and they are not decoration.**
 *
 * *It is scripted, and it must not imply a live connection.* The fiction is that
 * this manufacturer runs SAP. The wiring is not real, nothing is fetched, and the
 * copy is written so that no step claims otherwise: it says "reading the production
 * order" rather than "connected to SAP", and the surface carries a standing note
 * that the sequence is a demonstration. A progress animation that implies an
 * integration nobody has built is the most ordinary way for a demo to lie.
 *
 * *It replaces a spinner, and it should read as construction rather than theatre.*
 * Each step names a thing that would genuinely have to happen, in the order it would
 * genuinely have to happen, and the figures it quotes are the same derived figures
 * the cards then show. If the bill of materials changes, step three changes with it.
 *
 * Under `prefers-reduced-motion` the whole sequence resolves at once. An
 * accessibility preference is not a faster version of an animation.
 */
import {
  BOM_COMMITMENT_ID,
  bandedFor,
  bomCommitment,
  bomFor,
  criticalComponents,
  rollupFor,
  totalParts,
} from "@/lib/network/bom";
import { suppliersForCommitment } from "@/lib/network/gazetteer";
import { subTierNetworkFor } from "@/lib/network/subtier";

export interface AnalysisStep {
  readonly id: string;
  /** Shown while the step is running. Present participle, no terminal period. */
  readonly running: string;
  /** Shown once it has resolved. Names the result, not the activity. */
  readonly resolved: string;
  /** How long the step holds before resolving, in milliseconds. */
  readonly durationMs: number;
}

/**
 * Durations are uneven on purpose. A uniform cadence reads as a progress bar wearing
 * a costume; work that takes visibly different amounts of time reads as work. The
 * two steps that actually resolve something large — the components and the
 * dependency graph — are the two that hold longest.
 */
export function analysisSteps(
  commitmentId: string = BOM_COMMITMENT_ID
): readonly AnalysisStep[] {
  const commitment = bomCommitment(commitmentId);
  const bom = bomFor(commitmentId);
  const suppliers = suppliersForCommitment(commitment.id);
  const parts = totalParts(bom);
  const rollup = rollupFor(commitmentId);
  /* Only the order's critical Tier-1s: a mapped supplier carrying a routine part on
     another order is not traced there, and saying so would overclaim. */
  const networks = criticalComponents(bandedFor(commitmentId))
    .map(({ supplier }) => subTierNetworkFor(supplier.id))
    .filter((n) => n !== undefined);
  const subTierParties = new Set(networks.flatMap((n) => n.nodes.map((r) => r.node.id))).size;

  return [
    {
      id: "order",
      running: "Reading the production order",
      resolved: `${commitment.reference} · ${commitment.units} units`,
      durationMs: 520,
    },
    {
      id: "bom",
      running: "Retrieving the bill of materials",
      resolved: `${bom.length} assemblies on the released revision`,
      durationMs: 680,
    },
    {
      id: "components",
      running: `Resolving ${parts} required components`,
      resolved: `${parts} components resolved`,
      durationMs: 1150,
    },
    {
      id: "suppliers",
      running: "Mapping approved suppliers",
      resolved: `${suppliers.length} Tier-1 suppliers bound to this order`,
      durationMs: 760,
    },
    {
      id: "procurement",
      running: "Linking procurement commitments",
      resolved: "Coverage and lead times attached to every assembly",
      durationMs: 640,
    },
    {
      id: "geography",
      running: "Resolving geographic dependencies",
      resolved: `${new Set(suppliers.map((s) => s.country)).size} countries in the inbound path`,
      durationMs: 1080,
    },
    {
      id: "external",
      running: commitmentId === "c1" ? "Checking the published CBAM requirement against shipment context" : "Testing external conditions",
      resolved: commitmentId === "c1" ? "Regulatory applicability and importer readiness tracked separately; held case evidence retained" : "Conditions applied where a supplier is already under concern",
      durationMs: 820,
    },
    {
      id: "subtier",
      running: "Resolving sub-tier dependencies",
      resolved:
        networks.length > 0
          ? `${subTierParties} sub-tier parties behind ${networks.length} critical Tier-1s`
          : "No sub-tier network mapped for this order yet",
      durationMs: 1120,
    },
    {
      id: "exposure",
      running: "Evaluating production exposure",
      resolved: `${rollup.critical.turbines} of ${rollup.units} units carry a critical dependency`,
      durationMs: 940,
    },
  ];
}

/** Total runtime of the sequence, for anything that needs to reserve the time. */
export const analysisDurationMs = (steps: readonly AnalysisStep[]): number =>
  steps.reduce((total, step) => total + step.durationMs, 0);

/**
 * The standing disclosure that sits under the sequence.
 *
 * Present whether or not the sequence has run, and not dismissible. A reader should
 * never have to have watched an animation to learn that it was an animation.
 */
export const ANALYSIS_DISCLOSURE =
  "Demonstration sequence. This surface runs against a fixed synthetic network and is not connected to a production system.";

/**
 * What Drona says once the analysis has resolved — the paragraph that sits beside
 * the cards.
 *
 * It states the headline, then immediately states what the headline does not mean.
 * "60 of 100 clear" is the most comfortable figure on the screen and the easiest one
 * to misread, so the sentence that follows it is the one that does the work.
 */
export function analysisConclusion(
  commitmentId: string = BOM_COMMITMENT_ID
): readonly string[] {
  const rollup = rollupFor(commitmentId);
  const commitment = bomCommitment(commitmentId);
  const lead = rollup.critical;

  /* The whole order is exposed. The comfortable figure this conclusion normally
     guards against does not exist, so the sentence that does the work changes: the
     misreading to catch now is the opposite one — that a critical supplier list
     is the same thing as a critical order. */
  if (rollup.unitsClearOfCritical === 0 && lead.turbines > 0) {
    const banded = bandedFor(commitmentId);
    const concernNotRisk = banded.filter(
      (r) => r.supplier.concern === "critical" && r.band !== "critical"
    ).length;
    const [only] = banded.filter((r) => r.band === "critical");
    const what =
      lead.assemblies === 1 && only
        ? `one assembly — the ${only.component.name.toLowerCase()}, ${lead.parts} components from a single supplier`
        : `${lead.assemblies} assemblies, ${lead.parts} components from ${lead.suppliers} suppliers`;

    return [
      `Every one of the ${rollup.units} turbines depends on ${what} that this order cannot re-source in time. The exposure is narrow and it is total: no unit is clear of it, and the ${commitment.marginDays} days of programme margin are all there is to absorb it.`,
      `${concernNotRisk} other suppliers on this order are in critical concern, and none of them is a critical risk here: this order already holds their coverage past lead time. A list of troubled suppliers is not a list of troubled orders, and this order's trouble is somewhere else.`,
      `Each band is evaluated against this bill of materials, these suppliers, this coverage and this delivery date. Open the critical set and I will work through why this one component carries the whole order.`,
    ];
  }

  return [
    `${lead.turbines} of ${rollup.units} turbines depend on ${lead.parts} components from ${lead.suppliers} suppliers that this order cannot re-source in time. That is the critical set, and it is where the ${commitment.marginDays} days of programme margin will be spent.`,
    `${rollup.unitsClearOfCritical} units are clear of critical risk — but only ${rollup.unitsFullyClear} are clear of everything. The difference is ${rollup.unitsClearOfCritical - rollup.unitsFullyClear} turbines whose worst dependency is elevated, and reading the first figure as an all-clear is the mistake this screen is built to catch.`,
    `Each band is evaluated against this bill of materials, these suppliers, this coverage and this delivery date — not against the suppliers in general. Open the critical set and I will work through why a specific component is exposed.`,
  ];
}
