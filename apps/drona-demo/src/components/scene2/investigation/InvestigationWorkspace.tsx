"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import * as React from "react";
import { MaterialWalkthrough } from "@/components/guided/MaterialWalkthrough";
import walkthroughStyles from "@/components/guided/MaterialWalkthrough.module.css";
import { useGuidedDemo } from "@/components/guided";

import { useRegulatoryCase } from "@/components/regulatory/RegulatoryProvider";
import { MATERIAL_CASE } from "@/lib/scene2/investigation/inquiry";
import { useSupplierInquiry } from "./overview/SupplierInquiryProvider";
import { REGULATORY_CASE } from "@/lib/regulatory/state";
import { OPEN_ATTR, ORIGIN_ATTR, play, toRect } from "@/components/overlay/animate";
import { EXPAND_TIMING, contentFadeKeyframes, expandKeyframes } from "@/lib/motion/expand";
import { prefersReducedMotion } from "@/lib/motion/flip";
import { investigationFor, investigationHeader } from "@/lib/scene2/investigation";
import type { InvestigationTab } from "@/lib/scene2/supplierView";
import { cn } from "@/lib/ui/cn";
import { InvestigationHeader } from "./InvestigationHeader";
import { InvestigationTabList } from "./InvestigationTabs";
import { PendingTab } from "./PendingTab";
import { EvidencePanel } from "./evidence/EvidencePanel";
import { OverviewPanel } from "./overview/OverviewPanel";
import { SupplyChainPanel } from "./supplychain/SupplyChainPanel";

/** A cross-link between the two graphs: which tab to open, and which node or claim to land on. */
interface FocusRequest {
  readonly tab: InvestigationTab;
  readonly id: string;
}

/**
 * The card an investigation was opened from, for the transform and focus return.
 * The id is quoted into the selector rather than escaped with `CSS.escape`, which
 * jsdom does not implement; only a quote or a backslash could break out, and a
 * supplier id contains neither.
 */
