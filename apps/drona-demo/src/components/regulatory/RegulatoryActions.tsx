"use client";
import * as React from "react";
import { CBAM_SOURCES } from "@/lib/regulatory/investigation";
import { FINDING_LABEL, findingFor, latestScope, latestReadiness, type ReadinessReply, type ScopeReply } from "@/lib/regulatory/state";
import { regulatoryQuestion } from "@/lib/scene2/investigation/decision";
import type { OwnerReply } from "@/lib/scene2/investigation/inquiry";
import { DecisionQuestion, ReplyButtons, ReplyMeaning } from "@/components/scene2/investigation/overview/DecisionQuestion";
import styles from "@/components/scene2/investigation/overview/overview.module.css";
import { useRegulatoryCase } from "./RegulatoryProvider";

/** One working question projected from the shared case, embedded in Overview in both scenes. */
export function RegulatoryActions(): React.ReactElement {
  const { state, dispatch } = useRegulatoryCase();
  const scope = latestScope(state), readiness = latestReadiness(state), finding = findingFor(state);
  const [reviewScope, setReviewScope] = React.useState(false), [editing, setEditing] = React.useState(false);
  const [answer, setAnswer] = React.useState<OwnerReply | null>(null);
  const [route, setRoute] = React.useState<"authorised" | "application">("authorised");
  const stage = reviewScope || scope?.answer !== "covered" ? "scope" : "readiness";
  const terminal = ["gap-confirmed", "condition-evidenced", "scope-excluded"].includes(finding) && !reviewScope && !editing;
  const question = regulatoryQuestion(state, stage);
  // A revised scope must not leave an old readiness draft ready to submit.
  React.useEffect(() => { setAnswer(null); setRoute("authorised"); setEditing(false); }, [scope?.id]);
  const record = (): void => {
    if (!answer) return;
    if (stage === "scope") dispatch({ type: "record-scope", answer: (answer === "yes" ? "covered" : answer === "no" ? "excluded" : answer) as ScopeReply });
    else dispatch({ type: "record-readiness", answer: (answer === "yes" ? route : answer === "no" ? "gap" : answer) as ReadinessReply });
    setAnswer(null); setReviewScope(false); setEditing(false);
  };
  const conclusion = terminal ? finding === "gap-confirmed" ? "The importer reports that neither eligible entry route is available." : finding === "condition-evidenced" ? "The customs owner checked an eligible route for the planned entry." : "The checked scope excludes this shipment from the selected obligation." : null;
  return <div data-regulatory-actions>
    <DecisionQuestion question={question} conclusion={conclusion}>
      {terminal ? <button type="button" className={styles.link} onClick={() => { setEditing(true); setAnswer(null); }}>Update owner response</button> : <>
        <ReplyButtons value={answer} onChange={setAnswer} />
        {answer ? <ReplyMeaning question={question} answer={answer} onRecord={record} recordLabel={stage === "scope" ? "Record sample scope check" : "Record sample reply and reassess"}>
          {stage === "readiness" && answer === "yes" ? <label>Eligible route checked<select aria-label="Eligible route checked" value={route} onChange={(e) => setRoute(e.target.value as typeof route)}><option value="authorised">Valid authorisation checked for this entry</option><option value="application">Qualifying application checked for this entry</option></select></label> : null}
        </ReplyMeaning> : null}
      </>}
      <p className={styles.pathNote} aria-live="polite" data-current-readiness>{stage === "scope" ? scope ? `Latest sample scope reply: ${scope.answer}.` : "No private scope reply recorded." : readiness ? `Latest sample readiness reply: ${readiness.answer}.` : "No readiness reply recorded. Both eligible routes remain open questions."}</p>
    </DecisionQuestion>
    <details className={styles.details}>
      <summary>Replies and assessment changes · {state.records.length}</summary>
      <section aria-label="Assessment history">
        <ol className={styles.history}>{[...state.assessments].reverse().map((a) => { const r = state.records.find((record) => record.id === a.recordId); return <li key={a.version}><p>v{a.version} · {FINDING_LABEL[a.finding]}{a.predecessor ? ` · supersedes v${a.predecessor}` : " · public-first assessment"}</p><p className={styles.meta}>{r ? `${r.source} · ${r.owner} · ${new Date(r.receivedAt).toLocaleString("en-GB", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })} IST` : "Public sources and authored order plan · 2 Nov 2026; private scope and readiness initially unknown."}</p>{r ? <p>{r.detail}{r.kind === "readiness" ? ` Scope basis: ${r.scopeRecordId}.` : ""}</p> : null}</li>; })}</ol>
        <div className={styles.tools}><button type="button" className={styles.link} onClick={() => { setReviewScope(true); setEditing(true); setAnswer(null); }}>Review scope check</button><button type="button" className={styles.link} onClick={() => { dispatch({ type: "reset" }); setReviewScope(false); setEditing(false); setAnswer(null); }}>Reset case for replay</button></div>
      </section>
    </details>
    <details className={styles.details}><summary>Public rules behind this question</summary><p className={styles.meta}>Real public sources reviewed 2 Nov 2026. Private replies are authored examples. Missing verified actual emissions alone is not an automatic import block; emissions, reporting and cost remain separate.</p><ul className={styles.history}>{CBAM_SOURCES.map((s) => <li key={s.id}><a href={s.url} target="_blank" rel="noreferrer" className="underline underline-offset-4">{s.title} ↗</a></li>)}</ul></details>
  </div>;
}
