"use client";

import * as React from "react";

import { ANALYSIS_DISCLOSURE, type AnalysisStep } from "@/lib/drona/analysis";
import { cn } from "@/lib/ui/cn";
import type { AnalysisPhase } from "./useAnalysisRun";

/**
 * The staged reasoning sequence, and the one primary action that starts it.
 *
 * It replaces a spinner. A spinner says "wait"; this says what is being assembled,
 * in the order it would genuinely have to be assembled, and each line resolves into
 * a figure that the cards below then show. The reviewer should finish the sequence
 * understanding the order better than when they started it, which is the entire
 * justification for making them watch anything at all.
 *
 * The disclosure sits under the action **before** the run as well as after it. A
 * reader should never have to have watched an animation to find out that it was one.
 */
export function ReasoningSequence({
  steps,
  phase,
  resolved,
  onStart,
}: {
  readonly steps: readonly AnalysisStep[];
  readonly phase: AnalysisPhase;
  readonly resolved: number;
  readonly onStart: () => void;
}): React.ReactElement {
  /* Only the steps that have started are in the DOM, so the list grows downward as
     the analysis constructs itself rather than sitting there as eight grey ghosts
     waiting to be filled in — which would give the ending away and make the whole
     thing read as a progress bar in costume. */
  const shown = steps.slice(0, Math.min(resolved + 1, steps.length));

  return (
    <section
      aria-label="Production risk analysis"
      className="flex flex-col items-start gap-6"
    >
      {phase === "idle" ? (
        <button
          type="button"
          onClick={onStart}
          className={cn(
            "rounded-chip bg-action px-7 py-3 text-body text-action-on",
            "motion-safe:transition-colors motion-safe:duration-fast hover:bg-action-hover"
          )}
        >
          Analyze Production Risk
        </button>
      ) : null}

      {phase === "idle" ? null : (
        <ol
          aria-live="polite"
          aria-busy={phase === "running"}
          className="w-full max-w-measure space-y-3"
        >
          {shown.map((step, index) => {
            const done = index < resolved;
            return (
              <li
                key={step.id}
                className="flex items-baseline gap-4 motion-safe:animate-fade-rise"
              >
                <Tick done={done} />
                <span
                  className={cn(
                    "text-body-s",
                    done ? "text-label-secondary" : "text-label-tertiary"
                  )}
                >
                  {done ? step.resolved : `${step.running}…`}
                </span>
              </li>
            );
          })}
        </ol>
      )}

      <p className="max-w-measure text-caption text-label-quaternary">
        {ANALYSIS_DISCLOSURE}
      </p>
    </section>
  );
}

/**
 * The check. Drawn, not typed — a `✓` glyph would inherit the paragraph's weight and
 * colour and read as punctuation. Before it resolves, the slot holds a hairline ring
 * so the line does not shift sideways when the mark lands.
 */
function Tick({ done }: { readonly done: boolean }): React.ReactElement {
  return (
    <span
      aria-hidden="true"
      className="relative top-[2px] grid h-4 w-4 shrink-0 place-items-center"
    >
      {done ? (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <path
            d="M3.5 8.5 6.5 11.5 12.5 4.5"
            stroke="var(--concern-low)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <span className="h-3 w-3 rounded-full border border-separator" />
      )}
    </span>
  );
}
