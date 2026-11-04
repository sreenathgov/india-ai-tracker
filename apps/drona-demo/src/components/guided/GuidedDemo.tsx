"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { MATERIAL_CASE } from "@/lib/scene2/investigation/inquiry";
import * as Dialog from "@radix-ui/react-dialog";
import { DronaWordmark } from "@/components/brand/DronaLogo";
import { coverCaseBrief } from "./caseBrief";
import { useSupplierInquiry } from "@/components/scene2/investigation/overview/SupplierInquiryProvider";
import { useRegulatoryCase } from "@/components/regulatory/RegulatoryProvider";
import { GUIDE_COPY, TOUR_SUPPLIER, financialGuideCopy, guideAct, guideStep, type GuideInvestigation, type GuideNavigation, type GuidePhase } from "./model";
import { GuidedSurfaceSpotlight } from "./GuidedSurfaceSpotlight";
import { GuidedRiskSpotlight } from "./GuidedRiskSpotlight";
import { nextRiskBeat, previousRiskBeat, type RiskTourBeat } from "@/components/surface/riskPresentation";
import { GuidedSpotlight } from "./GuidedSpotlight";
import styles from "./GuidedDemo.module.css";

interface GuideContextValue {
  readonly phase: GuidePhase;
  readonly completed: boolean;
  readonly logoutCsrf?: string;
  readonly step: ReturnType<typeof guideStep>;
  readonly investigation: Pick<GuideInvestigation, "supplierId" | "tab"> | null;
  readonly reportInvestigation: (value: GuideInvestigation) => void;
  readonly start: () => void;
  readonly continueOrderOverview: () => void;
  readonly continueSupplierOverview: () => void;
  readonly releaseOrderWorkspace: () => void;
  readonly continueMap: () => void;
  readonly continueExposure: () => void;
  readonly continueCapital: () => void;
  readonly riskBeat: RiskTourBeat;
  readonly selectRisk: (beat: RiskTourBeat) => void;
  readonly continueRisk: () => void;
  readonly back: () => void;
  readonly finish: () => void;
  readonly explore: (completed?: boolean) => void;
  readonly dashboard: () => void;
  readonly openMaterial: () => void;
  readonly openRegulatory: () => void;
  readonly replay: () => void;
  readonly openOrder: () => void;
  readonly showOverview: () => void;
  readonly showEvidence: () => void;
}
const Context = React.createContext<GuideContextValue | null>(null);
export const useGuidedDemo = (): GuideContextValue | null => React.useContext(Context);

