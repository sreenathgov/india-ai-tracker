"use client";

import * as React from "react";
import { useRegulatoryCase } from "@/components/regulatory/RegulatoryProvider";
import { useGuidedDemo } from "@/components/guided";
import { withRegulatoryActions } from "@/lib/regulatory/workbench";
import { MATERIAL_CASE, materialConditionClosed } from "@/lib/scene2/investigation/inquiry";
import { useSupplierInquiry } from "@/components/scene2/investigation/overview/SupplierInquiryProvider";
import { REGULATORY_CASE } from "@/lib/regulatory/state";

import { Surface } from "@/components/bento/Surface";
import { Icon } from "@/components/ui/Icon";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import {
  bandCounts,
  resultHeading,
  supplierRecords,
  visibleSuppliers,
  type WorkbenchState,
} from "@/lib/scene2/supplierView";
import { InvestigationWorkspace } from "@/components/scene2/investigation/InvestigationWorkspace";
import styles from "./SupplierWorkbench.module.css";
import { SupplierCard } from "./SupplierCard";
import { SupplierTable } from "./SupplierTable";
import type { Workbench } from "./useWorkbenchState";
import { WorkbenchFilters } from "./WorkbenchFilters";

/**
 * The order's direct suppliers, as assessment results.
 *
 * One dataset: `supplierRecords` → `visibleSuppliers`. Cards and List render the
 * same array, so the filter, the Needs action toggle, the sort and the selection
 * hold across both. Filtering narrows the results and the heading; it never
 * touches the bands or the counts, which are the assessment's.
 *
 * Neutral until the order is assessed: no filters, no marks, snapshot order.
 */
export function SupplierWorkbench({
  commitmentId,
  showBands,
  workbench,
  className,
  onOpenComponent,
}: {
  readonly onOpenComponent?: (componentId: string) => void;
  readonly commitmentId: string;
  /** True only when an assessment with detail is available. */
  readonly showBands: boolean;
  readonly workbench: Workbench;
  readonly className?: string;
}): React.ReactElement {
  const { state, update } = workbench;
  const regulatory = useRegulatoryCase();
  const guide = useGuidedDemo();
  const material = useSupplierInquiry();
  const records = React.useMemo(() => commitmentId === "c1" ? withRegulatoryActions(supplierRecords(commitmentId, showBands), regulatory.state) : supplierRecords(commitmentId, showBands), [commitmentId, showBands, regulatory.state]);
  const projectedRecords = React.useMemo(() => records.map(record => commitmentId === MATERIAL_CASE.orderId && record.supplier.id === MATERIAL_CASE.supplierId && materialConditionClosed(material.state) ? { ...record, action: null } : record), [records, commitmentId, material.state]);
  const counts = React.useMemo(() => bandCounts(projectedRecords), [projectedRecords]);
  /* Before an assessment there is nothing to filter by, so a filter left over from
     an earlier session is not applied to an unbanded list. */
  const effective = React.useMemo<WorkbenchState>(
    () => (showBands ? state : { ...state, band: "all", needsAction: false }),
    [showBands, state]
  );
  const shown = React.useMemo(() => visibleSuppliers(projectedRecords, effective), [projectedRecords, effective]);
  const heading = resultHeading(effective, shown.length, records.length);
  const openId = state.investigation?.supplierId ?? null;
  const open = (id: string): void => {
    if (guide?.phase === "tour" && id !== REGULATORY_CASE.supplierId && id !== MATERIAL_CASE.supplierId) return;
    update({ investigation: { supplierId: id, tab: "overview" } });
  };
  const clear = (): void => update({ band: "all", needsAction: false });

  return (
    <Tabs value={state.view} onValueChange={(v) => update({ view: v as WorkbenchState["view"] })} className={`${styles.workbench} ${className ?? ""}`}>
      <Surface
        surfaceId="suppliers"
        weight="primary"
        title={<span data-workbench-heading>{heading.title}</span>}
        eyebrow={
          heading.scope ??
          (showBands
            ? undefined
            : "Planned Tier-1 suppliers from the snapshot · not assessed")
        }
        actions={
          <TabsList aria-label="Supplier view">
            <TabsTrigger value="cards">Cards</TabsTrigger>
            <TabsTrigger value="list">List</TabsTrigger>
          </TabsList>
        }
      >
        {showBands ? (
          <div className="mb-4">
            <WorkbenchFilters counts={counts} state={state} onChange={update} />
          </div>
        ) : null}

        {shown.length === 0 ? (
          <EmptyResults onClear={clear} />
        ) : (
          <>
            <TabsContent value="cards">
              <ul className={styles.cards} data-supplier-records="cards">
                {shown.map((record) => (
                  <SupplierCard
                    key={record.supplier.id}
                    record={record}
                    commitmentId={commitmentId}
                    open={record.supplier.id === openId}
                    onOpen={() => open(record.supplier.id)}
                  />
                ))}
              </ul>
            </TabsContent>
            <TabsContent value="list">
              <SupplierTable commitmentId={commitmentId} records={shown} assessed={showBands} openId={openId} onOpen={open} />
            </TabsContent>
          </>
        )}
      </Surface>

      <InvestigationWorkspace
        commitmentId={commitmentId}
        onOpenComponent={onOpenComponent}
        supplierId={openId}
        tab={state.investigation?.tab ?? "overview"}
        assessed={showBands}
        onTabChange={(tab) => openId && update({ investigation: { supplierId: openId, tab } })}
        onClose={() => update({ investigation: null })}
      />
    </Tabs>
  );
}

function EmptyResults({ onClear }: { readonly onClear: () => void }): React.ReactElement {
  return (
    <div className="flex flex-col items-start gap-2 rounded-card bg-inset px-4 py-5 text-caption text-label-tertiary">
      <p>No supplier on this order matches both filters.</p>
      <button
        type="button"
        onClick={onClear}
        className="inline-flex items-center gap-1.5 rounded-full bg-quiet px-2.5 py-1 text-label-secondary hover:bg-quiet-hover hover:text-label-primary"
      >
        <Icon name="close" className="h-3 w-3" />
        Show all suppliers
      </button>
    </div>
  );
}
