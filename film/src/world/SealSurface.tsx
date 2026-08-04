/**
 * SealSurface — Beat 6 (Bible §5): Human Beat 2, the seal stamp, and the
 * signed hash line. Pure function of props; owns no timing (contract.tsx
 * rule 1). Renders one of the two world planes per `layer` (rule 2), sharing
 * identical box math so graphics and text register pixel-exactly.
 *
 * Carries the film's ONE permitted overshoot (Bible §3): the stamp scale
 * runs fromScale → overshootScale → restScale, piecewise on stampProgress,
 * using constants ONLY from tokens.motion.seal. Nothing else here overshoots
 * — badges arrive LINEAR (scale 1.12 → 1, no easing).
 *
 * Vermilion appears in exactly one place in this batch: the button's
 * active-cursor-target ramp on `buttonEmphasis`. Nowhere else.
 */

import type { CSSProperties } from "react";
import { AuthorityMark } from "../chrome/AuthorityMark";
import { clamp01, mix, SIZES, type LayerProps } from "./contract";
import { color, depth, motion, radius, rgba } from "../design/tokens";
import { baseTextStyle, fontFamily, fontWeight } from "../design/type";

// ─── props ───────────────────────────────────────────────────────────────────

export type SealButtonState = "idle" | "active" | "pressed" | "sealed";

export interface SealSurfaceProps extends LayerProps {
  readonly buttonLabel: string;
  readonly buttonState: SealButtonState;
  /** 0..1 vermilion ramp (active cursor target). */
  readonly buttonEmphasis: number;
  /** 0..1 — the ONE overshoot; opacity 0→1 across the first 15%. */
  readonly stampProgress: number;
  /** Length 2 — certificate badges: scale 1.12→1 + opacity, LINEAR, no overshoot. */
  readonly badgeProgress: readonly number[];
  readonly hashText: string;
  /** 0..1 scramble→settle. */
  readonly hashProgress: number;
  readonly sealLine: string;
  /** 0..1 reveal. */
  readonly sealLineProgress: number;
}

export const SEAL_SURFACE_DEPTH = depth.mid;

// ─── geometry (identical box math for both planes) ───────────────────────────

const BOX = SIZES.sealSurface;
const FRAME_PADDING = 28;
const STAMP_SIZE = 120;
const STAMP_CENTER = { x: BOX.width / 2, y: FRAME_PADDING + STAMP_SIZE / 2 };
const BADGE_SIZE = 48;
const BADGE_GAP_FROM_STAMP = 24;
const BADGE_SPREAD = 90;
const BADGE_TOP = STAMP_CENTER.y + STAMP_SIZE / 2 + BADGE_GAP_FROM_STAMP;
const BUTTON_WIDTH = 220;
const BUTTON_HEIGHT = 52;
const BUTTON_TOP = BADGE_TOP + BADGE_SIZE + 24;
const RULE_TOP = BUTTON_TOP + BUTTON_HEIGHT + 24;
const HASH_TOP = RULE_TOP + 16;
const SEAL_LINE_TOP = HASH_TOP + 44;

interface Rect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

const badgeRect = (i: number): Rect => ({
  x: STAMP_CENTER.x + (i === 0 ? -BADGE_SPREAD : BADGE_SPREAD) - BADGE_SIZE / 2,
  y: BADGE_TOP,
  width: BADGE_SIZE,
  height: BADGE_SIZE,
});

const BUTTON_RECT: Rect = { x: (BOX.width - BUTTON_WIDTH) / 2, y: BUTTON_TOP, width: BUTTON_WIDTH, height: BUTTON_HEIGHT };
const FRAME_RECT: Rect = { x: 0, y: 0, width: BOX.width, height: BOX.height };

/** The two stamp rings: outer bold, inner hairline — same centre, same scale curve. */
const STAMP_RINGS = [
  { size: STAMP_SIZE, border: 2, opacityMul: 1 },
  { size: STAMP_SIZE - 18, border: 1, opacityMul: 0.6 },
] as const;

