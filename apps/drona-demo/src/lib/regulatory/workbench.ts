import type { SupplierRecord } from "@/lib/scene2/supplierView";
import { REGULATORY_CASE, FINDING_LABEL, findingClosed, findingFor, type RegulatoryState } from "./state";
/** Keep the BOM's planning band; project only the regulatory action state. */
export function withRegulatoryActions(records: readonly SupplierRecord[], state: RegulatoryState): readonly SupplierRecord[] {
  const finding = findingFor(state);
  return records.map((r) => r.supplier.id !== REGULATORY_CASE.supplierId || r.band === null ? r : {
    ...r, action: findingClosed(finding) ? null : { reason: "clarification" as const, note: `EU CBAM · ${FINDING_LABEL[finding].toLowerCase()}` },
  });
}
