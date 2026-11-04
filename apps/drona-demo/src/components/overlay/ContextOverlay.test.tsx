import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import * as React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ContextOverlay, isOverlayOpen } from "./ContextOverlay";

function Harness({ onSceneEscape }: { readonly onSceneEscape: () => void }) {
  const originRef = React.useRef<HTMLElement>(null);
  const [open, setOpen] = React.useState(false);
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !e.defaultPrevented && !isOverlayOpen()) onSceneEscape();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onSceneEscape]);
  return (
    <section ref={originRef}>
      <button type="button" data-overlay-trigger onClick={() => setOpen(true)}>
        Inspect
      </button>
      <ContextOverlay open={open} onOpenChange={setOpen} originRef={originRef} title="Critical dependencies">
        <p>Material 10</p>
      </ContextOverlay>
    </section>
  );
}

afterEach(cleanup);

describe("ContextOverlay", () => {
  it("opens as a titled dialog", () => {
    render(<Harness onSceneEscape={() => {}} />);
    expect(isOverlayOpen()).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "Inspect" }));
    expect(screen.getByRole("dialog", { name: "Critical dependencies" })).toBeTruthy();
    expect(isOverlayOpen()).toBe(true);
  });

  it("marks the summoning card as lifted while open, and releases it on close", async () => {
    const { container } = render(<Harness onSceneEscape={() => {}} />);
    const card = container.querySelector("section")!;
    expect(card.hasAttribute("data-overlay-origin")).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "Inspect" }));
    expect(card.hasAttribute("data-overlay-origin")).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    await waitFor(() => expect(card.hasAttribute("data-overlay-origin")).toBe(false));
  });

  it("closes on Escape without the scene stepping back", async () => {
    const onSceneEscape = vi.fn();
    render(<Harness onSceneEscape={onSceneEscape} />);
    fireEvent.click(screen.getByRole("button", { name: "Inspect" }));
    const dialog = screen.getByRole("dialog");
    await act(async () => {
      fireEvent.keyDown(dialog, { key: "Escape" });
    });
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(onSceneEscape).not.toHaveBeenCalled();
  });

  it("lets the scene handle Escape once nothing is open", () => {
    const onSceneEscape = vi.fn();
    render(<Harness onSceneEscape={onSceneEscape} />);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onSceneEscape).toHaveBeenCalledOnce();
  });

  it("returns focus to the trigger on close", async () => {
    render(<Harness onSceneEscape={() => {}} />);
    const trigger = screen.getByRole("button", { name: "Inspect" });
    trigger.focus();
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(document.activeElement).toBe(trigger);
  });
});
