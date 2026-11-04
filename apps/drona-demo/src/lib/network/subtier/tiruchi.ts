/**
 * Behind Tiruchi Tower Sections — a large welded-tower fabricator in Tiruchirappalli.
 *
 * ── Everything here is invented. ──────────────────────────────────────────────
 *
 * A tower is plate, flanges, weld metal and coating, moved in pieces too big for
 * ordinary roads. The fabricator is large and its supply base is broad; the risk is
 * in the one grade it cannot buy broadly — thick plate for the base sections — and
 * in a flange supplier that is itself a critical Tier-1 on this order.
 */
import { TIER1, type AuthoredNetwork } from "./author";

export const TIRUCHI: AuthoredNetwork = {
  supplierId: "sup:tiruchi-tower-sections",
  nodes: [
    // ── raw material ──
    ["toranagallu-heavy-plate", "Toranagallu Heavy Plate", "raw-material", "S355NL plate above 60 mm", "Toranagallu", "Karnataka", "India", 76.64, 15.2, "direct", "sole",
      [["material", "The only domestic mill rolling this grade above 60 mm; allocation is set quarterly."], ["capacity", "Its heavy-plate stand is down for a relining in the next quarter."]]],
    ["kalinganagar-plate-mill", "Kalinganagar Plate Mill", "raw-material", "S355 plate up to 50 mm", "Kalinganagar", "Odisha", "India", 86.0, 20.95, "direct", "dual",
      [["geospatial", "Coastal dispatch yard in a cyclone-exposed district."]]],
    ["hazira-plate-mill", "Hazira Plate Mill", "raw-material", "S355 plate up to 50 mm", "Hazira", "Gujarat", "India", 72.63, 21.12, "distributor", "dual", []],
    ["pohang-heavy-plate", "Pohang Heavy Plate", "raw-material", "S355NL heavy plate, imported", "Pohang", "Gyeongbuk", "South Korea", 129.34, 36.02, "distributor", "dual",
      [["trade-regulatory", "Anti-dumping review open on this plate category."]]],
    ["ludhiana-ring-forgings-flange", "Ludhiana Ring Forgings", "raw-material", "Forged tower flanges", "Ludhiana", "Punjab", "India", 75.86, 30.9, "direct", "dual",
      [["sub-tier", "Itself a critical Tier-1 on this order."]], "sup:ludhiana-ring-forgings"],
    ["kolhapur-ring-rolling", "Kolhapur Ring Rolling", "raw-material", "Forged tower flanges (second source)", "Kolhapur", "Maharashtra", "India", 74.23, 16.69, "direct", "dual", []],
    ["udaipur-zinc-wire", "Udaipur Zinc Wire", "raw-material", "Zinc wire for metallising", "Udaipur", "Rajasthan", "India", 73.71, 24.58, "direct", "dual",
      [["commodity", "Priced monthly against the international zinc benchmark."]]],
    // ── distributors ──
    ["chennai-steel-stockyard", "Chennai Steel Stockyard", "distributor", "Plate, cut to order", "Chennai", "Tamil Nadu", "India", 80.23, 13.1, "distributor", "multi", []],
    ["visakhapatnam-plate-stockists", "Visakhapatnam Plate Stockists", "distributor", "Plate, spot purchases", "Visakhapatnam", "Andhra Pradesh", "India", 83.22, 17.69, "distributor", "multi", []],
    ["chennai-welding-distributors", "Chennai Welding Distributors", "distributor", "Welding wire and flux", "Chennai", "Tamil Nadu", "India", 80.25, 13.05, "distributor", "dual", []],
    ["tiruchi-fabrication-supplies", "Tiruchi Fabrication Supplies", "distributor", "Grinding discs, backing tape, PPE", "Tiruchirappalli", "Tamil Nadu", "India", 78.69, 10.8, "distributor", "multi", []],
    // ── consumables ──
    ["ranipet-welding-consumables", "Ranipet Welding Consumables", "consumable", "Submerged-arc wire and flux", "Ranipet", "Tamil Nadu", "India", 79.34, 12.94, "direct", "dual", []],
    ["essen-welding-consumables", "Essen Welding Consumables", "consumable", "Low-temperature SAW flux", "Essen", "North Rhine-Westphalia", "Germany", 7.01, 51.46, "distributor", "sole",
      [["logistics", "Sea freight, about six weeks door to door."]]],
    ["osaka-weld-backing", "Osaka Weld Backing", "consumable", "Ceramic weld backing tape", "Osaka", "Osaka", "Japan", 135.5, 34.69, "distributor", "dual", []],
    ["bengaluru-abrasive-wheels", "Bengaluru Abrasive Wheels", "consumable", "Grinding and cutting discs", "Bengaluru", "Karnataka", "India", 77.6, 12.95, "distributor", "multi", []],
    ["tiruchi-industrial-gases", "Tiruchi Industrial Gases", "consumable", "CO₂, argon, oxygen", "Tiruchirappalli", "Tamil Nadu", "India", 78.72, 10.77, "direct", "dual", []],
    ["tuticorin-garnet-abrasives", "Tuticorin Garnet Abrasives", "consumable", "Garnet blasting abrasive", "Thoothukudi", "Tamil Nadu", "India", 78.13, 8.8, "direct", "dual",
      [["trade-regulatory", "Beach-mineral mining permits in the district are under review."]]],
    ["hyderabad-epoxy-primers", "Hyderabad Epoxy Primers", "consumable", "Zinc-rich epoxy primer", "Hyderabad", "Telangana", "India", 78.5, 17.38, "direct", "dual", []],
    ["mumbai-protective-paints", "Mumbai Protective Paints", "consumable", "Polyurethane topcoat, C4 system", "Mumbai", "Maharashtra", "India", 72.87, 19.07, "direct", "dual", []],
    ["hosur-high-tensile-bolts", "Hosur High-Tensile Bolts", "consumable", "Flange bolts, 10.9 grade", "Hosur", "Tamil Nadu", "India", 77.84, 12.75, "direct", "dual", []],
    // ── process services ──
    ["tiruchi-ndt-services", "Tiruchi NDT Services", "process-service", "Phased-array UT of longitudinal seams", "Tiruchirappalli", "Tamil Nadu", "India", 78.68, 10.81, "service", "dual", []],
    ["coimbatore-flange-machining", "Coimbatore Flange Machining", "process-service", "Flange face and bolt-circle machining", "Coimbatore", "Tamil Nadu", "India", 76.95, 11.03, "service", "dual", []],
    ["chennai-plasma-cutting", "Chennai Plasma Cutting", "process-service", "Plate profiling overflow", "Chennai", "Tamil Nadu", "India", 80.2, 13.0, "service", "multi", []],
    ["hosur-galvanisers", "Hosur Galvanisers", "process-service", "Hot-dip galvanising of internals", "Hosur", "Tamil Nadu", "India", 77.85, 12.72, "service", "dual", []],
    ["madurai-tower-internals", "Madurai Tower Internals", "process-service", "Ladders, platforms, cable trays", "Madurai", "Tamil Nadu", "India", 78.1, 9.92, "service", "dual", []],
    ["chennai-third-party-inspection", "Chennai Third-Party Inspection", "process-service", "Witness inspection for the buyer", "Chennai", "Tamil Nadu", "India", 80.24, 13.06, "service", "dual", []],
    // ── logistics ──
    ["hospet-rail-siding", "Hospet Rail Siding", "logistics", "Plate rakes from the mill", "Hosapete", "Karnataka", "India", 76.39, 15.27, "service", "sole", []],
    ["tiruchi-odc-haulage", "Tiruchi ODC Haulage", "logistics", "Section transport to port and site", "Tiruchirappalli", "Tamil Nadu", "India", 78.7, 10.76, "service", "dual",
      [["logistics", "Route permits for 4.5 m sections are issued per movement and have been slow."]]],
    ["tuticorin-port-services", "Tuticorin Port Services", "logistics", "Port handling for coastal shipment", "Thoothukudi", "Tamil Nadu", "India", 78.16, 8.79, "service", "dual", []],
    ["chennai-crane-hire", "Chennai Crane Hire", "logistics", "Heavy crawler cranes for loading", "Chennai", "Tamil Nadu", "India", 80.18, 13.1, "service", "dual", []],
  ],
  edges: [
    ["toranagallu-heavy-plate", TIER1, "verified", "Quarterly allocation letter for this grade",
      "The mill's quarterly allocation letter for S355NL above 60 mm is on file, and it is the only source named for that thickness."],
    ["hospet-rail-siding", "toranagallu-heavy-plate", "inferred", "Railway receipts on delivered plate",
      "Read from railway receipts accompanying delivered plate. The siding has no contract with the fabricator."],
    ["kalinganagar-plate-mill", TIER1, "verified", "Purchase orders"],
    ["chennai-steel-stockyard", TIER1, "verified", "Purchase orders"],
    ["hazira-plate-mill", "chennai-steel-stockyard", "inferred", "Mill test certificates"],
    ["pohang-heavy-plate", "chennai-steel-stockyard", "inferred", "Mill test certificates, imported lots"],
    ["visakhapatnam-plate-stockists", TIER1, "low", "One spot invoice"],
    ["ludhiana-ring-forgings-flange", TIER1, "verified", "Purchase orders for flanges"],
    ["kolhapur-ring-rolling", TIER1, "missing", "Approved on paper; no flange delivered"],
    ["udaipur-zinc-wire", TIER1, "verified", "Purchase orders"],
    ["chennai-welding-distributors", TIER1, "verified", "Purchase orders"],
    ["essen-welding-consumables", "chennai-welding-distributors", "inferred", "Flux bag labels"],
    ["ranipet-welding-consumables", TIER1, "verified", "Purchase orders"],
    ["tiruchi-fabrication-supplies", TIER1, "verified", "Purchase orders"],
    ["osaka-weld-backing", "tiruchi-fabrication-supplies", "inferred", "Product labels"],
    ["bengaluru-abrasive-wheels", "tiruchi-fabrication-supplies", "inferred", "Product labels"],
    ["tiruchi-industrial-gases", TIER1, "verified", "Purchase orders"],
    ["tuticorin-garnet-abrasives", TIER1, "verified", "Purchase orders"],
    ["hyderabad-epoxy-primers", TIER1, "verified", "Purchase orders"],
    ["mumbai-protective-paints", TIER1, "verified", "Purchase orders"],
    ["hosur-high-tensile-bolts", TIER1, "verified", "Purchase orders"],
    ["tiruchi-ndt-services", TIER1, "verified", "Inspection reports"],
    ["coimbatore-flange-machining", TIER1, "inferred", "Job-work challans"],
    ["chennai-plasma-cutting", TIER1, "low", "One job-work challan"],
    ["hosur-galvanisers", TIER1, "verified", "Galvanising certificates"],
    ["madurai-tower-internals", TIER1, "verified", "Purchase orders"],
    ["chennai-third-party-inspection", TIER1, "verified", "Witness reports"],
    ["tiruchi-odc-haulage", TIER1, "verified", "Transport documents"],
    ["tuticorin-port-services", TIER1, "inferred", "Port receipts"],
    ["chennai-crane-hire", TIER1, "inferred", "Hire invoices referenced in dispatch notes"],
  ],
  weakLink: {
    key: "toranagallu-heavy-plate",
    trace: ["toranagallu-heavy-plate", "chennai-steel-stockyard", "pohang-heavy-plate"],
    mechanism:
      "The base sections need S355NL plate above 60 mm, and one domestic mill rolls it. The fabricator's broad plate base — stockists, a coastal mill, imports — is all thinner plate. The breadth is real and it does not reach the grade that matters.",
    conditions: [
      "One domestic mill rolls this grade above 60 mm.",
      "Its heavy-plate stand is scheduled for relining next quarter.",
      "The imported alternative is under an anti-dumping review.",
    ],
  },
};
