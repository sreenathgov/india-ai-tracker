"use client";

import * as React from "react";

import type { BandCounts, BandFilter, SupplierSort, WorkbenchState } from "@/lib/scene2/supplierView";
import { cn } from "@/lib/ui/cn";

const BANDS: readonly { readonly value: BandFilter; readonly label: string }[] = [
  { value: "all", label: "All" },
  { value: "critical", label: "Critical" },
  { value: "elevated", label: "Elevated" },
  { value: "low", label: "Low" },
];

/**
 * The workbench's two questions, asked separately: which band, and does it need
 * someone. A segmented band control over the assessed counts, a Needs action toggle
 * beside it, and the sort tucked to the right. Counts are the assessment's; they
 * do not move when a filter narrows the results.
 */
export function WorkbenchFilters({
  counts,
  state,
  onChange,
}: {
  readonly counts: BandCounts;
  readonly state: WorkbenchState;
  readonly onChange: (patch: Partial<WorkbenchState>) => void;
}): React.ReactElement {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2" data-workbench-filters>
      <div role="group" aria-label="Filter by planning priority" className="inline-flex items-center gap-0.5 rounded-full bg-quiet p-[3px]">
        {BANDS.map(({ value, label }) => (
          <BandSegment
            key={value}
            value={value}
            label={label}
            count={counts[value]}
            active={state.band === value}
            onSelect={() => onChange({ band: value })}
          />
        ))}
      </div>

      <button
        type="button"
        aria-pressed={state.needsAction}
        onClick={() => onChange({ needsAction: !state.needsAction })}
        className={cn(
          "inline-flex h-[34px] items-center gap-1.5 rounded-full border px-3 text-caption transition-[color,background-color,border-color,box-shadow] duration-hover ease-overlay",
          state.needsAction
            ? "border-transparent bg-sheet font-medium text-label-primary shadow-lift"
            : "border-card-edge text-label-secondary hover:border-card-edge-strong hover:text-label-primary"
        )}
      >
        Needs action
        <span className="tabular-nums text-label-tertiary">{counts.needsAction}</span>
      </button>

      <label className="ml-auto inline-flex items-center gap-1.5 text-caption text-label-tertiary">
        Sort
        <select
          value={state.sort}
          onChange={(e) => onChange({ sort: e.target.value as SupplierSort })}
          className="h-7 cursor-pointer rounded-full bg-transparent px-1.5 text-caption font-medium text-label-secondary transition-colors hover:bg-quiet hover:text-label-primary"
        >
          <option value="attention">Attention</option>
          <option value="name">Name A–Z</option>
        </select>
      </label>
    </div>
  );
}

function BandSegment({
  value,
  label,
  count,
  active,
  onSelect,
}: {
  readonly value: BandFilter;
  readonly label: string;
  readonly count: number;
  readonly active: boolean;
  readonly onSelect: () => void;
}): React.ReactElement {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onSelect}
      className={cn(
        "inline-flex h-7 items-center gap-1.5 rounded-full px-3 text-caption transition-[color,background-color,box-shadow] duration-hover ease-overlay",
        active
          ? "bg-sheet font-medium text-label-primary shadow-lift"
          : "text-label-tertiary hover:text-label-primary"
      )}
    >
      {label}
      <span className={cn("tabular-nums", active ? "text-label-secondary" : "text-label-quaternary")}>{count}</span>
    </button>
  );
}
