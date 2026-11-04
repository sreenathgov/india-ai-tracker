"use client";
import * as React from "react";
import { RegulatoryActions } from "@/components/regulatory/RegulatoryActions";
import { useRegulatoryCase } from "@/components/regulatory/RegulatoryProvider";
import { formatDay } from "@/components/scene2/workspace/format";
import { DEMO_NOW } from "@/lib/demo/clock";
import { FINDING_LABEL, findingFor, latestScope } from "@/lib/regulatory/state";
import { affectedSerials, type InvestigationHeaderFacts, type SupplierInvestigation } from "@/lib/scene2/investigation";
import { commitmentValueLabel, defaultDecision, expiredWindow, isDeccan, regulatoryDecision, regulatoryQuestion } from "@/lib/scene2/investigation/decision";
import { deccanInquiry, MATERIAL_FINDING_LABEL, OWNER_REPLY_LABEL, type OwnerReply, type QuestionId, type WorkingQuestion } from "@/lib/scene2/investigation/inquiry";
import { DecisionQuestion, ReplyButtons, ReplyMeaning } from "./DecisionQuestion";
import { SupplierDrona } from "./SupplierDrona";
import { useSupplierInquiry } from "./SupplierInquiryProvider";
import { EvidenceState } from "./EvidenceState";
import { CompetingExplanation } from "./CompetingExplanation";
import { FinanceRelevance } from "./NextStep";
import { FEASIBILITY_LABEL } from "../labels";
import styles from "./overview.module.css";

interface Props { readonly facts: InvestigationHeaderFacts; readonly inv: SupplierInvestigation | null; readonly assessed: boolean }
export function OverviewPanel({ facts, inv, assessed }: Props): React.ReactElement {
  if (!inv) return <div className="max-w-measure pt-2" data-overview="empty"><p className="font-display text-title-m leading-[1.38] text-label-primary">{assessed ? facts.because ?? "No concern is recorded for this supplier on this order." : "This order has not been assessed yet."}</p><p className="mt-3 text-body leading-[1.55] text-label-tertiary">{assessed ? facts.supplierId === "sup:kovai-castings-machining" ? "The earlier quality-disruption case is outside the active scope. Drona does not predict manufacturing quality disruptions." : "No investigation is recorded for this supplier on this order." : "Run the assessment on the order workspace to see what Drona finds here."}</p></div>;
  return isDeccan(facts) ? <DeccanOverview facts={facts} inv={inv} /> : <CaseOverview facts={facts} inv={inv} />;
}

function CaseOverview({ facts, inv }: { readonly facts: InvestigationHeaderFacts; readonly inv: SupplierInvestigation }): React.ReactElement {
  const { state } = useRegulatoryCase();
  const finding = findingFor(state);
  const decision = inv.regulatory ? { ...regulatoryDecision(state), question: regulatoryQuestion(state, latestScope(state)?.answer === "covered" ? "readiness" : "scope") } : defaultDecision(inv);
  const status = inv.regulatory ? FINDING_LABEL[finding] : expiredWindow(facts) ? `Historical assessment · ${formatDay(inv.temporal.assessedAt)}` : inv.status.label;
  return <OverviewFrame facts={facts} inv={inv} {...decision} status={status} tone={inv.regulatory ? finding === "gap-confirmed" ? "gap" : finding === "scope-excluded" || finding === "condition-evidenced" ? "closed" : "pending" : expiredWindow(facts) ? "historical" : "pending"}>
    {inv.regulatory ? <RegulatoryActions /> : <DecisionQuestion question={decision.question} />}
  </OverviewFrame>;
}

