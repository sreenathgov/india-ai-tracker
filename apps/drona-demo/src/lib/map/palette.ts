/**
 * The map's colours, read from the design tokens.
 *
 * deck.gl paints in WebGL and wants `[r, g, b, a]` arrays, not CSS. Copying hex
 * values into the map component would give the map a second colour system that
 * drifts from `tokens.css` the first time a hue is tuned — so the map reads the
 * semantic tokens once, off the live stylesheet, and converts them here. The token
 * file stays the only place a colour is decided.
 *
 * `FALLBACK_PALETTE` mirrors the token values for the one moment there is no
 * stylesheet to read (a test, or a first paint before styles resolve). A test pins
 * it to `tokens.css`, so it cannot silently drift either.
 */
import type { Concern } from "@/lib/network/types";

export type Rgba = readonly [number, number, number, number];

export interface MapPalette {
  readonly ocean: Rgba;
  readonly land: Rgba;
  readonly landEdge: Rgba;
  /** Plant → buyer delivery line. */
  readonly flow: Rgba;
  /** A delivery line that is not the one being looked at. */
  readonly flowMuted: Rgba;
  readonly plant: Rgba;
  readonly buyer: Rgba;
  /** Upstream (Tier 2/3) nodes in Scene 3 — neutral: they carry evidence, not concern. */
  readonly upstream: Rgba;
  readonly halo: Rgba;
  readonly label: Rgba;
  readonly concern: Readonly<Record<Concern, Rgba>>;
  /** Alpha multiplier for inferred / low / missing evidence. */
  readonly inferredOpacity: number;
}

/** The token each palette entry is read from. Semantic names only. */
export const PALETTE_TOKENS = {
  ocean: "--bg-map",
  land: "--map-land",
  landEdge: "--map-land-edge",
  flow: "--map-flow",
  flowMuted: "--map-flow-muted",
  plant: "--map-plant",
  buyer: "--map-buyer",
  upstream: "--map-upstream",
  halo: "--map-halo",
  label: "--map-label",
  low: "--concern-low",
  elevated: "--concern-elevated",
  critical: "--concern-critical",
} as const;

export const FALLBACK_PALETTE: MapPalette = {
  ocean: [205, 209, 214, 255],
  land: [246, 246, 245, 255],
  landEdge: [179, 184, 190, 255],
  flow: [52, 56, 62, 140],
  flowMuted: [52, 56, 62, 36],
  plant: [143, 55, 54, 255],
  buyer: [91, 107, 124, 255],
  upstream: [116, 128, 141, 255],
  halo: [52, 56, 62, 31],
  label: [31, 30, 27, 255],
  concern: {
    low: [46, 158, 107, 255],
    elevated: [199, 122, 23, 255],
    critical: [206, 74, 51, 255],
  },
  inferredOpacity: 0.6,
};

/**
 * Parse `#rgb`, `#rrggbb`, `#rrggbbaa`, `rgb(…)` or `rgba(…)`. Anything else —
 * including `color-mix()`, which a stylesheet returns unresolved — is `null`, and
 * the caller falls back rather than guessing.
 */
export function parseColor(input: string): Rgba | null {
  const value = input.trim().toLowerCase();

  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/.exec(value);
  if (hex) {
    const h = hex[1];
    const full = h.length === 3 ? [...h].map((c) => c + c).join("") : h;
    const n = (i: number) => parseInt(full.slice(i, i + 2), 16);
    return [n(0), n(2), n(4), full.length === 8 ? n(6) : 255];
  }

  const fn = /^rgba?\(([^)]+)\)$/.exec(value);
  if (fn) {
    const parts = fn[1].split(/[\s,/]+/).filter(Boolean).map(Number);
    if (parts.length < 3 || parts.some((p) => !Number.isFinite(p))) return null;
    const [r, g, b] = parts;
    const a = parts.length > 3 ? Math.round(Math.max(0, Math.min(1, parts[3])) * 255) : 255;
    return [r, g, b, a];
  }

  return null;
}

/** `[r,g,b,a]` back to CSS, for the SVG icons that are drawn with the same colours. */
export const toCss = ([r, g, b, a]: Rgba): string =>
  `rgba(${r}, ${g}, ${b}, ${Math.round((a / 255) * 1000) / 1000})`;

/** Scale a colour's alpha — how the evidence grammar fades an inferred line. */
export const withAlpha = ([r, g, b, a]: Rgba, factor: number): Rgba => [
  r,
  g,
  b,
  Math.round(a * Math.max(0, Math.min(1, factor))),
];

/**
 * Read the palette off an element's computed style. Each token that is absent or
 * unparseable falls back individually, so one bad value cannot blank the map.
 */
export function readPalette(read: (token: string) => string): MapPalette {
  const pick = (token: string, fallback: Rgba): Rgba => parseColor(read(token)) ?? fallback;
  const f = FALLBACK_PALETTE;
  const opacity = Number.parseFloat(read("--evidence-inferred-opacity"));
  return {
    ocean: pick(PALETTE_TOKENS.ocean, f.ocean),
    land: pick(PALETTE_TOKENS.land, f.land),
    landEdge: pick(PALETTE_TOKENS.landEdge, f.landEdge),
    flow: pick(PALETTE_TOKENS.flow, f.flow),
    flowMuted: pick(PALETTE_TOKENS.flowMuted, f.flowMuted),
    plant: pick(PALETTE_TOKENS.plant, f.plant),
    buyer: pick(PALETTE_TOKENS.buyer, f.buyer),
    upstream: pick(PALETTE_TOKENS.upstream, f.upstream),
    halo: pick(PALETTE_TOKENS.halo, f.halo),
    label: pick(PALETTE_TOKENS.label, f.label),
    concern: {
      low: pick(PALETTE_TOKENS.low, f.concern.low),
      elevated: pick(PALETTE_TOKENS.elevated, f.concern.elevated),
      critical: pick(PALETTE_TOKENS.critical, f.concern.critical),
    },
    inferredOpacity: Number.isFinite(opacity) ? opacity : f.inferredOpacity,
  };
}

/** Browser entry point. Resolves `var()` chains because computed style does. */
export function paletteFrom(element: Element): MapPalette {
  const style = getComputedStyle(element);
  return readPalette((token) => style.getPropertyValue(token));
}
