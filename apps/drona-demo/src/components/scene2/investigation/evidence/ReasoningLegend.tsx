import * as React from "react";

import { RN_BORDER_STYLE, RN_TYPE_LABEL } from "@/lib/scene2/investigation/reasoning";
import type { ReasoningNodeKind } from "@/lib/scene2/investigation/reasoning";

const BASIS: readonly ReasoningNodeKind[] = ["observation", "inference", "forecast", "scenario"];

/**
 * The reasoning graph's key. One row for how Drona holds a claim — solid where it
 * observed, dashed everywhere it reasoned — and one row for what a claim points at.
 * Mirrors `GraphLegend`'s two-row shape so the two canvases teach the same way, in
 * this graph's own vocabulary rather than the supply-chain graph's.
 */
export function ReasoningLegend(): React.ReactElement {
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-1" data-reasoning-legend>
      <Row label="How Drona holds it">
        {BASIS.map((kind) => (
          <span key={kind} className="inline-flex items-center gap-2 text-caption text-label-tertiary">
            <svg aria-hidden="true" width="18" height="8" viewBox="0 0 18 8" className="shrink-0">
              <line
                x1="1"
                y1="4"
                x2="17"
                y2="4"
                stroke="var(--label-tertiary)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeDasharray={RN_BORDER_STYLE[kind] === "dashed" ? "4 3" : undefined}
              />
            </svg>
            {RN_TYPE_LABEL[kind]}
          </span>
        ))}
      </Row>
      <Row label="What it points at">
        <span className="inline-flex items-center gap-2 text-caption text-label-tertiary">
          <span aria-hidden="true" className="inline-block h-[11px] w-[16px] shrink-0 rounded-[4px] border border-separator" />
          {RN_TYPE_LABEL.dependency}
        </span>
        <span className="inline-flex items-center gap-2 text-caption text-label-tertiary">
          <span
            aria-hidden="true"
            className="inline-block h-[11px] w-[16px] shrink-0 rounded-[4px] border border-dashed border-separator"
          />
          {RN_TYPE_LABEL.action}
        </span>
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
