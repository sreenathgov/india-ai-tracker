import type { CaseGraph } from "../types";

/**
 * Durgapur Heat Treatment — Heat-Treated Shaft Blanks, turbines 64–80.
 *
 * The forward-looking case, and the one that most needed a decision about what counts
 * as a node. A route disruption and a price curve are not supply-chain objects: they
 * are reasoning about one. What the graph holds is the object that carries them — an
 * approved quench medium with 34 days of cover against an 83-day remaining route
 * requirement — and the distributor and lane it arrives through. The forecast lives on
 * the material as a note and in its evidence, where Phase 4B can pick it up.
 *
 * The quench-medium chain is an explicit synthetic extrapolation, flagged as such in
 * the investigation's grounding record.
 */
export const DURGAPUR_GRAPH: CaseGraph = {
  orderId: "c1",
  supplierId: "sup:durgapur-heat-treatment",
  rootKey: "dg-order",
  nodes: [
    {
      key: "dg-order",
      type: "order",
      name: "PO-2026-0417",
      detail: "Wind Energy Coastal Programme",
      evidence: "verified",
      concern: "normal",
      facts: [
        { label: "On order", value: "100 wind turbines" },
        { label: "Affected here", value: "17 units · turbines 64–80" },
      ],
    },
    {
      key: "dg-component",
      type: "component",
      name: "Heat-Treated Shaft Blanks",
      detail: "Drivetrain · 3 parts per turbine",
      evidence: "verified",
      concern: "normal",
      facts: [
        { label: "Lead time", value: "38 days" },
        { label: "Cover at the line", value: "25 days" },
        { label: "Approved sources", value: "2" },
      ],
    },
    {
      key: "dg-durgapur",
      type: "supplier",
      name: "Durgapur Heat Treatment",
      detail: "Quenches, tempers and tests the shaft blanks",
      place: "Durgapur, West Bengal",
      evidence: "verified",
      concern: "active",
      concernNote: "The process input this route runs on has 34 days of cover against 83 days of remaining requirement.",
      facts: [
        { label: "Role on this order", value: "Tier-1 heat treater for the shaft blanks" },
        { label: "Supplies", value: "Heat-Treated Shaft Blanks, turbines 64–80" },
      ],
      reasoningClaimIds: ["dg-dependency", "dg-conclusion"],
    },
    {
      key: "dg-quench",
      type: "material",
      name: "Approved quench medium",
      detail: "Petroleum-derived oil named in the route",
      evidence: "verified",
      concern: "exposed",
      concernNote:
        "Cover is 34 days against an 83-day remaining route requirement. Forward pricing on this class of input has moved upward over a 45–60 day horizon, and no protected allocation is evidenced.",
      facts: [
        { label: "Input", value: "Petroleum-derived quench oil to the qualified specification" },
        { label: "Cover", value: "34 days" },
        { label: "Remaining requirement", value: "83 days of route" },
        { label: "Allocation", value: "No protected allocation on record" },
      ],
      dependencyId: "dg-dep-quench",
      evidenceIds: [
        "dg-ev-inventory",
        "dg-ev-route-requirement",
        "dg-ev-forward-curve",
        "dg-ev-upstream-availability",
      ],
      reasoningClaimIds: ["dg-signal-4", "dg-signal-5", "dg-dependency"],
    },
    {
      key: "dg-distributor",
      type: "supplier",
      name: "Asansol Process Oils",
      detail: "Approved distributor for the quench medium",
      place: "Asansol, West Bengal",
      evidence: "verified",
      concern: "exposed",
      concernNote: "Quoted lead time has moved from 21 days to 34, and the latest quotation has not been renewed.",
      facts: [
        { label: "Role on this order", value: "Sole approved distributor for this specification" },
        { label: "Lead time", value: "34 days, quoted at 21 earlier this year" },
        { label: "Terms", value: "Quotation lapsed; no forward agreement" },
      ],
      dependencyId: "dg-dep-distributor",
      evidenceIds: ["dg-ev-distributor-note", "dg-ev-quotation"],
      reasoningClaimIds: ["dg-signal-3", "dg-mitigation"],
    },
    {
      key: "dg-refinery",
      type: "supplier",
      name: "Eastern refinery source",
      detail: "Upstream producer behind the distributor",
      place: "Eastern India",
      evidence: "inferred",
      concern: "exposed",
      concernNote: "Inferred from the distributor's consignment notes. Availability of this grade has reduced since the lane was disrupted.",
      facts: [
        { label: "Role on this order", value: "Producer of the base stock" },
        { label: "Evidence", value: "Consignment notes; no contract on file" },
      ],
      evidenceIds: ["dg-ev-upstream-availability", "dg-ev-external-brief"],
      reasoningClaimIds: ["dg-signal-2"],
    },
    {
      key: "dg-lane",
      type: "route",
      name: "Coastal feedstock lane",
      detail: "The sea lane the base stock moves on",
      evidence: "inferred",
      concern: "exposed",
      concernNote: "Disrupted since 12 September. Rerouting adds transit and has pushed replenishment dates out.",
      facts: [
        { label: "Lead time", value: "Extended; rerouting in effect" },
        { label: "Exposure", value: "Route disruption reported 12 September" },
        { label: "Replenishment", value: "No confirmed date" },
      ],
      evidenceIds: ["dg-ev-route-disruption", "dg-ev-external-brief"],
      reasoningClaimIds: ["dg-signal-1"],
    },
    {
      key: "dg-cycle",
      type: "process",
      name: "Quench and temper cycle",
      detail: "The qualified thermal route for the blanks",
      evidence: "verified",
      concern: "normal",
      facts: [
        { label: "Qualification", value: "Qualified to the programme's mechanical properties" },
        { label: "Capacity", value: "One charge per shift, 83 days of route remaining" },
      ],
      evidenceIds: ["dg-ev-route-requirement"],
    },
    {
      key: "dg-line",
      type: "facility",
      name: "Sealed quench line",
      detail: "The qualified furnace and quench tank pair",
      place: "Durgapur, West Bengal",
      evidence: "verified",
      concern: "normal",
      facts: [
        { label: "Capability", value: "Full-length shaft blanks, sealed quench" },
        { label: "Shared capacity", value: "One other programme at this works" },
        { label: "Constraint", value: "The medium, not the furnace" },
      ],
      dependencyId: "dg-dep-furnace",
    },
    {
      key: "dg-test",
      type: "process",
      name: "Post-quench hardness and UT",
      detail: "Property and volumetric checks before release",
      evidence: "verified",
      concern: "normal",
      facts: [
        { label: "Qualification", value: "Qualified to the programme's acceptance standard" },
        { label: "Capacity", value: "In house; not a constraint on this route" },
      ],
    },
  ],
  edges: [
    { from: "dg-order", to: "dg-component", relation: "requires", evidence: "verified", concern: "normal", basis: "The order's bill of materials" },
    { from: "dg-component", to: "dg-durgapur", relation: "supplied-by", evidence: "verified", concern: "normal", basis: "Purchase-order line and the approved-vendor record" },
    {
      from: "dg-durgapur",
      to: "dg-quench",
      relation: "uses-material",
      evidence: "verified",
      concern: "exposed",
      basis: "The qualified route names this medium by specification",
      evidenceIds: ["dg-ev-route-requirement", "dg-ev-inventory"],
      reasoningClaimIds: ["dg-dependency"],
    },
    { from: "dg-durgapur", to: "dg-cycle", relation: "processed-at", evidence: "verified", concern: "normal", basis: "Route card, thermal operations" },
    { from: "dg-durgapur", to: "dg-test", relation: "processed-at", evidence: "verified", concern: "normal", basis: "Route card, final testing" },
    { from: "dg-cycle", to: "dg-line", relation: "depends-on", evidence: "verified", concern: "normal", basis: "The process qualification names the line" },
    {
      from: "dg-quench",
      to: "dg-distributor",
      relation: "sourced-from",
      evidence: "verified",
      concern: "exposed",
      basis: "Purchase history and the distributor's revised lead time",
      evidenceIds: ["dg-ev-distributor-note", "dg-ev-quotation"],
      reasoningClaimIds: ["dg-signal-3"],
    },
    {
      from: "dg-distributor",
      to: "dg-refinery",
      relation: "sourced-from",
      evidence: "inferred",
      concern: "exposed",
      basis: "Consignment notes quoted on delivered drums; no contract on file",
      evidenceIds: ["dg-ev-upstream-availability"],
      reasoningClaimIds: ["dg-signal-2"],
    },
    {
      from: "dg-refinery",
      to: "dg-lane",
      relation: "routed-through",
      evidence: "inferred",
      concern: "exposed",
      basis: "External route reporting against the producing region",
      evidenceIds: ["dg-ev-route-disruption"],
      reasoningClaimIds: ["dg-signal-1"],
    },
  ],
};
