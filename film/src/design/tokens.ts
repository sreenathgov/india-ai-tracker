/**
 * Design tokens — Build Bible §3 and §4. The page's live tokens, not the older
 * storyboard hex (#002448 / #FCF0CC / #D84824 are superseded).
 *
 * Every colour, radius, easing and motion constant in the film resolves
 * through this file. Nothing is hardcoded elsewhere.
 */

// ─── colour ──────────────────────────────────────────────────────────────────

export const color = {
  navy: "#0a2f52",
  navyDeep: "#061f38",
  cream: "#eeebe3",
  rule: "rgba(10,47,82,.12)",
  /**
   * The single reserved hero accent. Marks scan sweeps and the active cursor
   * target — and NOTHING else. Never UI chrome (Bible §3).
   */
  vermilion: "#db4a2b",
  ink: "rgba(10,47,82,.90)",
  inkDim: "rgba(10,47,82,.52)",
  slate: "#94a3b8",
} as const;

/** Four-state readiness palette — fixed, no substitutions (Bible §3). */
export const stateColor = {
  OPEN: "#1f7b54",
  CONDITIONAL: "#b07512",
  BLOCKED: "#c0392b",
  UNCLEAR: "#5c6e82",
} as const;

/**
 * Derive an rgba() string from a 6-digit hex token. Used for veils and
 * translucent fills so alpha variants never fork from the source colour.
 */
export const rgba = (hex: string, alpha: number): string => {
  const match = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!match) {
    throw new Error(`rgba(): expected a 6-digit hex colour token, got "${hex}"`);
  }
  const n = parseInt(match[1], 16);
  const r = (n >> 16) & 0xff;
  const g = (n >> 8) & 0xff;
  const b = n & 0xff;
  return `rgba(${r},${g},${b},${alpha})`;
};

// ─── radius ladder (Bible §3) ────────────────────────────────────────────────

export const radius = {
  stamp: 2,
  pill: 6,
  chip: 8,
  card: 12,
  frame: 18,
} as const;

// ─── easing (Bible §3) ───────────────────────────────────────────────────────

/** Master easing for every camera move and state change. */
export const easing = {
  master: [0.22, 1, 0.36, 1] as const,
  masterCss: "cubic-bezier(0.22, 1, 0.36, 1)",
} as const;

// ─── camera vignette (Bible §4.3) ────────────────────────────────────────────

export const vignette = {
  /** Non-focal content drops to this opacity during a push. */
  nonFocalOpacity: 0.12,
  /** Out-of-focus blur, within the 6–10 px band. */
  blurPx: 8,
  blurPxMin: 6,
  blurPxMax: 10,
  /**
   * Feather on the focus hole. Wide enough that the veil's edge is never
   * locatable by eye at any point of a push — focus falls off gradually
   * and roughly radially, it must be impossible to say where it begins.
   */
  featherPx: 140,
  /** Corner radius of the focus hole; large, so the falloff rounds toward radial. */
  holeRadiusPx: 96,
  /**
   * Stepped rings for the out-of-focus backdrop blur. backdrop-filter is
   * only reliably bounded by clip-path (a hard edge), so the blur onsets in
   * three sub-visible steps: each ring's clip hole is inflated by
   * `inflate × featherPx`, each ring carries `blurPx × share`. Overlapping
   * rings compose (in quadrature) to ≈ the full blurPx at the outer band.
   */
  blurRings: [
    { inflate: 0.25, share: 0.6 },
    { inflate: 0.55, share: 0.6 },
    { inflate: 0.85, share: 0.6 },
  ],
} as const;

// ─── depth planes (Bible §4.1 — the dolly axis) ──────────────────────────────

/**
 * Parallax depth factors. Under a camera move an element's displacement is
 * multiplied by its depth factor while its scale is not — near content
 * displaces faster, so a push reads as a dolly, not a zoom. The three-plane
 * split is the whole vocabulary: subtle displacement cue, never a 3D effect.
 * Consumed via <Depth> (camera/depth.tsx); unwrapped content is mid.
 */
export const depth = {
  background: 0.85,
  mid: 1.0,
  foreground: 1.15,
} as const;

// ─── motion constants (Bible §4, §5) ─────────────────────────────────────────

export const motion = {
  /** Push-in ceiling: scale 1.0 → 1.9 maximum. */
  pushScaleMax: 1.9,
  /** Reframe duration band, ms. Nothing may take longer than 700 ms. */
  reframeMsMin: 450,
  reframeMsMax: 700,
  /** Motion blur engages only on reframes faster than this (scale per second). */
  motionBlurThresholdScalePerSecond: 1.4,
  /** Cursor timing — peppy variant (Bible §4.6). */
  cursor: {
    travelMs: 380,
    hoverMs: 140,
    pressMs: 120,
    rippleMs: 360,
  },
  /** Typing speed (Bible §4.7). */
  typingMsPerChar: 12,
  /**
   * The seal stamp — the ONE overshoot permitted in the entire film
   * (Bible §3). Nothing else bounces.
   */
  seal: {
    fromScale: 0.82,
    overshootScale: 1.04,
    restScale: 1.0,
    durationMs: 520,
  },
  /** Beat 0 imperceptible drift-in. */
  coldOpenDrift: 0.02,
} as const;
