import * as React from "react";

import { EpistemicMark } from "@/components/surface/drona/EpistemicMark";
import type { Claim, SupplierInvestigation } from "@/lib/scene2/investigation";
import { evidenceState, forecastQualifier } from "@/lib/scene2/investigation";
import type { ReasoningState } from "@/lib/portfolio/assistant";
import { Block } from "../Block";
import { CLAIM_TYPE_LABEL, CONFIDENCE_LABEL } from "../labels";

/** Controlling claims first: the ones the finding rests on lead the group. */
const WEIGHT = { controlling: 0, contributing: 1, contextual: 2 } as const;
const SHOWN = 3;

/**
 * What is known, what was reasoned to, and what is still open.
 *
 * Counts, not percentages — a number between 0 and 100 beside a claim reads as
 * measurement, and none of this is measured. Inference, forecast and scenario keep
 * their own tags inside the inferred group rather than collapsing into one word.
 */
export function EvidenceState({ inv }: { readonly inv: SupplierInvestigation }): React.ReactElement {
  const state = evidenceState(inv);
  return (
    <Block label="Evidence state" data-block="evidence-state">
      <div className="flex flex-col gap-5">
        <Group state="verified" label="Known" count={state.known.length}>
          <Claims claims={state.known} />
        </Group>
        <Group state="inferred" label="Inferred" count={state.inferred.length}>
          <Claims claims={state.inferred} tagged />
        </Group>
        <Group state="unresolved" label="Unresolved" count={state.unresolved.length}>
          <ul className="flex flex-col gap-2">
            {state.unresolved.map((item) => (
              <li key={item.id} className="text-body-s leading-[1.5] text-label-secondary">
                {item.statement}
              </li>
            ))}
          </ul>
        </Group>
      </div>
    </Block>
  );
}

function Group({
  state,
  label,
  count,
  children,
}: {
  readonly state: ReasoningState;
  readonly label: string;
  readonly count: number;
  readonly children: React.ReactNode;
}): React.ReactElement {
  return (
    <section className="min-w-0" data-evidence-group={label.toLowerCase()}>
      <div className="mb-2 flex items-center gap-2">
        <EpistemicMark state={state} label={label} />
        <span className="text-caption tabular-nums text-label-quaternary">{count}</span>
      </div>
      {children}
    </section>
  );
}

function Claims({
  claims,
  tagged = false,
}: {
  readonly claims: readonly Claim[];
  /** The inferred group names each claim's type; the known group does not need to. */
  readonly tagged?: boolean;
}): React.ReactElement {
  const ordered = [...claims].sort((a, b) => WEIGHT[a.materiality] - WEIGHT[b.materiality]);
  const shown = ordered.slice(0, SHOWN);
  const rest = ordered.length - shown.length;
  return (
    <>
      <ul className="flex flex-col gap-2">
        {shown.map((claim) => (
          <li key={claim.id} className="text-body-s leading-[1.5] text-label-secondary">
            {tagged ? (
              <span className="mr-2 align-[1px] text-caption text-label-quaternary">
                {CLAIM_TYPE_LABEL[claim.claimType]}
              </span>
            ) : null}
            {claim.claim}
            <Qualifier claim={claim} />
          </li>
        ))}
      </ul>
      {rest > 0 ? (
        <p className="mt-2 text-caption text-label-quaternary">
          {rest} further {rest === 1 ? "claim" : "claims"} in Evidence &amp; reasoning.
        </p>
      ) : null}
    </>
  );
}

/**
 * How far, by when, how firmly — under the forward-looking claims only.
 *
 * A forecast read without its horizon is a slogan, so the qualification sits with
 * the sentence rather than in a figure panel of its own. Observations and
 * inferences get nothing here: `forecastQualifier` returns null for them.
 */
function Qualifier({ claim }: { readonly claim: Claim }): React.ReactElement | null {
  const q = forecastQualifier(claim);
  if (!q) return null;
  const parts = [q.magnitude, q.horizon, `${CONFIDENCE_LABEL[q.confidence]} confidence`];
  return (
    <span
      className="mt-1 block text-caption leading-[1.5] tabular-nums text-label-quaternary"
      data-forecast-qualifier
    >
      {parts.filter((part): part is string => part !== null).join(" · ")}
    </span>
  );
}
