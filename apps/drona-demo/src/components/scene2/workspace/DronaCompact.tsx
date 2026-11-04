"use client";
import * as React from "react";
import { useRegulatoryCase } from "@/components/regulatory/RegulatoryProvider";
import { commitmentById } from "@/lib/network/gazetteer";
import { ORDER_QUESTIONS, orderAnswer, orderQuestionFor, type OrderQuestion } from "@/lib/scene2/orderConversation";
import { cn } from "@/lib/ui/cn";

const REVIEW_STAGE_MS = 700;
function reviewSteps(intent: OrderQuestion): readonly { running: string; complete: string }[] {
  if (intent === "unsupported") return [{ running: "Checking demo coverage", complete: "Demo coverage checked" }];
  return [
    intent === "network" ? { running: "Reviewing mapped suppliers", complete: "Mapped suppliers reviewed" } : { running: "Reviewing order context", complete: "Order context reviewed" },
    intent === "network" ? { running: "Checking shared identities", complete: "Shared identities checked" } : { running: "Checking evidence state", complete: "Evidence state checked" },
    { running: "Preparing sample response", complete: "Sample response prepared" },
  ];
}
const FOCUS = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-label-secondary";

/** Optional authored order conversation, outside the guided storyboard. No writes
 * to evidence or assessment state; the only stored answer data is its intent. */
export function DronaCompact({ commitmentId, assessed, className }: {
  readonly commitmentId: string; readonly assessed: boolean; readonly className?: string;
}): React.ReactElement {
  // A different order gets an empty conversation; a revised case re-projects the active answer.
  return <OrderConversation key={commitmentId} commitmentId={commitmentId} assessed={assessed} className={className} />;
}
function OrderConversation({ commitmentId, assessed, className }: {
  readonly commitmentId: string; readonly assessed: boolean; readonly className?: string;
}): React.ReactElement {
  const { state } = useRegulatoryCase();
  const [active, setActive] = React.useState<{ intent: OrderQuestion; question: string } | null>(null);
  const [resolved, setResolved] = React.useState(0);
  const [draft, setDraft] = React.useState("");
  const inputId = React.useId();
  const inputRef = React.useRef<HTMLTextAreaElement>(null);
  const reference = commitmentById(commitmentId)?.reference;
  const steps = active ? reviewSteps(active.intent) : [];
  const pending = active !== null && resolved < steps.length;
  const answer = active && !pending ? orderAnswer(active.intent, commitmentId, assessed, state) : null;
  // A disclosed, finite presentation delay only. It never runs inference or writes evidence.
  // Replacing/clearing the question or leaving the order cancels every pending callback.
  React.useEffect(() => {
    if (!active) return;
    const timers = reviewSteps(active.intent).map((_, index) => window.setTimeout(() => setResolved(index + 1), REVIEW_STAGE_MS * (index + 1)));
    return () => timers.forEach(timer => window.clearTimeout(timer));
  }, [active]);
  function ask(intent: OrderQuestion, question: string): void {
    setResolved(0);
    setActive({ intent, question });
  }
  return <aside aria-label="Order Drona conversation" data-order-drona className={cn("sheet-material flex min-w-0 flex-col rounded-surface p-5", className)}>
    <div className="flex items-baseline justify-between gap-3"><h2 className="text-[15px] font-medium text-label-primary">Drona</h2><span className="text-[11px] text-label-tertiary">Sample responses</span></div>
    <p className="mt-1 text-[12px] text-label-tertiary">{reference}</p>
    <p className="mt-6 text-[14px] leading-relaxed text-label-secondary">Ask about this order.</p>
    <div className="mt-3 divide-y divide-separator" aria-label="Suggested questions">
      {ORDER_QUESTIONS.map(({ id, label }) => <button key={id} type="button" onClick={() => ask(id, label)} className={cn("flex w-full items-start justify-between gap-4 py-3 text-left text-[13px] leading-[1.5] text-label-secondary hover:text-label-primary", FOCUS)}><span>{label}</span><span aria-hidden="true" className="text-label-tertiary">↗</span></button>)}
    </div>
    <div role="status" aria-live="polite" aria-atomic="true" aria-busy={pending} className={active ? "mt-5 border-t border-separator pt-5" : ""}>
      {active ? <>
        <p className="text-[13px] font-medium leading-relaxed text-label-primary">{active.question}</p>
        {pending ? <div className="mt-4" data-order-drona-review>
          <p className="text-[11px] text-label-tertiary">Sample review</p>
          <ol className="mt-3 min-h-[78px] space-y-2 text-[12px] leading-[1.5]" aria-label="Sample review sequence">
            {steps.slice(0, resolved + 1).map((step, index) => <li key={step.running} className={index < resolved ? "text-label-tertiary" : "text-label-secondary"}>{index < resolved ? step.complete : `${step.running}…`}</li>)}
          </ol>
          <div aria-hidden="true" className="mt-3 h-px overflow-hidden bg-separator"><div className="h-full bg-label-tertiary motion-safe:transition-[width] motion-safe:duration-300" style={{ width: `${((resolved + 1) / steps.length) * 100}%` }} /></div>
        </div> : <>
          <details className="mt-3 text-[11px] leading-relaxed text-label-tertiary" data-order-drona-review-complete>
            <summary className="cursor-pointer">Sample review · {steps.length === 1 ? "1 step" : `${steps.length} steps`}</summary>
            <ol className="mt-2 space-y-1" aria-label="Completed sample review">{steps.map(step => <li key={step.complete}>{step.complete}</li>)}</ol>
          </details>
          <div className="mt-3 space-y-3 text-[13px] leading-[1.65] text-label-secondary" data-order-drona-response>{answer?.map(paragraph => <p key={paragraph}>{paragraph}</p>)}</div>
        </>}
      </> : null}
    </div>
    {active ? <button type="button" className={cn("mt-4 self-start text-[12px] text-label-tertiary underline underline-offset-4 hover:text-label-primary", FOCUS)} onClick={() => { setActive(null); setResolved(0); setDraft(""); inputRef.current?.focus(); }}>{pending ? "Cancel response" : "Clear conversation"}</button> : null}
    <form className="mt-6 border-t border-separator pt-5" onSubmit={event => { event.preventDefault(); const question = draft.trim(); if (!question) return; ask(orderQuestionFor(question), question); setDraft(""); }}>
      <label htmlFor={inputId} className="text-[12px] text-label-secondary">Your question</label>
      <textarea ref={inputRef} id={inputId} value={draft} onChange={event => setDraft(event.target.value)} maxLength={700} rows={3} placeholder="Ask about the order…" className={cn("mt-2 block w-full resize-y rounded-[8px] border border-separator bg-transparent p-3 text-[13px] leading-relaxed text-label-primary placeholder:text-label-tertiary", FOCUS)} />
      <div className="mt-3 flex justify-end"><button type="submit" disabled={!draft.trim()} className={cn("min-h-9 rounded-[6px] bg-quiet px-3 text-[13px] font-medium text-label-primary hover:bg-quiet-hover disabled:cursor-default disabled:opacity-40", FOCUS)}>Ask Drona ↗</button></div>
    </form>
    <p className="mt-4 text-[11px] leading-relaxed text-label-tertiary">Illustrative answers · No live AI or actions</p>
  </aside>;
}
