/**
 * THROWAWAY proof-of-motion composition (Phase 1 gate, Bible §7/§8).
 *
 * Six seconds: a wide shot of three placeholder panels, a push into the
 * centre panel's monospace string, a hold, and a pull back out. Vignette and
 * blur active throughout the push; the world is split across the three
 * depth planes so the push reads as a dolly, not a zoom (outer panels ride
 * the foreground, a hairline grid recedes on the background).
 * Not part of the film.
 *
 * All copy comes from data/shipment.ts; all colour and type from design/.
 * Layout geometry (positions, sizes) is local — only values, colours and
 * fonts are governed.
 */

import type { CSSProperties } from "react";
import { AbsoluteFill } from "remotion";
import { Camera } from "../camera/Camera";
import { Depth, type WorldPoint } from "../camera/depth";
import {
  useCameraTrack,
  type CameraKeyframe,
  type FocusRect,
} from "../camera/useCameraTrack";
import { color, depth, radius, rgba } from "../design/tokens";
import { baseTextStyle, fontFamily, fontWeight, tracking } from "../design/type";
import { DOCUMENTS, INVOICE_TRAP } from "../data/shipment";

// ─── world layout (world space = 1920×1080 at scale 1) ───────────────────────

const PANEL = { width: 420, height: 520, top: 280 } as const;
const PANEL_LEFTS = [150, 750, 1350] as const;
const WORLD_CENTRE = { x: 960, y: 540 } as const;

/** Outer panels ride the foreground; the focus target stays mid. */
const PANEL_DEPTHS = [depth.foreground, depth.mid, depth.foreground] as const;

const panelAnchor = (left: number): WorldPoint => ({
  x: left + PANEL.width / 2,
  y: PANEL.top + PANEL.height / 2,
});

/** Focus hole: the containing CARD (the centre panel), not the line of text —
 * focus falls off from the card outward through the feather. */
const CARD_FOCUS: FocusRect = {
  x: PANEL_LEFTS[1],
  y: PANEL.top,
  width: PANEL.width,
  height: PANEL.height,
  depth: depth.mid,
};

/** The mono string's box, centred inside the focus card. */
const MONO_BOX = {
  x: PANEL_LEFTS[1],
  y: 478,
  width: PANEL.width,
  height: 124,
} as const;

// ─── camera track: wide hold → 600 ms push to 1.9 → hold → 600 ms pull ───────

const TRACK: readonly CameraKeyframe[] = [
  { frame: 0, scale: 1, x: WORLD_CENTRE.x, y: WORLD_CENTRE.y },
  { frame: 60, scale: 1, x: WORLD_CENTRE.x, y: WORLD_CENTRE.y },
  {
    frame: 96,
    scale: 1.9,
    x: WORLD_CENTRE.x,
    y: WORLD_CENTRE.y,
    focus: { rect: CARD_FOCUS },
  },
  {
    frame: 264,
    scale: 1.9,
    x: WORLD_CENTRE.x,
    y: WORLD_CENTRE.y,
    focus: { rect: CARD_FOCUS },
  },
  { frame: 300, scale: 1, x: WORLD_CENTRE.x, y: WORLD_CENTRE.y },
  { frame: 359, scale: 1, x: WORLD_CENTRE.x, y: WORLD_CENTRE.y },
];

// ─── planes ──────────────────────────────────────────────────────────────────

/** Hairline grid on the background plane — the far scenery the dolly
 * displaces more slowly than the panels. Overscanned past the viewport. */
const GRID = { step: 240, from: -480, toX: 2400, toY: 1560 } as const;

const gridSteps = (from: number, to: number): readonly number[] =>
  Array.from(
    { length: Math.floor((to - from) / GRID.step) + 1 },
    (_, i) => from + i * GRID.step
  );

const BackgroundGrid = () => (
  <Depth factor={depth.background}>
    {gridSteps(GRID.from, GRID.toX).map((x) => (
      <div
        key={`v${x}`}
        style={{
          position: "absolute",
          left: x,
          top: GRID.from,
          width: 1,
          height: GRID.toY - GRID.from,
          backgroundColor: color.rule,
        }}
      />
    ))}
    {gridSteps(GRID.from, GRID.toY).map((y) => (
      <div
        key={`h${y}`}
        style={{
          position: "absolute",
          left: GRID.from,
          top: y,
          width: GRID.toX - GRID.from,
          height: 1,
          backgroundColor: color.rule,
        }}
      />
    ))}
  </Depth>
);

/** Graphics plane: background grid + three placeholder panels on their
 * depth planes. Motion-blur eligible. */
const Panels = () => (
  <AbsoluteFill>
    <BackgroundGrid />
    {PANEL_LEFTS.map((left, i) => (
      <Depth key={left} factor={PANEL_DEPTHS[i]} anchor={panelAnchor(left)}>
        <div
          style={{
            position: "absolute",
            left,
            top: PANEL.top,
            width: PANEL.width,
            height: PANEL.height,
            borderRadius: radius.frame,
            border: `1px solid ${color.rule}`,
            backgroundColor: rgba(color.navy, 0.04),
          }}
        />
      </Depth>
    ))}
  </AbsoluteFill>
);

const labelStyle: CSSProperties = {
  ...baseTextStyle,
  position: "absolute",
  top: PANEL.top + 36,
  width: PANEL.width,
  textAlign: "center",
  fontFamily: fontFamily.ui,
  fontWeight: fontWeight.regular,
  fontSize: 20,
  letterSpacing: tracking.caps,
  textTransform: "uppercase",
  color: color.inkDim,
};

/** Text plane: panel labels ride their panel's depth; the centre mono string
 * stays mid with its card. Never motion-blurred. */
const Labels = () => (
  <AbsoluteFill>
    {PANEL_LEFTS.map((left, i) => (
      <Depth key={left} factor={PANEL_DEPTHS[i]} anchor={panelAnchor(left)}>
        <div style={{ ...labelStyle, left }}>{DOCUMENTS[i].typeLabel}</div>
      </Depth>
    ))}
    <div
      style={{
        ...baseTextStyle,
        position: "absolute",
        left: MONO_BOX.x,
        top: MONO_BOX.y,
        width: MONO_BOX.width,
        height: MONO_BOX.height,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: fontFamily.mono,
        fontWeight: fontWeight.regular,
        fontSize: 48,
        color: color.ink,
      }}
    >
      {INVOICE_TRAP.tally}
    </div>
  </AbsoluteFill>
);

// ─── composition ─────────────────────────────────────────────────────────────

export const ProofOfMotion = () => {
  const cam = useCameraTrack(TRACK);
  return (
    <Camera
      scale={cam.scale}
      x={cam.x}
      y={cam.y}
      focusRect={cam.focus?.rect ?? null}
      focusOpacity={cam.focus?.opacity}
      focusBlurPx={cam.focus?.blurPx}
      focusStrength={cam.focus?.strength}
      track={TRACK}
      textPlane={<Labels />}
    >
      <Panels />
    </Camera>
  );
};
