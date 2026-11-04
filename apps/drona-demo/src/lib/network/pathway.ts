/**
 * The production pathway, the weak link in it, and the conditions that make it one.
 *
 * Synthetic, like everything else in `network/`. No stage duration, coverage figure
 * or qualification interval describes an actual manufacturing programme.
 *
 * **This file is the argument against a score.**
 *
 * A number says *how bad*. It cannot say *through what*. The sketch's requirement is
 * that a reviewer reads four things off the screen in order — **dependency →
 * mechanism → transmission → production consequence** — and that ordering is the
 * reason there is no composite figure anywhere in Scene 3. The pathway is the
 * transmission: it shows where in six stages the trouble actually enters, and it is
 * the stage *before* the one that hurts, which is exactly the fact a percentage
 * destroys.
 *
 * So the weak link is **derived** (`weakLink()` picks the stage by the model's own
 * `entersAt` binding) and each contributing condition states the figures it rests on
 * rather than asserting a judgement. A reviewer who disagrees with a condition can
 * see which number to argue with. That is the whole difference between an
 * explanation and a verdict (`CLAUDE.md` rule 9 — never an unexplained machine
 * verdict).
 */
import {
  dependencyChain,
  interventionWindow,
  sourceConcentration,
  type DependencyChain,
} from "./dependencies";
import { unitsExposed } from "./bom";

/**
 * What Drona can say about a stage.
 *
 * `clear` is not "safe" — it is "nothing observed here". `exposed` marks the stage
 * the dependency enters at, `downstream` every stage that inherits it. The
 * distinction matters: forging is not itself in trouble, it is *fed* by trouble, and
 * a surface that painted both the same colour would send someone to audit the wrong
 * shop floor.
 */
export type StageStatus = "clear" | "exposed" | "downstream";

export interface PathwayStage {
  readonly id: string;
  readonly name: string;
  readonly status: StageStatus;
  /** One line on why it carries that status. Rendered on demand, never as a tooltip only. */
  readonly note: string;
}

interface StageSpec {
  readonly id: string;
  readonly name: string;
}

/** The six stages of a forged assembly, in production order. Names are fixed by the sketch. */
const FORGED_STAGES: readonly StageSpec[] = [
  { id: "allocation", name: "Steel allocation" },
  { id: "forging", name: "Forging" },
  { id: "heat-treatment", name: "Heat treatment" },
  { id: "machining", name: "Machining" },
  { id: "inspection", name: "Inspection" },
  { id: "delivery", name: "Delivery" },
];

/* A casting is not forged, and a tower section is not either. Borrowing the
   forging's six stages would put "Forging" on a foundry floor, so each spec may name
   its own route. Six stages each, so every pathway reads at the same rhythm. */
const CAST_STAGES: readonly StageSpec[] = [
  { id: "charge", name: "Charge make-up" },
  { id: "melt", name: "Melt & nodularise" },
  { id: "pour", name: "Moulding & pour" },
  { id: "heat-treatment", name: "Heat treatment" },
  { id: "inspection", name: "NDT inspection" },
  { id: "delivery", name: "Machining & delivery" },
];

const FABRICATED_STAGES: readonly StageSpec[] = [
  { id: "allocation", name: "Plate allocation" },
  { id: "cut-roll", name: "Cut & roll" },
  { id: "welding", name: "Welding" },
  { id: "inspection", name: "NDT inspection" },
  { id: "coating", name: "Coating" },
  { id: "delivery", name: "Delivery" },
];

const TRANSFORMER_STAGES: readonly StageSpec[] = [
  { id: "allocation", name: "Core steel allocation" },
  { id: "core-cutting", name: "Core cutting" },
  { id: "winding", name: "Winding" },
  { id: "drying", name: "Drying & impregnation" },
  { id: "testing", name: "Testing" },
  { id: "delivery", name: "Delivery" },
];

/** Where the dependency enters the pathway, per assembly, plus its title and reading. */
interface WeakLinkSpec {
  readonly entersAt: string;
  readonly title: string;
  readonly mechanism: string;
  /** The production route, when it is not the forged default. */
  readonly stages?: readonly StageSpec[];
}

