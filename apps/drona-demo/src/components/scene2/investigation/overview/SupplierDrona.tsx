"use client";
import * as React from "react";
import type { WorkingQuestion } from "@/lib/scene2/investigation/inquiry";
import styles from "./overview.module.css";

type Prompt = "why" | "change" | "act" | "unsupported";
export function SupplierDrona({ scopeKey, supplierName, orderReference, summary, question, basis }: {
  readonly scopeKey: string; readonly supplierName: string; readonly orderReference: string; readonly summary: string;
  readonly question: WorkingQuestion; readonly basis: string;
}): React.ReactElement {
  const [active, setActive] = React.useState<Prompt | null>(null);
  const [draft, setDraft] = React.useState("");
  const inputId = React.useId();
  React.useEffect(() => { setActive(null); setDraft(""); }, [scopeKey]);
  // Store the question intent, not a stale answer. New replies immediately re-project from current case facts.
  const answer = active === "why" ? summary
    : active === "change" ? `${question.question} ${question.yes || question.evidence} ${question.no} Unknown, declined and delayed replies retain their own states.`
    : active === "act" ? `${question.owner} owns the next relevant answer. ${question.action} ${question.timing}`
    : active === "unsupported" ? "This local demo supports the three supplier-specific prompts shown here. A live Drona response would need the current order and source records. Live AI, call listening and transcription are not connected."
    : null;
  return <aside className={styles.assistant} aria-label="Supplier-specific Drona conversation">
    <h3>Ask Drona</h3><p className={styles.scope}>{supplierName} · {orderReference}</p>
    <div className={styles.prompts}>{([ ["why", "Why does this affect my order?"], ["change", "What would change the assessment?"], ["act", "Who can act on this?"] ] as const).map(([id, label]) => <button key={id} type="button" onClick={() => setActive(id)}>{label}</button>)}</div>
    {answer ? <div className={styles.response} aria-live="polite"><p>{answer}</p><small>{active === "unsupported" ? "Authored demo boundary" : basis}</small></div> : null}
    <form onSubmit={(event) => { event.preventDefault(); if (!draft.trim()) return; setActive(/why|affect/i.test(draft) ? "why" : /change|evidence|invalidate/i.test(draft) ? "change" : /who|next action|owner/i.test(draft) ? "act" : "unsupported"); setDraft(""); }}>
      <label htmlFor={inputId} className={styles.meta}>About this supplier and order</label>
      <textarea id={inputId} value={draft} maxLength={700} onChange={(e) => setDraft(e.target.value)} placeholder="Ask about the dependency or next question…" />
      <div className={styles.send}><button type="submit" className={styles.button}>Ask Drona ↗</button></div>
    </form>
    <p className={styles.honesty}>Authored demo responses · call preparation, with no live audio or supplier contact.</p>
  </aside>;
}
