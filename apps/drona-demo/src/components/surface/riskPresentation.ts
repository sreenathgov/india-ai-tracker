import type { DependencyType } from "@/lib/portfolio/portfolio";

export const RISK_PRESENTATION: Readonly<Record<DependencyType, { label: string; explanation: string }>> = {
  material: { label: "Material availability", explanation: "A required material connects the supplier to a specific source. Drona examines whether that input can cover the order’s production window." },
  process: { label: "Production capacity", explanation: "A necessary production step can depend on one facility or a limited slot. Drona examines whether the available capacity can meet the order’s schedule." },
  network: { label: "Shared dependencies", explanation: "Separate suppliers may rely on the same upstream source or facility. Drona examines whether a common dependency limits their independence." },
  logistics: { label: "Transport & routes", explanation: "Completed production still depends on delivery. Drona examines the ports, carriers and routes behind the order, and whether alternatives are available." },
  liquidity: { label: "Working capital", explanation: "A funding constraint may prevent a supplier from securing inputs or capacity. Drona connects that question to the order; the regulated financier retains the credit decision." },
  external: { label: "External conditions", explanation: "A physical or geopolitical development matters when it can affect a mapped dependency. Drona examines that connection before opening an inquiry." },
  regulatory: { label: "Regulatory requirements", explanation: "For the Denmark shipment, Drona separates whether the requirement applies from whether the importer has an eligible entry route. Missing evidence alone does not establish a failure." },
};

export const RISK_DISPLAY_ORDER: readonly DependencyType[] = ["material", "process", "network", "logistics", "liquidity", "external", "regulatory"];
export type RiskTourBeat = "overview" | DependencyType;
export const RISK_TOUR_BEATS: readonly RiskTourBeat[] = ["overview", "material", "network", "regulatory"];
export const RISK_INTRO = { title: "See where an order may be exposed.", body: "Drona groups the dependencies behind your orders into seven categories. Each points to a condition that may affect fulfilment—and a question worth investigating." };
export function nextRiskBeat(beat: RiskTourBeat): RiskTourBeat | null {
  if (beat === "regulatory") return null;
  if (beat === "network") return "regulatory";
  if (beat === "overview") return "material";
  return "network";
}
export function previousRiskBeat(beat: RiskTourBeat): RiskTourBeat | null {
  if (beat === "overview") return null;
  if (beat === "regulatory") return "network";
  if (beat === "network") return "material";
  return "overview";
}
