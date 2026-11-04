/** Authored snapshot events plus actual in-session record receipts. No outreach is sent. */
import { FINDING_LABEL, INITIAL_REGULATORY_STATE, type RegulatoryState } from "@/lib/regulatory/state";
export const ACTIVITY_KINDS = ["supplier_update", "evidence_received", "evidence_requested", "milestone", "comment", "drona", "finance"] as const;
export type ActivityKind = (typeof ACTIVITY_KINDS)[number];
export const ACTIVITY_LABEL: Readonly<Record<ActivityKind, string>> = {
  supplier_update: "Supplier update", evidence_received: "Evidence received", evidence_requested: "Evidence question", milestone: "Milestone", comment: "Comment", drona: "Reassessment", finance: "Finance",
};
export interface ActivityEvent { readonly id: string; readonly kind: ActivityKind; readonly actor: string; readonly text: string; readonly when: string; readonly minutesAgo: number; readonly commitmentId?: string; }
export function activityFeed(state: RegulatoryState = INITIAL_REGULATORY_STATE): readonly ActivityEvent[] {
  const received: ActivityEvent[] = [...state.assessments].reverse().filter((a) => a.recordId).map((a, i) => {
    const r = state.records.find((x) => x.id === a.recordId)!;
    return { id: `reg-event-${a.version}`, kind: "evidence_received", actor: r.owner, commitmentId: "c1", when: `v${a.version} · 2 Nov`, minutesAgo: i, text: `Sample record received. ${FINDING_LABEL[a.finding]}. ${r.detail}` };
  });
  return [...received,
    { id: "a1", kind: "drona", actor: "Drona", commitmentId: "c1", when: "09:05", minutesAgo: 100, text: "Public-first CBAM assessment: applicability under review; 28 of 100 units depend on the Denmark tower-section shipment." },
    { id: "a2", kind: "evidence_requested", actor: "Drona", commitmentId: "c1", when: "09:04", minutesAgo: 101, text: "Prepared the shipment-scope question for OEM logistics / customs broker. No message sent." },
    { id: "a3", kind: "evidence_requested", actor: "Drona", commitmentId: "c1", when: "09:03", minutesAgo: 102, text: "Prepared the importer-readiness question, conditional on covered scope. Missing evidence is not negative confirmation." },
    { id: "a4", kind: "comment", actor: "Demo Reviewer", commitmentId: "c1", when: "09:02", minutesAgo: 103, text: "Establish the actual import article, responsible importer and exception position before escalating." },
    { id: "a5", kind: "evidence_received", actor: "Public authority review", commitmentId: "c1", when: "09:00", minutesAgo: 105, text: "European Commission CBAM guidance reviewed 2 Nov 2026. Definitive regime effective from 1 Jan 2026; owner-specific scope still unconfirmed." },
    { id: "a6", kind: "milestone", actor: "Authored order plan", commitmentId: "c1", when: "08:58", minutesAgo: 107, text: "Planned EU entry 16 Nov; programme required by 18 Nov. Regulatory preparation time is not yet evidenced." },
    { id: "a7", kind: "drona", actor: "Drona", when: "08:57", minutesAgo: 108, text: "Quality-disruption prediction is outside the showcased scope. Supplied component records remain planning context." },
    { id: "a8", kind: "finance", actor: "Demo snapshot", when: "Earlier", minutesAgo: 200, text: "Illustrative working-capital figures are authored examples, not customer traction or recorded disbursements." },
    { id: "a9", kind: "finance", actor: "Drona", when: "Earlier", minutesAgo: 201, text: "Standing working-capital access is separate. It cannot replace an eligible regulatory import route; lenders retain credit authority." },
  ];
}
export function addComment(feed: readonly ActivityEvent[], raw: string): readonly ActivityEvent[] {
  const text = raw.trim();
  if (!text) return feed;
  const number = feed.filter((e) => e.id.startsWith("u")).length + 1;
  return [{ id: `u${number}`, kind: "comment", actor: "You", text, when: "Now", minutesAgo: 0 }, ...feed];
}
