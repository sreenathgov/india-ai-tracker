/**
 * What Drona says about one exposure — and, for every sentence, how it knows.
 *
 * The sketch's requirement is blunt: Drona must distinguish **known · inferred ·
 * unknown · recommended next evidence**, "rather than treating machine inference as
 * truth". The only way to honour that without relying on someone remembering to write
 * carefully is to make standing a **field on the statement**, so a sentence physically
 * cannot reach the screen without declaring where it came from. Prose alone would not
 * survive the first edit.
 *
 * Every figure is derived from `dependencies.ts` and `pathway.ts`. Where the model
 * disagrees with the sketch's illustrative numbers, the model wins — the sketch guesses
 * a six-week intervention window; the data gives a shorter one, and printing the
 * sketch's figure would be exactly the kind of caption-beside-the-model that the rest
 * of this codebase refuses.
 *
 * Nothing here reaches the network. Free text gets an honest refusal elsewhere; these
 * are authored answers to authored questions, with derived figures inside them.
 */
import {
  dependencyChain,
  interventionWindow,
  sourceConcentration,
  type DependencyChain,
} from "@/lib/network/dependencies";
import {
  componentSummary,
  contributingConditions,
  formatDay,
  weakLink,
  weeks,
} from "@/lib/network/pathway";
import type { DronaAnswer } from "./script";

/**
 * Where a statement stands.
 *
 * `known` is documented in the order. `inferred` is Drona's own resolution from
 * outside it. `unknown` is a stated absence — the hardest kind of sentence for a
 * system to volunteer and the most valuable. `next` is not a finding at all; it is
 * what would move a sentence from one of the first three categories to another.
 */
export type Standing = "known" | "inferred" | "unknown" | "next";

export interface Statement {
  readonly standing: Standing;
  readonly text: string;
}

export const STANDING_LABEL: Readonly<Record<Standing, string>> = {
  known: "Known",
  inferred: "Inferred",
  unknown: "Unknown",
  next: "Next evidence",
};

export interface ExposureBriefing {
  /** The three sentences, in the sketch's order and with the model's figures. */
  readonly whyFlagged: readonly Statement[];
  readonly whatMattersNow: readonly Statement[];
  readonly whatIWouldVerifyNext: readonly Statement[];
}

const region = (chain: DependencyChain): string => {
  const concentration = sourceConcentration(chain);
  return concentration.regions[0] ?? "a region Drona has not resolved";
};

export function exposureBriefing(
  componentId: string
): ExposureBriefing | undefined {
  const chain = dependencyChain(componentId);
  const link = weakLink(componentId);
  if (!chain || !link) return undefined;

  const summary = componentSummary(chain);
  const window = interventionWindow(chain);
  const concentration = sourceConcentration(chain);
  const single = chain.component.approvedSources === 1;

  const whyFlagged: Statement[] = [
    {
      /* The upstream picture is Drona's own resolution, not the order's. Marking this
         `known` would be the precise failure the epistemic grammar exists to catch. */
      standing: "inferred",
      text: single
        ? `The ${summary.name.toLowerCase()} route depends on one approved source, and Drona can identify only ${concentration.sources === 1 ? "one source" : `${concentration.sources} sources`} behind it.`
        : concentration.shared
        ? `The ${summary.name.toLowerCase()} route depends on ${chain.component.approvedSources} approved sources whose identified sources all sit in ${region(chain)}${concentration.via ? `, behind ${concentration.via}` : ""}.`
        : `The ${summary.name.toLowerCase()} route depends on ${chain.component.approvedSources} approved sources, and Drona can identify ${concentration.sources === 1 ? "only one source" : `${concentration.sources} sources`} behind them.`,
    },
    {
      standing: "known",
      text: `Confirmed material coverage runs ${window.coverageDays} days, to ${formatDay(window.coverageEndsOn)}, against a required delivery of ${formatDay(summary.requiredBy)} with ${window.marginDays} days of programme margin.`,
    },
    {
      standing: "unknown",
      text: single
        ? `Whether any other maker could carry this programme is not established, because none is qualified. Qualifying one takes about ${weeks(window.qualificationDays)} weeks, which is ${window.shortfallDays} days more than the window allows, so it cannot be tested as a response to this exposure.`
        : `Whether the second approved source could carry this programme is not established. Qualifying it takes about ${weeks(window.qualificationDays)} weeks, which is ${window.shortfallDays} days more than the window allows, so it cannot be tested as a response to this exposure.`,
    },
  ];

  const whatMattersNow: Statement[] = [
    {
      standing: "known",
      text: `${summary.unitsExposed} of ${summary.totalUnits} turbines are exposed — serials ${chain.component.turbines.from} to ${chain.component.turbines.to}.`,
    },
    {
      standing: "known",
      text: `The intervention window is ${window.totalDays < 14 ? `${window.totalDays} days` : `about ${weeks(window.totalDays)} weeks`}: ${window.coverageDays} days of coverage plus ${window.marginDays} days of margin.`,
    },
  ];

  /* Each of these is a check a person performs, written so that performing it changes
     a standing above. "Recommended next evidence" is only meaningful if the reviewer
     can see which sentence it would move. */
  const whatIWouldVerifyNext: Statement[] = [
    {
      standing: "next",
      text: `Confirm allocated material against this purchase order — that would replace the coverage figure with a quantity rather than a duration.`,
    },
    {
      standing: "next",
      text: single
        ? `Verify whether the party behind this supplier draws on any source other than the one recorded. If it does not, the single source runs two tiers deep rather than one.`
        : `Verify whether the second approved source is operationally independent of the first. If it shares the same upstream source, the approved-vendor list is recording redundancy that does not exist.`,
    },
    {
      standing: "next",
      text: `Check whether an already-qualified substitute exists elsewhere in the supplier base. A source qualified for another programme would not need the ${weeks(window.qualificationDays)} weeks this one does.`,
    },
  ];

  return { whyFlagged, whatMattersNow, whatIWouldVerifyNext };
}

