/**
 * Everything the investigation workspace shows is derived here, from data the
 * order page already holds.
 *
 * The rule is that no figure is authored twice. Units come from the bill of
 * materials, the window comes from the workbench's own banding, and the order
 * facts come from the gazetteer. The material case carries a distinct, sourced
 * response deadline; it does not reuse the BOM coverage window. Thus the header cannot drift from the
 * card the reviewer opened it from.
 */
import { linkedPurchaseValue } from "@/lib/portfolio/commercial";
import { DEMO_NOW } from "@/lib/demo/clock";
import { bomFor, hasBom, type RiskBand, type SerialRange } from "@/lib/network/bom";
import { commitmentById, supplierById } from "@/lib/network/gazetteer";
import { shiftDays } from "@/lib/network/programme";
import { supplierRecords } from "@/lib/scene2/supplierView";
import { investigationFor } from "./registry";
import type {
  Claim,
  EvidenceItem,
  EvidenceSourceType,
  InvestigationStatus,
  SourceIndependence,
  SupplierInvestigation,
  UnresolvedItem,
} from "./types";

const ASSESSED_ON = DEMO_NOW.toISOString().slice(0, 10);

/**
 * How many turbines a set of serial ranges covers, counting an overlap once.
 * A supplier with two assemblies on the same turbines exposes those turbines
 * once, not twice.
 */
export function serialUnion(ranges: readonly SerialRange[]): number {
  const sorted = [...ranges].sort((a, b) => a.from - b.from || a.to - b.to);
  const merged = sorted.reduce<{ readonly total: number; readonly end: number }>(
    (acc, range) => {
      const from = Math.max(range.from, acc.end + 1);
      if (from > range.to) return acc;
      return { total: acc.total + (range.to - from + 1), end: range.to };
    },
    { total: 0, end: Number.NEGATIVE_INFINITY }
  );
  return merged.total;
}

/** Turbines on this order that depend on this supplier, without double counting. */
export function affectedUnits(orderId: string, supplierId: string): number {
  if (!hasBom(orderId)) return 0;
  const mine = bomFor(orderId).filter((c) => c.supplierId === supplierId);
  return serialUnion(mine.map((c) => c.turbines));
}

/**
 * The turbines themselves — "Turbines 41–52", or "Turbines 41–52, 64–80" where a
 * supplier's assemblies sit on separate stretches of the order. Null where the
 * supplier has nothing on the order, so the block can stay silent rather than
 * print an empty range.
 */
export function affectedSerials(orderId: string, supplierId: string): string | null {
  if (!hasBom(orderId)) return null;
  const mine = bomFor(orderId).filter((c) => c.supplierId === supplierId);
  if (mine.length === 0) return null;
  const spans = [...mine.map((c) => c.turbines)]
    .sort((a, b) => a.from - b.from || a.to - b.to)
    .reduce<readonly SerialRange[]>((acc, range) => {
      const last = acc[acc.length - 1];
      if (last && range.from <= last.to + 1) {
        return [...acc.slice(0, -1), { from: last.from, to: Math.max(last.to, range.to) }];
      }
      return [...acc, range];
    }, []);
  return `Turbines ${spans.map((s) => (s.from === s.to ? `${s.from}` : `${s.from}–${s.to}`)).join(", ")}`;
}

export interface ActionWindow {
  /** Days from assessment to the controlling response deadline (BOM window for legacy cases). */
  readonly days: number;
  /** ISO date the window closes, counted from the assessment date. */
  readonly closesOn: string;
}

/** The same window the supplier card states, with the date it runs out. */
export function actionWindow(
  orderId: string,
  supplierId: string,
  assessedAt: string = ASSESSED_ON
): ActionWindow | null {
  const record = supplierRecords(orderId, true).find((r) => r.supplier.id === supplierId);
  if (!record || record.windowDays === null) return null;
  return { days: record.windowDays, closesOn: shiftDays(assessedAt, record.windowDays) };
}

export interface EvidenceState {
  /** Claims Drona observed directly. */
  readonly known: readonly Claim[];
  /** Everything Drona reasoned to — inference, forecast and scenario, types kept apart. */
  readonly inferred: readonly Claim[];
  /** Questions the evidence does not answer. */
  readonly unresolved: readonly UnresolvedItem[];
}

/** Known / Inferred / Unresolved, derived from the claims rather than stored twice. */
export function evidenceState(inv: SupplierInvestigation): EvidenceState {
  return {
    known: inv.claims.filter((c) => c.claimType === "observation"),
    inferred: inv.claims.filter((c) => c.claimType !== "observation"),
    unresolved: inv.unresolved,
  };
}

/** The reverse index: which claims rest on this piece of evidence. */
export function claimsSupportedBy(
  inv: SupplierInvestigation,
  evidenceId: string
): readonly Claim[] {
  return inv.claims.filter((c) => c.supportingEvidenceIds.includes(evidenceId));
}

/** Resolve an evidence id against the investigation's own register. */
export const evidenceById = (
  inv: SupplierInvestigation,
  id: string
): EvidenceItem | undefined => inv.evidence.find((e) => e.id === id);

export interface EvidenceClaims {
  readonly supports: readonly Claim[];
  readonly contradicts: readonly Claim[];
}

