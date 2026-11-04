import type { ConcernState, EvidenceState } from "./types";

export interface EdgeStroke {
  readonly stroke: string;
  readonly width: number;
  readonly dash?: string;
  readonly opacity: number;
}

/** A concern as a colour, for the line under the path it travels. */
export const CONCERN_RAIL: Readonly<Record<ConcernState, string | null>> = {
  normal: null,
  active: "var(--label-secondary)",
  exposed: "var(--concern-critical)",
  unresolved: "var(--concern-elevated)",
  mitigation: "var(--state-monitoring)",
};

/** A concern as a card surface: a wash and an edge, never a fill. Normal is undressed. */
export interface ConcernSurface {
  readonly wash: string | null;
  readonly edge: string | null;
}

export const CONCERN_SURFACE: Readonly<Record<ConcernState, ConcernSurface>> = {
  normal: { wash: null, edge: null },
  active: { wash: null, edge: null },
  exposed: { wash: "var(--band-critical-wash)", edge: "var(--band-critical-edge)" },
  unresolved: { wash: "var(--band-elevated-wash)", edge: "var(--band-elevated-edge)" },
  mitigation: { wash: "var(--band-mitigation-wash)", edge: "var(--band-mitigation-edge)" },
};

export const EVIDENCE_DASH: Readonly<Record<EvidenceState, string | undefined>> = {
  verified: undefined,
  inferred: "5 4",
  unresolved: "2 3",
};

/** A knowledge state as a card border style, separate from the concern wash beneath it. */
export const EVIDENCE_BORDER_STYLE: Readonly<Record<EvidenceState, "solid" | "dashed" | "dotted">> = {
  verified: "solid",
  inferred: "dashed",
  unresolved: "dotted",
};

/** Whether the card needs a text tag to say what the border style already implies. */
export const EVIDENCE_NEEDS_TAG: Readonly<Record<EvidenceState, boolean>> = {
  verified: false,
  inferred: true,
  unresolved: true,
};

export function edgeStroke(evidence: EvidenceState, concern: ConcernState): EdgeStroke {
  const rail = CONCERN_RAIL[concern];
  const onPath = concern === "exposed" || concern === "active";
  return {
    stroke: rail ?? "var(--label-quaternary)",
    width: onPath ? 2 : concern === "normal" ? 1 : 1.5,
    dash: EVIDENCE_DASH[evidence],
    opacity: rail ? (onPath ? 0.8 : 0.62) : 0.3,
  };
}

export const DIMMED_OPACITY = 0.34;
