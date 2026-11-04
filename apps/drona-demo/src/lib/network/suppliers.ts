/**
 * The synthetic Tier-1 supplier base: 80 suppliers, 50 in India and 30 abroad.
 *
 * ── Everything here is invented. ──────────────────────────────────────────────
 * No name, coordinate, relationship, certificate or figure in this file represents
 * an actual company or commercial arrangement. Names are descriptive-generic so that
 * none of them can be mistaken for a real firm.
 *
 * A supplier record carries what a reviewer needs before they trust a dot on a map:
 * where it is, what we buy from it, how replaceable it is (sourcing position and
 * approval status), how long it takes to deliver, and which commitments it feeds.
 *
 * The 57 suppliers the bill of materials names keep their category, sourcing and
 * lead time in step with `bom.ts`; `suppliers.test.ts` holds the two files together,
 * so a change in one that is not mirrored in the other fails loudly.
 *
 * Rows are a table because the table is what a person reads and edits. A row missing
 * geography fails to expand rather than being placed somewhere plausible.
 */
import type {
  Approval,
  Concern,
  Sourcing,
  Supplier,
  SupplyCategory,
} from "./types";

/* [ name, city, region, country, lon, lat, concern, commitmentIds,
     category, supplies, sourcing, leadTimeDays, approval, mitigated? ]

   "Mitigated" means a qualified alternative has been confirmed for that exposure.
   Nothing in critical concern carries it — the honest state of this network. */

type SupplierRow = readonly [
  name: string,
  city: string,
  region: string,
  country: string,
  lon: number,
  lat: number,
  concern: Concern,
  commitmentIds: readonly string[],
  category: SupplyCategory,
  supplies: readonly string[],
  sourcing: Sourcing,
  leadTimeDays: number,
  approval: Approval,
  mitigated?: boolean,
];

