import * as React from "react";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { InvestigationWorkspace } from "@/components/scene2/investigation/InvestigationWorkspace";
import type { InvestigationTab } from "@/lib/scene2/supplierView";
import { REGULATORY_CASE } from "@/lib/regulatory/state";
import { RegulatoryProvider } from "./RegulatoryProvider";
import { RegulatoryPathway } from "./RegulatoryPathway";

function Flow(): React.ReactElement {
  const [open, setOpen] = React.useState(true), [deep, setDeep] = React.useState(false);
  const [tab, setTab] = React.useState<InvestigationTab>("overview");
  if (deep) return <RegulatoryPathway onBack={() => setDeep(false)} />;
  return <><button data-supplier-card={REGULATORY_CASE.supplierId} onClick={() => setOpen(true)}>Reopen supplier</button><InvestigationWorkspace commitmentId="c1" supplierId={open ? REGULATORY_CASE.supplierId : null} assessed tab={tab} onTabChange={setTab} onClose={() => setOpen(false)} onOpenComponent={() => setDeep(true)} /></>;
}
const tab = (name: string) => fireEvent.mouseDown(screen.getByRole("tab", { name }), { button: 0, ctrlKey: false });
afterEach(cleanup);

const answer = (label: "Yes" | "No" | "Unknown", scope = false): void => {
  fireEvent.click(screen.getByRole("button", { name: label }));
  fireEvent.click(screen.getByRole("button", { name: scope ? "Record sample scope check" : "Record sample reply and reassess" }));
};
const history = (): void => { fireEvent.click(screen.getByText(/^Replies and assessment changes/)); };

describe("the regulatory demonstration flow", () => {
  it("records evidence inside Overview, shares it with Scene 3, and preserves history on return", () => {
    render(<RegulatoryProvider><Flow /></RegulatoryProvider>);
    expect(screen.getAllByRole("tab").map((t) => t.textContent)).toEqual(["Overview", "Supply chain", "Evidence & reasoning"]);
    expect(screen.queryByRole("tab", { name: "Actions" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Record sample reply and reassess" })).toBeNull();
    answer("Yes", true);
    answer("No");
    expect(screen.getByRole("region", { name: "Updated regulatory assessment" }).textContent).toContain("Import-readiness gap confirmed");
    fireEvent.click(screen.getByRole("button", { name: "Open tower-section pathway →" }));
    expect(screen.getByRole("heading", { name: "The import route behind 28 turbines." })).toBeTruthy();
    expect(screen.getAllByRole("tab").map((t) => t.textContent)).toEqual(["Overview", "Supply chain", "Evidence & reasoning"]);
    fireEvent.click(screen.getByRole("button", { name: "Update owner response" }));
    fireEvent.click(screen.getByRole("button", { name: "Yes" }));
    fireEvent.change(screen.getByLabelText("Eligible route checked"), { target: { value: "application" } });
    fireEvent.click(screen.getByRole("button", { name: "Record sample reply and reassess" }));
    expect(screen.getByRole("region", { name: "Updated regulatory assessment" }).textContent).toContain("Readiness condition evidenced");
    history();
    expect(screen.getByRole("region", { name: "Assessment history" }).textContent).toContain("v4");
    expect(screen.getByRole("region", { name: "Assessment history" }).textContent).toContain("v3 · Import-readiness gap confirmed");
    fireEvent.click(screen.getByRole("button", { name: "← Production commitment" }));
    fireEvent.click(screen.getByRole("button", { name: "Reopen supplier" }));
    expect(screen.getByRole("region", { name: "Updated regulatory assessment" }).textContent).toContain("Readiness condition evidenced");
    history();
    fireEvent.click(screen.getByRole("button", { name: "Reset case for replay" }));
    expect(document.querySelector("[data-regulatory-status]")?.getAttribute("data-regulatory-status")).toBe("applicability-review");
    expect(screen.queryByRole("button", { name: "Record sample reply and reassess" })).toBeNull();
  });
  it("keeps an unknown response unresolved while showing attributed fictional purchase value", () => {
    render(<RegulatoryProvider><Flow /></RegulatoryProvider>);
    answer("Yes", true); answer("Unknown");
    expect(document.querySelector("[data-regulatory-status]")?.getAttribute("data-regulatory-status")).toBe("readiness-review");
    expect(screen.getByRole("dialog").textContent).not.toContain("Import-readiness gap confirmed");
    expect(screen.getByRole("dialog").textContent).toContain("$4,800,000");
    expect(screen.getByRole("dialog").textContent).toContain("Latest useful action time");
    expect(screen.getByRole("dialog").textContent).not.toMatch(/34-day|rework|weld repair/);
  });
  it.each(["refused", "delayed"])("keeps a %s readiness reply distinct from a negative confirmation", (value) => {
    render(<RegulatoryProvider><Flow /></RegulatoryProvider>);
    answer("Yes", true);
    fireEvent.change(screen.getByLabelText("Other owner reply"), { target: { value } });
    fireEvent.click(screen.getByRole("button", { name: "Record sample reply and reassess" }));
    expect(document.querySelector("[data-regulatory-status]")?.getAttribute("data-regulatory-status")).toBe("readiness-review");
    expect(document.querySelector("[data-current-readiness]")?.textContent).toContain(value);
  });
  it("requires a fresh readiness reply after the scope changes", () => {
    render(<RegulatoryProvider><Flow /></RegulatoryProvider>);
    answer("Yes", true); answer("Yes");
    history();
    fireEvent.click(screen.getByRole("button", { name: "Review scope check" }));
    answer("No", true);
    expect(document.querySelector("[data-regulatory-status]")?.getAttribute("data-regulatory-status")).toBe("scope-excluded");
    fireEvent.click(screen.getByRole("button", { name: "Update owner response" }));
    answer("Yes", true);
    expect(document.querySelector("[data-regulatory-status]")?.getAttribute("data-regulatory-status")).toBe("readiness-review");
    expect(document.querySelector("[data-current-readiness]")?.textContent).toContain("No readiness reply recorded");
    expect(screen.queryByRole("button", { name: "Record sample reply and reassess" })).toBeNull();
  });
});
