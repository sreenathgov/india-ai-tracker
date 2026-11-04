"use client";

import * as React from "react";

import { DEFAULT_WORKBENCH, type WorkbenchState } from "@/lib/scene2/supplierView";

export interface Workbench {
  readonly state: WorkbenchState;
  readonly update: (patch: Partial<WorkbenchState>) => void;
}

/**
 * The workbench's view, filter, sort and selection, one record per order.
 *
 * Held by the page rather than the scene: Scene 2 unmounts when an exposure opens
 * in Scene 3, and stepping back up should find the workbench exactly as it was
 * left. Each order keeps its own, so a filter on Wind Energy is not carried into
 * Highland. Updates replace the record; nothing is mutated.
 */
export function useWorkbenchState(commitmentId: string | null): Workbench {
  const [byOrder, setByOrder] = React.useState<Readonly<Record<string, WorkbenchState>>>({});

  const state = (commitmentId ? byOrder[commitmentId] : undefined) ?? DEFAULT_WORKBENCH;

  const update = React.useCallback(
    (patch: Partial<WorkbenchState>) => {
      if (!commitmentId) return;
      setByOrder((all) => ({
        ...all,
        [commitmentId]: { ...(all[commitmentId] ?? DEFAULT_WORKBENCH), ...patch },
      }));
    },
    [commitmentId]
  );

  return React.useMemo(() => ({ state, update }), [state, update]);
}
