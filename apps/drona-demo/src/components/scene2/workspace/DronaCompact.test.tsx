import * as React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { DronaCompact } from "./DronaCompact";
import { RegulatoryProvider, useRegulatoryCase } from "@/components/regulatory/RegulatoryProvider";
import { mappedSuppliers } from "@/lib/scene2/mappedSuppliers";
import { ORDER_QUESTIONS, orderAnswer, orderQuestionFor } from "@/lib/scene2/orderConversation";
import { INITIAL_REGULATORY_STATE, regulatoryReducer, type RegulatoryState } from "@/lib/regulatory/state";
beforeEach(() => vi.useFakeTimers());
afterEach(() => { cleanup(); vi.useRealTimers(); });
const finishResponse = () => act(() => vi.advanceTimersByTime(3000));
function Controls() {
  const { state, dispatch } = useRegulatoryCase();
  return <><output data-testid="records">{state.records.length}</output><button onClick={() => dispatch({ type: "record-scope", answer: "covered" })}>Covered sample</button><button onClick={() => dispatch({ type: "record-scope", answer: "excluded" })}>Excluded sample</button></>;
}
function Harness() { return <RegulatoryProvider><DronaCompact commitmentId="c1" assessed /><Controls /></RegulatoryProvider>; }
const answer = () => document.querySelector("[data-order-drona-response]")?.textContent;

describe("optional order Drona conversation", () => {
  it("starts empty without duplicating money or findings, and asking does not record evidence", () => {
    render(<Harness />);
    const chat = screen.getByRole("complementary", { name: "Order Drona conversation" });
    expect(within(chat).getByText("Sample responses")).toBeTruthy();
    expect(chat.textContent).not.toContain("$6.4M");
    expect(answer()).toBeUndefined();
    fireEvent.click(within(chat).getByRole("button", { name: "What CBAM evidence is still needed?" }));
    finishResponse();
    expect(answer()).toContain("customs broker");
    expect(screen.getByTestId("records").textContent).toBe("0");
    fireEvent.click(screen.getByRole("button", { name: "Clear conversation" }));
    expect(answer()).toBeUndefined();
    expect(document.activeElement).toBe(screen.getByRole("textbox", { name: "Your question" }));
  });
  it("updates an already selected answer from current evidence, without a stale transcript", () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: "What CBAM evidence is still needed?" }));
    finishResponse();
    expect(answer()).toContain("actual shipped article");
    fireEvent.click(screen.getByRole("button", { name: "Covered sample" }));
    expect(answer()).toContain("Shipment scope is covered");
    expect(answer()).not.toContain("actual shipped article");
    fireEvent.click(screen.getByRole("button", { name: "Excluded sample" }));
    expect(answer()).toContain("excludes this shipment");
    expect(answer()).not.toContain("Shipment scope is covered");
  });
  it("supports bounded typed questions and honestly declines unsupported requests", () => {
    render(<Harness />);
    const input = screen.getByRole("textbox", { name: "Your question" });
    fireEvent.change(input, { target: { value: "How much of this order’s supplier network is mapped?" } });
    fireEvent.click(screen.getByRole("button", { name: "Ask Drona ↗" }));
    finishResponse();
    expect(answer()).toContain(`${mappedSuppliers("c1").total} distinct suppliers`);
    expect((input as HTMLTextAreaElement).value).toBe("");
    fireEvent.change(input, { target: { value: "Call the supplier and approve this payment" } });
    fireEvent.click(screen.getByRole("button", { name: "Ask Drona ↗" }));
    finishResponse();
    expect(answer()).toContain("Live AI is not connected");
    expect(screen.getByTestId("records").textContent).toBe("0");
  });
  it("resets conversation and draft on order change, and does not invent an unassessed finding", () => {
    const view = render(<DronaCompact commitmentId="c1" assessed />);
    fireEvent.click(screen.getByRole("button", { name: "What CBAM evidence is still needed?" }));
    finishResponse();
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "unfinished question" } });
    view.rerender(<DronaCompact commitmentId="c2" assessed={false} />);
    expect(answer()).toBeUndefined();
    expect((screen.getByRole("textbox") as HTMLTextAreaElement).value).toBe("");
    fireEvent.click(screen.getByRole("button", { name: "What CBAM evidence is still needed?" }));
    finishResponse();
    expect(answer()).toContain("no completed detailed assessment");
    expect(answer()).not.toContain("CBAM");
  });
});

