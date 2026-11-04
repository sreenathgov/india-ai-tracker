"use client";

import * as React from "react";
import { useMaterialWalkthrough } from "@/components/guided/MaterialWalkthrough";
import { useRegulatoryCase } from "@/components/regulatory/RegulatoryProvider";
import { MATERIAL_CASE } from "@/lib/scene2/investigation/inquiry";
import { useSupplierInquiry } from "../overview/SupplierInquiryProvider";
import { REGULATORY_CASE } from "@/lib/regulatory/state";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import type { SupplierInvestigation } from "@/lib/scene2/investigation";
import {
  buildReasoningGraph,
  materialDecisionGraph,
  challengedClaimIds,
  claimNodeId,
  decisionPathClaimIds,
} from "@/lib/scene2/investigation/reasoning";
import { supplyChainGraphFor } from "@/lib/scene2/supplychain";
import { REGULATORY_STAGE_LABEL } from "../labels";
import { cn } from "@/lib/ui/cn";
import { ClaimInspector } from "./ClaimInspector";
import { EvidenceRegister } from "./EvidenceRegister";
import { ReasoningGraphCanvas } from "./ReasoningGraphCanvas";
import { ReasoningLegend } from "./ReasoningLegend";

type EvidenceView = "graph" | "register";
type ReasoningMode = "all" | "decision-path" | "challenges";

const MODE_LABEL: Readonly<Record<ReasoningMode, string>> = {
  "all": "All claims",
  "decision-path": "Decision path",
  challenges: "Challenges",
};

const CLAIM_PREFIX = "claim:";

/**
 * Evidence & Reasoning: the claim/evidence graph and its register, sitting next to
 * the physical supply-chain graph the same investigation already opens onto.
 *
 * Owns the graph/register toggle and the reasoning-mode filter, and is the seam
 * the two graphs cross-link through — a claim's "Show in supply chain" and a
 * supply-chain node's "View evidence & reasoning" both resolve here, since this
 * is the one place that holds both graphs at once.
 */
