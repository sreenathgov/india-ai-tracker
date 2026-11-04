"use client";
import * as React from "react";
import { useSupplierInquiry } from "@/components/scene2/investigation/overview/SupplierInquiryProvider";
import { deccanInquiry } from "@/lib/scene2/investigation/inquiry";
import type { InvestigationTab } from "@/lib/scene2/supplierView";
import { hasSideNarration } from "@/lib/demo/desktop";
import { frameSection, placeCoach, type ReadingRail } from "./materialFraming";
import styles from "./MaterialWalkthrough.module.css";

export type MaterialBeat = "forecast" | "stakes" | "path" | "network" | "question" | "assessment" | "action" | "assistant" | "reasoning" | "evidence" | "source" | "complete";
const COPY: Readonly<Record<MaterialBeat, { title: string; body: string; target: string; tab: InvestigationTab; interactive?: boolean }>> = {
  forecast: { title: "See the disruption before the production gap.", body: "Drona links an early external signal to this order’s material need. Incoming billet may arrive after Deccan needs it. Stock could still protect the order.", target: '[data-guide-target="finding"]', tab: "overview" },
  stakes: { title: "Know what is exposed, and when to act.", body: "$1.6M of purchase commitments is linked to this lot. Twelve turbines depend on it. Four days remain to preserve the proposed cover route; this is not a loss estimate.", target: '[data-material-stakes]', tab: "overview" },
  path: { title: "Follow the risk beyond your direct supplier.", body: "Deccan’s billet runs through a dealer to an upstream producer and a specific shipment. The dated allocation makes this signal relevant to your order.", target: '[data-supply-chain]', tab: "supply-chain" },
  network: { title: "A critical path within a wider network.", body: "Drona keeps the wider mapped relationships alongside the selected concern. Background suppliers add context; a mapped connection alone does not establish exposure.", target: '[data-supply-chain]', tab: "supply-chain" },
  question: { title: "Enter the supplier conversation prepared.", body: "Prepare for call explains what each answer means. Try a sample answer, then record it. Drona checks stock protection before treating a late shipment as an order-level gap.", target: '[data-working-question]', tab: "overview", interactive: true },
  assessment: { title: "Evidence changes the assessment.", body: "The recorded owner reply updates the finding, unresolved questions, network and financial exposure. Unknown, declined and pending replies remain distinct from No.", target: '[data-guide-target="finding"]', tab: "overview" },
  action: { title: "Turn the finding into a useful next action.", body: "Drona identifies the responsible owner, the evidence needed and a response with a timing basis. A proposed route still needs feasibility and execution checks.", target: '[data-working-question]', tab: "overview" },
  assistant: { title: "Ask in the context of this supplier.", body: "Explore why the order is affected, what would change the assessment or who can act. The answer stays tied to the current supplier, order and evidence.", target: '[aria-label="Supplier-specific Drona conversation"]', tab: "overview", interactive: true },
  reasoning: { title: "Inspect the forecast’s reasoning.", body: "Observations, inferences and future consequences remain distinct. This forecast connects the shipment hold, the usable-receipt plan and the material need date.", target: '[data-evidence-panel]', tab: "evidence" },
  evidence: { title: "Every important claim has a basis.", body: "Inspect the supporting sources, assumptions and evidence that could change the view. Open the carrier advisory to examine the record behind this forecast.", target: '[data-claim-inspector="dc-receipt"]', tab: "evidence", interactive: true },
  source: { title: "Read the source, and its limits.", body: "The record carries its date, scope and relationship to the claim. A minimum hold is an assumption in the forecast, not a guaranteed arrival date. These records are fictional for this demonstration.", target: '[data-material-source-record]', tab: "evidence", interactive: true },
  complete: { title: "Your guided investigation is complete.", body: "You have followed a signal to an order, tested the risk and inspected the evidence. Continue into Drona to explore the network, try another answer or review the regulatory case.", target: '[data-investigation-header]', tab: "overview" },
};
interface Tour { readonly enabled: boolean; readonly beat: MaterialBeat; readonly sourceId: string; readonly sourceOpened: (id: string) => void }
const Context = React.createContext<Tour | null>(null);
export const useMaterialWalkthrough = () => React.useContext(Context);
export function MaterialWalkthrough({ children, enabled, scopeRef, tab, onTabChange, onExplore }: { readonly children: React.ReactNode; readonly enabled: boolean; readonly scopeRef: React.RefObject<HTMLDivElement | null>; readonly tab: InvestigationTab; readonly onTabChange: (tab: InvestigationTab) => void; readonly onExplore: (completed?: boolean) => void }): React.ReactElement {
  const { state } = useSupplierInquiry();
  const decision = deccanInquiry(state);
  const [beat, setBeat] = React.useState<MaterialBeat>("forecast");
  const [history, setHistory] = React.useState<MaterialBeat[]>([]);
  const [sourceId, setSourceId] = React.useState("dc-ev-carrier");
  const baseline = React.useRef(state.replies.length);
  const go = React.useCallback((next: MaterialBeat) => { setHistory(h => [...h, beat]); setBeat(next); }, [beat]);
  React.useEffect(() => { if (enabled && tab !== COPY[beat].tab) onTabChange(COPY[beat].tab); }, [enabled, beat, tab, onTabChange]);
  React.useEffect(() => { if (beat === "question") baseline.current = state.replies.length; }, [beat]);
  React.useEffect(() => { if (enabled && beat === "question" && state.replies.length > baseline.current) go("assessment"); }, [enabled, beat, state.replies.length, go]);
  const value = React.useMemo<Tour>(() => ({ enabled, beat, sourceId, sourceOpened: id => { if (enabled && beat === "evidence") { setSourceId(id); go("source"); } } }), [enabled, beat, sourceId, go]);
  function next() {
    if (beat === "complete") { onExplore(true); return; }
    const after: Readonly<Record<MaterialBeat, MaterialBeat>> = { forecast: "stakes", stakes: "path", path: "network", network: "question", question: "assessment", assessment: decision.conclusion ? "action" : "question", action: "assistant", assistant: "reasoning", reasoning: "evidence", evidence: "source", source: "complete", complete: "complete" };
    go(after[beat]);
  }
  const label = beat === "complete" ? "Explore Drona" : beat === "evidence" ? "Open source" : beat === "assessment" && !decision.conclusion ? "Next question" : "Continue";
  const rail: ReadingRail = ["path", "network", "reasoning"].includes(beat) ? "left" : beat === "source" ? "right" : null;
  return <Context.Provider value={value}><div className={styles.stage} data-material-layout={enabled ? rail : undefined} data-material-beat={enabled ? beat : undefined}>{children}</div>{enabled ? <CaseSpotlight key={beat} scopeRef={scopeRef} beat={beat} rail={rail} copy={COPY[beat]} primaryLabel={label} waitForReply={beat === "question" && !decision.conclusion} onContinue={next} onBack={() => { const previous = history.at(-1); if (previous) { setHistory(h => h.slice(0, -1)); setBeat(previous); } }} canBack={history.length > 0} onExit={() => onExplore(false)} onEvidence={() => go("reasoning")} /> : null}</Context.Provider>;
}

