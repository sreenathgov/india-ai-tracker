import * as React from "react";
import { CAPITAL_SNAPSHOT, capitalTotals, formatUSD } from "@/lib/portfolio/commercial";
import { commitmentById } from "@/lib/network/gazetteer";

export function WorkingCapitalDetail(): React.ReactElement {
  const capital = capitalTotals();
  return <div className="space-y-7">
    <dl className="grid grid-cols-2 gap-4"><Figure label="Disbursed" value={formatUSD(capital.disbursedCents)} /><Figure label="Sanctioned, awaiting disbursement" value={formatUSD(capital.sanctionedUndisbursedCents)} /></dl>
    <section><h3 className="micro-label text-label-tertiary">Production commitments</h3>
      <ul className="mt-3 space-y-4">{CAPITAL_SNAPSHOT.pathways.map(path => <li key={path.orderId} className="border-t border-separator pt-3"><p className="text-body-s text-label-primary">{commitmentById(path.orderId)!.name.split(" — ")[1]}</p><p className="mt-1 text-caption text-label-tertiary">{commitmentById(path.orderId)!.reference} · {path.suppliers} suppliers</p><p className="mt-2 text-caption text-label-secondary">{formatUSD(path.disbursedCents)} disbursed · {formatUSD(path.sanctionedUndisbursedCents)} sanctioned, awaiting disbursement</p></li>)}</ul>
    </section>
    <section><h3 className="micro-label text-label-tertiary">Supplier reach</h3><dl className="mt-3 grid grid-cols-3 gap-4">{CAPITAL_SNAPSHOT.suppliersByTier.map((n, i) => <Figure key={i} label={`Tier-${i + 1}`} value={String(n)} />)}</dl></section>
    <dl><Figure label="Disbursed this week" value={formatUSD(CAPITAL_SNAPSHOT.thisWeek.cents)} note={`Across ${CAPITAL_SNAPSHOT.thisWeek.pathways} supplier pathways; included in the disbursed total.`} /></dl>
    <p className="text-caption leading-5 text-label-tertiary">{CAPITAL_SNAPSHOT.source} · 2 Nov 2026 · authored in USD. Funding is associated with these production commitments; this is not a measurement of revenue protected or a claim that finance resolved a risk.</p>
  </div>;
}
function Figure({ label, value, note }: { readonly label: string; readonly value: string; readonly note?: string }): React.ReactElement { return <div><dt className="text-caption text-label-tertiary">{label}</dt><dd data-figure className="mt-1 font-display text-title-m text-label-primary">{value}</dd>{note ? <dd className="mt-1 text-caption text-label-tertiary">{note}</dd> : null}</div>; }
