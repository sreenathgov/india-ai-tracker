/**
 * The bill of materials for a production commitment, and the exposure that falls
 * out of it.
 *
 * ── Everything here is invented. ──────────────────────────────────────────────
 * Synthetic, like the rest of the network. No part, lot, lead time or coverage
 * figure describes an actual product or an actual commercial arrangement.
 *
 * **This file is where "concern" becomes "risk", and it has to earn the word.**
 *
 * Scene 1 reports concern: a supplier is under pressure, somewhere, for reasons it
 * has not established. Scene 2 may say *risk* only because every band below is
 * computed against five specific things — this bill of materials, these approved
 * suppliers, this procurement coverage, this production timeline, and this customer
 * commitment. Take any one away and the band is not derivable, which is exactly
 * why a supplier-level score would be the wrong answer.
 *
 * Two consequences follow, and both are visible in `bandFor` below:
 *
 * 1. A supplier in critical concern is **not** automatically a critical risk. If it
 *    holds more confirmed coverage than its own lead time, the order can absorb a
 *    failure and re-source; the exposure is real but it is not critical *here*.
 * 2. A supplier in low concern **can** be an elevated risk, when its coverage runs
 *    out inside the order's margin. Nothing is wrong with the supplier. The timing
 *    is wrong for this commitment.
 *
 * That relativisation is the whole argument. It is also why no number in this file
 * is a score: every band is a statement with a stated cause, and the UI is expected
 * to show the cause rather than the band alone.
 */
import { COMMITMENTS, SUPPLIERS } from "./gazetteer";
import type { Commitment, Concern, Supplier, SupplyCategory } from "./types";

/** Inclusive turbine serial range within a commitment, e.g. units 41 through 58. */
export interface SerialRange {
  readonly from: number;
  readonly to: number;
}

/**
 * One assembly on the bill of materials.
 *
 * `partCount` is the number of distinct BOM line items the assembly stands for — a
 * gearbox is one thing to talk about and eight things to procure. The demo speaks in
 * assemblies and counts in parts, which is how the documents themselves read.
 */
export interface ComponentGroup {
  readonly id: string;
  readonly name: string;
  readonly system: SupplyCategory;
  readonly partCount: number;
  /** Resolved against the gazetteer by name at module load; see `SUPPLIER_BY_NAME`. */
  readonly supplierId: string;
  /** Qualified alternatives on record, including the bound supplier itself. */
  readonly approvedSources: number;
  /** Days from order release to delivery at the plant. */
  readonly leadTimeDays: number;
  /** Days of confirmed material or finished coverage already secured. */
  readonly coverageDays: number;
  /** Which turbine serials in this commitment depend on the assembly. */
  readonly turbines: SerialRange;
}

export type RiskBand = Concern;

/**
 * The band, and the sentence that justifies it.
 *
 * Returning the cause alongside the band is deliberate: a caller cannot render the
 * colour without having the explanation in hand. It is a small piece of API design
 * doing the work that a policy document would otherwise have to do.
 */
export interface BandedComponent {
  readonly component: ComponentGroup;
  readonly supplier: Supplier;
  readonly band: RiskBand;
  readonly because: string;
}

/* ── The authored bill of materials ────────────────────────────────────────────
   One assembly per Tier-1 supplier bound to the commitment. Authored as a table,
   because the table is what a person reads and edits; the objects are built once,
   below, and a row that fails to resolve throws rather than being dropped. */

type BomRow = readonly [
  name: string,
  system: ComponentGroup["system"],
  supplierName: string,
  partCount: number,
  approvedSources: number,
  leadTimeDays: number,
  coverageDays: number,
  from: number,
  to: number,
];

