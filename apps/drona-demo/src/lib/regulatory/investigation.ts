import type { Claim, EvidenceItem, SupplierInvestigation } from "@/lib/scene2/investigation/types";
import { FINDING_LABEL, REGULATORY_CASE, findingFor, findingClosed, latestScope, latestReadiness, SCOPE_REPLY_LABEL, READINESS_REPLY_LABEL, type RegulatoryState } from "./state";

export const CBAM_SOURCES = [
  { id: "cbam-rule", title: "European Commission · CBAM overview", url: "https://taxation-customs.ec.europa.eu/carbon-border-adjustment-mechanism_en", scope: "Definitive regime from 1 Jan 2026; covered goods, thresholds and importer requirements. Scope and exceptions must be checked." },
  { id: "cbam-guidance", title: "European Commission · current CBAM factsheets", url: "https://taxation-customs.ec.europa.eu/carbon-border-adjustment-mechanism/cbam-communication-and-news_en", scope: "Authorisation/account or qualifying application-reference route for relevant imports; actual or permitted default emissions values. Checked 2 Nov 2026." },
  { id: "cbam-towers", title: "EUR-Lex · CBAM benchmark regulation, tower entry", url: "https://eur-lex.europa.eu/eli/reg_impl/2025/2620/oj/eng", scope: "Steel structures/towers appear in CBAM-related tables under CN 7308. Does not classify the actual shipment or a complete turbine." },
] as const;

export function regulatorySummary(state: RegulatoryState): string {
  switch (findingFor(state)) {
    case "applicability-review": return "A Danish destination makes CBAM worth checking. The actual shipped article, importer and exception position are still needed before this becomes an applicable obligation.";
    case "readiness-review": return "The supplied scope check places these separately imported tower sections within CBAM. The importer's authorisation or qualifying application route is still unconfirmed.";
    case "gap-confirmed": return "The importer confirms neither authorisation nor a qualifying application route for the covered shipment. If the gap remains open at entry, the planned import route may not be available in time for the order.";
    case "condition-evidenced": return "An owner-checked eligible route now covers this import. This closes the readiness condition; it does not establish customs admission or settle emissions, reporting and carbon cost.";
    case "scope-excluded": return "The supplied customs-owner record excludes this shipment from the selected obligation. This regulatory path is closed for this shipment; other orders and duties are unaffected.";
  }
}

