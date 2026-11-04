import { describe, expect, it } from "vitest";
import { INITIAL_INQUIRY, deccanInquiry, materialFinding, materialConditionClosed, supplierInquiryReducer, type OwnerReply, type QuestionId, type SupplierInquiryState } from "./inquiry";
const reply = (state: SupplierInquiryState, questionId: QuestionId, answer: OwnerReply) => supplierInquiryReducer(state, { type: "reply", questionId, answer });
describe("order-specific material inquiry", () => {
  it.each(["unknown", "refused", "delayed"] as const)("retains %s without confirming or closing the forecast", answer => {
    const state = reply(INITIAL_INQUIRY, "allocation", answer);
    expect(deccanInquiry(state).question.id).toBe("allocation");
    expect(deccanInquiry(state).conclusion).toBeNull();
    expect(materialFinding(state)).toBe("forecast-review");
    expect(state.replies[0].answer).toBe(answer);
  });
  it("rejects an arrival answer before the scoped stock questions", () => {
    expect(reply(INITIAL_INQUIRY, "arrival", "yes")).toBe(INITIAL_INQUIRY);
  });
  it("narrows the condition only when the full on-site allocation is evidenced", () => {
    const state = reply(INITIAL_INQUIRY, "allocation", "yes");
    expect(materialFinding(state)).toBe("stock-protected");
    expect(materialConditionClosed(state)).toBe(true);
    expect(deccanInquiry(state).summary).toContain("does not establish overall production or delivery");
    expect(reply(state, "arrival", "yes")).toBe(state);
  });
  it("checks local cover before substantiating a late-receipt forecast", () => {
    const uncovered = reply(INITIAL_INQUIRY, "allocation", "no");
    expect(deccanInquiry(uncovered).question.id).toBe("dealer-stock");
    const noDealer = reply(uncovered, "dealer-stock", "no");
    expect(deccanInquiry(noDealer).question.id).toBe("arrival");
    expect(materialFinding(noDealer)).toBe("forecast-review");
    const gap = reply(noDealer, "arrival", "yes");
    expect(materialFinding(gap)).toBe("timing-gap");
    expect(deccanInquiry(gap).question.action).toContain("6 Nov");
    expect(materialConditionClosed(gap)).toBe(false);
  });
  it("retains future delivery uncertainty after a scoped dealer reservation", () => {
    const cover = reply(reply(INITIAL_INQUIRY, "allocation", "no"), "dealer-stock", "yes");
    expect(materialFinding(cover)).toBe("dealer-cover");
    expect(deccanInquiry(cover).summary).toContain("Receipt remains a future milestone");
  });
  it("accepts earlier usable receipt as counterevidence and resets explicitly", () => {
    const state = reply(reply(reply(INITIAL_INQUIRY, "allocation", "no"), "dealer-stock", "no"), "arrival", "no");
    expect(materialFinding(state)).toBe("arrival-revised");
    expect(supplierInquiryReducer(state, { type: "reset" })).toBe(INITIAL_INQUIRY);
  });
});