/**
 * A prompt, and the shape of its answer.
 *
 * Three of the four are spoken: Drona says something, at a reading cadence. The fourth
 * is not, and the type says so rather than leaving a component to recognise an id.
 *
 * `Show the evidence.` is the one that matters most, and prose is the wrong form for
 * it. A paragraph can be skimmed past its qualifications; a ledger cannot, because
 * every relationship occupies a row whether or not Drona has anything to put in it.
 * So this prompt opens `provenance.ts` instead of speaking — the provenance principle
 * made literal rather than described.
 */
export type ExposurePrompt =
  | (DronaAnswer & { readonly kind: "spoken" })
  | { readonly kind: "ledger"; readonly id: string; readonly prompt: string };

export function exposurePrompts(componentId: string): readonly ExposurePrompt[] {
  const chain = dependencyChain(componentId);
  const link = weakLink(componentId);
  if (!chain || !link) return [];

  const summary = componentSummary(chain);
  const window = interventionWindow(chain);
  const concentration = sourceConcentration(chain);
  const conditions = contributingConditions(componentId);
  const single = chain.component.approvedSources === 1;
  const whole = summary.unitsExposed === summary.totalUnits;

  return [
    whole
      ? {
          kind: "spoken",
          id: "why-units",
          prompt: "Why does this affect every turbine?",
          paragraphs: [
            `Because this assembly is not bound to a serial range. All ${summary.totalUnits} units take it, from the same approved source, so one dependency reaches the whole order.`,
            `That is a different shape from an exposure spread across many assemblies. Nothing here is partly affected: either this route delivers, or no unit in the order ships complete.`,
          ],
        }
      : {
      kind: "spoken",
      id: "why-units",
      prompt: `Why does this affect only ${summary.unitsExposed} turbines?`,
      paragraphs: [
        `Because the dependency is bound to a serial range, not to the order. This assembly is fitted to turbines ${chain.component.turbines.from} through ${chain.component.turbines.to} — ${summary.unitsExposed} units of ${summary.totalUnits}.`,
        `The remaining ${summary.totalUnits - summary.unitsExposed} turbines draw the same assembly from stock already released, or from a revision that does not route through this supplier. They are not exposed to this particular dependency. They may be exposed to others.`,
      ],
    },
    { kind: "ledger", id: "evidence", prompt: "Show the evidence." },
    {
      kind: "spoken",
      id: "remove-flag",
      prompt: "What would remove this flag?",
      paragraphs: [
        single
          ? `Two things, and only the second is quick. Establishing a second qualified source — or, short of that, a second source behind the one recorded — would remove the single-source condition itself.`
          : concentration.shared
          ? `Two things, and only the second is quick. Establishing that the approved sources are genuinely independent — different upstream, different region — would remove the concentration entirely.`
          : `Two things, and only the second is quick. Identifying a second source behind this route, and establishing that it is independent of the first, would remove the concentration entirely.`,
        `Confirming allocated material against this purchase order would replace ${window.coverageDays} days of assumed coverage with a committed quantity. That does not reduce the dependency; it narrows what I am uncertain about, which is what the ${window.marginDays} days of margin are actually for.`,
        `Qualifying an alternative source would remove it permanently, but at about ${weeks(window.qualificationDays)} weeks it is a decision for the next programme, not this one.`,
      ],
    },
    {
      kind: "spoken",
      id: "action",
      prompt: "What action is still possible?",
      paragraphs: [
        `Inside ${window.totalDays} days: confirm the allocation, ask the supplier which source is feeding this order, and ask whether the ${link.stage.name.toLowerCase()} slot can be pulled forward against confirmed material rather than planned material.`,
        `Outside it: ${conditions.some((c) => c.id === "timing") ? "qualification, which does not fit this window and should be started against the next programme instead." : "a second source, started ahead of an exposure rather than in response to one."}`,
        `I would not present this as resolved by any of those. The dependency remains; what changes is how much of it is documented rather than inferred.`,
      ],
    },
  ];
}