/** Navigation is supplied by the actual app; the guide never simulates DOM clicks. */
export function GuidedDemoProvider({ children, navigation, onReplay, logoutCsrf }: { readonly children: React.ReactNode; readonly navigation: GuideNavigation; readonly onReplay: () => void; readonly logoutCsrf?: string }): React.ReactElement {
  const regulatory = useRegulatoryCase();
  const material = useSupplierInquiry();
  const [phase, setPhase] = React.useState<GuidePhase>("intro");
  const [completed, setCompleted] = React.useState(false);
  const [orderOverviewIntroduced, setOrderOverviewIntroduced] = React.useState(false);
  const [supplierOverviewIntroduced, setSupplierOverviewIntroduced] = React.useState(false);
  React.useEffect(() => { if (navigation.scene !== 2 || navigation.commitmentId !== "c1") { setOrderOverviewIntroduced(false); setSupplierOverviewIntroduced(false); } }, [navigation.scene, navigation.commitmentId]);
  const [mapIntroduced, setMapIntroduced] = React.useState(false);
  const [risksIntroduced, setRisksIntroduced] = React.useState(false);
  const [exposureIntroduced, setExposureIntroduced] = React.useState(false);
  const [capitalIntroduced, setCapitalIntroduced] = React.useState(false);
  const [riskBeat, setRiskBeat] = React.useState<RiskTourBeat>("overview");
  const [investigation, setInvestigation] = React.useState<Pick<GuideInvestigation, "supplierId" | "tab"> | null>(null);
  const investigationRef = React.useRef<GuideInvestigation | null>(null);
  const reportInvestigation = React.useCallback((value: GuideInvestigation) => {
    investigationRef.current = value;
    setInvestigation((previous) => previous?.supplierId === value.supplierId && previous?.tab === value.tab ? previous : { supplierId: value.supplierId, tab: value.tab });
  }, []);
  const step = guideStep(navigation, investigation, regulatory.state, mapIntroduced, risksIntroduced, exposureIntroduced, capitalIntroduced, orderOverviewIntroduced, supplierOverviewIntroduced);
  const replay = React.useCallback(() => { setPhase("intro"); setCompleted(false); setOrderOverviewIntroduced(false); setSupplierOverviewIntroduced(false); setMapIntroduced(false); setRisksIntroduced(false); setExposureIntroduced(false); setCapitalIntroduced(false); setRiskBeat("overview"); regulatory.dispatch({ type: "reset" }); onReplay(); }, [onReplay, regulatory.dispatch]);
  const back = React.useCallback(() => {
    if (investigationRef.current?.supplierId) { investigationRef.current.close(); return; }
    if (navigation.scene === 2 && step === "investigate" && !investigationRef.current?.supplierId) { setSupplierOverviewIntroduced(false); return; }
    if (navigation.scene === 2 && step === "supplier-overview") { setOrderOverviewIntroduced(false); return; }
    if (navigation.scene === 2) { navigation.resetNavigation(); return; }
    if (exposureIntroduced) { setExposureIntroduced(false); return; }
    if (capitalIntroduced) { setCapitalIntroduced(false); return; }
    if (risksIntroduced) { setRisksIntroduced(false); setRiskBeat("regulatory"); return; }
    if (mapIntroduced) { const previous = previousRiskBeat(riskBeat); if (previous === null) setMapIntroduced(false); else setRiskBeat(previous); return; }
    setPhase("intro");
  }, [navigation, step, mapIntroduced, risksIntroduced, exposureIntroduced, capitalIntroduced, riskBeat]);
  const continueRisk = React.useCallback(() => { const next = nextRiskBeat(riskBeat); if (next === null) setRisksIntroduced(true); else setRiskBeat(next); }, [riskBeat]);
  const explore = React.useCallback((didComplete = false) => { setPhase("explore"); setCompleted(didComplete); setOrderOverviewIntroduced(true); setSupplierOverviewIntroduced(true); investigationRef.current?.close(); }, []);
  const dashboard = React.useCallback(() => {
    investigationRef.current?.close();
    investigationRef.current = null;
    setInvestigation(null);
    setPhase("explore");
    setCompleted(false);
    navigation.resetNavigation();
  }, [navigation]);
  const finish = React.useCallback(() => { setCompleted(step === "result"); setPhase("complete"); investigationRef.current?.close(); }, [step]);
  const showOverview = React.useCallback(() => investigationRef.current?.setTab("overview"), []);
  const showEvidence = React.useCallback(() => investigationRef.current?.setTab("evidence"), []);
  const value = React.useMemo<GuideContextValue>(() => ({ phase, completed, logoutCsrf, step, investigation, reportInvestigation, continueOrderOverview: () => setOrderOverviewIntroduced(true), continueSupplierOverview: () => setSupplierOverviewIntroduced(true), releaseOrderWorkspace: () => { setOrderOverviewIntroduced(true); setSupplierOverviewIntroduced(true); setCompleted(false); setPhase("explore"); }, start: () => { regulatory.dispatch({ type: "reset" }); navigation.resetNavigation(); setCompleted(false); setOrderOverviewIntroduced(false); setSupplierOverviewIntroduced(false); setMapIntroduced(false); setRisksIntroduced(false); setExposureIntroduced(false); setCapitalIntroduced(false); setRiskBeat("overview"); setPhase("tour"); }, continueMap: () => { setRiskBeat("overview"); setMapIntroduced(true); }, continueExposure: () => setExposureIntroduced(true), continueCapital: () => setCapitalIntroduced(true), riskBeat, selectRisk: setRiskBeat, continueRisk, back, finish, explore, dashboard, replay, openMaterial: () => navigation.openSupplier?.(MATERIAL_CASE.supplierId), openRegulatory: () => navigation.openSupplier?.(TOUR_SUPPLIER), openOrder: navigation.openOrder, showOverview, showEvidence }), [phase, completed, logoutCsrf, step, riskBeat, continueRisk, investigation, reportInvestigation, regulatory.dispatch, navigation, back, finish, explore, dashboard, replay, showOverview, showEvidence]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

/** Constrains Act One navigation. Native Act Two controls remain usable while its replacement guide is designed. Authentication remains a separate server responsibility. */
export function GuidedDemoBoundary({ children, className }: { readonly children: React.ReactNode; readonly className?: string }): React.ReactElement {
  const guide = useGuidedDemo();
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (!guide || guide.phase !== "tour" || guideAct(guide.step) === 2) return;
    // Presentation-only controls also leave the keyboard order. Restore original
    // attributes on stage changes so independent components keep their own semantics.
    const changed = new Map<HTMLElement, { tabIndex: string | null; disabled: string | null }>();
    const restore = (element: HTMLElement) => {
      const previous = changed.get(element);
      if (!previous) return;
      if (previous.tabIndex === null) element.removeAttribute("tabindex"); else element.setAttribute("tabindex", previous.tabIndex);
      if (previous.disabled === null) element.removeAttribute("aria-disabled"); else element.setAttribute("aria-disabled", previous.disabled);
      element.removeAttribute("data-guide-unavailable"); changed.delete(element);
    };
    const update = () => {
      const roots = [ref.current, document.querySelector<HTMLElement>(`[data-investigation="${TOUR_SUPPLIER}"]`)];
      // A focusable region or tabpanel is structural. aria-disabled there would
      // disable every descendant, including the question's permitted replies.
      for (const root of roots) for (const element of Array.from(root?.querySelectorAll<HTMLElement>('button, a[href], input, select, textarea, [role="button"], [role="tab"], summary') ?? [])) {
        if (allowedTarget(element, guide.step)) { restore(element); continue; }
        if (!changed.has(element)) changed.set(element, { tabIndex: element.getAttribute("tabindex"), disabled: element.getAttribute("aria-disabled") });
        element.setAttribute("tabindex", "-1"); element.setAttribute("aria-disabled", "true"); element.setAttribute("data-guide-unavailable", "");
      }
    };
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => { observer.disconnect(); for (const element of changed.keys()) restore(element); };
  }, [guide?.phase, guide?.step, guide?.investigation?.supplierId, guide?.investigation?.tab]);
  const stopUnrelated = (event: React.SyntheticEvent) => {
    if (!guide || guide.phase !== "tour" || guideAct(guide.step) === 2) return;
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (allowedTarget(target, guide.step)) return;
    event.preventDefault(); event.stopPropagation();
  };
  return <div ref={ref} className={className} data-guided-boundary onMouseDownCapture={stopUnrelated} onClickCapture={stopUnrelated} onChangeCapture={stopUnrelated} onSubmitCapture={stopUnrelated}>{children}</div>;
}

