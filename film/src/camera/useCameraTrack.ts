/**
 * Camera track — keyframe interpolation driven by frame number, on the master
 * easing cubic-bezier(0.22, 1, 0.36, 1) (Bible §3, §4).
 *
 * The core (`cameraStateAt`) is a pure function of (keyframes, frame, fps) so
 * it can be evaluated at fractional frames — which is what makes the motion
 * blur sub-frame samples agree with the true camera path.
 */

import { Easing, useCurrentFrame, useVideoConfig } from "remotion";
import { easing, vignette } from "../design/tokens";

// ─── types ───────────────────────────────────────────────────────────────────

/** A rectangle in world coordinates. */
export interface FocusRect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  /**
   * Parallax depth of the focused element (tokens.depth). The veil hole is
   * projected at this depth so it lands on the element's true screen
   * position. Defaults to mid (1).
   */
  readonly depth?: number;
}

export interface CameraFocus {
  readonly rect: FocusRect;
  /** Opacity non-focal content drops to. Defaults to tokens.vignette. */
  readonly opacity?: number;
  /** Blur on the out-of-focus plane, px. Defaults to tokens.vignette. */
  readonly blurPx?: number;
}

export interface CameraKeyframe {
  readonly frame: number;
  readonly scale: number;
  /** World-space point that sits at the viewport centre. */
  readonly x: number;
  readonly y: number;
  /** Focus for this keyframe; omit (or null) for no vignette. */
  readonly focus?: CameraFocus | null;
}

export interface CameraFocusState {
  readonly rect: FocusRect;
  readonly opacity: number;
  readonly blurPx: number;
  /** 0..1 — ramps WITH the reframe as focus engages/disengages. */
  readonly strength: number;
}

export interface CameraState {
  readonly scale: number;
  readonly x: number;
  readonly y: number;
  readonly focus: CameraFocusState | null;
  /** Signed rate of scale change, in scale units per second. */
  readonly scaleVelocityPerSecond: number;
}

// ─── master easing ───────────────────────────────────────────────────────────

const [e0, e1, e2, e3] = easing.master;
export const masterEase = Easing.bezier(e0, e1, e2, e3);

// ─── validation (fail fast, at the boundary) ─────────────────────────────────

const validateTrack = (keyframes: readonly CameraKeyframe[]): void => {
  if (keyframes.length === 0) {
    throw new Error("Camera track needs at least one keyframe.");
  }
  for (let i = 0; i < keyframes.length; i++) {
    const k = keyframes[i];
    if (!Number.isFinite(k.frame) || !Number.isFinite(k.scale) || k.scale <= 0) {
      throw new Error(
        `Camera keyframe ${i} is invalid (frame=${k.frame}, scale=${k.scale}).`
      );
    }
    if (i > 0 && k.frame <= keyframes[i - 1].frame) {
      throw new Error(
        `Camera keyframes must be strictly ascending by frame; keyframe ${i} ` +
          `(frame ${k.frame}) does not follow frame ${keyframes[i - 1].frame}.`
      );
    }
  }
};

// ─── interpolation core ──────────────────────────────────────────────────────

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

const lerpRect = (a: FocusRect, b: FocusRect, t: number): FocusRect => ({
  x: lerp(a.x, b.x, t),
  y: lerp(a.y, b.y, t),
  width: lerp(a.width, b.width, t),
  height: lerp(a.height, b.height, t),
  depth: lerp(a.depth ?? 1, b.depth ?? 1, t),
});

const focusState = (
  focus: CameraFocus,
  strength: number
): CameraFocusState => ({
  rect: focus.rect,
  opacity: focus.opacity ?? vignette.nonFocalOpacity,
  blurPx: focus.blurPx ?? vignette.blurPx,
  strength,
});

const interpolateFocus = (
  from: CameraFocus | null | undefined,
  to: CameraFocus | null | undefined,
  t: number,
  clock: number
): CameraFocusState | null => {
  if (from && to) {
    return {
      rect: lerpRect(from.rect, to.rect, t),
      opacity: lerp(
        from.opacity ?? vignette.nonFocalOpacity,
        to.opacity ?? vignette.nonFocalOpacity,
        t
      ),
      blurPx: lerp(from.blurPx ?? vignette.blurPx, to.blurPx ?? vignette.blurPx, t),
      strength: 1,
    };
  }
  // Focus engages or disengages WITH the reframe, never after it (Bible §5:
  // vignette ramps with the push). Density runs on the segment's LINEAR
  // clock, not the eased t: the master ease front-loads its travel, and an
  // alpha ramp riding the eased value collapses perceptually in the first
  // third of the move — the veil would read fully lifted while the scale is
  // still settling. On the linear clock the veil ramps through the whole
  // reframe and co-terminates with the pose exactly.
  if (to) {
    return focusState(to, clock);
  }
  if (from) {
    return focusState(from, 1 - clock);
  }
  return null;
};

const poseAt = (
  keyframes: readonly CameraKeyframe[],
  frame: number
): Omit<CameraState, "scaleVelocityPerSecond"> => {
  const first = keyframes[0];
  const last = keyframes[keyframes.length - 1];

  if (frame <= first.frame || keyframes.length === 1) {
    return {
      scale: first.scale,
      x: first.x,
      y: first.y,
      focus: first.focus ? focusState(first.focus, 1) : null,
    };
  }
  if (frame >= last.frame) {
    return {
      scale: last.scale,
      x: last.x,
      y: last.y,
      focus: last.focus ? focusState(last.focus, 1) : null,
    };
  }

  let i = 0;
  while (keyframes[i + 1].frame < frame) {
    i++;
  }
  const from = keyframes[i];
  const to = keyframes[i + 1];
  const linear = (frame - from.frame) / (to.frame - from.frame);
  const t = masterEase(linear);

  return {
    scale: lerp(from.scale, to.scale, t),
    x: lerp(from.x, to.x, t),
    y: lerp(from.y, to.y, t),
    focus: interpolateFocus(from.focus, to.focus, t, linear),
  };
};

/** Pure camera state at an (optionally fractional) frame. */
export const cameraStateAt = (
  keyframes: readonly CameraKeyframe[],
  frame: number,
  fps: number
): CameraState => {
  validateTrack(keyframes);
  if (!Number.isFinite(fps) || fps <= 0) {
    throw new Error(`cameraStateAt(): fps must be a positive number, got ${fps}.`);
  }
  const pose = poseAt(keyframes, frame);
  // Central difference over one frame for a stable velocity estimate.
  const half = 0.5;
  const ahead = poseAt(keyframes, frame + half).scale;
  const behind = poseAt(keyframes, frame - half).scale;
  return {
    ...pose,
    scaleVelocityPerSecond: (ahead - behind) * fps,
  };
};

/** Convert a duration in milliseconds to (fractional) frames. */
export const msToFrames = (ms: number, fps: number): number => (ms / 1000) * fps;

// ─── hook ────────────────────────────────────────────────────────────────────

export const useCameraTrack = (
  keyframes: readonly CameraKeyframe[]
): CameraState => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return cameraStateAt(keyframes, frame, fps);
};
