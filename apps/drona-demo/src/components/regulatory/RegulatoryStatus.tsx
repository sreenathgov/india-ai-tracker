"use client";
import * as React from "react";
import { useRegulatoryCase } from "./RegulatoryProvider";
import { FINDING_LABEL, findingFor, latestScope } from "@/lib/regulatory/state";

export function RegulatoryStatus(): React.ReactElement {
  const { state } = useRegulatoryCase();
  const finding = findingFor(state), scope = latestScope(state);
  return (
    <div className="rounded-card border border-separator bg-inset px-4 py-3" data-regulatory-status={finding} aria-live="polite">
      <div className="flex flex-wrap items-center gap-2 text-caption text-label-secondary">
        <span className="rounded-pill bg-quiet px-2 py-1">Regulatory · EU CBAM</span>
        <span>India → Denmark / EU</span>
        <span className="text-label-quaternary">·</span>
        <span>In force since 1 Jan 2026</span>
      </div>
      <p className="mt-2 font-display text-heading text-label-primary">{FINDING_LABEL[finding]}</p>
      <p className="mt-1 text-caption leading-relaxed text-label-tertiary">
        Applicability · {scope?.answer === "covered" ? "Confirmed by supplied scope check" : scope?.answer === "excluded" ? "Excluded for this shipment" : "Under review"}
        {" · "}Assessment {state.assessments.length} · 2 Nov 2026
      </p>
      <p className="mt-1 text-caption text-label-quaternary">Authored case records · public regulatory sources linked separately</p>
    </div>
  );
}
