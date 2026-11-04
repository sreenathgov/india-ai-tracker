"use client";
import * as React from "react";
import { RISK_INTRO, RISK_PRESENTATION, type RiskTourBeat } from "@/components/surface/riskPresentation";
import { GuidedSurfaceSpotlight } from "./GuidedSurfaceSpotlight";
const TITLES = { material: "Start with the required inputs.", network: "Look beneath separate suppliers.", regulatory: "A requirement becomes relevant through the order." };
const EXPLANATIONS = {
  material: "An order depends on specific materials arriving within its production window. Drona examines the sources and evidence behind that requirement.",
  network: "Separate suppliers can share one upstream source or facility. Drona looks beneath the supplier list to examine that concentration.",
  regulatory: "For this shipment, applicability and importer readiness are separate checks. We will examine both in the case file.",
};
export function GuidedRiskSpotlight({ beat, onContinue, onBack, onExit }: { readonly beat: RiskTourBeat; readonly onContinue: () => void; readonly onBack: () => void; readonly onExit: () => void }): React.ReactElement {
  const copy = beat === "overview" ? RISK_INTRO : { title: beat in TITLES ? TITLES[beat as keyof typeof TITLES] : RISK_PRESENTATION[beat].label, body: beat in EXPLANATIONS ? EXPLANATIONS[beat as keyof typeof EXPLANATIONS] : RISK_PRESENTATION[beat].explanation };
  return <GuidedSurfaceSpotlight target='[data-surface="risks"]' step="risks" beat={beat} title={copy.title} body={copy.body} eyebrow="Act One · Risk overview" onContinue={onContinue} onBack={onBack} onExit={onExit} />;
}
