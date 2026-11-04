import * as React from "react";

import { CONCERN_LABEL, EVIDENCE_LABEL } from "@/lib/scene2/supplychain/labels";
import { CONCERN_SURFACE, EVIDENCE_BORDER_STYLE } from "@/lib/scene2/supplychain/marks";
import type { ConcernState, EvidenceState } from "@/lib/scene2/supplychain/types";

const EVIDENCE: readonly EvidenceState[] = ["verified", "inferred", "unresolved"];
const CONCERN: readonly ConcernState[] = ["exposed", "unresolved", "mitigation"];

/**
 * The key, at the foot of the canvas.
 *
 * Two rows because there are two axes, and keeping them apart on screen is what
 * stops a reader collapsing them: a dashed edge means Drona reasoned the
 * relationship, not that the relationship is in trouble. Each mark matches the
 * grammar it explains — a line sample for the connector's stroke, a small
 * washed chip for the surface a concern tints — so the legend teaches the
 * canvas rather than adding a third vocabulary of its own.
 */
export function GraphLegend(): React.ReactElement {
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-1" data-graph-legend>
      <Row label="How Drona holds it">
        {EVIDENCE.map((state) => (
          <span key={state} className="inline-flex items-center gap-2 text-caption text-label-tertiary">
            <svg aria-hidden="true" width="18" height="8" viewBox="0 0 18 8" className="shrink-0">
              <line
                x1="1"
                y1="4"
                x2="17"
                y2="4"
                stroke="var(--label-tertiary)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeDasharray={
                  EVIDENCE_BORDER_STYLE[state] === "dashed" ? "4 3" : EVIDENCE_BORDER_STYLE[state] === "dotted" ? "1 3" : undefined
                }
              />
            </svg>
            {EVIDENCE_LABEL[state]}
          </span>
        ))}
      </Row>
      <Row label="Where the concern runs">
        {CONCERN.map((state) => (
          <span key={state} className="inline-flex items-center gap-2 text-caption text-label-tertiary">
            <span
              aria-hidden="true"
              className="inline-block h-[11px] w-[16px] shrink-0 rounded-[4px] border"
              style={{
                background: CONCERN_SURFACE[state].wash ?? "transparent",
                borderColor: CONCERN_SURFACE[state].edge ?? "var(--border-card)",
              }}
            />
            {CONCERN_LABEL[state]}
          </span>
        ))}
      </Row>
    </div>
  );
}

function Row({ label, children }: { readonly label: string; readonly children: React.ReactNode }): React.ReactElement {
  return (
    <div className="flex items-center gap-3">
      <span className="micro-label text-label-quaternary">{label}</span>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">{children}</div>
    </div>
  );
}
