"use client";

import * as React from "react";

import { layoutReasoningGraph } from "@/lib/scene2/investigation/reasoning";
import type { ReasoningGraph } from "@/lib/scene2/investigation/reasoning";
import { clampScale, fitFrame, frameOn, panBy, PAD, zoomAt } from "@/lib/scene2/supplychain/frame";
import type { Frame, Viewport } from "@/lib/scene2/supplychain/frame";
import type { NodeBox } from "@/lib/scene2/supplychain/layout";
import { STAGE_LABEL } from "../labels";
import { ReasoningGraphEdges } from "./ReasoningGraphEdges";
import { ReasoningNodeCard } from "./ReasoningNodeCard";

const COLUMN_LABEL: Readonly<Record<string, string>> = {
  ...STAGE_LABEL,
  unstaged: "Unstaged",
  dependencies: "Dependencies",
  actions: "Actions",
};

/** Fits the viewport to a subset of boxes rather than the whole graph — a mode that narrows to a claim set frames just that set. */
function fitToBounds(boxes: ReadonlyMap<string, NodeBox>, ids: ReadonlySet<string>, viewport: Viewport): Frame | null {
  const selected = [...ids].map((id) => boxes.get(id)).filter((b): b is NodeBox => Boolean(b));
  if (selected.length === 0 || viewport.width <= 0 || viewport.height <= 0) return null;
  const minX = Math.min(...selected.map((b) => b.x));
  const minY = Math.min(...selected.map((b) => b.y));
  const maxX = Math.max(...selected.map((b) => b.x + b.width));
  const maxY = Math.max(...selected.map((b) => b.y + b.height));
  const width = Math.max(1, maxX - minX);
  const height = Math.max(1, maxY - minY);
  const scale = clampScale(Math.min((viewport.width - PAD * 2) / width, (viewport.height - PAD * 2) / height));
  return {
    scale,
    x: (viewport.width - width * scale) / 2 - minX * scale,
    y: (viewport.height - height * scale) / 2 - minY * scale,
  };
}

/**
 * The reasoning graph's own canvas: claims laid out by fracture stage, with the
 * dependencies and actions they point to trailing as their own columns.
 *
 * Pan/zoom reuse `supplychain/frame.ts` unmodified — `layoutReasoningGraph` returns a
 * `GraphLayout`-shaped object on purpose. When `emphasize` narrows to a claim set
 * (Decision path, Challenges), the canvas dims everything outside it and fits to that
 * subset instead of the whole graph.
 */
