import * as React from "react";

import type { SupplierInvestigation } from "@/lib/scene2/investigation";
import { Block } from "../Block";
import { FINANCE_STATE_LABEL, STANCE_LABEL, STANDING_PATHWAY_NOTE } from "../labels";

/**
 * What would settle this, and how Drona would hold the exposure meanwhile.
 *
 * The requests come first because they are the only thing that changes the
 * assessment. The posture is a stance, not an instruction; the finance line is a
 * state, not a button, and it always reads "to this exposure".
 */
export function NextStep({ inv }: { readonly inv: SupplierInvestigation }): React.ReactElement {
  return (
    <Block label="What I would verify next" data-block="next-step">
      <ol className="flex flex-col gap-4">
        {inv.nextBestEvidence.map((request) => (
          <li key={request.id} className="min-w-0">
            <p className="text-body leading-[1.5] text-label-primary">{request.request}</p>
            <p className="mt-1 text-caption leading-[1.5] text-label-tertiary">
              {request.owner} · settles {lowerFirst(request.resolves)}
            </p>
          </li>
        ))}
      </ol>

      <div className="mt-6 border-t border-separator pt-4">
        <p className="micro-label mb-2 text-label-quaternary">Current intervention posture</p>
        <p className="max-w-measure text-body-s leading-[1.55] text-label-secondary">
          <span className="text-label-primary">{STANCE_LABEL[inv.interventionPosture.stance]}.</span>{" "}
          {inv.interventionPosture.summary}
        </p>
      </div>

      <FinanceRelevance inv={inv} />
    </Block>
  );
}

/**
 * Relevance of working capital to *this exposure* — a secondary state, deliberately
 * quiet and deliberately without a control. The chain, where one exists, is the
 * order in which conditions must each be evidenced: never "risky, therefore finance".
 */
export function FinanceRelevance({ inv }: { readonly inv: SupplierInvestigation }): React.ReactElement {
  const finance = inv.financeRelevance;
  return (
    <div className="mt-4 max-w-measure rounded-card bg-quiet px-4 py-3.5" data-finance-relevance={finance.state}>
      <p className="text-body-s leading-[1.55] text-label-secondary">
        <span className="text-label-tertiary">Finance relevance to this exposure: </span>
        <span className="text-label-primary">{FINANCE_STATE_LABEL[finance.state]}.</span>{" "}
        {finance.reason}
      </p>
      {finance.chain ? (
        <ol className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1.5">
          {finance.chain.map((step, i) => (
            <li key={step} className="flex items-center gap-2 text-caption text-label-tertiary">
              {i > 0 ? (
                <span aria-hidden="true" className="text-label-quaternary">
                  →
                </span>
              ) : null}
              {step}
            </li>
          ))}
        </ol>
      ) : null}
      <p className="mt-3 text-caption leading-[1.5] text-label-quaternary">{STANDING_PATHWAY_NOTE}</p>
    </div>
  );
}

/** "Whether cash is binding" reads better after "settles" than "Whether …". */
function lowerFirst(text: string): string {
  return text.charAt(0).toLowerCase() + text.slice(1);
}
