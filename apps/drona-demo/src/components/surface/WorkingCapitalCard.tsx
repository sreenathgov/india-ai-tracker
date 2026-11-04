"use client";
import * as React from "react";
import { InspectButton, Surface } from "@/components/bento/Surface";
import { ContextOverlay, useOverlay } from "@/components/overlay/ContextOverlay";
import { capitalTotals, formatUSD } from "@/lib/portfolio/commercial";
import { WorkingCapitalDetail } from "./WorkingCapitalDetail";

export function WorkingCapitalCard({ className }: { readonly className?: string }): React.ReactElement {
  const overlay = useOverlay<HTMLElement>();
  const capital = capitalTotals();
  return <Surface surfaceId="capital" surfaceRef={overlay.originRef} title="Working capital" material="veil" actions={<InspectButton label="Inspect working capital" onClick={overlay.show} />} className={className} bodyClassName="px-5 pb-5">
    <div tabIndex={0} aria-label="Working capital status" className="min-h-0 overflow-y-auto focus-visible:outline focus-visible:outline-2 focus-visible:outline-label-secondary">
    <p className="text-caption text-label-tertiary">Disbursed</p>
    <p data-capital-disbursed data-figure className="mt-1 font-display text-[44px] leading-none tracking-[-0.025em] text-label-primary">{formatUSD(capital.disbursedCents)}</p>
    <div className="mt-4 border-t border-separator pt-3">
      <p data-figure className="text-[18px] leading-6 text-label-secondary">{formatUSD(capital.sanctionedUndisbursedCents)}</p>
      <p className="mt-1 text-caption leading-4 text-label-tertiary">Sanctioned · awaiting disbursement</p>
    </div>
    <p className="mt-4 text-[11px] leading-4 text-label-tertiary">{capital.suppliers} suppliers · {capital.tiers} tiers</p>
    <p className="mt-1 text-[10px] leading-4 text-label-tertiary">Illustrative USD snapshot · 2 Nov 2026</p>
    </div>
    <ContextOverlay open={overlay.open} onOpenChange={overlay.setOpen} originRef={overlay.originRef} eyebrow="Working capital" title="Funding linked to production commitments" description="Track disbursements and approved facilities separately. Suppliers have a standing application pathway; the regulated financier makes every credit decision."><WorkingCapitalDetail /></ContextOverlay>
  </Surface>;
}
