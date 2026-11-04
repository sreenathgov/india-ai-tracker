import * as React from "react";

import { cn } from "@/lib/ui/cn";

const FOCUS =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-label-quaternary";

export type MapScope = "all" | "selected";

/**
 * A — the map card's own title and scope, laid over the dark map. The scope is
 * every commitment, or the one selected: Drona's recommendation until the reviewer
 * points at another.
 */
export function MapCardHeader({
  scope,
  selectedLabel,
  onScope,
}: {
  readonly scope: MapScope;
  readonly selectedLabel: string;
  readonly onScope: (scope: MapScope) => void;
}): React.ReactElement {
  const options: readonly { readonly value: MapScope; readonly label: string }[] = [
    { value: "all", label: "All commitments" },
    { value: "selected", label: selectedLabel },
  ];
  return (
    <div className="pointer-events-none absolute left-4 top-4 z-20 flex flex-col gap-2">
      <div>
        <h2 className="text-body-s font-medium text-label-primary">Network</h2>
        <p className="text-caption text-label-tertiary">Tier-1 · plant · customer destinations</p>
      </div>
      <div
        role="group"
        aria-label="Map scope"
        className="pointer-events-auto flex w-max items-center rounded-chip border border-separator bg-[color:var(--bg-map-popover)] p-0.5 backdrop-blur-sm"
      >
        {options.map((option) => {
          const active = option.value === scope;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={active}
              onClick={() => onScope(option.value)}
              className={cn(
                "rounded-pill px-2.5 py-1 text-caption transition-colors duration-fast",
                FOCUS,
                active ? "bg-inset font-medium text-label-primary" : "text-label-tertiary hover:text-label-primary"
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
