import * as React from "react";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { RegulatoryProvider, useRegulatoryCase } from "@/components/regulatory/RegulatoryProvider";
import { SupplierInquiryProvider } from "@/components/scene2/investigation/overview/SupplierInquiryProvider";
import { PlanningBrief } from "@/components/scene2/workspace/PlanningBrief";
import { SupplierWorkbench } from "@/components/scene2/workspace/SupplierWorkbench";
import { useWorkbenchState } from "@/components/scene2/workspace/useWorkbenchState";
import { findingFor } from "@/lib/regulatory/state";
import { CommitmentQueue } from "@/components/surface/CommitmentQueue";
import { WorkingCapitalCard } from "@/components/surface/WorkingCapitalCard";
import { DependencyRadial } from "@/components/surface/DependencyRadial";
import { GuidedDemoBoundary, GuidedDemoProvider, GuidedDemoRoot } from "./GuidedDemo";

function Experience(): React.ReactElement {
  const [epoch, setEpoch] = React.useState(0);
  return <RegulatoryProvider key={epoch}><SupplierInquiryProvider><Fixture onReplay={() => setEpoch((e) => e + 1)} /></SupplierInquiryProvider></RegulatoryProvider>;
}
function Fixture({ onReplay }: { readonly onReplay: () => void }): React.ReactElement {
  const [scene, setScene] = React.useState(1);
  const [unrelated, setUnrelated] = React.useState(0);
  const workbench = useWorkbenchState(scene === 2 ? "c1" : null);
  const regulatory = useRegulatoryCase();
  return <GuidedDemoProvider navigation={{ scene, commitmentId: scene === 2 ? "c1" : null, assessmentStatus: "available", openOrder: () => setScene(2), resetNavigation: () => setScene(1) }} onReplay={onReplay}>
    <GuidedDemoBoundary>
      <DependencyRadial filter={null} onFilterType={() => {}} />
      <section data-surface="map" aria-label="Production network map">Fictional network snapshot</section>
      <CommitmentQueue filter={null} onClearFilter={() => {}} onOpen={() => setScene(2)} onEmphasis={() => {}} />
      <WorkingCapitalCard />
      <button type="button" onClick={() => setUnrelated((n) => n + 1)}>Unrelated order</button>
      <output data-unrelated>{unrelated}</output>
      <output data-finding>{findingFor(regulatory.state)}</output>
      {scene === 2 ? <><PlanningBrief commitmentId="c1" assessed /><SupplierWorkbench commitmentId="c1" showBands workbench={workbench} /></> : null}
    </GuidedDemoBoundary>
    <GuidedDemoRoot />
  </GuidedDemoProvider>;
}
afterEach(cleanup);
const question = (): HTMLElement => document.querySelector<HTMLElement>("[data-working-question]")!;
const choose = (answer: "Yes" | "No" | "Unknown") => fireEvent.click(within(question()).getByRole("button", { name: answer }));
const record = () => fireEvent.click(question().querySelector<HTMLButtonElement>('[data-guide-target="record-reply"]')!);
function completeRiskIntroduction() {
  for (let i = 0; i < 3; i++) fireEvent.click(screen.getByRole("button", { name: "Next example" }));
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  expect(document.querySelector('[data-guide-step="capital"]')).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  expect(document.querySelector('[data-guide-step="exposure"]')).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
}
async function openCase() {
  fireEvent.click(screen.getByRole("button", { name: "Start demo" }));
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  completeRiskIntroduction();
  fireEvent.click(screen.getByRole("button", { name: "Open this order" }));
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  const launch = document.querySelector<HTMLElement>('[data-guide-step="material-launch"]');
  if (launch) fireEvent.click(within(launch).getByRole("button", { name: /^Exit$/ }));
  fireEvent.click(screen.getByRole("button", { name: "Investigate CBAM readiness" }));
  await waitFor(() => expect(question()?.dataset.workingQuestion).toBe("scope"));
}

