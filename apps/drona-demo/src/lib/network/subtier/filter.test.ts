import { describe, expect, it } from "vitest";

import { ALL_SUBTIER, isFiltered, passes, toggleAbroad, toggleFlagged, toggleRole } from "./filter";
import { subTierNetworkFor } from "./index";

const deccan = subTierNetworkFor("sup:deccan-mainshaft-forgings")!;

describe("sub-tier filter", () => {
  it("shows everything by default", () => {
    expect(isFiltered(ALL_SUBTIER)).toBe(false);
    expect(deccan.nodes.every((n) => passes(n, ALL_SUBTIER))).toBe(true);
  });

  it("toggles without mutating", () => {
    const off = toggleRole(ALL_SUBTIER, "logistics");
    expect(ALL_SUBTIER.roles.has("logistics")).toBe(true);
    expect(off.roles.has("logistics")).toBe(false);
    expect(toggleRole(off, "logistics").roles.has("logistics")).toBe(true);
    expect(isFiltered(off)).toBe(true);
  });

  it("narrows to flagged or foreign parties", () => {
    const flagged = deccan.nodes.filter((n) => passes(n, toggleFlagged(ALL_SUBTIER)));
    expect(flagged.every((n) => n.weakLink || n.node.signals.length > 0)).toBe(true);
    const abroad = deccan.nodes.filter((n) => passes(n, toggleAbroad(ALL_SUBTIER)));
    expect(abroad.every((n) => n.weakLink || n.abroad)).toBe(true);
    expect(abroad.length).toBeLessThan(deccan.nodes.length);
  });

  it("never hides the weak link", () => {
    const nothing = [...ALL_SUBTIER.roles].reduce(toggleRole, ALL_SUBTIER);
    const shown = deccan.nodes.filter((n) => passes(n, nothing));
    expect(shown).toHaveLength(1);
    expect(shown[0]?.weakLink).toBe(true);
  });
});
