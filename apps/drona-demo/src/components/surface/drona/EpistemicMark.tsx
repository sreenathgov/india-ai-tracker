import * as React from "react";

import type { ReasoningState } from "@/lib/portfolio/assistant";
import { cn } from "@/lib/ui/cn";

const LABEL: Readonly<Record<ReasoningState, string>> = {
  verified: "Verified",
  inferred: "Inferred",
  unresolved: "Unresolved",
};

/**
 * How Drona knows a line: a filled disc (held on record), a hollow ring (read, not
 * contracted), a dashed ring (not known). Shape first; the word is always beside it.
 */
export function EpistemicMark({
  state,
  label,
  className,
}: {
  readonly state: ReasoningState;
  /** Overrides the word beside the shape, where a surface names the state its own way. */
  readonly label?: string;
  readonly className?: string;
}): React.ReactElement {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-[11px] leading-none", className)}>
      <span
        aria-hidden="true"
        className={cn(
          "inline-block h-[7px] w-[7px] shrink-0 rounded-full",
          state === "verified" && "bg-state-monitoring",
          state === "inferred" && "border-[1.5px] border-state-new",
          state === "unresolved" && "border-[1.5px] border-dashed border-state-action"
        )}
      />
      <span
        className={cn(
          state === "verified" && "text-state-monitoring-ink",
          state === "inferred" && "text-state-new-ink",
          state === "unresolved" && "text-state-action-ink"
        )}
      >
        {label ?? LABEL[state]}
      </span>
    </span>
  );
}
