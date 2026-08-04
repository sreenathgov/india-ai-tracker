/**
 * The camera rig (Bible §4 — points 1, 3 and 5 are the spec).
 *
 * Takes {scale, x, y, focusRect} and applies:
 *  (a) a transform on a SINGLE persistent child scene graph — the world is
 *      never unmounted or remounted between beats;
 *  (b) a vignette dropping non-focal content to a configurable opacity;
 *  (c) a blur on the out-of-focus plane.
 *
 * Focus is SUBTRACTIVE: the push does not add emphasis to the target — a
 * veil (backdrop blur + cream wash, with a feathered hole over the focus
 * rect) removes attention from everything else. The scene graph itself is
 * untouched: the veil is an overlay, so no child ever changes opacity,
 * filter, or mount state to achieve focus.
 *
 * Planes, bottom to top:
 *   1. graphics plane — `children`, camera-transformed; wrapped in MotionBlur
 *      when `track` is provided (motion blur sees camera motion because the
 *      transform is derived from the frame inside the blur boundary);
 *   2. text plane — `textPlane`, identically transformed, NEVER motion-blurred
 *      (Bible §4.5: never on text);
 *   3. focus veil — dims and blurs everything outside the focus rect,
 *      including out-of-focus text.
 */

import type { CSSProperties, ReactNode } from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { color, rgba, vignette } from "../design/tokens";
import { MotionBlur } from "./MotionBlur";
import { CameraPoseProvider, depthScale, type CameraPose } from "./depth";
import {
  useCameraTrack,
  type CameraKeyframe,
  type CameraFocusState,
  type FocusRect,
} from "./useCameraTrack";

// ─── transform ───────────────────────────────────────────────────────────────

type Pose = CameraPose;

const worldTransform = (
  pose: Pose,
  viewportWidth: number,
  viewportHeight: number
): CSSProperties => ({
  transformOrigin: "0 0",
  transform:
    `translate(${viewportWidth / 2}px, ${viewportHeight / 2}px) ` +
    `scale(${pose.scale}) translate(${-pose.x}px, ${-pose.y}px)`,
});

/** Graphics plane whose transform is re-derived from the frame, so motion
 * blur sub-frame samples see true camera motion. */
const TrackedPlane = ({
  track,
  children,
}: {
  readonly track: readonly CameraKeyframe[];
  readonly children: ReactNode;
}) => {
  const { width, height } = useVideoConfig();
  const pose = useCameraTrack(track);
  // The pose context is provided HERE (not by Camera) so <Depth> wrappers
  // inside the blur boundary see the same frame-derived pose the sub-frame
  // samples do — depth parallax participates in motion blur correctly.
  return (
    <AbsoluteFill style={worldTransform(pose, width, height)}>
      <CameraPoseProvider pose={pose}>{children}</CameraPoseProvider>
    </AbsoluteFill>
  );
};

// ─── focus veil ──────────────────────────────────────────────────────────────

/** World-space focus rect → screen space under the current pose, at the
 * rect's declared parallax depth (defaults to mid). */
const toScreenRect = (
  rect: FocusRect,
  pose: Pose,
  viewportWidth: number,
  viewportHeight: number
): FocusRect => {
  const s = depthScale(pose.scale, rect.depth ?? 1);
  return {
    x: (rect.x - pose.x) * s + viewportWidth / 2,
    y: (rect.y - pose.y) * s + viewportHeight / 2,
    width: rect.width * s,
    height: rect.height * s,
  };
};

/** Grow a rect outward by px on every side. */
const inflateRect = (r: FocusRect, px: number): FocusRect => ({
  x: r.x - px,
  y: r.y - px,
  width: r.width + 2 * px,
  height: r.height + 2 * px,
});

/** Clockwise rounded-rectangle subpath. */
const roundedRectPath = (r: FocusRect, radius: number): string => {
  const rad = Math.max(0, Math.min(radius, r.width / 2, r.height / 2));
  return (
    `M${r.x + rad},${r.y} H${r.x + r.width - rad} ` +
    `A${rad},${rad} 0 0 1 ${r.x + r.width},${r.y + rad} V${r.y + r.height - rad} ` +
    `A${rad},${rad} 0 0 1 ${r.x + r.width - rad},${r.y + r.height} H${r.x + rad} ` +
    `A${rad},${rad} 0 0 1 ${r.x},${r.y + r.height - rad} V${r.y + rad} ` +
    `A${rad},${rad} 0 0 1 ${r.x + rad},${r.y} Z`
  );
};

/**
 * Even-odd ring: the whole viewport minus the focus hole. The hole is a true
 * alpha hole (unpainted), which is what CSS masks and clip-paths actually
 * honour — a black-filled rect would still be opaque in the alpha channel.
 */
const ringPath = (
  hole: FocusRect,
  viewportWidth: number,
  viewportHeight: number,
  overscanPx: number,
  holeRadiusPx: number
): string =>
  `M${-overscanPx},${-overscanPx} H${viewportWidth + overscanPx} ` +
  `V${viewportHeight + overscanPx} H${-overscanPx} Z ` +
  roundedRectPath(hole, holeRadiusPx);

