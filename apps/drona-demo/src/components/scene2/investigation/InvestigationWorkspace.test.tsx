import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import * as React from "react";
import { afterEach, describe, expect, it } from "vitest";

import { DEFAULT_WORKBENCH, type WorkbenchState } from "@/lib/scene2/supplierView";
import { InvestigationWorkspace } from "./InvestigationWorkspace";
import { SupplierInquiryProvider } from "./overview/SupplierInquiryProvider";

const DECCAN = "sup:deccan-mainshaft-forgings";

/** The workbench's own wiring, in miniature: card opens, workspace closes. */
function Harness(): React.ReactElement {
  const [state, setState] = React.useState<WorkbenchState>(DEFAULT_WORKBENCH);
  const openId = state.investigation?.supplierId ?? null;
  return (
    <div>
      <button
        type="button"
        data-supplier-card={DECCAN}
        aria-haspopup="dialog"
        aria-expanded={openId === DECCAN}
        onClick={() => setState((s) => ({ ...s, investigation: { supplierId: DECCAN, tab: "overview" } }))}
      >
        Deccan Mainshaft Forgings
      </button>
      <InvestigationWorkspace
        commitmentId="c1"
        supplierId={openId}
        tab={state.investigation?.tab ?? "overview"}
        assessed
        onTabChange={(tab) => setState((s) => (openId ? { ...s, investigation: { supplierId: openId, tab } } : s))}
        onClose={() => setState((s) => ({ ...s, investigation: null }))}
      />
    </div>
  );
}

const openWorkspace = (): HTMLElement => {
  render(<SupplierInquiryProvider><Harness /></SupplierInquiryProvider>);
  fireEvent.click(screen.getByRole("button", { name: "Deccan Mainshaft Forgings" }));
  return screen.getByRole("dialog");
};

/** Radix hides the background from the a11y tree, so the card is found by its hook. */
const card = (): HTMLElement => document.querySelector<HTMLElement>(`[data-supplier-card="${DECCAN}"]`)!;

/** Radix tabs select on mousedown, not click. */
const selectTab = (tab: HTMLElement): void => {
  fireEvent.mouseDown(tab, { button: 0, ctrlKey: false });
};

/**
 * jsdom has no WAAPI, so `play()` would skip silently and a workspace that never
 * animates would look identical to one that does. Recording the calls is the only
 * way this suite can tell the difference.
 */
type AnimateCall = { readonly el: HTMLElement; readonly frames: unknown };
const recordAnimations = (): AnimateCall[] => {
  const calls: AnimateCall[] = [];
  const el = HTMLElement.prototype as unknown as { animate?: unknown };
  el.animate = function (this: HTMLElement, frames: unknown) {
    calls.push({ el: this, frames });
    return { finished: Promise.resolve(), cancel: () => undefined };
  };
  return calls;
};

afterEach(() => {
  delete (HTMLElement.prototype as unknown as { animate?: unknown }).animate;
  cleanup();
});

