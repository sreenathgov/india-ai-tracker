import { describe, expect, it } from "vitest";

import { EVIDENCE_FILTER_GROUP, SOURCE_TYPE_LABEL } from "@/components/scene2/investigation/labels";
import { bomFor, unitsExposed } from "@/lib/network/bom";
import { supplierRecords } from "@/lib/scene2/supplierView";
import { INVESTIGATIONS, investigationFor } from "./registry";
import {
  actionWindow,
  affectedSerials,
  affectedUnits,
  claimsForEvidence,
  claimsSupportedBy,
  evidenceRegisterRows,
  evidenceState,
  investigationHeader,
  serialUnion,
} from "./select";

const DECCAN = "sup:deccan-mainshaft-forgings";
const HAMBURG = "sup:hamburg-drive-controls";

describe("investigationFor", () => {
  it("finds an authored investigation by order and supplier", () => {
    expect(investigationFor("c1", DECCAN)?.supplierId).toBe(DECCAN);
  });

  it("returns null where none is authored, rather than borrowing one", () => {
    expect(investigationFor("c1", HAMBURG)).toBeNull();
    expect(investigationFor("c2", DECCAN)).toBeNull();
  });
});

describe("affectedUnits", () => {
  it("counts turbine serials from the bill of materials", () => {
    expect(affectedUnits("c1", DECCAN)).toBe(12);
    expect(affectedUnits("c1", "sup:saurashtra-ductile-castings")).toBe(24);
    expect(affectedUnits("c1", "sup:kovai-castings-machining")).toBe(12);
    expect(affectedUnits("c1", "sup:tiruchi-tower-sections")).toBe(28);
    expect(affectedUnits("c1", "sup:durgapur-heat-treatment")).toBe(17);
  });

  it("matches unitsExposed for every single-assembly supplier", () => {
    const bom = bomFor("c1");
    for (const c of bom.filter((x) => bom.filter((y) => y.supplierId === x.supplierId).length === 1)) {
      expect(affectedUnits("c1", c.supplierId)).toBe(unitsExposed(c));
    }
  });

  it("is zero for a supplier with nothing on the order", () => {
    expect(affectedUnits("c1", "sup:not-a-supplier")).toBe(0);
  });
});

describe("serialUnion", () => {
  it("counts overlapping ranges once", () => {
    expect(serialUnion([{ from: 1, to: 20 }, { from: 11, to: 30 }])).toBe(30);
  });

  it("adds disjoint ranges", () => {
    expect(serialUnion([{ from: 1, to: 10 }, { from: 21, to: 30 }])).toBe(20);
  });
});

describe("actionWindow", () => {
  it("is the workbench's own window, closing from the assessment date", () => {
    const record = supplierRecords("c1", true).find((r) => r.supplier.id === DECCAN)!;
    const window = actionWindow("c1", DECCAN, "2026-11-02");
    expect(window).toEqual({ days: record.windowDays, closesOn: "2026-11-06" });
    expect(window?.days).toBe(4);
  });

  it("is null for a supplier with nothing on the order", () => {
    expect(actionWindow("c1", "sup:not-a-supplier", "2026-09-18")).toBeNull();
  });
});

describe("evidenceState", () => {
  it("derives the three states from the claims and the open questions", () => {
    const inv = investigationFor("c1", DECCAN)!;
    const state = evidenceState(inv);
    expect(state.known.map((c) => c.id)).toEqual(inv.claims.filter((c) => c.claimType === "observation").map((c) => c.id));
    expect(state.inferred.every((c) => c.claimType !== "observation")).toBe(true);
    expect(state.known.length + state.inferred.length).toBe(inv.claims.length);
    expect(state.unresolved).toEqual(inv.unresolved);
  });
});

describe("claimsSupportedBy", () => {
  it("is the reverse of each claim's supporting evidence", () => {
    const inv = investigationFor("c1", DECCAN)!;
    for (const item of inv.evidence) {
      const expected = inv.claims.filter((c) => c.supportingEvidenceIds.includes(item.id)).map((c) => c.id);
      expect(claimsSupportedBy(inv, item.id).map((c) => c.id)).toEqual(expected);
    }
  });
});

