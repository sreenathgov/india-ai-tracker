/**
 * The order workspace's baseline — what the planning snapshot says about one order,
 * before Drona has said anything.
 *
 * Everything here is read from the existing synthetic fixtures. Nothing is scored.
 * Where the snapshot does not carry a field, the field is reported as absent rather
 * than filled in: the brief lists it under missing inputs, and the workbench says
 * "Not in snapshot" in the place a value would have gone.
 */
import { bomFor, hasBom, totalParts, type ComponentGroup } from "@/lib/network/bom";
import { suppliersForCommitment } from "@/lib/network/gazetteer";
import type { Supplier } from "@/lib/network/types";

export interface PlannedSupplier {
  readonly supplier: Supplier;
  /** The assemblies this supplier delivers on THIS order, or null when the order has no BOM. */
  readonly onOrder: readonly ComponentGroup[] | null;
}

/** The order's direct (Tier-1) suppliers. One array, read by both Cards and List. */
export function plannedSuppliers(commitmentId: string): readonly PlannedSupplier[] {
  const bom = hasBom(commitmentId) ? bomFor(commitmentId) : null;
  return suppliersForCommitment(commitmentId).map((supplier) => ({
    supplier,
    onOrder: bom ? bom.filter((c) => c.supplierId === supplier.id) : null,
  }));
}

export interface BomSummary {
  readonly assemblies: number;
  readonly parts: number;
}

export const bomSummary = (commitmentId: string): BomSummary | null => {
  if (!hasBom(commitmentId)) return null;
  const bom = bomFor(commitmentId);
  return { assemblies: bom.length, parts: totalParts(bom) };
};

/**
 * Inputs a planner would expect in the snapshot that this demo does not hold.
 * BOM revision and the customer PO are absent for every order; the BOM itself only
 * for orders without one.
 */
export function missingInputs(commitmentId: string): readonly string[] {
  return [
    ...(hasBom(commitmentId) ? [] : ["Bill of materials"]),
    "BOM revision",
    "Customer PO (only one order reference is held)",
  ];
}