const SUPPLIER_ROWS: readonly SupplierRow[] = [
  // ── India — Tamil Nadu (12) ──
  ["Valamai Precision Forgings", "Sriperumbudur", "Tamil Nadu", "India", 79.94, 12.96, "low", ["c1"], "Rotor", ["Hub Forging"], "multi", 68, "approved"],
  ["Karaikal Gear Works", "Oragadam", "Tamil Nadu", "India", 79.95, 12.79, "low", ["c1", "c3"], "Drivetrain", ["Gear Set (Intermediate)"], "multi", 55, "approved"],
  ["Ennore Structural Fabricators", "Chennai", "Tamil Nadu", "India", 80.27, 13.08, "low", ["c1"], "Nacelle", ["Nacelle Bedplate Fabrication"], "multi", 35, "approved"],
  ["Ranipet Surface Treatments", "Ranipet", "Tamil Nadu", "India", 79.33, 12.93, "critical", ["c1", "c2"], "Tower", ["Surface Treatment & Coating"], "multi", 24, "approved"],
  ["Kovai Castings & Machining", "Coimbatore", "Tamil Nadu", "India", 76.99, 11.05, "critical", ["c1"], "Drivetrain", ["Main Bearing Housing"], "sole", 62, "approved"],
  ["Tiruchi Tower Sections", "Tiruchirappalli", "Tamil Nadu", "India", 78.7, 10.79, "critical", ["c1", "c2"], "Tower", ["Tower Section Set", "Upper Tower Section Set"], "multi", 48, "approved"],
  ["Ambattur Fastener Systems", "Chennai", "Tamil Nadu", "India", 80.16, 13.12, "low", ["c1", "c2", "c3"], "Tower", ["Fastener & Bolting Set"], "multi", 21, "approved"],
  ["Maraimalai Hydraulics", "Maraimalai Nagar", "Tamil Nadu", "India", 80.03, 12.79, "low", ["c1"], "Nacelle", ["Hydraulic Power Unit"], "multi", 32, "approved"],
  ["Thoothukudi Marine Coatings", "Thoothukudi", "Tamil Nadu", "India", 78.13, 8.76, "low", ["c5"], "Tower", ["Offshore Coating Systems"], "multi", 26, "approved"],
  ["Sholinganallur Control Cabinets", "Chennai", "Tamil Nadu", "India", 80.23, 12.9, "low", ["c4"], "Controls", ["Turbine Control Cabinets", "Pitch Control Panels"], "multi", 38, "approved"],
  ["Padappai Yaw Bearings", "Padappai", "Tamil Nadu", "India", 80.06, 12.88, "critical", ["c1", "c2"], "Nacelle", ["Yaw Bearing Assembly"], "dual", 70, "approved"],
  ["Gummidipoondi Steel Services", "Gummidipoondi", "Tamil Nadu", "India", 80.11, 13.41, "low", ["c1"], "Tower", ["Structural Steel Service Lot"], "multi", 34, "approved"],

  // ── India — Maharashtra (10) ──
  ["Deccan Mainshaft Forgings", "Pune", "Maharashtra", "India", 73.86, 18.52, "critical", ["c1", "c2"], "Drivetrain", ["Main Shaft Forging"], "dual", 84, "approved"],
  ["Nashik Gearbox Assemblies", "Nashik", "Maharashtra", "India", 73.79, 20.0, "elevated", ["c1"], "Drivetrain", ["Gearbox Assembly"], "dual", 112, "conditional"],
  ["Aurangabad Pitch Systems", "Aurangabad", "Maharashtra", "India", 75.34, 19.88, "critical", ["c1", "c2"], "Rotor", ["Pitch Bearing"], "dual", 77, "approved"],
  ["Kolhapur Iron Castings", "Kolhapur", "Maharashtra", "India", 74.24, 16.7, "low", ["c3"], "Drivetrain", ["Gearbox Carrier Castings"], "dual", 52, "approved"],
  ["Pimpri Machining Works", "Pimpri-Chinchwad", "Maharashtra", "India", 73.8, 18.63, "low", ["c1"], "Drivetrain", ["Machined Housings"], "multi", 45, "approved"],
  ["Thane Cable Systems", "Thane", "Maharashtra", "India", 72.98, 19.22, "low", ["c4"], "Electrical", ["Medium-Voltage Cable Sets", "Tower Power Cables"], "multi", 34, "approved"],
  ["Bhosari Tooling", "Bhosari", "Maharashtra", "India", 73.85, 18.63, "low", ["c2"], "Rotor", ["Blade Root Inserts"], "multi", 33, "approved"],
  ["Ahmednagar Generator Windings", "Ahmednagar", "Maharashtra", "India", 74.75, 19.1, "low", ["c1"], "Electrical", ["Generator Winding Set"], "multi", 74, "approved"],
  ["Nagpur Heavy Transport", "Nagpur", "Maharashtra", "India", 79.09, 21.15, "low", ["c2", "c5"], "Nacelle", ["Nacelle Transport Frames"], "multi", 18, "approved"],
  ["Solapur Bolt Works", "Solapur", "Maharashtra", "India", 75.91, 17.66, "low", ["c1"], "Tower", ["Anchor Bolt Cage"], "multi", 26, "approved"],

  // ── India — Gujarat (6) ──
  ["Halol Blade Moulding", "Halol", "Gujarat", "India", 73.47, 22.5, "elevated", ["c5"], "Rotor", ["Blade Shell Moulding", "Spar Cap Laminates"], "dual", 61, "approved"],
  ["Vadodara Converter Assemblies", "Vadodara", "Gujarat", "India", 73.18, 22.31, "elevated", ["c1", "c2"], "Electrical", ["Power Converter"], "dual", 91, "approved"],
  ["Mundra Port Fabrication", "Mundra", "Gujarat", "India", 69.72, 22.84, "low", ["c5"], "Tower", ["Transition Piece Fabrication"], "multi", 44, "approved"],
  ["Saurashtra Ductile Castings", "Rajkot", "Gujarat", "India", 70.8, 22.3, "critical", ["c1"], "Rotor", ["Rotor Hub Casting"], "dual", 70, "approved"],
  ["Surat Insulation Systems", "Surat", "Gujarat", "India", 72.83, 21.17, "low", ["c4"], "Electrical", ["Generator Insulation Kits"], "multi", 29, "approved"],
  ["Sanand Nacelle Panels", "Sanand", "Gujarat", "India", 72.38, 22.99, "elevated", ["c1"], "Nacelle", ["Nacelle Panel Set"], "multi", 40, "approved", true],

  // ── India — North (NCR and Punjab) (7) ──
  ["Gurugram Control Electronics", "Gurugram", "Haryana", "India", 77.03, 28.46, "low", ["c4"], "Controls", ["Turbine Controller Boards", "SCADA Interface Units"], "dual", 47, "approved"],
  ["Faridabad Hub Castings", "Faridabad", "Haryana", "India", 77.31, 28.41, "low", ["c1"], "Rotor", ["Hub Casting (Secondary)"], "multi", 44, "approved"],
  ["Noida Sensor Assemblies", "Noida", "Uttar Pradesh", "India", 77.39, 28.54, "low", ["c4"], "Controls", ["Vibration Sensor Kits", "Anemometer Assemblies"], "multi", 31, "approved"],
  ["Bhiwadi Transformer Works", "Bhiwadi", "Rajasthan", "India", 76.86, 28.21, "critical", ["c2"], "Electrical", ["Nacelle Transformer"], "sole", 63, "conditional"],
  ["Manesar Hydraulic Lines", "Manesar", "Haryana", "India", 76.94, 28.35, "low", ["c1"], "Nacelle", ["Hydraulic Line Set"], "multi", 28, "approved"],
  ["Sonipat Structural Bolts", "Sonipat", "Haryana", "India", 77.02, 28.99, "low", ["c2"], "Tower", ["Tower Bolting Set"], "multi", 30, "approved"],
  ["Ludhiana Ring Forgings", "Ludhiana", "Punjab", "India", 75.86, 30.9, "critical", ["c1"], "Tower", ["Tower Flange"], "dual", 66, "approved"],

  // ── India — Karnataka (7) ──
  ["Bengaluru Converter Controls", "Bengaluru", "Karnataka", "India", 77.59, 12.97, "low", ["c1"], "Controls", ["Converter Control Unit"], "dual", 82, "approved"],
  ["Tumakuru Precision Gears", "Tumakuru", "Karnataka", "India", 77.1, 13.34, "low", ["c1"], "Drivetrain", ["Planetary Gear Set"], "multi", 57, "approved"],
  ["Belagavi Aerospace Forgings", "Belagavi", "Karnataka", "India", 74.5, 15.85, "low", ["c2"], "Rotor", ["Blade Bearing Bolts"], "multi", 38, "approved"],
  ["Mysuru Sensor Optics", "Mysuru", "Karnataka", "India", 76.64, 12.3, "low", ["c4"], "Controls", ["Blade Load Sensors"], "dual", 43, "in-qualification"],
  ["Dharwad Machine Tools", "Dharwad", "Karnataka", "India", 75.01, 15.46, "low", ["c3"], "Drivetrain", ["Coupling Assemblies"], "multi", 36, "approved"],
  ["Kolar Copper Windings", "Kolar", "Karnataka", "India", 78.13, 13.14, "elevated", ["c1"], "Electrical", ["Copper Winding Stock"], "multi", 52, "approved", true],
  ["Ballari Steel Structures", "Ballari", "Karnataka", "India", 76.92, 15.14, "low", ["c2"], "Tower", ["Foundation Adapter Ring"], "multi", 40, "approved"],

  // ── India — Eastern and Deccan belt (8) ──
  ["Jamshedpur Alloy Steels", "Jamshedpur", "Jharkhand", "India", 86.2, 22.8, "elevated", ["c1", "c2"], "Tower", ["Tower Flange Billet", "Adapter Flange Billet"], "multi", 63, "approved"],
  ["Rourkela Plate Mills", "Rourkela", "Odisha", "India", 84.85, 22.25, "elevated", ["c1", "c2"], "Tower", ["Tower Plate", "Transition Plate"], "multi", 56, "approved"],
  ["Durgapur Heat Treatment", "Durgapur", "West Bengal", "India", 87.32, 23.52, "elevated", ["c1"], "Drivetrain", ["Heat-Treated Shaft Blanks"], "dual", 38, "approved"],
  ["Bokaro Rolling Works", "Bokaro", "Jharkhand", "India", 86.15, 23.67, "low", ["c2"], "Tower", ["Rolled Tower Plate"], "multi", 45, "approved"],
  ["Angul Aluminium Extrusions", "Angul", "Odisha", "India", 85.1, 20.84, "low", ["c5"], "Nacelle", ["Nacelle Access Ladders", "Cable Trays"], "multi", 33, "in-qualification"],
  ["Haldia Marine Coatings", "Haldia", "West Bengal", "India", 88.11, 22.06, "low", ["c5"], "Tower", ["Splash-Zone Coatings"], "multi", 25, "approved"],
  ["Visakhapatnam Heavy Plate", "Visakhapatnam", "Andhra Pradesh", "India", 83.3, 17.69, "elevated", ["c2"], "Nacelle", ["Nacelle Base Plate"], "multi", 44, "approved", true],
  ["Hyderabad Drive Electronics", "Hyderabad", "Telangana", "India", 78.49, 17.39, "low", ["c4"], "Controls", ["Yaw Drive Controllers"], "dual", 49, "approved"],

  // ── China (8) ──
  ["Tianjin Tower Sections", "Tianjin", "Tianjin", "China", 117.2, 39.13, "low", ["c2"], "Tower", ["Lower Tower Section Set"], "multi", 52, "approved"],
  ["Ningbo Magnet Assemblies", "Ningbo", "Zhejiang", "China", 121.55, 29.87, "critical", ["c1", "c2"], "Electrical", ["Generator Magnet Set"], "dual", 98, "approved"],
  ["Baoding Blade Moulding", "Baoding", "Hebei", "China", 115.48, 38.87, "low", ["c5"], "Rotor", ["Blade Shell Moulding"], "multi", 58, "approved"],
  ["Wuxi Gearbox Housings", "Wuxi", "Jiangsu", "China", 120.31, 31.57, "low", ["c1"], "Drivetrain", ["Gearbox Housing"], "multi", 71, "approved"],
  ["Shanghai Converter Modules", "Shanghai", "Shanghai", "China", 121.47, 31.23, "low", ["c4"], "Electrical", ["IGBT Power Modules"], "dual", 69, "approved"],
  ["Qingdao Heavy Castings", "Qingdao", "Shandong", "China", 120.38, 36.07, "elevated", ["c2"], "Rotor", ["Rotor Hub Casting"], "multi", 60, "approved"],
  ["Changzhou Rare-Earth Processing", "Changzhou", "Jiangsu", "China", 119.97, 31.81, "low", ["c1"], "Electrical", ["Rare-Earth Feedstock"], "dual", 104, "conditional"],
  ["Xi'an Generator Laminations", "Xi'an", "Shaanxi", "China", 108.94, 34.34, "low", ["c1"], "Electrical", ["Generator Lamination Stack"], "multi", 50, "approved"],

  // ── Germany (7) ──
  ["Bremerhaven Nacelle Systems", "Bremerhaven", "Bremen", "Germany", 8.58, 53.55, "low", ["c1"], "Nacelle", ["Nacelle Cover & Seals"], "multi", 30, "approved"],
  ["Hamburg Drive Controls", "Hamburg", "Hamburg", "Germany", 9.99, 53.55, "elevated", ["c1"], "Controls", ["Drive Control Cabinet"], "multi", 49, "approved", true],
  ["Rostock Tower Fabrication", "Rostock", "Mecklenburg-Vorpommern", "Germany", 12.14, 54.09, "low", ["c2"], "Tower", ["Tower Internals"], "multi", 36, "approved"],
  ["Chemnitz Gear Grinding", "Chemnitz", "Saxony", "Germany", 12.92, 50.83, "low", ["c1"], "Drivetrain", ["Ground Gear Finishing"], "multi", 41, "approved"],
  ["Ruhr Special Steels", "Duisburg", "North Rhine-Westphalia", "Germany", 6.76, 51.43, "low", ["c2"], "Nacelle", ["Slewing Ring Steel"], "dual", 52, "conditional"],
  ["Stuttgart Sensor Systems", "Stuttgart", "Baden-Württemberg", "Germany", 9.18, 48.78, "low", ["c4"], "Controls", ["Condition Monitoring Systems"], "dual", 54, "approved"],
  ["Magdeburg Heavy Machining", "Magdeburg", "Saxony-Anhalt", "Germany", 11.63, 52.13, "low", ["c1"], "Nacelle", ["Heavy Machined Frames"], "multi", 46, "approved"],

  // ── Denmark (3) ──
  ["Esbjerg Blade Services", "Esbjerg", "Southern Denmark", "Denmark", 8.45, 55.47, "low", ["c1"], "Rotor", ["Blade Finishing Kit"], "multi", 27, "approved"],
  ["Aarhus Pitch Actuators", "Aarhus", "Central Jutland", "Denmark", 10.2, 56.16, "low", ["c2"], "Rotor", ["Pitch Actuator Set"], "dual", 56, "approved"],
  ["Aalborg Tower Coatings", "Aalborg", "North Jutland", "Denmark", 9.92, 57.05, "low", ["c1"], "Tower", ["Tower Coating System"], "multi", 23, "approved"],

  // ── Spain (2) ──
  ["Navarra Blade Works", "Pamplona", "Navarre", "Spain", -1.64, 42.82, "low", ["c5"], "Rotor", ["Blade Root Machining", "Leading-Edge Protection"], "multi", 48, "approved"],
  ["Bilbao Forged Flanges", "Bilbao", "Basque Country", "Spain", -2.93, 43.26, "elevated", ["c2"], "Tower", ["Tower Adapter Flange"], "multi", 66, "approved"],

  // ── Italy (2) ──
  ["Brescia Fastener Works", "Brescia", "Lombardy", "Italy", 10.22, 45.54, "low", ["c1"], "Tower", ["Secondary Fastener Set"], "multi", 19, "approved"],
  ["Taranto Heavy Plate", "Taranto", "Apulia", "Italy", 17.24, 40.46, "low", ["c2"], "Nacelle", ["Nacelle Frame Plate"], "multi", 42, "approved"],

  // ── Poland (2) ──
  ["Gdańsk Tower Sections", "Gdańsk", "Pomerania", "Poland", 18.65, 54.35, "low", ["c1"], "Tower", ["Tower Platform & Internals"], "multi", 48, "approved"],
  ["Szczecin Structural Welding", "Szczecin", "West Pomerania", "Poland", 14.55, 53.43, "low", ["c2"], "Tower", ["Welded Platform Set"], "multi", 30, "approved"],

  // ── Türkiye (1) ──
  ["İzmir Tower Fabrication", "İzmir", "İzmir", "Türkiye", 27.14, 38.42, "low", ["c5"], "Tower", ["Tower Door Frames", "Tower Platforms"], "multi", 39, "approved"],

  // ── Republic of Korea (1) ──
  ["Changwon Forged Shafts", "Changwon", "South Gyeongsang", "Republic of Korea", 128.68, 35.23, "elevated", ["c1"], "Drivetrain", ["Secondary Shaft Forging"], "dual", 80, "approved", true],

  // ── Viet Nam (1) ──
  ["Hai Phong Nacelle Panels", "Hai Phong", "Hai Phong", "Viet Nam", 106.68, 20.86, "low", ["c4"], "Nacelle", ["Nacelle Canopy Panels"], "multi", 45, "in-qualification"],

  // ── United States (2) ──
  ["Pueblo Wind Structures", "Pueblo", "Colorado", "United States", -104.61, 38.25, "low", ["c3"], "Tower", ["Tower Section Set (US Content)"], "multi", 42, "approved"],
  ["Houston Converter Assemblies", "Houston", "Texas", "United States", -95.37, 29.76, "elevated", ["c3"], "Electrical", ["Grid-Side Converter Modules"], "dual", 76, "conditional", true],

  // ── Brazil (1) ──
  ["Suape Tower Works", "Recife", "Pernambuco", "Brazil", -34.88, -8.05, "low", ["c5"], "Tower", ["Tower Section Set (Brazil Content)"], "multi", 50, "in-qualification"],
];

