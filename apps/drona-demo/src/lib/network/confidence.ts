/**
 * The evidence vocabulary shared by the Tier-1 chains (`dependencies.ts`) and the
 * sub-tier networks (`subtier/`). Its own module so that neither has to import the
 * other to speak it.
 */

/**
 * How well Drona knows a relationship.
 *
 * Four states, not a percentage. A percentage invites arithmetic across things that
 * cannot be averaged — a signed contract and a name on a register are not 0.9 and
 * 0.4 of the same quantity — and the moment they are averaged the surface has a
 * score again, which is the thing this demo exists to argue against.
 */
export type Confidence = "verified" | "inferred" | "low" | "missing";

/** Severity of *not knowing*, worst last. Used to rank, never rendered as a number. */
export const CONFIDENCE_RANK: Readonly<Record<Confidence, number>> = {
  verified: 0,
  inferred: 1,
  low: 2,
  missing: 3,
};

/** What each state licenses Drona to say. Rendered verbatim; it is the disclosure. */
export const CONFIDENCE_MEANING: Readonly<Record<Confidence, string>> = {
  verified: "Verified — held as a record in this order's own documents.",
  inferred: "Inferred — read from supplier documents, not contracted to this plant.",
  low: "Lower confidence — the relationship is recorded but not corroborated.",
  missing: "Evidence missing — approved on paper, with nothing showing it has supplied.",
};

/** One-word label for the mark beside a node. */
export const CONFIDENCE_LABEL: Readonly<Record<Confidence, string>> = {
  verified: "Verified",
  inferred: "Inferred",
  low: "Low confidence",
  missing: "Evidence missing",
};
