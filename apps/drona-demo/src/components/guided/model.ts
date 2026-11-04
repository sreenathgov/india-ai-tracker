import { INITIAL_INQUIRY, type SupplierInquiryState } from "@/lib/scene2/investigation/inquiry";
import { exposureSummary, formatUSD } from "@/lib/portfolio/commercial";
import { findingFor, type Finding, type RegulatoryState } from "@/lib/regulatory/state";

export type GuidePhase = "intro" | "tour" | "complete" | "explore";
export type GuideStep = "map" | "risks" | "exposure" | "capital" | "order" | "order-overview" | "supplier-overview" | "assessment" | "investigate" | "scope" | "readiness" | "result";
export interface GuideNavigation {
  readonly scene: number;
  readonly commitmentId: string | null;
  readonly assessmentStatus?: "not_assessed" | "analysing" | "available";
  readonly openOrder: () => void;
  readonly openSupplier?: (id: string) => void;
  readonly resetNavigation: () => void;
}
export interface GuideInvestigation {
  readonly supplierId: string | null;
  readonly tab: string;
  readonly close: () => void;
  readonly setTab: (tab: "overview" | "supply-chain" | "evidence") => void;
}
export const TOUR_ORDER = "c1";
export const TOUR_SUPPLIER = "sup:tiruchi-tower-sections";
export const GUIDE_STEPS: readonly GuideStep[] = ["map", "risks", "capital", "exposure", "order", "order-overview", "supplier-overview", "assessment", "investigate", "scope", "readiness", "result"];

/** Progress is a projection of actual application state, never a timer or a click count. */
export function guideStep(navigation: Pick<GuideNavigation, "scene" | "commitmentId" | "assessmentStatus">, investigation: Pick<GuideInvestigation, "supplierId"> | null, state: RegulatoryState, mapIntroduced = false, risksIntroduced = false, exposureIntroduced = false, capitalIntroduced = false, orderOverviewIntroduced = true, supplierOverviewIntroduced = true): GuideStep {
  if (navigation.scene !== 2 || navigation.commitmentId !== TOUR_ORDER) return !mapIntroduced ? "map" : !risksIntroduced ? "risks" : !capitalIntroduced ? "capital" : !exposureIntroduced ? "exposure" : "order";
  if (!orderOverviewIntroduced && !investigation?.supplierId) return "order-overview";
  if (navigation.assessmentStatus !== undefined && navigation.assessmentStatus !== "available") return "assessment";
  if (!supplierOverviewIntroduced && !investigation?.supplierId) return "supplier-overview";
  if (investigation?.supplierId !== TOUR_SUPPLIER) return "investigate";
  const finding = findingFor(state);
  if (finding === "applicability-review") return "scope";
  if (finding === "readiness-review") return "readiness";
  return "result";
}

export function resultCopy(finding: Finding): { title: string; body: string } {
  if (finding === "gap-confirmed") return {
    title: "A scoped answer establishes the next action.",
    body: "The sample importer reply confirms that neither eligible entry route is available. OEM logistics must establish a lawful route and feasible timing. Customs refusal and delivery delay have not been established.",
  };
  if (finding === "scope-excluded") return {
    title: "Evidence can also close a concern.",
    body: "The sample customs-owner check excludes this shipment from the selected obligation. Retain that exact basis and revisit it if the goods, importer or procedure changes.",
  };
  return {
    title: "The checked route closes this condition.",
    body: "The sample owner record supports an eligible entry route for the planned import. Other reporting, emissions, customs and delivery conditions remain separate.",
  };
}

export const GUIDE_COPY: Readonly<Record<Exclude<GuideStep, "result">, { title: string; body: string; cue: string }>> = {
  map: { title: "Your supplier network, mapped.", body: "Drona brings your suppliers, production plant and customer destinations into one digital twin. This gives your team and Drona a shared view of the network behind your orders.", cue: "" },
  risks: { title: "See where an order may be exposed.", body: "Drona groups the dependencies behind your orders into seven categories. Each points to a condition that may affect fulfilment—and a question worth investigating.", cue: "Select a category to examine its meaning." },
  exposure: { title: "Understand the financial exposure.", body: "Drona links open material risks to the purchase commitments they could affect, helping your team prioritise the orders that need attention. Values under review remain distinct from confirmed exposure.", cue: "" },
  capital: { title: "Track funding alongside production.", body: "Suppliers have a standing pathway to working capital. Track disbursed funds and approved facilities separately, with each linked to a production commitment. The regulated financier retains the credit decision.", cue: "" },
  order: { title: "Trace the exposure to an order.", body: "Each production order brings its delivery commitment and open conditions together. Follow Wind Energy Coastal to examine the exposure behind this commitment.", cue: "Open Wind Energy Coastal in the order queue." },
  "order-overview": { title: "The commitment behind the order.", body: "The planning brief brings the delivery requirement, production scope and financial exposure into one view. This is the commitment Drona examines through the suppliers behind it.", cue: "" },
  "supplier-overview": { title: "See which suppliers need attention.", body: "Each card shows who supplies a part, where they operate and what could affect this order. Priority helps your team decide where to look first.", cue: "Filter by priority or choose Needs action to narrow the review. Cards / List changes how the same information is presented." },
  assessment: { title: "Read the order against its production plan.", body: "Run the authored assessment to reveal the order’s scoped dependencies. This demonstration replays a prepared case; it does not analyse a live customer order.", cue: "Choose Analyse production risk and let the assessment finish." },
  investigate: { title: "Read the order behind the exposure.", body: "Wind Energy Coastal brings 100 turbines for Denmark into one production plan. Open the tower-section case to examine the regulatory condition and the evidence still needed.", cue: "Choose Investigate CBAM readiness." },
  scope: { title: "Does the rule apply to this shipment?", body: "The customs owner checks the goods, importer, procedure, threshold and exceptions. Try the sample Yes reply, then record it. Unknown remains an open question.", cue: "Try Yes → Record sample scope check." },
  readiness: { title: "Ask the owner what the public record cannot tell you.", body: "Can a valid authorisation or a qualifying application route cover this entry? Try No to see how an explicit gap changes the assessment. Missing evidence alone would not establish it.", cue: "Try No → Record sample reply and reassess." },
};


/** Act Two begins only after the application actually opens the order. */
export const guideAct = (step: GuideStep): 1 | 2 => ["map", "risks", "capital", "exposure", "order"].includes(step) ? 1 : 2;

/** Revisiting a teaching beat must describe today's in-session assessment,
 * rather than repeating the opening snapshot after evidence has changed it. */
export function financialGuideCopy(step: "exposure" | "order", state: RegulatoryState, material: SupplierInquiryState = INITIAL_INQUIRY) {
  const exposure = exposureSummary(state, step === "order" ? "c1" : undefined, undefined, undefined, material);
  return { ...GUIDE_COPY[step], body: step === "exposure"
    ? `Drona connects open risk conditions to the purchase commitments they could affect. Here, ${formatUSD(exposure.totalCents)} is linked to open conditions across two assessed orders. Under review and confirmed exposure remain distinct.`
    : `Each production order brings its delivery commitment and open conditions together. Follow Wind Energy Coastal, which accounts for ${formatUSD(exposure.totalCents)} of the linked spend.` };
}
