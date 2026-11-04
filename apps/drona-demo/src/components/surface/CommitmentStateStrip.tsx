import * as React from "react";

import { Surface } from "@/components/bento/Surface";
import { StateDot } from "@/components/ui/StateDot";
import { STATE_LABEL, STATE_ORDER, portfolioSummary, type CommitmentState } from "@/lib/portfolio/portfolio";
import { cn } from "@/lib/ui/cn";
import type { SurfaceFilter } from "./filter";

/**
 * B — where the portfolio stands, in one line. The three workflow states are the
 * only controls (each filters the commitments below it); the dependency count and
 * the tightest window are read, not clicked.
 */
export function CommitmentStateStrip({
  filter,
  onFilterState,
  className,
}: {
  readonly filter: SurfaceFilter;
  readonly onFilterState: (state: CommitmentState) => void;
  readonly className?: string;
}): React.ReactElement {
  const s = portfolioSummary();
  return (
    <Surface weight="supporting" material="bare" className={className} bodyClassName="justify-center px-1 py-1">
      <h2 className="sr-only">Commitment state</h2>
      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-2 min-[1400px]:flex-nowrap">
        {STATE_ORDER.map((state) => {
          const active = filter?.kind === "state" && filter.state === state;
          return (
            <button
              key={state}
              type="button"
              aria-pressed={active}
              aria-label={`${STATE_LABEL[state]}: ${s.byState[state]}. Filter commitments`}
              onClick={() => onFilterState(state)}
              className={cn(
                "h-8 shrink-0 rounded-full px-3 transition-[background-color,box-shadow] duration-hover ease-overlay",
                active ? "bg-sheet shadow-lift" : "bg-quiet hover:bg-sheet hover:shadow-lift"
              )}
            >
              <span className="inline-flex items-center gap-1.5 text-caption">
                <StateDot state={state} />
                <span className="font-medium text-label-secondary">{STATE_LABEL[state]}</span>
                <span className="tabular text-label-quaternary">{s.byState[state]}</span>
              </span>
            </button>
          );
        })}
        <span className="ml-auto flex items-center gap-4 pl-2">
          <Fact value={s.criticalDependencies} label="dependencies" title="Critical dependencies across active commitments" />
          <Fact
            value={`${s.earliestWindowDays}d`}
            label="to EU entry"
            title="Time from demo assessment to planned EU entry; preparation time is not yet evidenced"
            emphasis
          />
        </span>
      </div>
    </Surface>
  );
}


function Fact({
  value,
  label,
  emphasis = false,
  title,
}: {
  readonly value: React.ReactNode;
  readonly label: React.ReactNode;
  readonly emphasis?: boolean;
  readonly title?: string;
}): React.ReactElement {
  return (
    <span title={title} className="inline-flex shrink-0 items-baseline gap-1.5 whitespace-nowrap text-caption text-label-tertiary">
      <span data-figure className={cn("font-medium", emphasis ? "text-state-action-ink" : "text-label-primary")}>
        {value}
      </span>
      {label}
    </span>
  );
}
