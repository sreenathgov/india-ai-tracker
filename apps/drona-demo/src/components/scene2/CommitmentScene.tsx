"use client";

import * as React from "react";

import { DronaCompact } from "./workspace/DronaCompact";
import { OrderHeader } from "./workspace/OrderHeader";
import { PlanningBrief } from "./workspace/PlanningBrief";
import { SupplierWorkbench } from "./workspace/SupplierWorkbench";
import type { Assessment } from "./workspace/useAssessment";
import type { Workbench } from "./workspace/useWorkbenchState";

/**
 * Scene 2: the order workspace.
 *
 * The map is not here. It stays mounted in `page.tsx` and sits in the upper row's
 * right cell of the same grid these children are placed in, which keeps the
 * single-route promise: opening an order is the same world coming into focus.
 *
 *   ┌ order header · status · the one analysis action ───────────────┐
 *   ├ planning brief (planned facts) ────────┬ map (page-owned) ─────┤
 *   ├ supplier workbench · Cards / List ─────────────┬ Drona ────────┤
 *
 * Opening an order never starts an analysis. The header's button is the only
 * trigger; the brief and the workbench are populated from the snapshot before any
 * assessment exists, and stay neutral until one does.
 *
 * The earlier production view (`SupplierRiskView`, `SubTierTable`,
 * `CriticalSupplierTiles`, `BandComponents`, `ProductionDrona`) is no longer mounted
 * here; it stays in the tree for the supplier panels in Phase 2.
 */
export function CommitmentScene({
  commitmentId,
  assessment,
  workbench,
  onBack,
  onOpenComponent,
}: {
  readonly commitmentId: string;
  /* Owned by the page, so stepping into Scene 3 and back neither replays nor loses
     an assessment. */
  readonly assessment: Assessment;
  /* Also page-owned: the workbench's view, filter, sort and selection survive Scene 3. */
  readonly workbench: Workbench;
  readonly onBack: () => void;
  readonly onOpenComponent: (componentId: string) => void;
}): React.ReactElement {
  const { status, last } = assessment;
  /* Bands only once an assessment with detail exists — including the previous one,
     kept on screen while an update runs. */
  const showBands = last !== null && last.hasDetail && (status === "available" || status === "analysing");

  return (
    <>
      <OrderHeader
        commitmentId={commitmentId}
        assessment={assessment}
        onBack={onBack}
        className="min-[1100px]:col-span-12 min-[1100px]:row-start-1"
      />
      <PlanningBrief
        commitmentId={commitmentId}
        assessed={showBands}
        className="min-[1100px]:col-span-7 min-[1100px]:col-start-1 min-[1100px]:row-start-2"
      />
      <SupplierWorkbench
        commitmentId={commitmentId}
        showBands={showBands}
        onOpenComponent={onOpenComponent}
        workbench={workbench}
        className="min-w-0 min-[1100px]:col-span-8 min-[1100px]:col-start-1 min-[1100px]:row-start-3 min-[1360px]:col-span-9"
      />
      <DronaCompact
        commitmentId={commitmentId}
        assessed={showBands}
        className="self-start min-[1100px]:col-span-4 min-[1100px]:col-start-9 min-[1100px]:row-start-3 min-[1360px]:col-span-3 min-[1360px]:col-start-10"
      />
    </>
  );
}
