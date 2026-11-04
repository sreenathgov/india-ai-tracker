import * as React from "react";

import { StatusMark } from "@/components/ui/StatusMark";
import { commitmentById, destinationById } from "@/lib/network/gazetteer";
import { stateOf } from "@/lib/portfolio/portfolio";
import { cn } from "@/lib/ui/cn";
import { AssessmentChip } from "./AssessmentChip";
import { formatDay } from "./format";
import type { Assessment } from "./useAssessment";

const FOCUS =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-label-quaternary";

/**
 * The order, full width: which order, for whom, by when, and where its assessment
 * stands. The analysis action lives here — the one place a reviewer starts a run.
 *
 * Production lifecycle (New / Action / Monitoring) and assessment status are shown
 * side by side because they are different facts: an order can be New and assessed,
 * or in Action with a refresh running.
 */
export function OrderHeader({
  commitmentId,
  assessment,
  onBack,
  className,
}: {
  readonly commitmentId: string;
  readonly assessment: Assessment;
  readonly onBack: () => void;
  readonly className?: string;
}): React.ReactElement | null {
  const commitment = commitmentById(commitmentId);
  if (!commitment) return null;
  const destination = destinationById(commitment.destinationId);
  const lifecycle = stateOf(commitmentId);

  return (
    <section
      aria-label="Production order"
      className={cn(
        "sheet-material flex flex-wrap items-center gap-x-8 gap-y-4 rounded-surface px-6 py-4",
        className
      )}
    >
      <div className="min-w-0 flex-1">
        <button
          type="button"
          onClick={onBack}
          className={cn(
            "-ml-2 mb-1 inline-flex items-center gap-1.5 rounded-chip px-2 py-1 text-caption text-label-tertiary",
            "motion-safe:transition-colors motion-safe:duration-fast hover:bg-quiet hover:text-label-primary",
            FOCUS
          )}
        >
          <svg aria-hidden="true" width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M10 3.5 5.5 8 10 12.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Portfolio
        </button>
        <h1 className="text-title-m text-label-primary">{commitment.name}</h1>
        <p className="mt-1.5 flex flex-wrap items-baseline gap-x-5 gap-y-1 text-caption text-label-tertiary">
          <span>
            <span className="text-label-secondary">{commitment.buyer}</span>
            {destination ? ` · ${destination.city}, ${destination.country}` : null}
          </span>
          <span>
            <span className="tabular text-label-secondary">{commitment.units}</span> units
          </span>
          <span>
            Required <span className="tabular text-label-secondary">{formatDay(commitment.requiredBy)}</span>
          </span>
          <span>
            Order ref <span className="font-mono text-mono-s text-label-secondary">{commitment.reference}</span>
          </span>
        </p>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-x-5 gap-y-3">
        <dl className="flex items-center gap-5 text-caption">
          {lifecycle ? (
            <div className="flex flex-col gap-1">
              <dt className="micro-label text-label-quaternary">Production</dt>
              <dd><StatusMark state={lifecycle} /></dd>
            </div>
          ) : null}
          <div className="flex flex-col gap-1">
            <dt className="micro-label text-label-quaternary">Assessment</dt>
            <dd><AssessmentChip status={assessment.status} /></dd>
          </div>
        </dl>
        <AnalyseAction assessment={assessment} />
      </div>
    </section>
  );
}

function AnalyseAction({ assessment }: { readonly assessment: Assessment }): React.ReactElement {
  const { status, last, canAnalyse, blocker, start } = assessment;
  const running = status === "analysing";
  const label = running ? "Analysing…" : last ? "Update assessment" : "Analyse production risk";
  const hintId = React.useId();

  return (
    <div className="flex max-w-[260px] flex-col items-end gap-1.5">
      <button
        type="button"
        data-guide-target="assessment-action"
        onClick={start}
        disabled={!canAnalyse || running}
        aria-describedby={blocker ? hintId : undefined}
        className={cn(
          "rounded-chip px-5 py-2.5 text-body-s font-medium",
          "motion-safe:transition-colors motion-safe:duration-fast",
          FOCUS,
          canAnalyse && !running
            ? "bg-action text-action-on hover:bg-action-hover"
            : "cursor-not-allowed bg-inset text-label-tertiary"
        )}
      >
        {label}
      </button>
      {blocker ? (
        <p id={hintId} className="text-right text-caption text-label-tertiary">
          {blocker}
        </p>
      ) : null}
    </div>
  );
}
