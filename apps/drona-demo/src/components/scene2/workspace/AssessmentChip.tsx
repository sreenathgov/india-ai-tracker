import * as React from "react";

import { ASSESSMENT_STATUS_LABEL, type AssessmentStatus } from "@/lib/scene2/assessment";
import { cn } from "@/lib/ui/cn";

/**
 * Assessment status, as shape plus word. Deliberately colourless: "Not assessed" is
 * not green and not grey-as-safe, and "Assessed" says nothing about severity — the
 * findings do that.
 *
 *   not assessed  ○  open ring
 *   analysing     ◔  ring with a quarter arc (static under reduced motion)
 *   assessed      ●  filled disc
 */
export function AssessmentChip({
  status,
  className,
}: {
  readonly status: AssessmentStatus;
  readonly className?: string;
}): React.ReactElement {
  return (
    <span
      data-assessment-status={status}
      className={cn("inline-flex items-center gap-1.5 text-caption font-medium text-label-primary", className)}
    >
      <svg aria-hidden="true" width="12" height="12" viewBox="0 0 12 12" fill="none">
        {status === "available" ? (
          <circle cx="6" cy="6" r="4.5" fill="currentColor" />
        ) : (
          <circle cx="6" cy="6" r="4.25" stroke="currentColor" strokeOpacity={0.55} strokeWidth="1.5" />
        )}
        {status === "analysing" ? (
          <path
            d="M6 1.75A4.25 4.25 0 0 1 10.25 6"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            className="origin-center motion-safe:animate-spin"
          />
        ) : null}
      </svg>
      {ASSESSMENT_STATUS_LABEL[status]}
    </span>
  );
}