/** Feathered alpha mask for the tint layer, as an SVG data URI. */
const featheredRingMask = (
  ring: string,
  viewportWidth: number,
  viewportHeight: number,
  featherPx: number
): string => {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${viewportWidth}" height="${viewportHeight}">` +
    `<filter id="f"><feGaussianBlur stdDeviation="${featherPx / 2}"/></filter>` +
    `<path d="${ring}" fill="white" fill-rule="evenodd" filter="url(#f)"/>` +
    `</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
};

const FocusVeil = ({
  focus,
  pose,
}: {
  readonly focus: CameraFocusState;
  readonly pose: Pose;
}) => {
  const { width, height } = useVideoConfig();
  if (focus.strength <= 0) {
    return null;
  }
  const hole = toScreenRect(focus.rect, pose, width, height);
  const veilAlpha = (1 - focus.opacity) * focus.strength;
  const blur = focus.blurPx * focus.strength;
  const overscan = vignette.featherPx * 2;
  const ring = ringPath(hole, width, height, overscan, vignette.holeRadiusPx);
  const mask = featheredRingMask(ring, width, height, vignette.featherPx);
  return (
    <>
      {/* Out-of-focus blur. clip-path (not mask) — backdrop filters are only
          reliably bounded by clip-path in Chromium — and clip-path is a HARD
          edge, so the blur onsets as stepped rings walking out through the
          feather band: each ring's hole is inflated further and overlapping
          rings compound, so no single onset is findable by eye. */}
      {vignette.blurRings.map((step) => {
        const inflatePx = step.inflate * vignette.featherPx;
        const clip = ringPath(
          inflateRect(hole, inflatePx),
          width,
          height,
          overscan,
          vignette.holeRadiusPx + inflatePx
        );
        const stepBlur = blur * step.share;
        return (
          <AbsoluteFill
            key={step.inflate}
            style={{
              pointerEvents: "none",
              backdropFilter: `blur(${stepBlur}px)`,
              WebkitBackdropFilter: `blur(${stepBlur}px)`,
              clipPath: `path(evenodd, "${clip}")`,
            }}
          />
        );
      })}
      {/* Non-focal dim: cream wash with a feathered hole over the focus rect. */}
      <AbsoluteFill
        style={{
          pointerEvents: "none",
          backgroundColor: rgba(color.cream, veilAlpha),
          maskImage: mask,
          WebkitMaskImage: mask,
        }}
      />
    </>
  );
};

// ─── the rig ─────────────────────────────────────────────────────────────────

export interface CameraProps {
  /** Camera pose for this frame. */
  readonly scale: number;
  readonly x: number;
  readonly y: number;
  /** Focus (world space); null/undefined → no vignette. */
  readonly focusRect?: FocusRect | null;
  /** Non-focal opacity; defaults to tokens.vignette.nonFocalOpacity. */
  readonly focusOpacity?: number;
  /** Out-of-focus blur; defaults to tokens.vignette.blurPx (6–10 band). */
  readonly focusBlurPx?: number;
  /** 0..1 veil ramp — drive it WITH the push, not after. */
  readonly focusStrength?: number;
  /**
   * The camera track. When provided, the graphics plane derives its
   * transform from the frame inside a MotionBlur boundary (Bible §4.5).
   * The explicit pose props above must be the track's value at the current
   * frame (i.e. from `useCameraTrack(track)`).
   */
  readonly track?: readonly CameraKeyframe[];
  /** The single persistent scene graph — graphics plane. */
  readonly children: ReactNode;
  /** Sharp plane: same transform, never motion-blurred. Text lives here. */
  readonly textPlane?: ReactNode;
}

export const Camera = ({
  scale,
  x,
  y,
  focusRect,
  focusOpacity = vignette.nonFocalOpacity,
  focusBlurPx = vignette.blurPx,
  focusStrength = 1,
  track,
  children,
  textPlane,
}: CameraProps) => {
  const { width, height } = useVideoConfig();
  const pose: Pose = { scale, x, y };

  const graphics = track ? (
    <MotionBlur track={track}>
      <TrackedPlane track={track}>{children}</TrackedPlane>
    </MotionBlur>
  ) : (
    <AbsoluteFill style={worldTransform(pose, width, height)}>
      <CameraPoseProvider pose={pose}>{children}</CameraPoseProvider>
    </AbsoluteFill>
  );

  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: color.cream }}>
      {graphics}
      {textPlane === undefined ? null : (
        <AbsoluteFill style={worldTransform(pose, width, height)}>
          <CameraPoseProvider pose={pose}>{textPlane}</CameraPoseProvider>
        </AbsoluteFill>
      )}
      {focusRect ? (
        <FocusVeil
          focus={{
            rect: focusRect,
            opacity: focusOpacity,
            blurPx: focusBlurPx,
            strength: focusStrength,
          }}
          pose={pose}
        />
      ) : null}
    </AbsoluteFill>
  );
};
