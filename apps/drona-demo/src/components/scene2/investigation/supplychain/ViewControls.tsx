"use client";

import * as React from "react";

import type { GraphView, ObjectKind, ViewMode } from "@/lib/scene2/supplychain/view";
import type { SupplierTier } from "@/lib/scene2/supplychain/types";
import { cn } from "@/lib/ui/cn";
import { ObjectFilter } from "./ObjectFilter";

const MODES: readonly { readonly mode: ViewMode; readonly label: string; readonly hint: string }[] = [
  { mode: "critical", label: "Critical path", hint: "Only what the concern travels through, and its line back to the order" },
  { mode: "relevant", label: "Relevant network", hint: "Everything this commitment depends on" },
  { mode: "mapped", label: "All mapped", hint: "Adds parties Drona holds behind this supplier on other work" },
];

const TIERS: readonly SupplierTier[] = [1, 2, 3];

/**
 * How much of the network to resolve.
 *
 * Two decisions, said in words rather than in switches: what counts as relevant,
 * and how far behind the Tier-1 to look. The depth control is labelled for supplier
 * relationships alone — a material is not "Tier 2", it is a material reached through
 * a Tier-2 supplier, and the wording has to keep that straight.
 */
export function ViewControls({
  view,
  withheld,
  onMode,
  onTier,
  onToggle,
}: {
  readonly view: GraphView;
  readonly withheld: number;
  readonly onMode: (mode: ViewMode) => void;
  readonly onTier: (tier: SupplierTier) => void;
  readonly onToggle: (kind: ObjectKind) => void;
}): React.ReactElement {
  const mode = MODES.find((entry) => entry.mode === view.mode)!;
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2" data-view-controls>
      <div className="flex items-center gap-0.5 rounded-pill bg-sheet-sunk p-0.5">
        {MODES.map((entry) => (
          <button
            key={entry.mode}
            type="button"
            aria-pressed={view.mode === entry.mode}
            onClick={() => onMode(entry.mode)}
            className={cn(
              "rounded-pill px-3 py-1 text-caption transition-colors",
              view.mode === entry.mode
                ? "bg-card text-label-primary shadow-rest"
                : "text-label-tertiary hover:text-label-secondary"
            )}
          >
            {entry.label}
          </button>
        ))}
      </div>

      {/* The hint sits beside the control it explains, not on a line of its own: the
          canvas needs that height more than the layout needs a tidy second row. */}
      <p className="min-w-0 flex-1 truncate text-caption text-label-quaternary">{mode.hint}</p>

      <div className="flex items-center gap-2">
        <span className="micro-label text-label-quaternary">Supplier depth</span>
        <div className="flex items-center gap-0.5">
          {TIERS.map((tier) => (
            <button
              key={tier}
              type="button"
              aria-pressed={view.tier === tier}
              aria-label={`Resolve to tier ${tier}`}
              onClick={() => onTier(tier)}
              className={cn(
                "h-6 w-6 rounded-pill text-caption tabular-nums transition-colors",
                view.tier === tier
                  ? "bg-quiet text-label-primary"
                  : "text-label-quaternary hover:bg-hover hover:text-label-secondary"
              )}
            >
              {tier}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {withheld > 0 ? (
          <span className="whitespace-nowrap text-caption text-label-quaternary">{withheld} more mapped</span>
        ) : null}
        <ObjectFilter view={view} onToggle={onToggle} />
      </div>
    </div>
  );
}
