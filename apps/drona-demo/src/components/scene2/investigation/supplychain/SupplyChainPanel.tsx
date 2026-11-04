"use client";

import * as React from "react";
import { useMaterialWalkthrough } from "@/components/guided/MaterialWalkthrough";
import { useRegulatoryCase } from "@/components/regulatory/RegulatoryProvider";
import { MATERIAL_CASE } from "@/lib/scene2/investigation/inquiry";
import { useSupplierInquiry } from "../overview/SupplierInquiryProvider";
import { REGULATORY_CASE } from "@/lib/regulatory/state";

import { supplyChainGraphFor } from "@/lib/scene2/supplychain";
import {
  applyView,
  DEFAULT_VIEW,
  setMode,
  setTier,
  toggleKind,
  withheldCount,
} from "@/lib/scene2/supplychain/view";
import type { GraphView, ObjectKind, ViewMode } from "@/lib/scene2/supplychain/view";
import type { SupplierTier } from "@/lib/scene2/supplychain/types";
import { MaterialCriticalPath } from "./MaterialCriticalPath";
import { GraphCanvas } from "./GraphCanvas";
import { GraphLegend } from "./GraphLegend";
import { NodeInspector } from "./NodeInspector";
import { ViewControls } from "./ViewControls";
import { useInspectorReadingPosition } from "../useInspectorReadingPosition";

/**
 * What this supplier depends on for this commitment, and where the concern travels.
 *
 * Not a supplier master graph and not the company's ontology: the order anchors it,
 * and only the dependencies that bear on this order are drawn. It opens on the
 * critical path, so the first thing a reader sees is the line the concern runs
 * along — everything wider is a deliberate second look.
 */
export function SupplyChainPanel({
  orderId,
  supplierId,
  focusNodeId,
  onFocusHandled,
  onShowInEvidence,
}: {
  readonly orderId: string;
  readonly supplierId: string;
  /** A node to select straight away, set by the evidence panel's cross-link. */
  readonly focusNodeId: string | null;
  readonly onFocusHandled: () => void;
  readonly onShowInEvidence: (claimId: string) => void;
}): React.ReactElement {
  const tour = useMaterialWalkthrough();
  const regulatory = useRegulatoryCase();
  const material = useSupplierInquiry();
  const legacyGraph = React.useMemo(() => supplyChainGraphFor(orderId, supplierId), [orderId, supplierId]);
  const graph = orderId === REGULATORY_CASE.orderId && supplierId === REGULATORY_CASE.supplierId ? regulatory.graph : orderId === MATERIAL_CASE.orderId && supplierId === MATERIAL_CASE.supplierId ? material.graph : legacyGraph;
  const [view, setView] = React.useState<GraphView>(DEFAULT_VIEW);
  React.useEffect(() => { if (tour?.enabled && (tour.beat === "path" || tour.beat === "network")) setView(current => setMode(current, tour.beat === "network" ? "mapped" : "critical")); }, [tour?.enabled, tour?.beat]);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const graphRow = React.useRef<HTMLDivElement>(null);
  useInspectorReadingPosition(graphRow, selectedId);

  /* A new supplier is a new investigation: open it the way every other one opens. */
  React.useEffect(() => {
    setView(DEFAULT_VIEW);
    setSelectedId(null);
  }, [orderId, supplierId]);

  React.useEffect(() => {
    if (!focusNodeId) return;
    setSelectedId(focusNodeId);
    onFocusHandled();
  }, [focusNodeId, onFocusHandled]);

  const visible = React.useMemo(() => (graph ? applyView(graph, view) : null), [graph, view]);
  const materialPath = orderId === MATERIAL_CASE.orderId && supplierId === MATERIAL_CASE.supplierId && view.mode === "critical" && view.tier === 3 && view.hidden.size === 0;
  const selected = (materialPath ? graph : visible)?.nodes.find((node) => node.id === selectedId) ?? null;

  /* A card can leave the canvas when the view narrows; the inspector follows it. */
  React.useEffect(() => {
    if (!materialPath && selectedId && visible && !visible.nodes.some((node) => node.id === selectedId)) setSelectedId(null);
  }, [selectedId, visible, materialPath]);

  if (!graph || !visible) {
    return (
      <p className="max-w-measure-tight pt-1 text-body-s leading-[1.55] text-label-tertiary" data-supply-chain="none">
        No dependency network is mapped for this supplier on this order.
      </p>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3" data-supply-chain={supplierId}>
      {orderId === MATERIAL_CASE.orderId && supplierId === MATERIAL_CASE.supplierId ? <div className="flex shrink-0 items-baseline justify-between gap-6" data-material-path-summary><div><h3 className="text-[15px] font-medium text-label-primary">Follow the material dependency.</h3><p className="mt-1 text-[13px] leading-relaxed text-label-secondary">Order → Deccan → dealer → billet producer → held shipment. Select any object to inspect its evidence.</p></div><span className="text-[12px] text-label-tertiary">{material.inv.material?.closed ? "Scoped cover evidenced" : "12 Nov need · 15–17 Nov forecast receipt"}</span></div> : null}
      {/* No breadcrumb: the workspace header already names the order, the component
          and the supplier, and the canvas needs the height more than the repetition. */}
      <div className="shrink-0">
        <ViewControls
          view={view}
          withheld={withheldCount(graph, view)}
          onMode={(mode: ViewMode) => setView((current) => setMode(current, mode))}
          onTier={(tier: SupplierTier) => setView((current) => setTier(current, tier))}
          onToggle={(kind: ObjectKind) => setView((current) => toggleKind(current, kind))}
        />
      </div>

      <div ref={graphRow} className="investigation-graph-row flex min-h-0 flex-1 gap-3">
        <div className="min-w-0 flex-1">
          {orderId === MATERIAL_CASE.orderId && supplierId === MATERIAL_CASE.supplierId && view.mode === "critical" && view.tier === 3 && view.hidden.size === 0 ? <MaterialCriticalPath graph={graph} selectedId={selectedId} onSelect={setSelectedId} /> : <GraphCanvas graph={visible} selectedId={selectedId} onSelect={setSelectedId} />}
        </div>
        {selected ? (
          <NodeInspector
            node={selected}
            graph={materialPath ? { nodes: graph.nodes, edges: graph.edges } : visible}
            onSelect={setSelectedId}
            onClose={() => setSelectedId(null)}
            onShowInEvidence={onShowInEvidence}
          />
        ) : null}
      </div>

      <div className="shrink-0">
        <GraphLegend />
      </div>
    </div>
  );
}
