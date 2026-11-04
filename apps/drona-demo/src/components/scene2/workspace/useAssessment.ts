"use client";

import * as React from "react";

import { analysisSteps, type AnalysisStep } from "@/lib/drona/analysis";
import {
  analysisBlocker,
  applyAssessment,
  assessmentFor,
  canAnalyse,
  statusOf,
  type AssessmentEvent,
  type AssessmentRecord,
  type AssessmentStatus,
  type AssessmentStore,
} from "@/lib/scene2/assessment";

export interface Assessment {
  readonly status: AssessmentStatus;
  /** The last completed assessment — kept, and shown, while a refresh runs. */
  readonly last: AssessmentRecord | null;
  readonly steps: readonly AnalysisStep[];
  /** Steps resolved in the current run. The step at this index is the one running. */
  readonly resolved: number;
  readonly canAnalyse: boolean;
  readonly blocker: string | null;
  /** The only way into a run. Ignored while one is in flight. */
  readonly start: () => void;
}

const prefersReducedMotion = (): boolean =>
  typeof window !== "undefined" &&
  (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false);

/**
 * Scene 2's assessment, per order, over the existing scripted analysis.
 *
 * Held by the page, above the scene, so stepping into an exposure and back does not
 * replay a run, and so an order assessed in this session stays assessed when the
 * reviewer returns to it. The step walker is the one `useAnalysisRun` used — one
 * timeout at a time, uneven durations from `analysisSteps`, everything at once under
 * reduced motion — wrapped around the contract in `lib/scene2/assessment.ts`.
 *
 * There is no effect that starts a run. Leaving an order mid-run cancels it, which
 * by contract keeps whatever assessment it had before.
 */
export function useAssessment(commitmentId: string | null): Assessment | null {
  const [store, setStore] = React.useState<AssessmentStore>({});
  /* Mirrors `store` synchronously, so two clicks inside one frame see the first
     run and the second is refused — not just the second render. */
  const storeRef = React.useRef<AssessmentStore>(store);
  const runCounter = React.useRef(0);
  const [resolved, setResolved] = React.useState(0);

  const dispatch = React.useCallback((id: string, event: AssessmentEvent) => {
    const next = applyAssessment(storeRef.current, id, event);
    if (next === storeRef.current) return false;
    storeRef.current = next;
    setStore(next);
    return true;
  }, []);

  const analysable = commitmentId !== null && canAnalyse(commitmentId);
  const steps = React.useMemo(
    () => (commitmentId && analysable ? analysisSteps(commitmentId) : []),
    [commitmentId, analysable]
  );
  const state = commitmentId ? assessmentFor(store, commitmentId) : null;
  const runId = state?.runId ?? null;

  const start = React.useCallback(() => {
    if (!commitmentId || steps.length === 0) return;
    const id = ++runCounter.current;
    if (!dispatch(commitmentId, { type: "start", runId: id })) return;
    if (prefersReducedMotion()) {
      setResolved(steps.length);
      dispatch(commitmentId, { type: "complete", runId: id });
      return;
    }
    setResolved(0);
  }, [commitmentId, steps.length, dispatch]);

  /* Leaving an order cancels its run. The cleanup closes over the order being left. */
  React.useEffect(() => {
    if (!commitmentId) return;
    return () => {
      dispatch(commitmentId, { type: "cancel" });
    };
  }, [commitmentId, dispatch]);

  React.useEffect(() => {
    if (!commitmentId || runId === null) return;
    if (resolved >= steps.length) {
      dispatch(commitmentId, { type: "complete", runId });
      return;
    }
    const timer = window.setTimeout(() => setResolved((n) => n + 1), steps[resolved]!.durationMs);
    return () => window.clearTimeout(timer);
  }, [commitmentId, runId, resolved, steps, dispatch]);

  if (!commitmentId || !state) return null;
  return {
    status: statusOf(state),
    last: state.last,
    steps,
    resolved,
    canAnalyse: analysable,
    blocker: analysisBlocker(commitmentId),
    start,
  };
}
