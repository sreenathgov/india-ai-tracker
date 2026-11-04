"use client";
import * as React from "react";
import { useRegulatoryCase } from "@/components/regulatory/RegulatoryProvider";

import { RISK_DISPLAY_ORDER, RISK_PRESENTATION } from "./riskPresentation";
import { Icon } from "@/components/ui/Icon";
import {
  DEPENDENCY_TYPES,
  commitmentsWithType,
  dependencyCountOfType,
  dependencyTotalOfType,
  mitigationTotals,
  type DependencyType,
} from "@/lib/portfolio/portfolio";

/** Keep category colours consistent with the overview, including its new display order. */
export const rampColour = (index: number): string => `var(--dep-ramp-${RISK_DISPLAY_ORDER.indexOf(DEPENDENCY_TYPES[index].id) + 1})`;

const shortName = (name: string): string => name.split(" — ")[1] ?? name;

/**
 * The inspect layer behind the radial: every type's definition and where it
 * concentrates, then the mitigation split. Each type can filter the commitment
 * list — the one action here, because the answer to "where is this?" is a list.
 */
export function DependencyDetail({
  onFilterType,
}: {
  readonly onFilterType: (type: DependencyType) => void;
}): React.ReactElement {
  const { state: regulatoryState } = useRegulatoryCase();
  const m = mitigationTotals(regulatoryState);
  const total = m.verified + m.underReview + m.unknowns;
  return (
    <div className="space-y-6">
      <ol className="-mx-3 space-y-0.5">
        {DEPENDENCY_TYPES.map((type, i) => (
          <li key={type.id} className="group grid grid-cols-[10px_1fr_auto] items-start gap-x-3 rounded-[14px] px-3 py-3 transition-[background-color,box-shadow] duration-hover hover:bg-sheet hover:shadow-lift">
            <span className="flex items-center gap-1.5 pt-[3px]">
              <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: rampColour(i) }} />
            </span>
            <div className="min-w-0">
              <p className="text-body-s font-medium text-label-primary">
                {RISK_PRESENTATION[type.id].label} <span data-figure className="ml-1 font-normal text-label-tertiary">{dependencyTotalOfType(type.id)}</span>
              </p>
              <p className="mt-0.5 text-caption text-label-secondary">{RISK_PRESENTATION[type.id].explanation}</p>
              <p className="mt-1.5 flex flex-wrap gap-x-3 text-caption text-label-tertiary">
                {commitmentsWithType(type.id).map((c) => (
                  <span key={c.id}>
                    {shortName(c.name)} <span data-figure className="text-label-secondary">{dependencyCountOfType(c.id, type.id)}</span>
                  </span>
                ))}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onFilterType(type.id)}
              aria-label={`Filter commitments by ${RISK_PRESENTATION[type.id].label}`}
              className="inline-flex h-7 items-center gap-1 rounded-full bg-quiet px-2.5 text-caption text-label-secondary opacity-0 transition-[opacity,background-color,color] duration-hover hover:bg-quiet-hover hover:text-label-primary focus-visible:opacity-100 group-hover:opacity-100"
            >
              <Icon name="filter" className="h-3 w-3" />
              Filter
            </button>
          </li>
        ))}
      </ol>

      <section aria-labelledby="mitigation-heading">
        <h3 id="mitigation-heading" className="micro-label text-label-tertiary">Mitigation status</h3>
        <div className="mt-3 flex h-[3px] overflow-hidden rounded-full bg-quiet-hover" aria-hidden="true">
          <span className="bg-label-secondary" style={{ width: `${(m.verified / total) * 100}%` }} />
          <span className="ml-px bg-label-quaternary" style={{ width: `${(m.underReview / total) * 100}%` }} />
          <span className="ml-px bg-[color:var(--dep-ramp-1)]" style={{ width: `${(m.unknowns / total) * 100}%` }} />
        </div>
        <dl className="mt-3 grid grid-cols-3 gap-3 text-caption">
          <Stat label="Verified mitigation" value={m.verified} />
          <Stat label="Under review" value={m.underReview} />
          <Stat label="Decision-critical unknowns" value={m.unknowns} note="Evidence Drona needs and does not yet have." />
        </dl>
      </section>
    </div>
  );
}

function Stat({ label, value, note }: { readonly label: string; readonly value: number; readonly note?: string }): React.ReactElement {
  return (
    <div>
      <dt className="text-label-tertiary">{label}</dt>
      <dd data-figure className="mt-0.5 font-display text-title-m text-label-primary">{value}</dd>
      {note ? <dd className="mt-0.5 text-label-tertiary">{note}</dd> : null}
    </div>
  );
}