export function EvidencePanel({
  inv,
  orderId,
  supplierId,
  focusClaimId,
  onFocusHandled,
  onShowInSupplyChain,
}: {
  readonly inv: SupplierInvestigation;
  readonly orderId: string;
  readonly supplierId: string;
  /** A claim to open straight into, set by the supply-chain panel's cross-link. */
  readonly focusClaimId: string | null;
  readonly onFocusHandled: () => void;
  readonly onShowInSupplyChain: (nodeId: string) => void;
}): React.ReactElement {
  const tour = useMaterialWalkthrough();
  const [view, setView] = React.useState<EvidenceView>("graph");
  const [mode, setMode] = React.useState<ReasoningMode>(inv.material ? "decision-path" : "all");
  const [selectedNodeId, setSelectedNodeId] = React.useState<string | null>(null);
  const [selectedEvidenceId, setSelectedEvidenceId] = React.useState<string | null>(null);

  const fullGraph = React.useMemo(() => buildReasoningGraph(inv), [inv]);
  const graph = React.useMemo(() => inv.material && mode === "decision-path" ? materialDecisionGraph(inv, fullGraph) : fullGraph, [inv, mode, fullGraph]);
  const regulatory = useRegulatoryCase();
  const material = useSupplierInquiry();
  const legacyGraph = React.useMemo(() => supplyChainGraphFor(orderId, supplierId), [orderId, supplierId]);
  const supplyGraph = orderId === REGULATORY_CASE.orderId && supplierId === REGULATORY_CASE.supplierId ? regulatory.graph : orderId === MATERIAL_CASE.orderId && supplierId === MATERIAL_CASE.supplierId ? material.graph : legacyGraph;

  React.useEffect(() => {
    if (!tour?.enabled) return;
    if (tour.beat === "reasoning") { setView("graph"); setMode("decision-path"); setSelectedNodeId(null); }
    if (tour.beat === "evidence") { setView("graph"); setMode("decision-path"); setSelectedNodeId(claimNodeId("dc-receipt")); }
    if (tour.beat === "source") { setView("register"); setSelectedEvidenceId(tour.sourceId); }
  }, [tour?.enabled, tour?.beat, tour?.sourceId]);
  /* A new supplier is a new investigation: open it the way every other tab opens. */
  React.useEffect(() => {
    setView("graph");
    setMode(inv.material ? "decision-path" : "all");
    setSelectedNodeId(null);
    setSelectedEvidenceId(null);
  }, [orderId, supplierId]);

  React.useEffect(() => {
    if (!focusClaimId) return;
    setView("graph");
    setMode("all");
    setSelectedNodeId(claimNodeId(focusClaimId));
    onFocusHandled();
  }, [focusClaimId, onFocusHandled]);

  const emphasize = React.useMemo(() => {
    if (mode === "decision-path" && inv.material) return null;
    if (mode === "decision-path") return new Set(decisionPathClaimIds(inv).map(claimNodeId));
    if (mode === "challenges") return new Set(challengedClaimIds(inv).map(claimNodeId));
    return null;
  }, [mode, inv]);

  const selectedObject = selectedNodeId && !selectedNodeId.startsWith(CLAIM_PREFIX) ? graph.nodes.find(node => node.id === selectedNodeId) : null;
  const selectedClaimId = selectedNodeId?.startsWith(CLAIM_PREFIX) ? selectedNodeId.slice(CLAIM_PREFIX.length) : null;

  const selectNode = React.useCallback((id: string) => {
    setView("graph");
    setMode("all");
    setSelectedNodeId(id);
  }, []);

  const selectEvidence = React.useCallback((evidenceId: string) => {
    setView("register");
    setSelectedEvidenceId(evidenceId);
    tour?.sourceOpened(evidenceId);
  }, [tour]);

  const showInSupplyChain = React.useMemo(() => {
    if (!supplyGraph) return undefined;
    return (claimId: string): void => {
      const target = supplyGraph.nodes.find((node) => node.reasoningClaimIds.includes(claimId));
      if (target) onShowInSupplyChain(target.id);
    };
  }, [supplyGraph, onShowInSupplyChain]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3" data-evidence-panel={inv.id}>
      {inv.material ? <div className="flex shrink-0 items-start justify-between gap-6" data-material-reasoning-summary><div><h3 className="text-[15px] font-medium text-label-primary">From signal to an order-specific forecast.</h3><p className="mt-1 text-[13px] leading-relaxed text-label-secondary">Select a claim to inspect its sources, assumptions and what would change it. The evidence register contains the dated source extracts.</p></div><p className="shrink-0 text-[12px] text-label-tertiary">2 Nov 2026 · Assessment v{inv.material.assessmentVersion}</p></div> : null}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
        <Tabs value={view} onValueChange={(next) => setView(next as EvidenceView)}>
          <TabsList>
            <TabsTrigger value="graph">Graph</TabsTrigger>
            <TabsTrigger value="register">Evidence register</TabsTrigger>
          </TabsList>
        </Tabs>
        {view === "graph" ? <ModePills mode={mode} onChange={setMode} /> : null}
      </div>

      {view === "graph" ? (
        <div className="flex min-h-0 flex-1 flex-col gap-3">
          <div className="flex min-h-0 flex-1 gap-3">
            <div className="min-w-0 flex-1">
              <ReasoningGraphCanvas columnLabels={inv.regulatory ? REGULATORY_STAGE_LABEL : inv.material && mode === "decision-path" ? { condition: "External signal", dependency: "Order link + forecast", supplier: "Order consequence", actions: "Next useful action" } : undefined} graph={graph} selectedId={selectedNodeId} onSelect={setSelectedNodeId} emphasize={emphasize} />
            </div>
            {selectedObject ? <aside className="h-full w-[300px] shrink-0 overflow-y-auto rounded-card border border-separator bg-card p-5" data-reasoning-object><div className="flex items-baseline justify-between gap-3"><h4 className="text-[12px] text-label-tertiary">{selectedObject.kind === "action" ? "Proposed action" : "Dependency"}</h4><button type="button" className="min-h-9 text-[12px] underline" onClick={() => setSelectedNodeId(null)}>Close</button></div><h3 className="mt-3 text-[18px] leading-relaxed text-label-primary">{selectedObject.label}</h3><p className="mt-3 text-[14px] leading-relaxed text-label-secondary">{selectedObject.detail ?? inv.dependencies.find(dep => dep.id === selectedObject.dependencyId)?.label}</p><p className="mt-5 text-[12px] leading-relaxed text-label-tertiary">{selectedObject.kind === "action" ? "A proposed response; viewing it does not execute it." : "Select a connected claim to inspect the supporting source records."}</p></aside> : null}
            {selectedClaimId ? (
              <ClaimInspector
                inv={inv}
                claimId={selectedClaimId}
                onSelectNode={selectNode}
                onSelectEvidence={selectEvidence}
                onShowInSupplyChain={showInSupplyChain}
                onClose={() => setSelectedNodeId(null)}
              />
            ) : null}
          </div>
          <div className="shrink-0">
            <ReasoningLegend />
          </div>
        </div>
      ) : (
        <EvidenceRegister inv={inv} selectedId={selectedEvidenceId} onSelect={setSelectedEvidenceId} />
      )}
    </div>
  );
}

const MODES: readonly ReasoningMode[] = ["decision-path", "all", "challenges"];

function ModePills({
  mode,
  onChange,
}: {
  readonly mode: ReasoningMode;
  readonly onChange: (mode: ReasoningMode) => void;
}): React.ReactElement {
  return (
    <div className="inline-flex items-center gap-0.5 rounded-full bg-quiet p-[3px]" role="group" aria-label="Reasoning mode">
      {MODES.map((m) => (
        <button
          key={m}
          type="button"
          aria-pressed={mode === m}
          onClick={() => onChange(m)}
          className={cn(
            "inline-flex h-7 items-center justify-center rounded-full px-3 text-caption text-label-tertiary transition-[color,background-color,box-shadow] duration-hover ease-overlay",
            "hover:text-label-primary",
            mode === m && "bg-sheet font-medium text-label-primary shadow-lift"
          )}
        >
          {MODE_LABEL[m]}
        </button>
      ))}
    </div>
  );
}