const BOM_ROWS: readonly BomRow[] = [
  /* Coverage below lead time, from a foundry or fabrication shop in critical
     concern. Nothing ordered today arrives before the material on hand runs out,
     so a failure here cannot be recovered inside this programme. Five shops, big
     and small — a listed forger, a mid-size Rajkot foundry, a single-bay Coimbatore
     casting shop, a tower fabricator and a Ludhiana ring forger that also feeds it. */
  ["Main Shaft Forging", "Drivetrain", "Deccan Mainshaft Forgings", 4, 2, 84, 5, 41, 52],
  ["Rotor Hub Casting", "Rotor", "Saurashtra Ductile Castings", 5, 2, 70, 32, 41, 64],
  ["Main Bearing Housing", "Drivetrain", "Kovai Castings & Machining", 3, 1, 62, 28, 47, 58],
  ["Tower Section Set", "Tower", "Tiruchi Tower Sections", 12, 3, 48, 30, 53, 80],
  ["Tower Flange", "Tower", "Ludhiana Ring Forgings", 4, 2, 66, 41, 41, 58],

  /* Critical concern, but covered past lead time on this order: bearings, magnets
     and coatings were allocated early. Elevated here, not critical — the supplier
     is under real pressure and this order can still re-source. */
  ["Yaw Bearing Assembly", "Nacelle", "Padappai Yaw Bearings", 3, 2, 70, 74, 41, 58],
  ["Pitch Bearing", "Rotor", "Aurangabad Pitch Systems", 3, 2, 77, 80, 41, 52],
  ["Generator Magnet Set", "Electrical", "Ningbo Magnet Assemblies", 3, 2, 98, 101, 41, 50],

  /* Elevated concern and short of lead time: the steel and converter feeds one
     step upstream of the critical five. Not critical only because the supplier is not. */
  ["Power Converter", "Electrical", "Vadodara Converter Assemblies", 4, 2, 91, 26, 47, 58],
  ["Tower Flange Billet", "Tower", "Jamshedpur Alloy Steels", 3, 3, 63, 30, 41, 58],
  ["Tower Plate", "Tower", "Rourkela Plate Mills", 3, 3, 56, 24, 45, 58],
  ["Secondary Shaft Forging", "Drivetrain", "Changwon Forged Shafts", 2, 2, 80, 35, 53, 58],

  /* Critical concern, but forty-six days of coverage against a twenty-four day lead
     time. The supplier is under real pressure; this order can still re-source. */
  ["Surface Treatment & Coating", "Tower", "Ranipet Surface Treatments", 5, 4, 24, 46, 64, 80],

  /* Everything else that is not low on this order: elevated concern, or coverage
     that clears the lead time but not the lead time plus the order's margin. */
  ["Hub Forging", "Rotor", "Valamai Precision Forgings", 6, 3, 68, 40, 1, 20],
  ["Gearbox Assembly", "Drivetrain", "Nashik Gearbox Assemblies", 8, 2, 112, 52, 64, 80],
  ["Machined Housings", "Drivetrain", "Pimpri Machining Works", 7, 4, 45, 33, 1, 20],
  ["Generator Winding Set", "Electrical", "Ahmednagar Generator Windings", 6, 3, 74, 44, 64, 80],
  ["Nacelle Panel Set", "Nacelle", "Sanand Nacelle Panels", 6, 4, 40, 30, 64, 78],
  ["Converter Control Unit", "Controls", "Bengaluru Converter Controls", 5, 2, 82, 47, 64, 80],
  ["Copper Winding Stock", "Electrical", "Kolar Copper Windings", 4, 3, 52, 35, 1, 18],
  ["Heat-Treated Shaft Blanks", "Drivetrain", "Durgapur Heat Treatment", 3, 2, 38, 25, 64, 80],
  ["Gearbox Housing", "Drivetrain", "Wuxi Gearbox Housings", 5, 3, 71, 43, 1, 20],
  ["Rare-Earth Feedstock", "Electrical", "Changzhou Rare-Earth Processing", 3, 2, 104, 58, 64, 80],
  ["Drive Control Cabinet", "Controls", "Hamburg Drive Controls", 4, 3, 49, 31, 1, 20],

  /* Low concern suppliers whose coverage nonetheless runs out inside the margin.
     Nothing is wrong with these three. The timing is wrong for this commitment. */
  ["Structural Steel Service Lot", "Tower", "Gummidipoondi Steel Services", 6, 4, 34, 38, 1, 20],
  ["Gear Set (Intermediate)", "Drivetrain", "Karaikal Gear Works", 5, 3, 55, 60, 64, 80],
  ["Hydraulic Line Set", "Nacelle", "Manesar Hydraulic Lines", 4, 4, 28, 32, 1, 20],

  /* Low concern and comfortably covered. High part counts, low consequence — which
     is the usual shape of a bill of materials and worth showing plainly. */
  ["Fastener & Bolting Set", "Tower", "Ambattur Fastener Systems", 48, 6, 21, 96, 1, 100],
  ["Nacelle Bedplate Fabrication", "Nacelle", "Ennore Structural Fabricators", 42, 4, 35, 104, 1, 100],
  ["Tower Platform & Internals", "Tower", "Gdańsk Tower Sections", 38, 3, 48, 118, 1, 100],
  ["Nacelle Cover & Seals", "Nacelle", "Bremerhaven Nacelle Systems", 30, 4, 30, 92, 1, 100],
  ["Hydraulic Power Unit", "Nacelle", "Maraimalai Hydraulics", 26, 4, 32, 87, 1, 100],
  ["Anchor Bolt Cage", "Tower", "Solapur Bolt Works", 22, 5, 26, 90, 1, 100],
  ["Hub Casting (Secondary)", "Rotor", "Faridabad Hub Castings", 20, 3, 44, 101, 1, 100],
  ["Planetary Gear Set", "Drivetrain", "Tumakuru Precision Gears", 18, 3, 57, 113, 1, 100],
  ["Generator Lamination Stack", "Electrical", "Xi'an Generator Laminations", 16, 3, 50, 99, 1, 100],
  ["Ground Gear Finishing", "Drivetrain", "Chemnitz Gear Grinding", 14, 3, 41, 95, 1, 100],
  ["Heavy Machined Frames", "Nacelle", "Magdeburg Heavy Machining", 12, 3, 46, 108, 1, 100],
  ["Blade Finishing Kit", "Rotor", "Esbjerg Blade Services", 10, 4, 27, 84, 1, 100],
  ["Tower Coating System", "Tower", "Aalborg Tower Coatings", 8, 4, 23, 79, 1, 100],
  ["Secondary Fastener Set", "Tower", "Brescia Fastener Works", 8, 5, 19, 88, 1, 100],
];

