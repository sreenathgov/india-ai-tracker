import * as React from "react";

import type { RiskBand } from "@/lib/network/bom";
import type { FractureStep, SupplierInvestigation } from "@/lib/scene2/investigation";
import { cn } from "@/lib/ui/cn";
import { Block } from "../Block";
import { STAGE_LABEL, REGULATORY_STAGE_LABEL } from "../labels";

/**
 * How the condition reaches the order: five steps on one rail.
 *
 * This is the one drawn object in the briefing, and it earns that because the
 * order of the steps is the argument — a condition that cannot be traced to a
 * commitment is not an exposure. The rail runs through every node and stops at the
 * last, which is the only one carrying the band's colour: the point of arrival.
 *
 * Wide, it runs left to right. Below 1100px the same rail runs downward.
 */
export function FracturePath({
  inv,
  band,
}: {
  readonly inv: SupplierInvestigation;
  readonly band: RiskBand | null;
}): React.ReactElement {
  const last = inv.fracturePath.length - 1;
  return (
    <Block label={inv.regulatory ? "Regulatory dependency path" : "Fracture path"} sunk data-block="fracture-path">
      <ol
        className="grid gap-y-6 min-[1100px]:grid-cols-5 min-[1100px]:gap-x-5 min-[1100px]:gap-y-0"
        data-fracture-path
      >
        {inv.fracturePath.map((step, i) => (
          <Node key={step.stage} step={step} arrival={i === last} band={band} regulatory={Boolean(inv.regulatory)} />
        ))}
      </ol>
    </Block>
  );
}

function Node({
  step,
  arrival,
  band,
  regulatory,
}: {
  readonly regulatory: boolean;
  readonly step: FractureStep;
  readonly arrival: boolean;
  readonly band: RiskBand | null;
}): React.ReactElement {
  return (
    <li className="relative min-w-0 pl-5 min-[1100px]:pl-0" data-stage={step.stage}>
      <Rail arrival={arrival} band={band} />
      <p className="micro-label pt-[3px] text-label-quaternary min-[1100px]:pt-3">{regulatory ? REGULATORY_STAGE_LABEL[step.stage] : STAGE_LABEL[step.stage]}</p>
      <p className="mt-2 text-body-s font-medium leading-5 text-label-primary">{step.label}</p>
      <p className="mt-1.5 text-caption leading-[1.55] text-label-tertiary">{step.statement}</p>
    </li>
  );
}

/** The dot and the hairline out of it: horizontal when wide, vertical when stacked. */
function Rail({ arrival, band }: { readonly arrival: boolean; readonly band: RiskBand | null }): React.ReactElement {
  const dot = cn(
    "absolute left-0 top-[5px] h-[7px] w-[7px] rounded-full min-[1100px]:top-0",
    arrival && band === "critical" && "bg-[color:var(--concern-critical)]",
    arrival && band === "elevated" && "bg-[color:var(--concern-elevated)]",
    arrival && (band === "low" || band === null) && "bg-label-tertiary",
    !arrival && "border border-label-quaternary bg-transparent"
  );
  return (
    <>
      <span aria-hidden="true" className={dot} />
      {arrival ? null : (
        <>
          <span
            aria-hidden="true"
            className="absolute left-[3px] top-[12px] w-px bg-separator min-[1100px]:hidden"
            style={{ bottom: -24 }}
          />
          <span
            aria-hidden="true"
            className="absolute left-[11px] right-[-20px] top-[3px] hidden h-px bg-separator min-[1100px]:block"
          />
        </>
      )}
    </>
  );
}
