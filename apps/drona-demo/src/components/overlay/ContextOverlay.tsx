"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import * as React from "react";

import { Icon } from "@/components/ui/Icon";
import { OVERLAY_TIMING, flipKeyframes, prefersReducedMotion } from "@/lib/motion/flip";
import { cn } from "@/lib/ui/cn";
import { OPEN_ATTR, ORIGIN_ATTR, play, toRect } from "./animate";
import { useDock } from "./useDock";

/**
 * The inspect step of glance → hover → inspect → open. The card that asked lifts
 * and stays lit; the rest of the page dims and softens behind a veil with the card
 * cut out of it; a floating panel grows out of the card and docks beside it, top-
 * aligned, so card and panel read as one object. Close plays the same path back.
 *
 * Built on Radix Dialog (adapted from shadcn/ui): focus is trapped and returned,
 * and Escape or a click outside dismisses without navigating. While an overlay is
 * present the page's scene-level Escape handler stands down (see `isOverlayOpen`).
 */

/* The shared overlay mechanics live in ./animate; re-exported here so the page
   and the existing callers keep importing them from the surface they know. */
export { ORIGIN_ATTR, isOverlayOpen } from "./animate";

const PANEL_WIDTH = { m: 520, l: 640 } as const;

export interface ContextOverlayProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  /** The card the overlay grows from, docks beside and returns to. */
  readonly originRef?: React.RefObject<HTMLElement | null>;
  readonly title: React.ReactNode;
  readonly eyebrow?: React.ReactNode;
  readonly description?: React.ReactNode;
  readonly footer?: React.ReactNode;
  readonly width?: "m" | "l";
  readonly children: React.ReactNode;
}

export function ContextOverlay({
  open,
  onOpenChange,
  originRef,
  title,
  eyebrow,
  description,
  footer,
  width = "m",
  children,
}: ContextOverlayProps): React.ReactElement {
  const [present, setPresent] = React.useState(open);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const scrimRef = React.useRef<HTMLDivElement>(null);
  const returnFocusRef = React.useRef<HTMLElement | null>(null);
  const { placement, veil } = useDock(present, originRef, PANEL_WIDTH[width]);

  React.useEffect(() => {
    if (!open) return;
    const active = document.activeElement;
    returnFocusRef.current = active instanceof HTMLElement && active !== document.body ? active : null;
    setPresent(true);
  }, [open]);

  /* The card is lifted for as long as the panel is anywhere on screen. */
  React.useLayoutEffect(() => {
    const card = originRef?.current;
    if (!card || !(open || present)) return;
    card.setAttribute(ORIGIN_ATTR, "");
    return () => card.removeAttribute(ORIGIN_ATTR);
  }, [open, present, originRef]);

  const motion = React.useCallback(() => {
    const reduced = prefersReducedMotion();
    const frames = flipKeyframes(toRect(originRef?.current), toRect(contentRef.current)!, reduced);
    const ms = reduced ? OVERLAY_TIMING.reducedMs : null;
    return { frames, inMs: ms ?? OVERLAY_TIMING.inMs, outMs: ms ?? OVERLAY_TIMING.outMs };
  }, [originRef]);

  /* Enter: before paint, so the first frame is at the card. Waits for the dock
     position (when there is layout to measure) and plays once per opening. */
  const enteredRef = React.useRef(false);
  React.useLayoutEffect(() => {
    if (!open) enteredRef.current = false;
    if (!open || !present || !contentRef.current || enteredRef.current) return;
    if (!placement && window.innerWidth > 0) return;
    enteredRef.current = true;
    const { frames, inMs } = motion();
    void play(contentRef.current, frames, inMs, false);
    void play(scrimRef.current, [{ opacity: 0 }, { opacity: 1 }], inMs, false);
  }, [open, present, placement, motion]);

  /* Exit: play the same path backwards, then unmount. */
  React.useEffect(() => {
    if (open || !present) return;
    let cancelled = false;
    const content = contentRef.current;
    if (!content) {
      setPresent(false);
      return;
    }
    const { frames, outMs } = motion();
    void Promise.all([
      play(content, frames, outMs, true),
      play(scrimRef.current, [{ opacity: 0 }, { opacity: 1 }], outMs, true),
    ]).then(() => {
      if (!cancelled) setPresent(false);
    });
    return () => {
      cancelled = true;
    };
  }, [open, present, motion]);

  return (
    <DialogPrimitive.Root open={present} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          ref={scrimRef}
          className="overlay-veil fixed inset-0 z-40"
          style={veil ? { clipPath: `path(evenodd, "${veil}")` } : undefined}
        />
        <DialogPrimitive.Content
          ref={contentRef}
          {...{ [OPEN_ATTR]: "", "data-dock": placement?.side ?? "center" }}
          {...(description ? {} : { "aria-describedby": undefined })}
          onCloseAutoFocus={(event) => {
            /* Back to what opened it; failing that, the surface's own trigger. */
            const target = returnFocusRef.current?.isConnected
              ? returnFocusRef.current
              : originRef?.current?.querySelector<HTMLElement>("[data-overlay-trigger]");
            if (target) {
              event.preventDefault();
              target.focus();
            }
          }}
          style={
            placement
              ? { left: placement.left, top: placement.top, width: placement.width, maxHeight: placement.maxHeight }
              : undefined
          }
          className={cn(
            "float-material fixed z-50 flex flex-col overflow-hidden rounded-[20px] outline-none",
            !placement && "left-1/2 top-[9vh] max-h-[80vh] w-[min(560px,calc(100vw-32px))] -translate-x-1/2"
          )}
        >
          <OverlayHeader eyebrow={eyebrow} title={title} description={description} />
          <div className="min-h-0 flex-1 overflow-y-auto px-7 pb-6 pt-2">{children}</div>
          {footer ? (
            <footer className="flex shrink-0 items-center justify-end gap-2 bg-quiet px-7 py-3.5">{footer}</footer>
          ) : null}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function OverlayHeader({
  eyebrow,
  title,
  description,
}: Pick<ContextOverlayProps, "eyebrow" | "title" | "description">): React.ReactElement {
  return (
    <header className="flex shrink-0 items-start justify-between gap-4 px-7 pb-4 pt-6">
      <div className="min-w-0">
        {eyebrow ? <p className="micro-label mb-2.5 text-label-tertiary">{eyebrow}</p> : null}
        <DialogPrimitive.Title className="text-[19px] font-medium leading-[1.3] tracking-[-0.012em] text-label-primary">
          {title}
        </DialogPrimitive.Title>
        {description ? (
          <DialogPrimitive.Description className="mt-1.5 max-w-measure-tight text-body-s text-label-tertiary">
            {description}
          </DialogPrimitive.Description>
        ) : null}
      </div>
      <DialogPrimitive.Close
        aria-label="Close"
        className="-mr-2 -mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-quiet text-label-tertiary transition-colors duration-hover hover:bg-quiet-hover hover:text-label-primary"
      >
        <Icon name="close" className="h-3.5 w-3.5" />
      </DialogPrimitive.Close>
    </header>
  );
}

/** Opens an overlay from a surface: the surface ref is the FLIP origin. */
export function useOverlay<T extends HTMLElement = HTMLElement>() {
  const originRef = React.useRef<T>(null);
  const [open, setOpen] = React.useState(false);
  return { originRef, open, setOpen, show: () => setOpen(true) } as const;
}
