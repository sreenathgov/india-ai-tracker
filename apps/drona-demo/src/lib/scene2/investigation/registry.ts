/**
 * The authored investigations, keyed by order and supplier.
 *
 * Nothing is generated here. A supplier without an authored case returns null,
 * and the workspace shows an honest fallback rather than borrowing another
 * supplier's reasoning.
 */
import type { SupplierInvestigation } from "./types";
import { DECCAN } from "./cases/deccan";
import { DURGAPUR } from "./cases/durgapur";
import { KOVAI } from "./cases/kovai";
import { SAURASHTRA } from "./cases/saurashtra";
import { TIRUCHI } from "./cases/tiruchi";

export const INVESTIGATIONS: readonly SupplierInvestigation[] = [
  SAURASHTRA,
  DECCAN,
  TIRUCHI,
  DURGAPUR,
];

/** Supplied historical engineering records; outside the active predictive scope. */
export const CONTEXT_ONLY_INVESTIGATIONS = [KOVAI] as const;

const key = (orderId: string, supplierId: string): string => `${orderId}:${supplierId}`;

const BY_KEY: ReadonlyMap<string, SupplierInvestigation> = new Map(
  INVESTIGATIONS.map((inv) => [key(inv.orderId, inv.supplierId), inv])
);

/** The investigation for this supplier on this order, or null where none is authored. */
export const investigationFor = (
  orderId: string,
  supplierId: string
): SupplierInvestigation | null => BY_KEY.get(key(orderId, supplierId)) ?? null;
