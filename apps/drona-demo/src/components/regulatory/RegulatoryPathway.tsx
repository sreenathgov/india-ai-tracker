"use client";
import * as React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { OverviewPanel } from "@/components/scene2/investigation/overview/OverviewPanel";
import { SupplyChainPanel } from "@/components/scene2/investigation/supplychain/SupplyChainPanel";
import { EvidencePanel } from "@/components/scene2/investigation/evidence/EvidencePanel";
import { investigationHeader } from "@/lib/scene2/investigation";
import { REGULATORY_CASE } from "@/lib/regulatory/state";
import { useRegulatoryCase } from "./RegulatoryProvider";

/** Scene 3 uses the same evidence projection as the supplier workspace. */
export function RegulatoryPathway({ onBack }: { readonly onBack: () => void }): React.ReactElement {
  const { inv } = useRegulatoryCase();
  const [tab, setTab] = React.useState("overview");
  const [focus, setFocus] = React.useState<{ tab: string; id: string } | null>(null);
  const facts = investigationHeader(REGULATORY_CASE.orderId, REGULATORY_CASE.supplierId, true, inv)!;
  const crossLink = (next: string, id: string): void => { setFocus({ tab: next, id }); setTab(next); };
  const clear = React.useCallback(() => setFocus(null), []);
  return <div className="flex h-full min-h-0 flex-col">
    <header className="shrink-0 border-b border-separator bg-surface px-7 py-4">
      <button type="button" onClick={onBack} className="text-caption text-label-tertiary hover:text-label-primary">← Production commitment</button>
      <p className="mt-3 micro-label text-label-quaternary">Tower Section Set · Tiruchi Tower Sections</p>
      <h1 className="mt-2 font-display text-title-m text-label-primary">The import route behind 28 turbines.</h1>
      <p className="mt-2 text-caption text-label-tertiary">PO-2026-0417 · India → Denmark · {inv.status.label} · assessment {inv.regulatory?.assessmentVersion}</p>
    </header>
    <Tabs value={tab} onValueChange={setTab} className="flex min-h-0 flex-1 flex-col">
      <TabsList aria-label="Regulatory component pathway" className="mx-5 mt-3 flex shrink-0 flex-wrap self-start">
        <TabsTrigger value="overview">Overview</TabsTrigger><TabsTrigger value="supply-chain">Supply chain</TabsTrigger><TabsTrigger value="evidence">Evidence &amp; reasoning</TabsTrigger>
      </TabsList>
      <div className={tab === "overview" ? "min-h-0 flex-1 overflow-y-auto px-7 py-5 max-[600px]:px-5" : "flex min-h-0 flex-1 flex-col overflow-hidden px-5 py-4"}>
        <TabsContent value="overview"><OverviewPanel facts={facts} inv={inv} assessed /></TabsContent>
        <TabsContent value="supply-chain" className="flex min-h-0 flex-1 flex-col data-[state=inactive]:hidden"><SupplyChainPanel orderId="c1" supplierId={REGULATORY_CASE.supplierId} focusNodeId={focus?.tab === "supply-chain" ? focus.id : null} onFocusHandled={clear} onShowInEvidence={(id) => crossLink("evidence", id)} /></TabsContent>
        <TabsContent value="evidence" className="flex min-h-0 flex-1 flex-col data-[state=inactive]:hidden"><EvidencePanel inv={inv} orderId="c1" supplierId={REGULATORY_CASE.supplierId} focusClaimId={focus?.tab === "evidence" ? focus.id : null} onFocusHandled={clear} onShowInSupplyChain={(id) => crossLink("supply-chain", id)} /></TabsContent>
      </div>
    </Tabs>
  </div>;
}
