import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import * as React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CommitmentScene } from "./CommitmentScene";
import { useAssessment } from "./workspace/useAssessment";
import { useWorkbenchState } from "./workspace/useWorkbenchState";

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

/* Radix Tabs activates on mousedown, not click. */
const pick = (el: HTMLElement) => {
  fireEvent.mouseDown(el, { button: 0 });
  fireEvent.click(el);
};

function Harness({ id }: { readonly id: string }): React.ReactElement | null {
  const assessment = useAssessment(id);
  const workbench = useWorkbenchState(id);
  if (!assessment) return null;
  return (
    <CommitmentScene
      commitmentId={id}
      assessment={assessment}
      workbench={workbench}
      onBack={() => {}}
      onOpenComponent={() => {}}
    />
  );
}

const status = () => document.querySelector("[data-assessment-status]")?.getAttribute("data-assessment-status");

describe("CommitmentScene (order workspace)", () => {
  it("opens a new order populated but not assessed, and starts nothing", () => {
    render(<Harness id="c2" />);
    act(() => vi.advanceTimersByTime(10_000));
    expect(status()).toBe("not_assessed");
    expect(document.querySelectorAll("[data-analysis-step]")).toHaveLength(0);
    expect(screen.getByRole("heading", { name: "Planning brief" })).toBeTruthy();
    expect(screen.getByText(/Demo snapshot/)).toBeTruthy();
    /* No severity is invented before an assessment exists. */
    expect(screen.queryByRole("img", { name: /concern/i })).toBeNull();
  });

  it("shows the same supplier records as Cards and as List", () => {
    render(<Harness id="c2" />);
    const cards = document.querySelectorAll("[data-supplier-records=cards] > li").length;
    pick(screen.getByRole("tab", { name: "List" }));
    const rows = document.querySelectorAll("[data-supplier-records=list] tbody tr").length;
    expect(cards).toBeGreaterThan(0);
    expect(rows).toBe(cards);
  });

  it("filters by band and by Needs action, and keeps the filter across Cards and List", () => {
    render(<Harness id="c1" />);
    const cards = () => document.querySelectorAll("[data-supplier-records=cards] > li").length;
    const heading = () => document.querySelector("[data-workbench-heading]")?.textContent;
    expect(heading()).toBe("Direct suppliers · 41");
    expect(cards()).toBe(41);

    fireEvent.click(screen.getByRole("button", { name: /^Critical 5$/ }));
    expect(cards()).toBe(5);
    expect(heading()).toBe("Critical suppliers · 5");
    expect(screen.getByText("5 of 41 direct suppliers")).toBeTruthy();

    pick(screen.getByRole("tab", { name: "List" }));
    expect(document.querySelectorAll("[data-supplier-records=list] tbody tr")).toHaveLength(5);

    fireEvent.click(screen.getByRole("button", { name: /^All 41$/ }));
    fireEvent.click(screen.getByRole("button", { name: /Needs action/ }));
    expect(document.querySelectorAll("[data-supplier-records=list] tbody tr")).toHaveLength(8);
    expect(document.querySelectorAll("[data-supplier-records=list] tbody tr[data-band=elevated]").length).toBeGreaterThan(0);
  });

  it("keeps the band counts when a filter narrows the results", () => {
    render(<Harness id="c1" />);
    fireEvent.click(screen.getByRole("button", { name: /^Low 17$/ }));
    expect(screen.getByRole("button", { name: /^Critical 5$/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /^Elevated 19$/ })).toBeTruthy();
  });

  it("runs only from the header action, and keeps an assessed order's summary during an update", () => {
    render(<Harness id="c1" />);
    expect(status()).toBe("available");
    fireEvent.click(screen.getByRole("button", { name: "Update assessment" }));
    expect(status()).toBe("analysing");
    expect(document.querySelector("[data-brief-exposure]")?.textContent).toBe("$6.4M");
    expect(screen.getByRole("complementary", { name: "Order Drona conversation" })).toBeTruthy();
  });

  it("disables the action with its reason when there is no bill of materials", () => {
    render(<Harness id="c4" />);
    const action = screen.getByRole("button", { name: /Analyse production risk/ }) as HTMLButtonElement;
    expect(action.disabled).toBe(true);
    expect(screen.getAllByText(/No bill of materials/i).length).toBeGreaterThan(0);
  });
  it("keeps component and concern content identical across Cards and List", () => {
    render(<Harness id="c1" />);
    const read = () => Array.from(document.querySelectorAll("[data-supplier-record]")).map(el => ({
      id: el.getAttribute("data-supplier-record"),
      component: el.querySelector("[data-supplier-component]")?.textContent,
      concern: el.querySelector("[data-supplier-concern]")?.textContent,
    }));
    const cards = read();
    expect(cards).toHaveLength(41);
    expect(cards.find(c => c.id === "sup:tiruchi-tower-sections")?.concern).toMatch(/applicability under review/);
    expect(screen.queryByText("On this order")).toBeNull();
    expect(screen.queryByText("Regulatory investigation")).toBeNull();
    expect(document.querySelector("[data-brief-exposure]")?.textContent).toBe("$6.4M");
    pick(screen.getByRole("tab", { name: "List" }));
    expect(read()).toEqual(cards);
    expect(screen.getByRole("button", { name: "Investigate CBAM readiness" })).toBeTruthy();
  });

});