describe("sample response buffer", () => {
  it("reveals a brief review sequence before the answer, without writing evidence", () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: "What CBAM evidence is still needed?" }));
    expect(answer()).toBeUndefined();
    expect(within(screen.getByRole("complementary", { name: "Order Drona conversation" })).getByRole("status").getAttribute("aria-busy")).toBe("true");
    expect(screen.getByText("Reviewing order context…")).toBeTruthy();
    act(() => vi.advanceTimersByTime(800));
    expect(screen.getByText("Order context reviewed")).toBeTruthy();
    expect(screen.getByText("Checking evidence state…")).toBeTruthy();
    expect(answer()).toBeUndefined();
    finishResponse();
    expect(answer()).toContain("customs broker");
    expect(within(screen.getByRole("complementary", { name: "Order Drona conversation" })).getByRole("status").getAttribute("aria-busy")).toBe("false");
    expect(document.querySelector("[data-order-drona-review]")).toBeNull();
    expect(screen.getByText("Sample review · 3 steps")).toBeTruthy();
    expect(screen.getByTestId("records").textContent).toBe("0");
  });
  it("replaces a pending question and cancels the earlier timers", () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: "What CBAM evidence is still needed?" }));
    act(() => vi.advanceTimersByTime(1500));
    fireEvent.click(screen.getByRole("button", { name: "How much of this order’s supplier network is mapped?" }));
    act(() => vi.advanceTimersByTime(650));
    expect(answer()).toBeUndefined();
    expect(screen.getByText("Reviewing mapped suppliers…")).toBeTruthy();
    finishResponse();
    expect(answer()).toContain(`${mappedSuppliers("c1").total} distinct suppliers`);
    expect(answer()).not.toContain("customs broker");
  });
  it("cancel, order change and unmount cannot reveal an abandoned answer", () => {
    const view = render(<DronaCompact commitmentId="c1" assessed />);
    fireEvent.click(screen.getByRole("button", { name: "What CBAM evidence is still needed?" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel response" }));
    finishResponse();
    expect(answer()).toBeUndefined();
    expect(document.activeElement).toBe(screen.getByRole("textbox"));
    fireEvent.click(screen.getByRole("button", { name: "What CBAM evidence is still needed?" }));
    view.rerender(<DronaCompact commitmentId="c2" assessed={false} />);
    finishResponse();
    expect(answer()).toBeUndefined();
    fireEvent.click(screen.getByRole("button", { name: "What CBAM evidence is still needed?" }));
    view.unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
  it("uses evidence received during the buffer when the response appears", () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: "What CBAM evidence is still needed?" }));
    fireEvent.click(screen.getByRole("button", { name: "Excluded sample" }));
    finishResponse();
    expect(answer()).toContain("excludes this shipment");
    expect(answer()).not.toContain("actual shipped article");
  });
});

describe("authored answers preserve evidence distinctions", () => {
  it.each(["unknown", "refused", "delayed"] as const)("keeps a %s scope reply unresolved", reply => {
    const state = regulatoryReducer(INITIAL_REGULATORY_STATE, { type: "record-scope", answer: reply });
    const result = orderAnswer("evidence", "c1", true, state).join(" ");
    expect(result).toMatch(reply === "refused" ? /declined/ : reply === "delayed" ? /delayed/ : /not established/);
    expect(result).not.toContain("gap confirmed");
  });
  it.each(["unknown", "refused", "delayed", "gap", "authorised", "application"] as const)("projects the scoped %s readiness reply", reply => {
    let state: RegulatoryState = regulatoryReducer(INITIAL_REGULATORY_STATE, { type: "record-scope", answer: "covered" });
    state = regulatoryReducer(state, { type: "record-readiness", answer: reply });
    const result = orderAnswer("evidence", "c1", true, state).join(" ");
    if (reply === "gap") expect(result).toContain("explicitly confirmed a readiness gap");
    else if (reply === "authorised" || reply === "application") expect(result).toContain("condition is evidenced");
    else expect(result).toContain(reply === "unknown" ? "remains unknown" : reply === "refused" ? "declined" : "delayed");
    expect(state.records).toHaveLength(2);
  });
  it("revised scope invalidates a previously confirmed readiness gap", () => {
    let state = regulatoryReducer(INITIAL_REGULATORY_STATE, { type: "record-scope", answer: "covered" });
    state = regulatoryReducer(state, { type: "record-readiness", answer: "gap" });
    state = regulatoryReducer(state, { type: "record-scope", answer: "excluded" });
    expect(orderAnswer("regulatory", "c1", true, state).join(" ")).toContain("excludes this shipment");
    expect(orderAnswer("evidence", "c1", true, state).join(" ")).not.toContain("readiness gap");
  });
  it("does not turn arbitrary questions into a simulated live answer", () => {
    expect(orderQuestionFor("What is the weather in Denmark?" )).toBe("unsupported");
    expect(orderQuestionFor("Can you change this supplier’s payment?" )).toBe("unsupported");
    expect(orderQuestionFor("How could CBAM affect the tower-section shipment?" )).toBe("regulatory");
  });
});


describe("named order conversation topics", () => {
  it.each(ORDER_QUESTIONS)("routes the typed suggestion: $label", ({ id, label }) => {
    expect(orderQuestionFor(label)).toBe(id);
    expect(orderQuestionFor(label.toUpperCase().replace("’", "'") + "  ")).toBe(id);
  });
  it("recognises topic-specific paraphrases without reviving vague assessment prompts", () => {
    expect(orderQuestionFor("Explain CBAM for the tower sections")).toBe("regulatory");
    expect(orderQuestionFor("Which CBAM documents should we request?")).toBe("evidence");
    expect(orderQuestionFor("How many suppliers are mapped for this order?")).toBe("network");
    expect(orderQuestionFor("What would change this assessment?")).toBe("unsupported");
  });
  it("explains the named shipment and both checks before describing its current state", () => {
    const result = orderAnswer("regulatory", "c1", true, INITIAL_REGULATORY_STATE).join(" ");
    expect(result).toContain("Tiruchi’s tower sections going to Denmark");
    expect(result).toContain("shipment applicability from importer readiness");
    expect(result).toContain("Applicability remains under review");
    expect(result).toContain("does not establish that CBAM applies");
  });
  it.each(["authorised", "application"] as const)("reports the evidenced %s route as resolved", reply => {
    let state = regulatoryReducer(INITIAL_REGULATORY_STATE, { type: "record-scope", answer: "covered" });
    state = regulatoryReducer(state, { type: "record-readiness", answer: reply });
    expect(orderAnswer("evidence", "c1", true, state).join(" ")).toContain("condition is evidenced");
    expect(orderAnswer("regulatory", "c1", true, state).join(" ")).toContain("closes this condition");
  });
});
