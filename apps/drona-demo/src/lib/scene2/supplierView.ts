/**
 * The supplier workbench's one dataset, and the one way it is filtered and ordered.
 *
 * Cards and List both render `visibleSuppliers(supplierRecords(...), state)`. There
 * is no second array for either view, so the two cannot drift. Bands come from
 * `bandedFor` — the same banding Drona's rollup counts — and nothing here re-scores
 * anything: filtering narrows what is shown, it never changes what was assessed.
 */
import { bandedFor, bomCommitment, hasBom, type ComponentGroup, type RiskBand } from "@/lib/network/bom";
import { CONCERN_RANK, type Supplier } from "@/lib/network/types";
import { plannedSuppliers } from "./workspace";
import { actionFor, type SupplierAction } from "./supplierActions";
import { DEMO_NOW } from "@/lib/demo/clock";
import { shiftDays } from "@/lib/network/programme";
import { MATERIAL_CASE } from "./investigation/inquiry";
import { investigationFor } from "./investigation/registry";

/**
 * Provision for the later working-capital workflow (request → OEM review → financier).
 * Typed now so supplier records have a place for it; unset on every record and
 * rendered nowhere until that workflow is designed. Amounts in lakh, like the rest
 * of the demo's finance figures.
 */
export type CapitalRequestStatus = "none" | "requested" | "reviewing" | "ready-to-forward" | "forwarded";

export interface CapitalRequest {
  readonly status: CapitalRequestStatus;
  readonly requestedLakh?: number;
}

export interface SupplierRecord {
  readonly supplier: Supplier;
  readonly onOrder: readonly ComponentGroup[] | null;
  /** Position in the planning snapshot; the tie-break that keeps ordering deterministic. */
  readonly snapshotIndex: number;
  /** This order's band for the supplier, or null before an assessment. */
  readonly band: RiskBand | null;
  /** The banding's own sentence for that band. */
  readonly because: string | null;
  /** The assembly whose intervention window closes first, when the order has a BOM. */
  readonly lead: ComponentGroup | null;
  /** Confirmed coverage plus programme margin for `lead`, in days — the same window as `interventionWindow`. */
  readonly windowDays: number | null;
  readonly action: SupplierAction | null;
  readonly capitalRequest?: CapitalRequest;
}

export function supplierRecords(commitmentId: string, assessed: boolean): readonly SupplierRecord[] {
  const withBom = hasBom(commitmentId);
  const margin = withBom ? bomCommitment(commitmentId).marginDays : 0;
  const banded = assessed && withBom ? bandedFor(commitmentId) : [];

  return plannedSuppliers(commitmentId).map(({ supplier, onOrder }, snapshotIndex) => {
    const windowOf = (c: ComponentGroup): number => c.coverageDays + margin;
    const lead = onOrder && onOrder.length > 0
      ? onOrder.reduce((a, b) => (windowOf(b) < windowOf(a) ? b : a))
      : null;
    const materialCase = commitmentId === MATERIAL_CASE.orderId && supplier.id === MATERIAL_CASE.supplierId;
    const windowDays = materialCase ? (Date.parse(MATERIAL_CASE.actBy) - Date.parse(MATERIAL_CASE.assessedOn)) / 86400000 : lead ? windowOf(lead) : null;
    const mine = banded.filter((b) => b.supplier.id === supplier.id);
    const worst = mine.reduce<(typeof mine)[number] | null>(
      (w, b) => (w === null || CONCERN_RANK[b.band] > CONCERN_RANK[w.band] ? b : w),
      null
    );
    const action = worst && windowDays !== null ? actionFor(commitmentId, supplier.name, windowDays) : null;
    const authored = investigationFor(commitmentId, supplier.id);
    const closesOn = authored && windowDays !== null ? shiftDays(authored.temporal.assessedAt, windowDays) : null;
    // Preserve the authored window, but never present an elapsed snapshot as a fresh countdown.
    const datedAction = action?.reason === "window" && closesOn && closesOn < DEMO_NOW.toISOString().slice(0, 10)
      ? { ...action, note: `Historical action window closed ${new Date(closesOn).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })} · refresh required` }
      : action;
    return {
      supplier,
      onOrder,
      snapshotIndex,
      band: worst?.band ?? null,
      because: worst?.because ?? null,
      lead,
      windowDays,
      action: datedAction,
    };
  });
}

