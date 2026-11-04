"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import * as React from "react";

import { formatDay } from "@/components/scene2/workspace/format";
import { expiredWindow } from "@/lib/scene2/investigation/decision";
import { Icon } from "@/components/ui/Icon";
import type { InvestigationHeaderFacts } from "@/lib/scene2/investigation";

/**
 * The three facts that must never leave the screen: which order, which supplier,
 * which component — and what is at stake on them.
 *
 * It stays put while the tabs change beneath it, so a reviewer three panels deep
 * still knows what they are looking at. Every figure is derived by
 * `investigationHeader`, so the header cannot state a different number from the
 * card it was opened from.
 */
export function InvestigationHeader({
  facts,
  onOpenPathway,
}: {
  readonly facts: InvestigationHeaderFacts;
  readonly onOpenPathway?: () => void;
}): React.ReactElement {
  return (
    <header className="shrink-0 px-7 pb-3 pt-4 max-[600px]:px-5" data-investigation-header>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 max-[600px]:grid max-[600px]:grid-cols-[minmax(0,1fr)_auto]">
        <DialogPrimitive.Close className="-ml-2 inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1.5 text-caption text-label-secondary transition-colors duration-hover hover:bg-quiet hover:text-label-primary max-[600px]:justify-self-start">
          <Icon name="arrow" className="h-3.5 w-3.5 rotate-180" />
          Order workspace
        </DialogPrimitive.Close>
        <p className="min-w-0 flex-1 text-caption text-label-secondary max-[600px]:col-span-2 max-[600px]:row-start-2 max-[600px]:truncate">
          <span className="font-mono tabular-nums">{facts.orderReference}</span><span className="max-[600px]:hidden"> · {facts.orderName}</span>
        </p>
        {facts.assessedAt ? <p className="whitespace-nowrap text-caption text-label-secondary max-[600px]:col-start-2 max-[600px]:row-start-1 max-[600px]:text-[11px]">{expiredWindow(facts) ? "Historical snapshot" : "Assessment"} · {formatDay(facts.assessedAt)}</p> : null}
      </div>

      <div className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <DialogPrimitive.Title className="font-display text-display-m text-label-primary">
          {facts.supplierName}
        </DialogPrimitive.Title>
        <p className="text-body-s text-label-tertiary">{facts.location}</p>
        {onOpenPathway ? <button type="button" onClick={onOpenPathway} className="ml-auto min-h-9 rounded-pill bg-quiet px-3 py-1.5 text-caption text-label-secondary hover:bg-quiet-hover">Open tower-section pathway →</button> : null}
      </div>

      <div className="mt-1 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <DialogPrimitive.Description className="text-body-s text-label-secondary">On this order · {facts.components.length > 0 ? facts.components.join(" · ") : "No assemblies on this order"}</DialogPrimitive.Description>
      </div>
    </header>
  );
}

