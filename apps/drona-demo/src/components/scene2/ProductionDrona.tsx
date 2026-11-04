"use client";

import * as React from "react";

import { DronaWordmark } from "@/components/brand/DronaLogo";
import { StatementBlock } from "@/components/drona/StatementBlock";
import { productionBriefing, supplierBriefing } from "@/lib/drona/production";
import { FREE_TEXT_FALLBACK } from "@/lib/drona/script";
import type { CriticalProfile } from "@/lib/network/criticalProfile";
import { cn } from "@/lib/ui/cn";
import { ReasoningSequence } from "./ReasoningSequence";
import type { useAnalysisRun } from "./useAnalysisRun";

/**
 * Drona's column in the production view.
 *
 * Before the analysis resolves it is where the analysis runs — the reasoning
 * sequence belongs to Drona, so it happens in Drona's column rather than in the
 * middle of the reviewer's working surface. After, it reads in a fixed order: why
 * the order was flagged (across all five), what matters now (for the selected
 * supplier), and what to verify next. The Ask box comes last, as in Scene 3.
 *
 * "Why I flagged this" is about the whole order, so it does not change when the
 * reviewer switches tiles; the two blocks below it do.
 */
export function ProductionDrona({
  commitmentId,
  run,
  profile,
  className,
}: {
  readonly commitmentId: string;
  readonly run: ReturnType<typeof useAnalysisRun>;
  readonly profile: CriticalProfile | undefined;
  readonly className?: string;
}): React.ReactElement {
  const order = React.useMemo(() => productionBriefing(commitmentId), [commitmentId]);
  const selected = React.useMemo(() => (profile ? supplierBriefing(profile) : null), [profile]);
  const [rejected, setRejected] = React.useState(false);
  const [draft, setDraft] = React.useState("");

  /* A refusal about one supplier must not sit under another supplier's briefing. */
  React.useEffect(() => setRejected(false), [profile?.supplier.id]);

  const resolved = run.phase === "resolved";

  return (
    <section
      aria-label="Drona"
      className={cn("flex h-full min-h-0 flex-col border-l border-separator bg-surface", className)}
    >
      <header className="flex shrink-0 items-center gap-3 border-b border-separator px-6 py-4">
        <h2 className="text-heading text-label-primary">
          <DronaWordmark height={17} />
        </h2>
        {rejected ? (
          <button
            type="button"
            onClick={() => setRejected(false)}
            className="micro-label ml-auto text-label-tertiary hover:text-label-primary"
          >
            ← Assessment
          </button>
        ) : (
          <span className="micro-label ml-auto text-label-quaternary">
            {resolved ? "Assessment" : "Analysis"}
          </span>
        )}
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-4 pt-5">
        {!resolved ? (
          <ReasoningSequence
            steps={run.steps}
            phase={run.phase}
            resolved={run.resolved}
            onStart={run.start}
          />
        ) : rejected ? (
          <div aria-live="polite" className="flex flex-col gap-3 text-body-s leading-relaxed text-label-secondary">
            {FREE_TEXT_FALLBACK.map((paragraph, index) => (
              <p key={index} className={index === 0 ? "text-label-primary" : undefined}>
                {paragraph}
              </p>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-7">
            <StatementBlock title="Why I flagged this" statements={order.whyFlagged} />
            {selected && profile ? (
              <div key={profile.supplier.id} className="flex flex-col gap-7 motion-safe:animate-fade-rise">
                <StatementBlock
                  title={`What matters now · ${profile.supplier.name}`}
                  statements={selected.whatMattersNow}
                />
                <StatementBlock title="Suggested actions" statements={selected.suggestedActions} />
                <p className="text-caption italic text-label-quaternary">
                  Suggestions are evidence to verify. The decision stays with the reviewer.
                </p>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {resolved ? (
        <div className="shrink-0 border-t border-separator px-6 py-4">
          <form
            className="flex items-center gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              if (!draft.trim()) return;
              setRejected(true);
              setDraft("");
            }}
          >
            <label htmlFor="drona-production-ask" className="sr-only">
              Ask Drona about this order
            </label>
            <input
              id="drona-production-ask"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Ask Drona about this order…"
              autoComplete="off"
              className="min-w-0 flex-1 rounded-pill border border-separator bg-raised px-4 py-2 text-body-s text-label-primary placeholder:text-label-quaternary focus:outline-none focus-visible:border-label-quaternary"
            />
            <button
              type="submit"
              className="shrink-0 rounded-pill px-3 py-2 text-caption text-label-tertiary hover:text-label-primary"
            >
              Ask
            </button>
          </form>
        </div>
      ) : null}
    </section>
  );
}
