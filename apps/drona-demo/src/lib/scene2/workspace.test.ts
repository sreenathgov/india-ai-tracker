import { describe, expect, it } from "vitest";

import { suppliersForCommitment } from "@/lib/network/gazetteer";
import { bomSummary, missingInputs, plannedSuppliers } from "./workspace";

describe("planned suppliers", () => {
  it("lists the order's direct suppliers, each joined to what it delivers on this order", () => {
    const rows = plannedSuppliers("c2");
    expect(rows).toHaveLength(26);
    expect(rows.map((r) => r.supplier.id)).toEqual(suppliersForCommitment("c2").map((s) => s.id));
    expect(rows.every((r) => r.onOrder !== null && r.onOrder.length > 0)).toBe(true);
  });

  it("does not invent an on-order assembly where the order has no bill of materials", () => {
    const rows = plannedSuppliers("c4");
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((r) => r.onOrder === null)).toBe(true);
  });
});

describe("baseline facts", () => {
  it("summarises the BOM only where one exists", () => {
    expect(bomSummary("c2")).toMatchObject({ assemblies: 26 });
    expect(bomSummary("c2")!.parts).toBeGreaterThan(0);
    expect(bomSummary("c4")).toBeNull();
  });

  it("names the inputs the snapshot does not carry", () => {
    expect(missingInputs("c2")).not.toContain("Bill of materials");
    expect(missingInputs("c2")).toContain("BOM revision");
    expect(missingInputs("c4")).toContain("Bill of materials");
  });
});

