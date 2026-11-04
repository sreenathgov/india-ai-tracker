/**
 * What Drona says in the production view's column — the order across its five
 * critical Tier-1s, and then the one the reviewer has selected.
 *
 * Every sentence declares its standing, as in `exposure.ts`: `known` is on the
 * order's own records, `inferred` is Drona's resolution of the sub-tier network,
 * `unknown` is a stated absence, and `next` is evidence to verify. Actions are
 * written as verification — confirm, verify, request a record — and never name a
 * third party the reviewer should turn to instead. That is the reviewer's decision.
 *
 * Every figure is read from `criticalProfile.ts`; nothing here is authored twice.
 */
import { CONFIDENCE_MEANING, CONFIDENCE_RANK } from "@/lib/network/confidence";
import { criticalProfiles, type CriticalProfile } from "@/lib/network/criticalProfile";
import { subTierNetworkFor } from "@/lib/network/subtier";
import type { Statement } from "./exposure";

export interface ProductionBriefing {
  readonly whyFlagged: readonly Statement[];
}

export interface SupplierBriefing {
  readonly whatMattersNow: readonly Statement[];
  readonly suggestedActions: readonly Statement[];
}

const NUMBER_WORD = ["No", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];

const count = (n: number): string => NUMBER_WORD[n] ?? String(n);
const ofTotal = (n: number): string => count(n).toLowerCase();

/* Lower-case a noun phrase for mid-sentence use, leaving grade codes like S355NL alone. */
const midSentence = (phrase: string): string =>
  /^[A-Z][a-z]/.test(phrase) ? phrase[0]!.toLowerCase() + phrase.slice(1) : phrase;

/** "a", "a and b", "a, b and c". */
function listOf(items: readonly string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

const isUncorroborated = (p: CriticalProfile): boolean =>
  CONFIDENCE_RANK[p.confidence] >= CONFIDENCE_RANK.low;

/**
 * Order-level: how many critical Tier-1s, how many of their weak links are not
 * independent, the tightest window, and how much of it Drona could not corroborate.
 * An order with no mapped network says so instead of returning silence.
 */
export function productionBriefing(commitmentId: string): ProductionBriefing {
  const profiles = criticalProfiles(commitmentId);
  if (profiles.length === 0) {
    return {
      whyFlagged: [
        {
          standing: "unknown",
          text: "No sub-tier network is mapped behind this order's critical suppliers yet, so Drona cannot say where their inputs come from.",
        },
      ],
    };
  }

  const spreading = profiles.filter((p) => p.threat.reach === "spreads");
  const tightest = profiles.reduce((a, b) => (b.urgency.windowDays < a.urgency.windowDays ? b : a));
  const uncorroborated = profiles.filter(isUncorroborated);

  return {
    whyFlagged: [
      {
        standing: "known",
        text: `${count(profiles.length)} assemblies on this order are in critical risk, each behind a different Tier-1.`,
      },
      {
        standing: "known",
        text: `The tightest window is ${tightest.urgency.windowDays} days, on ${tightest.component.name} from ${tightest.supplier.name}.`,
      },
      ...(spreading.length > 0
        ? [
            {
              standing: "inferred" as const,
              text: `${count(spreading.length)} of the ${ofTotal(profiles.length)} weak ${spreading.length === 1 ? "link sits" : "links sit"} behind more than one of these Tier-1s: ${listOf(
                spreading.map((p) => p.weakLink.node.name)
              )}. Suppliers that share one constrained party are not independent capacity.`,
            },
          ]
        : []),
      ...(uncorroborated.length > 0
        ? [
            {
              standing: "unknown" as const,
              text: `${count(uncorroborated.length)} of the ${ofTotal(profiles.length)} traced chains rest on a link Drona could not corroborate.`,
            },
          ]
        : []),
    ],
  };
}

/** The first trace node whose evidence is below "inferred", nearest the weak link. */
function weakestEvidence(profile: CriticalProfile) {
  const network = subTierNetworkFor(profile.supplier.id);
  if (!network) return undefined;
  return network.weakLink.trace
    .map((id) => network.nodes.find((n) => n.node.id === id))
    .filter((n) => n !== undefined)
    .filter((n) => CONFIDENCE_RANK[n.confidence] >= CONFIDENCE_RANK.low)
    .sort((a, b) => CONFIDENCE_RANK[b.confidence] - CONFIDENCE_RANK[a.confidence])[0];
}

function reachAction(profile: CriticalProfile): Statement {
  const { supplier, weakLink, threat } = profile;
  if (threat.reach === "spreads") {
    return {
      standing: "next",
      text: `Verify whether ${weakLink.node.name} is independent capacity for ${supplier.name} and ${listOf(
        threat.sharedWith
      )}, or one allocation both orders draw on.`,
    };
  }
  return {
    standing: "next",
    text: `Verify whether ${supplier.name} holds an approved second source for ${midSentence(weakLink.node.sources)}.`,
  };
}

/** The selected Tier-1: what the reviewer needs now, and what to verify next. */
export function supplierBriefing(profile: CriticalProfile): SupplierBriefing {
  const { supplier, component, weakLink, urgency, commitment } = profile;
  const gap = weakestEvidence(profile);

  return {
    whatMattersNow: [
      {
        standing: "known",
        text: `${profile.unitsExposed} of ${commitment.units} turbines need the ${component.name} from ${supplier.name}.`,
      },
      { standing: "known", text: `${urgency.facts.join(". ")}.` },
      {
        standing: "inferred",
        text: `The weak link is ${weakLink.node.name}, ${weakLink.node.city}. ${profile.why.mechanism}`,
      },
      ...(gap
        ? [
            {
              standing: "unknown" as const,
              text: `${gap.node.name}: ${CONFIDENCE_MEANING[gap.confidence]}`,
            },
          ]
        : []),
    ],
    suggestedActions: [
      {
        standing: "next",
        text: `Confirm with ${supplier.name} which source is feeding this order's ${component.name}.`,
      },
      reachAction(profile),
      ...(gap
        ? [
            {
              standing: "next" as const,
              text:
                gap.node.channel === "service"
                  ? `Request a record showing ${gap.node.name} has carried out work on this order.`
                  : `Request a dispatch or test record showing ${gap.node.name} has supplied against this order.`,
            },
          ]
        : []),
    ],
  };
}
