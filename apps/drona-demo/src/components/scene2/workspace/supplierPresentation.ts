import { deccanInquiry, INITIAL_INQUIRY, MATERIAL_CASE, MATERIAL_FINDING_LABEL, type SupplierInquiryState } from "@/lib/scene2/investigation/inquiry";
import type { SupplierRecord } from "@/lib/scene2/supplierView";
import { FINDING_LABEL, REGULATORY_CASE, findingFor, type RegulatoryState } from "@/lib/regulatory/state";

/** One presentation projection for Cards and List. No assessment or case state is changed. */
export function supplierPresentation(record: SupplierRecord, commitmentId: string, regulatory: RegulatoryState, material: SupplierInquiryState = INITIAL_INQUIRY) {
  const component = record.onOrder?.map(c => c.name).join(", ") || "Not in snapshot";
  if (record.band === null) return { component, category: "Not assessed", summary: "Awaiting assessment" };
  if (commitmentId === MATERIAL_CASE.orderId && record.supplier.id === MATERIAL_CASE.supplierId) {
    const decision = deccanInquiry(material);
    return { component, category: "Material availability", summary: decision.finding === "forecast-review" ? "Billet receipt may miss 12 Nov · 4 days to act" : MATERIAL_FINDING_LABEL[decision.finding] };
  }
  if (commitmentId === REGULATORY_CASE.orderId && record.supplier.id === REGULATORY_CASE.supplierId) {
    return { component, category: "Regulatory requirements", summary: `CBAM · ${FINDING_LABEL[findingFor(regulatory)].toLowerCase()}` };
  }
  if (commitmentId === "c1" && record.supplier.id === "sup:nashik-gearbox-assemblies") return { component, category: "Production capacity", summary: "Production slot and material allocation under review" };
  const action = record.action;
  if (action?.reason === "window") return { component, category: "Timing", summary: action.note.startsWith("Historical") ? "Action window elapsed; refresh needed" : action.note };
  if (action?.reason === "milestone") return { component, category: "Production schedule", summary: "Acceptance test moved back two weeks" };
  if (action?.reason === "evidence") return { component, category: "Evidence needed", summary: record.supplier.name === "Saurashtra Ductile Castings" ? "Material coverage confirmation overdue" : "Certificate evidence overdue" };
  if (action?.reason === "clarification") return { component, category: record.supplier.name === "Kovai Castings & Machining" ? "Sourcing dependency" : "Material allocation", summary: record.supplier.name === "Kovai Castings & Machining" ? "Alternative source unconfirmed" : "Order allocation unconfirmed" };
  return { component, category: "Planning coverage", summary: record.lead ? `${record.lead.coverageDays} days’ cover · ${record.lead.leadTimeDays}-day lead time` : "Coverage not recorded" };
}
