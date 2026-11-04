"use client";

import * as React from "react";
import { RegulatoryPathway } from "@/components/regulatory/RegulatoryPathway";
import { REGULATORY_CASE } from "@/lib/regulatory/state";

import { contributingConditions, productionPathway, weakLink } from "@/lib/network/pathway";
import type { DependencyChain } from "@/lib/network/dependencies";
import { ComponentHeader } from "./ComponentHeader";
import { ExposureDrona } from "./ExposureDrona";
import { ProductionPathway } from "./ProductionPathway";
import { ProvenanceDrawer } from "./ProvenanceDrawer";
import { WeakLink } from "./WeakLink";

/**
 * Scene 3 — everything beneath the map once one exposure is open.
 *
 * **Why the map is still on top, when the sketch draws it as the left third.**
 * The sketch's three vertical zones describe a *reading order* — dependency, then
 * anatomy, then Drona — and that order is honoured here. What is not honoured is the
 * literal geometry, for one structural reason: this demo mounts the map exactly once,
 * in `page.tsx`, and every scene change is a re-frame rather than a new screen. Moving
 * it into a column at Scene 3 would unmount and remount it, and the continuity that
 * would destroy is the thing the sketch itself asks for most insistently — "the map
 * remains". A band that narrows to a five-node chain keeps that promise; a column that
 * appears out of nothing breaks it while looking more like the drawing.
 *
 * So the working surface below splits two ways. The causal anatomy takes two thirds:
 * it is the analytical heart, and the argument it carries —
 * **dependency → mechanism → transmission → production consequence** — has to be read
 * top to bottom without a scrollbar interrupting it mid-sentence. Drona takes the
 * remaining third, present throughout, never a drawer that has to be summoned.
 */
export function PathwayScene({
  chain,
  onBack,
  onSwitch,
}: {
  readonly chain: DependencyChain;
  readonly onBack: () => void;
  readonly onSwitch: (componentId: string) => void;
}): React.ReactElement {
  const componentId = chain.component.id;

  const stages = React.useMemo(
    () => productionPathway(componentId),
    [componentId]
  );
  const link = React.useMemo(() => weakLink(componentId), [componentId]);
  const conditions = React.useMemo(
    () => contributingConditions(componentId),
    [componentId]
  );

  /* The provenance drawer belongs to the scene rather than to Drona's column, because
     it covers the working surface entirely — and it closes when the assembly changes,
     since evidence for one chain left open over another would be the worst single
     error this screen could make. */
  const [evidenceOpen, setEvidenceOpen] = React.useState(false);
  React.useEffect(() => setEvidenceOpen(false), [componentId]);

  const closeEvidence = React.useCallback(() => setEvidenceOpen(false), []);

  if (componentId === REGULATORY_CASE.componentId) return <RegulatoryPathway onBack={onBack} />;
  if (chain.supplier.id === "sup:kovai-castings-machining") return <div className="p-7"><button type="button" onClick={onBack} className="text-caption text-label-tertiary">← Production commitment</button><h1 className="mt-6 font-display text-title-m text-label-primary">Bearing Housing · supplied records only</h1><p className="mt-3 text-body-s text-label-tertiary">Component criticality remains planning context. Quality-disruption prediction and the earlier ultrasonic-defect investigation are outside this demo’s active scope.</p></div>;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <ComponentHeader chain={chain} onBack={onBack} onSwitch={onSwitch} />

      {/* Clamped the same way Scene 2's resolved state is, so moving between the two
          does not resize the map. The reviewer should feel the map narrow, not
          the panels shuffle. */}
      <div className="relative grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-3">
        <div className="min-h-0 overflow-y-auto bg-page px-8 py-7 lg:col-span-2">
          <div className="flex flex-col gap-9 xl:flex-row xl:gap-12">
            <div className="shrink-0 xl:w-[250px]">
              <ProductionPathway stages={stages} />
            </div>
            <div className="min-w-0 flex-1">
              {link ? <WeakLink link={link} conditions={conditions} /> : null}
            </div>
          </div>
        </div>

        <ExposureDrona
          componentId={componentId}
          evidenceOpen={evidenceOpen}
          onShowEvidence={() => setEvidenceOpen(true)}
          className="min-h-0"
        />

        {evidenceOpen ? (
          <ProvenanceDrawer componentId={componentId} onClose={closeEvidence} />
        ) : null}
      </div>
    </div>
  );
}