interface Rect { left: number; top: number; width: number; height: number; radius: number }
function CaseSpotlight({ scopeRef, beat, rail, copy, primaryLabel, waitForReply, canBack, onContinue, onBack, onExit, onEvidence }: { readonly scopeRef: React.RefObject<HTMLDivElement | null>; readonly beat: MaterialBeat; readonly rail: ReadingRail; readonly copy: typeof COPY[MaterialBeat]; readonly primaryLabel: string; readonly waitForReply: boolean; readonly canBack: boolean; readonly onContinue: () => void; readonly onBack: () => void; readonly onExit: () => void; readonly onEvidence: () => void }): React.ReactElement {
  const card = React.useRef<HTMLDivElement>(null), heading = React.useRef<HTMLHeadingElement>(null), overlay = React.useRef<HTMLDivElement>(null);
  const maskId = React.useId().replace(/:/g, "");
  const [frame, setFrame] = React.useState<Rect | null>(null);
  const [position, setPosition] = React.useState<React.CSSProperties>({ visibility: "hidden" });
  React.useLayoutEffect(() => {
    const scope = scopeRef.current ?? overlay.current?.closest<HTMLDivElement>("[data-investigation]"); if (!scope) return;
    const previousNarration = scope.getAttribute("data-material-narration");
    const previousBandHeight = scope.style.getPropertyValue("--material-band-height");
    let scheduled = 0, missingFrames = 0, painted = false;
    let previousMeasurement: string | null = null;
    let resize: ResizeObserver | null = null;
    const watchedTargets = new Set<HTMLElement>();
    const changed = new Map<HTMLElement, boolean>();
    const restore = () => { changed.forEach((value, el) => { el.inert = value; }); changed.clear(); };
    const inert = (el: HTMLElement) => { if (el === overlay.current || el.contains(overlay.current)) return; if (!changed.has(el)) changed.set(el, el.inert); el.inert = true; };
    const measure = () => {
      restore();
      const scopeBox = scope.getBoundingClientRect();
      const band = beat !== "complete" && !hasSideNarration(scopeBox.width, window.innerHeight);
      scope.setAttribute("data-material-narration", band ? "band" : "side");
      const bandHeight = Math.ceil(card.current?.getBoundingClientRect().height || 140);
      const bandValue = `${bandHeight}px`;
      if (scope.style.getPropertyValue("--material-band-height") !== bandValue) scope.style.setProperty("--material-band-height", bandValue);
      const bodyBox = scope.querySelector<HTMLElement>("[data-material-narration-space]")?.getBoundingClientRect();
      const targets = Array.from(scope.querySelectorAll<HTMLElement>(copy.target)).filter(el => el.getBoundingClientRect().width > 0);
      for (const el of targets) if (!watchedTargets.has(el)) { watchedTargets.add(el); resize?.observe(el); }
      const target = targets[0];
      // A controlled tab can mount one commit after the beat changes. Keep the
      // layer unpainted until its real subject exists instead of flashing a
      // stale cutout; retain a bounded recovery state for a missing subject.
      if (!target && missingFrames++ < 12) {
        for (const child of Array.from(scope.children)) if (child instanceof HTMLElement) inert(child);
        scheduled = requestAnimationFrame(measure);
        return;
      }
      // Replies and assistant answers can grow the real section after entry.
      // Keep its outer reading surface in view without resetting its own scroll.
      target?.scrollIntoView?.({ block: band ? "start" : "nearest", inline: "nearest", behavior: "instant" });
      if (copy.interactive && target) {
        for (let node: HTMLElement | null = target; node && node !== scope; node = node.parentElement) for (const sibling of Array.from(node.parentElement?.children ?? [])) if (sibling !== node && sibling instanceof HTMLElement) inert(sibling);
      } else for (const child of Array.from(scope.children)) if (child instanceof HTMLElement) inert(child);
      const boxes = targets.map(el => el.getBoundingClientRect());
      const inset = beat === "complete" ? 0 : 12;
      const clip = { left: scopeBox.left + inset, top: scopeBox.top + inset, right: scopeBox.right - inset, bottom: scopeBox.bottom - inset };
      // A scrolled section must never punch a hole through the fixed tab/header.
      // Respect native clipping ancestors as well as the outer dialog boundary.
      for (let parent = target?.parentElement; parent && parent !== scope; parent = parent.parentElement) {
        const css = getComputedStyle(parent), bounds = parent.getBoundingClientRect();
        if (/(auto|scroll|hidden|clip)/.test(css.overflowX)) { clip.left = Math.max(clip.left, bounds.left); clip.right = Math.min(clip.right, bounds.right); }
        if (/(auto|scroll|hidden|clip)/.test(css.overflowY)) { clip.top = Math.max(clip.top, bounds.top); clip.bottom = Math.min(clip.bottom, bounds.bottom); }
      }
      const subject = target ? frameSection({ left: Math.min(...boxes.map(r => r.left)), top: Math.min(...boxes.map(r => r.top)), right: Math.max(...boxes.map(r => r.right)), bottom: Math.max(...boxes.map(r => r.bottom)) }, clip) : null;
      const nextFrame = subject ? { ...subject, left: subject.left - scopeBox.left, top: subject.top - scopeBox.top } : null;
      const measurement = JSON.stringify(nextFrame);
      const ready = !target || painted || previousMeasurement === measurement;
      previousMeasurement = measurement;
      setFrame(old => JSON.stringify(old) === measurement ? old : nextFrame);
      const preferredWidth = parseFloat(getComputedStyle(overlay.current!).getPropertyValue("--material-coach-width")) || 320;
      const width = band && bodyBox ? bodyBox.width - 40 : Math.min(beat === "complete" ? 320 : preferredWidth, scopeBox.width - 48);
      const height = card.current?.getBoundingClientRect().height || 300;
      const position = placeCoach(scopeBox, subject, width, height, rail, beat === "complete");
      setPosition({ left: band && bodyBox ? bodyBox.left - scopeBox.left + 20 : position.left - scopeBox.left, top: band && bodyBox ? bodyBox.top - scopeBox.top + 12 : position.top - scopeBox.top, width, maxHeight: band ? Math.max(140, scopeBox.height * .38) : scopeBox.height - 48, visibility: ready ? "visible" : "hidden" });
      if (ready) painted = true;
      else scheduled = requestAnimationFrame(measure);
    };
    const schedule = () => { cancelAnimationFrame(scheduled); scheduled = requestAnimationFrame(measure); };
    measure();
    const observer = new MutationObserver(records => { if (records.some(record => !overlay.current?.contains(record.target))) schedule(); });
    // Graph fit/pan changes transform styles without resizing its nodes.
    observer.observe(scope, { childList: true, subtree: true, attributes: true, attributeFilter: ["style", "class", "data-state"] });
    // Native text wrapping, font/layout settling and reply growth can resize a
    // section without resizing the dialog or mutating its attributes.
    resize = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(schedule); resize?.observe(scope); if (card.current) resize?.observe(card.current); watchedTargets.forEach(el => resize?.observe(el));
    document.addEventListener("scroll", schedule, true); window.addEventListener("resize", schedule);
    return () => { cancelAnimationFrame(scheduled); restore(); observer.disconnect(); resize?.disconnect(); document.removeEventListener("scroll", schedule, true); window.removeEventListener("resize", schedule); if (previousNarration === null) scope.removeAttribute("data-material-narration"); else scope.setAttribute("data-material-narration", previousNarration); if (previousBandHeight) scope.style.setProperty("--material-band-height", previousBandHeight); else scope.style.removeProperty("--material-band-height"); };
  }, [scopeRef, beat, rail, copy]);
  React.useEffect(() => {
    if (position.visibility !== "visible") return;
    let frame = 0, attempts = 0;
    const focusWhenReady = () => {
      const target = heading.current;
      if (!target) return;
      // Portal focus scopes and inert restoration can settle after this effect.
      // Wait for the real visible heading; stop as soon as focus is accepted.
      if (!target.closest("[inert]") && getComputedStyle(target).visibility === "visible") target.focus({ preventScroll: true });
      if (document.activeElement !== target && ++attempts < 30) frame = requestAnimationFrame(focusWhenReady);
    };
    frame = requestAnimationFrame(focusWhenReady);
    return () => cancelAnimationFrame(frame);
  }, [beat, position.visibility]);
  return <div ref={overlay} className={styles.overlay} data-material-guide={beat} data-material-subject={copy.target} data-material-ready={Boolean(frame) && position.visibility === "visible"} data-guide-control>
    <svg className={styles.veil} width="100%" height="100%" aria-hidden="true"><defs><mask id={maskId}><rect width="100%" height="100%" fill="white" />{frame ? <rect data-material-aperture x={frame.left} y={frame.top} width={frame.width} height={frame.height} rx={frame.radius} fill="black" /> : null}</mask></defs><rect width="100%" height="100%" fill="rgba(17,19,18,.48)" mask={`url(#${maskId})`} /></svg>
    <section ref={card} style={position} className={styles.card} role="region" aria-labelledby={`material-${beat}-title`} aria-describedby={`material-${beat}-body`} data-material-coach>
      <div className={styles.reading}><p className={styles.eyebrow}>Act Three · Supplier investigation</p><h2 ref={heading} tabIndex={-1} id={`material-${beat}-title`}>{copy.title}</h2><p id={`material-${beat}-body`}>{copy.body}</p>{waitForReply ? <p className={styles.note}>Choose a reply in the highlighted question, then select “Record sample reply and reassess”.</p> : null}{!frame ? <p className={styles.note}>This view is opening. You can continue or exit the walkthrough.</p> : null}</div>
      <nav className={styles.controls} aria-label="Supplier walkthrough controls"><button type="button" onClick={onBack} disabled={!canBack}>Back</button><button type="button" onClick={onExit}>Exit walkthrough</button>{!waitForReply ? <button type="button" className={styles.primary} onClick={onContinue}>{primaryLabel} <span aria-hidden="true">→</span></button> : null}</nav>
      {beat === "assessment" || beat === "question" ? <button type="button" className={styles.skip} onClick={onEvidence}>Continue to the evidence</button> : null}
    </section>
  </div>;
}