function DeccanOverview({ facts, inv }: { readonly facts: InvestigationHeaderFacts; readonly inv: SupplierInvestigation }): React.ReactElement {
  const { state, dispatch } = useSupplierInquiry();
  const decision = deccanInquiry(state);
  const [answer, setAnswer] = React.useState<OwnerReply | null>(null);
  return <OverviewFrame facts={facts} inv={inv} {...decision} status={`${MATERIAL_FINDING_LABEL[decision.finding]} · v${inv.material?.assessmentVersion}`} tone={inv.material?.closed ? "closed" : decision.finding === "timing-gap" ? "gap" : "pending"}>
    <div className={styles.timeline} aria-label="Material forecast and response window" data-material-timeline>
      <div><span>Assessed</span><strong>2 Nov</strong></div><div data-urgent={!inv.material?.closed}><span>{inv.material?.closed ? "Original cover deadline" : "Respond by"}</span><strong>6 Nov</strong></div><div><span>Billet needed</span><strong>12 Nov</strong></div><div><span>{decision.finding === "arrival-revised" ? "Revised receipt" : "Shipment forecast"}</span><strong>{decision.finding === "arrival-revised" ? "10–11 Nov" : "15–17 Nov"}</strong></div>
    </div>
    <DecisionQuestion question={decision.question} conclusion={decision.conclusion}>
      {!decision.conclusion ? <><ReplyButtons value={answer} onChange={setAnswer} />{answer ? <ReplyMeaning question={decision.question} answer={answer} onRecord={() => { dispatch({ type: "reply", questionId: decision.question.id as QuestionId, answer }); setAnswer(null); }} recordLabel="Record sample reply and reassess" /> : null}</> : null}
      <p className={styles.pathNote}>Sample owner evidence updates the assessment, network and exposure together. No call or booking is made.</p>
    </DecisionQuestion>
    {decision.finding === "timing-gap" ? <details className={styles.recovery} data-material-response-plan><summary>Prepare the response plan</summary><dl><div><dt>Owner</dt><dd>OEM sourcing + Deccan material planning</dd></div><div><dt>First option</dt><dd>Reserve approved domestic cover by 6 Nov; usable receipt by 12 Nov.</dd></div><div><dt>Before commitment</dt><dd>Confirm grade approval, uncovered quantity, available lot, release and transport.</dd></div><div><dt>If cover is infeasible</dt><dd>Agree partial supply or resequencing; assess the effect on the customer programme.</dd></div></dl><p className={styles.pathNote}>Planning brief only · no reservation, payment or schedule change is executed.</p></details> : null}
    <details className={styles.details}><summary>Replies and assessment history · {state.replies.length}</summary><ol className={styles.history}>{[...state.replies].reverse().map((r, i) => <li key={state.replies.length - i}><p>{r.question} · <strong>{OWNER_REPLY_LABEL[r.answer]}</strong></p><p>{r.meaning}</p><p className={styles.meta}>Answer owner · {r.owner} · authored owner record · 2 Nov</p></li>)}</ol><button type="button" className={styles.link} onClick={() => { dispatch({ type: "reset" }); setAnswer(null); }}>Restart this case</button></details>
  </OverviewFrame>;
}

