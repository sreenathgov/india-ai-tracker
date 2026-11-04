"use client";

import * as React from "react";

import { DronaWordmark } from "@/components/brand/DronaLogo";
import { useTypedReveal } from "@/components/drona/useTypedReveal";
import { StatementBlock } from "@/components/drona/StatementBlock";
import { exposureBriefing, exposurePrompts } from "@/lib/drona/exposure";
import { FREE_TEXT_FALLBACK, type DronaAnswer } from "@/lib/drona/script";
import { cn } from "@/lib/ui/cn";

/**
 * Drona on one exposure — and, for every sentence, how it knows.
 *
 * The sketch's requirement is that this column supports conversation without *looking*
 * like a chatbot, so the order is fixed and the input comes last: what Drona has
 * concluded, what follows from it, what it would check next — and only then a place to
 * ask. A panel that opened with a cursor would be claiming it had read nothing.
 *
 * **Standing is drawn, not merely written.** Known / Inferred / Unknown / Next evidence
 * each get their own mark and their own weight, because the one failure this scene
 * cannot afford is a reviewer reading an inference as a fact. The marks are shapes
 * before they are colours — solid, ring, hollow, arrow — so the distinction survives a
 * projector and a monochrome screenshot. Geist Italic is spent here and only here, on
 * the qualification itself, per BRAND.md §2.1.
 *
 * Nothing reaches the network. The answers are authored, their figures derived, and
 * free text gets an honest refusal rather than a plausible invention.
 */
export function ExposureDrona({
  componentId,
  evidenceOpen,
  onShowEvidence,
  className,
}: {
  readonly componentId: string;
  /**
   * Whether the provenance drawer is open.
   *
   * The drawer is owned by the scene, not by this panel, because it covers the whole
   * working surface — and a component should not be able to draw outside itself
   * without the thing it draws over knowing. This panel only needs to reflect the
   * state in the prompt it offers.
   */
  readonly evidenceOpen: boolean;
  readonly onShowEvidence: () => void;
  readonly className?: string;
}): React.ReactElement | null {
  const briefing = React.useMemo(
    () => exposureBriefing(componentId),
    [componentId]
  );
  const prompts = React.useMemo(
    () => exposurePrompts(componentId),
    [componentId]
  );

  const [active, setActive] = React.useState<DronaAnswer | null>(null);
  const [rejected, setRejected] = React.useState(false);
  const [draft, setDraft] = React.useState("");

  /* Switching assembly returns Drona to its own briefing. Leaving the previous
     answer on screen would attach one assembly's reasoning to another's header —
     the single worst thing this panel could do. */
  React.useEffect(() => {
    setActive(null);
    setRejected(false);
    setDraft("");
  }, [componentId]);

  if (!briefing) return null;

  const answering = rejected || active !== null;

  return (
    <section
      aria-label="Drona"
      className={cn(
        "flex h-full min-h-0 flex-col border-l border-separator bg-surface",
        className
      )}
    >
      <header className="flex shrink-0 items-center gap-3 border-b border-separator px-7 py-4">
        <h2 className="text-heading text-label-primary">
          <DronaWordmark height={17} />
        </h2>

        {answering ? (
          <button
            type="button"
            onClick={() => {
              setActive(null);
              setRejected(false);
            }}
            className="micro-label ml-auto text-label-tertiary hover:text-label-primary"
          >
            ← Assessment
          </button>
        ) : (
          <span className="micro-label ml-auto text-label-quaternary">
            Assessment
          </span>
        )}
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-7 pb-4 pt-5">
        {answering ? (
          <Answer paragraphs={rejected ? FREE_TEXT_FALLBACK : active!.paragraphs} />
        ) : (
          <div className="flex flex-col gap-7">
            <StatementBlock title="Why I flagged this" statements={briefing.whyFlagged} />
            <StatementBlock title="What matters now" statements={briefing.whatMattersNow} />
            <StatementBlock
              title="What I would verify next"
              statements={briefing.whatIWouldVerifyNext}
            />
          </div>
        )}

        {prompts.length > 0 ? (
          <div className="mt-7 border-t border-separator pt-5">
            <p className="micro-label text-label-quaternary">
              Ask Drona about this exposure
            </p>
            <ul className="mt-3 flex flex-col gap-2">
              {prompts.map((prompt) => (
                <li key={prompt.id}>
                  <button
                    type="button"
                    /* The ledger prompt opens a surface rather than returning a
                       sentence, so it says so to a screen reader instead of leaving
                       the difference to sighted layout. */
                    aria-haspopup={prompt.kind === "ledger" ? "dialog" : undefined}
                    aria-expanded={
                      prompt.kind === "ledger" ? evidenceOpen : undefined
                    }
                    onClick={() => {
                      if (prompt.kind === "ledger") {
                        onShowEvidence();
                        return;
                      }
                      setRejected(false);
                      setActive(prompt);
                    }}
                    className={cn(
                      "w-full rounded-chip border px-3.5 py-2 text-left text-caption",
                      "motion-safe:transition-colors motion-safe:duration-fast",
                      (
                        prompt.kind === "ledger"
                          ? evidenceOpen
                          : active?.id === prompt.id && !rejected
                      )
                        ? "border-label-quaternary bg-inset text-label-primary"
                        : "border-separator text-label-secondary hover:bg-raised hover:text-label-primary"
                    )}
                  >
                    {prompt.prompt}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      <div className="shrink-0 border-t border-separator px-7 py-4">
        <form
          className="flex items-center gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (!draft.trim()) return;
            setActive(null);
            setRejected(true);
            setDraft("");
          }}
        >
          <label htmlFor="drona-exposure-ask" className="sr-only">
            Ask Drona about this exposure
          </label>
          <input
            id="drona-exposure-ask"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Ask Drona about this exposure…"
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
    </section>
  );
}

function Answer({
  paragraphs,
}: {
  readonly paragraphs: readonly string[];
}): React.ReactElement {
  const { visible, done, skip } = useTypedReveal(paragraphs);

  return (
    <div onClick={done ? undefined : skip}>
      <div
        aria-live="polite"
        className="flex flex-col gap-3 text-body-s leading-relaxed text-label-secondary"
      >
        {visible.map((paragraph, index) => (
          <p key={index} className={index === 0 ? "text-label-primary" : undefined}>
            {paragraph}
            {!done && index === visible.length - 1 ? (
              <span
                aria-hidden="true"
                className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[0.15em] bg-brand-mark align-baseline motion-safe:animate-pulse"
              />
            ) : null}
          </p>
        ))}
      </div>
    </div>
  );
}
