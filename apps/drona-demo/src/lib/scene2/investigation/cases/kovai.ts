/**
 * Kovai Castings & Machining — Main Bearing Housing, Wind Energy (c1).
 *
 * Mechanism: an unresolved technical disposition. An indication was reported; the
 * evidence does not yet tie it to a casting, a heat and a critical volume, and no
 * one has recorded who may authorise a repair or a recast. Finance is closed here
 * by construction: money cannot make a casting acceptable. Everything is synthetic.
 */
import type { SupplierInvestigation } from "../types";

export const KOVAI: SupplierInvestigation = {
  id: "inv:c1:kovai-castings-machining",
  orderId: "c1",
  supplierId: "sup:kovai-castings-machining",
  componentIds: ["cmp:main-bearing-housing"],
  status: { label: "Awaiting technical disposition", since: "2026-09-13" },
  primaryMechanism: "technical-disposition",
  secondaryMechanisms: [],
  flagSentence:
    "An ultrasonic indication found at rough boring has not been tied to a heat or a critical volume, and no disposition authority is recorded for repair or recast.",

  fracturePath: [
    {
      stage: "condition",
      label: "Indication",
      statement: "An ultrasonic indication was reported on a bearing housing at rough boring.",
      claimIds: ["kv-indication"],
    },
    {
      stage: "dependency",
      label: "Traceability",
      statement:
        "The report names the casting but not the heat, so the pour it came from cannot be bounded.",
      claimIds: ["kv-heat-unlinked"],
    },
    {
      stage: "supplier",
      label: "Disposition authority",
      statement:
        "Who may authorise a weld repair, and who must instead call a recast, is not recorded for this class of casting.",
      claimIds: ["kv-authority-unrecorded"],
    },
    {
      stage: "production",
      label: "Release",
      statement:
        "Machining cannot proceed to final bore until the housings are dispositioned and released.",
      claimIds: ["kv-release-scenario"],
    },
    {
      stage: "commitment",
      label: "Turbines 47–58",
      statement:
        "Twelve units depend on housings from the pours the indication may have come from.",
      claimIds: ["kv-release-scenario", "kv-heat-unlinked"],
    },
  ],

  claims: [
    {
      id: "kv-indication",
      claim:
        "An ultrasonic indication above the reporting threshold was recorded on one bearing housing at rough boring.",
      claimType: "observation",
      confidence: "high",
      materiality: "contributing",
      observedAt: "2026-09-13",
      supportingEvidenceIds: ["kv-ev-ut-report"],
      contradictingEvidenceIds: [],
      sourceIndependence: "single-source",
      falsifiers: [],
      affectedDependencyIds: ["kv-dep-ndt", "kv-dep-boring"],
      affectedActionIds: ["kv-act-retest"],
    },
    {
      id: "kv-heat-unlinked",
      claim:
        "The report carries a casting number but no heat number, so the indication cannot be tied to a pour or to the other housings from it.",
      claimType: "observation",
      confidence: "high",
      materiality: "contributing",
      observedAt: "2026-09-13",
      supportingEvidenceIds: ["kv-ev-ut-report", "kv-ev-pour-log"],
      contradictingEvidenceIds: [],
      sourceIndependence: "related",
      falsifiers: [],
      affectedDependencyIds: ["kv-dep-ndt"],
      affectedActionIds: ["kv-act-trace"],
    },
    {
      id: "kv-volume-unbounded",
      claim:
        "Whether the indication sits inside the housing's critical volume cannot be read from the record, so its consequence is unbounded rather than small.",
      claimType: "inference",
      confidence: "moderate",
      materiality: "controlling",
      validFrom: "2026-09-14",
      supportingEvidenceIds: ["kv-ev-ut-report", "kv-ev-drawing"],
      contradictingEvidenceIds: [],
      sourceIndependence: "related",
      competingExplanation:
        "The indication may lie wholly in material that the final bore removes, in which case nothing follows from it.",
      falsifiers: [
        "A mapped indication depth read against the finish-machined envelope",
        "A re-test placing the indication outside the critical volume",
      ],
      affectedDependencyIds: ["kv-dep-ndt", "kv-dep-authority"],
      affectedActionIds: ["kv-act-retest", "kv-act-hold"],
    },
    {
      id: "kv-authority-unrecorded",
      claim:
        "No disposition authority is recorded for this casting class: the file does not say who may accept a weld repair, or whose signature is needed to call a recast.",
      claimType: "observation",
      confidence: "moderate",
      materiality: "controlling",
      observedAt: "2026-09-15",
      supportingEvidenceIds: ["kv-ev-quality-plan"],
      contradictingEvidenceIds: [],
      sourceIndependence: "single-source",
      falsifiers: [],
      affectedDependencyIds: ["kv-dep-authority"],
      affectedActionIds: ["kv-act-authority"],
    },
    {
      id: "kv-release-scenario",
      claim:
        "If the disposition is a recast rather than a repair, the housings return to the pour queue and the finish-machining slot for turbines 47 to 58 is lost.",
      claimType: "scenario",
      confidence: "low",
      materiality: "contributing",
      validFrom: "2026-09-18",
      forecastHorizon: {
        fromDays: 32,
        toDays: 74,
        basis: "from the assessment date to a re-poured and machined housing",
      },
      supportingEvidenceIds: ["kv-ev-pour-log", "kv-ev-machining-plan"],
      contradictingEvidenceIds: [],
      sourceIndependence: "drona-derived",
      falsifiers: [
        "A signed disposition accepting the housings as cast",
        "A re-test clearing the indication",
      ],
      affectedDependencyIds: ["kv-dep-boring", "kv-dep-authority"],
      affectedActionIds: ["kv-act-hold"],
    },
  ],

  unresolved: [
    {
      id: "kv-un-heat",
      statement: "Which heat the affected housing came from, and which other housings share it.",
      resolvedBy: "kv-req-heat",
    },
    {
      id: "kv-un-volume",
      statement: "Whether the indication lies inside the critical volume after finish machining.",
      resolvedBy: "kv-req-map",
    },
    {
      id: "kv-un-authority",
      statement: "Who holds repair and recast authority for this casting class.",
      resolvedBy: "kv-req-authority",
    },
  ],

  competingExplanation: {
    statement:
      "The indication may be a geometry artefact of the rough-bored profile, or damage from setup and fixturing, rather than a defect in the cast material. These must not be conflated: each carries a different disposition.",
    falsifiers: [
      "A re-test from a second probe angle reproducing the indication",
      "A fixture inspection report showing no setup contact at that location",
    ],
    claimIds: ["kv-indication", "kv-volume-unbounded"],
  },

  nextBestEvidence: [
    {
      id: "kv-req-heat",
      request: "Pour log linking the casting number to its heat, with the other housings from that heat",
      owner: "Supplier quality",
      resolves: "How many housings the indication could bear on",
    },
    {
      id: "kv-req-map",
      request: "Indication depth and position mapped against the finish-machined envelope",
      owner: "Inspection",
      resolves: "Whether the indication is inside the critical volume",
    },
    {
      id: "kv-req-authority",
      request: "The quality plan's disposition authority for this casting class",
      owner: "Engineering",
      resolves: "Who may authorise a repair, and who must call a recast",
    },
  ],

  interventionPosture: {
    stance: "hold-for-disposition",
    summary:
      "Hold the affected housings, bound the heat and the volume, and get the disposition authority named. Nothing downstream should be resequenced until the technical answer exists.",
  },

  financeRelevance: {
    state: "closed-pending-technical-disposition",
    reason:
      "This exposure is a technical question. Funding cannot confer technical acceptability on a casting, so finance stays closed to it until the disposition is recorded.",
  },

  dependencies: [
    {
      id: "kv-dep-ndt",
      label: "Non-destructive testing",
      kind: "processing",
      subTierNodeId: "st:vadodara-ndt-laboratory",
    },
    {
      id: "kv-dep-boring",
      label: "Rough boring",
      kind: "processing",
      subTierNodeId: "st:peenya-boring-services",
    },
    { id: "kv-dep-authority", label: "Disposition authority", kind: "technical-authority" },
  ],

  evidence: [
    {
      id: "kv-ev-ut-report",
      sourceType: "supplier-record",
      sourceName: "Ultrasonic Inspection Report",
      sourceDate: "2026-09-13",
      retrievedAt: "2026-09-13T12:20:00Z",
      scope: "One bearing housing at rough-bored condition",
      independence: { kind: "single-source", relatedTo: ["kv-ev-pour-log"] },
      synthetic: true,
    },
    {
      id: "kv-ev-pour-log",
      sourceType: "supplier-record",
      sourceName: "Foundry Pour Log",
      sourceDate: "2026-08-21",
      retrievedAt: "2026-09-14T06:00:00Z",
      scope: "Heat numbers and casting numbers for the August pours",
      independence: { kind: "related", relatedTo: ["kv-ev-ut-report"] },
      synthetic: true,
    },
    {
      id: "kv-ev-drawing",
      sourceType: "oem-record",
      sourceName: "Housing Drawing & Critical Volume Definition",
      sourceDate: "2026-04-02",
      retrievedAt: "2026-09-14T06:05:00Z",
      scope: "Finish-machined envelope and the volume treated as critical",
      independence: { kind: "independent", relatedTo: [] },
      synthetic: true,
    },
    {
      id: "kv-ev-quality-plan",
      sourceType: "oem-record",
      sourceName: "Casting Quality Plan",
      sourceDate: "2026-03-18",
      retrievedAt: "2026-09-15T08:40:00Z",
      scope: "Inspection stages and acceptance for this casting class",
      independence: { kind: "independent", relatedTo: [] },
      synthetic: true,
    },
    {
      id: "kv-ev-machining-plan",
      sourceType: "erp-planning",
      sourceName: "Machining Slot Plan",
      sourceDate: "2026-09-18",
      retrievedAt: "2026-09-18T04:20:00Z",
      scope: "Finish-boring dates for turbines 47 to 58",
      independence: { kind: "independent", relatedTo: [] },
      synthetic: true,
    },
  ],

  actions: [
    {
      id: "kv-act-trace",
      label: "Trace the casting to its heat and the housings sharing it",
      kind: "verify",
      feasibility: "feasible",
      condition: "The pour log is held at the foundry.",
    },
    {
      id: "kv-act-retest",
      label: "Re-test from a second probe angle and map the indication",
      kind: "verify",
      feasibility: "feasible",
      condition: "The housings are still at rough-bored condition, so the test is repeatable.",
    },
    {
      id: "kv-act-authority",
      label: "Name the repair and recast authority for this casting class",
      kind: "verify",
      feasibility: "feasible",
      condition: "Requires engineering to state it against the quality plan.",
    },
    {
      id: "kv-act-hold",
      label: "Hold the affected housings at rough-bored condition",
      kind: "hold",
      feasibility: "feasible",
      condition: "Holds until a disposition is recorded; it consumes float but protects the evidence.",
    },
  ],

  temporal: {
    eventAt: "2026-09-13",
    observedAt: "2026-09-13",
    assessedAt: "2026-09-18",
  },

  grounding: {
    groundingRefs: ["DEMO:1"],
    syntheticAssumptions: [
      "The indication, the pour log and the missing authority record are authored to exercise the disposition mechanism.",
      "Acceptance thresholds and critical-volume definitions are not modelled; the case turns on traceability, not on metallurgy.",
    ],
  },
};