describe("InvestigationWorkspace", () => {
  it("opens as a dialog titled by the supplier", () => {
    const dialog = openWorkspace();
    expect(within(dialog).getByRole("heading", { name: "Deccan Mainshaft Forgings" })).toBeTruthy();
  });

  it("states which order, which component and what is at stake", () => {
    const dialog = openWorkspace();
    expect(dialog.textContent).toContain("PO-2026-0417");
    expect(dialog.textContent).toContain("Main Shaft Forging");
    expect(dialog.textContent).toContain("12 / 100");
    expect(dialog.textContent).toContain("4 days");
    expect(dialog.textContent).toContain("$1,600,000");
    expect(dialog.textContent).toContain("06 Nov 2026");
    expect(dialog.textContent).not.toContain("9-day action window");
  });

  it("routes three surfaces, with Overview showing first", () => {
    const dialog = openWorkspace();
    const tabs = within(dialog).getAllByRole("tab");
    expect(tabs.map((t) => t.textContent)).toEqual([
      "Overview",
      "Supply chain",
      "Evidence & reasoning",
    ]);
    expect(tabs[0].getAttribute("aria-selected")).toBe("true");
  });

  it("names finance relevance without offering a finance workflow", () => {
    const dialog = openWorkspace();
    const finance = dialog.querySelector("[data-finance-relevance]")!;
    expect(finance.textContent).toContain("Finance relevance to this exposure");
    expect(finance.querySelector("button")).toBeNull();
    expect(finance.querySelector("form")).toBeNull();
  });

  it("keeps inquiry and actions together and preserves recorded evidence when inspecting the network", () => {
    const dialog = openWorkspace();
    fireEvent.click(within(dialog).getByRole("button", { name: "No" }));
    fireEvent.click(within(dialog).getByRole("button", { name: "Record sample reply and reassess" }));
    expect(dialog.textContent).toContain("Has the dealer reserved unaffected local stock");
    expect(dialog.textContent).toContain("Next useful action");
    selectTab(within(dialog).getByRole("tab", { name: "Supply chain" }));
    selectTab(within(dialog).getByRole("tab", { name: "Overview" }));
    expect(dialog.textContent).toContain("Has the dealer reserved unaffected local stock");
    expect(within(dialog).queryByRole("tab", { name: "Actions" })).toBeNull();
  });

  it("opens the evidence and reasoning graph on the decision path", () => {
    const dialog = openWorkspace();
    selectTab(within(dialog).getByRole("tab", { name: "Evidence & reasoning" }));
    const panel = dialog.querySelector("[data-evidence-panel]")!;
    expect(panel.querySelector("[data-reasoning-canvas]")).not.toBeNull();
    expect(dialog.querySelector('[data-pending-tab="evidence"]')).toBeNull();
  });

  it("opens the supply chain on the critical path, with the order anchoring it", () => {
    const dialog = openWorkspace();
    selectTab(within(dialog).getByRole("tab", { name: "Supply chain" }));
    const panel = dialog.querySelector("[data-supply-chain]")!;
    expect(panel.querySelector("[data-graph-canvas]")).not.toBeNull();
    expect(panel.querySelector('[data-graph-node]')).not.toBeNull();
    /* The view opens on the critical path rather than on the whole network. */
    const critical = within(panel as HTMLElement).getByRole("button", { name: "Critical path" });
    expect(critical.getAttribute("aria-pressed")).toBe("true");
    /* Nothing on the canvas is selected until the reader selects it. */
    expect(panel.querySelector("[data-node-inspector]")).toBeNull();
  });

  it("closes on Escape and returns focus to the card it opened from", async () => {
    const dialog = openWorkspace();
    await act(async () => {
      fireEvent.keyDown(dialog, { key: "Escape" });
    });
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(document.activeElement?.getAttribute("data-supplier-card")).toBe(DECCAN);
  });

  it("qualifies a forward-looking claim with its horizon and its confidence", () => {
    const dialog = openWorkspace();
    /* A forecast read without a horizon is a slogan; the reader needs both. */
    const qualifier = dialog.querySelector("[data-forecast-qualifier]");
    expect(qualifier?.textContent).toContain("13–15 days");
    expect(qualifier?.textContent).toContain("Moderate confidence");
  });

  it("animates the workspace open, not just into place", () => {
    const calls = recordAnimations();
    const dialog = openWorkspace();
    /* Radix mounts the portal a commit late; the motion must still reach it. */
    expect(calls.some((c) => c.el === dialog)).toBe(true);
  });

  it("lifts the card it grew from, and releases it on close", async () => {
    const dialog = openWorkspace();
    const opener = card();
    expect(opener.hasAttribute("data-overlay-origin")).toBe(true);
    await act(async () => {
      fireEvent.click(within(dialog).getByRole("button", { name: "Order workspace" }));
    });
    await waitFor(() => expect(opener.hasAttribute("data-overlay-origin")).toBe(false));
  });
});
