/**
 * Behind Ludhiana Ring Forgings — a small ring-rolling forge in Ludhiana that makes
 * the tower flanges.
 *
 * ── Everything here is invented. ──────────────────────────────────────────────
 *
 * A small forge owns the ring mill and buys everything else by the job: heat
 * treatment, machining, inspection. Its steel comes from the same eastern mill as
 * the main-shaft forger's, and the inspection that releases every flange rests on
 * one lab's accreditation.
 */
import { TIER1, type AuthoredNetwork } from "./author";

export const LUDHIANA: AuthoredNetwork = {
  supplierId: "sup:ludhiana-ring-forgings",
  nodes: [
    // ── raw material ──
    "durgapur-special-steels",
    ["mandi-gobindgarh-rolling", "Mandi Gobindgarh Rolling Mills", "raw-material", "Rolled rounds, S355", "Mandi Gobindgarh", "Punjab", "India", 76.3, 30.67, "direct", "dual", []],
    ["raipur-bloom-casters", "Raipur Bloom Casters", "raw-material", "Continuous-cast blooms", "Raipur", "Chhattisgarh", "India", 81.6, 21.27, "distributor", "dual", []],
    ["hisar-alloy-rounds", "Hisar Alloy Rounds", "raw-material", "Alloy rounds", "Hisar", "Haryana", "India", 75.72, 29.15, "distributor", "multi", []],
    // ── distributors ──
    ["ludhiana-steel-stockists", "Ludhiana Steel Stockists", "distributor", "Blooms and rounds, cut to weight", "Ludhiana", "Punjab", "India", 75.84, 30.91, "distributor", "multi",
      [["working-capital", "Stockist credit limit for the forge was cut this quarter."]]],
    ["batala-tool-works", "Batala Tool Works", "distributor", "Mandrels, rolls, forging tools", "Batala", "Punjab", "India", 75.2, 31.82, "distributor", "dual", []],
    // ── consumables ──
    ["panipat-furnace-oil", "Panipat Furnace Oil Depot", "consumable", "Furnace oil for the reheat furnace", "Panipat", "Haryana", "India", 76.97, 29.39, "direct", "dual",
      [["commodity", "Priced fortnightly against crude."]]],
    ["ludhiana-industrial-gases", "Ludhiana Industrial Gases", "consumable", "Oxygen, LPG", "Ludhiana", "Punjab", "India", 75.87, 30.89, "direct", "dual", []],
    "katni-refractories",
    ["kanpur-quench-oils", "Kanpur Quench Oils", "consumable", "Quenching oil for heat treatment", "Kanpur", "Uttar Pradesh", "India", 80.33, 26.45, "distributor", "dual", []],
    ["ludhiana-rust-preventives", "Ludhiana Rust Preventives", "consumable", "Rust preventive, flange protectors", "Ludhiana", "Punjab", "India", 75.85, 30.92, "direct", "multi", []],
    // ── process services ──
    ["jalandhar-heat-treaters", "Jalandhar Heat Treaters", "process-service", "Normalising of rolled rings", "Jalandhar", "Punjab", "India", 75.58, 31.33, "service", "dual", []],
    ["jalandhar-ndt-services", "Jalandhar NDT Services", "process-service", "Ultrasonic inspection of flanges", "Jalandhar", "Punjab", "India", 75.57, 31.32, "service", "sole",
      [["quality", "Accreditation scope for ring UT lapsed last month; renewal is pending."]]],
    ["jalandhar-shot-blasting", "Jalandhar Shot Blasting", "process-service", "Descaling after heat treatment", "Jalandhar", "Punjab", "India", 75.59, 31.34, "service", "multi", []],
    ["phagwara-flange-machining", "Phagwara Flange Machining", "process-service", "Rough and finish machining", "Phagwara", "Punjab", "India", 75.77, 31.22, "service", "dual", []],
    ["faridabad-mill-spares", "Faridabad Mill Spares", "process-service", "Ring-mill spares and repairs", "Faridabad", "Haryana", "India", 77.32, 28.41, "service", "dual", []],
    ["zhangjiagang-ring-mill-spares", "Zhangjiagang Ring Mill Spares", "process-service", "Ring-mill axial rolls (OEM)", "Zhangjiagang", "Jiangsu", "China", 120.55, 31.88, "service", "sole",
      [["trade-regulatory", "OEM spares clear under a quality-control order that is being tightened."]]],
    "vadodara-ndt-laboratory",
    ["delhi-materials-testing", "Delhi Materials Testing", "process-service", "Tensile and impact testing", "New Delhi", "Delhi", "India", 77.21, 28.61, "service", "dual", []],
    // ── logistics ──
    ["eastern-rail-rakes", "Eastern Rail Rakes", "logistics", "Rail rakes, Durgapur → Ludhiana", "Durgapur", "West Bengal", "India", 87.25, 23.55, "service", "sole", []],
    ["dadri-rail-terminal", "Dadri Rail Terminal", "logistics", "Container rail to the southern ports", "Dadri", "Uttar Pradesh", "India", 77.55, 28.55, "service", "dual", []],
    ["ludhiana-odc-carriers", "Ludhiana ODC Carriers", "logistics", "Road haul of finished flanges", "Ludhiana", "Punjab", "India", 75.88, 30.9, "service", "dual", []],
  ],
  edges: [
    ["jalandhar-ndt-services", TIER1, "verified", "Inspection reports on every flange this programme",
      "Every flange delivered on this programme carries a UT report from this lab. The lab's accreditation certificate on file does not cover ring forgings after last month."],
    ["durgapur-special-steels", TIER1, "inferred", "Mill test certificates on bloom lots"],
    ["eastern-rail-rakes", "durgapur-special-steels", "low", "Railway receipt, one lot"],
    ["mandi-gobindgarh-rolling", TIER1, "verified", "Purchase orders"],
    ["ludhiana-steel-stockists", TIER1, "verified", "Purchase orders"],
    ["raipur-bloom-casters", "ludhiana-steel-stockists", "inferred", "Bloom tags"],
    ["hisar-alloy-rounds", "ludhiana-steel-stockists", "low", "The stockist's origin declaration"],
    ["batala-tool-works", TIER1, "verified", "Purchase orders"],
    ["panipat-furnace-oil", TIER1, "verified", "Purchase orders"],
    ["ludhiana-industrial-gases", TIER1, "verified", "Purchase orders"],
    ["katni-refractories", TIER1, "inferred", "Delivery challans"],
    ["kanpur-quench-oils", "jalandhar-heat-treaters", "inferred", "Drum labels at the heat treater"],
    ["jalandhar-shot-blasting", TIER1, "verified", "Job-work challans"],
    ["ludhiana-rust-preventives", TIER1, "verified", "Purchase orders"],
    ["jalandhar-heat-treaters", TIER1, "verified", "Heat-treatment charts"],
    ["phagwara-flange-machining", TIER1, "verified", "Job-work challans"],
    ["faridabad-mill-spares", TIER1, "inferred", "Maintenance log entries"],
    ["zhangjiagang-ring-mill-spares", TIER1, "low", "One import invoice"],
    ["vadodara-ndt-laboratory", "jalandhar-ndt-services", "low", "A Level-III signature on one report",
      "One inspection report carries a Level-III countersignature from this lab. Drona reads that as the lab's procedure sign-off being subcontracted; nothing else on file confirms it."],
    ["delhi-materials-testing", TIER1, "verified", "Test certificates"],
    ["dadri-rail-terminal", TIER1, "inferred", "Container receipts"],
    ["ludhiana-odc-carriers", TIER1, "verified", "Transport documents"],
  ],
  weakLink: {
    key: "jalandhar-ndt-services",
    trace: ["jalandhar-ndt-services", "vadodara-ndt-laboratory"],
    mechanism:
      "No flange ships without a UT report, and every report this programme came from one lab whose accreditation for ring forgings has lapsed. Flanges already inspected may need re-inspection; flanges not yet inspected have nowhere accredited to go.",
    conditions: [
      "One lab inspects every flange on this programme.",
      "Its accreditation scope for ring UT lapsed last month.",
      "Its Level-III sign-off appears to come from a lab already serving both ductile-iron Tier-1s.",
    ],
  },
};
