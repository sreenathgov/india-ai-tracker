/**
 * World component contract — the interface every Phase B component shares
 * (Bible §5, §6; Phases doc Part 1).
 *
 * ARCHITECTURAL RULES (non-negotiable):
 *
 * 1. Components own NO timing. Every component is a pure function of its
 *    props and renders correctly at any frozen value. No useCurrentFrame,
 *    no useVideoConfig, no springs, no frame interpolation — all timing
 *    lives in Film.tsx, which computes progress channels (0..1) per frame.
 *    Where the Bible specifies a stagger (e.g. intake cards 90 ms apart),
 *    the component takes a per-item progress ARRAY and Film staggers it.
 *
 * 2. The two-plane layer split. The camera renders the world twice: once on
 *    the graphics plane (motion-blur eligible) and once on the sharp text
 *    plane (Bible §4.5: motion blur never on text). Every world component
 *    takes `layer` and renders ONLY that sublayer:
 *      layer="graphics" → surfaces, borders, bars, sweeps, chips'
 *                         backgrounds, glyph-free shapes;
 *      layer="text"     → every glyph: words, numbers, marks (◆ ◇ ◌), the
 *                         MatchGlyph, typed characters.
 *    Both renders MUST share identical box math so the layers register
 *    pixel-exactly. Text chips: background pill on graphics, label on text.
 *
 * 3. Position-agnostic. A component renders into a box of its canonical
 *    SIZE with its own origin at (0,0); the World places it (placeAt) and
 *    wraps it in <Depth> with the component's exported depth constant.
 *    Components never import the camera or <Depth> themselves.
 *
 * 4. Values and copy import from data/shipment.ts (COPY / DISPLAY / fixture
 *    exports). Colours, radii, easings, motion constants import from
 *    design/tokens.ts; fonts from design/type.ts. Nothing is hardcoded.
 */

import type { CSSProperties, ReactNode } from "react";
import { color } from "../design/tokens";

// ─── layers ──────────────────────────────────────────────────────────────────

export type WorldLayer = "graphics" | "text";

export interface LayerProps {
  readonly layer: WorldLayer;
}

// ─── progress helpers ────────────────────────────────────────────────────────

/** A timing channel: 0..1, computed by Film.tsx, never by a component. */
export type Progress = number;

export const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));

export const mix = (a: number, b: number, t: number): number => a + (b - a) * t;

// ─── canonical component boxes (world units; 1920×1080 at camera scale 1) ────

export const SIZES = {
  documentCard: { width: 460, height: 92 },
  intakeColumn: { width: 500, height: 812 },
  statLine: { width: 760, height: 36 },
  matchPane: { width: 720, height: 116 },
  matchGlyph: { width: 96, height: 96 },
  ruleCard: { width: 600, height: 280 },
  requestCard: { width: 560, height: 360 },
  supplierSurface: { width: 720, height: 620 },
  readinessMatrix: { width: 880, height: 460 },
  sealSurface: { width: 620, height: 470 },
  packetCard: { width: 540, height: 150 },
} as const;

/** Intake column internal geometry — exported so the camera can target rows. */
export const INTAKE = {
  padding: 20,
  headerHeight: 44,
  gap: 14,
  slotCount: 7,
} as const;

/** Local rect of intake slot i (0-based), inside the IntakeColumn box. */
export const intakeSlotRect = (
  i: number
): { x: number; y: number; width: number; height: number } => {
  if (!Number.isInteger(i) || i < 0 || i >= INTAKE.slotCount) {
    throw new Error(`intakeSlotRect(): slot must be 0..${INTAKE.slotCount - 1}, got ${i}.`);
  }
  return {
    x: INTAKE.padding,
    y:
      INTAKE.padding +
      INTAKE.headerHeight +
      i * (SIZES.documentCard.height + INTAKE.gap),
    width: SIZES.documentCard.width,
    height: SIZES.documentCard.height,
  };
};

// ─── placement ───────────────────────────────────────────────────────────────

/** World placement wrapper style: absolute box at (x, y) of the given size. */
export const placeAt = (
  x: number,
  y: number,
  size: { readonly width: number; readonly height: number }
): CSSProperties => ({
  position: "absolute",
  left: x,
  top: y,
  width: size.width,
  height: size.height,
});

// ─── still stage (component review harness, Phase B Part 1) ──────────────────

/**
 * Cream stage for a review Still: stacks the graphics and text renders of a
 * component (author both instances as children) over the film's ground.
 */
export const StillStage = ({
  width,
  height,
  children,
}: {
  readonly width: number;
  readonly height: number;
  readonly children: ReactNode;
}) => (
  <div
    style={{
      position: "relative",
      width,
      height,
      backgroundColor: color.cream,
      overflow: "hidden",
    }}
  >
    {children}
  </div>
);
