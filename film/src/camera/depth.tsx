/**
 * Depth — the dolly axis of the one continuous world (Bible §4.1, §4.3).
 *
 * A flat world under one uniform transform reads as a ZOOM: every element
 * scales by the same factor. A camera move needs near content to displace
 * faster than far content. Each element may declare a depth factor; under
 * the camera pose its TRANSLATION is amplified by that factor while its
 * rendered scale is not. The three-plane split in `tokens.depth`
 * (background 0.85 / mid 1.0 / foreground 1.15) is the whole vocabulary —
 * this is a subtle displacement cue, not a 3D effect.
 *
 * API (Phase B components declare their own depth):
 *
 *   <Depth factor={depth.foreground} anchor={{ x: 1560, y: 540 }}>
 *     <PanelCard />
 *   </Depth>
 *
 * - `anchor` (world point, normally the element's centre): the element's
 *   anchor displaces as if at its depth, while the element itself keeps the
 *   camera's own scale — translation amplified, scale untouched. Use this
 *   for cards, chips, panels: anything with a centre.
 * - No `anchor`: plane mode, for scenery that spans the frame (grids,
 *   rules, washes). The whole plane scales about the camera axis at the
 *   depth-adjusted rate; symmetric about the axis, so a centred push never
 *   reads as a lateral slide.
 * - Unwrapped content is mid-plane (factor 1) by definition.
 *
 * Depth reads the camera pose from context, so it behaves identically on
 * the graphics plane (including inside the motion-blur boundary, where the
 * pose is re-derived per sub-frame sample) and on the sharp text plane.
 * At rest (camera scale 1) every depth factor is the identity — depth only
 * ever expresses itself through camera motion.
 */

import { createContext, useContext } from "react";
import type { CSSProperties, ReactNode } from "react";
import { AbsoluteFill } from "remotion";

// ─── camera pose context ─────────────────────────────────────────────────────

export interface CameraPose {
  readonly scale: number;
  /** World-space point sitting at the viewport centre. */
  readonly x: number;
  readonly y: number;
}

const CameraPoseContext = createContext<CameraPose | null>(null);

export const CameraPoseProvider = ({
  pose,
  children,
}: {
  readonly pose: CameraPose;
  readonly children: ReactNode;
}) => (
  <CameraPoseContext.Provider value={pose}>
    {children}
  </CameraPoseContext.Provider>
);

export const useCameraPose = (): CameraPose => {
  const pose = useContext(CameraPoseContext);
  if (pose === null) {
    throw new Error(
      "useCameraPose()/<Depth> must be rendered inside <Camera> " +
        "(the camera provides the pose on both planes)."
    );
  }
  return pose;
};

// ─── depth math ──────────────────────────────────────────────────────────────

/**
 * Effective displacement rate for a depth factor: the camera's displacement
 * (scale − 1) multiplied by the factor. Identity at rest for every factor.
 */
export const depthScale = (cameraScale: number, factor: number): number =>
  1 + factor * (cameraScale - 1);

// ─── the element wrapper ─────────────────────────────────────────────────────

export interface WorldPoint {
  readonly x: number;
  readonly y: number;
}

export interface DepthProps {
  /** Depth factor from tokens.depth (background 0.85 / mid 1 / foreground 1.15). */
  readonly factor: number;
  /** World anchor (element centre). Present → element mode; absent → plane mode. */
  readonly anchor?: WorldPoint;
  readonly children: ReactNode;
}

export const Depth = ({ factor, anchor, children }: DepthProps) => {
  const pose = useCameraPose();
  if (!Number.isFinite(factor) || factor <= 0) {
    throw new Error(`<Depth>: factor must be a positive number, got ${factor}.`);
  }
  const sD = depthScale(pose.scale, factor);

  // Element mode: shift the anchor to where its depth puts it; the outer
  // camera transform then applies the camera's own scale, unamplified.
  // Plane mode: scale the plane about the camera axis at the depth rate —
  // the correction ratio sD/s composed with the world transform's s yields
  // exactly sD, symmetric about the axis.
  const style: CSSProperties = anchor
    ? {
        transform:
          `translate(${(anchor.x - pose.x) * ((sD - pose.scale) / pose.scale)}px, ` +
          `${(anchor.y - pose.y) * ((sD - pose.scale) / pose.scale)}px)`,
      }
    : {
        transformOrigin: "0 0",
        transform:
          `translate(${pose.x}px, ${pose.y}px) ` +
          `scale(${sD / pose.scale}) ` +
          `translate(${-pose.x}px, ${-pose.y}px)`,
      };

  return <AbsoluteFill style={style}>{children}</AbsoluteFill>;
};
