import * as React from "react";

import { DronaMonogram } from "@/components/brand/DronaLogo";
import { ANALYSIS_DISCLOSURE } from "@/lib/drona/analysis";
import { suppliersForCommitment } from "@/lib/network/gazetteer";

/**
 * Scene 2 for an order Drona has no bill of materials for.
 *
 * The tempting thing is to run the flagship's analysis anyway — the sequence is
 * scripted, the cards would render, nobody in the room would check. That is exactly
 * the failure this demo argues against: a figure with no model underneath it. So the
 * order opens, its facts are shown, and the one action is withheld with the reason.
 *
 * What Drona *can* say is said, and it is Scene 1's vocabulary, not Scene 2's: it
 * knows which suppliers the order touches and what concern they are in, and it says
 * plainly that concern is not risk until the bill of materials says which of them
 * this order depends on, for what, and by when.
 */
export function NotYetAnalysed({
  commitmentId,
}: {
  readonly commitmentId: string;
}): React.ReactElement {
  const suppliers = suppliersForCommitment(commitmentId);
  const critical = suppliers.filter((s) => s.concern === "critical").length;

  return (
    <section aria-label="Analysis not available" className="flex flex-col gap-5">
      <div className="flex gap-4">
        <DronaMonogram height={20} className="mt-0.5" />
        <div className="max-w-measure space-y-3">
          <p className="text-body-s text-label-secondary" data-figure>
            This order touches {suppliers.length} Tier-1 suppliers
            {critical > 0 ? `, ${critical} of them in critical concern today` : ""}.
            That is as far as I can go without its bill of materials.
          </p>
          <p className="text-body-s italic text-label-tertiary">
            Its released revision has not been read into this surface, so I cannot
            say which of those suppliers this order depends on, for what, or by
            when — and without that, concern is not yet risk.
          </p>
        </div>
      </div>
      <p className="max-w-measure text-caption text-label-quaternary">
        {ANALYSIS_DISCLOSURE}
      </p>
    </section>
  );
}
