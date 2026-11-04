/**
 * The supplier card growing into the investigation workspace.
 *
 * This is a container transform, not a scaled modal. The workspace is laid out at
 * its final size and then clipped back to the card's rectangle, so the opening
 * reads as the card expanding while the type inside stays at its true size. A
 * FLIP scale would distort a header and a five-node path at this magnification,
 * which is why `flipKeyframes` is not reused here.
 *
 * Pure geometry: the caller measures both rects and hands the result to WAAPI.
 */
import { OVERLAY_TIMING, type Rect } from "./flip";

/** Open is a touch quicker than the brief's ceiling; close is quicker still. */
export const EXPAND_TIMING = {
  /** The card lifts first, then the workspace opens — 40 + 280 = 320ms in total. */
  delayMs: 40,
  inMs: 280,
  outMs: 220,
  reducedMs: 120,
  easing: OVERLAY_TIMING.easing,
} as const;

/** The card's corner radius, and the workspace's. The clip travels between them. */
const CARD_RADIUS = 14;
const WORKSPACE_RADIUS = 20;

/** Content waits until the container has mostly opened, then fades in. */
const CONTENT_HOLD = 0.4;

const round = (n: number): number => Math.round(n * 100) / 100;

/**
 * Clamp a pair of opposing insets into the box. A card sitting partly outside the
 * workspace — scrolled off, or near an edge — would otherwise produce a negative
 * inset, which reads as the clip escaping its own surface.
 */
const insetPair = (near: number, far: number, extent: number): readonly [number, number] => {
  const first = Math.min(Math.max(near, 0), extent);
  const second = Math.min(Math.max(far, 0), extent - first);
  return [round(first), round(second)];
};

const inset = (from: Rect, to: Rect): string => {
  const [top, bottom] = insetPair(from.y - to.y, to.y + to.height - (from.y + from.height), to.height);
  const [left, right] = insetPair(from.x - to.x, to.x + to.width - (from.x + from.width), to.width);
  return `inset(${top}px ${right}px ${bottom}px ${left}px round ${CARD_RADIUS}px)`;
};

/**
 * Keyframes for the workspace opening out of `from`. With no card to grow from —
 * opened by keyboard, or the card scrolled out of view — it rises quietly instead.
 */
export function expandKeyframes(from: Rect | null, to: Rect, reduced: boolean): Keyframe[] {
  if (reduced) return [{ opacity: 0 }, { opacity: 1 }];
  if (!from) {
    return [
      { opacity: 0, transform: "translateY(8px)" },
      { opacity: 1, transform: "translateY(0px)" },
    ];
  }
  return [
    { clipPath: inset(from, to), opacity: 0.6, offset: 0 },
    { opacity: 1, offset: 0.35 },
    { clipPath: `inset(0px 0px 0px 0px round ${WORKSPACE_RADIUS}px)`, opacity: 1, offset: 1 },
  ];
}

/** The workspace's contents, held back so they arrive rather than stretch open. */
export function contentFadeKeyframes(reduced: boolean): Keyframe[] {
  if (reduced) return [{ opacity: 1 }, { opacity: 1 }];
  return [
    { opacity: 0, offset: 0 },
    { opacity: 0, offset: CONTENT_HOLD },
    { opacity: 1, offset: 1 },
  ];
}