const rectStyle = (r: Rect): CSSProperties => ({ position: "absolute", left: r.x, top: r.y, width: r.width, height: r.height });

// ─── the one overshoot: piecewise stamp scale (Bible §3) ─────────────────────

const STAMP_PEAK_AT = 0.6;

const stampScale = (p: number): number => {
  const t = clamp01(p);
  return t <= STAMP_PEAK_AT
    ? mix(motion.seal.fromScale, motion.seal.overshootScale, t / STAMP_PEAK_AT)
    : mix(motion.seal.overshootScale, motion.seal.restScale, (t - STAMP_PEAK_AT) / (1 - STAMP_PEAK_AT));
};

const stampOpacity = (p: number): number => clamp01(p / 0.15);

// ─── colour blend (tokens only — no hardcoded colour literals) ───────────────

const parseColor = (value: string): { r: number; g: number; b: number; a: number } => {
  const hex = /^#([0-9a-f]{6})$/i.exec(value);
  if (hex) {
    const n = parseInt(hex[1], 16);
    return { r: (n >> 16) & 0xff, g: (n >> 8) & 0xff, b: n & 0xff, a: 1 };
  }
  const rgbaMatch = /^rgba\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*\)$/.exec(value);
  if (rgbaMatch) {
    return { r: Number(rgbaMatch[1]), g: Number(rgbaMatch[2]), b: Number(rgbaMatch[3]), a: Number(rgbaMatch[4]) };
  }
  throw new Error(`SealSurface parseColor(): unsupported colour token "${value}".`);
};

const mixColor = (a: string, b: string, t: number): string => {
  const ca = parseColor(a);
  const cb = parseColor(b);
  const t01 = clamp01(t);
  return `rgba(${mix(ca.r, cb.r, t01)},${mix(ca.g, cb.g, t01)},${mix(ca.b, cb.b, t01)},${mix(ca.a, cb.a, t01)})`;
};

// ─── deterministic hash scramble (no randomness) ──────────────────────────────

const HEX_DIGITS = "0123456789abcdef";

/** Pure integer mix of (character index, scramble tick) → a hex digit. */
const scrambleChar = (i: number, tick: number): string => {
  const mixed = (i * 2654435761 + tick * 40503 + 1) >>> 0;
  return HEX_DIGITS[mixed % HEX_DIGITS.length];
};

const scrambledHash = (hashText: string, hashProgress: number): string => {
  const p = clamp01(hashProgress);
  const tick = Math.floor(p * 24);
  const settledCount = hashText.length * p;
  let out = "";
  for (let i = 0; i < hashText.length; i++) {
    const ch = hashText[i];
    out += ch === "…" ? ch : i < settledCount ? ch : scrambleChar(i, tick);
  }
  return out;
};

// ─── component ───────────────────────────────────────────────────────────────