/* Synthetic certificates, by what the supplier makes. A supplier still in
   qualification has not yet evidenced its environmental certificate. */
const CERTIFICATIONS: Readonly<Record<SupplyCategory, readonly string[]>> = {
  Drivetrain: ["ISO 9001", "ISO 14001", "ISO 6336 gear rating"],
  Rotor: ["ISO 9001", "ISO 14001", "DNV type certificate"],
  Nacelle: ["ISO 9001", "ISO 14001", "ISO 3834-2 welding"],
  Electrical: ["ISO 9001", "ISO 14001", "IEC 60034"],
  Tower: ["ISO 9001", "ISO 14001", "EN 1090-2"],
  Controls: ["ISO 9001", "ISO 14001", "IEC 61439"],
};

const certificationsFor = (
  category: SupplyCategory,
  approval: Approval
): readonly string[] =>
  approval === "in-qualification"
    ? CERTIFICATIONS[category].filter((c) => c !== "ISO 14001")
    : CERTIFICATIONS[category];

export const slug = (value: string): string =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export const SUPPLIERS: readonly Supplier[] = SUPPLIER_ROWS.map(
  ([
    name,
    city,
    region,
    country,
    lon,
    lat,
    concern,
    commitmentIds,
    category,
    supplies,
    sourcing,
    leadTimeDays,
    approval,
    mitigated,
  ]) => ({
    id: `sup:${slug(name)}`,
    kind: "supplier" as const,
    name,
    city,
    region,
    country,
    coordinate: { lon, lat },
    tier: 1 as const,
    concern,
    commitmentIds,
    mitigated: mitigated ?? false,
    category,
    supplies,
    sourcing,
    leadTimeDays,
    approval,
    certifications: certificationsFor(category, approval),
  })
);
