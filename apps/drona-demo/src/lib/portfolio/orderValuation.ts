/** Market benchmark applied to an explicit fictional configuration, not an ERP contract value.
 * IRENA, Renewable Power Generation Costs in 2024 (published July 2025), Onshore Wind,
 * Figure 2.9: average turbine price outside China USD 998/kW. Not total installed project cost.
 * The demo has no recorded turbine rating: 3 MW onshore is the founder-selected fictional specification (4 November 2026).
 */
export const TURBINE_BENCHMARK = {
  usdPerKW: 998,
  marketYear: 2024,
  publishedYear: 2025,
  source: "IRENA · Renewable Power Generation Costs in 2024",
  url: "https://www.irena.org/Digital-Report/Renewable-Power-Generation-Costs-in-2024",
  scope: "Onshore turbine pricing outside China; not a project construction budget or a customer quotation",
} as const;
export function estimatedOrderValue(orderId: string, units: number) {
  // Never borrow the featured configuration for another order.
  if (orderId !== "c1" || units !== 100) return null;
  const assumedMWPerTurbine = 3;
  const exactCents = units * assumedMWPerTurbine * 1000 * TURBINE_BENCHMARK.usdPerKW * 100;
  return {
    assumedMWPerTurbine, totalMW: units * assumedMWPerTurbine, exactCents,
    // Round to USD 10m: a broad market estimate must not imply quotation precision.
    roundedCents: Math.round(exactCents / 1_000_000_000) * 1_000_000_000,
    benchmark: TURBINE_BENCHMARK,
  };
}
