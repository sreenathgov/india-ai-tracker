import * as React from "react";

import type { SupplierInvestigation } from "@/lib/scene2/investigation";
import { Block } from "../Block";

/**
 * The reading that would make this finding wrong, and what would show it.
 *
 * It sits beside the evidence rather than after it, because an assessment a
 * reviewer cannot argue with is not an assessment. The falsifiers are the useful
 * part: each one is a thing that could be found today.
 */
export function CompetingExplanation({
  inv,
}: {
  readonly inv: SupplierInvestigation;
}): React.ReactElement {
  const { statement, falsifiers } = inv.competingExplanation;
  return (
    <Block label="What could weaken this assessment" data-block="competing-explanation">
      <p className="max-w-measure text-body leading-[1.55] text-label-primary">{statement}</p>
      <ul className="mt-4 flex flex-col gap-2.5">
        {falsifiers.map((falsifier) => (
          <li key={falsifier} className="relative pl-4 text-body-s leading-[1.5] text-label-secondary">
            <span
              aria-hidden="true"
              className="absolute left-0 top-[9px] h-[5px] w-[5px] rounded-full border border-label-quaternary"
            />
            {falsifier}
          </li>
        ))}
      </ul>
    </Block>
  );
}
