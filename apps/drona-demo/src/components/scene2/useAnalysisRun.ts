"use client";

import * as React from "react";

import { analysisSteps, type AnalysisStep } from "@/lib/drona/analysis";
import { hasBom } from "@/lib/network/bom";

export type AnalysisPhase = "idle" | "running" | "resolved";

/**
 * Drives the staged reasoning sequence.
 *
 * One timeout at a time, keyed off how many steps have resolved, rather than a chain
 * of nested `setTimeout`s laid out in a component. The step list is declarative
 * (`lib/drona/analysis.ts`); this only walks it. Adding or reordering a step is an
 * edit to data, not to control flow.
 *
 * Under `prefers-reduced-motion` the run resolves in full on the same tick the
 * reviewer presses the button. They asked not to be shown motion — the correct
 * response is to give them the result, not a slower animation of it.
 *
 * It is held **above** Scene 2 rather than inside it, keyed on the commitment. Coming
 * back from an exposure to pick a different one must not replay eight steps the
 * reviewer has already watched — on stage that reads as the demo stalling, and the
 * analysis has not changed. Opening a *different* commitment does reset it, because
 * then the analysis genuinely has not been run.
 */
export function useAnalysisRun(resetKey?: string | null): {
  readonly steps: readonly AnalysisStep[];
  readonly phase: AnalysisPhase;
  /** How many steps have resolved. The step at this index is the one running. */
  readonly resolved: number;
  readonly start: () => void;
} {
  /* An order with no bill of materials has nothing to analyse, and gets no steps
     rather than the flagship's — Scene 2 shows it as not yet analysed instead. */
  const steps = React.useMemo(
    () => (resetKey && hasBom(resetKey) ? analysisSteps(resetKey) : []),
    [resetKey]
  );
  const [resolved, setResolved] = React.useState(0);
  const [running, setRunning] = React.useState(false);

  const start = React.useCallback(() => {
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (reduced) {
      setResolved(steps.length);
      return;
    }
    setResolved(0);
    setRunning(true);
  }, [steps.length]);

  React.useEffect(() => {
    setResolved(0);
    setRunning(false);
  }, [resetKey]);

  React.useEffect(() => {
    if (!running) return;
    if (resolved >= steps.length) {
      setRunning(false);
      return;
    }
    const id = window.setTimeout(
      () => setResolved((n) => n + 1),
      steps[resolved]!.durationMs
    );
    return () => window.clearTimeout(id);
  }, [running, resolved, steps]);

  const phase: AnalysisPhase =
    steps.length > 0 && resolved >= steps.length
      ? "resolved"
      : running
        ? "running"
        : "idle";

  return { steps, phase, resolved, start };
}
