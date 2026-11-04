"use client";
import * as React from "react";
import { OWNER_REPLY_LABEL, replyMeaning, type OwnerReply, type WorkingQuestion } from "@/lib/scene2/investigation/inquiry";
import styles from "./overview.module.css";

export function DecisionQuestion({ question, conclusion, children }: { readonly question: WorkingQuestion; readonly conclusion?: string | null; readonly children?: React.ReactNode }): React.ReactElement {
  const [call, setCall] = React.useState(false);
  const callId = React.useId();
  return <section className={styles.question} aria-label="Question and next action" data-working-question={question.id}>
    <div className={styles.questionTop}><h3>{conclusion ? "Current conclusion" : "Next question"}</h3><button type="button" className={styles.link} aria-expanded={call} aria-controls={callId} onClick={() => setCall((v) => !v)}>{call ? "Close call preparation" : "Prepare for call ↗"}</button></div>
    <p className={styles.questionText}>{conclusion ?? question.question}</p>
    <p className={styles.owner}>Ask · {question.owner}</p>
    <p className={styles.request}><strong>Ask for </strong>{question.evidence}</p>
    {call ? <div className={styles.call} id={callId}>
      <p>{question.callNote}</p>
      {question.yes ? <ul><li><strong>Yes.</strong> {question.yes}</li><li><strong>No.</strong> {question.no}</li><li><strong>Unknown / declined / awaiting.</strong> Keep the uncertainty explicit and agree a useful follow-up time.</li></ul> : null}
    </div> : null}
    {children}
    <div className={styles.next} data-guide-target="next-action"><h4>Next useful action</h4><p>{question.action}</p><small>{question.timing}</small></div>
  </section>;
}

export function ReplyButtons({ value, onChange }: { readonly value: OwnerReply | null; readonly onChange: (value: OwnerReply | null) => void }): React.ReactElement {
  return <div><span className={styles.answerLabel}>Try a sample owner reply</span><div className={styles.answerRow}>
    {(["yes", "no", "unknown"] as const).map((answer) => <button key={answer} type="button" data-guide-answer={answer} className={styles.button} aria-pressed={value === answer} onClick={() => onChange(answer)}>{OWNER_REPLY_LABEL[answer]}</button>)}
    <select aria-label="Other owner reply" value={value === "refused" || value === "delayed" ? value : ""} onChange={(e) => onChange((e.target.value || null) as OwnerReply | null)}><option value="">Other reply</option><option value="refused">Declined to answer</option><option value="delayed">Awaiting reply</option></select>
  </div></div>;
}

export function ReplyMeaning({ question, answer, onRecord, children, recordLabel = "Record practice reply" }: { readonly question: WorkingQuestion; readonly answer: OwnerReply; readonly onRecord: () => void; readonly children?: React.ReactNode; readonly recordLabel?: string }): React.ReactElement {
  return <div className={styles.meaning} aria-live="polite"><p>{replyMeaning(question, answer)}</p>{children}<button type="button" data-guide-target="record-reply" className={`${styles.button} ${styles.primary}`} onClick={onRecord}>{recordLabel}</button></div>;
}
