"use client";
import * as React from "react";
import { useSupplierInquiry } from "@/components/scene2/investigation/overview/SupplierInquiryProvider";
import { MATERIAL_CASE } from "@/lib/scene2/investigation/inquiry";
import { CONCERN_DEGREE } from "@/components/ui/ConcernMark";
import { Tooltip } from "@/components/ui/Tooltip";
import { useRegulatoryCase } from "@/components/regulatory/RegulatoryProvider";
import { REGULATORY_CASE } from "@/lib/regulatory/state";
import type { SupplierRecord } from "@/lib/scene2/supplierView";
import { cn } from "@/lib/ui/cn";
import { BAND_INK } from "./bandStyle";
import { supplierPresentation } from "./supplierPresentation";
import styles from "./SupplierWorkbench.module.css";

/** Same projection as Cards; responsive rows retain every field without horizontal scrolling. */
export function SupplierTable({ records, commitmentId, assessed, openId, onOpen }: {
  readonly records: readonly SupplierRecord[]; readonly commitmentId: string; readonly assessed: boolean;
  readonly openId: string | null; readonly onOpen: (id: string) => void;
}): React.ReactElement {
  const { state } = useRegulatoryCase();
  const { state: material } = useSupplierInquiry();
  return <table className={styles.table} data-supplier-records="list">
    <thead><tr><th scope="col">Supplier / location</th><th scope="col">Component</th><th scope="col">Concern</th>{assessed ? <th scope="col">Planning priority</th> : null}</tr></thead>
    <tbody>{records.map(record => {
      const { supplier, band } = record;
      const info = supplierPresentation(record, commitmentId, state, material);
      const featured = assessed && commitmentId === REGULATORY_CASE.orderId && supplier.id === REGULATORY_CASE.supplierId;
      const materialFeatured = assessed && commitmentId === MATERIAL_CASE.orderId && supplier.id === MATERIAL_CASE.supplierId;
      return <tr key={supplier.id} data-supplier-record={supplier.id} data-band={band ?? "none"} className={cn(openId === supplier.id && "bg-selected")}>
        <th scope="row"><Tooltip content={supplier.name}>
          <button type="button" aria-haspopup="dialog" aria-expanded={openId === supplier.id} onClick={() => onOpen(supplier.id)}
            data-supplier-card={supplier.id} data-guide-target={featured ? "open-regulatory-case" : materialFeatured ? "open-material-case" : undefined}
            aria-label={featured ? "Investigate CBAM readiness" : materialFeatured ? "Investigate billet disruption" : undefined}
            className="group block min-h-11 w-full rounded-sm text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-label-secondary">
              <span className="block truncate text-[15px] font-semibold leading-[1.45] text-label-primary group-hover:underline">{supplier.name}</span>
              <span className="mt-1 block text-[13px] font-normal leading-[1.45] text-label-tertiary">{supplier.city}, {supplier.country}</span>
              {featured || materialFeatured ? <span className="mt-2 block text-[13px] font-medium text-action">{featured ? "Investigate CBAM readiness" : "Investigate billet disruption"} <span aria-hidden="true">→</span></span> : null}
            </button>
          </Tooltip>
        </th>
        <td data-label="Component" data-supplier-component>{info.component}</td>
        <td data-label="Concern" data-supplier-concern><span className="block font-medium text-label-primary">{info.category}</span><span className="mt-1 block text-[13px] leading-[1.45] text-label-secondary">{info.summary}</span></td>
        {assessed ? <td data-label="Planning priority" className={band ? BAND_INK[band] : undefined}>{band ? CONCERN_DEGREE[band] : "Not assessed"}</td> : null}
      </tr>;
    })}</tbody>
  </table>;
}
