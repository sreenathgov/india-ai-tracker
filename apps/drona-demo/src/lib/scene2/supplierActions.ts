/**
 * Which of an order's suppliers need someone to act, and why.
 *
 * ── Synthetic demo state, authored by hand. ───────────────────────────────────
 * The demo's model holds no action state: no evidence due dates, no milestone
 * history, no open questions. So "needs action" cannot be derived from it, and it
 * is not inferred. It is written down here, per order and per supplier, where it
 * can be read and argued with.
 *
 * It is deliberately **not** "critical". Every critical supplier on Wind Energy is
 * here, but so are three elevated ones: a window that is narrowing, a milestone
 * the supplier moved, an allocation nobody has confirmed. A low-band supplier
 * needing action would be just as legitimate; none is authored.
 *
 * The one reason with a figure in it — a closing window — takes that figure from
 * the order's own coverage and margin (see `windowDays` in `supplierView.ts`), so
 * the note cannot disagree with the numbers beside it.
 */

export type ActionReason = "window" | "evidence" | "milestone" | "clarification";

export const ACTION_REASON_LABEL: Readonly<Record<ActionReason, string>> = {
  window: "Window closing",
  evidence: "Evidence overdue",
  milestone: "Milestone moved",
  clarification: "Clarification needed",
};

export interface SupplierAction {
  readonly reason: ActionReason;
  /** One line, in the reviewer's words. */
  readonly note: string;
}

type Entry = { readonly reason: "window" } | { readonly reason: Exclude<ActionReason, "window">; readonly note: string };

/** Keyed by commitment, then by supplier name as the gazetteer spells it. */
export const ACTION_TABLE: Readonly<Record<string, Readonly<Record<string, Entry>>>> = {
  c1: {
    "Deccan Mainshaft Forgings": { reason: "window" },
    "Saurashtra Ductile Castings": {
      reason: "evidence",
      note: "Coverage confirmation for the hub casting lot is overdue",
    },
    "Kovai Castings & Machining": {
      reason: "clarification",
      note: "Sole approved source; alternative-source status unconfirmed",
    },
    "Tiruchi Tower Sections": { reason: "clarification", note: "CBAM shipment scope and importer readiness need owner confirmation" },
    "Ludhiana Ring Forgings": { reason: "evidence", note: "Heat-treatment certificate for the flange lot is overdue" },
    "Rourkela Plate Mills": { reason: "window" },
    "Vadodara Converter Assemblies": { reason: "milestone", note: "Factory acceptance test moved back two weeks" },
    "Padappai Yaw Bearings": {
      reason: "clarification",
      note: "Allocation of the bearing lot to this order is unconfirmed",
    },
  },
  c2: {
    "Bhiwadi Transformer Works": { reason: "window" },
    "Belagavi Aerospace Forgings": { reason: "evidence", note: "Bolt material certificates are overdue" },
    "Tiruchi Tower Sections": {
      reason: "clarification",
      note: "Upper-section split between this order and Wind Energy is unconfirmed",
    },
  },
};

const plural = (n: number): string => `${n} ${n === 1 ? "day" : "days"}`;

/** The action on one supplier for one order, or null when none is authored. */
export function actionFor(commitmentId: string, supplierName: string, windowDays: number): SupplierAction | null {
  const entry = ACTION_TABLE[commitmentId]?.[supplierName];
  if (!entry) return null;
  return entry.reason === "window"
    ? { reason: "window", note: `Intervention window closes in ${plural(windowDays)}` }
    : { reason: entry.reason, note: entry.note };
}