/** The reverse index in both directions: what this evidence backs, and what it undercuts. */
export function claimsForEvidence(inv: SupplierInvestigation, evidenceId: string): EvidenceClaims {
  return {
    supports: inv.claims.filter((c) => c.supportingEvidenceIds.includes(evidenceId)),
    contradicts: inv.claims.filter((c) => c.contradictingEvidenceIds.includes(evidenceId)),
  };
}

export interface EvidenceRegisterRow {
  readonly dateKind?: EvidenceItem["sourceDateKind"];
  readonly url?: string;
  readonly synthetic?: boolean;
  readonly receivedAt?: string;
  readonly kind: "held" | "requested";
  readonly id: string;
  readonly source: string;
  readonly sourceType: EvidenceSourceType | null;
  /** ISO date on the source; null for a request, which has none yet. */
  readonly date: string | null;
  readonly supports: readonly Claim[];
  readonly contradicts: readonly Claim[];
  readonly state: SourceIndependence | null;
  readonly scope: string;
  /** Who holds a requested item; null for evidence already in hand. */
  readonly owner: string | null;
  readonly relatedCount: number;
  readonly excerpt?: string;
  readonly limitation?: string;
  readonly eventAt?: string;
}

/**
 * Evidence in hand and evidence still requested, in one row shape, so the register
 * reads as one table instead of two. `kind` is the discriminant a reader (and a
 * filter) can switch on.
 */
export function evidenceRegisterRows(inv: SupplierInvestigation): readonly EvidenceRegisterRow[] {
  const held: EvidenceRegisterRow[] = inv.evidence.map((item) => {
    const { supports, contradicts } = claimsForEvidence(inv, item.id);
    return {
      kind: "held",
      excerpt: item.excerpt, limitation: item.limitation, eventAt: item.eventAt,
      id: item.id,
      source: item.sourceName,
      dateKind: item.sourceDateKind,
      url: item.url,
      synthetic: item.synthetic,
      receivedAt: item.retrievedAt,
      sourceType: item.sourceType,
      date: item.sourceDate,
      supports,
      contradicts,
      state: item.independence.kind,
      scope: item.scope,
      owner: null,
      relatedCount: item.independence.relatedTo.length,
    };
  });
  const requested: EvidenceRegisterRow[] = inv.nextBestEvidence.map((req) => ({
    kind: "requested",
    id: req.id,
    source: req.request,
    sourceType: null,
    date: null,
    supports: [],
    contradicts: [],
    state: null,
    scope: req.resolves,
    owner: req.owner,
    relatedCount: 0,
  }));
  return [...held, ...requested];
}

export interface InvestigationHeaderFacts {
  /** Mapped fictional purchase commitments where supplied; otherwise absent. */
  readonly linkedCommitmentValue?: import("./decision").LinkedCommitmentValue;
  readonly assessedAt?: string;
  readonly orderId: string;
  readonly orderReference: string;
  readonly orderName: string;
  readonly buyer: string;
  readonly supplierId: string;
  readonly supplierName: string;
  readonly location: string;
  /** The assemblies this supplier holds on this order, named as the BOM names them. */
  readonly components: readonly string[];
  readonly band: RiskBand | null;
  readonly because: string | null;
  readonly status: InvestigationStatus | null;
  readonly unitsAffected: number;
  readonly unitsTotal: number;
  readonly window: ActionWindow | null;
  readonly regulatory?: SupplierInvestigation["regulatory"];
  readonly hasInvestigation: boolean;
}

/**
 * Every fact the persistent header states — which order, which supplier, which
 * component — derived once so the header and the card cannot disagree.
 */
export function investigationHeader(
  orderId: string,
  supplierId: string,
  assessed: boolean,
  currentInvestigation?: SupplierInvestigation | null
): InvestigationHeaderFacts | null {
  const commitment = commitmentById(orderId);
  const supplier = supplierById(supplierId);
  if (!commitment || !supplier) return null;

  const record = supplierRecords(orderId, assessed).find((r) => r.supplier.id === supplierId);
  const inv = currentInvestigation === undefined ? investigationFor(orderId, supplierId) : currentInvestigation;

  return {
    orderId,
    orderReference: commitment.reference,
    linkedCommitmentValue: linkedPurchaseValue(orderId, supplierId),
    orderName: commitment.name,
    buyer: commitment.buyer,
    assessedAt: assessed && inv ? inv.temporal.assessedAt : undefined,
    supplierId,
    supplierName: supplier.name,
    location: `${supplier.city}, ${supplier.region}`,
    components: (record?.onOrder ?? []).map((c) => c.name),
    band: assessed ? record?.band ?? null : null,
    because: assessed ? record?.because ?? null : null,
    status: assessed && inv ? inv.status : null,
    unitsAffected: affectedUnits(orderId, supplierId),
    unitsTotal: commitment.units,
    window: inv?.regulatory ? null : inv?.material ? inv.material.closed ? null : { days: (Date.parse(inv.material.actBy) - Date.parse(inv.temporal.assessedAt)) / 86400000, closesOn: inv.material.actBy } : actionWindow(orderId, supplierId, inv?.temporal.assessedAt),
    regulatory: inv?.regulatory,
    hasInvestigation: inv !== null,
  };
}
