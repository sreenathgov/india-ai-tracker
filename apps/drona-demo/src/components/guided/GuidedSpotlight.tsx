"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import styles from "./GuidedSpotlight.module.css";

interface Frame { readonly left: number; readonly top: number; readonly width: number; readonly height: number; readonly borderRadius: number | string }
interface GuidedSpotlightProps {
  readonly step?: "map" | "order-overview" | "supplier-overview" | "material-launch";
  readonly target: string;
  readonly eyebrow: string;
  readonly title: string;
  readonly description: string;
  readonly primaryLabel?: string;
  readonly supporting?: string;
  readonly handoff?: string;
  readonly onContinue: () => void;
  readonly onBack: () => void;
  readonly onExit: () => void;
}

/**
 * An observation stage: the real subject stays mounted and visible beneath the
 * aperture, while only the explanation is interactive. Interactive future stages
 * must include their real target in the active focus scope rather than clone it.
 */
export function GuidedSpotlight({ step = "map", target: selector, eyebrow, title, description, primaryLabel = "Continue", supporting, handoff, onContinue, onBack, onExit }: GuidedSpotlightProps): React.ReactElement {
  const card = React.useRef<HTMLDivElement>(null);
  const heading = React.useRef<HTMLHeadingElement>(null);
  const [frame, setFrame] = React.useState<Frame | null>(null);
  const [placement, setPlacement] = React.useState<React.CSSProperties>({ left: 24, top: 24, width: "min(360px, calc(100vw - 48px))", maxHeight: "calc(100dvh - 48px)" });
  const [unavailable, setUnavailable] = React.useState(false);

  React.useLayoutEffect(() => {
    const subject = document.querySelector<HTMLElement>(selector);
    const boundary = document.querySelector<HTMLElement>("[data-guided-boundary]");
    const wasInert = boundary?.inert ?? false;
    if (boundary) boundary.inert = true;
    const originalHeight = subject?.style.height ?? "";
    const originalMargin = subject?.style.scrollMarginTop ?? "";
    const scrollPositions: { element: HTMLElement; top: number; left: number }[] = [];
    for (let parent = subject?.parentElement; parent; parent = parent.parentElement) {
      scrollPositions.push({ element: parent, top: parent.scrollTop, left: parent.scrollLeft });
    }
    let scheduled = 0;
    let active = true;
    const measure = () => {
      if (!active) return;
      const width = window.innerWidth;
      const height = window.innerHeight;
      const margin = width < 600 ? 20 : 24;
      const gap = width < 1100 ? 20 : 16;
      const rect = subject?.getBoundingClientRect();
      const valid = rect && rect.width > 0 && rect.height > 0;
      setUnavailable(!valid || Boolean(subject?.querySelector("[data-map-fallback]")));
      if (!valid) {
        setFrame(null);
        setPlacement({ width: Math.min(360, width - margin * 2), left: margin, top: margin, maxHeight: height - margin * 2, visibility: "visible" });
        return;
      }
      // Follow the actual map boundary. An open padding ring would expose the
      // pale dashboard behind it and recreate the white frame we are removing.
      const radius = subject ? parseFloat(getComputedStyle(subject).borderTopLeftRadius) : 16;
      // A supplier grid is taller than the viewport. Keep its real full width,
      // clipping only at the viewport edge, without shrinking or lifting any cards.
      const suppliers = step === "supplier-overview";
      const frameTop = suppliers ? Math.max(0, rect.top) : rect.top;
      const frameBottom = suppliers ? Math.min(height, rect.bottom) : rect.bottom;
      const nextFrame: Frame = { left: rect.left, top: frameTop, width: rect.width, height: Math.max(0, frameBottom - frameTop), borderRadius: suppliers && rect.bottom > height ? `${Number.isFinite(radius) ? radius : 16}px ${Number.isFinite(radius) ? radius : 16}px 0 0` : Number.isFinite(radius) ? radius : 16 };
      setFrame(previous => previous && previous.borderRadius === nextFrame.borderRadius && Math.abs(previous.left - nextFrame.left) < .5 && Math.abs(previous.top - nextFrame.top) < .5 && Math.abs(previous.width - nextFrame.width) < .5 && Math.abs(previous.height - nextFrame.height) < .5 ? previous : nextFrame);
      const rightSpace = width - margin - rect.right - gap;
      const supplierSide = suppliers && width >= 1100 && rightSpace >= 240;
      const cardWidth = Math.min(360, width - margin * 2, supplierSide ? rightSpace : Infinity);
      const cardHeight = card.current?.getBoundingClientRect().height || 330;
      const beside = width >= 1100 && rect.left - gap - cardWidth >= margin;
      const rightBeside = supplierSide || (!beside && width >= 1100 && rect.right + gap + cardWidth <= width - margin);
      const top = beside || rightBeside
        ? Math.max(margin, Math.min(nextFrame.top + (nextFrame.height - cardHeight) / 2, height - cardHeight - margin))
        : Math.max(margin, rect.bottom + gap);
      setPlacement({
        width: cardWidth,
        left: beside ? rect.left - gap - cardWidth : rightBeside ? rect.right + gap : Math.max(margin, Math.min(rect.left, width - cardWidth - margin)),
        top,
        maxHeight: Math.max(100, height - top - margin),
        visibility: "visible",
      });
    };
    const schedule = () => { cancelAnimationFrame(scheduled); scheduled = requestAnimationFrame(measure); };
    const positionSubject = () => {
      if (subject) {
        // Reserve room below the map on compact screens. A short-screen card has
        // a scrollable reading region and always-visible navigation controls.
        subject.style.height = step === "map" && window.innerWidth < 1100 ? `${Math.min(300, Math.max(128, window.innerHeight - 410))}px` : originalHeight;
        subject.style.scrollMarginTop = "24px";
        const rect = subject.getBoundingClientRect();
        const firstRecord = step === "supplier-overview" ? subject.querySelector<HTMLElement>('[data-supplier-records="cards"] > li, [data-supplier-records="list"] tbody tr')?.getBoundingClientRect() : null;
        const bottom = step === "supplier-overview" ? firstRecord?.bottom ?? rect.top + 300 : rect.bottom;
        if ((step === "supplier-overview" && Math.abs(rect.top - 24) > 2) || rect.top < 20 || bottom > window.innerHeight - 24 || (step === "map" && window.innerWidth < 1100)) {
          // Move only the application reading area. Native scrollIntoView can
          // also shift the document and crop the persistent header/rail.
          let scroller = step === "supplier-overview" ? subject.parentElement : null;
          while (scroller && !(/auto|scroll/.test(getComputedStyle(scroller).overflowY) && scroller.scrollHeight > scroller.clientHeight + 1)) scroller = scroller.parentElement;
          if (scroller) scroller.scrollTop += rect.top - scroller.getBoundingClientRect().top - 24;
          else subject.scrollIntoView?.({ block: "start", behavior: "instant" });
        }
      }
      schedule();
    };
    positionSubject();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(schedule);
    if (subject) observer?.observe(subject);
    if (card.current) observer?.observe(card.current);
    const fallbackObserver = subject ? new MutationObserver(schedule) : null;
    if (subject) fallbackObserver?.observe(subject, { childList: true, subtree: true });
    window.addEventListener("resize", positionSubject);
    document.addEventListener("scroll", schedule, true);
    return () => {
      active = false;
      cancelAnimationFrame(scheduled);
      observer?.disconnect();
      fallbackObserver?.disconnect();
      window.removeEventListener("resize", positionSubject);
      document.removeEventListener("scroll", schedule, true);
      if (boundary) boundary.inert = wasInert;
      if (subject) { subject.style.height = originalHeight; subject.style.scrollMarginTop = originalMargin; }
      // Keep the supplied cards visible for the real investigation click after this beat.
      if (step !== "supplier-overview") for (const { element, top, left } of scrollPositions) { element.scrollTop = top; element.scrollLeft = left; }
    };
  }, [selector, step]);

  return <Dialog.Root open onOpenChange={open => { if (!open) onExit(); }}>
    <Dialog.Portal>
      <Dialog.Content
        className={styles.stage}
        data-guide-control
        data-guide-step={step}
        data-guide-act={step === "map" ? "1" : step === "material-launch" ? "3" : "2"}
        data-positioned={frame !== null || unavailable}
        aria-describedby={`${step}-introduction-description`}
        onOpenAutoFocus={event => { event.preventDefault(); heading.current?.focus({ preventScroll: true }); }}
        onCloseAutoFocus={event => {
          event.preventDefault();
          requestAnimationFrame(() => {
            const nextGuide = document.querySelector<HTMLElement>('[data-material-guide] h2, [data-guide-step] h2');
            const fallback = step === "supplier-overview" || step === "material-launch"
              ? document.querySelector<HTMLElement>('[data-guide-target="open-material-case"]') ?? document.querySelector<HTMLElement>('[data-workbench-filters] button')
              : document.querySelector<HTMLElement>(step === "map" ? '[data-guide-step="order"] button' : '[data-guide-target="open-regulatory-case"]');
            (nextGuide ?? fallback)?.focus({ preventScroll: true });
          });
        }}
        onEscapeKeyDown={event => { event.preventDefault(); onExit(); }}
        onInteractOutside={event => event.preventDefault()}
      >
        {frame ? <div aria-hidden="true" className={styles.aperture} data-spotlight-aperture style={frame} /> : <div aria-hidden="true" className={styles.blanket} />}
        <div ref={card} className={styles.card} data-spotlight-card style={placement}>
          <div className={styles.reading} tabIndex={0} aria-label={step === "map" ? "Map introduction" : step === "supplier-overview" ? "Direct supplier introduction" : "Order overview introduction"}>
            <p className={styles.eyebrow}>{eyebrow}</p>
            <Dialog.Title ref={heading} tabIndex={-1} className={styles.title}>{title}</Dialog.Title>
            <Dialog.Description id={`${step}-introduction-description`} className={styles.description}>{description}</Dialog.Description>
            {supporting ? <p className={styles.supporting}>{supporting}</p> : null}
            {handoff ? <p className={styles.note}>{handoff}</p> : null}
            {unavailable ? <p className={styles.note}>{step === "map" ? "The map is unavailable on this device. You can continue with the order overview." : step === "supplier-overview" ? "The supplier panel is unavailable. Continue to the order workspace or go Back." : "The planning brief is unavailable. You can continue to the order workspace."}</p> : null}
          </div>
          <nav className={styles.controls} aria-label="Walkthrough controls">
            <button type="button" className={styles.secondary} onClick={onBack}>Back</button>
            <button type="button" className={styles.secondary} onClick={onExit}>Exit</button>
            <button type="button" className={styles.primary} onClick={onContinue}>{primaryLabel} <span aria-hidden="true">→</span></button>
          </nav>
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
