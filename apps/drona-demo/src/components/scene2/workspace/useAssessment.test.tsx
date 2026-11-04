import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { analysisSteps } from "@/lib/drona/analysis";
import { useAssessment } from "./useAssessment";

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

/* Each step's timer is armed by an effect after the previous step renders, so the
   clock has to advance one act at a time, as it would in the browser. */
const runAll = () => {
  for (const step of analysisSteps("c2")) act(() => vi.advanceTimersByTime(step.durationMs));
  act(() => vi.advanceTimersByTime(0));
};

describe("useAssessment", () => {
  it("does nothing on opening an order, however long it stays open", () => {
    const { result } = renderHook(() => useAssessment("c2"));
    act(() => vi.advanceTimersByTime(60_000));
    expect(result.current?.status).toBe("not_assessed");
    expect(result.current?.resolved).toBe(0);
  });

  it("runs only when started, and refuses a second start mid-run", () => {
    const { result } = renderHook(() => useAssessment("c2"));
    act(() => {
      result.current!.start();
      result.current!.start();
    });
    expect(result.current?.status).toBe("analysing");
    act(() => vi.advanceTimersByTime(result.current!.steps[0]!.durationMs));
    expect(result.current?.resolved).toBe(1);
    runAll();
    expect(result.current?.status).toBe("available");
    expect(result.current?.last).toMatchObject({ source: "session" });
  });

  it("keeps an assessed order's assessment through a refresh", () => {
    const { result } = renderHook(() => useAssessment("c1"));
    expect(result.current?.last).toMatchObject({ source: "portfolio" });
    act(() => result.current!.start());
    expect(result.current?.status).toBe("analysing");
    expect(result.current?.last).toMatchObject({ source: "portfolio" });
  });

  it("cancels on leaving an order mid-run, and remembers completed runs per order", () => {
    const { result, rerender } = renderHook(({ id }) => useAssessment(id), {
      initialProps: { id: "c2" as string | null },
    });
    act(() => result.current!.start());
    rerender({ id: null });
    rerender({ id: "c2" });
    expect(result.current?.status).toBe("not_assessed");

    act(() => result.current!.start());
    runAll();
    rerender({ id: "c1" });
    rerender({ id: "c2" });
    expect(result.current?.status).toBe("available");
  });

  it("will not start an order with no bill of materials", () => {
    const { result } = renderHook(() => useAssessment("c4"));
    act(() => result.current!.start());
    expect(result.current?.status).toBe("not_assessed");
    expect(result.current?.blocker).toMatch(/bill of materials/);
  });
});
