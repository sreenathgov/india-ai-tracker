/**
 * Parties that sit behind more than one critical Tier-1.
 *
 * ── Everything here is invented. ──────────────────────────────────────────────
 *
 * These are the company brain's signature test made concrete: two suppliers that
 * lean on one constrained sub-tier are not independent capacity. Each party is
 * declared once, here, and referenced by key from every network it appears in, so
 * "shared" is a fact about the data rather than two rows that happen to agree.
 */
import type { NodeRow } from "./author";

export const SHARED_ROWS: readonly NodeRow[] = [
  ["durgapur-special-steels", "Durgapur Special Steels", "raw-material", "Alloy steel ingots and blooms (42CrMo4)", "Durgapur", "West Bengal", "India", 87.31, 23.52, "direct", "dual",
    [["capacity", "Its large-ingot bay is committed to two Tier-1 forgers on this order in the same quarter."]]],
  ["nagpur-nodularisers", "Nagpur Nodularisers", "alloy-chemical", "Magnesium ferrosilicon (MgFeSi) nodulariser", "Nagpur", "Maharashtra", "India", 79.09, 21.15, "direct", "sole",
    [["sub-tier", "Sole approved nodulariser for both ductile-iron Tier-1s on this order."], ["geopolitical", "Its magnesium comes from one producing region abroad."]]],
  ["yulin-magnesium", "Yulin Magnesium Metals", "raw-material", "Magnesium ingot", "Yulin", "Shaanxi", "China", 109.73, 38.29, "direct", "sole",
    [["trade-regulatory", "Export licensing for magnesium from the region was tightened this quarter."], ["geopolitical", "One producing region supplies most of the world's primary magnesium."]]],
  ["byrnihat-ferro-alloys", "Byrnihat Ferro Alloys", "alloy-chemical", "Ferrosilicon (FeSi 75)", "Byrnihat", "Meghalaya", "India", 91.87, 26.05, "distributor", "multi",
    [["logistics", "Road access through the Siliguri corridor is the only route west."]]],
  ["kalinga-chromite-sands", "Kalinga Chromite Sands", "consumable", "Chromite moulding sand", "Sukinda", "Odisha", "India", 85.78, 21.0, "direct", "dual",
    [["geospatial", "Mine and wash plant sit in a cyclone-exposed coastal district."]]],
  ["vadodara-ndt-laboratory", "Vadodara Level-III NDT Laboratory", "process-service", "Ultrasonic and magnetic-particle inspection of heavy castings", "Vadodara", "Gujarat", "India", 73.18, 22.31, "service", "sole",
    [["capacity", "Two Level-III technicians serve both ductile-iron Tier-1s and countersign for a third Tier-1's lab."]]],
  ["katni-refractories", "Katni Refractories", "consumable", "Furnace and ladle refractories, castables", "Katni", "Madhya Pradesh", "India", 80.39, 23.83, "direct", "multi", []],
  ["belagavi-test-house", "Belagavi Test House", "process-service", "Mechanical testing — impact at −40 °C", "Belagavi", "Karnataka", "India", 74.5, 15.85, "service", "dual", []],
];
