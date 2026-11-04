import type { ActionKind, Claim, ClaimMateriality } from "../types";

/**
 * The reasoning graph's own vocabulary of node kinds.
 *
 * Four map straight onto `Claim.claimType`. Two are derived rather than authored:
 * a dependency claims rest on, and an action claims point to. Splitting actions by
 * posture keeps a verification step reading like the investigative work it is,
 * rather than like the intervention it might lead to.
 */
export type ReasoningNodeKind = "observation" | "inference" | "forecast" | "scenario" | "dependency" | "action";

export type ActionPosture = "verificatory" | "interventionary";

/** `verify` reads as investigation, not intervention; every other kind changes the world. */
export function actionPosture(kind: ActionKind): ActionPosture {
  return kind === "verify" ? "verificatory" : "interventionary";
}

export const RN_TYPE_LABEL: Readonly<Record<ReasoningNodeKind, string>> = {
  observation: "Observation",
  inference: "Inference",
  forecast: "Forecast",
  scenario: "Scenario",
  dependency: "Dependency",
  action: "Action",
};

/** Solid holds; everything reasoned to, or not yet acted on, is dashed. */
export const RN_BORDER_STYLE: Readonly<Record<ReasoningNodeKind, "solid" | "dashed">> = {
  observation: "solid",
  inference: "dashed",
  forecast: "dashed",
  scenario: "dashed",
  dependency: "solid",
  action: "dashed",
};

export const RN_MATERIALITY_WEIGHT: Readonly<Record<ClaimMateriality, number>> = {
  controlling: 0,
  contributing: 1,
  contextual: 2,
};

export const reasoningKindForClaim = (claimType: Claim["claimType"]): ReasoningNodeKind => claimType;
