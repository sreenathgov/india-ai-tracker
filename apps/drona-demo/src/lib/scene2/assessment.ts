/**
 * Scene 2's assessment contract — three states, one trigger.
 *
 * Production lifecycle (New / Action / Monitoring, from the portfolio) and assessment
 * status are separate things. This file owns only the second, and only as a view
 * contract: it does not score, infer or forecast anything. The findings themselves
 * are the existing synthetic analysis (`lib/drona/analysis.ts`, `lib/network/bom.ts`).
 *
 * The status is **derived**, never stored:
 *
 *   runId set          → analysing   (a run is in flight)
 *   else last recorded → available
 *   else               → not assessed
 *
 * Deriving it is what makes the two promises structural rather than careful. A
 * refresh cannot hide the previous assessment, because `last` is untouched until a
 * matching completion replaces it. A cancellation or failure cannot present a new
 * one, because only `complete` with the in-flight `runId` writes `last`.
 *
 * Nothing here starts a run. `start` is an event the reviewer's button sends; there
 * is no route-entry, mount or effect path into it.
 */
import { hasBom } from "@/lib/network/bom";
import { stateOf } from "@/lib/portfolio/portfolio";

export type AssessmentStatus = "not_assessed" | "analysing" | "available";

export const ASSESSMENT_STATUS_LABEL: Readonly<Record<AssessmentStatus, string>> = {
  not_assessed: "Not assessed",
  analysing: "Analysing",
  available: "Assessed",
};

export interface AssessmentRecord {
  readonly commitmentId: string;
  /** Where the assessment came from: the portfolio's record, or a run in this session. */
  readonly source: "portfolio" | "session";
  /** Whether the demo holds the findings behind it — false where there is no BOM. */
  readonly hasDetail: boolean;
}

export interface AssessmentState {
  readonly commitmentId: string;
  readonly last: AssessmentRecord | null;
  /** The in-flight run, or null. A second run cannot start while this is set. */
  readonly runId: number | null;
}

export type AssessmentEvent =
  | { readonly type: "start"; readonly runId: number }
  | { readonly type: "complete"; readonly runId: number }
  | { readonly type: "fail"; readonly runId: number }
  | { readonly type: "cancel" };

/** The engine reads a bill of materials; an order without one cannot be analysed. */
export const canAnalyse = (commitmentId: string): boolean => hasBom(commitmentId);

/** Why the analysis action is unavailable, in the reviewer's words — or null. */
export const analysisBlocker = (commitmentId: string): string | null =>
  canAnalyse(commitmentId)
    ? null
    : "No bill of materials in the planning snapshot, so there is nothing to analyse yet.";

export function initialAssessment(commitmentId: string): AssessmentState {
  const state = stateOf(commitmentId);
  const assessed = state === "action" || state === "monitoring";
  return {
    commitmentId,
    last: assessed
      ? { commitmentId, source: "portfolio", hasDetail: canAnalyse(commitmentId) }
      : null,
    runId: null,
  };
}

export const statusOf = (state: AssessmentState): AssessmentStatus =>
  state.runId !== null ? "analysing" : state.last ? "available" : "not_assessed";

/** Returns the same object when an event does not apply, so callers can skip a render. */
export function assessmentReducer(
  state: AssessmentState,
  event: AssessmentEvent
): AssessmentState {
  switch (event.type) {
    case "start":
      if (state.runId !== null || !canAnalyse(state.commitmentId)) return state;
      return { ...state, runId: event.runId };
    case "complete":
      if (state.runId === null || state.runId !== event.runId) return state;
      return {
        ...state,
        runId: null,
        last: { commitmentId: state.commitmentId, source: "session", hasDetail: true },
      };
    case "fail":
      if (state.runId === null || state.runId !== event.runId) return state;
      return { ...state, runId: null };
    case "cancel":
      return state.runId === null ? state : { ...state, runId: null };
  }
}

/* ── Per-order store ───────────────────────────────────────────────────────────
   Held by the page so leaving an order and coming back keeps what this session
   assessed. Orders never touched fall back to their portfolio seed. */

export type AssessmentStore = Readonly<Record<string, AssessmentState>>;

export const assessmentFor = (store: AssessmentStore, commitmentId: string): AssessmentState =>
  store[commitmentId] ?? initialAssessment(commitmentId);

export function applyAssessment(
  store: AssessmentStore,
  commitmentId: string,
  event: AssessmentEvent
): AssessmentStore {
  const current = assessmentFor(store, commitmentId);
  const next = assessmentReducer(current, event);
  return next === current ? store : { ...store, [commitmentId]: next };
}
