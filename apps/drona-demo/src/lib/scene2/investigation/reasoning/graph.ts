import type { FractureStage, InvestigationAction, InvestigationDependency, SupplierInvestigation } from "../types";
import { actionPosture, reasoningKindForClaim, RN_MATERIALITY_WEIGHT, type ActionPosture, type ReasoningNodeKind } from "./taxonomy";

/** The stage a reasoning node sits under. The five fracture stages, plus the two
 *  derived columns for what claims point at, plus a fallback for a claim the
 *  fracture path never names. */
export type ReasoningColumnKey = FractureStage | "unstaged" | "dependencies" | "actions";

export const REASONING_COLUMNS: readonly ReasoningColumnKey[] = [
  "condition",
  "dependency",
  "supplier",
  "production",
  "commitment",
  "unstaged",
  "dependencies",
  "actions",
];

export interface ReasoningNode {
  readonly id: string;
  readonly kind: ReasoningNodeKind;
  readonly column: ReasoningColumnKey;
  readonly label: string;
  readonly date?: string;
  readonly detail?: string;
  /** Claim nodes only. */
  readonly claimId?: string;
  readonly materialityWeight?: number;
  readonly evidenceCount?: number;
  /** Dependency nodes only. */
  readonly dependencyId?: string;
  /** Action nodes only. */
  readonly actionId?: string;
  readonly posture?: ActionPosture;
}

export type ReasoningEdgeKind = "affects-dependency" | "affects-action" | "contested-together" | "supports-claim" | "context-for";

export interface ReasoningEdge {
  readonly id: string;
  readonly fromId: string;
  readonly toId: string;
  readonly kind: ReasoningEdgeKind;
}

export interface ReasoningGraph {
  /** Compact cards for the bounded material teaching path; full inspection remains unchanged. */
  readonly compact?: boolean;
  readonly nodes: readonly ReasoningNode[];
  readonly edges: readonly ReasoningEdge[];
}

export const claimNodeId = (claimId: string): string => `claim:${claimId}`;
export const dependencyNodeId = (dependencyId: string): string => `dependency:${dependencyId}`;
export const actionNodeId = (actionId: string): string => `action:${actionId}`;

/** The earliest fracture stage that names this claim, or "unstaged" where none does. */
function stageForClaim(inv: SupplierInvestigation, claimId: string): ReasoningColumnKey {
  const step = inv.fracturePath.find((s) => s.claimIds.includes(claimId));
  return step?.stage ?? "unstaged";
}

function dependencyNode(dep: InvestigationDependency): ReasoningNode {
  return {
    id: dependencyNodeId(dep.id),
    kind: "dependency",
    column: "dependencies",
    label: dep.label,
    dependencyId: dep.id,
  };
}

function actionNode(action: InvestigationAction): ReasoningNode {
  return {
    id: actionNodeId(action.id),
    kind: "action",
    column: "actions",
    label: action.label,
    detail: action.condition,
    actionId: action.id,
    posture: actionPosture(action.kind),
  };
}

/**
 * The claim/evidence graph for one investigation, built once from the same
 * canonical data the overview and audit trail already read. Nothing here is
 * authored twice: a claim's evidence count, its dependency and action edges,
 * and which claims are contested together all come straight from the claim
 * and the investigation's own `competingExplanation`.
 */
export function buildReasoningGraph(inv: SupplierInvestigation): ReasoningGraph {
  const nodes: ReasoningNode[] = [];
  const edges: ReasoningEdge[] = [];

  for (const claim of inv.claims) {
    nodes.push({
      id: claimNodeId(claim.id),
      kind: reasoningKindForClaim(claim.claimType),
      column: stageForClaim(inv, claim.id),
      label: claim.title ?? claim.claim,
      detail: claim.title ? `${claim.confidence[0].toUpperCase()}${claim.confidence.slice(1)} confidence` : undefined,
      date: claim.observedAt ?? claim.validFrom,
      claimId: claim.id,
      materialityWeight: RN_MATERIALITY_WEIGHT[claim.materiality],
      evidenceCount: claim.supportingEvidenceIds.length,
    });

    for (const sourceId of claim.contextClaimIds ?? []) {
      if (!inv.claims.some(c => c.id === sourceId)) throw new Error(`Unknown context claim: ${sourceId}`);
      edges.push({ id: `${sourceId}->context:${claim.id}`, fromId: claimNodeId(sourceId), toId: claimNodeId(claim.id), kind: "context-for" });
    }
    for (const sourceId of claim.supportingClaimIds ?? []) {
      if (!inv.claims.some(c => c.id === sourceId)) throw new Error(`Unknown supporting claim: ${sourceId}`);
      edges.push({ id: `${sourceId}->claim:${claim.id}`, fromId: claimNodeId(sourceId), toId: claimNodeId(claim.id), kind: "supports-claim" });
    }
    for (const depId of claim.affectedDependencyIds) {
      edges.push({
        id: `${claim.id}->dep:${depId}`,
        fromId: claimNodeId(claim.id),
        toId: dependencyNodeId(depId),
        kind: "affects-dependency",
      });
    }
    for (const actionId of claim.affectedActionIds) {
      edges.push({
        id: `${claim.id}->act:${actionId}`,
        fromId: claimNodeId(claim.id),
        toId: actionNodeId(actionId),
        kind: "affects-action",
      });
    }
  }

  const usedDependencyIds = new Set(inv.claims.flatMap((c) => c.affectedDependencyIds));
  const usedActionIds = new Set(inv.claims.flatMap((c) => c.affectedActionIds));
  for (const dep of inv.dependencies) {
    if (usedDependencyIds.has(dep.id)) nodes.push(dependencyNode(dep));
  }
  for (const action of inv.actions) {
    if (usedActionIds.has(action.id)) nodes.push(actionNode(action));
  }

  const contested = inv.competingExplanation.claimIds.filter((id) => inv.claims.some((c) => c.id === id));
  for (let i = 0; i < contested.length - 1; i += 1) {
    edges.push({
      id: `contested:${contested[i]}<->${contested[i + 1]}`,
      fromId: claimNodeId(contested[i]),
      toId: claimNodeId(contested[i + 1]),
      kind: "contested-together",
    });
  }

  return { nodes, edges };
}

/** A readable four-column teaching path for the material episode. All claims remain in All claims. */
export function materialDecisionGraph(inv: SupplierInvestigation, full: ReasoningGraph): ReasoningGraph {
  if (!inv.material) return full;
  const current = inv.claims.some(c => c.id === "dc-current-assessment") ? "dc-current-assessment" : "dc-coverage";
  const claimColumns: Readonly<Record<string, ReasoningColumnKey>> = { "dc-alert": "condition", "dc-hold": "condition", "dc-route": "dependency", "dc-receipt": "dependency", "dc-impact": "supplier", [current]: "supplier" };
  const actionId = actionNodeId(inv.material.currentActionId);
  const nodes = full.nodes.filter(node => node.claimId ? node.claimId in claimColumns : node.id === actionId).map(node => node.claimId ? { ...node, column: claimColumns[node.claimId] } : node);
  const ids = new Set(nodes.map(node => node.id));
  const edges = full.edges.filter(edge => ids.has(edge.fromId) && ids.has(edge.toId));
  // The active question/action is justified by the current assessment, not by a decorative sequence.
  const decisionId = claimNodeId(current);
  if (!edges.some(e => e.fromId === decisionId && e.toId === actionId)) edges.push({ id: `current:${current}->${actionId}`, fromId: decisionId, toId: actionId, kind: "affects-action" });
  return { nodes, edges, compact: true };
}
