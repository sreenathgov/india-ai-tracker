import * as React from "react";

import type { CommitmentState } from "@/lib/portfolio/portfolio";
import { cn } from "@/lib/ui/cn";

const FILL: Readonly<Record<CommitmentState, string>> = {
  new: "bg-state-new",
  action: "bg-state-action",
  monitoring: "bg-state-monitoring",
};

/**
 * A workflow state's mark. Shape as well as colour, like the concern mark: NEW is a
 * hollow ring (arrived, not yet read), ACTION a filled square (a decision waiting),
 * MONITORING a filled disc (settled, being watched).
 */
export function StateDot({
  state,
  className,
}: {
  readonly state: CommitmentState;
  readonly className?: string;
}): React.ReactElement {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-block h-2 w-2 shrink-0",
        state === "new" && "rounded-full border-[1.5px] border-state-new",
        state === "action" && cn("rounded-[1.5px]", FILL.action),
        state === "monitoring" && cn("rounded-full", FILL.monitoring),
        className
      )}
    />
  );
}
