import * as React from "react";

import { formatDay } from "@/components/scene2/workspace/format";
import type { InvestigationHeaderFacts, SupplierInvestigation } from "@/lib/scene2/investigation";
import { affectedSerials } from "@/lib/scene2/investigation";
import { Block, Figure } from "../Block";

/**
 * What this costs the order if nothing changes.
 *
 * Units come from the bill of materials, counted once even where a supplier makes
 * two assemblies for the same turbines. The window is the workbench's own figure,
 * so the block cannot say a different number from the card it opened from.
 */
export function ProductionConsequence({
  facts,
  inv,
}: {
  readonly facts: InvestigationHeaderFacts;
  readonly inv: SupplierInvestigation;
}): React.ReactElement {
  const serials = affectedSerials(facts.orderId, facts.supplierId);
  const cover = inv.inputCover;

  return (
    <Block label={inv.regulatory ? "Order dependency & import timing" : "Production consequence"} data-block="production-consequence">
      <div className="flex flex-wrap items-start gap-x-10 gap-y-5">
        <Figure value={`${facts.unitsAffected} / ${facts.unitsTotal}`} label={inv.regulatory ? "Units dependent on these section sets" : "Units affected on this order"} />
        {inv.regulatory ? <Figure value={formatDay(inv.regulatory.entryOn)} label="Planned EU entry · preparation time unconfirmed" /> : null}
        {facts.window ? (
          <Figure
            value={`${facts.window.days} days`}
            label={`Before intervention closes · ${formatDay(facts.window.closesOn)}`}
          />
        ) : null}
        {cover ? (
          <Figure value={`${cover.days} / ${cover.requiredDays} days`} label={`${cover.label} against requirement`} muted />
        ) : null}
      </div>
      {serials ? <p className="mt-4 text-body-s text-label-tertiary">{serials} take work from this supplier.</p> : null}
    </Block>
  );
}
