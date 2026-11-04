import { describe, expect, it } from "vitest";

import { dronaAssistant } from "./assistant";
import { nordvindAttention } from "./attention";

const a = nordvindAttention();
const assistant = dronaAssistant();

describe("dronaAssistant", () => {
  it("heads the observation with one short sentence naming the commitment", () => {
    expect(assistant.headline).toBe("Wind Energy · CBAM readiness.");
    expect(assistant.observation.startsWith("Wind Energy")).toBe(false);
  });

  it("leads with one observation carrying Wind Energy's own figures", () => {
    expect(assistant.observation).toContain(`${a.unitsExposed} of ${a.unitsTotal}`);
    expect(assistant.observation.split(". ").length).toBeLessThanOrEqual(2);
  });

  it("keeps the supporting note to the window, not a finance claim", () => {
    expect(assistant.note).toContain("planned entry 16 Nov");
    expect(assistant.note).toContain("Applicability under review");
    expect(assistant.note.toLowerCase()).not.toMatch(/resolv|fixed/);
  });

  it("reasons in exactly three lines, one per state of knowledge", () => {
    expect(assistant.reasoning.map((r) => r.state)).toEqual(["verified", "inferred", "unresolved"]);
  });

  it("asks the scoped owner question without claiming a negative response", () => {
    expect(assistant.reasoning[2]!.text).toContain("Ask the customs owner");
    expect(assistant.reasoning[2]!.text).toContain("Missing evidence is not failure");
  });
});