export const SealSurface = ({
  layer,
  buttonLabel,
  buttonState,
  buttonEmphasis,
  stampProgress,
  badgeProgress,
  hashText,
  hashProgress,
  sealLine,
  sealLineProgress,
}: SealSurfaceProps) => {
  const emphasis = clamp01(buttonEmphasis);
  const buttonOpacity = buttonState === "sealed" ? 0.4 : 1;
  const sScale = stampScale(stampProgress);
  const sOpacity = stampOpacity(stampProgress);
  const sealLineP = clamp01(sealLineProgress);

  if (layer === "graphics") {
    return (
      <div style={rectStyle(FRAME_RECT)}>
        <div
          style={{
            ...rectStyle(FRAME_RECT),
            borderRadius: radius.frame,
            border: `1px solid ${color.rule}`,
            backgroundColor: rgba(color.navy, 0.04),
          }}
        />
        {STAMP_RINGS.map((ring) => (
          <div
            key={`ring-${ring.size}`}
            style={{
              ...rectStyle({ x: STAMP_CENTER.x - ring.size / 2, y: STAMP_CENTER.y - ring.size / 2, width: ring.size, height: ring.size }),
              borderRadius: "50%",
              border: `${ring.border}px solid ${color.navy}`,
              opacity: sOpacity * ring.opacityMul,
              transform: `scale(${sScale})`,
              transformOrigin: "center",
            }}
          />
        ))}
        {[0, 1].map((i) => (
          <div
            key={`badge-${i}`}
            style={{
              ...rectStyle(badgeRect(i)),
              borderRadius: "50%",
              border: `1px solid ${color.navy}`,
              backgroundColor: "transparent",
              opacity: clamp01(badgeProgress[i] ?? 0),
              transform: `scale(${mix(1.12, 1, clamp01(badgeProgress[i] ?? 0))})`,
              transformOrigin: "center",
            }}
          />
        ))}
        <div style={{ ...rectStyle({ x: FRAME_PADDING, y: RULE_TOP, width: BOX.width - FRAME_PADDING * 2, height: 1 }), backgroundColor: color.rule }} />
        <div
          style={{
            ...rectStyle(BUTTON_RECT),
            borderRadius: radius.pill,
            border: `1px solid ${color.rule}`,
            backgroundColor: mixColor(rgba(color.navy, 0.06), color.vermilion, emphasis),
            opacity: buttonOpacity,
          }}
        />
      </div>
    );
  }

  // layer === "text"
  return (
    <div style={rectStyle(FRAME_RECT)}>
      <div
        style={{
          position: "absolute",
          left: STAMP_CENTER.x,
          top: STAMP_CENTER.y,
          opacity: sOpacity,
          transform: `scale(${sScale})`,
          transformOrigin: "center",
        }}
      >
        <div style={{ position: "absolute", left: -14, top: -14 }}>
          <AuthorityMark kind="signed" size={28} />
        </div>
      </div>
      {[0, 1].map((i) => {
        const p = clamp01(badgeProgress[i] ?? 0);
        const rect = badgeRect(i);
        return (
          <div
            key={`badge-mark-${i}`}
            style={{
              position: "absolute",
              left: rect.x + rect.width / 2,
              top: rect.y + rect.height / 2,
              opacity: p,
              transform: `scale(${mix(1.12, 1, p)})`,
              transformOrigin: "center",
            }}
          >
            <div style={{ position: "absolute", left: -6, top: -6 }}>
              <AuthorityMark kind="signed" size={12} />
            </div>
          </div>
        );
      })}
      <div
        style={{
          ...baseTextStyle,
          ...rectStyle({ x: FRAME_PADDING, y: HASH_TOP, width: BOX.width - FRAME_PADDING * 2, height: 24 }),
          fontFamily: fontFamily.mono,
          fontWeight: fontWeight.regular,
          fontSize: 20,
          color: color.ink,
          // No hash exists before sealing begins: the scramble appears only
          // once hashProgress moves — never a fake hash at rest.
          opacity: clamp01(hashProgress * 8),
        }}
      >
        {scrambledHash(hashText, hashProgress)}
      </div>
      <div
        style={{
          ...baseTextStyle,
          ...rectStyle(BUTTON_RECT),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: fontFamily.ui,
          fontWeight: fontWeight.regular,
          fontSize: 14,
          color: mixColor(color.ink, color.vermilion, emphasis),
          opacity: buttonOpacity,
        }}
      >
        {buttonLabel}
      </div>
      <div
        style={{
          ...baseTextStyle,
          ...rectStyle({ x: FRAME_PADDING, y: SEAL_LINE_TOP + (1 - sealLineP) * 6, width: BOX.width - FRAME_PADDING * 2, height: 20 }),
          fontFamily: fontFamily.ui,
          fontWeight: fontWeight.regular,
          fontSize: 13,
          color: color.inkDim,
          opacity: sealLineP,
        }}
      >
        {sealLine}
      </div>
    </div>
  );
};
