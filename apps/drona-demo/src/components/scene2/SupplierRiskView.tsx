import * as React from "react";

import { CONFIDENCE_LABEL, CONFIDENCE_MEANING } from "@/lib/network/confidence";
import type { CriticalProfile } from "@/lib/network/criticalProfile";
import type { SubTierFilter } from "@/lib/network/subtier/filter";
import { RISK_KIND_LABEL } from "@/lib/network/subtier";
import { OWNERSHIP_LABEL, SCALE_LABEL, tierOneProfile } from "@/lib/network/tierOne";
import { cn } from "@/lib/ui/cn";
import { CoverageBar } from "./BandComponents";
import { SubTierTable } from "./SubTierTable";
import type { Sourcing } from "@/lib/network/types";

const SOURCING_LABEL: Readonly<Record<Sourcing, string>> = {
  sole: "Sole source",
  dual: "Dual source",
  multi: "Multiple sources",
};

/**
 * One critical Tier-1, read top to bottom: who it is, what this order needs from
 * it, the four questions a reviewer asks of any risk — what kind, how soon, how
 * far, how well known — then why, then everything behind it.
 *
 * Each of the four is a label **and the facts that produced it**. None is a score,
 * and none is combined with another. Critical ink is spent once, on urgency, and
 * only when the window is inside 30 days; the rest of the view is neutral, because
 * every supplier on these tiles is already in critical risk and repeating the colour
 * everywhere would stop it meaning anything.
 */
export function SupplierRiskView({
  profile,
  filter,
  onFilter,
  highlightId,
  onHover,
  onTrace,
}: {
  readonly profile: CriticalProfile;
  readonly filter: SubTierFilter;
  readonly onFilter: (filter: SubTierFilter) => void;
  readonly highlightId: string | null;
  readonly onHover: (nodeId: string | null) => void;
  readonly onTrace: (componentId: string) => void;
}): React.ReactElement {
  const { supplier, component, urgency, threat, riskType, commitment } = profile;
  const tierOne = tierOneProfile(supplier.id);

  return (
    <article aria-label={`${supplier.name} — risk view`} className="flex flex-col gap-7">
      <header>
        <p className="micro-label text-label-quaternary">Critical Tier-1</p>
        <h2 className="mt-2 text-title-m text-label-primary">{supplier.name}</h2>
        <p className="mt-1 text-caption text-label-tertiary">
          {supplier.city}, {supplier.region}
          {tierOne
            ? ` · ${SCALE_LABEL[tierOne.scale]} · ${OWNERSHIP_LABEL[tierOne.ownership]}`
            : null}
          {` · ${SOURCING_LABEL[supplier.sourcing]}`}
        </p>
        {tierOne ? (
          <p className="mt-3 max-w-measure text-body-s text-label-secondary">
            {tierOne.process}.{" "}
            <span className="text-label-tertiary">{tierOne.capacityNote}</span>
          </p>
        ) : null}
        {supplier.certifications.length > 0 ? (
          <p className="mt-2 font-mono text-mono-s text-label-quaternary">
            {supplier.certifications.join(" · ")}
          </p>
        ) : null}
      </header>

      <section aria-label="Critical component" className="rounded-card bg-surface px-5 py-4 shadow-card">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
          <div>
            <p className="micro-label text-label-quaternary">Critical component</p>
            <p className="mt-2 text-body text-label-primary">{component.name}</p>
          </div>
          <p className="text-body-s text-label-primary" data-figure>
            {profile.unitsExposed} of {commitment.units} turbines
            <span className="ml-2 font-mono text-mono-s text-label-quaternary">
              Units {component.turbines.from}–{component.turbines.to}
            </span>
          </p>
        </div>
        <div className="mt-4 max-w-[420px]">
          <CoverageBar
            coverage={component.coverageDays}
            lead={component.leadTimeDays}
            margin={commitment.marginDays}
          />
          <p className="mt-2 font-mono text-mono-s text-label-tertiary" data-figure>
            {component.coverageDays} d cover · {component.leadTimeDays} d lead ·{" "}
            {commitment.marginDays} d margin
          </p>
        </div>
      </section>

      <section aria-label="Risk profile" className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
        <Fact title="Risk type" label={RISK_KIND_LABEL[riskType.primary]}>
          {riskType.contributing.length > 0 ? (
            <span className="flex flex-wrap gap-1.5">
              <span className="text-label-tertiary">Also on the chain:</span>
              {riskType.contributing.map((kind) => (
                <span key={kind} className="rounded-chip bg-inset px-2 py-0.5 text-label-secondary">
                  {RISK_KIND_LABEL[kind]}
                </span>
              ))}
            </span>
          ) : (
            "No other kind found on the traced chain"
          )}
        </Fact>
        <Fact
          title="Urgency"
          label={urgency.label}
          critical={urgency.band === "immediate"}
          facts={urgency.facts}
        />
        <Fact title="Reach" label={threat.label} facts={threat.facts} />
        <Fact title="Confidence" label={CONFIDENCE_LABEL[profile.confidence]}>
          <span className="italic">{CONFIDENCE_MEANING[profile.confidence]}</span>
          <span className="mt-1 block text-label-quaternary">
            The weakest evidence on the traced chain.
          </span>
        </Fact>
      </section>

      <section aria-label="Why">
        <h3 className="micro-label text-label-quaternary">Why</h3>
        <p className="mt-3 max-w-measure text-body-s leading-relaxed text-label-primary">
          {profile.why.mechanism}
        </p>
        <ul className="mt-3 max-w-measure space-y-1.5">
          {profile.why.conditions.map((condition) => (
            <li key={condition} className="flex gap-2.5 text-caption leading-relaxed text-label-secondary">
              <span aria-hidden="true" className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-label-quaternary" />
              {condition}
            </li>
          ))}
        </ul>
      </section>

      <SubTierTable
        supplierId={supplier.id}
        filter={filter}
        onFilter={onFilter}
        highlightId={highlightId}
        onHover={onHover}
      />

      <div>
        <button
          type="button"
          onClick={() => onTrace(component.id)}
          className="group flex items-center gap-2 rounded-chip bg-action px-5 py-2.5 text-body-s text-action-on motion-safe:transition-colors motion-safe:duration-fast hover:bg-action-hover"
        >
          Trace the production pathway
          <svg
            aria-hidden="true"
            width="12"
            height="12"
            viewBox="0 0 16 16"
            fill="none"
            className="motion-safe:transition-transform motion-safe:duration-fast group-hover:translate-x-0.5"
          >
            <path d="M6 3.5 10.5 8 6 12.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </article>
  );
}

function Fact({
  title,
  label,
  facts,
  critical = false,
  children,
}: {
  readonly title: string;
  readonly label: string;
  readonly facts?: readonly string[];
  readonly critical?: boolean;
  readonly children?: React.ReactNode;
}): React.ReactElement {
  return (
    <div
      className={cn(
        "rounded-card px-4 py-3.5",
        critical ? "bg-[color:var(--concern-critical-fill)]" : "bg-surface shadow-card"
      )}
    >
      <p className="micro-label text-label-quaternary">{title}</p>
      <p
        className={cn(
          "mt-2 text-body-s",
          critical ? "text-[color:var(--concern-critical-ink)]" : "text-label-primary"
        )}
      >
        {label}
      </p>
      <div className="mt-2 text-caption leading-relaxed text-label-secondary" data-figure>
        {facts ? (
          <ul className="space-y-1">
            {facts.map((fact) => (
              <li key={fact}>{fact}</li>
            ))}
          </ul>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
