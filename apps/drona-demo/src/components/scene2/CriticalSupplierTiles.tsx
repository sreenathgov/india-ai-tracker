import * as React from "react";

import type { CriticalProfile, UrgencyBand } from "@/lib/network/criticalProfile";
import { SCALE_LABEL, tierOneProfile } from "@/lib/network/tierOne";
import { cn } from "@/lib/ui/cn";

/**
 * One tile per critical Tier-1, most urgent first — and a selector, not a summary.
 * Each carries the window in days, which is the fact its tint is banded on; the
 * band's words, scale and everything else are in the risk view it opens.
 *
 * Tint follows urgency, the one axis here that is about time: inside 30 days takes
 * the critical fill, inside six weeks the elevated fill, and beyond six weeks stays
 * on the neutral surface. Beyond six weeks is not "low" — every tile here is in
 * critical risk — so it must not borrow the low band's green.
 */
const TINT: Readonly<Record<UrgencyBand, string>> = {
  immediate: "bg-[color:var(--concern-critical-fill)]",
  near: "bg-[color:var(--concern-elevated-fill)]",
  planned: "bg-surface",
};

const INK: Readonly<Record<UrgencyBand, string>> = {
  immediate: "text-[color:var(--concern-critical-ink)]",
  near: "text-[color:var(--concern-elevated-ink)]",
  planned: "text-label-secondary",
};

export function CriticalSupplierTiles({
  profiles,
  selectedId,
  onSelect,
}: {
  readonly profiles: readonly CriticalProfile[];
  readonly selectedId: string;
  readonly onSelect: (supplierId: string) => void;
}): React.ReactElement {
  /* The strip scrolls on a narrow screen, and a Tier-1 can be picked on the map as
     well as here: bring the selected tile into view so the choice is always visible. */
  const stripRef = React.useRef<HTMLElement | null>(null);
  React.useEffect(() => {
    const strip = stripRef.current;
    const tile = strip?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (!strip || !tile) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const start = tile.offsetLeft - strip.offsetLeft;
    const end = start + tile.offsetWidth;
    if (start >= strip.scrollLeft && end <= strip.scrollLeft + strip.clientWidth) return;
    strip.scrollTo({
      left: end > strip.scrollLeft + strip.clientWidth ? end - strip.clientWidth + 28 : start - 28,
      behavior: reduced ? "auto" : "smooth",
    });
  }, [selectedId]);

  return (
    <section
      ref={stripRef}
      aria-label="Critical suppliers"
      className="grid shrink-0 auto-cols-[minmax(164px,1fr)] grid-flow-col gap-2.5 overflow-x-auto border-b border-separator bg-page px-7 py-3.5"
    >
      {profiles.map((profile) => {
        const selected = profile.supplier.id === selectedId;
        const tierOne = tierOneProfile(profile.supplier.id);
        return (
          <button
            key={profile.supplier.id}
            type="button"
            aria-pressed={selected}
            title={`${profile.urgency.label}${tierOne ? ` · ${SCALE_LABEL[tierOne.scale]}` : ""}`}
            onClick={() => onSelect(profile.supplier.id)}
            className={cn(
              "flex min-w-0 flex-col items-start rounded-card px-3.5 py-3 text-left shadow-card",
              "motion-safe:transition-[box-shadow,transform] motion-safe:duration-fast",
              TINT[profile.urgency.band],
              selected
                ? "ring-2 ring-label-primary ring-offset-2 ring-offset-page"
                : "hover:-translate-y-px"
            )}
          >
            <span className="line-clamp-2 min-h-[2lh] text-body-s leading-snug text-label-primary">
              {profile.supplier.name}
            </span>
            <span className="mt-0.5 w-full truncate text-caption text-label-secondary">
              {profile.component.name}
            </span>
            <span className="mt-1.5 flex w-full items-baseline justify-between gap-2">
              <span className={cn("truncate font-mono text-mono-s", INK[profile.urgency.band])} data-figure>
                {profile.urgency.windowDays} d window
              </span>
              <span className="shrink-0 font-mono text-mono-s text-label-tertiary" data-figure>
                {profile.unitsExposed}/{profile.commitment.units}
                <span className="sr-only"> turbines</span>
              </span>
            </span>
          </button>
        );
      })}
    </section>
  );
}