/* ── Highland Repower (c2) ─────────────────────────────────────────────────────
   A second order with a deliberately different shape, so the demo does not read as
   one scripted path. Wind Energy's exposure is *broad and partial*: five critical
   assemblies behind five suppliers, reaching forty of a hundred turbines. Highland's is *narrow and total*: one
   single-source assembly on every unit. Two things make it so, and both are
   properties of this commitment rather than of any supplier:

   - It is late in its programme. The forgings, bearings and converters that are
     critical risk on Wind Energy were allocated to this repower months ago, so the
     same critical-concern suppliers hold coverage past their lead time here and
     fall to elevated. The supplier did not change; the order did.
   - It has four days of margin. Low-concern suppliers that would be comfortable on
     any other order run out of coverage inside it — timing, not supplier, again. */

const HIGHLAND_ROWS: readonly BomRow[] = [
  /* The one assembly this order cannot re-source: a single approved source in
     critical concern, thirty days of coverage against a sixty-three day build. */
  ["Nacelle Transformer", "Electrical", "Bhiwadi Transformer Works", 3, 1, 63, 30, 1, 60],

  /* Wind Energy's critical suppliers. Critical concern, but covered past lead time
     for this order — elevated here, and the contrast is the point. */
  ["Main Shaft Forging", "Drivetrain", "Deccan Mainshaft Forgings", 4, 2, 84, 92, 1, 60],
  ["Yaw Bearing Assembly", "Nacelle", "Padappai Yaw Bearings", 3, 2, 70, 81, 1, 60],
  ["Pitch Bearing", "Rotor", "Aurangabad Pitch Systems", 3, 2, 77, 85, 1, 60],
  ["Power Converter", "Electrical", "Vadodara Converter Assemblies", 4, 2, 91, 104, 1, 60],
  ["Adapter Flange Billet", "Tower", "Jamshedpur Alloy Steels", 3, 3, 63, 70, 1, 60],
  ["Transition Plate", "Tower", "Rourkela Plate Mills", 3, 3, 56, 66, 1, 60],
  ["Generator Magnet Set", "Electrical", "Ningbo Magnet Assemblies", 3, 2, 98, 112, 1, 60],
  ["Surface Treatment & Coating", "Tower", "Ranipet Surface Treatments", 5, 4, 24, 46, 1, 60],

  /* Elevated concern. Two clear the lead time but not the four days of margin;
     two clear both and are low risk on this order despite the supplier's state. */
  ["Rotor Hub Casting", "Rotor", "Qingdao Heavy Castings", 5, 3, 60, 62, 1, 60],
  ["Tower Adapter Flange", "Tower", "Bilbao Forged Flanges", 4, 3, 66, 68, 1, 60],
  ["Nacelle Base Plate", "Nacelle", "Visakhapatnam Heavy Plate", 4, 3, 44, 58, 1, 60],
  ["Slewing Ring Steel", "Nacelle", "Ruhr Special Steels", 3, 2, 52, 71, 1, 60],

  /* Low concern, and short only of the margin. Nothing is wrong with these four;
     with a week more of margin none of them would be flagged. */
  ["Upper Tower Section Set", "Tower", "Tiruchi Tower Sections", 30, 3, 48, 50, 31, 60],
  ["Blade Bearing Bolts", "Rotor", "Belagavi Aerospace Forgings", 6, 3, 38, 40, 31, 60],
  ["Tower Bolting Set", "Tower", "Sonipat Structural Bolts", 24, 4, 30, 33, 1, 60],
  ["Pitch Actuator Set", "Rotor", "Aarhus Pitch Actuators", 9, 2, 56, 58, 31, 60],

  /* Low concern and comfortably covered. */
  ["Fastener & Bolting Set", "Tower", "Ambattur Fastener Systems", 40, 6, 21, 70, 1, 60],
  ["Lower Tower Section Set", "Tower", "Tianjin Tower Sections", 34, 3, 52, 88, 1, 60],
  ["Tower Internals", "Tower", "Rostock Tower Fabrication", 16, 4, 36, 80, 1, 60],
  ["Nacelle Frame Plate", "Nacelle", "Taranto Heavy Plate", 12, 3, 42, 75, 1, 60],
  ["Welded Platform Set", "Tower", "Szczecin Structural Welding", 14, 4, 30, 66, 1, 60],
  ["Foundation Adapter Ring", "Tower", "Ballari Steel Structures", 10, 3, 40, 71, 1, 60],
  ["Rolled Tower Plate", "Tower", "Bokaro Rolling Works", 8, 3, 45, 90, 1, 60],
  ["Blade Root Inserts", "Rotor", "Bhosari Tooling", 12, 3, 33, 64, 1, 60],
  ["Nacelle Transport Frames", "Nacelle", "Nagpur Heavy Transport", 6, 4, 18, 55, 1, 60],
];

