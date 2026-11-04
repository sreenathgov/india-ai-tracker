"use client";

import * as React from "react";

import { ConcernMark } from "@/components/ui/ConcernMark";
import {
  bandedFor,
  bomCommitment,
  componentsInBand,
  rollupFor,
  unitsExposed,
  type BandedComponent,
  type RiskBand,
} from "@/lib/network/bom";
import { tracedComponents } from "@/lib/network/dependencies";
import { cn } from "@/lib/ui/cn";

const BAND_TITLE: Readonly<Record<RiskBand, string>> = {
  low: "Low current concern",
  elevated: "Elevated risk",
  critical: "Critical risk",
};

/**
 * One card, itemised.
 *
 * A bento card is a claim — *91 components, 18 suppliers, 37 turbines* — and a claim
 * the reviewer cannot open is a claim they are being asked to take on trust. This is
 * the card opened: every assembly in the band, each carrying the one sentence that
 * put it there. The sentence is `bandFor`'s own, so the list cannot give a reason the
 * model did not.
 *
 * **It replaces the cards rather than sitting under them.** One dominant question per
 * screen: while the reviewer is reading what is in the elevated band, the other two
 * bands are not what they are asking about. Back — or Escape — puts the cards back.
 *
 * Each row draws its mechanism as well as stating it: coverage against lead time,
 * and against lead time plus the programme's margin. That is the whole of how a band
 * is decided, so it is the one picture worth drawing. The rows are ordered by the
 * turbines they reach, because consequence is what the reviewer is choosing between.
 */
export function BandComponents({
  commitmentId,
  band,
  onClose,
  onOpenComponent,
}: {
  readonly commitmentId: string;
  readonly band: RiskBand;
  /** Omitted where the list is the whole view rather than a card opened from one. */
  readonly onClose?: () => void;
  readonly onOpenComponent: (componentId: string) => void;
}): React.ReactElement {
  const rows = React.useMemo(
    () => componentsInBand(band, bandedFor(commitmentId)),
    [band, commitmentId]
  );
  const rollup = rollupFor(commitmentId)[band];
  const margin = bomCommitment(commitmentId).marginDays;
  /* Only assemblies whose upstream Drona has actually traced can be opened. The
     others say so, rather than opening onto a pathway with nothing in it. */
  const traced = React.useMemo(
    () => new Set(tracedComponents(commitmentId).map((c) => c.id)),
    [commitmentId]
  );

  const headingRef = React.useRef<HTMLHeadingElement | null>(null);
  React.useEffect(() => {
    headingRef.current?.focus();
  }, [band]);

  return (
    <section
      aria-labelledby="band-title"
      className="motion-safe:animate-fade-rise"
    >
      <header className="flex flex-wrap items-start gap-x-6 gap-y-3">
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="-ml-3 flex shrink-0 items-center gap-2 rounded-chip px-3 py-2 text-caption text-label-tertiary motion-safe:transition-colors motion-safe:duration-fast hover:bg-raised hover:text-label-secondary"
          >
            <svg aria-hidden="true" width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path
                d="M10 3.5 5.5 8 10 12.5"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            All exposure
            <span aria-hidden="true" className="ml-1 text-label-quaternary">
              Esc
            </span>
          </button>
        ) : null}

        <div className="min-w-0 flex-1">
          <h2
            id="band-title"
            ref={headingRef}
            tabIndex={-1}
            className="flex items-center gap-3 text-heading text-label-primary outline-none"
          >
            <ConcernMark concern={band} size={13} />
            {BAND_TITLE[band]}
          </h2>
          <p className="mt-2 max-w-measure text-caption text-label-secondary" data-figure>
            {rollup.parts} {rollup.parts === 1 ? "component" : "components"} from{" "}
            {rollup.suppliers} {rollup.suppliers === 1 ? "supplier" : "suppliers"}, reaching{" "}
            {rollup.turbines} turbines. Ordered by how many turbines each one reaches;
            every line says why it sits here. Each bar is confirmed coverage, measured
            against the lead time and against the lead time plus this order&rsquo;s{" "}
            {margin} days of margin.
          </p>
        </div>
      </header>

      <ul className="mt-6 rounded-card bg-surface px-6 shadow-card">
        {rows.map((row) => (
          <Row
            key={row.component.id}
            row={row}
            margin={margin}
            onOpen={
              traced.has(row.component.id)
                ? () => onOpenComponent(row.component.id)
                : undefined
            }
            untraced={band === "critical" && !traced.has(row.component.id)}
          />
        ))}
      </ul>
    </section>
  );
}