function allowedTarget(target: Element, step: ReturnType<typeof guideStep>): boolean {
  if (target.closest("[data-guide-control]")) return true;
  if (step === "risks") return Boolean(target.closest("[data-risk-category], [data-risk-control]"));
  if (step === "exposure") return Boolean(target.closest("[data-commercial-basis]"));
  if (step === "capital") return false;
  if (step === "order") return Boolean(target.closest('[data-guide-target="order:c1"]'));
  if (step === "assessment") return Boolean(target.closest('[data-guide-target="assessment-action"]'));
  if (step === "investigate") return Boolean(target.closest(`[data-guide-target="open-regulatory-case"], [data-supplier-card="${TOUR_SUPPLIER}"]`));
  return Boolean(target.closest(`[data-investigation="${TOUR_SUPPLIER}"]`) && (
    target.closest('[data-working-question], [role="tab"], [data-evidence-panel], [data-supply-chain], [aria-label="Supplier-specific Drona conversation"]')
    || target.closest("summary") || target.closest('a[href^="https://"]')
  ));
}

export function GuidedDemoRoot(): React.ReactElement | null {
  const guide = useGuidedDemo();
  const regulatory = useRegulatoryCase();
  const material = useSupplierInquiry();
  if (!guide) return null;
  if (guide.phase === "explore") return <ExplorationHandoff />;
  if (guide.investigation?.supplierId) return null;
  if (guide.phase !== "tour") return <GuideCover />;
  if (guide.step === "map") return <GuidedSpotlight target='[data-surface="map"]' eyebrow="Act One · Network overview" title={GUIDE_COPY.map.title} description={GUIDE_COPY.map.body} onContinue={guide.continueMap} onBack={guide.back} onExit={guide.finish} />;
  if (guide.step === "order-overview") return <GuidedSpotlight key="order-overview" step="order-overview" target='[data-surface="planning-brief"]' eyebrow="Act Two · Order overview" title={GUIDE_COPY["order-overview"].title} description={GUIDE_COPY["order-overview"].body} onContinue={guide.continueOrderOverview} onBack={guide.back} onExit={guide.releaseOrderWorkspace} />;
  if (guide.step === "supplier-overview") return <GuidedSpotlight key="supplier-overview" step="supplier-overview" target='[data-surface="suppliers"]' eyebrow="Act Two · Direct suppliers" title={GUIDE_COPY["supplier-overview"].title} description={GUIDE_COPY["supplier-overview"].body} supporting={GUIDE_COPY["supplier-overview"].cue} handoff="Next, open Deccan’s billet-disruption case." onContinue={guide.continueSupplierOverview} onBack={guide.back} onExit={() => guide.explore()} />;
  if (guide.step === "risks") return <GuidedRiskSpotlight beat={guide.riskBeat} onContinue={guide.continueRisk} onBack={guide.back} onExit={guide.finish} />;
  if (guide.step === "capital" || guide.step === "exposure" || guide.step === "order") {
    const capital = guide.step === "capital";
    const copy = capital ? GUIDE_COPY.capital : financialGuideCopy(guide.step as "exposure" | "order", regulatory.state, material.state);
    return <GuidedSurfaceSpotlight key={capital ? "capital" : "commitments"}
      target={capital ? '[data-surface="capital"]' : '[data-surface="commitments"]'}
      focusTarget={capital ? undefined : guide.step === "exposure" ? "[data-financial-summary]" : "[data-production-orders]"}
      step={guide.step} title={copy.title} body={copy.body}
      eyebrow={capital ? "Act One · Working capital" : guide.step === "exposure" ? "Act One · Financial exposure" : "Act One · Production orders"}
      primaryLabel={guide.step === "order" ? "Open this order" : undefined}
      onContinue={capital ? guide.continueCapital : guide.step === "exposure" ? guide.continueExposure : guide.openOrder}
      onBack={guide.back} onExit={guide.finish} />;
  }
  if (guide.step === "investigate") return <GuidedSpotlight step="material-launch" target='[data-guide-target="open-material-case"]' eyebrow="Act Three · Supplier investigation" title="Follow an early material warning." description="Open Deccan’s case to see how Drona connects a signal to your order, asks the next useful question and explains the forecast." primaryLabel="Open case" onContinue={guide.openMaterial} onBack={guide.back} onExit={() => guide.explore()} />;
  // Act Two's replacement is designed beat by beat. Do not fall back to
  // the retired floating panel after the actual order opens.
  return null;
}

