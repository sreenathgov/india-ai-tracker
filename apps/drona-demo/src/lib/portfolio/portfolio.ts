/**
 * Scene 1's one shared data object — the Production Intelligence Surface.
 *
 * Every card on the surface reads from here, so the map, the queue, the ring, the
 * finance card and Drona's prose cannot tell different stories. It joins the
 * records that already exist (commitments, destinations, suppliers from the
 * gazetteer; Wind Energy's figures from its critical profiles) and adds only what is
 * new to the portfolio view: workflow state, the dependency matrix, mitigation
 * status and working capital. Nothing here is live; all of it is synthetic.
 */
import {
  COMMITMENTS,
  commitmentById,
  destinationById,
  suppliersForCommitment,
} from "@/lib/network/gazetteer";
import type { Commitment, Destination } from "@/lib/network/types";
import { FINDING_LABEL, INITIAL_REGULATORY_STATE, findingFor, findingClosed, type RegulatoryState, REGULATORY_CASES } from "@/lib/regulatory/state";
import { nordvindAttention } from "./attention";

/* ── Workflow state ─────────────────────────────────────────────────────────── */

export type CommitmentState = "new" | "action" | "monitoring";

export const STATE_ORDER: readonly CommitmentState[] = ["new", "action", "monitoring"];

export const STATE_LABEL: Readonly<Record<CommitmentState, string>> = {
  new: "New",
  action: "Action",
  monitoring: "Monitoring",
};

interface StateRecord {
  readonly state: CommitmentState;
  /** Minutes since the SAP plan arrived — NEW only. */
  readonly receivedMinutesAgo?: number;
  /** Since the last material change — MONITORING only, e.g. "6h". */
  readonly quietFor?: string;
}

const STATE_RECORDS: Readonly<Record<string, StateRecord>> = {
  c4: { state: "new", receivedMinutesAgo: 4 },
  /* Highland is the Scene 2 walkthrough order: its plan has arrived and it has not
     been assessed. Its BOM and network are unchanged — only its workflow state is. */
  c2: { state: "new", receivedMinutesAgo: 12 },
  c3: { state: "new", receivedMinutesAgo: 26 },
  c1: { state: "action" },
  c5: { state: "monitoring", quietFor: "1d" },
};

/* ── Critical dependencies, by fracture mechanism ───────────────────────────── */

export type DependencyType =
  | "material"
  | "process"
  | "regulatory"
  | "network"
  | "logistics"
  | "liquidity"
  | "external";

export interface DependencyTypeInfo {
  readonly id: DependencyType;
  readonly label: string;
  /** Two letters drawn beside the swatch, so a type never rests on colour alone. */
  readonly code: string;
  readonly definition: string;
}

export const DEPENDENCY_TYPES: readonly DependencyTypeInfo[] = [
  { id: "material", label: "Material", code: "Ma", definition: "A raw material or alloy the assembly cannot be built without." },
  { id: "process", label: "Process & capacity", code: "Pr", definition: "A forging, heat-treatment or machining step one party holds, or cannot scale." },
  { id: "regulatory", label: "Regulatory", code: "Rg", definition: "One mapped CBAM shipment case: public rule, actual applicability and importer readiness are checked separately. The count is a case, not a confirmed legal failure." },
  { id: "network", label: "Network concentration", code: "Nw", definition: "One party sitting behind more than one critical Tier-1." },
  { id: "logistics", label: "Logistics & route", code: "Lg", definition: "A lane, port or carrier with no ready alternative." },
  { id: "liquidity", label: "Liquidity", code: "Lq", definition: "A supplier whose working capital cannot carry the order's volume." },
  { id: "external", label: "External conditions", code: "Ex", definition: "Non-regulatory external conditions, such as weather or security. Legal requirements are counted once under Regulatory." },
];

type Row = Readonly<Record<DependencyType, number>>;

/* Authored per active commitment. NEW orders are not yet analysed and carry none. */
const DEPENDENCY_MATRIX: Readonly<Record<string, Row>> = {
  c1: { material: 5, process: 3, regulatory: REGULATORY_CASES.filter((c) => c.orderId === "c1").length, network: 2, logistics: 1, liquidity: 1, external: 0 },
  c5: { material: 2, process: 2, regulatory: 0, network: 1, logistics: 1, liquidity: 1, external: 1 },
};

export interface Mitigation {
  readonly verified: number;
  readonly underReview: number;
  /** Decision-critical unknowns: evidence Drona needs and does not have. */
  readonly unknowns: number;
}

const MITIGATION: Readonly<Record<string, Mitigation>> = {
  c1: { verified: 6, underReview: 4, unknowns: 3 },
  c5: { verified: 6, underReview: 1, unknowns: 1 },
};

