/**
 * FLIP keyframes for the contextual overlay: the floating surface begins where the
 * card that summoned it sits, so the card appears to lift and expand into it.
 * Pure geometry — the caller measures both rects and hands the result to WAAPI.
 */
export interface Rect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/** Inside the brief's 180–320ms window; close is quicker than open. */
export const OVERLAY_TIMING = {
  inMs: 280,
  outMs: 200,
  reducedMs: 120,
  easing: "cubic-bezier(0.22, 0.9, 0.24, 1)",
} as const;

/* Never collapse to a speck, never overshoot. */
const MIN_SCALE = 0.72;
const MAX_SCALE = 1;

const clamp = (n: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, n));
const round = (n: number): number => Math.round(n * 1000) / 1000;
const centre = (r: Rect) => ({ x: r.x + r.width / 2, y: r.y + r.height / 2 });
const transform = (dx: number, dy: number, s: number): string =>
  `translate(${round(dx)}px, ${round(dy)}px) scale(${round(s)})`;

export function flipKeyframes(from: Rect | null, to: Rect, reduced: boolean): Keyframe[] {
  if (reduced) return [{ opacity: 0 }, { opacity: 1 }];
  const rest = { transform: transform(0, 0, 1), opacity: 1 };
  if (!from) return [{ transform: transform(0, 6, 0.98), opacity: 0 }, rest];

  const a = centre(from);
  const b = centre(to);
  const scale = clamp(Math.max(from.width / to.width, from.height / to.height), MIN_SCALE, MAX_SCALE);
  return [
    { transform: transform(a.x - b.x, a.y - b.y, scale), opacity: 0 },
    { opacity: 1, offset: 0.55 },
    rest,
  ];
}

export const prefersReducedMotion = (): boolean =>
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;