function GuideCover(): React.ReactElement | null {
  const guide = useGuidedDemo();
  const primaryAction = React.useRef<HTMLButtonElement>(null);
  if (!guide) return null;
  const complete = guide.phase === "complete";
  const completed = complete && guide.completed;
  const brief = coverCaseBrief();
  return <Dialog.Root open onOpenChange={(open) => { if (!open && !complete) guide.finish(); }}><Dialog.Portal><Dialog.Content className={styles.cover} aria-describedby="guide-cover-description" onOpenAutoFocus={(event) => { event.preventDefault(); primaryAction.current?.focus({ preventScroll: true }); }} data-guide-control data-guide-cover={completed ? "completed" : complete ? "replay" : "intro"}>
    <header className={styles.coverHeader}>
      <DronaWordmark height={24} />
      {guide.logoutCsrf ? <form method="post" action="/api/auth/logout" data-guide-control><input type="hidden" name="csrf" value={guide.logoutCsrf} /><button type="submit" className={styles.coverTextControl}>Sign out</button></form> : null}
    </header>
    <main className={styles.coverMain}>
      <section className={styles.coverProposition}>
        <Dialog.Title asChild><h1 className={styles.coverTitle}>{completed ? "From a risk signal to a useful next question." : "Know what puts an order at risk."}</h1></Dialog.Title>
        <Dialog.Description id="guide-cover-description" className={styles.coverBody}>{completed ? "You followed one order, checked a regulatory dependency and saw how a scoped owner reply changes the finding and the next action." : "Follow an early disruption signal to a supplier-specific forecast, an evidence check and a useful next action."}</Dialog.Description>
        <div className={styles.coverActions}>
          <button ref={primaryAction} type="button" className={styles.coverPrimary} onClick={complete ? guide.replay : guide.start}>
            {completed ? "Replay the demonstration" : complete ? "Replay demo" : "Start demo"}<span aria-hidden="true">→</span>
          </button>
          {completed ? <a className={styles.coverTextControl} href="https://kananlabs.in/request-demo.html">Contact Kanan</a> : null}
        </div>
        <p className="mt-4 text-[13px] text-[color:var(--cover-muted)]">Designed for desktop.</p>
      </section>
      <section className={styles.caseBrief} aria-label="Case brief">
        <p className={styles.caseLabel}>Case brief</p>
        <h2 className={styles.caseCompany}>{brief.company}</h2>
        <p className={styles.caseOrder}>{brief.units} wind turbines <span aria-hidden="true">·</span> {brief.route}</p>
        <dl className={styles.caseFacts}>
          <div><dt>Delivery required</dt><dd>{brief.requiredBy}</dd></div>
          <div><dt>Longest component lead time</dt><dd>{brief.longestComponentLeadDays} days</dd></div>
        </dl>
        <div className={styles.caseFocus}>
          <p className={styles.caseLabel}>Investigation focus</p>
          <h3 className={styles.caseSupplier}>{brief.supplier}</h3>
          <p className={styles.caseComponent}>{brief.componentLabel}</p>
          <p className={styles.caseQuestion}>Could incoming billet miss its production window?</p>
        </div>
        <p className={styles.caseMetadata}>{brief.reference} <span aria-hidden="true">·</span> Illustrative case <span aria-hidden="true">·</span> {brief.scenarioDate}</p>
      </section>
    </main>
    <footer className={styles.coverFooter}>
      <p>Kanan <span aria-hidden="true">·</span> KANANX ANALYTICS PRIVATE LIMITED <span aria-hidden="true">·</span> Private product demonstration</p>
      <div className={styles.coverFooterLinks}>
        <a className={styles.coverTextControl} href="https://kananlabs.in/">Back to Kanan</a>
        <details className={styles.coverAbout}>
          <summary>About this demo</summary>
          <p>Fictional companies, news and order records with sample owner responses. The optional regulatory case also references real public rules. Demonstration only; no operational decision is executed.</p>
        </details>
      </div>
    </footer>
  </Dialog.Content></Dialog.Portal></Dialog.Root>;
}

function ExplorationHandoff(): React.ReactElement | null {
  const guide = useGuidedDemo();
  const [host, setHost] = React.useState<HTMLElement | null>(null);
  const [dismissed, setDismissed] = React.useState(false);
  React.useEffect(() => { setHost(document.querySelector<HTMLElement>("[data-exploration-host]")); }, []);
  if (!host || !guide || dismissed) return null;
  return createPortal(<aside data-exploration-handoff className="flex shrink-0 flex-wrap items-center justify-start gap-x-5 gap-y-2 border-b border-separator px-6 py-3 text-[13px] text-label-secondary"><p><strong className="font-medium text-label-primary">{guide.completed ? "Walkthrough complete." : "Explore Drona."}</strong> {guide.completed ? "Explore Drona at your own pace." : "Continue at your own pace, or replay the walkthrough."}</p><button type="button" className="underline underline-offset-4" onClick={guide.openRegulatory}>View regulatory case</button><button type="button" className="underline underline-offset-4" onClick={guide.replay}>Replay walkthrough</button><button type="button" className="ml-auto min-h-8 px-2 text-label-tertiary" aria-label="Dismiss completion note" onClick={() => setDismissed(true)}>Dismiss</button></aside>, host);
}