describe("investigationHeader", () => {
  it("derives every header fact, so the header cannot disagree with the card", () => {
    const header = investigationHeader("c1", DECCAN, true)!;
    expect(header).toMatchObject({
      orderReference: "PO-2026-0417",
      orderName: "100 Wind Turbines — Wind Energy Coastal Programme",
      buyer: "Wind Energy",
      supplierName: "Deccan Mainshaft Forgings",
      location: "Pune, Maharashtra",
      components: ["Main Shaft Forging"],
      band: "critical",
      unitsAffected: 12,
      unitsTotal: 100,
      window: { days: 4, closesOn: "2026-11-06" },
    });
    expect(header.status?.label.length).toBeGreaterThan(0);
  });

  it("carries no band or status before the order is assessed", () => {
    const header = investigationHeader("c1", DECCAN, false)!;
    expect(header.band).toBeNull();
    expect(header.status).toBeNull();
    expect(header.unitsAffected).toBe(12);
  });

  it("still describes a supplier without an investigation", () => {
    const header = investigationHeader("c1", HAMBURG, true)!;
    expect(header.supplierName).toBe("Hamburg Drive Controls");
    expect(header.status).toBeNull();
    expect(header.band).toBe("elevated");
  });
});

describe("claimsForEvidence", () => {
  it("round-trips every claim's evidence ids across every authored investigation, with no orphans", () => {
    for (const inv of INVESTIGATIONS) {
      for (const item of inv.evidence) {
        const { supports, contradicts } = claimsForEvidence(inv, item.id);
        expect(supports.map((c) => c.id)).toEqual(
          inv.claims.filter((c) => c.supportingEvidenceIds.includes(item.id)).map((c) => c.id)
        );
        expect(contradicts.map((c) => c.id)).toEqual(
          inv.claims.filter((c) => c.contradictingEvidenceIds.includes(item.id)).map((c) => c.id)
        );
      }
    }
  });

  it("is empty in both directions for an evidence id nothing cites", () => {
    const inv = investigationFor("c1", DECCAN)!;
    expect(claimsForEvidence(inv, "ev:not-a-real-id")).toEqual({ supports: [], contradicts: [] });
  });
});

describe("evidenceRegisterRows", () => {
  it("has one row per held item plus one per requested item, for every authored investigation", () => {
    for (const inv of INVESTIGATIONS) {
      const rows = evidenceRegisterRows(inv);
      expect(rows.length).toBe(inv.evidence.length + inv.nextBestEvidence.length);
      expect(rows.filter((r) => r.kind === "held").length).toBe(inv.evidence.length);
      expect(rows.filter((r) => r.kind === "requested").length).toBe(inv.nextBestEvidence.length);
    }
  });

  it("carries a held row's source type and independence, and a requested row's owner", () => {
    const inv = investigationFor("c1", DECCAN)!;
    const rows = evidenceRegisterRows(inv);
    for (const item of inv.evidence) {
      const row = rows.find((r) => r.id === item.id)!;
      expect(row.kind).toBe("held");
      expect(row.sourceType).toBe(item.sourceType);
      expect(row.state).toBe(item.independence.kind);
      expect(row.owner).toBeNull();
    }
    for (const req of inv.nextBestEvidence) {
      const row = rows.find((r) => r.id === req.id)!;
      expect(row.kind).toBe("requested");
      expect(row.sourceType).toBeNull();
      expect(row.owner).toBe(req.owner);
    }
  });
});

describe("EVIDENCE_FILTER_GROUP", () => {
  it("sorts every source type actually used by an authored investigation into a filter group", () => {
    for (const inv of INVESTIGATIONS) {
      for (const item of inv.evidence) {
        expect(EVIDENCE_FILTER_GROUP[item.sourceType]).toBeDefined();
        expect(SOURCE_TYPE_LABEL[item.sourceType]).toBeDefined();
      }
    }
  });
});

describe("affectedSerials", () => {
  it("names the turbines a supplier's assemblies sit on", () => {
    expect(affectedSerials("c1", DECCAN)).toBe("Turbines 41–52");
  });

  it("returns null for an order without a bill of materials", () => {
    expect(affectedSerials("c9", DECCAN)).toBeNull();
  });

  it("returns null for a supplier with nothing on the order", () => {
    expect(affectedSerials("c1", "sup:nobody")).toBeNull();
  });
});
