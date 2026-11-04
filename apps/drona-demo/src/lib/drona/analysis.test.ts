import { describe, expect, it } from "vitest";

import { analysisConclusion, analysisSteps } from "./analysis";

/* The sequence and the conclusion quote the same derived figures the cards show,
   for whichever order is open — never the flagship's figures on another order. */
describe("analysis — per commitment", () => {
  it("quotes each order's own reference, parts and exposure", () => {
    const c1 = analysisSteps("c1");
    const c2 = analysisSteps("c2");
    expect(c1.find((s) => s.id === "components")?.resolved).toBe("438 components resolved");
    expect(c2.find((s) => s.id === "components")?.resolved).toBe("268 components resolved");
    expect(c2[0]?.resolved).toContain("PO-2026-0392");
    expect(c2.at(-1)?.resolved).toBe("60 of 60 units carry a critical dependency");
  });

  it("keeps Wind Energy's conclusion about the gap between the two clear figures", () => {
    const [, second] = analysisConclusion("c1");
    expect(second).toContain("60 units are clear of critical risk");
    expect(second).toContain("only 40");
  });

  /* On Highland there is no comfortable figure to misread, so the conclusion must
     not print one — and must name the opposite misreading instead. */
  it("tells Highland's whole-order story without claiming any unit is clear", () => {
    const text = analysisConclusion("c2").join(" ");
    expect(text).toContain("Every one of the 60 turbines");
    expect(text).toContain("nacelle transformer");
    expect(text).toContain("6 other suppliers on this order are in critical concern");
    expect(text).not.toMatch(/units are clear/);
  });

  it("resolves the sub-tier step from the mapped networks, and says so when there are none", () => {
    const subtier = (id: string) => analysisSteps(id).find((s) => s.id === "subtier")?.resolved;
    expect(subtier("c1")).toMatch(/^\d+ sub-tier parties behind 5 critical Tier-1s$/);
    expect(subtier("c2")).toBe("No sub-tier network mapped for this order yet");
  });
});
