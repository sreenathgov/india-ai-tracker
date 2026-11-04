/**
 * The mechanics every overlay surface shares: measuring the thing it grows from,
 * driving WAAPI, and the two attributes that let the rest of the page know an
 * overlay is present.
 *
 * Kept apart from the surfaces themselves so the contextual overlay and the
 * investigation workspace animate identically without one importing the other.
 */
import { OVERLAY_TIMING, type Rect } from "@/lib/motion/flip";

/** Set on any mounted overlay, including while it animates closed. */
export const OPEN_ATTR = "data-context-overlay";

/** Set on the summoning card while its overlay is open; styled in globals.css. */
export const ORIGIN_ATTR = "data-overlay-origin";

/** True while any overlay is mounted. The page's Escape handler stands down. */
export const isOverlayOpen = (): boolean =>
  typeof document !== "undefined" && document.querySelector(`[${OPEN_ATTR}]`) !== null;

/** A DOM rect in the shape the motion helpers want, or null if it has no size. */
export const toRect = (el: Element | null | undefined): Rect | null => {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0 ? { x: r.left, y: r.top, width: r.width, height: r.height } : null;
};

/**
 * Run one animation and resolve when it settles. Resolves immediately where WAAPI
 * is unavailable — jsdom, and older engines — so a missing animation never blocks
 * an unmount.
 */
export function play(
  el: HTMLElement | null,
  frames: Keyframe[],
  ms: number,
  reverse: boolean,
  options: { readonly easing?: string; readonly delayMs?: number } = {}
): Promise<void> {
  if (!el || typeof el.animate !== "function") return Promise.resolve();
  const animation = el.animate(frames, {
    duration: ms,
    delay: reverse ? 0 : options.delayMs ?? 0,
    easing: options.easing ?? OVERLAY_TIMING.easing,
    direction: reverse ? "reverse" : "normal",
    fill: "both",
  });
  return animation.finished.then(
    () => undefined,
    () => undefined
  );
}
