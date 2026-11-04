"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { type RiskTourBeat } from "@/components/surface/riskPresentation";
import styles from "./GuidedSpotlight.module.css";
import riskStyles from "./GuidedRiskSpotlight.module.css";

interface Props { readonly target: string; readonly step: "risks" | "exposure" | "capital" | "order"; readonly focusTarget?: string; readonly primaryLabel?: string; readonly beat?: RiskTourBeat; readonly title: string; readonly body: string; readonly eyebrow: string; readonly onContinue: () => void; readonly onBack: () => void; readonly onExit: () => void }
const FOCUSABLE = 'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex="0"]';

/** The actual card remains mounted. Its ancestor hosts the modal semantics;
 * sibling branches become inert, so the target and teaching controls share one
 * accessible scope. There is no second dialog around a visually clear hole. */
export function GuidedSurfaceSpotlight({ target, focusTarget, primaryLabel, step, beat, title, body, eyebrow, onContinue, onBack, onExit }: Props): React.ReactElement | null {
  const [host, setHost] = React.useState<HTMLElement | null>(null);
  const [frame, setFrame] = React.useState<React.CSSProperties | null>(null);
  const [placement, setPlacement] = React.useState<React.CSSProperties>({ visibility: "hidden" });
  const [unavailable, setUnavailable] = React.useState(false);
  const card = React.useRef<HTMLDivElement>(null);
  const heading = React.useRef<HTMLHeadingElement>(null);
  const exit = React.useRef(onExit);
  exit.current = onExit;
  const titleId = React.useId();
  const descriptionId = React.useId();


  React.useLayoutEffect(() => { setHost(document.querySelector<HTMLElement>("[data-guided-boundary]")); }, []);
  React.useLayoutEffect(() => {
    if (!host) return;
    const subject = host.querySelector<HTMLElement>(target);
    const attributes = ["role", "aria-modal", "aria-labelledby", "aria-describedby"].map(name => [name, host.getAttribute(name)] as const);
    host.setAttribute("role", "dialog"); host.setAttribute("aria-modal", "true");
    host.setAttribute("aria-labelledby", titleId); host.setAttribute("aria-describedby", descriptionId);
    const inertElements: { element: HTMLElement; wasInert: boolean }[] = [];
    // Inert sibling branches along the target path, preserving every ancestor.
    const protect = (parent: HTMLElement, allowed: HTMLElement | null) => {
      for (const child of Array.from(parent.children)) {
        if (!(child instanceof HTMLElement) || child === allowed || child.hasAttribute("data-risk-spotlight")) continue;
        inertElements.push({ element: child, wasInert: child.inert }); child.inert = true;
      }
    };
    if (subject) {
      for (let child: HTMLElement = subject; child.parentElement; child = child.parentElement) {
        protect(child.parentElement, child);
        if (child.parentElement === host) break;
      }
    } else protect(host, null);
    const previousStyle = subject?.getAttribute("style") ?? null;
    const presentingAttribute = step === "risks" ? "data-risk-presenting" : "data-financial-presenting";
    const previousPresenting = subject?.getAttribute(presentingAttribute) ?? null;
    subject?.setAttribute(presentingAttribute, "true");
    // A completed entrance animation still establishes a containing block for
    // fixed children. Suspend it while the real card is lifted, then restore it.
    const ancestorStyles: { element: HTMLElement; style: string | null }[] = [];
    for (let parent = subject?.parentElement; parent && parent !== host; parent = parent.parentElement) {
      if (getComputedStyle(parent).transform !== "none") {
        ancestorStyles.push({ element: parent, style: parent.getAttribute("style") });
        parent.style.animation = "none"; parent.style.transform = "none";
      }
    }
    // An observation must begin at the value, not retain a scrolled list.
    // One keyboard scroll region contains both the figure and order rows.
    const financialBody = step === "exposure" || step === "order" ? subject?.querySelector<HTMLElement>("[data-financial-summary]")?.parentElement : null;
    const orderList = financialBody?.querySelector<HTMLElement>('[aria-label="Production order list"]');
    const bodyAttributes = financialBody ? ["tabindex", "role", "aria-label"].map(name => [name, financialBody.getAttribute(name)] as const) : [];
    const orderTabIndex = orderList?.getAttribute("tabindex") ?? null;
    const previousScrollTop = financialBody?.scrollTop ?? 0;
    let readingReset = true;
    if (financialBody) { financialBody.scrollTop = 0; financialBody.tabIndex = 0; financialBody.setAttribute("role", "region"); financialBody.setAttribute("aria-label", "Financial exposure and production orders"); }
    if (orderList) orderList.tabIndex = -1;
    let scheduled = 0;
    let active = true;
    const measure = () => {
      if (!active) return;
      const width = window.innerWidth, height = window.innerHeight;
      const margin = width < 600 ? 12 : 24;
      const wide = width >= 1100;
      const guideWidth = Math.min(360, width - margin * 2);
      const gap = wide ? 16 : 12;
      const guideBudget = wide ? height - margin * 2 : Math.max(100, height - margin * 2 - gap - 120);
      // Measure the full reading content, independently of an earlier max-height.
      // Measuring the clipped outer card feeds its old size back into placement.
      const reading = card.current?.firstElementChild as HTMLElement | null;
      const controls = card.current?.lastElementChild as HTMLElement | null;
      const intrinsicGuideHeight = reading && controls ? reading.scrollHeight + controls.offsetHeight + 2 : wide ? 340 : 230;
      const guideHeight = Math.min(intrinsicGuideHeight, guideBudget);
      const subjectWidth = wide ? Math.min(step === "capital" ? 480 : step === "risks" ? 700 : 640, width - guideWidth - gap - margin * 2) : Math.min(step === "capital" ? 480 : width, width - margin * 2);
      const subjectHeight = wide ? Math.min(step === "capital" ? 320 : 660, height - margin * 2) : Math.min(step === "capital" ? 320 : height, Math.max(120, height - guideHeight - gap - margin * 2));
      if (subject) {
        Object.assign(subject.style, { position: "fixed", zIndex: "121", width: `${subjectWidth}px`, height: `${subjectHeight}px`, minHeight: "0", maxHeight: "none", top: `${wide ? Math.max(margin, (height - subjectHeight) / 2) : margin}px`, right: ((step === "exposure" || step === "order") && wide) || (step === "capital" && !wide) ? "auto" : `${margin}px`, left: ((step === "exposure" || step === "order") && wide) || (step === "capital" && !wide) ? `${margin}px` : "auto" });
      }
      const rect = subject?.getBoundingClientRect();
      if (financialBody && readingReset) {
        // Keep the panel in place; advance its reading position to the real list.
        const row = subject?.querySelector<HTMLElement>('[data-guide-target="order:c1"]');
        const view = financialBody.getBoundingClientRect();
        const rowRect = row?.getBoundingClientRect();
        const rowFits = rowRect && rowRect.top >= view.top && rowRect.bottom <= view.bottom;
        financialBody.scrollTop = step === "order" && orderList && !rowFits ? financialBody.scrollTop + orderList.getBoundingClientRect().top - view.top : 0;
        readingReset = false;
      }
      const focal = focusTarget ? subject?.querySelector<HTMLElement>(focusTarget) : subject;
      const focalRect = focal?.getBoundingClientRect();
      const clip = financialBody?.getBoundingClientRect() ?? rect;
      const padding = focusTarget ? 10 : 0;
      // A section spotlight spans the actual panel, including its gutters and
      // scrollbar. Only its vertical extent follows the focused content region.
      const left = Math.max(rect?.left ?? 0, 0);
      const top = Math.max((focalRect?.top ?? 0) - padding, clip?.top ?? 0, 0);
      const right = Math.min(rect?.right ?? 0, window.innerWidth);
      const bottom = Math.min((focalRect?.bottom ?? 0) + padding, clip?.bottom ?? 0, window.innerHeight);
      const valid = Boolean(rect && right > left && bottom > top);
      setUnavailable(!valid);
      setFrame(valid ? { left, top, width: right - left, height: bottom - top, borderRadius: focusTarget ? 8 : getComputedStyle(subject!).borderTopLeftRadius } : null);
      setPlacement({ width: guideWidth, left: wide && rect ? step === "exposure" || step === "order" ? rect.right + gap : rect.left - gap - guideWidth : margin,
        top: wide ? Math.max(margin, (height - guideHeight) / 2) : valid && rect ? rect.bottom + gap : margin,
        maxHeight: wide ? height - margin * 2 : Math.max(100, height - (valid && rect ? rect.bottom + gap : margin) - margin), visibility: "visible" });
    };
    const schedule = () => { cancelAnimationFrame(scheduled); scheduled = requestAnimationFrame(measure); };
    const allowed = () => Array.from(host.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(element =>
      element.tabIndex >= 0 && !element.closest('[inert], [aria-disabled="true"]') && (subject?.contains(element) || card.current?.contains(element)) && element.getClientRects().length > 0);
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); exit.current(); return; }
      if (event.key !== "Tab") return;
      const controls = allowed();
      const index = controls.indexOf(document.activeElement as HTMLElement);
      event.preventDefault();
      controls[(index + (event.shiftKey ? -1 : 1) + controls.length) % controls.length]?.focus();
    };
    const focusin = (event: FocusEvent) => { if (event.target instanceof Node && !host.contains(event.target)) heading.current?.focus({ preventScroll: true }); };
    measure();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(schedule);
    if (card.current) {
      observer?.observe(card.current);
      for (const text of card.current.querySelectorAll("h2, p")) observer?.observe(text);
    }
    // Container queries may settle after the imperative lift; follow the actual
    // target rather than keeping a rectangle measured before that layout pass.
    if (subject) observer?.observe(subject);
    if (focusTarget) {
      const focal = subject?.querySelector<HTMLElement>(focusTarget);
      if (focal) observer?.observe(focal);
    }
    window.addEventListener("resize", schedule);
    document.addEventListener("scroll", schedule, true);
    document.addEventListener("keydown", keydown, true);
    document.addEventListener("focusin", focusin, true);
    heading.current?.focus({ preventScroll: true });
    return () => {
      active = false; cancelAnimationFrame(scheduled); observer?.disconnect(); window.removeEventListener("resize", schedule); document.removeEventListener("scroll", schedule, true);
      document.removeEventListener("keydown", keydown, true); document.removeEventListener("focusin", focusin, true);
      if (financialBody) financialBody.scrollTop = previousScrollTop;
      if (financialBody) for (const [name, value] of bodyAttributes) { if (value === null) financialBody.removeAttribute(name); else financialBody.setAttribute(name, value); }
      if (orderList) { if (orderTabIndex === null) orderList.removeAttribute("tabindex"); else orderList.setAttribute("tabindex", orderTabIndex); }
      for (const { element, wasInert } of inertElements) element.inert = wasInert;
      for (const [name, value] of attributes) { if (value === null) host.removeAttribute(name); else host.setAttribute(name, value); }
      for (const {element, style} of ancestorStyles) { if (style === null) element.removeAttribute("style"); else element.setAttribute("style", style); }
      if (subject) { if (previousPresenting === null) subject.removeAttribute(presentingAttribute); else subject.setAttribute(presentingAttribute, previousPresenting); }
      if (subject) { if (previousStyle === null) subject.removeAttribute("style"); else subject.setAttribute("style", previousStyle); }
      requestAnimationFrame(() => document.querySelector<HTMLElement>('[data-guide-step="exposure"] h2, [data-guide-step="capital"] h2, [data-guide-step="order"] button, [data-guide-step="map"] h2, [data-guide-cover] main button')?.focus({ preventScroll: true }));
    };
  }, [host, titleId, descriptionId, target, focusTarget, step]);
  const positioned = frame !== null || unavailable;
  React.useEffect(() => {
    if (!host || !positioned) return;
    // The preceding modal and the initially hidden positioning shell must both
    // release before a browser can focus this heading. Check actual readiness;
    // this never advances the tour or changes evidence.
    let scheduled = 0;
    let attempts = 0;
    const focusWhenReady = () => {
      const target = heading.current;
      if (!target?.isConnected) return;
      if (getComputedStyle(target).visibility === "visible" && target.getClientRects().length > 0) {
        target.focus({ preventScroll: true });
        if (document.activeElement === target) return;
      }
      if (++attempts < 120) scheduled = requestAnimationFrame(focusWhenReady);
    };
    scheduled = requestAnimationFrame(focusWhenReady);
    return () => cancelAnimationFrame(scheduled);
  }, [beat, step, host, positioned, placement.visibility]);
  if (!host) return null;
  return createPortal(<div className={`${styles.stage} ${riskStyles.stage}`} style={focusTarget ? { zIndex: 122 } : undefined} data-risk-spotlight data-guide-control data-guide-step={step} data-guide-act="1" data-spotlight-focus={focusTarget ? step : "surface"} data-risk-beat={beat} data-positioned={positioned}>
    {frame ? <div aria-hidden="true" data-spotlight-aperture className={styles.aperture} style={frame} /> : <div aria-hidden="true" className={styles.blanket} />}
    <div ref={card} data-spotlight-card className={`${styles.card} ${riskStyles.card}`} style={placement}>
      <div className={`${styles.reading} ${riskStyles.reading}`} tabIndex={0} aria-label={`${eyebrow} explanation`}>
        <p className={styles.eyebrow}>{eyebrow}</p>
        <h2 ref={heading} tabIndex={-1} id={titleId} className={styles.title}>{title}</h2>
        <p id={descriptionId} className={styles.description}>{body}</p>
        {unavailable ? <p className={styles.note}>This card is unavailable. You can continue to the order overview.</p> : null}
      </div>
      <nav className={styles.controls} aria-label="Walkthrough controls">
        <button type="button" className={styles.secondary} onClick={onBack}>Back</button>
        <button type="button" className={styles.secondary} onClick={onExit}>Exit</button>
        <button type="button" className={styles.primary} onClick={onContinue}>{primaryLabel ?? (step !== "risks" || beat === "regulatory" ? "Continue" : "Next example")} <span aria-hidden="true">→</span></button>
      </nav>
    </div>
  </div>, host);
}
