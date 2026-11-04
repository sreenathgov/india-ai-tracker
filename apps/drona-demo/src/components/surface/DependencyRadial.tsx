"use client";

import * as React from "react";
import { useRegulatoryCase } from "@/components/regulatory/RegulatoryProvider";
import { useGuidedDemo } from "@/components/guided/GuidedDemo";
import { InspectButton, Surface } from "@/components/bento/Surface";
import { ContextOverlay, useOverlay } from "@/components/overlay/ContextOverlay";
import { arcPath, radialSegments } from "@/lib/chart/radial";
import { dependencyTotalOfType, mitigationTotals, portfolioSummary, type DependencyType } from "@/lib/portfolio/portfolio";
import { cn } from "@/lib/ui/cn";
import { DependencyDetail } from "./DependencyDetail";
import { RISK_DISPLAY_ORDER, RISK_PRESENTATION } from "./riskPresentation";
import type { SurfaceFilter } from "./filter";
import styles from "./DependencyRadial.module.css";

const colour = (index: number): string => `var(--dep-ramp-${index + 1})`;

/** One selection drives the real ring, full-name list and explanation. Counts
 * remain mapped dependencies; this presentation does not create risk findings. */
export function DependencyRadial({ filter, onFilterType, className }: {
  readonly filter: SurfaceFilter;
  readonly onFilterType: (type: DependencyType) => void;
  readonly className?: string;
}): React.ReactElement {
  const overlay = useOverlay<HTMLElement>();
  const guide = useGuidedDemo();
  const teaching = guide?.phase === "tour" && guide.step === "risks";
  const [selected, setSelected] = React.useState<DependencyType | null>(null);
  const [hovered, setHovered] = React.useState<DependencyType | null>(null);
  const [keyboardFocus, setKeyboardFocus] = React.useState<DependencyType | null>(null);
  const chosen = teaching ? guide.riskBeat === "overview" ? null : guide.riskBeat : selected;
  // Hover/focus previews do not commit a category or advance the walkthrough.
  const focus = hovered ?? keyboardFocus ?? chosen;
  React.useEffect(() => { setHovered(null); setKeyboardFocus(null); }, [teaching, teaching ? guide.riskBeat : null]);
  const info = focus ? RISK_PRESENTATION[focus] : null;
  const total = portfolioSummary().criticalDependencies;
  const { state } = useRegulatoryCase();
  const mitigation = mitigationTotals(state);
  const descriptionId = React.useId();
  const select = (type: DependencyType) => {
    setHovered(null); setKeyboardFocus(null);
    if (teaching) guide.selectRisk(type);
    else setSelected(type);
  };
  // Keep the existing filter visible in the detailed breakdown without making
  // a teaching selection silently change the order queue behind the spotlight.
  const filtered = filter?.kind === "type" ? filter.type : null;
  return <Surface surfaceId="risks" surfaceRef={overlay.originRef} weight="primary" title="Risk overview"
    actions={<InspectButton label="View risk breakdown" onClick={overlay.show}>View breakdown</InspectButton>}
    className={cn(className, styles.surface)} bodyClassName={styles.body}>
    <div data-risk-card-content className={styles.content}>
      <div className={styles.chartAndCategories}>
        <div className={styles.ring} data-risk-wheel data-selected-category={focus ?? "overview"} data-pinned-category={chosen ?? "overview"}>
          <svg viewBox="0 0 360 360" aria-hidden="true" className={styles.svg} onPointerLeave={() => setHovered(null)}>
            <circle cx="180" cy="180" r="158" fill="none" strokeWidth="16" stroke="var(--dep-track)" />
            {radialSegments(RISK_DISPLAY_ORDER.map(id => ({ id, value: dependencyTotalOfType(id) })), 8).map((segment, index) => <path key={segment.id}
              d={arcPath(180, 180, 158, segment.start, segment.end)} fill="none" stroke={focus === segment.id ? "var(--dep-ramp-1)" : colour(index)} strokeWidth="16" strokeLinecap="round"
              className={styles.segment} data-risk-segment={segment.id} data-muted={focus !== null && focus !== segment.id}
              onPointerEnter={event => { if (event.pointerType !== "touch") setHovered(segment.id as DependencyType); }} />)}
          </svg>
          <div className={styles.centre} aria-hidden="true">
            <span data-figure className={styles.figure}>{focus ? dependencyTotalOfType(focus) : total}</span>
            <span className={styles.centreLabel}>{info?.label ?? "mapped dependencies"}</span>
          </div>
        </div>
        <div className={styles.categoryBlock}>
          <p className={styles.listHeading}>Dependency categories</p>
          <ul className={styles.categories} aria-label="Dependency categories">
            {RISK_DISPLAY_ORDER.map(id => <li key={id}>
              <button type="button" data-risk-category={id} className={styles.category} aria-pressed={chosen === id}
                data-emphasized={focus === id} data-muted={focus !== null && focus !== id}
                onPointerEnter={event => { if (event.pointerType !== "touch") setHovered(id); }} onPointerLeave={() => setHovered(null)}
                onFocus={() => setKeyboardFocus(id)} onBlur={() => setKeyboardFocus(null)}
                aria-controls={descriptionId} onClick={() => select(id)}>
                <span>{RISK_PRESENTATION[id].label}</span>
                <span data-figure className={styles.count}>{dependencyTotalOfType(id)}</span>
              </button>
            </li>)}
          </ul>
          {chosen ? <button type="button" data-risk-control className={styles.reset} onClick={() => { setHovered(null); setKeyboardFocus(null); if (teaching) guide.selectRisk("overview"); else setSelected(null); }}>Show all categories</button> : null}
        </div>
      </div>
      <div id={descriptionId} className={styles.explanation} aria-live="polite" aria-atomic="true" data-risk-explanation>
        <p className={styles.explanationTitle}>{info ? `${info.label} · ${dependencyTotalOfType(focus!)} mapped ${dependencyTotalOfType(focus!) === 1 ? "dependency" : "dependencies"}` : `${total} dependencies across two assessed orders`}</p>
        <p>{info?.explanation ?? "Each category shows where an order depends on an input, capability or condition. Select a category to examine its meaning."}</p>
      </div>
    </div>
    <dl className={styles.status} aria-label="Dependency evidence and mitigation status">
      <Stat label="Mitigation verified" value={mitigation.verified} />
      <Stat label="Under review" value={mitigation.underReview} />
      <Stat label="Evidence needed" value={mitigation.unknowns} accent />
    </dl>
    <ContextOverlay open={overlay.open} onOpenChange={overlay.setOpen} originRef={overlay.originRef} eyebrow="Risk overview"
      title={`${total} mapped dependencies across two assessed orders`}
      description="Illustrative dependency counts include mitigated and unresolved conditions. A mapped dependency is not a confirmed failure." width="l">
      {filtered ? <p className="mb-4 text-body-s text-label-secondary">Order filter: {RISK_PRESENTATION[filtered].label}</p> : null}
      <DependencyDetail onFilterType={type => { onFilterType(type); overlay.setOpen(false); }} />
    </ContextOverlay>
  </Surface>;
}
function Stat({ label, value, accent = false }: { readonly label: string; readonly value: number; readonly accent?: boolean }): React.ReactElement {
  return <div><dt>{label}</dt><dd data-figure className={cn(accent && styles.needsEvidence)}>{value}</dd></div>;
}
