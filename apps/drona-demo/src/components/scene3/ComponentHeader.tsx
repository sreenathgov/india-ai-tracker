"use client";

import * as React from "react";

import { CONCERN_DEGREE, ConcernMark } from "@/components/ui/ConcernMark";
import { bandFor } from "@/lib/network/bom";
import { tracedComponents, type DependencyChain } from "@/lib/network/dependencies";
import { componentSummary, formatDay } from "@/lib/network/pathway";
import { cn } from "@/lib/ui/cn";

/**
 * The assembly's header, and the quiet switcher between the traced assemblies.
 *
 * The switcher is deliberately undersized. The sketch is explicit that the reviewer
 * should meet **one problem at a time, not a spreadsheet of twenty red rows** — so the
 * other assemblies are present as a way to move, not as a comparison table. Give them
 * figures and the eye starts ranking them, and the screen has quietly become the list
 * this scene was built to replace.
 *
 * No composite figure appears here. Four facts, each of which can be argued with
 * separately; nothing that averages them into a verdict.
 */
export function ComponentHeader({
  chain,
  onBack,
  onSwitch,
}: {
  readonly chain: DependencyChain;
  readonly onBack: () => void;
  readonly onSwitch: (componentId: string) => void;
}): React.ReactElement {
  const summary = componentSummary(chain);
  const others = tracedComponents(chain.commitment.id);
  const { band, because } = bandFor(chain.component, chain.supplier, chain.commitment);

  return (
    <section
      aria-label="Component exposure"
      className="shrink-0 border-b border-separator bg-surface px-8 py-5"
    >
      <div className="flex flex-wrap items-baseline gap-x-6 gap-y-3">
        <button
          type="button"
          onClick={onBack}
          className="-ml-3 flex shrink-0 items-center gap-2 rounded-chip px-3 py-2 text-caption text-label-tertiary motion-safe:transition-colors motion-safe:duration-fast hover:bg-raised hover:text-label-secondary"
        >
          <svg aria-hidden="true" width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path
              d="M10 3.5 5.5 8 10 12.5"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Production commitment
        </button>

        <h1 className="text-title-m text-label-primary">{summary.name}</h1>
        <p className="text-caption text-label-tertiary">{summary.system}</p>
      </div>

      <div className="mt-4 flex flex-wrap items-start gap-x-12 gap-y-4">
        <div className="min-w-0">
          <p className="micro-label text-label-quaternary">Turbines exposed</p>
          <p className="mt-2 text-title-l text-label-primary" data-figure>
            {summary.unitsExposed}
            <span className="text-title-m text-label-quaternary">
              {" / "}
              {summary.totalUnits}
            </span>
          </p>
        </div>

        <Fact label="Required" mono>
          {formatDay(summary.requiredBy)}
        </Fact>
        <Fact label="Programme margin" mono>
          {summary.marginDays} days
        </Fact>
        <Fact label="Confirmed coverage" mono>
          {summary.coverageDays} days
        </Fact>
        <Fact label="Lead time" mono>
          {summary.leadTimeDays} days
        </Fact>

        {/* The sketch asks for a criticality. It gets one — with the reason attached,
            because a band on its own is a verdict, and a verdict is the thing this
            scene exists to replace. */}
        <div className="min-w-0">
          <p className="micro-label text-label-quaternary">Criticality</p>
          <p className="mt-2 flex items-center gap-2 text-body-s text-label-secondary">
            <ConcernMark concern={band} size={11} className="translate-y-[0.5px]" />
            {CONCERN_DEGREE[band]}
          </p>
        </div>
      </div>

      <p className="mt-4 max-w-measure text-caption italic text-label-tertiary">
        {because}
      </p>

      {others.length > 1 ? (
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span className="micro-label mr-1 text-label-quaternary">
            Also traced
          </span>
          {others.map((component) => {
            const active = component.id === chain.component.id;
            return (
              <button
                key={component.id}
                type="button"
                aria-pressed={active}
                onClick={() => onSwitch(component.id)}
                className={cn(
                  "rounded-pill border px-3 py-1.5 text-caption",
                  "motion-safe:transition-colors motion-safe:duration-fast",
                  active
                    ? "border-label-quaternary bg-inset text-label-primary"
                    : "border-separator text-label-tertiary hover:bg-raised hover:text-label-secondary"
                )}
              >
                {component.name}
              </button>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}

function Fact({
  label,
  mono = false,
  children,
}: {
  readonly label: string;
  readonly mono?: boolean;
  readonly children: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="min-w-0">
      <p className="micro-label text-label-quaternary">{label}</p>
      <p
        className={
          mono
            ? "mt-2 font-mono text-mono text-label-secondary"
            : "mt-2 text-body-s text-label-secondary"
        }
        data-figure={mono ? true : undefined}
      >
        {children}
      </p>
    </div>
  );
}
