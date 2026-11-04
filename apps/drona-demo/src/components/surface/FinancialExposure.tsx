"use client";
import * as React from "react";
import { useSupplierInquiry } from "@/components/scene2/investigation/overview/SupplierInquiryProvider";
import { useRegulatoryCase } from "@/components/regulatory/RegulatoryProvider";
import { ASSESSED_COMMERCIAL_ORDERS, COMMERCIAL_SNAPSHOT, exposureSummary, formatUSD } from "@/lib/portfolio/commercial";
import { COMMITMENTS } from "@/lib/network/gazetteer";
import styles from "./FinancialExposure.module.css";

export function FinancialExposure(): React.ReactElement {
  const { state } = useRegulatoryCase();
  const { state: material } = useSupplierInquiry();
  const exposure = exposureSummary(state, undefined, undefined, undefined, material);
  return <section className={styles.summary} aria-labelledby="financial-exposure-title" data-financial-summary>
    <div className={styles.heading}><h3 id="financial-exposure-title">Committed spend at risk</h3><span>USD</span></div>
    <p className={styles.amount} data-financial-total data-figure>{formatUSD(exposure.totalCents)}</p>
    <p className={styles.definition}>Purchase commitments linked to open material-risk cases.</p>
    <dl className={styles.statuses}>
      <div><dt>Under review</dt><dd data-financial-review>{formatUSD(exposure.reviewCents)}</dd></div>
      <div><dt>Confirmed exposure</dt><dd data-financial-confirmed>{formatUSD(exposure.confirmedCents)}</dd></div>
    </dl>
    <p className={styles.coverage}>{ASSESSED_COMMERCIAL_ORDERS.length} of {COMMITMENTS.length} active orders assessed; {exposure.suppliers} suppliers linked to open cases.</p>
    <div className={styles.timing}><span>Earliest action deadline</span><strong>{exposure.lines.some(line => line.supplierId === "sup:deccan-mainshaft-forgings") ? "6 Nov · Deccan billet cover" : "To be confirmed"}</strong></div>
    <details className={styles.basis} data-commercial-basis>
      <summary>Value basis · illustrative data</summary>
      <p>{COMMERCIAL_SNAPSHOT.source} · 2 Nov 2026. Unfulfilled supplier purchase orders, including paid and binding unpaid commitments. Covers three valued purchase lines; counts each once. Exposure is not estimated loss. Other dependencies are not valued here; three orders remain unassessed.</p>
      <ul>{exposure.lines.map(line => <li key={line.id}><span>{line.label}<small>{line.id} · {line.status === "confirmed" ? "Confirmed exposure" : "Under review"}</small></span><strong>{formatUSD(line.committedCents)}</strong></li>)}</ul>
    </details>
  </section>;
}
