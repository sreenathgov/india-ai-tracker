/**
 * The visual grammar for how well Drona knows something.
 *
 * BRAND.md declares four epistemic tokens and Scene 3 is where they stop being
 * decoration: *Drona must never present inferred knowledge as established fact.* A
 * solid node behind a dotted line would do exactly that, so the node treatment and
 * the edge treatment are decided **together, here, once** — not improvised per
 * component, and not spelled out twice in two files that can drift apart.
 *
 * Every value is returned as a `var(--evidence-…)` reference rather than a copied
 * number, so the tokens are genuinely the source of truth. `strokeDasharray` and
 * `opacity` are CSS properties on SVG, so a custom property resolves in them exactly
 * as it would on a div — which is why this grammar needs no additions to the Tailwind
 * config to reach the map.
 *
 * Pure. No React, no DOM.
 */
import type { Confidence } from "@/lib/network/dependencies";

/**
 * How a node's body is drawn.
 *
 * `solid` is a fact. `ring` is a claim Drona is making — visible, but hollowed out so
 * it cannot be mistaken for the first. `hollow` is an absence: there is a node here
 * because something must be, and Drona has no evidence of what.
 */
export type EvidenceFill = "solid" | "ring" | "hollow";

export interface EvidenceMark {
  readonly fill: EvidenceFill;
  /** A `var()` reference, so the token file remains the only place a number lives. */
  readonly opacity: string;
  /** `null` means an unbroken line. Anything else is a dash pattern token. */
  readonly dash: string | null;
}

const VERIFIED_OPACITY = "var(--evidence-verified-opacity)";
const INFERRED_OPACITY = "var(--evidence-inferred-opacity)";

const MARKS: Readonly<Record<Confidence, EvidenceMark>> = {
  /* Contracted, documented, drawn at full strength. Without one of these on screen,
     "inferred" has nothing to be weaker than and the grammar reads as styling. */
  verified: { fill: "solid", opacity: VERIFIED_OPACITY, dash: null },

  /* Drona resolved this from outside the order — trade records, filings, published
     capacity. Faint body, unbroken line: the relationship is asserted, the evidence
     for it is second-hand. */
  inferred: { fill: "ring", opacity: INFERRED_OPACITY, dash: null },

  /* The relationship itself is shaky, so the *line* breaks rather than the node: what
     is uncertain here is the link, not the existence of the thing at the end of it. */
  low: { fill: "ring", opacity: INFERRED_OPACITY, dash: "var(--evidence-low-confidence-dash)" },

  /* Nothing established. The tightest dash and an empty body, so the reviewer's eye
     registers a gap in the picture rather than another supplier. */
  missing: { fill: "hollow", opacity: INFERRED_OPACITY, dash: "var(--evidence-missing-dash)" },
};

export function evidenceMark(confidence: Confidence): EvidenceMark {
  return MARKS[confidence];
}