describe("guided demonstration with the actual supplier workspace", () => {
  it("introduces the map before allowing an order, and supports reviewing that introduction", async () => {
    render(<Experience />);
    fireEvent.click(screen.getByRole("button", { name: "Start demo" }));
    expect(screen.getByRole("heading", { name: "Your supplier network, mapped." })).toBeTruthy();
    expect(screen.queryByLabelText("Drona guided demonstration")).toBeNull();
    expect(screen.getByText(/one digital twin/)).toBeTruthy();
    const boundary = document.querySelector<HTMLElement>("[data-guided-boundary]")!;
    expect(boundary.inert).toBe(true);
    fireEvent.click(document.querySelector<HTMLElement>('[data-guide-target="order:c1"]')!);
    expect(document.querySelector('[data-guide-step="map"]')).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Investigate CBAM readiness" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(document.querySelector('[data-guide-step="risks"]')).toBeTruthy();
    expect(boundary.inert).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(document.querySelector('[data-guide-step="map"]')).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByRole("button", { name: "Start demo" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Start demo" }));
    expect(document.querySelector('[data-guide-step="map"]')).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Exit" }));
    expect(screen.getByRole("button", { name: "Replay demo" })).toBeTruthy();
    expect(boundary.inert).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "Replay demo" }));
    fireEvent.click(screen.getByRole("button", { name: "Start demo" }));
    expect(document.querySelector('[data-guide-step="map"]')).toBeTruthy();
  });
  it("uses the real category selection, preserves counts and revisits the teaching sequence", () => {
    render(<Experience />);
    fireEvent.click(screen.getByRole("button", { name: "Start demo" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    const riskCard = document.querySelector<HTMLElement>('[data-surface="risks"]')!;
    expect(riskCard.textContent).toContain("21");
    expect(riskCard.textContent).toContain("Mitigation verified");
    expect(document.querySelector('[data-guide-step="risks"]')?.getAttribute("data-risk-beat")).toBe("overview");
    fireEvent.click(screen.getByRole("button", { name: /Production capacity 5/ }));
    expect(riskCard.querySelector('[data-risk-wheel]')?.getAttribute("data-selected-category")).toBe("process");
    expect(riskCard.querySelector('[data-risk-explanation]')?.textContent).toContain("limited slot");
    expect(document.querySelector("[data-finding]")?.textContent).toBe("applicability-review");
    fireEvent.click(screen.getByRole("button", { name: "Show all categories" }));
    completeRiskIntroduction();
    expect(document.querySelector('[data-guide-step="order"]')).toBeTruthy();
    expect(screen.getByRole("dialog").textContent).toContain("Trace the exposure to an order.");
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(document.querySelector('[data-guide-step="exposure"]')).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(document.querySelector('[data-guide-step="capital"]')).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(document.querySelector('[data-guide-step="risks"]')?.getAttribute("data-risk-beat")).toBe("regulatory");
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(document.querySelector('[data-guide-step="risks"]')?.getAttribute("data-risk-beat")).toBe("network");
    fireEvent.click(screen.getByRole("button", { name: "Exit" }));
    expect(riskCard.hasAttribute("style")).toBe(false);
    expect(document.querySelector('[data-guided-boundary]')?.hasAttribute("role")).toBe(false);
  });
  it("briefs the actual order without an overall-order lead-time claim or a revealed finding", () => {
    render(<Experience />);
    const brief = within(screen.getByRole("region", { name: "Case brief" }));
    expect(screen.getByRole("heading", { name: "Know what puts an order at risk." })).toBeTruthy();
    expect(brief.getByRole("heading", { name: "Wind Energy" })).toBeTruthy();
    expect(brief.getByText(/100 wind turbines/)).toBeTruthy();
    expect(brief.getByText(/India → Denmark/)).toBeTruthy();
    expect(brief.getByText("Delivery required").parentElement?.textContent).toContain("18 Nov 2026");
    expect(brief.getByText("Longest component lead time").parentElement?.textContent).toContain("112 days");
    expect(brief.getByRole("heading", { name: "Deccan Mainshaft Forgings" })).toBeTruthy();
    expect(brief.getByText("Main-shaft forging lot")).toBeTruthy();
    expect(brief.getByText("Could incoming billet miss its production window?")).toBeTruthy();
    expect(brief.getByText(/PO-2026-0417/)).toBeTruthy();
    expect(brief.getByText(/Illustrative case/)).toBeTruthy();
    expect(brief.getByText(/2 Nov 2026/)).toBeTruthy();
    expect(brief.queryByText(/entry-readiness gap/)).toBeNull();
    expect(screen.queryByText(/About 90 seconds/)).toBeNull();
    expect(screen.getByRole("link", { name: "Back to Kanan" }).closest("footer")).toBeTruthy();
    const disclosure = screen.getByText("About this demo").closest("details")!;
    expect(disclosure.open).toBe(false);
    expect(disclosure.textContent).toContain("Fictional companies, news and order records");
    expect(screen.getByRole("button", { name: "Start demo" })).toBeTruthy();
  });
  it("keeps a CSRF-protected sign-out action available on the introduction", () => {
    render(<RegulatoryProvider><GuidedDemoProvider navigation={{ scene: 1, commitmentId: null, openOrder: () => {}, resetNavigation: () => {} }} onReplay={() => {}} logoutCsrf="test-only-csrf"><GuidedDemoRoot /></GuidedDemoProvider></RegulatoryProvider>);
    const form = screen.getByRole("button", { name: "Sign out" }).closest("form")!;
    expect(form.getAttribute("action")).toBe("/api/auth/logout");
    expect(form.getAttribute("method")).toBe("post");
    expect(form.querySelector<HTMLInputElement>('input[name="csrf"]')?.value).toBe("test-only-csrf");
    expect(form.hasAttribute("data-guide-control")).toBe(true);
  });
  it("keeps native case answers usable without the retired guide and resets on a fresh visit", async () => {
    render(<Experience />);
    await openCase();
    const dialog = screen.getByRole("dialog");
    expect(screen.queryByLabelText("Drona guided demonstration")).toBeNull();
    // A tabpanel may be focusable without being an interactive leaf control.
    // Disabling it propagates to all replies in real browsers and accessibility APIs.
    await waitFor(() => expect(question().closest('[role="tabpanel"]')?.getAttribute("aria-disabled")).toBeNull());
    expect(question().closest('[aria-disabled="true"]')).toBeNull();
    expect(within(question()).getByRole("button", { name: "Yes" }).closest('[aria-disabled="true"]')).toBeNull();
    expect(dialog.textContent).toContain("Latest useful action time");
    expect(dialog.textContent).toContain("Unconfirmed");
    expect(dialog.textContent).toContain("$4,800,000");
    choose("Unknown"); record();
    expect(question().dataset.workingQuestion).toBe("scope");
    expect(document.querySelector("[data-finding]")?.textContent).toBe("applicability-review");
    choose("Yes");
    expect(question().dataset.workingQuestion).toBe("scope");
    record();
    expect(question().dataset.workingQuestion).toBe("readiness");
    choose("No");
    expect(document.querySelector("[data-finding]")?.textContent).toBe("readiness-review");
    record();
    expect(document.querySelector("[data-finding]")?.textContent).toBe("gap-confirmed");
    expect(within(dialog).getByRole("heading", { name: "The importer confirms an entry-readiness gap." })).toBeTruthy();
    expect(dialog.querySelector('[data-guide-target="next-action"]')?.textContent).toContain("Escalate the readiness gap to OEM logistics");
    cleanup();
    render(<Experience />);
    expect(screen.getByRole("button", { name: "Start demo" })).toBeTruthy();
    expect(document.querySelector("[data-finding]")?.textContent).toBe("applicability-review");
    await openCase();
    expect(question().dataset.workingQuestion).toBe("scope");
    expect(question().textContent).toContain("No private scope reply recorded");
  });
  it("keeps unrelated navigation outside the guided click and keyboard path", async () => {
    render(<Experience />);
    fireEvent.click(screen.getByRole("button", { name: "Start demo" }));
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    completeRiskIntroduction();
    const unrelated = screen.getByRole("button", { name: "Unrelated order" });
    await waitFor(() => expect(unrelated.getAttribute("tabindex")).toBe("-1"));
    expect(unrelated.getAttribute("aria-disabled")).toBe("true");
    fireEvent.mouseDown(unrelated); fireEvent.click(unrelated);
    expect(document.querySelector("[data-unrelated]")?.textContent).toBe("0");
    fireEvent.click(screen.getByRole("button", { name: "Open this order" }));
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    await waitFor(() => expect(unrelated.getAttribute("aria-disabled")).toBeNull());
    expect(screen.queryByLabelText("Drona guided demonstration")).toBeNull();
    const launch = document.querySelector<HTMLElement>('[data-guide-step="material-launch"]');
    if (launch) fireEvent.click(within(launch).getByRole("button", { name: /^Exit$/ }));
    expect(document.querySelector("[data-guide-step]")).toBeNull();
    fireEvent.click(unrelated);
    expect(document.querySelector("[data-unrelated]")?.textContent).toBe("1");
  });
  it("can invalidate a risk instead of forcing the gap story", async () => {
    render(<Experience />);
    await openCase();
    choose("No"); record();
    expect(document.querySelector("[data-finding]")?.textContent).toBe("scope-excluded");
    expect(question().querySelector('[data-guide-target="next-action"]')?.textContent).toContain("Retain the checked exclusion basis");
    expect(document.querySelector("[data-guide-step]")).toBeNull();
  });
  it("introduces the actual planning brief and restores native controls on Exit", () => {
    render(<Experience />);
    fireEvent.click(screen.getByRole("button", { name: "Start demo" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    completeRiskIntroduction();
    fireEvent.click(screen.getByRole("button", { name: "Open this order" }));
    expect(screen.getByRole("heading", { name: "The commitment behind the order." })).toBeTruthy();
    expect(document.querySelector('[data-guide-step="order-overview"]')?.getAttribute("data-guide-act")).toBe("2");
    expect(document.querySelector("[data-estimated-order-value]")?.textContent).toBe("≈ $300M");
    expect(document.querySelector("[data-brief-exposure]")?.textContent).toBe("$6.4M");
    const boundary = document.querySelector<HTMLElement>("[data-guided-boundary]")!;
    expect(boundary.inert).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(document.querySelector('[data-guide-step="order"]')).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Open this order" }));
    fireEvent.click(screen.getByRole("button", { name: "Exit" }));
    expect(document.querySelector('[data-guide-step="order-overview"]')).toBeNull();
    expect(boundary.inert).toBe(false);
    expect(screen.queryByLabelText("Drona guided demonstration")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Unrelated order" }));
    expect(document.querySelector("[data-unrelated]")?.textContent).toBe("1");
  });

  it("introduces the real supplier cards, supports Back/Exit, and hands off to the actual material case", async () => {
    render(<Experience />);
    fireEvent.click(screen.getByRole("button", { name: "Start demo" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    completeRiskIntroduction();
    fireEvent.click(screen.getByRole("button", { name: "Open this order" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    const stage = () => document.querySelector('[data-guide-step="supplier-overview"]');
    expect(stage()?.getAttribute("data-guide-act")).toBe("2");
    expect(screen.getByRole("heading", { name: "See which suppliers need attention." })).toBeTruthy();
    expect(stage()?.textContent).toContain("Cards / List");
    expect(stage()?.textContent).toContain("Deccan’s billet-disruption case");
    expect(document.querySelectorAll('[data-surface="suppliers"]')).toHaveLength(1);
    expect(document.querySelectorAll('[data-supplier-records="cards"] > li')).toHaveLength(41);
    expect(document.querySelector<HTMLElement>("[data-guided-boundary]")?.inert).toBe(true);
    expect(document.querySelector("[data-working-question]")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(document.querySelector('[data-guide-step="order-overview"]')).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(stage()).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Exit" }));
    expect(stage()).toBeNull();
    expect(document.querySelector<HTMLElement>("[data-guided-boundary]")?.inert).toBe(false);
    const opener = screen.getByRole("button", { name: "Investigate billet disruption" });
    await waitFor(() => expect(document.activeElement).toBe(opener));
    expect(document.querySelector("[data-finding]")?.textContent).toBe("applicability-review");
    expect(document.querySelector("[data-working-question]")).toBeNull();
    fireEvent.click(opener);
    await waitFor(() => expect(document.querySelector('[data-investigation="sup:deccan-mainshaft-forgings"]')).toBeTruthy());
    fireEvent.click(screen.getByRole("button", { name: "Order workspace" }));
    expect(stage()).toBeNull();
    expect(document.querySelector('[data-guide-step="order-overview"]')).toBeNull();
  });

});
