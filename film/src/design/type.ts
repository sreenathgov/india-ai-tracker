/**
 * Type system — Build Bible §3.
 *
 * - Cormorant Garamond: display and Nax's speaking register (captions, headlines).
 * - Telegraf Regular: ALL working UI. Never synthesized bold — hierarchy comes
 *   from size, case and tracking only.
 * - IBM Plex Mono: invoice numbers, HS codes, hashes, rule IDs — anything that
 *   must be read character-exact.
 *
 * Every font reference in the film resolves through this file.
 */

import type { CSSProperties } from "react";
import { cancelRender, continueRender, delayRender, staticFile } from "remotion";
import { loadFont as loadIbmPlexMono } from "@remotion/google-fonts/IBMPlexMono";

// ─── families ────────────────────────────────────────────────────────────────

export const fontFamily = {
  display: '"Cormorant Garamond", Georgia, "Times New Roman", serif',
  ui: '"Telegraf", -apple-system, "Helvetica Neue", sans-serif',
  mono: '"IBM Plex Mono", "SF Mono", Menlo, monospace',
} as const;

// ─── weights ─────────────────────────────────────────────────────────────────

export const fontWeight = {
  /** The only weight Telegraf may ever use (Bible §3). */
  regular: 400,
  /** Cormorant display accents only. NEVER applied to Telegraf. */
  displayMedium: 500,
} as const;

// ─── tracking steps (hierarchy without weight) ───────────────────────────────

export const tracking = {
  caps: "0.14em",
  wide: "0.08em",
  normal: "0",
} as const;

/**
 * Base style every text node inherits. `fontSynthesis: none` makes any
 * accidental bold on Telegraf a visible no-op instead of a faux-bold.
 */
export const baseTextStyle: CSSProperties = {
  fontSynthesis: "none",
  WebkitFontSmoothing: "antialiased",
  textRendering: "optimizeLegibility",
};

// ─── font loading ────────────────────────────────────────────────────────────

// IBM Plex Mono — regular 400 only, via @remotion/google-fonts (handles its
// own delayRender).
loadIbmPlexMono("normal", { weights: ["400"] });

const loadLocalFont = (family: string, file: string, weight: string): void => {
  if (typeof document === "undefined") {
    return;
  }
  const handle = delayRender(`Loading font ${family} ${weight}`);
  const face = new FontFace(family, `url(${staticFile(`fonts/${file}`)})`, {
    weight,
    style: "normal",
  });
  face
    .load()
    .then((loaded) => {
      document.fonts.add(loaded);
      continueRender(handle);
    })
    .catch((err: unknown) => {
      cancelRender(
        new Error(`Font "${family}" (${file}) failed to load: ${String(err)}`)
      );
    });
};

loadLocalFont("Telegraf", "Telegraf-Regular.woff2", "400");
loadLocalFont("Cormorant Garamond", "CormorantGaramond-Regular.woff2", "400");
loadLocalFont("Cormorant Garamond", "CormorantGaramond-Medium.woff2", "500");
