/**
 * Behind Saurashtra Ductile Castings — a mid-size ductile-iron foundry in the
 * Shapar–Veraval cluster outside Rajkot.
 *
 * ── Everything here is invented. ──────────────────────────────────────────────
 *
 * A ductile foundry's bill is iron, the chemistry that turns grey iron into ductile
 * iron, and a great deal of sand and resin. The chemistry is small by weight and
 * total by consequence: without the nodulariser there is no EN-GJS grade at all,
 * and the nodulariser's magnesium is not Indian.
 */
import { TIER1, type AuthoredNetwork } from "./author";

export const SAURASHTRA: AuthoredNetwork = {
  supplierId: "sup:saurashtra-ductile-castings",
  nodes: [
    // ── raw material ──
    ["haldia-foundry-pig-iron", "Haldia Foundry Pig Iron", "raw-material", "Foundry-grade pig iron, low phosphorus", "Haldia", "West Bengal", "India", 88.06, 22.03, "direct", "dual",
      [["commodity", "Pig-iron prices moved sharply with coking-coal import costs this quarter."]]],
    ["goa-pig-iron", "Goa Pig Iron", "raw-material", "Foundry-grade pig iron (second source)", "Sanvordem", "Goa", "India", 74.1, 15.27, "direct", "dual", []],
    ["alang-plate-recovery", "Alang Plate Recovery", "raw-material", "Low-manganese steel scrap from ship plate", "Alang", "Gujarat", "India", 72.19, 21.41, "distributor", "multi", []],
    "yulin-magnesium",
    // ── alloys and chemicals ──
    "nagpur-nodularisers",
    "byrnihat-ferro-alloys",
    ["phuentsholing-ferro-silicon", "Phuentsholing Ferro Silicon", "alloy-chemical", "Ferrosilicon (FeSi 75)", "Phuentsholing", "Chukha", "Bhutan", 89.39, 26.85, "distributor", "multi", []],
    ["trondheim-inoculants", "Trondheim Inoculants", "alloy-chemical", "Late-stream inoculant", "Trondheim", "Trøndelag", "Norway", 10.4, 63.43, "distributor", "sole",
      [["logistics", "Ships in part-container loads; transit is about seven weeks."]]],
    ["vapi-foundry-resins", "Vapi Foundry Resins", "alloy-chemical", "Furan no-bake resin and catalyst", "Vapi", "Gujarat", "India", 72.9, 20.37, "direct", "dual", []],
    ["dusseldorf-foundry-chemicals", "Düsseldorf Foundry Chemicals", "alloy-chemical", "Low-nitrogen furan resin for heavy sections", "Düsseldorf", "North Rhine-Westphalia", "Germany", 6.78, 51.22, "direct", "dual", []],
    // ── distributors ──
    ["bhavnagar-scrap-traders", "Bhavnagar Scrap Traders", "distributor", "Graded steel scrap", "Bhavnagar", "Gujarat", "India", 72.15, 21.76, "distributor", "multi", []],
    ["rajkot-ferro-alloy-traders", "Rajkot Ferro Alloy Traders", "distributor", "Ferrosilicon, carburiser", "Rajkot", "Gujarat", "India", 70.79, 22.29, "distributor", "dual",
      [["working-capital", "Trader moved the foundry to 30-day terms from 60 this quarter."]]],
    ["mumbai-inoculant-importers", "Mumbai Inoculant Importers", "distributor", "Inoculant, imported", "Mumbai", "Maharashtra", "India", 72.88, 19.08, "distributor", "sole", []],
    ["shapar-foundry-consumables", "Shapar Foundry Consumables Depot", "distributor", "Ceramic filters, exothermic sleeves, ladle liners", "Shapar", "Gujarat", "India", 70.78, 22.17, "distributor", "multi", []],
    ["chennai-ceramic-filters", "Chennai Ceramic Filters", "consumable", "Ceramic foam filters", "Chennai", "Tamil Nadu", "India", 80.22, 13.02, "distributor", "dual", []],
    // ── consumables ──
    "kalinga-chromite-sands",
    ["bhuj-silica-sand", "Bhuj Silica Sand", "consumable", "Washed silica sand", "Bhuj", "Gujarat", "India", 69.67, 23.25, "direct", "multi", []],
    "katni-refractories",
    ["jamnagar-industrial-gases", "Jamnagar Industrial Gases", "consumable", "Oxygen for riser cutting", "Jamnagar", "Gujarat", "India", 70.07, 22.47, "direct", "dual", []],
    // ── process services ──
    ["shapar-pattern-works", "Shapar Pattern Works", "process-service", "Hub pattern and core boxes", "Shapar", "Gujarat", "India", 70.77, 22.16, "service", "sole", []],
    "vadodara-ndt-laboratory",
    ["rajkot-annealing-works", "Rajkot Annealing Works", "process-service", "Ferritising anneal, overflow", "Rajkot", "Gujarat", "India", 70.82, 22.28, "service", "dual", []],
    ["morbi-heavy-machining", "Morbi Heavy Machining", "process-service", "Hub bore and flange-face machining", "Morbi", "Gujarat", "India", 70.83, 22.82, "service", "dual", []],
    ["hyderabad-spectro-labs", "Hyderabad Spectro Labs", "process-service", "Chemical analysis, nodularity checks", "Hyderabad", "Telangana", "India", 78.47, 17.4, "service", "dual", []],
    "belagavi-test-house",
    // ── logistics ──
    ["rajkot-odc-carriers", "Rajkot ODC Carriers", "logistics", "Over-dimension haul of finished hubs", "Rajkot", "Gujarat", "India", 70.8, 22.31, "service", "dual", []],
    ["mundra-port-services", "Mundra Port Services", "logistics", "Import handling — resin and inoculant", "Mundra", "Gujarat", "India", 69.72, 22.84, "service", "dual", []],
  ],
  edges: [
    ["nagpur-nodularisers", TIER1, "verified", "Purchase orders, every melt",
      "Named on the foundry's purchase orders for every melt this programme. Sole approved source for the nodulariser."],
    ["yulin-magnesium", "nagpur-nodularisers", "inferred", "Import declarations quoted in the nodulariser's certificates",
      "The nodulariser's certificates quote import declarations for magnesium ingot from a single producing region. Drona holds no document from the producer."],
    ["haldia-foundry-pig-iron", TIER1, "verified", "Purchase orders"],
    ["goa-pig-iron", TIER1, "inferred", "Two delivery challans"],
    ["bhavnagar-scrap-traders", TIER1, "verified", "Purchase orders"],
    ["alang-plate-recovery", "bhavnagar-scrap-traders", "low", "The trader's origin declaration"],
    ["rajkot-ferro-alloy-traders", TIER1, "verified", "Purchase orders"],
    ["byrnihat-ferro-alloys", "rajkot-ferro-alloy-traders", "inferred", "Consignment notes"],
    ["phuentsholing-ferro-silicon", "rajkot-ferro-alloy-traders", "low", "One certificate of origin"],
    ["mumbai-inoculant-importers", TIER1, "verified", "Purchase orders"],
    ["trondheim-inoculants", "mumbai-inoculant-importers", "inferred", "Producer labels on delivered drums"],
    ["mundra-port-services", "mumbai-inoculant-importers", "low", "Bill of lading, one consignment"],
    ["vapi-foundry-resins", TIER1, "verified", "Purchase orders"],
    ["dusseldorf-foundry-chemicals", TIER1, "inferred", "Safety data sheets on file"],
    ["shapar-foundry-consumables", TIER1, "verified", "Purchase orders"],
    ["chennai-ceramic-filters", "shapar-foundry-consumables", "inferred", "Product labels"],
    ["kalinga-chromite-sands", TIER1, "verified", "Purchase orders"],
    ["bhuj-silica-sand", TIER1, "verified", "Purchase orders"],
    ["katni-refractories", TIER1, "verified", "Purchase orders"],
    ["jamnagar-industrial-gases", TIER1, "verified", "Purchase orders"],
    ["shapar-pattern-works", TIER1, "verified", "Pattern ownership record"],
    ["vadodara-ndt-laboratory", TIER1, "verified", "Inspection reports on delivered hubs"],
    ["rajkot-annealing-works", TIER1, "low", "One heat-treatment chart"],
    ["morbi-heavy-machining", TIER1, "verified", "Job-work challans"],
    ["hyderabad-spectro-labs", TIER1, "inferred", "Lab reports referenced on certificates"],
    ["belagavi-test-house", TIER1, "verified", "Test certificates on delivered hubs"],
    ["rajkot-odc-carriers", TIER1, "verified", "Transport documents"],
  ],
  weakLink: {
    key: "nagpur-nodularisers",
    trace: ["nagpur-nodularisers", "yulin-magnesium"],
    mechanism:
      "The hub's ductile grade depends on one nodulariser, and the nodulariser depends on magnesium from one producing region abroad. A second pig-iron source does nothing for this: no melt becomes EN-GJS-400-18U-LT without the treatment alloy.",
    conditions: [
      "One approved nodulariser, feeding both ductile-iron Tier-1s on this order.",
      "Its magnesium is imported from a single producing region.",
      "Export licensing in that region was tightened this quarter.",
    ],
  },
};
