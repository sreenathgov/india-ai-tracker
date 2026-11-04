import { describe, expect, it } from "vitest";

import { portfolioRows } from "@/lib/portfolio/portfolio";
import { applyFilter, toggleFilter } from "./filter";

describe("surface filter", () => {
  const rows = portfolioRows();

  it("narrows by state and by dependency type", () => {
    expect(applyFilter(rows, { kind: "state", state: "monitoring" }).map((r) => r.commitment.id)).toEqual(["c5"]);
    expect(applyFilter(rows, { kind: "type", type: "external" }).map((r) => r.commitment.id)).toEqual(["c5"]);
    expect(applyFilter(rows, null)).toBe(rows);
  });

  it("clears when the same filter is chosen twice", () => {
    const action = { kind: "state", state: "action" } as const;
    expect(toggleFilter(null, action)).toEqual(action);
    expect(toggleFilter(action, action)).toBeNull();
    expect(toggleFilter(action, { kind: "type", type: "material" })).toEqual({ kind: "type", type: "material" });
  });
});