/**
 * Every authored bill of materials, by commitment.
 *
 * A commitment without an entry has not been analysed, and the surface says so —
 * it does not borrow another order's figures. Wind Energy keeps bare `cmp:` ids
 * because it came first and Scene 3's chains are keyed on them; every later order
 * scopes its ids, so the same assembly name on two orders is two assemblies.
 */
const AUTHORED: readonly {
  readonly commitmentId: string;
  readonly idPrefix: string;
  readonly rows: readonly BomRow[];
}[] = [
  { commitmentId: "c1", idPrefix: "cmp:", rows: BOM_ROWS },
  { commitmentId: "c2", idPrefix: "cmp:c2-", rows: HIGHLAND_ROWS },
];

const SUPPLIER_BY_NAME = new Map(SUPPLIERS.map((s) => [s.name, s]));

const slug = (value: string): string =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

/*
 * A row naming a supplier the gazetteer does not have throws at module load rather
 * than silently dropping the assembly. A bill of materials that quietly loses a line
 * is worse than one that refuses to build: the first produces a confident, wrong
 * figure, and the second produces a stack trace.
 */
const buildBom = (
  idPrefix: string,
  rows: readonly BomRow[]
): readonly ComponentGroup[] =>
  rows.map(
    ([name, system, supplierName, partCount, approvedSources, leadTimeDays, coverageDays, from, to]) => {
      const supplier = SUPPLIER_BY_NAME.get(supplierName);
      if (!supplier) {
        throw new Error(
          `bom.ts: no supplier named "${supplierName}" in the gazetteer (assembly "${name}")`
        );
      }
      return {
        id: `${idPrefix}${slug(name)}`,
        name,
        system,
        partCount,
        supplierId: supplier.id,
        approvedSources,
        leadTimeDays,
        coverageDays,
        turbines: { from, to },
      };
    }
  );