const WEAK_LINKS: Readonly<Record<string, WeakLinkSpec>> = {
  "cmp:main-shaft-forging": {
    entersAt: "allocation",
    title: "Raw-material dependency",
    mechanism:
      "The forging cannot start until steel of the specified grade is allocated to this order. Everything downstream inherits that date; nothing downstream can recover it.",
  },
  "cmp:rotor-hub-casting": {
    entersAt: "melt",
    title: "Alloy dependency",
    mechanism:
      "Ductile iron is made ductile at the ladle, by a magnesium alloy added just before the pour. Without the qualified nodulariser the melt cannot be treated, and a hub poured from untreated iron is scrap — so every stage after the melt waits on one alloy.",
    stages: CAST_STAGES,
  },
  "cmp:main-bearing-housing": {
    entersAt: "charge",
    title: "Raw-material dependency",
    mechanism:
      "The housing is poured from a charge built on low-residual pig iron, and the foundry buys that iron through one stockist rather than from the furnace. If the stockist cannot fill the grade, the charge is not made up and the single melt line stands.",
    stages: CAST_STAGES,
  },
  "cmp:tower-section-set": {
    entersAt: "allocation",
    title: "Raw-material dependency",
    mechanism:
      "Thick sections are rolled from heavy plate that one domestic mill makes in this grade. Plate must be allocated to this order before a single can is cut; the import route behind the stockist is the only other path, and it is under trade review.",
    stages: FABRICATED_STAGES,
  },
  "cmp:tower-flange": {
    entersAt: "inspection",
    title: "Process dependency",
    mechanism:
      "A flange is not releasable until its ultrasonic inspection is signed. The forger buys that inspection from one outside service whose accreditation has lapsed — so finished rings can queue at the last stage, with every day before it already spent.",
  },
  "cmp:c2-nacelle-transformer": {
    entersAt: "allocation",
    title: "Single-source dependency",
    mechanism:
      "The transformer core is stacked from grain-oriented steel that one mill supplies to one slitter. Until that coil is allocated to this order, the core cannot be cut, and every stage behind it waits on the same date.",
    stages: TRANSFORMER_STAGES,
  },
};

export interface WeakLink {
  readonly title: string;
  readonly stage: PathwayStage;
  readonly mechanism: string;
  /** The four supporting facts, each already carrying its own figure. */
  readonly facts: readonly string[];
}

/**
 * The pathway for one assembly, with each stage's status derived from where the
 * dependency enters. Returns an empty list for an assembly Drona has not traced —
 * the caller renders nothing rather than six confident green ticks.
 */
export function productionPathway(componentId: string): readonly PathwayStage[] {
  const spec = WEAK_LINKS[componentId];
  if (!spec) return [];

  const stages = spec.stages ?? FORGED_STAGES;
  const entersIndex = stages.findIndex((s) => s.id === spec.entersAt);

  return stages.map((stage, index) => {
    if (index < entersIndex) {
      return { ...stage, status: "clear" as const, note: "No dependency observed at this stage." };
    }
    if (index === entersIndex) {
      return {
        ...stage,
        status: "exposed" as const,
        note: "The dependency enters here. This is the stage to act on.",
      };
    }
    return {
      ...stage,
      status: "downstream" as const,
      note: "Inherits the date set upstream. Nothing at this stage can recover it.",
    };
  });
}

/**
 * The weak link, with its four facts read off the model.
 *
 * The sketch lists these four for the main shaft: two approved sources · both in one
 * geography · 21 days of confirmed coverage · ~8 weeks to qualify an alternative.
 * Every one of them is computed here, so the panel cannot drift from the data — and
 * the shared-geography fact is *withheld* when the model does not support it, rather
 * than printed as a constant.
 */
export function weakLink(componentId: string): WeakLink | undefined {
  const spec = WEAK_LINKS[componentId];
  const chain = dependencyChain(componentId);
  const stage = productionPathway(componentId).find((s) => s.status === "exposed");
  if (!spec || !chain || !stage) return undefined;

  const concentration = sourceConcentration(chain);
  const window = interventionWindow(chain);

  const facts: string[] = [
    chain.component.approvedSources === 1
      ? "One approved source for this assembly — the supplier currently bound to it, and no qualified alternative."
      : `${chain.component.approvedSources} approved sources for this assembly, including the supplier currently bound to it.`,
  ];

  if (concentration.sources > 0) {
    facts.push(
      concentration.shared
        ? `All ${concentration.sources} sources Drona can identify behind them sit in ${concentration.regions[0]} — one geography, not ${concentration.sources}.`
        : concentration.sources === 1
          ? `One source Drona can identify behind it, in ${concentration.regions[0]}.`
          : `Sources identified behind them: ${concentration.regions.join(", ")}.`
    );
  }

  facts.push(
    `${window.coverageDays} days of confirmed material coverage, ending ${formatDay(window.coverageEndsOn)}.`,
    `About ${weeks(window.qualificationDays)} weeks to qualify an alternative source — against a ${window.totalDays}-day window.`
  );

  return { title: spec.title, stage, mechanism: spec.mechanism, facts };
}

