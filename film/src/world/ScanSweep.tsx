/**
 * ScanSweep — the vermilion scan sweep (Bible §5 Beat 1): a narrow vertical
 * band crossing the card left→right as `progress` runs 0→1, with a faint
 * trailing wash behind it. Vermilion is the single reserved hero accent
 * (Bible §3) and this is its only home outside the active cursor target.
 *
 * Graphics-only: no glyphs, so no `layer` prop (contract.tsx rule 2). The
 * parent includes it on the graphics plane and is responsible for clipping
 * it to the card's shape.
 */

import { clamp01, mix } from "./contract";
import { color, rgba } from "../design/tokens";

export interface ScanSweepProps {
  readonly progress: number;
  readonly width: number;
  readonly height: number;
}

/** Sweep band width as a fraction of the card width (Bible §5: "~18%"). */
const BAND_WIDTH_FRACTION = 0.18;
/** Trailing wash is wider than the sweep band and sits behind (to its left). */
const TRAIL_WIDTH_MULTIPLIER = 1.8;
const TRAIL_OFFSET_FRACTION = 0.35;
const TRAIL_OPACITY_FACTOR = 0.45;
/** Sweep opacity begins falling to 0 here, so it exits clean by progress 1. */
const FADE_START = 0.85;

export const ScanSweep = ({ progress, width, height }: ScanSweepProps) => {
  const p = clamp01(progress);
  const bandWidth = width * BAND_WIDTH_FRACTION;
  // Travels from fully off-screen left to fully off-screen right.
  const centerX = mix(-bandWidth / 2, width + bandWidth / 2, p);
  const overallOpacity = p < FADE_START ? 1 : 1 - (p - FADE_START) / (1 - FADE_START);

  const trailWidth = bandWidth * TRAIL_WIDTH_MULTIPLIER;
  const trailCenterX = centerX - bandWidth * TRAIL_OFFSET_FRACTION;

  return (
    <div style={{ position: "relative", width, height, pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          left: trailCenterX - trailWidth / 2,
          top: 0,
          width: trailWidth,
          height,
          opacity: overallOpacity * TRAIL_OPACITY_FACTOR,
          background: `linear-gradient(90deg, transparent 0%, ${rgba(color.vermilion, 0.4)} 55%, transparent 100%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: centerX - bandWidth / 2,
          top: 0,
          width: bandWidth,
          height,
          opacity: overallOpacity,
          background: `linear-gradient(90deg, transparent 0%, ${rgba(color.vermilion, 0.9)} 50%, transparent 100%)`,
        }}
      />
    </div>
  );
};