const BOMS: ReadonlyMap<string, readonly ComponentGroup[]> = new Map(
  AUTHORED.map((a) => [a.commitmentId, buildBom(a.idPrefix, a.rows)])
);

/** The flagship commitment — the default wherever a caller does not name one. */
export const BOM_COMMITMENT_ID = "c1";

/** Whether Drona has a bill of materials for this commitment at all. */
export const hasBom = (commitmentId: string): boolean => BOMS.has(commitmentId);

/** The bill of materials for one commitment. Throws rather than lend another's. */
export function bomFor(commitmentId: string = BOM_COMMITMENT_ID): readonly ComponentGroup[] {
  const bom = BOMS.get(commitmentId);
  if (!bom) throw new Error(`bom.ts: no bill of materials for commitment ${commitmentId}`);
  return bom;
}

/** The flagship's bill of materials. */
export const BOM: readonly ComponentGroup[] = bomFor(BOM_COMMITMENT_ID);

export const bomCommitment = (commitmentId: string = BOM_COMMITMENT_ID): Commitment => {
  const commitment = COMMITMENTS.find((c) => c.id === commitmentId);
  if (!commitment) {
    throw new Error(`bom.ts: commitment ${commitmentId} is missing from the gazetteer`);
  }
  return commitment;
};

/** 428, and derived — never written down. The staged sequence quotes this figure. */
export const totalParts = (bom: readonly ComponentGroup[] = BOM): number =>
  bom.reduce((sum, c) => sum + c.partCount, 0);

/**
 * The band, with its cause.
 *
 * Read the three clauses as one sentence: an assembly is critical when it cannot be
 * recovered, elevated when it cannot be recovered *comfortably*, and low when the
 * order can absorb its failure. Concern enters only as one input among four.
 */
