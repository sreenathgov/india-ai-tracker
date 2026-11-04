import * as React from "react";

import { RN_DIMMED_OPACITY, RN_MATERIALITY_RULE_WIDTH, RN_TYPE_LABEL } from "@/lib/scene2/investigation/reasoning";
import { RN_BORDER_STYLE } from "@/lib/scene2/investigation/reasoning";
import type { ReasoningNode } from "@/lib/scene2/investigation/reasoning";
import type { NodeBox } from "@/lib/scene2/supplychain/layout";
import { cn } from "@/lib/ui/cn";

/** `materialityWeight` (0/1/2) indexes straight into this, matching `RN_MATERIALITY_WEIGHT`'s own order. */
const RULE_WIDTH_BY_WEIGHT: readonly number[] = [
  RN_MATERIALITY_RULE_WIDTH.controlling,
  RN_MATERIALITY_RULE_WIDTH.contributing,
  RN_MATERIALITY_RULE_WIDTH.contextual,
];
const RULE_OPACITY_BY_WEIGHT: readonly number[] = [0.9, 0.55, 0.32];

/**
 * A claim, dependency or action, drawn as marginalia rather than as a physical
 * object.
 *
 * This is deliberately a different visual language from `GraphNodeCard`: no wash
 * background, no tier hierarchy. Two axes carry the meaning instead — the card's
 * own border says whether Drona observed this or reasoned to it (solid vs.
 * dashed), and a left-edge rule says how hard the claim presses on the finding
 * (materiality, thicker and darker for controlling). An action node borrows the
 * same border axis for its posture: verificatory reads dashed, like an inference
 * it still is; interventionary reads solid, a step that changes the world.
 */
export function ReasoningNodeCard({
  node,
  box,
  selected,
  dimmed,
  onSelect,
  onHover,
}: {
  readonly node: ReasoningNode;
  readonly box: NodeBox;
  readonly selected: boolean;
  readonly dimmed: boolean;
  readonly onSelect: (id: string) => void;
  readonly onHover: (id: string | null) => void;
}): React.ReactElement {
  const borderStyle =
    node.kind === "action" ? (node.posture === "interventionary" ? "solid" : "dashed") : RN_BORDER_STYLE[node.kind];
  const ruleWidth = node.materialityWeight !== undefined ? RULE_WIDTH_BY_WEIGHT[node.materialityWeight] : null;
  const ruleOpacity = node.materialityWeight !== undefined ? RULE_OPACITY_BY_WEIGHT[node.materialityWeight] : 0;
  const isClaim = node.kind !== "dependency" && node.kind !== "action";

  return (
    <button
      type="button"
      data-reasoning-node={node.id}
      data-node-kind={node.kind}
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
        opacity: dimmed ? RN_DIMMED_OPACITY : 1,
        borderStyle,
        borderColor: "var(--border-card)",
        transition:
          "opacity 180ms var(--ease-calm), box-shadow 180ms var(--ease-calm), transform 180ms var(--ease-calm)",
      }}
      className={cn(
        "absolute flex flex-col justify-center overflow-hidden rounded-chip border bg-card pl-4 pr-3 text-left outline-none",
        "focus-visible:ring-2 focus-visible:ring-action",
        "shadow-card hover:shadow-hover",
        selected && "-translate-y-px shadow-hover"
      )}
    >
      {selected ? <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-selected" /> : null}
      {ruleWidth ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-0 top-0 h-full"
          style={{ width: ruleWidth, background: "var(--label-tertiary)", opacity: ruleOpacity }}
        />
      ) : null}

      <div className="relative flex min-w-0 items-baseline gap-1.5">
        <span className="micro-label truncate text-label-quaternary">{RN_TYPE_LABEL[node.kind]}</span>
        {isClaim && node.evidenceCount ? (
          <span className="micro-label shrink-0 text-label-quaternary" style={{ opacity: 0.8 }}>
            {node.evidenceCount} evidence
          </span>
        ) : null}
      </div>

      <p className="relative mt-0.5 shrink-0 line-clamp-2 text-body-s font-medium leading-[1.25] text-label-primary">
        {node.label}
      </p>
      {node.date ? <p className="relative mt-1 text-[11px] text-label-tertiary">As of {node.date}</p> : null}
      {node.detail ? (
        <p className="relative mt-0.5 shrink-0 line-clamp-2 text-caption leading-[1.3] text-label-tertiary">
          {node.detail}
        </p>
      ) : null}
    </button>
  );
}
