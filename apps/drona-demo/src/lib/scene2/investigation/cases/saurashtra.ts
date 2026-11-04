/**
 * Saurashtra Ductile Castings — Rotor Hub Casting, Wind Energy (c1).
 *
 * Mechanism: a material commitment the supplier has not placed, with liquidity as
 * the candidate reason. Finance becomes relevant only once cash is established as
 * the binding constraint — not because the supplier is under concern.
 * Everything here is synthetic.
 */
import type { SupplierInvestigation } from "../types";

export const SAURASHTRA: SupplierInvestigation = {
  id: "inv:c1:saurashtra-ductile-castings",
  orderId: "c1",
  supplierId: "sup:saurashtra-ductile-castings",
  componentIds: ["cmp:rotor-hub-casting"],
  status: { label: "Awaiting material commitment", since: "2026-09-14" },
  primaryMechanism: "material-commitment",
  secondaryMechanisms: ["supplier-liquidity"],
  flagSentence:
    "The charge material for the hub melt campaign has not been committed, and the supplier's stated purchasing headroom is below what the campaign needs.",

  fracturePath: [
    {
      stage: "condition",
      label: "Terms tightened",
      statement:
        "A ferro-alloy supplier moved this buyer from 60-day to 30-day payment terms.",
      claimIds: ["sa-terms-tightened"],
    },
    {
      stage: "dependency",
      label: "Charge material",
      statement:
        "The melt campaign needs pig iron, ferro-alloys and nodularisers bought as one commitment.",
      claimIds: ["sa-charge-not-placed"],
    },
    {
      stage: "supplier",
      label: "Purchasing headroom",
      statement:
        "Stated headroom is below the campaign's purchase value, which is the candidate reason the order is unplaced.",
      claimIds: ["sa-headroom", "sa-cash-binding"],
    },
    {
      stage: "production",
      label: "Melt campaign",
      statement:
        "Unless the material is committed, the October melt campaign for these hubs cannot be loaded.",
      claimIds: ["sa-melt-scenario"],
    },
    {
      stage: "commitment",
      label: "Turbines 41–64",
      statement: "Twenty-four units on this order take hubs from that campaign.",
      claimIds: ["sa-melt-scenario"],
    },
  ],

  claims: [
    {
      id: "sa-charge-not-placed",
      claim:
        "No purchase order has been raised for the charge material the October hub melt campaign requires.",
      claimType: "observation",
      confidence: "high",
      materiality: "controlling",
      observedAt: "2026-09-14",
      supportingEvidenceIds: ["sa-ev-melt-plan", "sa-ev-po-extract"],
      contradictingEvidenceIds: [],
      sourceIndependence: "independent",
      falsifiers: [],
      affectedDependencyIds: ["sa-dep-pig-iron", "sa-dep-ferro-alloys", "sa-dep-nodularisers"],
      affectedActionIds: ["sa-act-confirm-stock"],
    },
    {
      id: "sa-terms-tightened",
      claim:
        "A ferro-alloy supplier moved this buyer from 60-day to 30-day terms in its August quotation.",
      claimType: "observation",
      confidence: "high",
      materiality: "contributing",
      observedAt: "2026-09-10",
      supportingEvidenceIds: ["sa-ev-quotation"],
      contradictingEvidenceIds: [],
      sourceIndependence: "single-source",
      falsifiers: [],
      affectedDependencyIds: ["sa-dep-ferro-alloys"],
      affectedActionIds: ["sa-act-terms"],
    },
    {
      id: "sa-headroom",
      claim:
        "The supplier's stated purchasing headroom for the month is below the value of the campaign's material commitment.",
      claimType: "observation",
      confidence: "moderate",
      materiality: "contributing",
      observedAt: "2026-09-16",
      supportingEvidenceIds: ["sa-ev-headroom-statement"],
      contradictingEvidenceIds: [],
      sourceIndependence: "single-source",
      falsifiers: [],
      affectedDependencyIds: ["sa-dep-working-capital"],
      affectedActionIds: ["sa-act-establish-cash"],
      figures: [
        { key: "campaign-material-value", label: "Campaign material value", value: 48, unit: "lakh" },
        { key: "stated-headroom", label: "Stated purchasing headroom", value: 19, unit: "lakh" },
      ],
    },
    {
      id: "sa-cash-binding",
      claim:
        "Cash, rather than material availability, is the candidate binding constraint: the alloys are quoted as available, and the commitment is the step that has not moved.",
      claimType: "inference",
      confidence: "moderate",
      materiality: "controlling",
      validFrom: "2026-09-16",
      supportingEvidenceIds: ["sa-ev-quotation", "sa-ev-headroom-statement", "sa-ev-po-extract"],
      contradictingEvidenceIds: [],
      sourceIndependence: "related",
      competingExplanation:
        "The order may be unplaced because a grade or price is still being settled, with cash irrelevant to the delay.",
      falsifiers: [
        "A signed purchase order for the charge material at the current headroom",
        "A held quotation showing an unresolved grade or price point",
        "Allocated stock already on the foundry's own floor",
      ],
      affectedDependencyIds: ["sa-dep-working-capital", "sa-dep-ferro-alloys"],
      affectedActionIds: ["sa-act-establish-cash"],
    },
    {
      id: "sa-melt-scenario",
      claim:
        "If the charge material is not committed before the intervention window closes, the October melt campaign cannot be loaded and the hubs for turbines 41 to 64 move to the following campaign.",
      claimType: "scenario",
      confidence: "moderate",
      materiality: "contributing",
      validFrom: "2026-09-18",
      forecastHorizon: {
        fromDays: 36,
        toDays: 58,
        basis: "from the assessment date to the next melt campaign",
      },
      supportingEvidenceIds: ["sa-ev-melt-plan"],
      contradictingEvidenceIds: [],
      sourceIndependence: "drona-derived",
      falsifiers: [
        "A melt plan showing the hubs poured from material already on site",
        "A confirmed campaign date inside the window",
      ],
      affectedDependencyIds: ["sa-dep-pig-iron"],
      affectedActionIds: ["sa-act-confirm-stock", "sa-act-establish-cash"],
    },
  ],

  unresolved: [
    {
      id: "sa-un-stock",
      statement:
        "Whether charge material already on the foundry's floor is allocated to this campaign or to other work.",
      resolvedBy: "sa-req-stock",
    },
    {
      id: "sa-un-facility",
      statement:
        "Whether the supplier holds an unused facility that would cover the commitment without further support.",
      resolvedBy: "sa-req-facility",
    },
    {
      id: "sa-un-grade",
      statement: "Whether an open grade or price question is holding the order rather than cash.",
      resolvedBy: "sa-req-quotation",
    },
  ],

  competingExplanation: {
    statement:
      "Material may already be on the floor but unallocated, or the commitment may be held by an unsettled grade or price rather than by cash — in which case working capital changes nothing.",
    falsifiers: [
      "A stock ledger showing allocated charge material for this campaign",
      "A current quotation with an open grade or price point",
    ],
    claimIds: ["sa-cash-binding", "sa-charge-not-placed"],
  },

  nextBestEvidence: [
    {
      id: "sa-req-stock",
      request: "Charge-material stock ledger with allocation against the October campaign",
      owner: "Supplier planning",
      resolves: "Whether material is already secured and the flag falls away",
    },
    {
      id: "sa-req-quotation",
      request: "The current alloy quotation, with grade, price and terms",
      owner: "Procurement",
      resolves: "Whether the delay is commercial rather than cash",
    },
    {
      id: "sa-req-facility",
      request: "Confirmation of available purchasing facility for the month",
      owner: "Supplier finance",
      resolves: "Whether cash is genuinely the binding constraint",
    },
  ],

  interventionPosture: {
    stance: "verify-first",
    summary:
      "Establish what is holding the commitment before offering any support. If stock is allocated or a quotation is open, the exposure closes without finance; if headroom is the blocker, the working-capital pathway becomes worth opening.",
  },

  financeRelevance: {
    state: "potentially-relevant",
    reason:
      "Working capital bears on this exposure only if cash is established as the binding constraint. On today's evidence that is a candidate reading, not a finding.",
    chain: [
      "The exposure is evidenced: an uncommitted material purchase against a dated melt campaign",
      "Material availability is not the blocker — the alloys are quoted as available",
      "Purchasing headroom is evidenced below the commitment value",
      "Only then does the standing working-capital pathway apply; the lender retains credit authority",
    ],
  },

  dependencies: [
    {
      id: "sa-dep-ferro-alloys",
      label: "Ferro-alloy supply",
      kind: "material",
      subTierNodeId: "st:rajkot-ferro-alloy-traders",
    },
    {
      id: "sa-dep-pig-iron",
      label: "Foundry pig iron",
      kind: "material",
      subTierNodeId: "st:haldia-foundry-pig-iron",
    },
    {
      id: "sa-dep-nodularisers",
      label: "Nodularisers",
      kind: "material",
      subTierNodeId: "st:nagpur-nodularisers",
    },
    { id: "sa-dep-working-capital", label: "Purchasing headroom", kind: "finance" },
  ],

  evidence: [
    {
      id: "sa-ev-melt-plan",
      sourceType: "supplier-record",
      sourceName: "Melt Campaign Plan",
      sourceDate: "2026-09-12",
      retrievedAt: "2026-09-14T07:10:00Z",
      scope: "October hub campaign, charge weights and dates",
      independence: { kind: "related", relatedTo: ["sa-ev-headroom-statement"] },
      synthetic: true,
    },
    {
      id: "sa-ev-po-extract",
      sourceType: "erp-planning",
      sourceName: "Purchase Order Extract",
      sourceDate: "2026-09-14",
      retrievedAt: "2026-09-14T07:12:00Z",
      scope: "Open and released material orders against the campaign",
      independence: { kind: "independent", relatedTo: [] },
      synthetic: true,
    },
    {
      id: "sa-ev-quotation",
      sourceType: "supplier-communication",
      sourceName: "Alloy Quotation",
      sourceDate: "2026-08-28",
      retrievedAt: "2026-09-10T09:30:00Z",
      scope: "Grade, price and payment terms for the campaign's alloys",
      independence: { kind: "independent", relatedTo: [] },
      synthetic: true,
    },
    {
      id: "sa-ev-headroom-statement",
      sourceType: "financial-data",
      sourceName: "Supplier Purchasing Headroom Statement",
      sourceDate: "2026-09-16",
      retrievedAt: "2026-09-16T10:05:00Z",
      scope: "Declared purchasing headroom for the month",
      independence: { kind: "single-source", relatedTo: ["sa-ev-melt-plan"] },
      synthetic: true,
    },
  ],

  actions: [
    {
      id: "sa-act-confirm-stock",
      label: "Confirm whether charge material is on the floor and allocated",
      kind: "verify",
      feasibility: "feasible",
      condition: "The stock ledger sits with supplier planning.",
    },
    {
      id: "sa-act-establish-cash",
      label: "Establish whether headroom is the binding constraint",
      kind: "verify",
      feasibility: "feasible",
      condition: "Requires the facility confirmation; it is the gate on any finance conversation.",
    },
    {
      id: "sa-act-terms",
      label: "Test whether the alloy supplier will restore longer terms",
      kind: "procure",
      feasibility: "conditional",
      condition: "Only meaningful if the tightened terms are what stopped the commitment.",
    },
  ],

  temporal: {
    eventAt: "2026-08-28",
    observedAt: "2026-09-10",
    assessedAt: "2026-09-18",
  },

  grounding: {
    groundingRefs: ["DEMO:1"],
    syntheticAssumptions: [
      "Headroom and campaign values are invented figures sized to the demonstration.",
      "The terms change is an authored instance of the pattern, not an observed commercial event.",
    ],
  },
};