export function ReasoningGraphCanvas({
  graph,
  selectedId,
  onSelect,
  emphasize,
  columnLabels,
}: {
  readonly columnLabels?: Readonly<Record<string, string>>;
  readonly graph: ReasoningGraph;
  readonly selectedId: string | null;
  readonly onSelect: (id: string | null) => void;
  readonly emphasize: ReadonlySet<string> | null;
}): React.ReactElement {
  const layout = React.useMemo(() => layoutReasoningGraph(graph), [graph]);
  const shellRef = React.useRef<HTMLDivElement>(null);
  const [frame, setFrame] = React.useState<Frame>({ scale: 1, x: 0, y: 0 });
  const [hoveredId, setHoveredId] = React.useState<string | null>(null);

  const viewport = React.useCallback((): Viewport => {
    const rect = shellRef.current?.getBoundingClientRect();
    return { width: rect?.width ?? 0, height: rect?.height ?? 0 };
  }, []);

  const fit = React.useCallback(() => {
    const vp = viewport();
    const bounded = emphasize && emphasize.size > 0 ? fitToBounds(layout.boxes, emphasize, vp) : null;
    setFrame(bounded ?? fitFrame(layout, vp));
  }, [layout, viewport, emphasize]);

  React.useLayoutEffect(fit, [fit]);
  React.useEffect(() => {
    if (typeof ResizeObserver === "undefined" || !shellRef.current) return;
    const observer = new ResizeObserver(fit);
    observer.observe(shellRef.current);
    return () => observer.disconnect();
  }, [fit]);

  React.useEffect(() => {
    if (!selectedId) return;
    const box = layout.boxes.get(selectedId);
    if (box) setFrame((current) => frameOn(current, box, viewport()));
  }, [selectedId, layout, viewport]);

  const drag = React.useRef<{ x: number; y: number } | null>(null);
  const moved = React.useRef(false);

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>): void => {
    if (event.button !== 0) return;
    drag.current = { x: event.clientX, y: event.clientY };
    moved.current = false;
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>): void => {
    const start = drag.current;
    if (!start) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (!moved.current && Math.abs(dx) + Math.abs(dy) < 3) return;
    moved.current = true;
    drag.current = { x: event.clientX, y: event.clientY };
    setFrame((current) => panBy(current, dx, dy));
  };

  const endDrag = (): void => {
    drag.current = null;
  };

  const onClick = (event: React.MouseEvent<HTMLDivElement>): void => {
    if (moved.current || event.target !== event.currentTarget) return;
    onSelect(null);
  };

  const onWheel = (event: React.WheelEvent<HTMLDivElement>): void => {
    const rect = shellRef.current?.getBoundingClientRect();
    if (!rect) return;
    const factor = Math.exp(-event.deltaY * 0.0015);
    setFrame((current) => zoomAt(current, factor, event.clientX - rect.left, event.clientY - rect.top));
  };

  const held = hoveredId ?? selectedId;
  const active = held !== null;
  const touching = React.useMemo(() => {
    if (!held) return { nodeIds: new Set<string>(), edgeIds: new Set<string>() };
    const nodeIds = new Set<string>([held]);
    const edgeIds = new Set<string>();
    for (const edge of graph.edges) {
      if (edge.fromId === held || edge.toId === held) {
        edgeIds.add(edge.id);
        nodeIds.add(edge.fromId);
        nodeIds.add(edge.toId);
      }
    }
    return { nodeIds, edgeIds };
  }, [graph, held]);

  return (
    <div
      ref={shellRef}
      data-reasoning-canvas
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerLeave={endDrag}
      onWheel={onWheel}
      className="relative h-full w-full cursor-grab overflow-hidden rounded-card border border-separator bg-sheet-sunk active:cursor-grabbing"
    >
      <div
        onClick={onClick}
        style={{
          transform: `translate(${frame.x}px, ${frame.y}px) scale(${frame.scale})`,
          transformOrigin: "0 0",
          width: layout.width,
          height: layout.height,
        }}
        className="absolute left-0 top-0"
      >
        <ReasoningGraphEdges graph={graph} layout={layout} highlighted={touching.edgeIds} active={active} />
        {layout.columns.map((column) => (
          <span
            key={column.stage}
            className="micro-label pointer-events-none absolute text-label-quaternary"
            style={{ left: column.x, top: graph.compact ? 8 : 20 }}
          >
            {columnLabels?.[column.stage] ?? COLUMN_LABEL[column.stage] ?? column.stage}
          </span>
        ))}
        {graph.nodes.map((node) => {
          const box = layout.boxes.get(node.id);
          if (!box) return null;
          const outOfEmphasis = Boolean(emphasize) && emphasize!.size > 0 && !emphasize!.has(node.id);
          const dimmed = outOfEmphasis || (active && !touching.nodeIds.has(node.id));
          return (
            <ReasoningNodeCard
              key={node.id}
              node={node}
              box={box}
              selected={selectedId === node.id}
              dimmed={dimmed}
              onSelect={onSelect}
              onHover={setHoveredId}
            />
          );
        })}
      </div>
      <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-chip border border-separator bg-card px-1 shadow-card" role="group" aria-label="Reasoning graph view">
        <button type="button" aria-label="Zoom out reasoning graph" className="h-9 w-9 text-[16px]" onClick={() => setFrame(current => zoomAt(current, 0.85, viewport().width / 2, viewport().height / 2))}>−</button>
        <button type="button" className="h-9 px-2 text-[12px] text-label-secondary" onClick={fit} aria-label="Fit reasoning graph">{Math.round(frame.scale * 100)}%</button>
        <button type="button" aria-label="Zoom in reasoning graph" className="h-9 w-9 text-[16px]" onClick={() => setFrame(current => zoomAt(current, 1.18, viewport().width / 2, viewport().height / 2))}>+</button>
      </div>
    </div>
  );
}
