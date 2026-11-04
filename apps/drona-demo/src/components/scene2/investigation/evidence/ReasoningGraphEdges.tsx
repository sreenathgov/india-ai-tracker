import * as React from "react";

import { REASONING_EDGE_STROKE, RN_DIMMED_OPACITY } from "@/lib/scene2/investigation/reasoning";
import type { ReasoningGraph, ReasoningLayout } from "@/lib/scene2/investigation/reasoning";
import { edgePath } from "@/lib/scene2/supplychain/layout";

/** The reasoning graph's own edge layer: what a claim points at, and what it's contested with. */
export function ReasoningGraphEdges({
  graph,
  layout,
  highlighted,
  active,
}: {
  readonly graph: ReasoningGraph;
  readonly layout: ReasoningLayout;
  readonly highlighted: ReadonlySet<string>;
  readonly active: boolean;
}): React.ReactElement {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute left-0 top-0 overflow-visible"
      width={layout.width}
      height={layout.height}
    >
      {graph.edges.map((edge) => {
        const from = layout.boxes.get(edge.fromId);
        const to = layout.boxes.get(edge.toId);
        if (!from || !to) return null;
        const stroke = REASONING_EDGE_STROKE[edge.kind];
        const dimmed = active && !highlighted.has(edge.id);
        return (
          <path
            key={edge.id}
            d={edgePath(from, to)}
            fill="none"
            stroke={stroke.stroke}
            strokeWidth={stroke.width}
            strokeDasharray={stroke.dash}
            strokeLinecap="round"
            opacity={dimmed ? RN_DIMMED_OPACITY : 1}
            style={{ transition: "opacity 180ms var(--ease-calm)" }}
          />
        );
      })}
    </svg>
  );
}
