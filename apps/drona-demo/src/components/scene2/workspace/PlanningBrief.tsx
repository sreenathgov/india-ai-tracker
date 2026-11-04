"use client";
import * as React from "react";
import { useSupplierInquiry } from "@/components/scene2/investigation/overview/SupplierInquiryProvider";
import { Surface } from "@/components/bento/Surface";
import { useRegulatoryCase } from "@/components/regulatory/RegulatoryProvider";
import { commitmentById, destinationById } from "@/lib/network/gazetteer";
import { planReceivedMinutesAgo } from "@/lib/portfolio/portfolio";
import { ASSESSED_COMMERCIAL_ORDERS, exposureSummary, formatUSD } from "@/lib/portfolio/commercial";
import { estimatedOrderValue } from "@/lib/portfolio/orderValuation";
import { bomSummary, missingInputs } from "@/lib/scene2/workspace";
import { mappedSuppliers } from "@/lib/scene2/mappedSuppliers";
import { formatDay } from "./format";

/** Separate planned delivery facts, an explicitly assumed market valuation, and current assessment exposure. */
export function PlanningBrief({ commitmentId, assessed = false, className }: {
  readonly commitmentId: string; readonly assessed?: boolean; readonly className?: string;
}): React.ReactElement | null {
  const { state } = useRegulatoryCase();
  const { state: material } = useSupplierInquiry();
  const commitment = commitmentById(commitmentId);
  if (!commitment) return null;
  const destination = destinationById(commitment.destinationId);
  const bom = bomSummary(commitmentId);
  const mapped = mappedSuppliers(commitmentId);
  const received = planReceivedMinutesAgo(commitmentId);
  const missing = missingInputs(commitmentId);
  const estimate = estimatedOrderValue(commitmentId, commitment.units);
  const exposure = exposureSummary(state, commitmentId, undefined, undefined, material);
  const valued = assessed && ASSESSED_COMMERCIAL_ORDERS.some(id => id === commitmentId);
  return <Surface title="Planning brief" surfaceId="planning-brief" className={className}>
    <dl className="grid grid-cols-3 gap-x-6 gap-y-3">
      <Fact term="Quantity" value={`${commitment.units} units`} />
      <Fact term="Destination" value={destination ? `${destination.city}, ${destination.country}` : null} />
      <Fact term="Required by" value={formatDay(commitment.requiredBy)} />
    </dl>
    <div className="my-5 grid grid-cols-2 gap-6 border-y border-separator py-5" data-order-financial-context>
      <div><p className="text-[13px] text-label-secondary">Estimated order value</p>
        <p className="mt-2 font-serif text-[36px] leading-none tracking-[-0.025em] text-label-primary" data-estimated-order-value>{estimate ? `≈ ${formatUSD(estimate.roundedCents).replace(".0M", "M")}` : "Unvalued"}</p>
        <p className="mt-2 text-[12px] leading-relaxed text-label-tertiary">{estimate ? "Market-based · 3 MW onshore turbines" : "No market estimate recorded"}</p>
      </div>
      <div><p className="text-[13px] text-label-secondary">Committed spend at risk</p>
        <p className="mt-2 font-serif text-[36px] leading-none tracking-[-0.025em] text-label-primary" data-brief-exposure>{valued ? formatUSD(exposure.totalCents) : assessed ? "Unvalued" : "Not assessed"}</p>
        <p className="mt-2 text-[12px] leading-relaxed text-label-tertiary">{!valued ? "Awaiting assessed purchase commitments" : exposure.confirmedCents > 0 ? `${formatUSD(exposure.reviewCents)} under review · ${formatUSD(exposure.confirmedCents)} confirmed exposure` : exposure.totalCents ? "Under review · linked purchase commitments" : "No open valued exposure"}</p>
      </div>
    </div>
    <dl className="grid grid-cols-3 gap-x-6 gap-y-3">
      <div className="min-w-0" data-mapped-suppliers><dt className="text-[13px] leading-relaxed text-label-tertiary">Suppliers mapped</dt><dd><span className="text-[20px] font-medium leading-relaxed tabular-nums text-label-primary" data-mapped-supplier-total>{mapped.total}</span><span className="mt-0.5 block text-[12px] leading-relaxed text-label-secondary">{mapped.direct} direct · {mapped.upstream} upstream</span><span className="block text-[12px] leading-relaxed text-label-tertiary">Partial network coverage</span></dd></div>
      <Fact term="Bill of materials" value={bom ? `${bom.assemblies} assemblies · ${bom.parts} components` : null} />
      <Fact term="Programme margin" value={`${commitment.marginDays} days`} />
    </dl>
    <details className="mt-5 text-[13px] leading-relaxed text-label-secondary" data-planning-source>
      <summary className="cursor-pointer text-label-tertiary">Source details</summary>
      <p className="mt-3">Demo snapshot · {received !== null ? `SAP plan received ${received} min ago` : "receipt time not recorded"}. Order ref {commitment.reference}.</p>
      <p className="mt-2">Missing inputs · {missing.join(" · ")}. A customer contract value is not held.</p>
      {estimate ? <><p className="mt-2">Fictional order specification: {commitment.units} onshore turbines × {estimate.assumedMWPerTurbine} MW = {estimate.totalMW} MW. IRENA reports a {estimate.benchmark.marketYear} average turbine price outside China of $998/kW, published {estimate.benchmark.publishedYear}. Applied to this assumed configuration: $299.4M, rounded to approximately $300M. Not a quoted contract price or total installed wind-farm cost; configuration, scope and market conditions vary.</p>
        <a className="mt-2 inline-block underline underline-offset-4" href={estimate.benchmark.url} target="_blank" rel="noopener noreferrer">IRENA market-pricing basis ↗</a></> : null}
      <p className="mt-2">Mapped suppliers: {mapped.direct} direct suppliers plus {mapped.upstream} additional upstream parties in the registered networks behind {mapped.expandedRoots} direct suppliers. Shared identities and suppliers appearing at more than one tier are counted once. This is partial network coverage, not a complete supplier census or confirmation that every mapped party participates in this order. Case-only parties without a registered identity and non-supplier graph objects are excluded.</p>
      <p className="mt-2">Exposure uses open conditions linked to supplier purchase commitments, counted once per purchase line. It is not estimated loss or customer revenue at risk. Planning criticality alone does not confirm a disruption.</p>
    </details>
  </Surface>;
}
function Fact({ term, value }: { readonly term: string; readonly value: string | null }): React.ReactElement {
  return <div className="min-w-0"><dt className="text-[13px] leading-relaxed text-label-tertiary">{term}</dt><dd className={value === null ? "text-[14px] italic leading-relaxed text-label-quaternary" : "text-[14px] leading-relaxed tabular-nums text-label-primary"}>{value ?? "Not in snapshot"}</dd></div>;
}
