"use client";

import * as React from "react";

import { fitFrame, frameOn, panBy, zoomAt } from "@/lib/scene2/supplychain/frame";
import type { Frame } from "@/lib/scene2/supplychain/frame";
import { highlightFor } from "@/lib/scene2/supplychain/highlight";
import { layoutGraph } from "@/lib/scene2/supplychain/layout";
import { tierClusters } from "@/lib/scene2/supplychain/tierClusters";
import type { VisibleGraph } from "@/lib/scene2/supplychain/view";
import { GraphEdges } from "./GraphEdges";
import { GraphNodeCard } from "./GraphNodeCard";

/**
 * The canvas: the laid-out network, and the reader's position over it.
 *
 * It refits whenever the visible set changes, so switching from the critical path
 * to the whole mapped network never leaves the reader looking at empty space where
 * the order used to be. Dragging pans, the wheel zooms about the pointer, and the
 * zoom never passes 1 — a card drawn larger than designed loses its type scale.
 */
export function GraphCanvas({
  graph,
  selectedId,
  onSelect,
}: {
  readonly graph: VisibleGraph;
  readonly selectedId: string | null;
  readonly onSelect: (id: string | null) => void;
}): React.ReactElement {
  const layout = React.useMemo(() => layoutGraph(graph), [graph]);
  const clusters = React.useMemo(() => tierClusters(graph, layout), [graph, layout]);
  const shellRef = React.useRef<HTMLDivElement>(null);
  const [frame, setFrame] = React.useState<Frame>({ scale: 1, x: 0, y: 0 });
  const [hoveredId, setHoveredId] = React.useState<string | null>(null);

  const viewport = React.useCallback(() => {
    const rect = shellRef.current?.getBoundingClientRect();
    return { width: rect?.width ?? 0, height: rect?.height ?? 0 };
  }, []);

  const fit = React.useCallback(() => setFrame(fitFrame(layout, viewport())), [layout, viewport]);

  /* Refit on a new visible set, and again whenever the workspace is resized. */
  React.useLayoutEffect(fit, [fit]);
  React.useEffect(() => {
    if (typeof ResizeObserver === "undefined" || !shellRef.current) return;
    const observer = new ResizeObserver(fit);
    observer.observe(shellRef.current);
    return () => observer.disconnect();
  }, [fit]);

  /* Keep a selected card on screen when the view around it changes underneath. */
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

  /* A click that was not a drag, on the canvas itself, clears the selection. */
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
  const highlight = React.useMemo(() => highlightFor(graph, held), [graph, held]);
  const active = held !== null;

  return (
    <div
      ref={shellRef}
      data-graph-canvas
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
        <GraphEdges graph={graph} layout={layout} highlighted={highlight.edgeIds} active={active} />
        {clusters.map((cluster) => (
          <span
            key={cluster.tier}
            className="micro-label pointer-events-none absolute text-label-quaternary"
            style={{ left: cluster.x, top: cluster.y - 13 }}
          >
            {cluster.label}
          </span>
        ))}
        {[...layout.fans.entries()].map(([parentId, fan]) => {
          const count = fan.lanes.size;
          const x = Math.min(...fan.laneX);
          return (
            <span
              key={parentId}
              className="micro-label pointer-events-none absolute whitespace-nowrap text-label-quaternary"
              style={{ left: x, top: fan.railY - 13, opacity: 0.7 }}
            >
              {count} more mapped
            </span>
          );
        })}
        {graph.nodes.map((node) => {
          const box = layout.boxes.get(node.id);
          if (!box) return null;
          return (
            <GraphNodeCard
              key={node.id}
              node={node}
              box={box}
              selected={selectedId === node.id}
              dimmed={active && !highlight.nodeIds.has(node.id)}
              onSelect={onSelect}
              onHover={setHoveredId}
            />
          );
        })}
      </div>
      <CanvasControls scale={frame.scale} onFit={fit} onZoom={(factor) => {
        const { width, height } = viewport();
        setFrame((current) => zoomAt(current, factor, width / 2, height / 2));
      }} />
    </div>
  );
}

/** Zoom, kept to the corner: the graph is the subject, not its instrumentation. */
function CanvasControls({
  scale,
  onZoom,
  onFit,
}: {
  readonly scale: number;
  readonly onZoom: (factor: number) => void;
  readonly onFit: () => void;
}): React.ReactElement {
  return (
    <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-pill border border-card-edge bg-card px-1 py-1 shadow-rest">
      <Key label="Zoom out" onClick={() => onZoom(1 / 1.2)}>
        −
      </Key>
      <button
        type="button"
        onClick={onFit}
        className="rounded-pill px-2 py-1 text-caption tabular-nums text-label-tertiary transition-colors hover:bg-hover hover:text-label-secondary"
      >
        {Math.round(scale * 100)}%
      </button>
      <Key label="Zoom in" onClick={() => onZoom(1.2)}>
        +
      </Key>
    </div>
  );
}

function Key({
  label,
  onClick,
  children,
}: {
  readonly label: string;
  readonly onClick: () => void;
  readonly children: React.ReactNode;
}): React.ReactElement {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex h-6 w-6 items-center justify-center rounded-pill text-body-s leading-none text-label-tertiary transition-colors hover:bg-hover hover:text-label-primary"
    >
      {children}
    </button>
  );
}
