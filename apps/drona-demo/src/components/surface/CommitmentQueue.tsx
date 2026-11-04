"use client";
import * as React from "react";
import { useSupplierInquiry } from "@/components/scene2/investigation/overview/SupplierInquiryProvider";
import { useRegulatoryCase } from "@/components/regulatory/RegulatoryProvider";

import { Surface } from "@/components/bento/Surface";
import { Icon } from "@/components/ui/Icon";
import {
  DEPENDENCY_TYPES,
  STATE_LABEL,
  portfolioRows,
  type PortfolioRow,
} from "@/lib/portfolio/portfolio";
import { cn } from "@/lib/ui/cn";
import { FinancialExposure } from "./FinancialExposure";
import { ASSESSED_COMMERCIAL_ORDERS, exposureSummary, formatUSD } from "@/lib/portfolio/commercial";
import styles from "./FinancialExposure.module.css";
import { applyFilter, type SurfaceFilter } from "./filter";

const FOCUS =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-label-quaternary";

const DUE = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });

/** "100 Wind Turbines — Wind Energy Coastal Programme" → "Wind Energy Coastal Programme". */
const shortName = (name: string): string => name.split(" — ")[1] ?? name;

function filterLabel(filter: NonNullable<SurfaceFilter>): string {
  return filter.kind === "state"
    ? STATE_LABEL[filter.state]
    : DEPENDENCY_TYPES.find((t) => t.id === filter.type)?.label ?? filter.type;
}

/**
 * D — the main work surface. Every commitment, grouped by what it needs from the
 * reviewer. A consistent grid separates order identity, exposure and delivery
 * context. The recommendation strengthens the name without nesting another card;
 * opening is still the reviewer's deliberate action.
 * Opening a row is the only move on Scene 1 that leaves Scene 1.
 */
export function CommitmentQueue({
  filter,
  onClearFilter,
  onOpen,
  onEmphasis,
  className,
}: {
  readonly filter: SurfaceFilter;
  readonly onClearFilter: () => void;
  readonly onOpen: (commitmentId: string) => void;
  readonly onEmphasis: (commitmentId: string | null) => void;
  readonly className?: string;
}): React.ReactElement {
  const { state } = useRegulatoryCase();
  const { state: material } = useSupplierInquiry();
  const allRows = portfolioRows(state);
  const rows = applyFilter(allRows, filter);
  return (
    <Surface
      surfaceId="commitments"
      title="Production commitments"
      weight="primary"
      material="sunk"
      className={cn(styles.queue, className)}
      bodyClassName={`px-3 pb-3 ${styles.queueBody}`}
      actions={filter ? <FilterChip label={filterLabel(filter)} onClear={onClearFilter} /> : null}
    >
      <FinancialExposure />
      <div data-production-orders tabIndex={0} aria-label="Production order list" className={styles.orderList} onMouseLeave={() => onEmphasis(null)}>
        {(["action", "monitoring", "new"] as const).map((state) => {
          const group = rows.filter((r) => r.state === state);
          if (group.length === 0) return null;
          return (
            <section key={state} aria-label={STATE_LABEL[state]}>
              <h3 className={styles.groupHeading}>
                <span>{STATE_LABEL[state]}</span>
                <span data-figure>{group.length}</span>
              </h3>
              <ul className={styles.groupRows}>
                {group.map((row) => (
                  <li key={row.commitment.id}>
                    <QueueRow row={row} onOpen={onOpen} onEmphasis={onEmphasis} />
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
        {rows.length === 0 ? (
          <p className="px-3 text-caption text-label-tertiary">No commitment carries this filter.</p>
        ) : null}
      </div>
    </Surface>
  );
}

function FilterChip({ label, onClear }: { readonly label: string; readonly onClear: () => void }): React.ReactElement {
  return (
    <span className="inline-flex h-7 items-center gap-1 rounded-full bg-sheet pl-2.5 pr-1 text-caption text-label-secondary shadow-lift motion-safe:animate-fade-in">
      <Icon name="filter" className="h-3 w-3 text-label-tertiary" />
      <span className="text-label-primary">{label}</span>
      <button
        type="button"
        onClick={onClear}
        aria-label={`Clear filter: ${label}`}
        className="grid h-5 w-5 place-items-center rounded-full text-label-tertiary transition-colors duration-hover hover:bg-quiet hover:text-label-primary"
      >
        <Icon name="close" className="h-3 w-3" />
      </button>
    </span>
  );
}

function QueueRow({
  row,
  onOpen,
  onEmphasis,
}: {
  readonly row: PortfolioRow;
  readonly onOpen: (commitmentId: string) => void;
  readonly onEmphasis: (commitmentId: string | null) => void;
}): React.ReactElement {
  const { state } = useRegulatoryCase();
  const { state: material } = useSupplierInquiry();
  const exposure = exposureSummary(state, row.commitment.id, undefined, undefined, material);
  const assessed = ASSESSED_COMMERCIAL_ORDERS.some(id => id === row.commitment.id);
  const id = row.commitment.id;
  const due = DUE.format(new Date(row.commitment.requiredBy));
  const next = row.recommended;
  // Keep the full existing finding available. One decision cue is displayed;
  // all source cues remain in the accessible name and the order workspace.
  const cue = row.state === "new" ? row.cues[0] : row.cues[row.cues.length - 1];
  return (
    <button
      type="button"
      data-guide-target={`order:${id}`}
      data-recommended={next}
      onClick={() => onOpen(id)}
      onMouseEnter={() => onEmphasis(id)}
      onFocus={() => onEmphasis(id)}
      onBlur={() => onEmphasis(null)}
      aria-label={`${next ? "Next thread. " : ""}${row.commitment.name}, ${STATE_LABEL[row.state]}. ${row.cues.join(". ")}. ${assessed ? `${formatUSD(exposure.totalCents)} linked purchase commitments` : "Awaiting assessment"}. Due ${due}. Open.`}
      className={cn(styles.orderRow, FOCUS)}
    >
      <span className={styles.orderIdentity}>
        <span data-order-title className={styles.orderTitle}>{shortName(row.commitment.name)}</span>
      </span>
      <span data-order-exposure={id} className={styles.orderValue}>
        {assessed ? <>
          <strong data-figure>{formatUSD(exposure.totalCents)}</strong>
          <span>{exposure.confirmedCents > 0 ? "Includes confirmed exposure" : exposure.totalCents > 0 ? "Under review" : "No open valued exposure"}</span>
        </> : <span className={styles.unassessed}>Awaiting assessment</span>}
      </span>
      <span className={styles.orderCue}>{cue}</span>
      <span className={styles.orderContext}>
        <span>Due <span data-figure>{due}</span></span>
        <span>{row.destination.country}</span>
        <span><span data-figure>{row.commitment.units}</span> units</span>
      </span>
      <span aria-hidden="true" className={styles.openOrder}>Open order <Icon name="arrow" className="h-3.5 w-3.5" /></span>
    </button>
  );
}
