import * as React from "react";

import { LATERAL_RELATIONS } from "@/lib/scene2/supplychain/types";
import { DIMMED_OPACITY, edgeStroke } from "@/lib/scene2/supplychain/marks";
import { edgePath, fanPath } from "@/lib/scene2/supplychain/layout";
import type { GraphLayout } from "@/lib/scene2/supplychain/layout";
import type { VisibleGraph } from "@/lib/scene2/supplychain/view";

/**
 * The relationships, under the cards.
 *
 * A line's dash says how Drona holds the relationship; its colour says whether the
 * concern travels along it. A lateral tie — two processes competing for one bay —
 * drops below both cards instead of stepping right, so it can never be misread as
 * another tier of depth.
 */
export function GraphEdges({
  graph,
  layout,
  highlighted,
  active,
}: {
  readonly graph: VisibleGraph;
  readonly layout: GraphLayout;
  /** Edge ids the reader is holding. Empty means nothing is held and nothing dims. */
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
        const stroke = edgeStroke(edge.evidence, edge.concern);
        const dimmed = active && !highlighted.has(edge.id);
        /* A line into a packed fan joins that fan's bundle instead of crossing it. */
        const fan = layout.fans.get(edge.fromId);
        const lane = fan?.lanes.get(edge.toId);
        return (
          <path
            key={edge.id}
            d={
              lane === undefined || !fan
                ? edgePath(from, to, LATERAL_RELATIONS.has(edge.relation))
                : fanPath(from, to, fan, lane)
            }
            fill="none"
            stroke={stroke.stroke}
            strokeWidth={stroke.width}
            strokeDasharray={stroke.dash}
            strokeLinecap="round"
            opacity={dimmed ? stroke.opacity * DIMMED_OPACITY : stroke.opacity}
            style={{ transition: "opacity 180ms var(--ease-calm)" }}
          />
        );
      })}
    </svg>
  );
}