function Row({
  row,
  margin,
  onOpen,
  untraced,
}: {
  readonly row: BandedComponent;
  readonly margin: number;
  readonly onOpen?: () => void;
  readonly untraced: boolean;
}): React.ReactElement {
  const { component, supplier } = row;
  const units = unitsExposed(component);

  return (
    /* Two rows whatever the width: this list now sits in the production view's middle
     column, which is narrow at every viewport, so a viewport breakpoint would lie. */
    <li className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-6 gap-y-3 border-b border-separator py-5 last:border-b-0">
      <div className="min-w-0">
        <p className="text-body-s text-label-primary">{component.name}</p>
        <p className="mt-0.5 text-caption text-label-tertiary">
          {supplier.name} · {supplier.city}
        </p>
        <p className="mt-3 max-w-measure text-caption leading-relaxed text-label-secondary" data-figure>
          {row.because}
        </p>
      </div>

      <div className="col-span-2 row-start-2 max-w-[420px]">
        <CoverageBar
          coverage={component.coverageDays}
          lead={component.leadTimeDays}
          margin={margin}
        />
        <p className="mt-2 font-mono text-mono-s text-label-tertiary" data-figure>
          {component.coverageDays} d cover · {component.leadTimeDays} d lead
        </p>
      </div>

      <div className="flex flex-col items-end gap-2 text-right">
        <p className="text-body-s text-label-primary" data-figure>
          {units} turbines
        </p>
        <p className="font-mono text-mono-s text-label-quaternary" data-figure>
          Units {component.turbines.from}–{component.turbines.to}
        </p>
        {onOpen ? (
          <button
            type="button"
            onClick={onOpen}
            aria-label={`Open the pathway for ${component.name}`}
            className="group mt-1 flex items-center gap-1.5 text-caption text-label-secondary hover:text-label-primary"
          >
            Open pathway
            <svg
              aria-hidden="true"
              width="12"
              height="12"
              viewBox="0 0 16 16"
              fill="none"
              className="motion-safe:transition-transform motion-safe:duration-fast group-hover:translate-x-0.5"
            >
              <path
                d="M6 3.5 10.5 8 6 12.5"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        ) : null}
        {/* Geist Italic, for the one kind of sentence it is reserved for: a
            statement about the limit of what Drona knows. */}
        {untraced ? (
          <p className="mt-1 text-caption italic text-label-tertiary">
            Upstream not yet traced
          </p>
        ) : null}
      </div>
    </li>
  );
}

/**
 * The mechanism, drawn.
 *
 * A track to whichever is further out — the coverage or the lead time plus margin —
 * with the coverage filled in and two ticks: the lead time, which coverage must reach
 * for the order to be recoverable at all, and the lead time plus margin, which it
 * must reach to be recoverable comfortably. Whether the fill clears each tick *is*
 * the band. No colour is needed to say which band this is; the geometry already does.
 */
export function CoverageBar({
  coverage,
  lead,
  margin,
}: {
  readonly coverage: number;
  readonly lead: number;
  readonly margin: number;
}): React.ReactElement {
  const span = Math.max(coverage, lead + margin);
  const pct = (days: number): string => `${(days / span) * 100}%`;

  return (
    <div aria-hidden="true" className="relative mt-1.5 h-[6px] w-full rounded-full bg-inset">
      <div
        className="absolute inset-y-0 left-0 rounded-full bg-label-tertiary"
        style={{ width: pct(coverage) }}
      />
      <Tick at={pct(lead)} className="bg-label-primary" />
      <Tick at={pct(lead + margin)} className="bg-label-quaternary" />
    </div>
  );
}

function Tick({
  at,
  className,
}: {
  readonly at: string;
  readonly className: string;
}): React.ReactElement {
  return (
    <span
      className={cn("absolute -top-[3px] h-[12px] w-[1.5px] -translate-x-1/2", className)}
      style={{ left: at }}
    />
  );
}
