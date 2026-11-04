"use client";
import * as React from "react";
import { useSupplierInquiry } from "@/components/scene2/investigation/overview/SupplierInquiryProvider";
import { deccanInquiry } from "@/lib/scene2/investigation/inquiry";
import type { InvestigationTab } from "@/lib/scene2/supplierView";
import styles from "./MaterialWalkthrough.module.css";

export type MaterialBeat = "forecast" | "stakes" | "path" | "network" | "question" | "assessment" | "action" | "assistant" | "reasoning" | "evidence" | "source" | "complete";
const COPY: Readonly<Record<MaterialBeat, { title: string; body: string; target: string; tab: InvestigationTab; interactive?: boolean }>> = {
  forecast: { title: "See the disruption before the production gap.", body: "Drona links an early external signal to this order’s material need. Incoming billet may arrive after Deccan needs it. Stock could still protect the order.", target: '[data-guide-target="finding"]', tab: "overview" },
  stakes: { title: "Know what is exposed, and when to act.", body: "$1.6M of purchase commitments is linked to this lot. Twelve turbines depend on it. Four days remain to preserve the proposed cover route; this is not a loss estimate.", target: '[data-material-stakes]', tab: "overview" },
  path: { title: "Follow the risk beyond your direct supplier.", body: "Deccan’s billet runs through a dealer to an upstream producer and a specific shipment. The dated allocation makes this signal relevant to your order.", target: '[data-material-critical-path] section:not(:first-child)', tab: "supply-chain" },
  network: { title: "A critical path within a wider network.", body: "Drona keeps the wider mapped relationships alongside the selected concern. Background suppliers add context; a mapped connection alone does not establish exposure.", target: '[data-graph-canvas]', tab: "supply-chain" },
  question: { title: "Enter the supplier conversation prepared.", body: "Prepare for call explains what each answer means. Try a sample answer, then record it. Drona checks stock protection before treating a late shipment as an order-level gap.", target: '[data-working-question]', tab: "overview", interactive: true },
  assessment: { title: "Evidence changes the assessment.", body: "The recorded owner reply updates the finding, unresolved questions, network and financial exposure. Unknown, declined and pending replies remain distinct from No.", target: '[data-guide-target="finding"]', tab: "overview" },
  action: { title: "Turn the finding into a useful next action.", body: "Drona identifies the responsible owner, the evidence needed and a response with a timing basis. A proposed route still needs feasibility and execution checks.", target: '[data-guide-target="next-action"]', tab: "overview" },
  assistant: { title: "Ask in the context of this supplier.", body: "Explore why the order is affected, what would change the assessment or who can act. The answer stays tied to the current supplier, order and evidence.", target: '[aria-label="Supplier-specific Drona conversation"]', tab: "overview", interactive: true },
  reasoning: { title: "Inspect the forecast’s reasoning.", body: "Observations, inferences and future consequences remain distinct. This forecast connects the shipment hold, the usable-receipt plan and the material need date.", target: '[data-reasoning-node="claim:dc-receipt"]', tab: "evidence" },
  evidence: { title: "Every important claim has a basis.", body: "Inspect the supporting sources, assumptions and evidence that could change the view. Open the carrier advisory to examine the record behind this forecast.", target: '[data-claim-inspector="dc-receipt"]', tab: "evidence", interactive: true },
  source: { title: "Read the source, and its limits.", body: "The record carries its date, scope and relationship to the claim. A minimum hold is an assumption in the forecast, not a guaranteed arrival date. These records are fictional for this demonstration.", target: '[data-source-extract]', tab: "evidence" },
  complete: { title: "Your guided investigation is complete.", body: "You have followed a signal to an order, tested the risk and inspected the evidence. Continue into Drona to explore the network, try another answer or review the regulatory case.", target: '[data-investigation-header] button', tab: "overview" },
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
  return <Context.Provider value={value}>{children}{enabled ? <CaseSpotlight key={beat} scopeRef={scopeRef} beat={beat} copy={COPY[beat]} primaryLabel={label} waitForReply={beat === "question" && !decision.conclusion} onContinue={next} onBack={() => { const previous = history.at(-1); if (previous) { setHistory(h => h.slice(0, -1)); setBeat(previous); } }} canBack={history.length > 0} onExit={() => onExplore(false)} onEvidence={() => go("reasoning")} /> : null}</Context.Provider>;
}