export interface Condition {
  readonly id: string;
  readonly title: string;
  readonly body: string;
}

/**
 * Two or three titled contributing conditions.
 *
 * Each is a paragraph, not a bullet and not a badge. The sketch is specific that
 * these read as short prose, because a condition is a *claim about the world* and a
 * claim needs a sentence — the moment it is compressed to a chip it becomes a label,
 * and a label is one step from a score.
 *
 * A condition that the data does not support is omitted. Supplier concentration only
 * appears when the sources genuinely share a region; timing vulnerability only when
 * qualification genuinely does not fit.
 */
export function contributingConditions(componentId: string): readonly Condition[] {
  const chain = dependencyChain(componentId);
  if (!chain) return [];

  const concentration = sourceConcentration(chain);
  const window = interventionWindow(chain);
  const units = unitsExposed(chain.component);
  const conditions: Condition[] = [];

  if (concentration.shared) {
    conditions.push({
      id: "concentration",
      title: "Supplier concentration",
      body: `Two approved sources read as redundancy on the approved-vendor list. Every source Drona can identify sits in ${concentration.regions[0]}${concentration.via ? `, behind ${concentration.via}` : ""} — so a disruption to that region${concentration.via ? ", or to that one intermediary," : ""} reaches all of them at once. The second source is a commercial alternative, not an independent one.`,
    });
  } else if (concentration.sources === 1) {
    conditions.push({
      id: "single-source",
      title: "Single identified source",
      body: `Drona can identify one source behind this route and no second. That is not a finding that no alternative exists — it is a finding that none is recorded, which for planning purposes has the same effect until someone establishes otherwise.`,
    });
  }

  if (!window.qualificationFits) {
    conditions.push({
      id: "timing",
      title: "Timing vulnerability",
      body: `Confirmed material covers ${window.coverageDays} days and the programme holds ${window.marginDays} days of margin — ${window.totalDays} days in total. Qualifying an alternative source takes roughly ${weeks(window.qualificationDays)} weeks. The remedy is ${window.shortfallDays} days longer than the window it would have to fit inside, so it cannot be started as a response to this exposure; it can only be started ahead of one.`,
    });
  }

  conditions.push({
    id: "external",
    title: "External condition",
    body: `Port and inland movement in this corridor is seasonally constrained through the delivery window, and Drona is reading that from published advisories rather than from anything this supplier has reported. It is not currently affecting the route. It is recorded because it would reach ${units} turbines through a route that has no slack left to absorb it.`,
  });

  return conditions;
}

/** The assembly's own header line, all of it derived. */
export interface ComponentSummary {
  readonly name: string;
  readonly system: string;
  readonly unitsExposed: number;
  readonly totalUnits: number;
  readonly requiredBy: string;
  readonly marginDays: number;
  readonly coverageDays: number;
  readonly leadTimeDays: number;
}

export function componentSummary(chain: DependencyChain): ComponentSummary {
  const window = interventionWindow(chain);
  const { commitment } = chain;

  return {
    name: chain.component.name,
    system: chain.component.system,
    unitsExposed: unitsExposed(chain.component),
    totalUnits: commitment.units,
    requiredBy: commitment.requiredBy,
    marginDays: window.marginDays,
    coverageDays: window.coverageDays,
    leadTimeDays: chain.component.leadTimeDays,
  };
}

/**
 * `2026-11-18` → `18 Nov 2026`, pinned to UTC and to `en-GB`.
 *
 * Both pins matter. The demo clock is a UTC instant, so formatting in the viewer's
 * zone would move dates by a day west of Greenwich; and an unpinned locale would
 * render `11/18/2026` on one machine and `18/11/2026` on another, which for a date
 * like 11 Dec is not a cosmetic difference. Same shape as the order header, so a
 * reviewer moving between the two scenes never has to re-read a date format.
 */
const DAY = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

export function formatDay(iso: string): string {
  return DAY.format(new Date(`${iso}T00:00:00Z`));
}

/** Whole weeks, for the one place the sketch speaks in weeks rather than days. */
export function weeks(days: number): number {
  return Math.round(days / 7);
}
