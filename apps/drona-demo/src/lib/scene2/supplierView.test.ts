import { describe, expect, it } from "vitest";

import { rollupFor } from "@/lib/network/bom";
import { SUPPLIERS } from "@/lib/network/gazetteer";
import { ACTION_TABLE, actionFor } from "./supplierActions";
import {
  DEFAULT_WORKBENCH,
  bandCounts,
  resultHeading,
  supplierRecords,
  visibleSuppliers,
  workbenchScope,
  type WorkbenchState,
} from "./supplierView";

const state = (patch: Partial<WorkbenchState>): WorkbenchState => ({ ...DEFAULT_WORKBENCH, ...patch });
const names = (id: string, s: WorkbenchState, assessed = true): readonly string[] =>
  visibleSuppliers(supplierRecords(id, assessed), s).map((r) => r.supplier.name);

describe("supplierRecords", () => {
  it("presents the current authored material-response window on cards and list", () => {
    const deccan = supplierRecords("c1", true).find((r) => r.supplier.id === "sup:deccan-mainshaft-forgings")!;
    expect(deccan.action?.note).toContain("closes in 4 days");
    expect(deccan.action?.note).not.toContain("closes in 9 days");
  });
  it("carries no band, cause or action before an assessment", () => {
    const rows = supplierRecords("c2", false);
    expect(rows).toHaveLength(26);
    expect(rows.every((r) => r.band === null && r.action === null && r.because === null)).toBe(true);
  });

  it("reads bands from the same banding as Drona's rollup", () => {
    const counts = bandCounts(supplierRecords("c1", true));
    const rollup = rollupFor("c1");
    expect(counts).toEqual({
      all: 41,
      critical: rollup.critical.assemblies,
      elevated: rollup.elevated.assemblies,
      low: rollup.low.assemblies,
      needsAction: 8,
    });
    expect(counts).toMatchObject({ critical: 5, elevated: 19, low: 17 });
  });

  it("gives orders without a BOM no bands even when asked for them", () => {
    const rows = supplierRecords("c3", true);
    expect(rows.every((r) => r.band === null && r.action === null)).toBe(true);
  });

  it("leaves the working-capital provision unset", () => {
    expect(supplierRecords("c1", true).every((r) => r.capitalRequest === undefined)).toBe(true);
  });
});

describe("ordering", () => {
  it("defaults to critical, then elevated, then low", () => {
    const rows = visibleSuppliers(supplierRecords("c1", true), DEFAULT_WORKBENCH);
    const bands = rows.map((r) => r.band);
    expect(bands.slice(0, 5).every((b) => b === "critical")).toBe(true);
    expect(bands.slice(5, 24).every((b) => b === "elevated")).toBe(true);
    expect(bands.slice(24).every((b) => b === "low")).toBe(true);
  });

  it("puts suppliers needing action first within a band, then the narrowest window", () => {
    const elevated = names("c1", state({ band: "elevated" }));
    const flagged = elevated.slice(0, 3);
    expect(flagged).toEqual(["Rourkela Plate Mills", "Vadodara Converter Assemblies", "Padappai Yaw Bearings"]);
    /* Unflagged elevated suppliers follow by window: Durgapur (29 days) leads. */
    expect(elevated[3]).toBe("Durgapur Heat Treatment");
  });

  it("orders critical suppliers by window when all of them need action", () => {
    expect(names("c1", state({ band: "critical" }))).toEqual([
      "Deccan Mainshaft Forgings",
      "Kovai Castings & Machining",
      "Tiruchi Tower Sections",
      "Saurashtra Ductile Castings",
      "Ludhiana Ring Forgings",
    ]);
  });

  it("keeps snapshot order before assessment, whatever the sort", () => {
    const snapshot = supplierRecords("c2", false).map((r) => r.supplier.name);
    expect(names("c2", DEFAULT_WORKBENCH, false)).toEqual(snapshot);
  });

  it("sorts A–Z on request, and the sort survives a filter", () => {
    const az = names("c1", state({ sort: "name", band: "critical" }));
    expect(az).toEqual([...az].sort((a, b) => a.localeCompare(b)));
    expect(az).toHaveLength(5);
  });
});

describe("filtering", () => {
  it("treats Needs action as its own filter, not a synonym for critical", () => {
    const flagged = visibleSuppliers(supplierRecords("c1", true), state({ needsAction: true }));
    expect(flagged).toHaveLength(8);
    expect(flagged.some((r) => r.band === "elevated")).toBe(true);
  });

  it("combines band and Needs action", () => {
    expect(names("c1", state({ band: "elevated", needsAction: true }))).toHaveLength(3);
    expect(names("c1", state({ band: "low", needsAction: true }))).toHaveLength(0);
  });

  it("does not change the records it filters", () => {
    const rows = supplierRecords("c1", true);
    const before = rows.map((r) => r.supplier.id);
    visibleSuppliers(rows, state({ band: "critical", sort: "name" }));
    expect(rows.map((r) => r.supplier.id)).toEqual(before);
  });
});

describe("resultHeading", () => {
  it("names the whole set without a second count", () => {
    expect(resultHeading(DEFAULT_WORKBENCH, 41, 41)).toEqual({ title: "Direct suppliers · 41", scope: null });
  });

  it("names the filter and the share of the whole", () => {
    expect(resultHeading(state({ band: "critical" }), 5, 41)).toEqual({
      title: "Critical suppliers · 5",
      scope: "5 of 41 direct suppliers",
    });
    expect(resultHeading(state({ needsAction: true }), 8, 41)).toEqual({
      title: "Needs action · 8",
      scope: "8 of 41 direct suppliers",
    });
    expect(resultHeading(state({ band: "elevated", needsAction: true }), 3, 41)).toEqual({
      title: "Elevated, needs action · 3",
      scope: "3 of 41 direct suppliers",
    });
  });
});

describe("workbenchScope", () => {
  it("is null when the workbench shows every supplier", () => {
    expect(workbenchScope(DEFAULT_WORKBENCH, 41)).toBeNull();
  });

  it("carries the filter and the number shown", () => {
    expect(workbenchScope(state({ band: "critical" }), 5)).toEqual({ band: "critical", needsAction: false, shown: 5 });
    expect(workbenchScope(state({ needsAction: true }), 8)).toEqual({ band: "all", needsAction: true, shown: 8 });
  });
});

describe("the synthetic action table", () => {
  it("names only suppliers the gazetteer has, on orders they supply", () => {
    for (const [commitmentId, entries] of Object.entries(ACTION_TABLE)) {
      for (const name of Object.keys(entries)) {
        const supplier = SUPPLIERS.find((s) => s.name === name);
        expect(supplier, name).toBeDefined();
        expect(supplier?.commitmentIds).toContain(commitmentId);
      }
    }
  });

  it("states a window only from the order's own figures", () => {
    /* Deccan on Wind Energy: 5 days of coverage plus 4 days of margin. */
    expect(actionFor("c1", "Deccan Mainshaft Forgings", 9)?.note).toBe("Intervention window closes in 9 days");
    expect(actionFor("c1", "Ambattur Fastener Systems", 100)).toBeNull();
  });
});
