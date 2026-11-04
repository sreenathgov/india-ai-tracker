import { describe, expect, it } from "vitest";

import { bomFor, hasBom } from "./bom";
import { COMMITMENTS } from "./gazetteer";
import { SUPPLIERS } from "./suppliers";
import type { Sourcing } from "./types";

const india = SUPPLIERS.filter((s) => s.country === "India");
const abroad = SUPPLIERS.filter((s) => s.country !== "India");

/* Every authored bill of materials, not just the flagship's. */
const ALL_BOM_ROWS = COMMITMENTS.filter((c) => hasBom(c.id)).flatMap((c) => bomFor(c.id));

const sourcingFor = (approvedSources: number): Sourcing =>
  approvedSources <= 1 ? "sole" : approvedSources === 2 ? "dual" : "multi";

describe("the supplier base", () => {
  it("holds 80 suppliers: 50 in India and 30 abroad", () => {
    expect(SUPPLIERS).toHaveLength(80);
    expect(india).toHaveLength(50);
    expect(abroad).toHaveLength(30);
  });

  it("spreads the Indian base across at least five regions", () => {
    expect(new Set(india.map((s) => s.region)).size).toBeGreaterThanOrEqual(5);
  });

  it("spreads the foreign base across at least eight countries", () => {
    expect(new Set(abroad.map((s) => s.country)).size).toBeGreaterThanOrEqual(8);
  });

  it("gives every supplier a unique id", () => {
    expect(new Set(SUPPLIERS.map((s) => s.id)).size).toBe(SUPPLIERS.length);
  });

  it("carries the metadata a reviewer needs on every record", () => {
    for (const s of SUPPLIERS) {
      expect(s.supplies.length, s.name).toBeGreaterThan(0);
      expect(s.leadTimeDays, s.name).toBeGreaterThan(0);
      expect(s.certifications.length, s.name).toBeGreaterThan(0);
      expect(s.region, s.name).not.toBe("");
      expect(s.commitmentIds.length, s.name).toBeGreaterThan(0);
    }
  });

  it("binds only to commitments that exist", () => {
    const known = new Set(COMMITMENTS.map((c) => c.id));
    for (const s of SUPPLIERS) {
      for (const id of s.commitmentIds) expect(known.has(id), `${s.name} → ${id}`).toBe(true);
    }
  });

  it("never marks a low-concern supplier as mitigated", () => {
    expect(SUPPLIERS.filter((s) => s.concern === "low" && s.mitigated)).toHaveLength(0);
  });
});

describe("agreement with the bill of materials", () => {
  it("files every assembly under its supplier's category", () => {
    for (const c of ALL_BOM_ROWS) {
      const supplier = SUPPLIERS.find((s) => s.id === c.supplierId);
      expect(supplier?.category, c.name).toBe(c.system);
    }
  });

  it("lists every assembly among what the supplier supplies", () => {
    for (const c of ALL_BOM_ROWS) {
      const supplier = SUPPLIERS.find((s) => s.id === c.supplierId);
      expect(supplier?.supplies, c.name).toContain(c.name);
    }
  });

  it("states the same lead time and sourcing position as the BOM", () => {
    for (const c of ALL_BOM_ROWS) {
      const supplier = SUPPLIERS.find((s) => s.id === c.supplierId);
      expect(supplier?.leadTimeDays, c.name).toBe(c.leadTimeDays);
      expect(supplier?.sourcing, c.name).toBe(sourcingFor(c.approvedSources));
    }
  });

  it("keeps every one of the 57 suppliers the BOMs name", () => {
    expect(new Set(ALL_BOM_ROWS.map((c) => c.supplierId)).size).toBe(57);
  });
});
