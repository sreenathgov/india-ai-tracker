import * as React from "react";

import type { AnalysisStep } from "@/lib/drona/analysis";
import { cn } from "@/lib/ui/cn";

/**
 * The running sequence, compact. The same pattern as `ReasoningSequence` — only the
 * steps that have started are in the DOM, each resolving into what it found — but
 * without that component's own start button: in the workspace the header owns the
 * one trigger.
 */
export function AnalysisSteps({
  steps,
  resolved,
}: {
  readonly steps: readonly AnalysisStep[];
  readonly resolved: number;
}): React.ReactElement {
  const shown = steps.slice(0, Math.min(resolved + 1, steps.length));
  return (
    <ol aria-live="polite" aria-busy={resolved < steps.length} className="space-y-2">
      {shown.map((step, index) => {
        const done = index < resolved;
        return (
          <li key={step.id} data-analysis-step className="flex items-baseline gap-2.5 motion-safe:animate-fade-rise">
            <span aria-hidden="true" className="relative top-[2px] grid h-3.5 w-3.5 shrink-0 place-items-center">
              {done ? (
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M3.5 8.5 6.5 11.5 12.5 4.5"
                    stroke="var(--concern-low)"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                <span className="h-2.5 w-2.5 rounded-full border border-separator" />
              )}
            </span>
            <span className={cn("text-caption", done ? "text-label-secondary" : "text-label-tertiary")}>
              {done ? step.resolved : `${step.running}…`}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
