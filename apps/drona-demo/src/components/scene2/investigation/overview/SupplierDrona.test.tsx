import * as React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { deccanInquiry, INITIAL_INQUIRY } from "@/lib/scene2/investigation/inquiry";
import { SupplierDrona } from "./SupplierDrona";
afterEach(cleanup);
const props = { scopeKey: "c1:deccan", supplierName: "Deccan", orderReference: "PO-2026-0417", summary: "A shared processing line controls this order.", question: deccanInquiry(INITIAL_INQUIRY).question, basis: "Authored case" };
describe("supplier-context conversation", () => {
  it("clears both the answer and unsent draft when the supplier or order changes", () => {
    const view = render(<SupplierDrona {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "Why does this affect my order?" }));
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "An unsent supplier question" } });
    view.rerender(<SupplierDrona {...props} scopeKey="c2:tiruchi" supplierName="Tiruchi" summary="A different order." />);
    expect((screen.getByRole("textbox") as HTMLTextAreaElement).value).toBe("");
    expect(screen.queryByText(props.summary)).toBeNull();
  });
  it("updates an open explanation from the current case rather than retaining an old answer", () => {
    const view = render(<SupplierDrona {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "Why does this affect my order?" }));
    view.rerender(<SupplierDrona {...props} summary="A new scoped reply narrows this concern." />);
    expect(screen.getByText("A new scoped reply narrows this concern.")).toBeTruthy();
    expect(screen.queryByText(props.summary)).toBeNull();
  });
  it("does not pretend an unsupported request is connected to live voice or AI", () => {
    render(<SupplierDrona {...props} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Transcribe this call" } });
    fireEvent.click(screen.getByRole("button", { name: "Ask Drona ↗" }));
    expect(screen.getByText(/Live AI, call listening and transcription are not connected/)).toBeTruthy();
  });
});
