/**
 * Motion blur — applied only to camera reframes faster than
 * 1.4× scale-per-second (Bible §4.5). Never to text.
 *
 * Contract:
 * - Wrap ONLY the graphics plane. Text lives on the Camera's sharp
 *   `textPlane`, which is never passed through this component.
 * - The wrapper is ALWAYS mounted so the scene graph persists; below the
 *   threshold the shutter angle is 0 and the samples collapse to identical
 *   renders (no visible blur, no remount).
 * - Children must derive their transform from the frame (via
 *   `cameraStateAt`/`useCameraTrack`) so the sub-frame samples actually see
 *   camera motion.
 */

import type { ReactNode } from "react";
import { CameraMotionBlur } from "@remotion/motion-blur";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { motion } from "../design/tokens";
import { cameraStateAt, type CameraKeyframe } from "./useCameraTrack";

export interface MotionBlurProps {
  /** The camera track; velocity is measured from it at the true frame. */
  readonly track: readonly CameraKeyframe[];
  readonly children: ReactNode;
  /** Sub-frame samples. Constant while mounted so nothing remounts. */
  readonly samples?: number;
  /** Shutter angle at (and beyond) 2× the engage threshold. */
  readonly maxShutterAngle?: number;
}

export const MotionBlur = ({
  track,
  children,
  samples = 6,
  maxShutterAngle = 180,
}: MotionBlurProps) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const threshold = motion.motionBlurThresholdScalePerSecond;
  const speed = Math.abs(
    cameraStateAt(track, frame, fps).scaleVelocityPerSecond
  );

  // 0 below the engage threshold; ramps in above it so the blur neither pops
  // on nor bounces. Floor at an invisible epsilon: CameraMotionBlur divides
  // by (shutterAngle * samples) internally, so an exact 0 crashes at frame 0.
  const shutterAngle = Math.max(
    0.01,
    interpolate(speed, [threshold, threshold * 2], [0, maxShutterAngle], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );

  return (
    <CameraMotionBlur shutterAngle={shutterAngle} samples={samples}>
      {children}
    </CameraMotionBlur>
  );
};
