import * as React from "react";

import { bomCommitment, hasBom, rollupFor, type RiskBand } from "@/lib/network/bom";
import { destinationById } from "@/lib/network/gazetteer";
import { cn } from "@/lib/ui/cn";

const DAY = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const BAND_WORD: Readonly<Record<RiskBand, string>> = {
  critical: "Critical",
  elevated: "Elevated",
  low: "Low",
};

/**
 * The production view's header: which order, for whom, by when — and, once Drona
 * has read the bill of materials, how its assemblies fall across the three bands.
 *
 * The band counts are links, not tiles. The critical five already have tiles of
 * their own directly below; elevated and low open their assembly lists in the
 * middle panel, and critical closes whichever list is open.
 */
export function ProductionHeader({
  commitmentId,
  resolved,
  band,
  onBack,
  onOpenBand,
  onCloseBand,
}: {
  readonly commitmentId: string;
  readonly resolved: boolean;
  readonly band: RiskBand | null;
  readonly onBack: () => void;
  readonly onOpenBand: (band: RiskBand) => void;
  readonly onCloseBand: () => void;
}): React.ReactElement {
  const commitment = bomCommitment(commitmentId);
  const destination = destinationById(commitment.destinationId);
  const rollup = resolved && hasBom(commitmentId) ? rollupFor(commitmentId) : null;

  return (
    <section
      aria-label="Production order"
      className="shrink-0 border-b border-separator bg-surface px-7 py-4"
    >
      <div className="flex flex-wrap items-baseline gap-x-5 gap-y-2">
        <button
          type="button"
          onClick={onBack}
          className="-ml-3 flex shrink-0 items-center gap-2 rounded-chip px-3 py-1.5 text-caption text-label-tertiary motion-safe:transition-colors motion-safe:duration-fast hover:bg-raised hover:text-label-secondary"
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
          Network
        </button>

        <h1 className="text-title-m text-label-primary">{commitment.units} Wind Turbines</h1>
        <p className="font-mono text-mono text-label-tertiary" data-figure>
          {commitment.reference}
        </p>
      </div>

      <div className="mt-2 flex flex-wrap items-baseline gap-x-6 gap-y-2 text-caption text-label-tertiary">
        <span>
          <span className="text-label-secondary">{commitment.buyer}</span>
          {destination ? ` · ${destination.city}, ${destination.country}` : null}
        </span>
        <span>
          Required{" "}
          <span className="font-mono text-mono-s text-label-secondary" data-figure>
            {DAY.format(new Date(`${commitment.requiredBy}T00:00:00Z`))}
          </span>
        </span>

        {rollup ? (
          <nav aria-label="Assemblies by band" className="flex items-baseline gap-1 lg:ml-auto">
            {(["critical", "elevated", "low"] as const).map((key) => {
              const current = key === "critical" ? band === null : band === key;
              return (
                <button
                  key={key}
                  type="button"
                  aria-pressed={current}
                  title={`${rollup[key].assemblies} ${rollup[key].assemblies === 1 ? "assembly" : "assemblies"}, ${rollup[key].parts} ${rollup[key].parts === 1 ? "part" : "parts"}`}
                  onClick={() => (key === "critical" ? onCloseBand() : onOpenBand(key))}
                  className={cn(
                    "rounded-chip px-2.5 py-1 motion-safe:transition-colors motion-safe:duration-fast",
                    current
                      ? "bg-inset text-label-primary"
                      : "text-label-tertiary hover:bg-raised hover:text-label-secondary"
                  )}
                >
                  {BAND_WORD[key]}{" "}
                  <span className="font-mono text-mono-s" data-figure>
                    {rollup[key].assemblies}
                  </span>
                  <span className="sr-only">
                    {rollup[key].assemblies === 1 ? " assembly" : " assemblies"}
                  </span>
                </button>
              );
            })}
          </nav>
        ) : null}
      </div>
    </section>
  );
}
