/**
 * The synthetic production network: one plant, 80 Tier-1 suppliers (see
 * `suppliers.ts`), five outbound delivery destinations.
 *
 * ── Everything here is invented. ──────────────────────────────────────────────
 * No name, coordinate, relationship or figure in this file represents an actual
 * customer, supplier or commercial arrangement. The names are deliberately
 * descriptive-generic so that none of them can be mistaken for a real company.
 */
import { SUPPLIERS } from "./suppliers";
import type { Commitment, Destination, Plant, Supplier } from "./types";

export const PLANT: Plant = {
  id: "plant:chennai",
  kind: "plant",
  name: "Chennai Manufacturing Plant",
  city: "Chennai",
  country: "India",
  coordinate: { lon: 80.05, lat: 12.92 },
};

/* ── Commitments ───────────────────────────────────────────────────────────────
   Five production commitments. Each is a consequential object with a buyer, a
   destination and a date — never a row in a spreadsheet. Margin is days of slack
   against the required delivery date as currently understood. */

export const COMMITMENTS: readonly Commitment[] = [
  {
    id: "c1",
    name: "100 Wind Turbines — Wind Energy Coastal Programme",
    buyer: "Wind Energy",
    destinationId: "dest:esbjerg",
    requiredBy: "2026-11-18",
    marginDays: 4,
    units: 100,
    concern: "critical",
    reference: "PO-2026-0417",
  },
  {
    id: "c2",
    name: "60 Wind Turbines — Highland Repower",
    buyer: "Caledon Wind Partners",
    destinationId: "dest:hull",
    requiredBy: "2026-10-24",
    marginDays: 4,
    units: 60,
    concern: "critical",
    reference: "PO-2026-0392",
  },
  {
    id: "c5",
    name: "80 Wind Turbines — Pampas Grid Extension",
    buyer: "Austral Energía Renovable",
    destinationId: "dest:bahia-blanca",
    requiredBy: "2026-12-12",
    marginDays: 16,
    units: 80,
    concern: "elevated",
    reference: "PO-2026-0428",
  },
  {
    id: "c3",
    name: "40 Wind Turbines — Gulf Coast Expansion",
    buyer: "Sabine Power Partners",
    destinationId: "dest:corpus-christi",
    requiredBy: "2027-01-15",
    marginDays: 21,
    units: 40,
    concern: "elevated",
    reference: "PO-2026-0451",
  },
  {
    id: "c4",
    name: "50 Wind Turbines — Kyushu Offshore Pilot",
    buyer: "Hokusei Marine Energy",
    destinationId: "dest:kitakyushu",
    requiredBy: "2027-02-26",
    marginDays: 33,
    units: 50,
    concern: "low",
    reference: "PO-2026-0463",
  },
];

export const DESTINATIONS: readonly Destination[] = [
  {
    id: "dest:esbjerg",
    kind: "destination",
    customer: "Wind Energy",
    city: "Esbjerg",
    country: "Denmark",
    coordinate: { lon: 8.45, lat: 55.47 },
    commitmentId: "c1",
  },
  {
    id: "dest:hull",
    kind: "destination",
    customer: "Caledon Wind Partners",
    city: "Hull",
    country: "United Kingdom",
    coordinate: { lon: -0.33, lat: 53.74 },
    commitmentId: "c2",
  },
  {
    id: "dest:bahia-blanca",
    kind: "destination",
    customer: "Austral Energía Renovable",
    city: "Bahía Blanca",
    country: "Argentina",
    coordinate: { lon: -62.28, lat: -38.72 },
    commitmentId: "c5",
  },
  {
    id: "dest:corpus-christi",
    kind: "destination",
    customer: "Sabine Power Partners",
    city: "Corpus Christi",
    country: "United States",
    coordinate: { lon: -97.4, lat: 27.8 },
    commitmentId: "c3",
  },
  {
    id: "dest:kitakyushu",
    kind: "destination",
    customer: "Hokusei Marine Energy",
    city: "Kitakyushu",
    country: "Japan",
    coordinate: { lon: 130.88, lat: 33.88 },
    commitmentId: "c4",
  },
];

/* Suppliers live in their own file — the table is long and has its own tests. */
export { SUPPLIERS };

/** Lookup helpers. Keep call sites free of repeated `.find` chains. */
export const supplierById = (id: string): Supplier | undefined =>
  SUPPLIERS.find((s) => s.id === id);

export const commitmentById = (id: string): Commitment | undefined =>
  COMMITMENTS.find((c) => c.id === id);

export const destinationById = (id: string): Destination | undefined =>
  DESTINATIONS.find((d) => d.id === id);

export const suppliersForCommitment = (
  commitmentId: string
): readonly Supplier[] =>
  SUPPLIERS.filter((s) => s.commitmentIds.includes(commitmentId));
