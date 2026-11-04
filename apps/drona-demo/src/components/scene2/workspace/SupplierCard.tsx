"use client";
import * as React from "react";
import { useSupplierInquiry } from "@/components/scene2/investigation/overview/SupplierInquiryProvider";
import { MATERIAL_CASE } from "@/lib/scene2/investigation/inquiry";
import { Tooltip } from "@/components/ui/Tooltip";
import { CONCERN_DEGREE } from "@/components/ui/ConcernMark";
import { useRegulatoryCase } from "@/components/regulatory/RegulatoryProvider";
import { REGULATORY_CASE } from "@/lib/regulatory/state";
import type { SupplierRecord } from "@/lib/scene2/supplierView";
import { cn } from "@/lib/ui/cn";
import { BAND_INK, CARD_BAND, bandKey } from "./bandStyle";
import { supplierPresentation } from "./supplierPresentation";

export function SupplierCard({ record, commitmentId, open, onOpen }: {
  readonly record: SupplierRecord; readonly commitmentId: string; readonly open: boolean; readonly onOpen: () => void;
}): React.ReactElement {
  const { state } = useRegulatoryCase();
  const { state: material } = useSupplierInquiry();
  const { supplier, band } = record;
  const info = supplierPresentation(record, commitmentId, state, material);
  const featured = commitmentId === REGULATORY_CASE.orderId && supplier.id === REGULATORY_CASE.supplierId && band !== null;
  const materialFeatured = commitmentId === MATERIAL_CASE.orderId && supplier.id === MATERIAL_CASE.supplierId && band !== null;
  return <li className="min-w-0" data-supplier-record={supplier.id}>
    <Tooltip content={supplier.name}>
      <button type="button" aria-haspopup="dialog" aria-expanded={open} onClick={onOpen}
        aria-label={featured ? "Investigate CBAM readiness" : materialFeatured ? "Investigate billet disruption" : undefined}
        data-supplier-card={supplier.id} data-band={band ?? "none"}
        data-guide-target={featured ? "open-regulatory-case" : materialFeatured ? "open-material-case" : undefined}
        className={cn("group/card flex h-full min-h-[226px] w-full min-w-0 flex-col rounded-card border p-4 text-left transition-[background-color,border-color] duration-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-label-secondary", CARD_BAND[bandKey(band)], open && "ring-1 ring-label-quaternary")}>
        <span className="block w-full truncate text-[15px] font-semibold leading-[1.45] text-label-primary">{supplier.name}</span>
        <span className="mt-1 block text-[13px] leading-[1.45] text-label-tertiary">{supplier.city}, {supplier.country}</span>
        <span className="mt-3 block text-[14px] leading-[1.45] text-label-secondary" data-supplier-component>{info.component}</span>
        <span className="mb-4 mt-5 block" data-supplier-concern>
          <span className="block text-[14px] font-medium leading-[1.45] text-label-primary">{info.category}</span>
          <span className="mt-1 block text-[13px] leading-[1.45] text-label-secondary">{info.summary}</span>
        </span>
        <span className="mt-auto flex w-full flex-wrap items-baseline justify-between gap-x-3 gap-y-2 text-[13px] leading-[1.45]">
          {band ? <span className="text-label-tertiary">Planning priority: <span className={cn("font-medium", BAND_INK[band])}>{CONCERN_DEGREE[band]}</span></span> : null}
          {featured || materialFeatured ? <span className="font-medium text-action">{featured ? "Investigate CBAM readiness" : "Investigate billet disruption"} <span aria-hidden="true">→</span></span> : null}
        </span>
      </button>
    </Tooltip>
  </li>;
}