interface Rect { left: number; top: number; width: number; height: number; radius: number }
function CaseSpotlight({ scopeRef, beat, copy, primaryLabel, waitForReply, canBack, onContinue, onBack, onExit, onEvidence }: { readonly scopeRef: React.RefObject<HTMLDivElement | null>; readonly beat: MaterialBeat; readonly copy: typeof COPY[MaterialBeat]; readonly primaryLabel: string; readonly waitForReply: boolean; readonly canBack: boolean; readonly onContinue: () => void; readonly onBack: () => void; readonly onExit: () => void; readonly onEvidence: () => void }): React.ReactElement {
  const card = React.useRef<HTMLDivElement>(null), heading = React.useRef<HTMLHeadingElement>(null), overlay = React.useRef<HTMLDivElement>(null);
  const maskId = React.useId().replace(/:/g, "");
  const [frame, setFrame] = React.useState<Rect | null>(null);
  const [position, setPosition] = React.useState<React.CSSProperties>({ visibility: "hidden" });
  React.useLayoutEffect(() => {
    const scope = scopeRef.current ?? overlay.current?.closest<HTMLDivElement>("[data-investigation]"); if (!scope) return;
    let scheduled = 0, first = true, missingFrames = 0, painted = false;
    let previousMeasurement: string | null = null;
    const changed = new Map<HTMLElement, boolean>();
    const restore = () => { changed.forEach((value, el) => { el.inert = value; }); changed.clear(); };
    const inert = (el: HTMLElement) => { if (el === overlay.current || el.contains(overlay.current)) return; if (!changed.has(el)) changed.set(el, el.inert); el.inert = true; };
    const measure = () => {
      restore();
      const targets = Array.from(scope.querySelectorAll<HTMLElement>(copy.target)).filter(el => el.getBoundingClientRect().width > 0);
      const target = targets[0];
      // A controlled tab can mount one commit after the beat changes. Keep the
      // layer unpainted until its real subject exists instead of flashing a
      // stale cutout; retain a bounded recovery state for a missing subject.
      if (!target && missingFrames++ < 12) {
        for (const child of Array.from(scope.children)) if (child instanceof HTMLElement) inert(child);
        scheduled = requestAnimationFrame(measure);
        return;
      }
      if (first && target) { target.scrollIntoView?.({ block: "nearest", behavior: "instant" }); first = false; }
      const scopeBox = scope.getBoundingClientRect();
      if (copy.interactive && target) {
        for (let node: HTMLElement | null = target; node && node !== scope; node = node.parentElement) for (const sibling of Array.from(node.parentElement?.children ?? [])) if (sibling !== node && sibling instanceof HTMLElement) inert(sibling);
      } else for (const child of Array.from(scope.children)) if (child instanceof HTMLElement) inert(child);
      const boxes = targets.map(el => el.getBoundingClientRect());
      const left = boxes.length ? Math.min(...boxes.map(r => r.left)) : scopeBox.left + 24;
      const top = boxes.length ? Math.max(scopeBox.top, Math.min(...boxes.map(r => r.top))) : scopeBox.top + 24;
      const right = boxes.length ? Math.min(scopeBox.right, Math.max(...boxes.map(r => r.right))) : left;
      const bottom = boxes.length ? Math.min(scopeBox.bottom, Math.max(...boxes.map(r => r.bottom))) : top;
      const nextFrame = target ? { left: left - scopeBox.left, top: top - scopeBox.top, width: right - left, height: Math.max(0, bottom - top), radius: Math.min(12, parseFloat(getComputedStyle(target).borderRadius) || 6) } : null;
      const measurement = JSON.stringify(nextFrame);
      const ready = !target || painted || previousMeasurement === measurement;
      previousMeasurement = measurement;
      setFrame(old => JSON.stringify(old) === measurement ? old : nextFrame);
      const margin = 20, gap = 16, leftRoom = left - scopeBox.left - margin - gap, rightRoom = scopeBox.right - right - margin - gap;
      const preferLeft = beat === "complete" || leftRoom >= 260;
      const width = Math.min(320, Math.max(250, preferLeft ? leftRoom : rightRoom), scopeBox.width - 40);
      const height = card.current?.getBoundingClientRect().height || 300;
      let x = preferLeft && leftRoom >= 250 ? left - gap - width : rightRoom >= 250 ? right + gap : scopeBox.left + margin;
      let y = Math.max(scopeBox.top + margin, Math.min(top + (bottom - top - height) / 2, scopeBox.bottom - height - margin));
      if (beat === "complete") { x = scopeBox.left + 24; y = Math.min(scopeBox.bottom - height - 20, scopeBox.top + 150); }
      setPosition({ left: x - scopeBox.left, top: y - scopeBox.top, width, maxHeight: scopeBox.height - 40, visibility: ready ? "visible" : "hidden" });
      if (ready) painted = true;
      else scheduled = requestAnimationFrame(measure);
    };
    const schedule = () => { cancelAnimationFrame(scheduled); scheduled = requestAnimationFrame(measure); };
    measure();
    const observer = new MutationObserver(records => { if (records.some(record => !overlay.current?.contains(record.target))) schedule(); });
    // Graph fit/pan changes transform styles without resizing its nodes.
    observer.observe(scope, { childList: true, subtree: true, attributes: true, attributeFilter: ["style", "class", "data-state"] });
    const resize = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(schedule); resize?.observe(scope); if (card.current) resize?.observe(card.current);
    document.addEventListener("scroll", schedule, true); window.addEventListener("resize", schedule);
    return () => { cancelAnimationFrame(scheduled); restore(); observer.disconnect(); resize?.disconnect(); document.removeEventListener("scroll", schedule, true); window.removeEventListener("resize", schedule); };
  }, [scopeRef, beat, copy]);
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
  return <div ref={overlay} className={styles.overlay} data-material-guide={beat} data-material-ready={Boolean(frame) && position.visibility === "visible"} data-guide-control>
    <svg className={styles.veil} width="100%" height="100%" aria-hidden="true"><defs><mask id={maskId}><rect width="100%" height="100%" fill="white" />{frame ? <rect data-material-aperture x={frame.left} y={frame.top} width={frame.width} height={frame.height} rx={frame.radius} fill="black" /> : null}</mask></defs><rect width="100%" height="100%" fill="rgba(17,19,18,.48)" mask={`url(#${maskId})`} /></svg>
    <section ref={card} style={position} className={styles.card} role="region" aria-labelledby={`material-${beat}-title`} aria-describedby={`material-${beat}-body`} data-material-coach>
      <div className={styles.reading}><p className={styles.eyebrow}>Act Three · Supplier investigation</p><h2 ref={heading} tabIndex={-1} id={`material-${beat}-title`}>{copy.title}</h2><p id={`material-${beat}-body`}>{copy.body}</p>{waitForReply ? <p className={styles.note}>Choose a reply in the highlighted question, then select “Record sample reply and reassess”.</p> : null}{!frame ? <p className={styles.note}>This view is opening. You can continue or exit the walkthrough.</p> : null}</div>
      <nav className={styles.controls} aria-label="Supplier walkthrough controls"><button type="button" onClick={onBack} disabled={!canBack}>Back</button><button type="button" onClick={onExit}>Exit walkthrough</button>{!waitForReply ? <button type="button" className={styles.primary} onClick={onContinue}>{primaryLabel} <span aria-hidden="true">→</span></button> : null}</nav>
      {beat === "assessment" || beat === "question" ? <button type="button" className={styles.skip} onClick={onEvidence}>Continue to the evidence</button> : null}
    </section>
  </div>;
}