export function bandFor(
  component: ComponentGroup,
  supplier: Supplier,
  commitment: Commitment
): { readonly band: RiskBand; readonly because: string } {
  const recoverable = component.coverageDays >= component.leadTimeDays;
  const comfortable =
    component.coverageDays >= component.leadTimeDays + commitment.marginDays;

  if (supplier.concern === "critical" && !recoverable) {
    return {
      band: "critical",
      because: `${supplier.name} is in critical concern and holds ${component.coverageDays} days of confirmed coverage against a ${component.leadTimeDays}-day lead time. A replacement order placed today arrives after the material runs out.`,
    };
  }

  if (supplier.concern === "critical") {
    return {
      band: "elevated",
      because: `${supplier.name} is in critical concern, but ${component.coverageDays} days of coverage against a ${component.leadTimeDays}-day lead time leaves room to re-source before this commitment is affected.`,
    };
  }

  /* Short of the lead time itself. Saying only that it misses the margin would be
     true and would understate it; what keeps it out of critical is the supplier's
     concern, so the sentence names that as the thing to watch. */
  if (supplier.concern === "elevated" && !recoverable) {
    return {
      band: "elevated",
      because: `${supplier.name} is in elevated concern, and ${component.coverageDays} days of coverage falls short of the ${component.leadTimeDays}-day lead time. It is not critical only because the supplier is not — if its concern rises, this assembly cannot be re-sourced in time.`,
    };
  }

  /* The mirror of a recoverable critical supplier. The concern is real, but this
     order holds enough coverage to re-source away from it with the margin intact,
     so it is not this order's risk — and saying "elevated" would be the supplier's
     band talking, not the commitment's. */
  if (supplier.concern === "elevated" && comfortable) {
    return {
      band: "low",
      because: `${supplier.name} is in elevated concern, but ${component.coverageDays} days of coverage clears the ${component.leadTimeDays}-day lead time and the ${commitment.marginDays} days of margin. This order can re-source before the concern reaches it.`,
    };
  }

  if (supplier.concern === "elevated") {
    return {
      band: "elevated",
      because: `${supplier.name} is in elevated concern, and ${component.coverageDays} days of coverage does not clear the ${component.leadTimeDays}-day lead time plus ${commitment.marginDays} days of programme margin.`,
    };
  }

  if (!comfortable) {
    return {
      band: "elevated",
      because: `${supplier.name} is not itself under concern. ${component.coverageDays} days of coverage simply runs out inside the ${component.leadTimeDays}-day lead time plus ${commitment.marginDays} days of margin — the timing is wrong for this commitment, not the supplier.`,
    };
  }

  return {
    band: "low",
    because: `${component.coverageDays} days of coverage against a ${component.leadTimeDays}-day lead time, from a supplier not currently under concern.`,
  };
}

/** Every assembly, banded, with its supplier and its justification attached. */
export function bandedBom(
  bom: readonly ComponentGroup[] = BOM,
  commitment: Commitment = bomCommitment()
): readonly BandedComponent[] {
  return bom.map((component) => {
    const supplier = SUPPLIERS.find((s) => s.id === component.supplierId);
    if (!supplier) {
      throw new Error(`bom.ts: supplier ${component.supplierId} vanished from the gazetteer`);
    }
    const { band, because } = bandFor(component, supplier, commitment);
    return { component, supplier, band, because };
  });
}

const serials = (range: SerialRange): readonly number[] =>
  Array.from({ length: range.to - range.from + 1 }, (_, i) => range.from + i);

export interface BandRollup {
  readonly band: RiskBand;
  readonly parts: number;
  readonly assemblies: number;
  readonly suppliers: number;
  /** Turbine serials touched by at least one assembly in this band. */
  readonly turbines: number;
}

/** One rollup per band. Counts are over distinct suppliers and distinct serials. */
export function bandRollup(
  band: RiskBand,
  banded: readonly BandedComponent[] = bandedBom()
): BandRollup {
  const inBand = banded.filter((b) => b.band === band);
  const turbines = new Set<number>();
  for (const entry of inBand) {
    for (const serial of serials(entry.component.turbines)) turbines.add(serial);
  }
  return {
    band,
    parts: inBand.reduce((sum, b) => sum + b.component.partCount, 0),
    assemblies: inBand.length,
    suppliers: new Set(inBand.map((b) => b.supplier.id)).size,
    turbines: turbines.size,
  };
}

