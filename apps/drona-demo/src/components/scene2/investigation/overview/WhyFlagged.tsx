import * as React from "react";

import type { SupplierInvestigation } from "@/lib/scene2/investigation";
import { Block } from "../Block";
import { MECHANISM_LABEL } from "../labels";

/**
 * The mechanism, in one sentence.
 *
 * It says how this order gets hurt, never what the supplier is. "Supplier is high
 * risk" is a verdict a reviewer cannot act on or argue with; a mechanism is both.
 * The sentence is set in the display face because it is the thing being read.
 */
export function WhyFlagged({ inv }: { readonly inv: SupplierInvestigation }): React.ReactElement {
  const mechanisms = [inv.primaryMechanism, ...inv.secondaryMechanisms];
  return (
    <Block label="Why Drona flagged this" data-block="why-flagged">
      <p className="max-w-measure-display font-display text-title-m leading-[1.38] text-label-primary">
        {inv.flagSentence}
      </p>
      <ul className="mt-3.5 flex flex-wrap items-center gap-1.5">
        {mechanisms.map((mechanism, i) => (
          <li
            key={mechanism}
            className="rounded-full bg-quiet px-2.5 py-1 text-caption text-label-secondary"
          >
            {i === 0 ? <span className="sr-only">Primary mechanism: </span> : null}
            {MECHANISM_LABEL[mechanism]}
          </li>
        ))}
      </ul>
    </Block>
  );
}
