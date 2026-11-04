import * as React from "react";

import { STATE_LABEL, type CommitmentState } from "@/lib/portfolio/portfolio";
import { cn } from "@/lib/ui/cn";
import { StateDot } from "./StateDot";

const INK: Readonly<Record<CommitmentState, string>> = {
  new: "text-state-new-ink",
  action: "text-state-action-ink",
  monitoring: "text-state-monitoring-ink",
};

/**
 * The one status system on Scene 1: shape-coded dot plus a word, in the state's
 * ink. Colour never carries state alone and never fills a card.
 */
export function StatusMark({
  state,
  count,
  className,
}: {
  readonly state: CommitmentState;
  readonly count?: number;
  readonly className?: string;
}): React.ReactElement {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-caption", className)}>
      <StateDot state={state} />
      <span className={cn("font-medium", INK[state])}>{STATE_LABEL[state]}</span>
      {count !== undefined ? <span className="tabular text-label-tertiary">{count}</span> : null}
    </span>
  );
}
