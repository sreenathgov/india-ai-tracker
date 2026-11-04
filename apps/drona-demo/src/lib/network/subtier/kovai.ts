/**
 * Behind Kovai Castings & Machining — a small single-bay foundry in Coimbatore that
 * pours and bores the main bearing housing.
 *
 * ── Everything here is invented. ──────────────────────────────────────────────
 *
 * A small foundry buys almost everything through stockists, on credit, in small
 * lots. Its sub-tier is not exotic; it is thin. The same nodulariser and the same
 * inspection lab as the much larger foundry in Rajkot sit behind it, and its iron
 * arrives on terms it no longer controls.
 */
import { TIER1, type AuthoredNetwork } from "./author";

export const KOVAI: AuthoredNetwork = {
  supplierId: "sup:kovai-castings-machining",
  nodes: [
    // ── raw material ──
    ["toranagallu-pig-iron", "Toranagallu Pig Iron", "raw-material", "Foundry-grade pig iron", "Toranagallu", "Karnataka", "India", 76.67, 15.18, "distributor", "dual", []],
    ["tuticorin-pig-iron", "Tuticorin Pig Iron", "raw-material", "Foundry-grade pig iron (second source)", "Thoothukudi", "Tamil Nadu", "India", 78.13, 8.76, "distributor", "dual", []],
    ["kochi-ship-recycling", "Kochi Ship Recycling", "raw-material", "Plate scrap", "Kochi", "Kerala", "India", 76.27, 9.93, "distributor", "multi", []],
    "yulin-magnesium",
    // ── alloys and chemicals ──
    "nagpur-nodularisers",
    "byrnihat-ferro-alloys",
    ["hosur-foundry-binders", "Hosur Foundry Binders", "alloy-chemical", "Alkaline phenolic binder", "Hosur", "Tamil Nadu", "India", 77.83, 12.74, "direct", "sole", []],
    // ── distributors ──
    ["coimbatore-pig-iron-stockists", "Coimbatore Pig Iron Stockists", "distributor", "Pig iron in truck lots", "Coimbatore", "Tamil Nadu", "India", 76.95, 11.0, "distributor", "sole",
      [["working-capital", "Stockist moved the foundry to advance payment after two late settlements."], ["commodity", "Lots are priced on the day of dispatch, not on order."]]],
    ["tiruppur-scrap-dealers", "Tiruppur Scrap Dealers", "distributor", "Steel scrap", "Tiruppur", "Tamil Nadu", "India", 77.34, 11.11, "distributor", "multi", []],
    ["coimbatore-ferro-alloy-agency", "Coimbatore Ferro Alloy Agency", "distributor", "Ferrosilicon", "Coimbatore", "Tamil Nadu", "India", 76.97, 11.03, "distributor", "sole", []],
    ["madurai-foundry-consumables", "Madurai Foundry Consumables", "distributor", "Sleeves, filters, coatings", "Madurai", "Tamil Nadu", "India", 78.12, 9.93, "distributor", "dual", []],
    ["pune-exothermic-sleeves", "Pune Exothermic Sleeves", "consumable", "Exothermic feeder sleeves", "Pune", "Maharashtra", "India", 73.9, 18.55, "distributor", "dual", []],
    ["coimbatore-tooling-agency", "Coimbatore Tooling Agency", "distributor", "Boring inserts and holders", "Coimbatore", "Tamil Nadu", "India", 76.94, 11.01, "distributor", "dual", []],
    ["stuttgart-cutting-tools", "Stuttgart Cutting Tools", "consumable", "Boring inserts for large bores", "Stuttgart", "Baden-Württemberg", "Germany", 9.18, 48.78, "distributor", "sole", []],
    // ── consumables ──
    "kalinga-chromite-sands",
    ["karur-silica-sand", "Karur Silica Sand", "consumable", "Washed silica sand", "Karur", "Tamil Nadu", "India", 78.08, 10.96, "direct", "multi", []],
    ["salem-magnesite-refractories", "Salem Magnesite Refractories", "consumable", "Induction-furnace lining", "Salem", "Tamil Nadu", "India", 78.15, 11.66, "direct", "dual", []],
    ["palakkad-industrial-gases", "Palakkad Industrial Gases", "consumable", "Oxygen, argon", "Palakkad", "Kerala", "India", 76.65, 10.78, "direct", "dual", []],
    // ── process services ──
    ["ganapathy-pattern-makers", "Ganapathy Pattern Makers", "process-service", "Housing pattern and cores", "Coimbatore", "Tamil Nadu", "India", 76.97, 11.04, "service", "sole", []],
    "vadodara-ndt-laboratory",
    ["hosur-heat-treaters", "Hosur Heat Treaters", "process-service", "Stress-relief anneal", "Hosur", "Tamil Nadu", "India", 77.82, 12.73, "service", "dual", []],
    ["peenya-boring-services", "Peenya Boring Services", "process-service", "Bore machining overflow", "Bengaluru", "Karnataka", "India", 77.52, 13.03, "service", "dual", []],
    // ── logistics ──
    ["coimbatore-heavy-transport", "Coimbatore Heavy Transport", "logistics", "Road haul of finished housings", "Coimbatore", "Tamil Nadu", "India", 76.99, 11.06, "service", "dual", []],
  ],
  edges: [
    ["coimbatore-pig-iron-stockists", TIER1, "verified", "Purchase orders and the stockist's revised terms letter",
      "Every lot of pig iron this programme came through this stockist, and its letter moving the foundry to advance payment is on file."],
    ["toranagallu-pig-iron", "coimbatore-pig-iron-stockists", "inferred", "Mill labels on delivered pigs",
      "The mill is read from labels on delivered pigs. The stockist does not disclose its buying."],
    ["tuticorin-pig-iron", "coimbatore-pig-iron-stockists", "low", "One weighbridge slip"],
    ["tiruppur-scrap-dealers", TIER1, "verified", "Purchase orders"],
    ["kochi-ship-recycling", "tiruppur-scrap-dealers", "low", "Dealer's origin declaration"],
    ["nagpur-nodularisers", TIER1, "verified", "Purchase orders"],
    ["yulin-magnesium", "nagpur-nodularisers", "inferred", "Import declarations quoted in the nodulariser's certificates"],
    ["coimbatore-ferro-alloy-agency", TIER1, "verified", "Purchase orders"],
    ["byrnihat-ferro-alloys", "coimbatore-ferro-alloy-agency", "inferred", "Consignment notes"],
    ["hosur-foundry-binders", TIER1, "verified", "Purchase orders"],
    ["madurai-foundry-consumables", TIER1, "verified", "Purchase orders"],
    ["pune-exothermic-sleeves", "madurai-foundry-consumables", "inferred", "Product labels"],
    ["coimbatore-tooling-agency", TIER1, "verified", "Purchase orders"],
    ["stuttgart-cutting-tools", "coimbatore-tooling-agency", "inferred", "Insert packaging"],
    ["kalinga-chromite-sands", TIER1, "inferred", "Two delivery challans"],
    ["karur-silica-sand", TIER1, "verified", "Purchase orders"],
    ["salem-magnesite-refractories", TIER1, "verified", "Purchase orders"],
    ["palakkad-industrial-gases", TIER1, "verified", "Purchase orders"],
    ["ganapathy-pattern-makers", TIER1, "verified", "Pattern ownership record"],
    ["vadodara-ndt-laboratory", TIER1, "verified", "Inspection reports on delivered housings"],
    ["hosur-heat-treaters", TIER1, "inferred", "Heat-treatment charts"],
    ["peenya-boring-services", TIER1, "missing", "Named in the capacity plan; no job on record"],
    ["coimbatore-heavy-transport", TIER1, "verified", "Transport documents"],
  ],
  weakLink: {
    key: "coimbatore-pig-iron-stockists",
    trace: ["coimbatore-pig-iron-stockists", "toranagallu-pig-iron", "tuticorin-pig-iron"],
    mechanism:
      "All of the foundry's iron comes through one stockist, which has moved it to advance payment. A small foundry paid on long terms by its customers cannot fund iron in advance for long — the first sign of trouble here would be a missed melt, not a missed delivery.",
    conditions: [
      "One stockist carries every lot of pig iron.",
      "The stockist moved the foundry to advance payment this quarter.",
      "The housing is sole-sourced to this foundry.",
    ],
  },
};