export interface ExposureRollup {
  readonly units: number;
  readonly totalParts: number;
  readonly low: BandRollup;
  readonly elevated: BandRollup;
  readonly critical: BandRollup;
  /**
   * Units carrying no assembly in critical risk. Deliberately **not** called
   * "clear": 37 of them still carry an elevated exposure, and a figure that reads
   * as an all-clear while that is true would be the most comfortable lie on the
   * screen. The card is required to state the predicate.
   */
  readonly unitsClearOfCritical: number;
  /** Units carrying nothing above low. The honest all-clear, and much smaller. */
  readonly unitsFullyClear: number;
}

/** The three bento cards, in one derivation. Nothing here is authored. */
export function exposureRollup(
  bom: readonly ComponentGroup[] = BOM,
  commitment: Commitment = bomCommitment()
): ExposureRollup {
  const banded = bandedBom(bom, commitment);
  const low = bandRollup("low", banded);
  const elevated = bandRollup("elevated", banded);
  const critical = bandRollup("critical", banded);

  const criticalSerials = new Set<number>();
  const raisedSerials = new Set<number>();
  for (const entry of banded) {
    if (entry.band === "low") continue;
    for (const serial of serials(entry.component.turbines)) {
      raisedSerials.add(serial);
      if (entry.band === "critical") criticalSerials.add(serial);
    }
  }

  return {
    units: commitment.units,
    totalParts: totalParts(bom),
    low,
    elevated,
    critical,
    unitsClearOfCritical: commitment.units - criticalSerials.size,
    unitsFullyClear: commitment.units - raisedSerials.size,
  };
}

const recoveryGap = (c: ComponentGroup): number => c.coverageDays - c.leadTimeDays;

/** Turbines depending on this assembly. Derived from the serial range, never typed. */
export const unitsExposed = (c: ComponentGroup): number =>
  c.turbines.to - c.turbines.from + 1;

/**
 * One band's assemblies, in the order a reviewer should read them.
 *
 * Ordered by **units exposed first**, and only then by how far coverage falls short
 * of lead time. Sorting by the shortfall alone would lead with the Power Converter,
 * which is further past its lead time but reaches fewer turbines than the
 * Rotor Hub Casting. Consequence is what the reviewer is choosing between; the mechanism is
 * what they read once they have chosen.
 */
export function componentsInBand(
  band: RiskBand,
  banded: readonly BandedComponent[] = bandedBom()
): readonly BandedComponent[] {
  return banded
    .filter((b) => b.band === band)
    .slice()
    .sort(
      (a, b) =>
        unitsExposed(b.component) - unitsExposed(a.component) ||
        recoveryGap(a.component) - recoveryGap(b.component)
    );
}

/** The assemblies in critical risk — Scene 3's entry set. */
export const criticalComponents = (
  banded: readonly BandedComponent[] = bandedBom()
): readonly BandedComponent[] => componentsInBand("critical", banded);

export function componentById(id: string): ComponentGroup | undefined {
  for (const bom of BOMS.values()) {
    const found = bom.find((c) => c.id === id);
    if (found) return found;
  }
  return undefined;
}

/** The commitment whose bill of materials holds this assembly. */
export function commitmentForComponent(id: string): Commitment | undefined {
  for (const [commitmentId, bom] of BOMS) {
    if (bom.some((c) => c.id === id)) return bomCommitment(commitmentId);
  }
  return undefined;
}

/** Every assembly on one order, banded against that order. */
export const bandedFor = (commitmentId: string): readonly BandedComponent[] =>
  bandedBom(bomFor(commitmentId), bomCommitment(commitmentId));

/** The three bento cards for one order. */
export const rollupFor = (commitmentId: string): ExposureRollup =>
  exposureRollup(bomFor(commitmentId), bomCommitment(commitmentId));
