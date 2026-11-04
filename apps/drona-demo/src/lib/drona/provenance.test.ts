import { describe, expect, it } from "vitest";

import { ledgerSummary, provenanceLedger } from "./provenance";
import {
  CONFIDENCE_MEANING,
  dependencyChain,
  tracedComponents,
} from "@/lib/network/dependencies";

const MAIN_SHAFT = "cmp:main-shaft-forging";
const TRACED = tracedComponents().map((c) => c.id);

describe("provenanceLedger", () => {
  it("resolves for every traced assembly and for nothing else", () => {
    for (const id of TRACED) expect(provenanceLedger(id)).toBeDefined();
    expect(provenanceLedger("cmp:tower-plate")).toBeUndefined();
  });

  it("carries one row per edge, plus the contract the chain starts from", () => {
    for (const id of TRACED) {
      const chain = dependencyChain(id)!;
      expect(provenanceLedger(id)!.rows).toHaveLength(chain.edges.length + 1);
    }
  });

  it("opens on the contracted relationship and never on an inference", () => {
    /* Without a contracted row on screen, "inferred" has nothing to be weaker than
       and the epistemic grammar reads as styling. It is also the only row in the
       chain that is actually a record of this plant's own, so it goes first. */
    for (const id of TRACED) {
      const ledger = provenanceLedger(id)!;
      expect(ledger.rows[0]!.contracted).toBe(true);
      expect(ledger.rows[0]!.confidence).toBe("verified");
      expect(ledger.contracted).toBe(1);
      expect(ledger.rows.slice(1).every((row) => !row.contracted)).toBe(true);
    }
  });

  it("prints every edge's basis and every edge's holding", () => {
    /* A ledger that quietly dropped the weakest edge would be worse than no ledger
       at all. Both fields reach the screen for every relationship, whatever they say. */
    for (const id of TRACED) {
      const chain = dependencyChain(id)!;
      const rows = provenanceLedger(id)!.rows;
      for (const edge of chain.edges) {
        const row = rows.find((r) => r.basis === edge.basis);
        expect(row).toBeDefined();
        expect(row!.holding).toBe(edge.holding);
        expect(row!.holding.length).toBeGreaterThan(8);
      }
    }
  });

  it("states an absence as a row, not as a gap in the list", () => {
    const ledger = provenanceLedger(MAIN_SHAFT)!;
    const absent = ledger.rows.filter((row) => row.confidence === "missing");

    expect(absent).toHaveLength(1);
    expect(ledger.unevidenced).toBe(1);
    expect(absent[0]!.meaning).toBe(CONFIDENCE_MEANING.missing);
    /* The hardest sentence for a system to volunteer, and it is authored as data so
       that it cannot be dropped by a rendering decision. */
    expect(absent[0]!.holding.toLowerCase()).toMatch(/nothing|approval entry/);
  });

  it("names both ends of every relationship, never an id", () => {
    for (const id of TRACED) {
      for (const row of provenanceLedger(id)!.rows) {
        expect(row.from).not.toMatch(/^(u-|s-|cmp:)/);
        expect(row.to).not.toMatch(/^(u-|s-|cmp:)/);
        expect(row.fromRole).toMatch(/^Tier [123] · /);
      }
    }
  });

  it("counts what it holds against what it does not", () => {
    for (const id of TRACED) {
      const ledger = provenanceLedger(id)!;
      expect(ledger.contracted + ledger.resolved + ledger.unevidenced).toBe(
        ledger.rows.length
      );
    }
  });
});

describe("ledgerSummary", () => {
  it("is derived from the rows and ends on the absences", () => {
    const ledger = provenanceLedger(MAIN_SHAFT)!;
    const summary = ledgerSummary(ledger);

    expect(summary).toContain("4 relationships");
    expect(summary).toContain("1 is contracted");
    expect(summary).toContain("2 were resolved");
    /* The last clause is the one that matters; a summary closing on the documents
       held would invert the emphasis every row is arguing for. */
    expect(summary.endsWith("1 rests on no evidence at all.")).toBe(true);
  });

  it("says so plainly when nothing is unevidenced", () => {
    const ledger = provenanceLedger("cmp:rotor-hub-casting")!;
    expect(ledgerSummary(ledger)).toContain("none is unevidenced");
  });
});
