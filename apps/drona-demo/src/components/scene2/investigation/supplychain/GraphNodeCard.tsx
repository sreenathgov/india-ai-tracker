import * as React from "react";

import {
  CONCERN_SURFACE,
  DIMMED_OPACITY,
  EVIDENCE_BORDER_STYLE,
  EVIDENCE_NEEDS_TAG,
} from "@/lib/scene2/supplychain/marks";
import { EVIDENCE_LABEL, NODE_TYPE_LABEL, TIER_LABEL } from "@/lib/scene2/supplychain/labels";
import type { GraphNode } from "@/lib/scene2/supplychain/types";
import type { NodeBox } from "@/lib/scene2/supplychain/layout";
import { cn } from "@/lib/ui/cn";

/**
 * One object in the network, drawn as a card rather than a bubble.
 *
 * Hierarchy is carried by size, weight and space, not by a coloured rail: the
 * order is quiet context, the component a step firmer, the Tier-1 supplier the
 * largest and most spacious thing on the canvas, everything behind it smaller
 * again. A concern reads as a warm tint across the whole card and a firmer
 * edge — never a fill, never a stripe down the side. Knowledge state reads in
 * the border's own stroke: solid holds, dashed softens, dotted breaks — a
 * second, independent axis from concern, so a card can be exposed and
 * verified, or unresolved and merely elevated, without the two ever merging.
 *
 * The type label is always present. A reader must never have to infer from
 * styling alone whether they are looking at a company, a material or a place.
 */
export function GraphNodeCard({
  node,
  box,
  selected,
  dimmed,
  onSelect,
  onHover,
}: {
  readonly node: GraphNode;
  readonly box: NodeBox;
  readonly selected: boolean;
  readonly dimmed: boolean;
  readonly onSelect: (id: string) => void;
  readonly onHover: (id: string | null) => void;
}): React.ReactElement {
  const surface = CONCERN_SURFACE[node.concern];
  const borderStyle = EVIDENCE_BORDER_STYLE[node.evidence];
  const needsTag = EVIDENCE_NEEDS_TAG[node.evidence];
  /* The Tier-1 supplier is the subject of the tab; it reads first whatever its state. */
  const primary = node.type === "supplier" && (node.tier ?? 1) === 1;
  const quiet = node.type === "order";

  return (
    <button
      type="button"
      data-graph-node={node.id}
      data-concern={node.concern}
      data-evidence={node.evidence}
      aria-pressed={selected}
      onClick={() => onSelect(node.id)}
      onMouseEnter={() => onHover(node.id)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(node.id)}
      onBlur={() => onHover(null)}
      style={{
        left: box.x,
        top: box.y,
        width: box.width,
        height: box.height,
        opacity: dimmed ? DIMMED_OPACITY : 1,
        background: surface.wash ?? (quiet ? "transparent" : node.context ? "var(--bg-sheet-sunk)" : "var(--bg-card)"),
        borderColor: surface.edge ?? (primary ? "var(--border-card-strong)" : "var(--border-card)"),
        borderStyle: quiet ? "dashed" : borderStyle,
        transition:
          "opacity 180ms var(--ease-calm), box-shadow 180ms var(--ease-calm), background 180ms var(--ease-calm), border-color 180ms var(--ease-calm), transform 180ms var(--ease-calm)",
      }}
      className={cn(
        "absolute flex flex-col justify-center overflow-hidden rounded-chip border text-left outline-none",
        primary ? "px-4 py-3.5" : "px-3.5 pr-3",
        "focus-visible:ring-2 focus-visible:ring-action",
        "shadow-card hover:shadow-hover",
        primary && "shadow-rest",
        selected && "-translate-y-px shadow-hover"
      )}
    >
      {selected ? (
        <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-selected" />
      ) : null}

      <div className="relative flex min-w-0 items-baseline gap-1.5">
        <span className={cn("micro-label truncate text-label-quaternary", primary && "text-label-tertiary")}>
          {node.type === "supplier" && node.tier ? `${NODE_TYPE_LABEL.supplier} · ${TIER_LABEL[node.tier]}` : NODE_TYPE_LABEL[node.type]}
        </span>
        {needsTag ? (
          <span className="micro-label shrink-0 text-label-quaternary" style={{ opacity: 0.8 }}>
            {EVIDENCE_LABEL[node.evidence]}
          </span>
        ) : null}
      </div>

      {/* Names wrap rather than truncate: a clipped supplier name is not a name. */}
      <p
        className={cn(
          "relative shrink-0 line-clamp-2 leading-[1.25]",
          primary ? "mt-1 text-heading font-medium text-label-primary" : "mt-0.5 text-body-s font-medium text-label-primary",
          quiet && "text-body-s font-normal text-label-secondary"
        )}
      >
        {node.name}
      </p>

      {node.detail ? (
        <p className={cn("relative shrink-0 line-clamp-2 text-caption leading-[1.3] text-label-tertiary", primary && "mt-1")}>
          {node.detail}
        </p>
      ) : null}
      {node.place ? (
        <p className="relative mt-0.5 shrink-0 truncate text-caption leading-tight text-label-quaternary">{node.place}</p>
      ) : null}
    </button>
  );
}
