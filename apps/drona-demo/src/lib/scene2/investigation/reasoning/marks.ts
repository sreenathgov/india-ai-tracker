import type { ClaimMateriality } from "../types";
import type { ReasoningEdgeKind } from "./graph";

/** SVG dash pattern for a card border, keyed by `RN_BORDER_STYLE`'s two values. */
export const RN_DASH: Readonly<Record<"solid" | "dashed", string | undefined>> = {
  solid: undefined,
  dashed: "5 4",
};

/** The left-edge rule's weight: how hard a claim's materiality presses on the case. */
export const RN_MATERIALITY_RULE_WIDTH: Readonly<Record<ClaimMateriality, number>> = {
  controlling: 3,
  contributing: 2,
  contextual: 1,
};

/** Shared with the supply-chain graph's dimmed state, so the two panels read as one language. */
export const RN_DIMMED_OPACITY = 0.34;

export interface ReasoningEdgeStroke {
  readonly stroke: string;
  readonly width: number;
  readonly dash?: string;
}

/** `affects-*` edges are the graph's structure; `contested-together` is a claim about the claims. */
export const REASONING_EDGE_STROKE: Readonly<Record<ReasoningEdgeKind, ReasoningEdgeStroke>> = {
  "context-for": { stroke: "var(--label-quaternary)", width: 1, dash: "3 4" },
  "supports-claim": { stroke: "var(--label-secondary)", width: 1.5 },
  "affects-dependency": { stroke: "var(--label-quaternary)", width: 1.5 },
  "affects-action": { stroke: "var(--label-quaternary)", width: 1.5 },
  "contested-together": { stroke: "var(--concern-elevated)", width: 1.5, dash: "3 3" },
};
