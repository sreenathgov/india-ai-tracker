import type { Config } from "tailwindcss";

/**
 * Tailwind consumes only the SEMANTIC layer of tokens.css. Primitive values
 * (--maroon-*, --silver-*, --map-*-light) are deliberately absent here: if a
 * primitive is reachable from a class name, the separation is decorative.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        page: "var(--bg-page)",
        surface: "var(--bg-surface)",
        card: {
          DEFAULT: "var(--bg-card)",
          edge: "var(--border-card)",
          "edge-strong": "var(--border-card-strong)",
        },
        float: "var(--bg-float)",
        sheet: {
          DEFAULT: "var(--bg-sheet)",
          sunk: "var(--bg-sheet-sunk)",
        },
        veil: "var(--bg-veil)",
        quiet: {
          DEFAULT: "var(--bg-quiet)",
          hover: "var(--bg-quiet-hover)",
        },
        ink: {
          button: "var(--bg-ink-button)",
          "on-button": "var(--ink-on-ink-button)",
        },
        scrim: "var(--bg-scrim)",
        hover: "var(--bg-hover)",
        selected: "var(--bg-selected)",
        raised: "var(--bg-raised)",
        inset: "var(--bg-inset)",
        band: "var(--bg-band)",
        map: {
          DEFAULT: "var(--bg-map)",
          raised: "var(--bg-map-raised)",
          control: "var(--bg-map-control)",
        },
        label: {
          primary: "var(--label-primary)",
          secondary: "var(--label-secondary)",
          tertiary: "var(--label-tertiary)",
          quaternary: "var(--label-quaternary)",
        },
        separator: {
          DEFAULT: "var(--separator)",
        },
        brand: {
          mark: "var(--brand-mark)",
          logo: "var(--brand-logo)",
          deep: "var(--brand-deep)",
        },
        action: {
          DEFAULT: "var(--action-primary)",
          hover: "var(--action-primary-hover)",
          on: "var(--action-on-primary)",
        },
        state: {
          new: "var(--state-new)",
          action: "var(--state-action)",
          monitoring: "var(--state-monitoring)",
          "new-ink": "var(--state-new-ink)",
          "action-ink": "var(--state-action-ink)",
          "monitoring-ink": "var(--state-monitoring-ink)",
          "new-wash": "var(--state-new-wash)",
          "action-wash": "var(--state-action-wash)",
          "monitoring-wash": "var(--state-monitoring-wash)",
        },
        dep: {
          material: "var(--dep-material)",
          process: "var(--dep-process)",
          quality: "var(--dep-quality)",
          network: "var(--dep-network)",
          logistics: "var(--dep-logistics)",
          liquidity: "var(--dep-liquidity)",
          external: "var(--dep-external)",
          track: "var(--dep-track)",
        },
        concern: {
          low: "var(--concern-low)",
          elevated: "var(--concern-elevated)",
          critical: "var(--concern-critical)",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
        display: ["var(--font-paragon)", "Georgia", "serif"],
      },
      // The scale from BRAND.md §2.2. Tracking tightens as size grows and opens as
      // it shrinks — the single most important typographic behaviour in the system,
      // so it is bound to the size token rather than left to call sites.
      fontSize: {
        "display-xl": ["56px", { lineHeight: "1.05", letterSpacing: "-0.010em" }],
        "display-l": ["40px", { lineHeight: "1.10", letterSpacing: "-0.008em" }],
        "display-m": ["28px", { lineHeight: "1.15", letterSpacing: "0em" }],
        "title-l": ["28px", { lineHeight: "1.20", letterSpacing: "-0.020em" }],
        "title-m": ["22px", { lineHeight: "1.25", letterSpacing: "-0.018em" }],
        heading: ["17px", { lineHeight: "1.35", letterSpacing: "-0.010em" }],
        body: ["15px", { lineHeight: "1.62", letterSpacing: "0em" }],
        "body-s": ["13px", { lineHeight: "1.55", letterSpacing: "0em" }],
        caption: ["12px", { lineHeight: "1.40", letterSpacing: "0.010em" }],
        micro: ["11px", { lineHeight: "1.00", letterSpacing: "0.140em" }],
        mono: ["13px", { lineHeight: "1.50", letterSpacing: "0.020em" }],
        "mono-s": ["11px", { lineHeight: "1.40", letterSpacing: "0.040em" }],
      },
      spacing: {
        // 4px base, 8px layout rhythm. Section gaps are 32/48/64 — never 16.
        1: "4px",
        2: "8px",
        3: "12px",
        4: "16px",
        6: "24px",
        7: "28px",
        8: "32px",
        12: "48px",
        16: "64px",
        18: "72px",
        24: "96px",
      },
      borderRadius: {
        stamp: "var(--radius-stamp)",
        pill: "var(--radius-pill)",
        chip: "var(--radius-chip)",
        card: "var(--radius-card)",
        frame: "var(--radius-frame)",
        stage: "var(--radius-stage)",
        surface: "var(--radius-surface)",
        float: "var(--radius-float)",
      },
      transitionTimingFunction: {
        calm: "var(--ease-calm)",
        overlay: "var(--ease-overlay)",
      },
      transitionDuration: {
        fast: "150ms",
        gentle: "220ms",
        reveal: "450ms",
        settle: "700ms",
        hover: "180ms",
      },
      maxWidth: {
        measure: "66ch",
        "measure-tight": "62ch",
        /* Display type sets wider per character, so it needs a tighter measure. */
        "measure-display": "46ch",
      },
      backdropBlur: {
        glass: "var(--glass-blur)",
      },
      boxShadow: {
        glass: "var(--glass-shadow)",
        bento: "var(--card-shadow)",
        rest: "var(--shadow-rest)",
        hover: "var(--shadow-hover)",
        float: "var(--shadow-float)",
        lift: "var(--shadow-lift)",
        card: "0 1px 2px rgba(11, 11, 13, 0.04), 0 8px 24px -16px rgba(11, 11, 13, 0.18)",
        popover: "0 12px 40px -12px rgba(11, 11, 13, 0.55)",
      },
      keyframes: {
        "fade-rise": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "fade-out": {
          from: { opacity: "1" },
          to: { opacity: "0" },
        },
        // A floating surface arriving from just below where it will rest.
        "float-in": {
          from: { opacity: "0", transform: "translateY(4px) scale(0.98)" },
          to: { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        // Outbound flow. One direction, slow, linear — a current, not a pulse.
        flow: {
          from: { strokeDashoffset: "40" },
          to: { strokeDashoffset: "0" },
        },
      },
      animation: {
        "fade-rise": "fade-rise var(--duration-gentle) var(--ease-calm) both",
        /*
         * A scene arriving under the map.
         *
         * Same duration and same curve as the map's own re-frame, delayed by a
         * beat. That delay is the whole trick: the map starts moving first and the
         * surface settles into the movement already under way, so 1 → 2 → 3 reads
         * as one gesture rather than as three cuts. Matching the map exactly but
         * starting together would read as two things agreeing; trailing it reads
         * as one thing.
         */
        "scene-enter":
          "fade-rise var(--duration-reveal) var(--ease-calm) 90ms both",
        "fade-in": "fade-in var(--duration-gentle) var(--ease-calm) both",
        "scrim-in": "fade-in var(--duration-overlay-in) var(--ease-overlay) both",
        "scrim-out": "fade-out var(--duration-overlay-out) var(--ease-overlay) both",
        "float-in": "float-in var(--duration-hover) var(--ease-overlay) both",
        flow: "flow 5s linear infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
