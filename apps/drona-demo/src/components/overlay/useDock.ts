"use client";

import * as React from "react";

import { dockPanel, spotlightPath, type DockPlacement } from "@/lib/motion/dock";

/* The veil's hole is a little larger than the card, so the card's lift shadow
   reads inside the lit area rather than being clipped at its edge. */
const HOLE_PAD = 6;
const CARD_RADIUS = 18;

type DockState = { readonly placement: DockPlacement | null; readonly veil: string | null };
const EMPTY: DockState = { placement: null, veil: null };

/**
 * Measures the summoning card and the viewport while an overlay is present, and
 * returns where the panel docks and the veil's cut-out path. Re-measures on resize.
 * Null in environments without layout (tests), where the panel falls back to centred.
 */
export function useDock(
  present: boolean,
  originRef: React.RefObject<HTMLElement | null> | undefined,
  width: number
): DockState {
  const [state, setState] = React.useState<DockState>(EMPTY);

  const measure = React.useCallback(() => {
    const viewport = { width: window.innerWidth, height: window.innerHeight };
    const el = originRef?.current;
    const r = el?.getBoundingClientRect();
    const origin = r && r.width > 0 && r.height > 0 ? { x: r.left, y: r.top, width: r.width, height: r.height } : null;
    if (viewport.width === 0) return;
    const hole = origin && {
      x: origin.x - HOLE_PAD,
      y: origin.y - HOLE_PAD,
      width: origin.width + HOLE_PAD * 2,
      height: origin.height + HOLE_PAD * 2,
    };
    setState({
      placement: dockPanel(origin, viewport, width),
      veil: hole ? spotlightPath(viewport, hole, CARD_RADIUS + HOLE_PAD) : null,
    });
  }, [originRef, width]);

  React.useLayoutEffect(() => {
    if (!present) {
      /* Forget the last placement, so the next open waits for a fresh measure
         instead of animating in from where the card used to be. */
      setState(EMPTY);
      return;
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [present, measure]);

  return state;
}
