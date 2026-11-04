import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import * as React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DronaWorkspace } from "./DronaWorkspace";

afterEach(cleanup);

/* Radix Tabs activates on mousedown, not click. */
const pick = (el: HTMLElement) => {
  fireEvent.mouseDown(el, { button: 0 });
  fireEvent.click(el);
};

describe("DronaWorkspace", () => {
  it("opens on the Assistant, and Investigate opens Wind Energy", () => {
    const onOpen = vi.fn();
    render(<DronaWorkspace onOpen={onOpen} />);
    expect(screen.getByRole("tab", { name: "Assistant" }).getAttribute("aria-selected")).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: "Investigate" }));
    expect(onOpen).toHaveBeenCalledWith("c1");
  });

  it("What changed? switches to Activity", () => {
    render(<DronaWorkspace onOpen={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "What changed?" }));
    expect(screen.getByRole("tab", { name: /Activity/ }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getByRole("list", { name: "Activity" })).toBeTruthy();
  });

  it("adds a team note to the top of Activity", () => {
    render(<DronaWorkspace onOpen={() => {}} />);
    pick(screen.getByRole("tab", { name: /Activity/ }));
    const input = screen.getByLabelText("Add a note for the team");
    fireEvent.change(input, { target: { value: "Calling Deccan at 10." } });
    fireEvent.click(screen.getByRole("button", { name: "Post note" }));
    const first = screen.getByRole("list", { name: "Activity" }).querySelector("li")!;
    expect(first.textContent).toContain("Calling Deccan at 10.");
    expect(first.textContent).toContain("You");
    expect((input as HTMLInputElement).value).toBe("");
  });

  it("shows the evidence behind the note in an overlay", () => {
    render(<DronaWorkspace onOpen={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "Evidence" }));
    expect(screen.getByRole("dialog", { name: "What the Wind Energy note rests on" })).toBeTruthy();
  });
});