function OverviewFrame({ facts, inv, headline, summary, question, status, tone, children }: {
  readonly facts: InvestigationHeaderFacts; readonly inv: SupplierInvestigation; readonly headline: string; readonly summary: string; readonly question: WorkingQuestion;
  readonly status: string; readonly tone: string; readonly children: React.ReactNode;
}): React.ReactElement {
  const serials = affectedSerials(facts.orderId, facts.supplierId), expired = expiredWindow(facts);
  const valueLabel = commitmentValueLabel(facts.linkedCommitmentValue), hasValue = valueLabel !== "Awaiting master data";
  const remaining = facts.window ? Math.max(0, Math.ceil((Date.parse(facts.window.closesOn) - DEMO_NOW.getTime()) / 86400000)) : null;
  return <div className={styles.overview} data-overview>
    <section className={styles.finding} data-guide-target="finding" aria-label={inv.regulatory ? "Updated regulatory assessment" : "Order-specific finding"} data-regulatory-status={inv.regulatory?.finding} data-material-status={inv.material?.finding}>
      <span className={styles.badge} data-tone={tone}>{status}</span>
      <h2>{headline}</h2><p>{summary}</p>
    </section>
    <div className={styles.columns}>
    <dl className={styles.stakes} data-material-stakes={inv.material ? "" : undefined}>
      <div><dt>Linked purchase commitments</dt><dd className={!hasValue ? styles.missing : undefined}>{valueLabel}</dd><p>{hasValue && facts.linkedCommitmentValue ? `Not estimated loss · ${facts.linkedCommitmentValue.source} · ${formatDay(facts.linkedCommitmentValue.asOf)}` : "Affected order-line value · not estimated loss"}</p></div>
      <div><dt>Units dependent on this supplier</dt><dd>{facts.unitsAffected} / {facts.unitsTotal}</dd><p>{serials ?? "Order dependency; not confirmed disruption"}</p></div>
      <div><dt>{inv.material?.closed ? "Next checkpoint" : inv.regulatory ? "Latest useful action time" : expired ? "Original action window" : "Time to act"}</dt><dd>{inv.material?.closed ? "Monitor cover" : inv.regulatory || remaining === null ? "Unconfirmed" : expired ? "Expired" : `${remaining} days`}</dd><p className={expired ? styles.expired : undefined}>{inv.material?.closed ? "Review the next stock or receipt milestone" : inv.regulatory ? `Planned EU entry · ${formatDay(inv.regulatory.entryOn)}; preparation lead time unconfirmed` : facts.window ? `${expired ? "Closed" : "Closes"} ${formatDay(facts.window.closesOn)}${expired ? " · fresh schedule required" : inv.material ? " · six-day cover lead time" : ""}` : "Agree the deadline with the responsible owner"}</p></div>
    </dl>
      <div className={styles.main}>
        {children}
        <details className={styles.details}><summary>{isDeccan(facts) ? "How the shipment reaches this order" : "Inspect the dependency path"}</summary><div className={styles.detailBody}><Mechanism facts={facts} inv={inv} /></div></details>
        <details className={styles.details}><summary>Other actions to consider</summary><ul className={styles.history}>{inv.actions.map((action) => <li key={action.id}><p>{action.label}</p><p className={styles.meta}>{FEASIBILITY_LABEL[action.feasibility]} · {action.condition}</p></li>)}</ul><p className={styles.pathNote}>{expired ? "Historical proposals require fresh feasibility and dates before use." : "Proposed options; choosing or discussing one does not execute it."}</p></details>
        <details className={styles.details}><summary>Evidence, counterevidence and finance context</summary><div className={styles.detailBody}><EvidenceState inv={inv} /><CompetingExplanation inv={inv} /><FinanceRelevance inv={inv} /></div></details>
      </div>
      <SupplierDrona key={`${facts.orderId}:${facts.supplierId}`} scopeKey={`${facts.orderId}:${facts.supplierId}`} supplierName={facts.supplierName} orderReference={facts.orderReference} summary={summary} question={question} basis={inv.regulatory ? `Shared regulatory assessment v${inv.regulatory.assessmentVersion} · public rules and authored owner records.` : inv.material ? `Material assessment v${inv.material.assessmentVersion} · fictional sources and recorded sample replies.` : `Historical assessment ${formatDay(inv.temporal.assessedAt)} · authored case.`} />
    </div>
  </div>;
}

function Mechanism({ facts, inv }: { readonly facts: InvestigationHeaderFacts; readonly inv: SupplierInvestigation }): React.ReactElement {
  const deccan = isDeccan(facts);
  const nodes = inv.regulatory ? [["Tower sections", `${facts.unitsAffected} units · Tiruchi`], ["EU entry", "Denmark · 16 Nov"], ["Importer readiness", "Scope + eligible route"]]
    : deccan ? [["Held shipment AF-884", "Varna billet → Jalna dealer"], ["Usable billet at Deccan", "Needed 12 Nov · check stock cover"], ["Main-shaft lot", "Turbines 41–52"]]
    : [inv.fracturePath[0], inv.fracturePath[2], inv.fracturePath[inv.fracturePath.length - 1]].filter(Boolean).map((step) => [step.label, ""]);
  return <section className={styles.mechanism} aria-label="Dependency mechanism"><h3 className={styles.sectionTitle}>{inv.regulatory ? "Where the hurdle could arise" : deccan ? "The multi-tier material dependency" : "How this reaches the order"}</h3>
    <div className={styles.flow}>{nodes.map(([label, detail], i) => <div key={label} className={styles.node}><><strong>{label}</strong>{detail ? <small>{detail}</small> : null}</></div>)}</div>
    <p className={styles.pathNote}>{inv.regulatory ? "Regulatory dependency · the customs/importer check is distinct from upstream production." : deccan ? "A dated route link establishes relevance. Stock cover and usable-receipt timing determine whether the order is exposed." : "Inspect Supply chain for the full network and Evidence & reasoning for the basis."}</p>
  </section>;
}