export type BandFilter = "all" | RiskBand;
export type SupplierSort = "attention" | "name";

/** Overview owns inquiry and actions; the other surfaces provide inspection depth. */
export type InvestigationTab = "overview" | "supply-chain" | "evidence";

/**
 * Which investigation is open, and on which tab. Held beside the filters rather
 * than inside the workspace, so closing an investigation returns the workbench to
 * the identical filtered state it was opened from.
 */
export interface InvestigationRoute {
  readonly supplierId: string;
  readonly tab: InvestigationTab;
}

export interface WorkbenchState {
  readonly view: "cards" | "list";
  readonly band: BandFilter;
  readonly needsAction: boolean;
  readonly sort: SupplierSort;
  readonly investigation: InvestigationRoute | null;
}

export const DEFAULT_WORKBENCH: WorkbenchState = {
  view: "cards",
  band: "all",
  needsAction: false,
  sort: "attention",
  investigation: null,
};

const BY_SNAPSHOT = (a: SupplierRecord, b: SupplierRecord): number => a.snapshotIndex - b.snapshotIndex;

/**
 * Decision relevance: band (critical first), then suppliers needing action, then
 * the narrowest intervention window, then snapshot order. Unassessed records have
 * no band, so they keep snapshot order — nothing is ranked that was not assessed.
 */
const BY_ATTENTION = (a: SupplierRecord, b: SupplierRecord): number => {
  if (a.band === null || b.band === null) return BY_SNAPSHOT(a, b);
  return (
    CONCERN_RANK[b.band] - CONCERN_RANK[a.band] ||
    Number(b.action !== null) - Number(a.action !== null) ||
    (a.windowDays ?? Infinity) - (b.windowDays ?? Infinity) ||
    BY_SNAPSHOT(a, b)
  );
};

const BY_NAME = (a: SupplierRecord, b: SupplierRecord): number =>
  a.supplier.name.localeCompare(b.supplier.name) || BY_SNAPSHOT(a, b);

export function visibleSuppliers(
  records: readonly SupplierRecord[],
  state: Pick<WorkbenchState, "band" | "needsAction" | "sort">
): readonly SupplierRecord[] {
  return records
    .filter((r) => state.band === "all" || r.band === state.band)
    .filter((r) => !state.needsAction || r.action !== null)
    .slice()
    .sort(state.sort === "name" ? BY_NAME : BY_ATTENTION);
}

export interface BandCounts {
  readonly all: number;
  readonly critical: number;
  readonly elevated: number;
  readonly low: number;
  readonly needsAction: number;
}

export function bandCounts(records: readonly SupplierRecord[]): BandCounts {
  const count = (band: RiskBand): number => records.filter((r) => r.band === band).length;
  return {
    all: records.length,
    critical: count("critical"),
    elevated: count("elevated"),
    low: count("low"),
    needsAction: records.filter((r) => r.action !== null).length,
  };
}

/** What the workbench is narrowed to, for Drona to note; null when it shows everyone. */
export interface WorkbenchScope {
  readonly band: BandFilter;
  readonly needsAction: boolean;
  readonly shown: number;
}

export function workbenchScope(
  state: Pick<WorkbenchState, "band" | "needsAction">,
  shown: number
): WorkbenchScope | null {
  return state.band === "all" && !state.needsAction ? null : { band: state.band, needsAction: state.needsAction, shown };
}

const BAND_NOUN: Readonly<Record<RiskBand, string>> = { critical: "Critical", elevated: "Elevated", low: "Low" };

/** The workbench title, and the share of the whole once a filter narrows it. */
export function resultHeading(
  state: Pick<WorkbenchState, "band" | "needsAction">,
  shown: number,
  total: number
): { readonly title: string; readonly scope: string | null } {
  const filtered = state.band !== "all" || state.needsAction;
  if (!filtered) return { title: `Direct suppliers · ${total}`, scope: null };
  const label =
    state.band === "all"
      ? "Needs action"
      : state.needsAction
        ? `${BAND_NOUN[state.band]}, needs action`
        : `${BAND_NOUN[state.band]} suppliers`;
  return { title: `${label} · ${shown}`, scope: `${shown} of ${total} direct suppliers` };
}