const cardFor = (supplierId: string): HTMLElement | null => {
  if (typeof document === "undefined") return null;
  const quoted = supplierId.replace(/["\\]/g, "\\$&");
  return document.querySelector<HTMLElement>(`[data-supplier-card="${quoted}"]`);
};

export interface InvestigationWorkspaceProps {
  readonly onOpenComponent?: (componentId: string) => void;
  readonly commitmentId: string;
  /** Null when nothing is open. The last one stays rendered while it closes. */
  readonly supplierId: string | null;
  readonly tab: InvestigationTab;
  readonly assessed: boolean;
  readonly onTabChange: (tab: InvestigationTab) => void;
  readonly onClose: () => void;
}

/**
 * The supplier investigation, opened in place over the order workspace.
 *
 * It is a container transform, not a modal: the card lifts, and the workspace is
 * clipped back to that card's rectangle and opened out of it, so the type inside
 * never scales. The order page stays softly visible in the margin, because the
 * investigation is a closer look at that page rather than a departure from it.
 *
 * Radix Dialog supplies the focus trap, Escape and the inert background; the page's
 * own Escape handler stands down while `data-context-overlay` is present.
 */
export function InvestigationWorkspace({
  commitmentId,
  onOpenComponent,
  supplierId,
  tab,
  assessed,
  onTabChange,
  onClose,
}: InvestigationWorkspaceProps): React.ReactElement | null {
  const regulatory = useRegulatoryCase();
  const material = useSupplierInquiry();
  const guide = useGuidedDemo();
  const [held, setHeld] = React.useState<string | null>(supplierId);
  const [focusRequest, setFocusRequest] = React.useState<FocusRequest | null>(null);
  /* Written by `attachContent`, so it is mutable rather than a Radix-owned object. */
  const contentRef = React.useRef<HTMLDivElement | null>(null);
  const bodyRef = React.useRef<HTMLDivElement>(null);
  const scrimRef = React.useRef<HTMLDivElement>(null);
  const open = supplierId !== null;

  // Keep navigation state in sync without mounting the retired guide panel.
  React.useEffect(() => {
    guide?.reportInvestigation({ supplierId: supplierId ?? held, tab, close: onClose, setTab: onTabChange });
  }, [guide?.reportInvestigation, supplierId, held, tab, onClose, onTabChange]);

  React.useEffect(() => {
    if (supplierId) setHeld(supplierId);
  }, [supplierId]);

  /* A new investigation starts with no cross-link pending. */
  React.useEffect(() => {
    setFocusRequest(null);
  }, [held]);

  /* A cross-link into a tab that isn't open yet switches to it; the target panel
     consumes `focusRequest` itself and clears it once it has acted on it. */
  React.useEffect(() => {
    if (focusRequest && focusRequest.tab !== tab) onTabChange(focusRequest.tab);
  }, [focusRequest, tab, onTabChange]);

  const clearFocusRequest = React.useCallback(() => setFocusRequest(null), []);

  /* The card stays lifted for as long as the workspace is anywhere on screen. */
  React.useLayoutEffect(() => {
    const card = held ? cardFor(held) : null;
    if (!card || !(open || held)) return;
    card.setAttribute(ORIGIN_ATTR, "");
    return () => card.removeAttribute(ORIGIN_ATTR);
  }, [open, held]);

  const motion = React.useCallback(() => {
    const reduced = prefersReducedMotion();
    const to = toRect(contentRef.current);
    const frames = to ? expandKeyframes(toRect(held ? cardFor(held) : null), to, reduced) : [];
    const ms = reduced ? EXPAND_TIMING.reducedMs : null;
    return { frames, reduced, inMs: ms ?? EXPAND_TIMING.inMs, outMs: ms ?? EXPAND_TIMING.outMs };
  }, [held]);

  const enteredRef = React.useRef(false);
  const [entryReady, setEntryReady] = React.useState(false);
  React.useLayoutEffect(() => {
    if (!open) { enteredRef.current = false; setEntryReady(false); }
  }, [open]);

  /*
   * Enter, driven by the ref attaching rather than by an effect on `open`.
   *
   * Radix mounts the portal's content a commit after `open` turns true, so an
   * effect keyed on `open` runs while the node is still null and is never
   * scheduled again — the workspace would appear with no motion at all. A
   * callback ref fires at the commit the node exists and still before paint,
   * so the first frame is already back at the card. The scrim is a sibling and
   * the body a child, so both refs are attached by the time this runs.
   */
  const attachContent = React.useCallback(
    (node: HTMLDivElement | null) => {
      contentRef.current = node;
      if (!node || enteredRef.current) return;
      enteredRef.current = true;
      const { frames, reduced, inMs } = motion();
      // Mount the reading layer after the real container has opened, so its
      // initial focus cannot land on a still-clipped/hidden incoming surface.
      void play(node, frames, inMs, false, {
        easing: EXPAND_TIMING.easing,
        delayMs: reduced ? 0 : EXPAND_TIMING.delayMs,
      }).then(() => { if (node.isConnected) setEntryReady(true); });
      void play(bodyRef.current, contentFadeKeyframes(reduced), inMs, false, { easing: EXPAND_TIMING.easing });
      void play(scrimRef.current, [{ opacity: 0 }, { opacity: 1 }], inMs, false);
    },
    [motion]
  );

  /* Exit: the same path backwards, then release the supplier. */
  React.useEffect(() => {
    if (open || !held) return;
    let cancelled = false;
    const { frames, outMs } = motion();
    void Promise.all([
      play(contentRef.current, frames, outMs, true, { easing: EXPAND_TIMING.easing }),
      play(scrimRef.current, [{ opacity: 0 }, { opacity: 1 }], outMs, true),
    ]).then(() => {
      if (!cancelled) setHeld(null);
    });
    return () => {
      cancelled = true;
    };
  }, [open, held, motion]);

  if (!held) return null;
  const isRegulatory = commitmentId === REGULATORY_CASE.orderId && held === REGULATORY_CASE.supplierId;
  const isMaterial = commitmentId === MATERIAL_CASE.orderId && held === MATERIAL_CASE.supplierId;
  const inv = assessed ? (isRegulatory ? regulatory.inv : isMaterial ? material.inv : investigationFor(commitmentId, held)) : null;
  const facts = investigationHeader(commitmentId, held, assessed, inv);
  if (!facts) return null;

  return (
    <DialogPrimitive.Root open onOpenChange={(next) => !next && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay ref={scrimRef} className="overlay-veil fixed inset-0 z-40" />
        <DialogPrimitive.Content
          ref={attachContent}
          onOpenAutoFocus={event => { if (isMaterial && guide?.phase === "tour") { event.preventDefault(); requestAnimationFrame(() => contentRef.current?.querySelector<HTMLElement>("[data-material-coach] h2")?.focus({ preventScroll: true })); } }}
          onEscapeKeyDown={event => { if (isMaterial && guide?.phase === "tour") { event.preventDefault(); guide.explore(); } }}
          {...{ [OPEN_ATTR]: "", "data-investigation": held }}
          onCloseAutoFocus={(event) => {
            const card = cardFor(held);
            if (!card) return;
            event.preventDefault();
            card.focus();
          }}
          className={cn("float-material fixed z-50 flex flex-col overflow-hidden rounded-[20px] outline-none left-[calc(64px+(100vw-64px)*0.06)] top-[calc(56px+(100vh-56px)*0.05)] h-[calc((100vh-56px)*0.9)] w-[calc((100vw-64px)*0.88)] max-[900px]:left-0 max-[900px]:top-14 max-[900px]:h-[calc(100vh-56px)] max-[900px]:w-full max-[900px]:rounded-none", isMaterial && guide?.phase === "tour" && walkthroughStyles.workspace)}
        >
          <MaterialWalkthrough key={held} enabled={isMaterial && guide?.phase === "tour" && entryReady} scopeRef={contentRef} tab={tab} onTabChange={onTabChange} onExplore={completed => { guide?.explore(completed); onClose(); }}>
          <div ref={bodyRef} className="flex min-h-0 flex-1 flex-col">
            <InvestigationHeader facts={facts} onOpenPathway={(!guide || guide.phase === "explore") && inv?.regulatory && onOpenComponent ? () => { onClose(); onOpenComponent(REGULATORY_CASE.componentId); } : undefined} />
            <TabsPrimitive.Root
              value={tab}
              onValueChange={(next) => onTabChange(next as InvestigationTab)}
              className="flex min-h-0 flex-1 flex-col"
            >
              <InvestigationTabList />
              <div
                data-material-tab-body
                className={cn(
                  "min-h-0 flex-1 px-7 pb-5 pt-5 max-[600px]:px-5",
                  /* The graph owns its height and pans inside itself; it must not scroll the tab. */
                  tab === "supply-chain" || tab === "evidence" ? "flex flex-col overflow-hidden" : "overflow-y-auto"
                )}
              >
                <TabsPrimitive.Content value="overview" className="outline-none">
                  <OverviewPanel facts={facts} inv={inv} assessed={assessed} />
                </TabsPrimitive.Content>
                <TabsPrimitive.Content
                  value="supply-chain"
                  className="flex min-h-0 flex-1 flex-col outline-none data-[state=inactive]:hidden"
                >
                  {inv ? (
                    <SupplyChainPanel
                      orderId={commitmentId}
                      supplierId={held}
                      focusNodeId={focusRequest?.tab === "supply-chain" ? focusRequest.id : null}
                      onFocusHandled={clearFocusRequest}
                      onShowInEvidence={(claimId) => setFocusRequest({ tab: "evidence", id: claimId })}
                    />
                  ) : (
                    <PendingTab tab="supply-chain" inv={inv} />
                  )}
                </TabsPrimitive.Content>
                <TabsPrimitive.Content
                  value="evidence"
                  className="flex min-h-0 flex-1 flex-col outline-none data-[state=inactive]:hidden"
                >
                  {inv ? (
                    <EvidencePanel
                      inv={inv}
                      orderId={commitmentId}
                      supplierId={held}
                      focusClaimId={focusRequest?.tab === "evidence" ? focusRequest.id : null}
                      onFocusHandled={clearFocusRequest}
                      onShowInSupplyChain={(nodeId) => setFocusRequest({ tab: "supply-chain", id: nodeId })}
                    />
                  ) : (
                    <PendingTab tab="evidence" inv={inv} />
                  )}
                </TabsPrimitive.Content>
              </div>
            </TabsPrimitive.Root>
            <p className="micro-label shrink-0 px-7 pb-3 text-right text-label-quaternary">
              {inv?.regulatory ? "Authored case records · real public rules" : inv?.material ? "Fictional disruption scenario · illustrative data" : "Synthetic demonstration data"}
            </p>
          </div>
          </MaterialWalkthrough>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
