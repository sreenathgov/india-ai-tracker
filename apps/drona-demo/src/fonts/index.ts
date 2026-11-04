import localFont from "next/font/local";

/**
 * Geist text and monospace are retained. Display type uses a system serif until web rights for the original display font are confirmed.
 *
 * Two rules here are load-bearing:
 *
 * 1. Paragon is its own family at weight 400 — never a heavy cut inside the Geist
 *    stack. Declaring a display serif as an 800 in the working family makes every
 *    `font-weight: 500/600/700` in the app silently resolve up to it.
 * 2. `adjustFontFallback` is off. Next's metric-matched fallback is tuned for the
 *    fallback swap; with a display serif it produces a visible reflow on a surface
 *    whose whole argument is calm.
 */

export const geist = localFont({
  variable: "--font-geist",
  display: "swap",
  adjustFontFallback: false,
  src: [
    {
      path: "./files/Geist-Variable.woff2",
      weight: "100 900",
      style: "normal",
    },
    {
      path: "./files/Geist-Italic-Variable.woff2",
      weight: "100 900",
      style: "italic",
    },
  ],
});

export const geistMono = localFont({
  variable: "--font-geist-mono",
  display: "swap",
  adjustFontFallback: false,
  src: [
    {
      path: "./files/GeistMono-Variable.woff2",
      weight: "100 900",
      style: "normal",
    },
  ],
});

/** Every font variable, for the <html> element. */
export const fontVariables = [
  geist.variable,
  geistMono.variable,
].join(" ");
