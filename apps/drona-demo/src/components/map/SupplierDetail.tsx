"use client";

import * as React from "react";

import { commitmentById } from "@/lib/network/gazetteer";
import type { Approval, Sourcing, Supplier } from "@/lib/network/types";
import { CONCERN_LABEL, ConcernMark } from "@/components/ui/ConcernMark";

const SOURCING_LABEL: Record<Sourcing, string> = {
  sole: "Sole source",
  dual: "Dual source",
  multi: "Multiple sources",
};

const APPROVAL_LABEL: Record<Approval, string> = {
  approved: "Approved",
  conditional: "Conditionally approved",
  "in-qualification": "In qualification",
};

/**
 * The supplier record, pinned by a click.
 *
 * Where the hover card answers "which one is this", the pinned panel answers "what
 * do we depend on it for" — the fields a buyer would reach for before picking up the
 * phone: what we buy, how replaceable it is, how long it takes, and which orders it
 * feeds. Nothing here is a judgement Drona made; every line is a field on the record.
 */
export function SupplierDetail({
  supplier,
  onClose,
}: {
  readonly supplier: Supplier;
  readonly onClose: () => void;
}): React.ReactElement {
  const commitments = supplier.commitmentIds
    .map((id) => commitmentById(id))
    .filter((c) => c !== undefined);

  return (
    <aside
      aria-label={`${supplier.name} — supplier record`}
      className="absolute bottom-3 right-3 top-14 z-30 flex w-[288px] animate-fade-rise flex-col overflow-hidden rounded-card border border-separator bg-[color:var(--bg-map-popover)] shadow-popover backdrop-blur-sm"
    >
      <header className="flex items-start gap-3 border-b border-separator p-4">
        <div className="min-w-0 flex-1">
          <p className="text-body-s font-medium text-label-primary">{supplier.name}</p>
          <p className="mt-1 text-caption text-label-secondary">
            {supplier.city}, {supplier.region}, {supplier.country}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close supplier record"
          className="-mr-1 -mt-1 rounded-pill px-2 py-1 text-body-s text-label-tertiary hover:bg-inset hover:text-label-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-label-quaternary"
        >
          ×
        </button>
      </header>

      <dl className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4 text-caption">
        <Field label="Current state">
          <span className="flex items-center gap-2">
            <ConcernMark concern={supplier.concern} size={11} />
            {CONCERN_LABEL[supplier.concern]}
          </span>
        </Field>
        <Field label="Tier">Tier 1 · {supplier.category}</Field>
        <Field label="Supplies">{supplier.supplies.join(", ")}</Field>
        <Field label="Sourcing">{SOURCING_LABEL[supplier.sourcing]}</Field>
        <Field label="Qualification">{APPROVAL_LABEL[supplier.approval]}</Field>
        <Field label="Lead time">
          <span data-figure>{supplier.leadTimeDays}</span> days
        </Field>
        <Field label="Certificates on file">
          {supplier.certifications.length > 0
            ? supplier.certifications.join(" · ")
            : "None on file"}
        </Field>
        <Field label="Active production commitments">
          {commitments.length === 0 ? (
            "None"
          ) : (
            <ul className="space-y-1">
              {commitments.map((c) => (
                <li key={c.id}>{c.name}</li>
              ))}
            </ul>
          )}
        </Field>
      </dl>
    </aside>
  );
}

function Field({
  label,
  children,
}: {
  readonly label: string;
  readonly children: React.ReactNode;
}): React.ReactElement {
  return (
    <div>
      <dt className="text-label-tertiary">{label}</dt>
      <dd className="mt-0.5 text-label-primary">{children}</dd>
    </div>
  );
}
