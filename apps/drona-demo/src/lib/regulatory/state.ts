/** Bounded, authored demo records. These are not live customs or supplier data. */
export const REGULATORY_CASE = {
  id: "reg:c1:tower-cbam",
  orderId: "c1",
  supplierId: "sup:tiruchi-tower-sections",
  componentId: "cmp:tower-section-set",
  assessedOn: "2026-11-02",
  entryOn: "2026-11-16",
  ruleEffectiveOn: "2026-01-01",
} as const;

/** A case is counted once, even though its rule appears in several views. */
export const REGULATORY_CASES = [REGULATORY_CASE] as const;
export type ScopeReply = "covered" | "excluded" | "unknown" | "refused" | "delayed";
export type ReadinessReply = "gap" | "authorised" | "application" | "unknown" | "refused" | "delayed";
export type Finding = "applicability-review" | "readiness-review" | "gap-confirmed" | "condition-evidenced" | "scope-excluded";

export const SCOPE_REPLY_LABEL: Readonly<Record<ScopeReply, string>> = {
  covered: "Covered shipment confirmed",
  excluded: "Scope exclusion / exemption confirmed",
  unknown: "Scope not established",
  refused: "Scope response declined",
  delayed: "Scope response delayed",
};
export const READINESS_REPLY_LABEL: Readonly<Record<ReadinessReply, string>> = {
  gap: "Neither authorisation nor qualifying application route",
  authorised: "Valid authorisation checked for this import",
  application: "Qualifying application route checked for this import",
  unknown: "Readiness not established",
  refused: "Readiness response declined",
  delayed: "Readiness response delayed",
};
export const FINDING_LABEL: Readonly<Record<Finding, string>> = {
  "applicability-review": "Applicability under review",
  "readiness-review": "Importer readiness under review",
  "gap-confirmed": "Import-readiness gap confirmed",
  "condition-evidenced": "Readiness condition evidenced",
  "scope-excluded": "This shipment excluded",
};

export interface ScopeRecord {
  readonly kind: "scope";
  readonly answer: ScopeReply;
  readonly owner: "OEM logistics / customs broker";
  readonly source: string;
  readonly detail: string;
}
export interface ReadinessRecord {
  readonly kind: "readiness";
  readonly answer: ReadinessReply;
  readonly owner: "Importer / indirect customs representative";
  readonly source: string;
  readonly detail: string;
  /** Readiness is valid only for the scope version its owner checked. */
  readonly scopeRecordId: string;
}
export type CaseRecord = (ScopeRecord | ReadinessRecord) & {
  readonly id: string;
  readonly receivedAt: string;
  readonly synthetic: true;
};
export interface AssessmentVersion {
  readonly version: number;
  readonly finding: Finding;
  readonly recordId: string | null;
  readonly predecessor: number | null;
}
export interface RegulatoryState {
  readonly records: readonly CaseRecord[];
  readonly assessments: readonly AssessmentVersion[];
}
export const INITIAL_REGULATORY_STATE: RegulatoryState = {
  records: [],
  assessments: [{ version: 1, finding: "applicability-review", recordId: null, predecessor: null }],
};

export function latestScope(state: RegulatoryState): (CaseRecord & ScopeRecord) | undefined {
  return [...state.records].reverse().find((r): r is CaseRecord & ScopeRecord => r.kind === "scope");
}
export function latestReadiness(state: RegulatoryState): (CaseRecord & ReadinessRecord) | undefined {
  const scope = latestScope(state);
  return [...state.records].reverse().find((r): r is CaseRecord & ReadinessRecord =>
    r.kind === "readiness" && r.scopeRecordId === scope?.id);
}
export function findingFor(state: RegulatoryState): Finding {
  const scope = latestScope(state);
  if (scope?.answer === "excluded") return "scope-excluded";
  if (scope?.answer !== "covered") return "applicability-review";
  const readiness = latestReadiness(state);
  if (readiness?.answer === "gap") return "gap-confirmed";
  if (readiness?.answer === "authorised" || readiness?.answer === "application") return "condition-evidenced";
  return "readiness-review";
}
export const findingClosed = (finding: Finding): boolean =>
  finding === "scope-excluded" || finding === "condition-evidenced";

export type RegulatoryEvent =
  | { readonly type: "record-scope"; readonly answer: ScopeReply }
  | { readonly type: "record-readiness"; readonly answer: ReadinessReply }
  | { readonly type: "reset" };

const SCOPE_DETAIL: Readonly<Record<ScopeReply, string>> = {
  covered: "Broker/importer check: separately imported steel tower sections; declared CN 7308 20 00; Indian origin, release for free circulation in Denmark on 16 Nov 2026; Wind Energy Import Services is the responsible importer. Annual covered mass exceeds 50 tonnes; no applicable exemption identified. This record does not classify a complete wind turbine.",
  excluded: "Alternate sample: the customs owner checked the actual imported article, procedure and exemption position and documented that this shipment is outside the selected CBAM obligation. Applies to this shipment only; supersedes the earlier scope check.",
  unknown: "The owner cannot yet establish the shipped article, customs procedure, importer or threshold/exception position. A rule match alone does not establish applicability.",
  refused: "The scope owner declined to provide the requested shipment check. Applicability remains unresolved.",
  delayed: "The scope owner expects a later response. No scope conclusion is recorded while it is pending.",
};
const READINESS_DETAIL: Readonly<Record<ReadinessReply, string>> = {
  gap: "The responsible importer explicitly confirms that neither a valid CBAM authorisation nor a qualifying application route covers this planned import as of 2 Nov. This is a supplied negative confirmation, not an inference from an empty file.",
  authorised: "The customs owner checked the importer identity, authorisation/account reference, operative validity and coverage of the 16 Nov import. This closes this readiness condition only; reporting, emissions basis, cost and customs admission remain separate.",
  application: "The customs owner checked the application reference, filing timing and eligibility of the application route under the operative rules for the 16 Nov import. An arbitrary pending application is insufficient. This closes this readiness condition only.",
  unknown: "No owner-confirmed readiness position is available. Missing evidence does not establish that authorisation is absent.",
  refused: "The importer declined to supply a readiness position. No negative legal conclusion is drawn from refusal.",
  delayed: "The importer expects to respond later. Readiness remains unresolved until a scoped record is received.",
};

/** All transitions are explicit record receipts. Revising scope invalidates old readiness. */
export function regulatoryReducer(state: RegulatoryState, event: RegulatoryEvent): RegulatoryState {
  if (event.type === "reset") return INITIAL_REGULATORY_STATE;
  const scope = latestScope(state);
  if (event.type === "record-readiness" && scope?.answer !== "covered") return state;
  const number = state.records.length + 1;
  const base = { id: `cbam-record-${number}`, receivedAt: new Date(Date.parse("2026-11-02T10:00:00+05:30") + number * 60000).toISOString(), synthetic: true as const };
  const record: CaseRecord = event.type === "record-scope"
    ? { ...base, kind: "scope", answer: event.answer, owner: "OEM logistics / customs broker", source: "Shipment scope check · sample broker record", detail: SCOPE_DETAIL[event.answer] }
    : { ...base, kind: "readiness", answer: event.answer, owner: "Importer / indirect customs representative", scopeRecordId: scope!.id, source: "Importer readiness response · sample owner record", detail: READINESS_DETAIL[event.answer] };
  const next = { ...state, records: [...state.records, record] };
  const version = state.assessments.length + 1;
  return { ...next, assessments: [...state.assessments, { version, predecessor: version - 1, recordId: record.id, finding: findingFor(next) }] };
}
