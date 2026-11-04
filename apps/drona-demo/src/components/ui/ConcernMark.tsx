import * as React from "react";

import { cn } from "@/lib/ui/cn";
import type { Concern } from "@/lib/network/types";

/**
 * The concern mark. Colour **and** shape, always both.
 *
 * Colour alone fails for roughly one in twelve men, and it also fails on a
 * projector in a bright room — which is where this demo will actually be seen.
 * The shape ladder is not arbitrary either: it gains vertices as concern rises, so
 * severity reads as increasing structure even in a monochrome screenshot.
 *
 *   low       ·  disc      — closed, settled
 *   elevated  ◆  diamond   — tilted, unresolved
 *   critical  ▲  triangle  — pointed, directional
 */

const SHAPE: Record<Concern, string> = {
  /* circle */
  low: "M 8 3.2 A 4.8 4.8 0 1 1 7.99 3.2 Z",
  /* diamond */
  elevated: "M 8 2.4 L 13.6 8 L 8 13.6 L 2.4 8 Z",
  /* triangle */
  critical: "M 8 2.2 L 14 13.4 L 2 13.4 Z",
};

const FILL: Record<Concern, string> = {
  low: "var(--concern-low)",
  elevated: "var(--concern-elevated)",
  critical: "var(--concern-critical)",
};

export const CONCERN_LABEL: Record<Concern, string> = {
  low: "Low concern",
  elevated: "Elevated concern",
  critical: "Critical concern",
};

/**
 * The degree on its own, for a field whose own label already supplies the noun.
 * "Criticality — Critical concern" says the word twice and reads as a system talking
 * to itself; "Criticality — Critical" is the same claim in the reviewer's register.
 */
export const CONCERN_DEGREE: Record<Concern, string> = {
  low: "Low",
  elevated: "Elevated",
  critical: "Critical",
};

export function ConcernMark({
  concern,
  size = 16,
  className,
}: {
  readonly concern: Concern;
  readonly size?: number;
  readonly className?: string;
}): React.ReactElement {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      role="img"
      aria-label={CONCERN_LABEL[concern]}
      className={cn("shrink-0", className)}
    >
      <path
        d={SHAPE[concern]}
        fill={FILL[concern]}
      />
    </svg>
  );
}

/** The mark plus its word, for places where the label is not already adjacent. */
export function ConcernTag({
  concern,
  className,
}: {
  readonly concern: Concern;
  readonly className?: string;
}): React.ReactElement {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <ConcernMark concern={concern} size={12} />
      <span className="text-caption text-label-secondary">
        {CONCERN_LABEL[concern]}
      </span>
    </span>
  );
}