const sum = (values: readonly number[]): number => values.reduce((a, b) => a + b, 0);

export const dependencyCount = (commitmentId: string): number =>
  sum(Object.values(DEPENDENCY_MATRIX[commitmentId] ?? {}));

export const dependencyCountOfType = (commitmentId: string, type: DependencyType): number =>
  DEPENDENCY_MATRIX[commitmentId]?.[type] ?? 0;

export const dependencyTotalOfType = (type: DependencyType): number =>
  sum(Object.keys(DEPENDENCY_MATRIX).map((id) => dependencyCountOfType(id, type)));

/** Commitments carrying at least one dependency of this type, most first. */
export function commitmentsWithType(type: DependencyType): readonly Commitment[] {
  return Object.keys(DEPENDENCY_MATRIX)
    .filter((id) => dependencyCountOfType(id, type) > 0)
    .sort((a, b) => dependencyCountOfType(b, type) - dependencyCountOfType(a, type))
    .map((id) => commitmentById(id)!);
}

export function mitigationTotals(state: RegulatoryState = INITIAL_REGULATORY_STATE): Mitigation {
  const evidenced = Number(findingClosed(findingFor(state)));
  const all = Object.values(MITIGATION);
  return {
    verified: sum(all.map((m) => m.verified)) + evidenced,
    underReview: sum(all.map((m) => m.underReview)) - evidenced,
    unknowns: sum(all.map((m) => m.unknowns)),
  };
}

/* ── Rows and summary ───────────────────────────────────────────────────────── */

export interface PortfolioRow {
  readonly commitment: Commitment;
  readonly destination: Destination;
  readonly state: CommitmentState;
  /** One or two cues, already worded. */
  readonly cues: readonly string[];
  /** The one commitment Drona recommends opening. */
  readonly recommended: boolean;
}

function cuesFor(commitment: Commitment, record: StateRecord, regulatoryState: RegulatoryState): readonly string[] {
  switch (record.state) {
    case "new":
      return [
        `SAP plan received ${record.receivedMinutesAgo} min ago`,
        `${suppliersForCommitment(commitment.id).length} planned Tier-1s`,
      ];
    case "action": {
      const attention = nordvindAttention();
      return [
        `${dependencyCount(commitment.id)} critical dependencies`,
        `${attention.unitsExposed} units depend on tower sections · ${FINDING_LABEL[findingFor(regulatoryState)].toLowerCase()}`,
      ];
    }
    case "monitoring":
      return [
        `${dependencyCount(commitment.id)} critical dependencies`,
        `No material change · ${record.quietFor}`,
      ];
  }
}

export const RECOMMENDED_COMMITMENT = "c1";

export function portfolioRows(regulatoryState: RegulatoryState = INITIAL_REGULATORY_STATE): readonly PortfolioRow[] {
  return STATE_ORDER.flatMap((state) =>
    COMMITMENTS.filter((c) => STATE_RECORDS[c.id]?.state === state)
      /* Newest plan first; otherwise the gazetteer's order, which is by due date. */
      .sort((a, b) => (STATE_RECORDS[a.id]!.receivedMinutesAgo ?? 0) - (STATE_RECORDS[b.id]!.receivedMinutesAgo ?? 0))
      .map((commitment) => ({
      commitment,
      destination: destinationById(commitment.destinationId)!,
      state,
      cues: cuesFor(commitment, STATE_RECORDS[commitment.id]!, regulatoryState),
      recommended: commitment.id === RECOMMENDED_COMMITMENT,
    }))
  );
}

export const stateOf = (commitmentId: string): CommitmentState | undefined =>
  STATE_RECORDS[commitmentId]?.state;

/** Minutes since a NEW order's SAP plan arrived, or null where the snapshot does not record it. */
export const planReceivedMinutesAgo = (commitmentId: string): number | null =>
  STATE_RECORDS[commitmentId]?.receivedMinutesAgo ?? null;

export interface PortfolioSummary {
  readonly commitments: number;
  readonly byState: Readonly<Record<CommitmentState, number>>;
  readonly criticalDependencies: number;
  readonly unknowns: number;
  /** The tightest intervention window among ACTION commitments, in days. */
  readonly earliestWindowDays: number;
}

export function portfolioSummary(): PortfolioSummary {
  const rows = portfolioRows();
  const count = (state: CommitmentState) => rows.filter((r) => r.state === state).length;
  return {
    commitments: rows.length,
    byState: { new: count("new"), action: count("action"), monitoring: count("monitoring") },
    criticalDependencies: sum(Object.keys(DEPENDENCY_MATRIX).map(dependencyCount)),
    unknowns: mitigationTotals().unknowns,
    earliestWindowDays: nordvindAttention().windowDays,
  };
}
