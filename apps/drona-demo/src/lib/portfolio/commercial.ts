/** Fictional USD ERP and finance snapshots, 2 November 2026.
 * Authored in USD, not an FX conversion. Purchase commitments are not revenue,
 * expected loss or finance. Monetary amounts are held in integer cents.
 */
import { INITIAL_INQUIRY, MATERIAL_CASE, materialConditionClosed, materialFinding, type SupplierInquiryState } from "@/lib/scene2/investigation/inquiry";
import { INITIAL_REGULATORY_STATE, findingClosed, findingFor, type RegulatoryState } from "@/lib/regulatory/state";

export const COMMERCIAL_SNAPSHOT = { asOf: "2026-11-02", source: "Illustrative ERP snapshot", currency: "USD", basis: "Unfulfilled supplier purchase-order commitments; paid and binding unpaid amounts" } as const;
export const ASSESSED_COMMERCIAL_ORDERS = ["c1", "c5"] as const;
export interface PurchaseLine { readonly id: string; readonly orderId: string; readonly supplierId: string; readonly label: string; readonly committedCents: number }
export const PURCHASE_LINES: readonly PurchaseLine[] = [
  { id: "demo-po:0417:tower:10", orderId: "c1", supplierId: "sup:tiruchi-tower-sections", label: "Tower section sets · turbines 53–80", committedCents: 480_000_000 },
  { id: "demo-po:0417:shaft:20", orderId: "c1", supplierId: MATERIAL_CASE.supplierId, label: "Main-shaft lot · turbines 41–52", committedCents: 160_000_000 },
  { id: "demo-po:0428:blades:10", orderId: "c5", supplierId: "sup:halol-blade-moulding", label: "Blade shell moulding and spar caps", committedCents: 220_000_000 },
];
export type ExposureStatus = "under-review" | "confirmed" | "closed";
export interface CommercialCondition { readonly id: string; readonly lineIds: readonly string[]; readonly label: string; readonly regulatory?: boolean; readonly material?: boolean }
/** Authored open-condition register. These are scenario records, not live findings.
 * Two material questions deliberately share one line, which must count only once. */
export const COMMERCIAL_CONDITIONS: readonly CommercialCondition[] = [
  { id: "reg:c1:tower-cbam", lineIds: ["demo-po:0417:tower:10"], label: "CBAM scope and importer readiness", regulatory: true },
  { id: "demo:c1:shaft-receipt", lineIds: ["demo-po:0417:shaft:20"], label: "Usable-receipt timing under review", material: true },
  { id: "demo:c1:shaft-cover", lineIds: ["demo-po:0417:shaft:20"], label: "Stock coverage under review", material: true },
  { id: "demo:c5:blade-allocation", lineIds: ["demo-po:0428:blades:10"], label: "Material allocation under review" },
];
export function conditionStatus(condition: CommercialCondition, state: RegulatoryState, material: SupplierInquiryState = INITIAL_INQUIRY): ExposureStatus {
  if (condition.material) return materialConditionClosed(material) ? "closed" : materialFinding(material) === "timing-gap" ? "confirmed" : "under-review";
  if (!condition.regulatory) return "under-review";
  const finding = findingFor(state);
  return findingClosed(finding) ? "closed" : finding === "gap-confirmed" ? "confirmed" : "under-review";
}
export function exposureSummary(state: RegulatoryState = INITIAL_REGULATORY_STATE, orderId?: string, conditions = COMMERCIAL_CONDITIONS, lines = PURCHASE_LINES, material: SupplierInquiryState = INITIAL_INQUIRY) {
  const selected = lines.filter(line => !orderId || line.orderId === orderId).flatMap(line => {
    const statuses = conditions.filter(c => c.lineIds.includes(line.id)).map(c => conditionStatus(c, state, material));
    const status: ExposureStatus = statuses.includes("confirmed") ? "confirmed" : statuses.includes("under-review") ? "under-review" : "closed";
    return status === "closed" ? [] : [{ ...line, status }];
  });
  const cents = (status?: ExposureStatus) => selected.filter(line => !status || line.status === status).reduce((total, line) => total + line.committedCents, 0);
  return { totalCents: cents(), reviewCents: cents("under-review"), confirmedCents: cents("confirmed"), orders: new Set(selected.map(l => l.orderId)).size, suppliers: new Set(selected.map(l => l.supplierId)).size, lines: selected };
}
/** The underlying linked value remains in the case when one condition closes. */
export function linkedPurchaseValue(orderId: string, supplierId: string) {
  const lines = PURCHASE_LINES.filter(line => line.orderId === orderId && line.supplierId === supplierId);
  if (!lines.length) return undefined;
  return { amount: lines.reduce((sum, line) => sum + line.committedCents, 0) / 100, currency: COMMERCIAL_SNAPSHOT.currency, orderLineIds: lines.map(line => line.id), source: COMMERCIAL_SNAPSHOT.source, asOf: COMMERCIAL_SNAPSHOT.asOf, basis: COMMERCIAL_SNAPSHOT.basis };
}
export const formatUSD = (cents: number, compact = true): string => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: compact ? "compact" : "standard", minimumFractionDigits: compact && Math.abs(cents) >= 100_000_000 ? 1 : 0, maximumFractionDigits: compact ? 1 : 0 }).format(cents / 100);

/** A separate authored lender-status snapshot. No saved-revenue claim. */
export const CAPITAL_SNAPSHOT = {
  asOf: COMMERCIAL_SNAPSHOT.asOf,
  source: "Illustrative financier records",
  currency: "USD",
  suppliersByTier: [24, 13, 5],
  thisWeek: { cents: 30_000_000, pathways: 8 },
  pathways: [
    { orderId: "c2", disbursedCents: 110_000_000, sanctionedUndisbursedCents: 40_000_000, suppliers: 24 },
    { orderId: "c5", disbursedCents: 70_000_000, sanctionedUndisbursedCents: 20_000_000, suppliers: 18 },
  ],
} as const;
export function capitalTotals() {
  return { disbursedCents: CAPITAL_SNAPSHOT.pathways.reduce((s, p) => s + p.disbursedCents, 0), sanctionedUndisbursedCents: CAPITAL_SNAPSHOT.pathways.reduce((s, p) => s + p.sanctionedUndisbursedCents, 0), suppliers: CAPITAL_SNAPSHOT.pathways.reduce((s, p) => s + p.suppliers, 0), tiers: CAPITAL_SNAPSHOT.suppliersByTier.filter(Boolean).length };
}
