/**
 * Cursor — the human on screen (Bible §4.6, peppy variant):
 * travel 380 ms → hover 140 ms → press 120 ms → ripple.
 *
 * Takes a target (a point in the cursor plane's coordinate space, or a ref to
 * an element rendered in the same plane) and a timeline position
 * (`startFrame`). Renders inside the world, so it inherits the camera
 * transform and stays glued to what it clicks.
 *
 * Nothing bounces: every phase runs on the master easing with no overshoot.
 * The cursor itself is ink — vermilion marks the active TARGET, and painting
 * the target is the scene's job, not the cursor's.
 */

import { useLayoutEffect, useRef, useState, type RefObject } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { color, motion, rgba } from "../design/tokens";
import { masterEase, msToFrames } from "../camera/useCameraTrack";

// ─── types ───────────────────────────────────────────────────────────────────

export interface Point {
  readonly x: number;
  readonly y: number;
}

export type CursorTarget = Point | RefObject<HTMLElement | null>;

export interface CursorProps {
  /** Frame at which travel begins. */
  readonly startFrame: number;
  /** Where the cursor travels from (cursor-plane coordinates). */
  readonly from: Point;
  /** Where it lands: a point, or a ref to an element in the same plane. */
  readonly target: CursorTarget;
  /** Hide the cursor this many frames after the ripple ends (optional). */
  readonly exitFrame?: number;
  /** Diameter of the cursor dot, px. */
  readonly size?: number;
}

// ─── phase timeline helpers ──────────────────────────────────────────────────

export interface CursorTimeline {
  readonly travelStart: number;
  readonly hoverStart: number;
  readonly pressStart: number;
  readonly rippleStart: number;
  /** Frame at which the press lands — the response may begin here. */
  readonly responseFrame: number;
  readonly rippleEnd: number;
}

/** The cursor's phase boundaries, in frames, for choreography to sync against. */
export const cursorTimeline = (startFrame: number, fps: number): CursorTimeline => {
  const { travelMs, hoverMs, pressMs, rippleMs } = motion.cursor;
  const travelStart = startFrame;
  const hoverStart = travelStart + msToFrames(travelMs, fps);
  const pressStart = hoverStart + msToFrames(hoverMs, fps);
  const rippleStart = pressStart + msToFrames(pressMs, fps);
  return {
    travelStart,
    hoverStart,
    pressStart,
    rippleStart,
    responseFrame: rippleStart,
    rippleEnd: rippleStart + msToFrames(rippleMs, fps),
  };
};

const isRefTarget = (
  t: CursorTarget
): t is RefObject<HTMLElement | null> => "current" in t;

// ─── component ───────────────────────────────────────────────────────────────

export const Cursor = ({
  startFrame,
  from,
  target,
  exitFrame,
  size = 18,
}: CursorProps) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const planeRef = useRef<HTMLDivElement>(null);
  const [measured, setMeasured] = useState<Point | null>(null);

  // Resolve a ref target into cursor-plane coordinates. The plane may sit
  // inside the camera transform, so divide the on-screen delta by the
  // plane's effective scale. Runs every render; layout is deterministic per
  // frame, so the measurement is too.
  useLayoutEffect(() => {
    if (!isRefTarget(target)) {
      return;
    }
    const el = target.current;
    const plane = planeRef.current;
    if (!el || !plane || plane.offsetWidth === 0) {
      return;
    }
    const elRect = el.getBoundingClientRect();
    const planeRect = plane.getBoundingClientRect();
    const planeScale = planeRect.width / plane.offsetWidth;
    const next: Point = {
      x: (elRect.left + elRect.width / 2 - planeRect.left) / planeScale,
      y: (elRect.top + elRect.height / 2 - planeRect.top) / planeScale,
    };
    setMeasured((prev) =>
      prev && prev.x === next.x && prev.y === next.y ? prev : next
    );
  });

  const to: Point | null = isRefTarget(target) ? measured : target;
  const t = cursorTimeline(startFrame, fps);

  const visible =
    frame >= t.travelStart && (exitFrame === undefined || frame < exitFrame);

  if (!visible || to === null) {
    return <AbsoluteFill ref={planeRef} style={{ pointerEvents: "none" }} />;
  }

  // Travel: from → target on the master easing. No overshoot.
  const travelSpan = t.hoverStart - t.travelStart;
  const travelP = masterEase(
    Math.min(1, Math.max(0, (frame - t.travelStart) / travelSpan))
  );
  const cx = from.x + (to.x - from.x) * travelP;
  const cy = from.y + (to.y - from.y) * travelP;

  // Press: the dot compresses, then releases. Eased both ways, no bounce.
  const pressSpan = t.rippleStart - t.pressStart;
  let pressScale = 1;
  if (frame >= t.pressStart && frame < t.rippleStart) {
    pressScale = 1 - 0.12 * masterEase((frame - t.pressStart) / pressSpan);
  } else if (frame >= t.rippleStart) {
    const releaseP = Math.min(1, (frame - t.rippleStart) / pressSpan);
    pressScale = 0.88 + 0.12 * masterEase(releaseP);
  }

  // Ripple: a hairline ring expanding from the press point, fading out.
  const rippleSpan = t.rippleEnd - t.rippleStart;
  const rippleP =
    frame >= t.rippleStart
      ? Math.min(1, (frame - t.rippleStart) / rippleSpan)
      : null;
  const rippleEased = rippleP === null ? null : masterEase(rippleP);

  return (
    <AbsoluteFill ref={planeRef} style={{ pointerEvents: "none" }}>
      {rippleEased !== null && rippleEased < 1 ? (
        <div
          style={{
            position: "absolute",
            left: to.x,
            top: to.y,
            width: size + rippleEased * size * 2.6,
            height: size + rippleEased * size * 2.6,
            transform: "translate(-50%, -50%)",
            borderRadius: "50%",
            border: `1.5px solid ${color.navy}`,
            opacity: 0.35 * (1 - rippleEased),
          }}
        />
      ) : null}
      <div
        style={{
          position: "absolute",
          left: cx,
          top: cy,
          width: size,
          height: size,
          transform: `translate(-50%, -50%) scale(${pressScale})`,
          borderRadius: "50%",
          backgroundColor: rgba(color.cream, 0.65),
          border: `1.5px solid ${color.ink}`,
          boxShadow: `0 2px 8px ${rgba(color.navyDeep, 0.25)}`,
        }}
      />
    </AbsoluteFill>
  );
};
