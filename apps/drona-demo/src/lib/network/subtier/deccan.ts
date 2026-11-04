/**
 * Behind Deccan Mainshaft Forgings — a large open-die forger in Chakan, Pune.
 *
 * ── Everything here is invented. ──────────────────────────────────────────────
 *
 * An open-die forger buys very little that it does not heat, squeeze or inspect:
 * alloy ingots, the gas that reheats them, the dies that shape them, and a long tail
 * of bought-in services. The featured order links an imported billet lot to a
 * carrier hold; other registered domestic routes remain background or proposed cover.
 */
import { TIER1, type AuthoredNetwork } from "./author";

export const DECCAN: AuthoredNetwork = {
  supplierId: "sup:deccan-mainshaft-forgings",
  nodes: [
    // ── raw material ──
    "durgapur-special-steels",
    ["angul-long-products", "Angul Long Products", "raw-material", "Alloy steel blooms (second approved source)", "Angul", "Odisha", "India", 85.1, 20.84, "direct", "dual",
      [["sub-tier", "Approved on paper; no lot against this programme is on record."]]],
    ["raipur-ingot-works", "Raipur Ingot Works", "raw-material", "Carbon steel ingots for secondary forgings", "Raipur", "Chhattisgarh", "India", 81.63, 21.25, "direct", "multi", []],
    ["kapfenberg-tool-steels", "Kapfenberg Tool Steels", "raw-material", "Hot-work die steel (H13) blocks", "Kapfenberg", "Styria", "Austria", 15.29, 47.44, "distributor", "sole",
      [["trade-regulatory", "Import clears through one port under a safeguard-duty review."]]],
    ["ulsan-large-ingots", "Ulsan Large Ingots", "raw-material", "Ingots above 60 t — contingency only", "Ulsan", "Ulsan", "South Korea", 129.31, 35.54, "direct", "sole", []],
    ["varna-alloy-works", "Varna Alloy Works", "raw-material", "Approved alloy-steel billet for shipment AF-884", "Varna", "Varna", "Bulgaria", 27.91, 43.21, "direct", "dual", [["geopolitical", "A scoped carrier hold affects the dealer’s booked billet allocation; current stock cover remains open."]]],
    // ── distributors ──
    ["jalna-steel-processing", "Jalna Alloy Supply", "distributor", "Approved alloy billet; import allocation and domestic stock", "Jalna", "Maharashtra", "India", 75.88, 19.84, "distributor", "sole",
      [["sub-tier", "One incoming billet allocation is linked to shipment AF-884; usable stock cover needs confirmation."]]],
    ["bhosari-tool-steel-stockists", "Bhosari Tool Steel Stockists", "distributor", "Die blocks, swage blanks", "Pune", "Maharashtra", "India", 73.85, 18.63, "distributor", "dual", []],
    ["bhiwandi-industrial-supplies", "Bhiwandi Industrial Supplies", "distributor", "Abrasives, grinding wheels, PPE", "Bhiwandi", "Maharashtra", "India", 73.06, 19.3, "distributor", "multi", []],
    // ── consumables ──
    ["chakan-city-gas", "Chakan City Gas", "consumable", "Natural gas for reheat furnaces", "Chakan", "Maharashtra", "India", 73.86, 18.76, "direct", "sole",
      [["commodity", "Contract price is indexed to imported LNG and reset monthly."]]],
    ["ranjangaon-industrial-gases", "Ranjangaon Industrial Gases", "consumable", "Oxygen and argon for cutting and scarfing", "Ranjangaon", "Maharashtra", "India", 74.25, 18.76, "direct", "dual", []],
    "katni-refractories",
    ["thane-quench-media", "Thane Quench Media", "consumable", "Polymer quenchant and quench oils", "Thane", "Maharashtra", "India", 72.98, 19.22, "direct", "dual", []],
    ["pimpri-forge-lubricants", "Pimpri Forge Lubricants", "consumable", "Graphite-based die lubricant", "Pimpri", "Maharashtra", "India", 73.8, 18.63, "direct", "multi", []],
    ["tiruvottiyur-abrasives", "Tiruvottiyur Abrasives", "consumable", "Grinding wheels and flap discs", "Chennai", "Tamil Nadu", "India", 80.3, 13.16, "distributor", "multi", []],
    ["coimbatore-hydraulic-seals", "Coimbatore Hydraulic Seals", "consumable", "Press cylinder seals", "Coimbatore", "Tamil Nadu", "India", 76.96, 11.02, "direct", "dual", []],
    ["raigad-export-packing", "Raigad Export Packing", "consumable", "Crating and VCI wrap for shafts", "Raigad", "Maharashtra", "India", 73.08, 18.52, "direct", "multi", []],
    // ── process services ──
    ["kolhapur-die-tooling", "Kolhapur Die & Tooling", "process-service", "Flat and swage dies, re-sinking", "Kolhapur", "Maharashtra", "India", 74.24, 16.7, "service", "dual", []],
    ["ahmednagar-heat-treatment", "Ahmednagar Heat Treatment", "process-service", "Overflow quench and temper, long shafts", "Ahmednagar", "Maharashtra", "India", 74.74, 19.09, "service", "sole",
      [["capacity", "The only vertical quench pit within haul distance that takes a full-length shaft."]]],
    ["pimpri-ut-inspection", "Pimpri UT Inspection", "process-service", "Ultrasonic inspection to EN 10228-3", "Pimpri", "Maharashtra", "India", 73.8, 18.62, "service", "dual", []],
    ["satara-rough-machining", "Satara Rough Machining", "process-service", "Rough turning of forged shafts", "Satara", "Maharashtra", "India", 74.0, 17.68, "service", "dual", []],
    ["waluj-heavy-machining", "Waluj Heavy Machining", "process-service", "Finish-machining overflow", "Aurangabad", "Maharashtra", "India", 75.34, 19.88, "service", "multi", []],
    ["nashik-shot-blasting", "Nashik Shot Blasting", "process-service", "Shot blasting before inspection", "Nashik", "Maharashtra", "India", 73.79, 20.0, "service", "multi", []],
    "belagavi-test-house",
    ["hyderabad-calibration-labs", "Hyderabad Calibration Labs", "process-service", "Pyrometer and UT-probe calibration", "Hyderabad", "Telangana", "India", 78.49, 17.39, "service", "dual", []],
    ["dusseldorf-press-services", "Düsseldorf Press Services", "process-service", "Press control spares (OEM)", "Düsseldorf", "North Rhine-Westphalia", "Germany", 6.77, 51.23, "service", "sole",
      [["logistics", "Spares ship by air; a control-card failure holds the press for about ten days."]]],
    // ── logistics ──
    ["durgapur-rail-freight", "Durgapur Rail Freight", "logistics", "Rail rakes, Durgapur → Jalna", "Durgapur", "West Bengal", "India", 87.25, 23.55, "service", "sole",
      [["geospatial", "The route crosses districts with monsoon track closures most years."]]],
    ["chakan-heavy-haul", "Chakan Heavy Haul", "logistics", "Over-dimension road haul to the plant", "Chakan", "Maharashtra", "India", 73.83, 18.74, "service", "dual", []],
    ["nhava-sheva-clearing", "Nhava Sheva Clearing", "logistics", "Import clearance — die steel and spares", "Nhava Sheva", "Maharashtra", "India", 72.95, 18.95, "service", "dual", []],
  ],
  edges: [
    ["varna-alloy-works", "jalna-steel-processing", "verified", "Authored dealer acknowledgement AF-884", "Order-specific inbound billet allocation; all entities and records are fictional."],
    ["jalna-steel-processing", TIER1, "verified", "Authored order acknowledgement PO-2026-0417",
      "The current fictional dealer acknowledgement links its outstanding approved billet allocation to Deccan and shipment AF-884. Current usable stock is a separate inquiry."],
    ["durgapur-special-steels", "jalna-steel-processing", "low", "The processor's approved-source register",
      "Listed on the processor's approved-source register. Recorded, but not corroborated by a certificate against this programme."],
    ["angul-long-products", "jalna-steel-processing", "missing", "An approval entry, and nothing behind it",
      "Approved on paper as the second source. Drona has found nothing showing it has supplied material for this programme."],
    ["durgapur-rail-freight", "jalna-steel-processing", "inferred", "Railway receipts on two lots"],
    ["raipur-ingot-works", TIER1, "verified", "Purchase orders, secondary forgings"],
    ["ulsan-large-ingots", TIER1, "missing", "A quotation on file, never ordered"],
    ["bhosari-tool-steel-stockists", TIER1, "verified", "Purchase orders, die blocks"],
    ["kapfenberg-tool-steels", "bhosari-tool-steel-stockists", "inferred", "Mill certificates on delivered blocks"],
    ["nhava-sheva-clearing", "bhosari-tool-steel-stockists", "low", "Bill of entry, one consignment"],
    ["bhiwandi-industrial-supplies", TIER1, "verified", "Purchase orders"],
    ["tiruvottiyur-abrasives", "bhiwandi-industrial-supplies", "inferred", "Product labels on delivered wheels"],
    ["chakan-city-gas", TIER1, "verified", "Supply contract"],
    ["ranjangaon-industrial-gases", TIER1, "verified", "Purchase orders"],
    ["katni-refractories", TIER1, "verified", "Purchase orders"],
    ["thane-quench-media", TIER1, "verified", "Purchase orders"],
    ["pimpri-forge-lubricants", TIER1, "verified", "Purchase orders"],
    ["coimbatore-hydraulic-seals", TIER1, "inferred", "Maintenance log entries"],
    ["raigad-export-packing", TIER1, "verified", "Purchase orders"],
    ["kolhapur-die-tooling", TIER1, "verified", "Job-work challans"],
    ["ahmednagar-heat-treatment", TIER1, "inferred", "Heat-treatment charts, two shafts"],
    ["pimpri-ut-inspection", TIER1, "verified", "Inspection reports on delivered shafts"],
    ["satara-rough-machining", TIER1, "verified", "Job-work challans"],
    ["waluj-heavy-machining", TIER1, "low", "One job-work challan"],
    ["nashik-shot-blasting", TIER1, "inferred", "Surface reports"],
    ["belagavi-test-house", TIER1, "verified", "Test certificates on delivered shafts"],
    ["hyderabad-calibration-labs", TIER1, "inferred", "Calibration certificates referenced on UT reports"],
    ["dusseldorf-press-services", TIER1, "low", "Press maintenance contract, expired"],
    ["chakan-heavy-haul", TIER1, "verified", "Transport documents to the plant"],
  ],
  weakLink: {
    key: "varna-alloy-works", trace: ["jalna-steel-processing", "varna-alloy-works", "angul-long-products"],
    mechanism: "A scoped carrier hold may move usable billet beyond Deccan’s 12 Nov need date. Order exposure depends on uncovered material, not the headline alone.",
    conditions: ["The dealer links AF-884 to this order allocation.", "Current on-site and unaffected dealer stock remain unconfirmed.", "Forecast usable receipt is 15–17 Nov; domestic-cover commitment is needed by 6 Nov."],
  },
};