/** One projection for Overview, evidence, Actions and the deeper component pathway. */
export function regulatoryInvestigation(state: RegulatoryState): SupplierInvestigation {
  const finding = findingFor(state), scope = latestScope(state), readiness = latestReadiness(state);
  const covered = scope?.answer === "covered", closed = findingClosed(finding);
  const latest = state.records[state.records.length - 1];
  const evidence: EvidenceItem[] = [
    ...CBAM_SOURCES.map((s) => ({ id: s.id, sourceType: "regulatory-source" as const, sourceName: s.title, sourceDate: "2026-11-02", sourceDateKind: "reviewed" as const, retrievedAt: "2026-11-02T03:30:00Z", scope: s.scope + " Review date is distinct from the rule's publication and legal-effect dates.", independence: { kind: "related" as const, relatedTo: CBAM_SOURCES.filter((x) => x.id !== s.id).map((x) => x.id) }, synthetic: false, url: s.url })),
    { id: "cbam-plan", sourceType: "erp-planning", sourceName: "Wind Energy · sample component and import plan", sourceDate: "2026-11-02", retrievedAt: "2026-11-02T04:00:00Z", scope: "Section sets for turbines 53–80; India → Denmark; planned EU entry 16 Nov, programme required by 18 Nov. Shipment form and importer scope initially unconfirmed.", independence: { kind: "single-source", relatedTo: [] }, synthetic: true },
    ...state.records.map((r) => ({ id: r.id, sourceType: "oem-record" as const, sourceName: r.source, sourceDate: r.receivedAt.slice(0, 10), retrievedAt: r.receivedAt, scope: `${r.owner}. ${r.detail}${r.kind === "readiness" ? ` Scope basis: ${r.scopeRecordId}.` : ""}`, independence: { kind: "related" as const, relatedTo: state.records.filter((x) => x.id !== r.id).map((x) => x.id) }, synthetic: true })),
  ];
  const claim = (id: string, text: string, ids: readonly string[], type: Claim["claimType"] = "observation", materiality: Claim["materiality"] = "contributing"): Claim => ({
    id, claim: text, claimType: type, confidence: type === "scenario" ? "moderate" : "high", materiality,
    ...(type === "observation" ? { observedAt: "2026-11-02" } : { validFrom: "2026-11-02" }),
    supportingEvidenceIds: ids, contradictingEvidenceIds: [], sourceIndependence: type === "observation" ? ids.length > 1 ? "related" : "single-source" : "drona-derived",
    falsifiers: type === "observation" ? [] : ["A revised classification, applicable exemption, or eligible importer route changes this conclusion."],
    affectedDependencyIds: ["cbam-dep-scope", "cbam-dep-importer"], affectedActionIds: ["cbam-act-scope", "cbam-act-readiness"],
  });
  const basis = ["cbam-rule", "cbam-guidance", "cbam-plan", ...(scope ? [scope.id] : []), ...(readiness ? [readiness.id] : [])];
  const claims: Claim[] = [
    claim("cbam-cl-rule", "CBAM's definitive regime is in force from 1 Jan 2026 for covered imports, subject to scope, threshold, exceptions and operative authorisation/application rules.", ["cbam-rule", "cbam-guidance", "cbam-towers"]),
    claim("cbam-cl-plan", "The authored plan links Tiruchi section sets to turbines 53–80 of Wind Energy's 100-unit Denmark programme, with planned EU entry on 16 Nov.", ["cbam-plan"]),
    ...(scope ? [claim("cbam-cl-scope", `${SCOPE_REPLY_LABEL[scope.answer]}. ${scope.detail}`, [scope.id], "observation", "controlling")] : []),
    ...(readiness ? [claim("cbam-cl-readiness", `${READINESS_REPLY_LABEL[readiness.answer]}. ${readiness.detail}`, [readiness.id], "observation", "controlling")] : []),
    claim("cbam-cl-assessment", regulatorySummary(state), basis, "inference", "controlling"),
  ];
  if (!closed) claims.push({ ...claim("cbam-cl-entry", covered
    ? "If no eligible authorisation or qualifying application route covers the goods at entry on 16 Nov, the planned import may be delayed or require a different lawful arrangement; the dependent installation sequence would need review. No certain customs detention is predicted."
    : "If the actual shipment is covered and the importer lacks an eligible route at entry, import readiness may affect the dependent order. Applicability and readiness require owner evidence.", basis, "scenario", "controlling"),
    forecastHorizon: { fromDays: 14, toDays: 16, basis: "2 Nov assessment to 16 Nov entry and 18 Nov programme requirement; conditional scenario, not a measured probability" },
  });
  return {
    id: "inv:c1:tiruchi-tower-sections", orderId: REGULATORY_CASE.orderId, supplierId: REGULATORY_CASE.supplierId, componentIds: [REGULATORY_CASE.componentId],
    status: { label: FINDING_LABEL[finding], since: latest?.receivedAt.slice(0, 10) ?? REGULATORY_CASE.assessedOn },
    primaryMechanism: "regulatory-import-readiness", secondaryMechanisms: [], flagSentence: regulatorySummary(state),
    fracturePath: [
      { stage: "condition", label: "EU CBAM · in force", statement: "Published requirement for covered imports. Effective 1 Jan 2026.", claimIds: ["cbam-cl-rule"] },
      { stage: "dependency", label: "Actual shipped article", statement: scope ? SCOPE_REPLY_LABEL[scope.answer] : "Separately imported sections? Classification, procedure, threshold and exceptions need checking.", claimIds: scope ? ["cbam-cl-scope"] : ["cbam-cl-plan"] },
      { stage: "supplier", label: "Responsible importer", statement: covered ? "Wind Energy Import Services · fictional importer. Either eligible route must cover this import." : "Identify the importer or indirect representative through the customs owner.", claimIds: readiness ? ["cbam-cl-readiness"] : ["cbam-cl-assessment"] },
      { stage: "production", label: "EU entry · 16 Nov", statement: closed ? "This readiness path is closed on the recorded basis; other import obligations remain." : "Resolve before entry. Preparation lead time is not yet evidenced.", claimIds: ["cbam-cl-assessment"] },
      { stage: "commitment", label: "Turbines 53–80", statement: "28 units depend on these sections. This mapping does not confirm a delivery failure.", claimIds: ["cbam-cl-plan"] },
    ],
    claims,
    unresolved: closed ? [{ id: "cbam-un-other", statement: "Emissions basis, reporting and carbon cost remain separate obligations; readiness closure does not settle them." }] : [
      ...(!covered ? [{ id: "cbam-un-scope", statement: "Does this requirement apply to the actual shipment and importer after threshold and exceptions are checked?", resolvedBy: "cbam-req-scope" }] : []),
      { id: "cbam-un-readiness", statement: finding === "gap-confirmed" ? "Which lawful route can the customs owner establish before 16 Nov, and how long will it take?" : "Does a valid authorisation or qualifying application route cover this import?", resolvedBy: "cbam-req-readiness" },
    ],
    competingExplanation: { statement: closed ? "Closure is limited to the checked scope and entry date. A changed article, importer, rule or validity period reopens the question." : "The article may be outside scope, an exemption may apply, or an eligible route may already exist outside the held file. Missing documents alone do not prove a gap.", falsifiers: ["Customs-owner scope/exemption record", "Owner-checked authorisation or eligible application reference for this entry"], claimIds: ["cbam-cl-assessment"] },
    nextBestEvidence: closed ? [] : [
      ...(!covered ? [{ id: "cbam-req-scope", request: "Classification, procedure, origin, importer, annual threshold and exception check", owner: "OEM logistics / customs broker", resolves: "Whether this obligation applies to this shipment" }] : []),
      { id: "cbam-req-readiness", request: "Owner-checked authorisation/account or qualifying application reference for 16 Nov entry", owner: "Importer / indirect customs representative", resolves: "Readiness, eligibility and timing; a negative reply must explicitly address both routes" },
    ],
    interventionPosture: { stance: finding === "gap-confirmed" ? "act-now" : "verify-first", summary: closed ? "Retain the checked record and monitor scope or validity changes. Keep emissions/reporting and cost work separate." : finding === "gap-confirmed" ? "The customs owner should establish an eligible route before entry and confirm preparation time; review installation sequencing if the planned import cannot proceed in time." : "Ask through the authorised OEM/customs owner, record the response, and reassess. No automatic outreach or legal decision is made." },
    financeRelevance: { state: "not-presently-relevant", reason: "Working capital cannot substitute for regulatory authorisation. Carbon cost and permitted emissions/default-value choices are separate; missing actual verified emissions data alone is not an automatic import block." },
    dependencies: [{ id: "cbam-dep-scope", label: "Covered shipment and customs scope", kind: "regulatory" }, { id: "cbam-dep-importer", label: "Eligible importer route", kind: "regulatory" }],
    evidence,
    actions: [
      { id: "cbam-act-scope", label: "Record the customs owner's scope check", kind: "verify", feasibility: "feasible", condition: "Received evidence only; classify the shipped article, not the whole turbine by its component material." },
      { id: "cbam-act-readiness", label: "Record importer readiness and reassess", kind: "verify", feasibility: covered ? "feasible" : "conditional", condition: "Requires covered scope; validate either eligible route for this entry." },
    ],
    temporal: { observedAt: "2026-11-02", assessedAt: "2026-11-02", regulatory: { stage: "legal-effect", at: "2026-01-01" } },
    regulatory: { rule: "EU CBAM", jurisdiction: "India → Denmark / EU", legalStatus: "In force", effectiveOn: "2026-01-01", entryOn: "2026-11-16", finding, assessmentVersion: state.assessments.length },
    grounding: { groundingRefs: CBAM_SOURCES.map((s) => s.url), syntheticAssumptions: ["Counterparties, classification, customs scope, private responses and entry dates are authored demo facts. Public rules are linked separately.", "No live monitoring, customs integration, legal determination, probability or proven warning performance is implemented."] },
  };
}
