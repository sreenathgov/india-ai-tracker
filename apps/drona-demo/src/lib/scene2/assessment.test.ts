import { describe, expect, it } from "vitest";

import {
  analysisBlocker,
  applyAssessment,
  assessmentFor,
  assessmentReducer,
  canAnalyse,
  initialAssessment,
  statusOf,
  type AssessmentState,
} from "./assessment";

const start = (s: AssessmentState, runId: number) => assessmentReducer(s, { type: "start", runId });

describe("initial assessment, from the portfolio", () => {
  it("opens a NEW order as not assessed — Highland included", () => {
    for (const id of ["c2", "c3", "c4"]) {
      const s = initialAssessment(id);
      expect(statusOf(s)).toBe("not_assessed");
      expect(s.last).toBeNull();
      expect(s.runId).toBeNull();
    }
  });

  it("opens an assessed order with its portfolio assessment, and says whether detail is held", () => {
    expect(initialAssessment("c1")).toMatchObject({
      last: { commitmentId: "c1", source: "portfolio", hasDetail: true },
      runId: null,
    });
    expect(statusOf(initialAssessment("c1"))).toBe("available");
    /* Pampas is assessed in the portfolio but has no bill of materials in the demo. */
    expect(initialAssessment("c5").last).toMatchObject({ source: "portfolio", hasDetail: false });
  });
});

describe("what can be analysed", () => {
  it("analyses only orders with a bill of materials, and states why not otherwise", () => {
    expect(canAnalyse("c1")).toBe(true);
    expect(canAnalyse("c2")).toBe(true);
    expect(canAnalyse("c4")).toBe(false);
    expect(analysisBlocker("c2")).toBeNull();
    expect(analysisBlocker("c4")).toMatch(/bill of materials/i);
  });
});

describe("the reducer", () => {
  it("never leaves not-assessed without an explicit start", () => {
    const s = initialAssessment("c2");
    expect(assessmentReducer(s, { type: "complete", runId: 1 })).toBe(s);
    expect(assessmentReducer(s, { type: "cancel" })).toBe(s);
  });

  it("starts, then completes into a session assessment", () => {
    const running = start(initialAssessment("c2"), 1);
    expect(statusOf(running)).toBe("analysing");
    const done = assessmentReducer(running, { type: "complete", runId: 1 });
    expect(statusOf(done)).toBe("available");
    expect(done.last).toEqual({ commitmentId: "c2", source: "session", hasDetail: true });
    expect(done.runId).toBeNull();
  });

  it("ignores a second start while a run is in flight", () => {
    const running = start(initialAssessment("c2"), 1);
    expect(start(running, 2)).toBe(running);
  });

  it("refuses to start an order it cannot analyse", () => {
    const s = initialAssessment("c4");
    expect(start(s, 1)).toBe(s);
  });

  it("keeps the previous assessment visible through a refresh", () => {
    const refreshing = start(initialAssessment("c1"), 7);
    expect(statusOf(refreshing)).toBe("analysing");
    expect(refreshing.last).toMatchObject({ source: "portfolio" });
  });

  it("does not erase, or replace, the previous assessment on cancel or failure", () => {
    const before = initialAssessment("c1");
    const refreshing = start(before, 3);
    const cancelled = assessmentReducer(refreshing, { type: "cancel" });
    expect(cancelled.last).toBe(before.last);
    expect(statusOf(cancelled)).toBe("available");

    const failed = assessmentReducer(start(before, 4), { type: "fail", runId: 4 });
    expect(failed.last).toBe(before.last);
    expect(failed.runId).toBeNull();

    const fresh = assessmentReducer(start(initialAssessment("c2"), 5), { type: "fail", runId: 5 });
    expect(statusOf(fresh)).toBe("not_assessed");
  });

  it("ignores a completion or failure from a stale run", () => {
    const running = start(initialAssessment("c2"), 9);
    expect(assessmentReducer(running, { type: "complete", runId: 8 })).toBe(running);
    expect(assessmentReducer(running, { type: "fail", runId: 8 })).toBe(running);
  });
});

describe("the per-order store", () => {
  it("falls back to the portfolio seed and never mutates", () => {
    const store = {};
    expect(assessmentFor(store, "c2")).toEqual(initialAssessment("c2"));
    const next = applyAssessment(store, "c2", { type: "start", runId: 1 });
    expect(store).toEqual({});
    expect(statusOf(assessmentFor(next, "c2"))).toBe("analysing");
    expect(statusOf(assessmentFor(next, "c1"))).toBe("available");
  });

  it("returns the same store when an event changes nothing", () => {
    const store = {};
    expect(applyAssessment(store, "c4", { type: "start", runId: 1 })).toBe(store);
  });
});
