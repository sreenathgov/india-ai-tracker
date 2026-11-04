/**
 * Durgapur Heat Treatment — Heat-Treated Shaft Blanks, Wind Energy (c1).
 *
 * The forward-looking case. External signals reach an order only through a named
 * dependency: here, an approved petroleum-derived quench medium that the qualified
 * heat-treatment route cannot substitute without requalification. The chain runs
 * external intelligence → market forecast → supplier dependency → production timing
 * → mitigation → financial requirement, and stops at "potentially relevant".
 *
 * Everything here is synthetic. The quench-medium chain in particular is an
 * explicit extrapolation, recorded as such in `grounding.syntheticAssumptions`.
 */
import type { SupplierInvestigation } from "../types";

export const DURGAPUR: SupplierInvestigation = {
  id: "inv:c1:durgapur-heat-treatment",
  orderId: "c1",
  supplierId: "sup:durgapur-heat-treatment",
  componentIds: ["cmp:heat-treated-shaft-blanks"],
  status: { label: "Watching the input market", since: "2026-09-17" },
  primaryMechanism: "input-price-and-availability",
  secondaryMechanisms: ["material-allocation"],
  flagSentence:
    "The qualified heat-treatment route depends on one approved quench medium, and the cover on hand is well short of what the remaining route consumes.",

  inputCover: { label: "Quench-medium cover", days: 34, requiredDays: 83 },

  fracturePath: [
    {
      stage: "condition",
      label: "Upstream and market",
      statement:
        "A maritime route disruption and an upward-sloping forward curve are both on record for the base stock this medium is made from.",
      claimIds: ["dg-signal-1", "dg-signal-4"],
    },
    {
      stage: "dependency",
      label: "Approved quench medium",
      statement:
        "The qualified route names one approved medium; another grade cannot be dropped in without requalifying the route.",
      claimIds: ["dg-dependency", "dg-signal-2"],
    },
    {
      stage: "supplier",
      label: "Cover on hand",
      statement:
        "Confirmed inventory covers 34 days of treatment against 83 days of remaining route requirement, with distributor lead times lengthening.",
      claimIds: ["dg-signal-5", "dg-signal-3"],
    },
    {
      stage: "production",
      label: "Route timing",
      statement:
        "The shaft blanks for this order are treated inside that 83-day window, so the shortfall falls in the middle of the route rather than after it.",
      claimIds: ["dg-conclusion"],
    },
    {
      stage: "commitment",
      label: "Turbines 64–80",
      statement:
        "Seventeen units take heat-treated blanks from this route; an early purchase is the mitigation that keeps it whole.",
      claimIds: ["dg-conclusion", "dg-mitigation"],
    },
  ],

  claims: [
    {
      id: "dg-signal-1",
      claim:
        "A disruption on a maritime corridor that carries the base stock for this medium has been reported and is continuing.",
      claimType: "observation",
      confidence: "moderate",
      materiality: "contextual",
      observedAt: "2026-09-16",
      supportingEvidenceIds: ["dg-ev-route-disruption", "dg-ev-external-brief"],
      contradictingEvidenceIds: [],
      sourceIndependence: "independent",
      falsifiers: [],
      affectedDependencyIds: ["dg-dep-distributor"],
      affectedActionIds: ["dg-act-watch"],
    },
    {
      id: "dg-signal-2",
      claim:
        "Availability of the upstream base stock is reported reduced against its usual seasonal position.",
      claimType: "observation",
      confidence: "moderate",
      materiality: "contextual",
      observedAt: "2026-09-16",
      supportingEvidenceIds: ["dg-ev-upstream-availability"],
      contradictingEvidenceIds: [],
      sourceIndependence: "single-source",
      falsifiers: [],
      affectedDependencyIds: ["dg-dep-quench"],
      affectedActionIds: ["dg-act-watch"],
    },
    {
      id: "dg-signal-3",
      claim:
        "The distributor's quoted lead time for this medium has moved from two weeks to five weeks over the last two quotations.",
      claimType: "observation",
      confidence: "high",
      materiality: "contributing",
      observedAt: "2026-09-17",
      supportingEvidenceIds: ["dg-ev-distributor-note", "dg-ev-quotation"],
      contradictingEvidenceIds: [],
      sourceIndependence: "related",
      falsifiers: [],
      affectedDependencyIds: ["dg-dep-distributor"],
      affectedActionIds: ["dg-act-quote"],
    },
    {
      id: "dg-signal-4",
      claim:
        "The forward curve for this class of industrial process oil is upward-sloping across the next two months, implying a higher replacement cost than the last purchase.",
      claimType: "forecast",
      confidence: "moderate",
      materiality: "contributing",
      validFrom: "2026-09-17",
      forecastHorizon: {
        fromDays: 45,
        toDays: 60,
        basis: "base case, from the assessment date",
      },
      supportingEvidenceIds: ["dg-ev-forward-curve"],
      contradictingEvidenceIds: [],
      sourceIndependence: "single-source",
      competingExplanation:
        "A forward curve prices expectation, not outcome; a settled corridor would flatten it without any purchase being made.",
      falsifiers: [
        "A flat or downward forward curve at the next reading",
        "A held quotation at the previous price with the same terms",
      ],
      affectedDependencyIds: ["dg-dep-quench"],
      affectedActionIds: ["dg-act-quote", "dg-act-early-purchase"],
      figures: [
        {
          key: "replacement-cost-movement",
          label: "Implied replacement-cost movement",
          value: 11,
          upTo: 17,
          unit: "percent",
        },
      ],
    },
    {
      id: "dg-signal-5",
      claim:
        "Confirmed inventory of the approved medium covers 34 days of treatment, against 83 days of remaining requirement on this route.",
      claimType: "observation",
      confidence: "high",
      materiality: "controlling",
      observedAt: "2026-09-18",
      supportingEvidenceIds: ["dg-ev-inventory", "dg-ev-route-requirement"],
      contradictingEvidenceIds: [],
      sourceIndependence: "independent",
      falsifiers: [],
      affectedDependencyIds: ["dg-dep-quench", "dg-dep-furnace"],
      affectedActionIds: ["dg-act-early-purchase"],
      figures: [
        { key: "quench-medium-cover", label: "Cover on hand", value: 34, unit: "days" },
        { key: "remaining-requirement", label: "Remaining route requirement", value: 83, unit: "days" },
      ],
    },
    {
      id: "dg-dependency",
      claim:
        "This is a route dependency rather than a commodity view: the qualified heat-treatment route names one approved medium, and substituting a grade would require requalification before any blank could be released.",
      claimType: "inference",
      confidence: "high",
      materiality: "controlling",
      validFrom: "2026-09-17",
      supportingEvidenceIds: ["dg-ev-route-requirement", "dg-ev-inventory"],
      contradictingEvidenceIds: [],
      sourceIndependence: "related",
      competingExplanation:
        "A second approved medium may already sit on the route specification and simply not appear on the extract held.",
      falsifiers: [
        "A route specification naming a second approved medium",
        "A requalification record already closed for an alternative grade",
      ],
      affectedDependencyIds: ["dg-dep-quench"],
      affectedActionIds: ["dg-act-confirm-spec"],
    },
    {
      id: "dg-conclusion",
      claim:
        "Current evidence indicates a material probability that replacement cost and availability will tighten before this production route completes.",
      claimType: "forecast",
      confidence: "moderate",
      materiality: "controlling",
      validFrom: "2026-09-18",
      forecastHorizon: {
        fromDays: 34,
        toDays: 83,
        basis: "from the end of confirmed cover to the end of the remaining route requirement",
      },
      supportingEvidenceIds: [
        "dg-ev-forward-curve",
        "dg-ev-inventory",
        "dg-ev-route-requirement",
        "dg-ev-distributor-note",
      ],
      contradictingEvidenceIds: [],
      sourceIndependence: "related",
      competingExplanation:
        "A protected allocation or a fixed-price agreement, absent from the evidence held, would settle both cost and availability for this route.",
      falsifiers: [
        "An allocation or supply agreement covering the remaining requirement",
        "A current quotation at the previous price with a confirmed replenishment date",
        "Approved-input inventory above the remaining requirement",
      ],
      affectedDependencyIds: ["dg-dep-quench", "dg-dep-distributor"],
      affectedActionIds: ["dg-act-early-purchase", "dg-act-quote"],
    },
    {
      id: "dg-mitigation",
      claim:
        "If the remaining requirement were bought forward at today's quotation, the purchase would be about ₹62 lakh against ₹21 lakh of evidenced liquidity, leaving ₹41 lakh unfunded.",
      claimType: "scenario",
      confidence: "moderate",
      materiality: "contributing",
      validFrom: "2026-09-18",
      forecastHorizon: {
        fromDays: 0,
        toDays: 34,
        basis: "the window in which an early purchase is still ahead of the shortfall",
      },
      supportingEvidenceIds: ["dg-ev-quotation", "dg-ev-liquidity", "dg-ev-route-requirement"],
      contradictingEvidenceIds: [],
      sourceIndependence: "related",
      falsifiers: [
        "A liquidity statement covering the purchase in full",
        "A supplier decision not to buy forward, with the route protected another way",
      ],
      affectedDependencyIds: ["dg-dep-quench", "dg-dep-working-capital"],
      affectedActionIds: ["dg-act-early-purchase", "dg-act-establish-liquidity"],
      figures: [
        { key: "early-purchase", label: "Early purchase", value: 62, unit: "lakh" },
        { key: "available-liquidity", label: "Evidenced liquidity", value: 21, unit: "lakh" },
        { key: "liquidity-gap", label: "Unfunded", value: 41, unit: "lakh" },
      ],
    },
  ],

  unresolved: [
    {
      id: "dg-un-allocation",
      statement:
        "Whether a protected future allocation or a fixed-price agreement exists for the approved medium. Nothing in the evidence held shows one.",
      resolvedBy: "dg-req-agreement",
    },
    {
      id: "dg-un-replenishment",
      statement: "When the distributor expects its next replenishment of this grade.",
      resolvedBy: "dg-req-replenishment",
    },
    {
      id: "dg-un-spec",
      statement: "Whether a second medium is approved on the route specification.",
      resolvedBy: "dg-req-inventory",
    },
  ],

  competingExplanation: {
    statement:
      "A protected allocation or a fixed-price agreement may already cover the remaining requirement and simply be absent from the evidence held. If one exists, the cost and availability view falls away and only the route dependency remains.",
    falsifiers: [
      "An allocation or supply agreement covering the remaining route requirement",
      "A current quotation held at the previous price with a confirmed replenishment date",
    ],
    claimIds: ["dg-conclusion", "dg-signal-4"],
  },

  nextBestEvidence: [
    {
      id: "dg-req-agreement",
      request: "The allocation or supply agreement for the approved quench medium, if one is held",
      owner: "Supplier procurement",
      resolves: "Whether cost and availability are already protected",
    },
    {
      id: "dg-req-inventory",
      request: "Current approved-input inventory, with the route specification it is qualified against",
      owner: "Supplier planning",
      resolves: "The true cover, and whether a second grade is approved",
    },
    {
      id: "dg-req-quotation",
      request: "The latest quotation for the medium, with price, quantity and terms",
      owner: "Procurement",
      resolves: "What an early purchase would actually cost",
    },
    {
      id: "dg-req-replenishment",
      request: "The distributor's expected replenishment date for this grade",
      owner: "Supplier procurement",
      resolves: "Whether the shortfall lands inside the route window",
    },
  ],

  interventionPosture: {
    stance: "prepare",
    summary:
      "Establish whether an allocation already protects the route. If none exists, size an early purchase against the remaining requirement while cover still runs, rather than waiting for the shortfall to arrive.",
  },

  financeRelevance: {
    state: "potentially-relevant",
    reason:
      "Working capital is reached here only through the mitigation: the exposure is evidenced, an early purchase is the viable response, and the gap between that purchase and evidenced liquidity is what a facility would close. Concern about the supplier is not the reason.",
    chain: [
      "The exposure is evidenced: cover of 34 days against 83 days of remaining route requirement",
      "An early purchase is a viable mitigation while cover still runs, sized at about ₹62 lakh",
      "Evidenced liquidity of ₹21 lakh leaves ₹41 lakh of the mitigation unfunded",
      "Only that evidenced gap reaches the standing working capital pathway; the lender retains credit authority",
    ],
  },

  dependencies: [
    { id: "dg-dep-quench", label: "Approved quench medium", kind: "process-input" },
    { id: "dg-dep-distributor", label: "Medium distributor", kind: "logistics" },
    { id: "dg-dep-furnace", label: "Qualified furnace capacity", kind: "capacity" },
    { id: "dg-dep-working-capital", label: "Purchase funding", kind: "finance" },
  ],

  evidence: [
    {
      id: "dg-ev-route-disruption",
      sourceType: "logistics-intelligence",
      sourceName: "Global Shipping Intelligence",
      sourceDate: "2026-09-16",
      retrievedAt: "2026-09-16T05:30:00Z",
      scope: "Corridor status and routing changes affecting base-stock movements",
      independence: { kind: "independent", relatedTo: [] },
      synthetic: true,
    },
    {
      id: "dg-ev-external-brief",
      sourceType: "external-intelligence",
      sourceName: "Regional Maritime Disruption Brief",
      sourceDate: "2026-09-16",
      retrievedAt: "2026-09-16T05:35:00Z",
      scope: "Duration and scope of the reported corridor disruption",
      independence: { kind: "independent", relatedTo: [] },
      synthetic: true,
    },
    {
      id: "dg-ev-upstream-availability",
      sourceType: "market-data",
      sourceName: "Industrial Base Oils Availability Summary",
      sourceDate: "2026-09-16",
      retrievedAt: "2026-09-16T05:40:00Z",
      scope: "Reported availability of the upstream base stock",
      independence: { kind: "single-source", relatedTo: ["dg-ev-forward-curve"] },
      synthetic: true,
    },
    {
      id: "dg-ev-forward-curve",
      sourceType: "market-data",
      sourceName: "Industrial Process Oils Forward Curve",
      sourceDate: "2026-09-17",
      retrievedAt: "2026-09-17T06:00:00Z",
      scope: "Two-month forward prices for this class of process oil",
      independence: { kind: "single-source", relatedTo: ["dg-ev-upstream-availability"] },
      synthetic: true,
    },
    {
      id: "dg-ev-distributor-note",
      sourceType: "supplier-communication",
      sourceName: "Distributor Lead-Time Note",
      sourceDate: "2026-09-17",
      retrievedAt: "2026-09-17T08:10:00Z",
      scope: "Quoted lead time for the approved grade",
      independence: { kind: "related", relatedTo: ["dg-ev-quotation"] },
      synthetic: true,
    },
    {
      id: "dg-ev-quotation",
      sourceType: "supplier-communication",
      sourceName: "Quench Medium Quotation",
      sourceDate: "2026-09-17",
      retrievedAt: "2026-09-17T08:12:00Z",
      scope: "Price, quantity and terms for the approved grade",
      independence: { kind: "related", relatedTo: ["dg-ev-distributor-note"] },
      synthetic: true,
    },
    {
      id: "dg-ev-inventory",
      sourceType: "supplier-record",
      sourceName: "Supplier Inventory Extract",
      sourceDate: "2026-09-18",
      retrievedAt: "2026-09-18T04:05:00Z",
      scope: "Approved-input inventory held at the heat-treatment shop",
      independence: { kind: "independent", relatedTo: [] },
      synthetic: true,
    },
    {
      id: "dg-ev-route-requirement",
      sourceType: "erp-planning",
      sourceName: "Heat-Treatment Route Requirement",
      sourceDate: "2026-09-18",
      retrievedAt: "2026-09-18T04:08:00Z",
      scope: "Remaining treatment days and medium consumption for this order",
      independence: { kind: "independent", relatedTo: [] },
      synthetic: true,
    },
    {
      id: "dg-ev-liquidity",
      sourceType: "financial-data",
      sourceName: "Supplier Liquidity Statement",
      sourceDate: "2026-09-18",
      retrievedAt: "2026-09-18T04:30:00Z",
      scope: "Declared liquidity available for input purchases this month",
      independence: { kind: "single-source", relatedTo: [] },
      synthetic: true,
    },
  ],

  actions: [
    {
      id: "dg-act-confirm-spec",
      label: "Confirm whether a second medium is approved on the route",
      kind: "verify",
      feasibility: "feasible",
      condition: "The route specification is held by supplier quality.",
    },
    {
      id: "dg-act-quote",
      label: "Take a current quotation with quantity, price and terms",
      kind: "verify",
      feasibility: "feasible",
      condition: "The distributor quotes on request; it also dates the lead-time move.",
    },
    {
      id: "dg-act-early-purchase",
      label: "Buy the remaining requirement forward while cover still runs",
      kind: "procure",
      feasibility: "conditional",
      condition:
        "Only if no allocation already protects the route, and only if the purchase can be funded.",
    },
    {
      id: "dg-act-establish-liquidity",
      label: "Establish the gap between the purchase and evidenced liquidity",
      kind: "verify",
      feasibility: "feasible",
      condition: "It is the gate on any finance conversation; without it there is no sized request.",
    },
    {
      id: "dg-act-watch",
      label: "Keep the corridor and the curve under watch",
      kind: "hold",
      feasibility: "feasible",
      condition: "A settled corridor would close this exposure without any purchase.",
    },
  ],

  temporal: {
    eventAt: "2026-09-14",
    publishedAt: "2026-09-16",
    observedAt: "2026-09-16",
    assessedAt: "2026-09-18",
    forecastHorizon: { fromDays: 45, toDays: 60, basis: "base case, from the assessment date" },
  },

  grounding: {
    groundingRefs: ["DEMO:1"],
    syntheticAssumptions: [
      "The quench-medium chain has no direct research grounding. It is an explicit extrapolation from the external-shock and physical-resource patterns to a process input, authored to demonstrate transmission through a named route dependency.",
      "Cover, requirement, curve movement and liquidity are invented figures sized to the demonstration.",
      "The cover figure is process-input cover for the quench medium, deliberately distinct from the assembly's own coverage days on the bill of materials.",
    ],
  },
};
