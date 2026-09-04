/**
 * The film — 2700 frames @ 60 fps, seven beats at the exact §5 frame ranges,
 * one persistent world under one camera. ALL timing lives here: this file
 * computes a WorldState per frame and drives the camera track; components
 * render frozen state.
 *
 * Choreography rules honoured (Bible §4, §5; Phases doc Part 2/3):
 * - every transition is a camera move over persistent content or an object
 *   travelling; no beat begins with a card fading in;
 * - reframes 450–700 ms on the master easing; slow micro-drifts between
 *   reframes so no beat outside 3 and 6 ever sits fully still;
 * - camera arrivals and state changes are offset 80–200 ms — the Beat 5
 *   pull lands a beat AFTER the matrix finishes filling;
 * - the vignette engages WITH each push (focus in the camera track);
 * - Beat 4 is the single expansion move; objects cross the corridor;
 * - the stat line ticks 52 → 54 on screen in Beat 5.
 */

import type { ReactNode } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { Camera } from "./camera/Camera";
import {
  masterEase,
  useCameraTrack,
  type CameraKeyframe,
} from "./camera/useCameraTrack";
import { color, depth, rgba, vignette } from "./design/tokens";
import { baseTextStyle, fontFamily, fontWeight } from "./design/type";
import {
  COPY,
  DISPLAY,
  DOCUMENT_COUNT,
  DOCUMENTS,
  FIELD_COUNT,
  FIELD_COUNT_AFTER_SUPPLIER_LOOP,
  RECONCILIATION_VERDICTS,
  UN38_3,
} from "./data/shipment";
import { clamp01, mix } from "./world/contract";
import * as L from "./world/layout";
import { World, type WorldState, type TravelPose } from "./world/World";
import type { DocumentCardChannels } from "./world/DocumentCard";
import type { MatrixRow } from "./world/ReadinessMatrix";
import { Caption } from "./chrome/Caption";
import { Cursor } from "./chrome/Cursor";

// ─── timing helpers ──────────────────────────────────────────────────────────

/** Linear 0..1 across [from, to]. */
const seg = (f: number, from: number, to: number): number =>
  clamp01((f - from) / (to - from));

/** Eased 0..1 across [from, to] on the master easing. */
const es = (f: number, from: number, to: number): number =>
  masterEase(seg(f, from, to));

/** In → hold → out envelope (eased both ways). */
const env = (
  f: number,
  in0: number,
  in1: number,
  out0: number,
  out1: number
): number => (f < out0 ? es(f, in0, in1) : 1 - es(f, out0, out1));

/** Frames per typed character (Bible §4.7: 12 ms/char at 60 fps). */
const TYPE_FRAMES_PER_CHAR = (12 / 1000) * 60;

// ─── the camera track (reframes 450–700 ms; §5 beat ranges) ──────────────────

const FOCUS_INTAKE = {
  rect: { x: L.INTAKE_COLUMN.x, y: L.INTAKE_COLUMN.y, width: L.INTAKE_COLUMN.width, height: L.INTAKE_COLUMN.height, depth: depth.mid },
} as const;
const FOCUS_RECON = {
  rect: { x: L.RECON_CLUSTER.x, y: L.RECON_CLUSTER.y, width: L.RECON_CLUSTER.width, height: L.RECON_CLUSTER.height, depth: depth.foreground },
} as const;
const FOCUS_RULE_ROW = {
  rect: { x: 100, y: 850, width: 1160, height: 290, depth: depth.mid },
} as const;
const FOCUS_SEAL = {
  rect: { x: L.SEAL_SURFACE.x, y: L.SEAL_SURFACE.y, width: L.SEAL_SURFACE.width, height: L.SEAL_SURFACE.height, depth: depth.mid },
} as const;

export const TRACK: readonly CameraKeyframe[] = [
  // Beat 0 — cold open, imperceptible drift-in.
  { frame: 0, scale: 0.98, x: 960, y: 540 },
  { frame: 240, scale: 1.0, x: 960, y: 540 },
  // Beat 1 — push onto the intake column, lateral track down the list.
  { frame: 276, scale: 1.18, x: 430, y: 380, focus: FOCUS_INTAKE },
  { frame: 312, scale: 1.18, x: 430, y: 390, focus: FOCUS_INTAKE },
  { frame: 660, scale: 1.18, x: 430, y: 750, focus: FOCUS_INTAKE },
  { frame: 780, scale: 1.185, x: 430, y: 752, focus: FOCUS_INTAKE },
  // Beat 2 — hard push onto the reconciliation cluster; slow creep in hold.
  { frame: 816, scale: 1.9, x: 1020, y: 560, focus: FOCUS_RECON },
  { frame: 1200, scale: 1.855, x: 1020, y: 562, focus: FOCUS_RECON },
  // Beat 3 — pull to rest, then push onto the UN 38.3 row + rule card.
  { frame: 1230, scale: 1.0, x: 960, y: 540 },
  { frame: 1242, scale: 1.0, x: 960, y: 540 },
  { frame: 1272, scale: 1.4, x: 620, y: 990, focus: FOCUS_RULE_ROW },
  { frame: 1440, scale: 1.42, x: 622, y: 992, focus: FOCUS_RULE_ROW },
  // Beat 4 — THE expansion move: pull and pan right across the corridor.
  { frame: 1482, scale: 0.81, x: 2400, y: 900 },
  { frame: 1878, scale: 0.815, x: 2396, y: 898 },
  // 4d — ease back left, following the returning document.
  { frame: 1920, scale: 0.8, x: 1200, y: 850 },
  { frame: 2040, scale: 0.8, x: 1200, y: 850 },
  // Beat 5 — the "all in view" pull; lands after the matrix finishes.
  // x 1118 keeps the stat line's leading digit inside the left frame edge.
  { frame: 2082, scale: 0.92, x: 1118, y: 660 },
  { frame: 2280, scale: 0.905, x: 1116, y: 662 },
  // Beat 6 — push onto the seal; slow lean-in through the ceremony.
  { frame: 2316, scale: 1.5, x: 1770, y: 380, focus: FOCUS_SEAL },
  { frame: 2520, scale: 1.52, x: 1772, y: 380, focus: FOCUS_SEAL },
  // Beat 7 — pull wide for the dual dispatch.
  { frame: 2562, scale: 0.78, x: 1300, y: 800 },
  { frame: 2699, scale: 0.78, x: 1300, y: 800 },
];

// ─── beat 1: intake card schedule (staggered 90 ms → 44-frame card period) ───

// First card lands 200 ms AFTER the push settles — never on the same frame.
const CARD_START = (i: number): number => 288 + i * 44;
const SWEEP_FRAMES = (380 / 1000) * 60; // §4.6 scan sweep duration
const SB_INDEX = 3; // DOCUMENTS[3] = shipping bill draft
const UN_INDEX = 6;

/** Second sweep on the UN 38.3 row when the returned PDF docks (4d). */
const UN_RESCAN = { from: 1932, to: 1932 + SWEEP_FRAMES } as const;

const intakeCardsAt = (f: number): readonly DocumentCardChannels[] => {
  const classified = DOCUMENTS.map((d, i) => {
    const s = CARD_START(i);
    const sweepEnd = s + SWEEP_FRAMES;
    const scanning = f >= s && f < sweepEnd;
    const landed = f >= sweepEnd;
    const flip = i === SB_INDEX ? env(f, 620, 650, 1104, 1124) : 0;
    return {
      filename: d.displayFilename,
      typeLabel: d.typeLabel,
      fieldNote: `${d.fields.length} fields`,
      authority: "signed" as const,
      state: !landed
        ? scanning
          ? ("scanning" as const)
          : ("pending" as const)
        : i === SB_INDEX && flip > 0.5
          ? ("blocked" as const)
          : ("classified" as const),
      scanProgress: seg(f, s, sweepEnd),
      revealProgress: es(f, s + 18, s + 30),
      flipProgress: flip,
    };
  });

  const us = CARD_START(UN_INDEX);
  const usEnd = us + SWEEP_FRAMES;
  const verified = f >= 1955;
  const un: DocumentCardChannels = {
    filename: UN38_3.displayFilename,
    typeLabel: UN38_3.typeLabel,
    fieldNote: verified ? `${UN38_3.fieldCount} fields` : COPY.unverifiedCount,
    authority: verified ? "signed" : "computed",
    state:
      f < us
        ? "pending"
        : f < usEnd
          ? "scanning"
          : verified
            ? "classified"
            : f >= UN_RESCAN.from && f < UN_RESCAN.to
              ? "scanning"
              : "unclear",
    scanProgress:
      f >= UN_RESCAN.from ? seg(f, UN_RESCAN.from, UN_RESCAN.to) : seg(f, us, usEnd),
    revealProgress: verified ? es(f, 1951, 1963) : es(f, us + 18, us + 30),
    flipProgress: 0,
  };

  return [...classified, un];
};

// ─── stat line ───────────────────────────────────────────────────────────────

const fieldsOnScreenAt = (f: number): number => {
  const landed = DOCUMENTS.reduce(
    (n, d, i) => n + d.fields.length * es(f, CARD_START(i) + 18, CARD_START(i) + 30),
    0
  );
  const tick =
    (FIELD_COUNT_AFTER_SUPPLIER_LOOP - FIELD_COUNT) * es(f, 2120, 2140);
  return Math.round(Math.min(landed, FIELD_COUNT) + tick);
};

const statAt = (f: number): Pick<WorldState, "statSegments" | "statEmphasis"> => {
  const docsSeg = `${DOCUMENT_COUNT} documents`;
  if (f < 300) {
    return { statSegments: [docsSeg] };
  }
  const fieldsSeg = `${fieldsOnScreenAt(f)} fields`;
  if (f < 2100) {
    return { statSegments: [docsSeg, fieldsSeg, COPY.statSuffix.intake] };
  }
  return {
    statSegments: [docsSeg, fieldsSeg, ...COPY.statSuffix.resolved],
    statEmphasis: { segment: 1, amount: env(f, 2118, 2132, 2138, 2166) },
  };
};

// ─── beat 4: request card + supplier + return travel ─────────────────────────

const REQUEST_VALUES_LENGTH =
  COPY.beat4.request.to.length +
  COPY.beat4.request.requested.length +
  COPY.beat4.request.requiredFor.length +
  COPY.beat4.request.scope.length;

// Cursor 1 begins 100 ms after typing completes (~f1633); response frame is
// start + travel 23f + hover 8f + press 7f.
const CURSOR_1_START = 1638;
const CURSOR_1_RESPONSE = 1676;
const CURSOR_2_START = 2328;
const CURSOR_2_RESPONSE = 2366;

const requestAt = (f: number): WorldState["request"] => {
  if (f < 1500) {
    return null;
  }
  const travel = es(f, 1706, 1762);
  const pose: TravelPose = {
    x: mix(L.REQUEST_CARD_BIRTH.x, L.REQUEST_CARD_DOCK.x, travel),
    y: mix(L.REQUEST_CARD_BIRTH.y, L.REQUEST_CARD_DOCK.y, travel),
    // Born 300 ms after the expansion pull lands; absorbed into the supplier
    // surface after docking, so the responder steps it triggers are visible.
    opacity: Math.min(es(f, 1500, 1518), 1 - es(f, 1768, 1792)),
  };
  const buttonState =
    f >= CURSOR_1_RESPONSE
      ? ("approved" as const)
      : f >= 1669
        ? ("pressed" as const)
        : f >= 1656
          ? ("active" as const)
          : ("idle" as const);
  return {
    pose,
    typedChars: Math.max(0, (f - 1524) / TYPE_FRAMES_PER_CHAR),
    buttonState,
    buttonEmphasis: f >= CURSOR_1_RESPONSE ? 1 - es(f, 1678, 1696) : es(f, 1656, 1668),
    chipProgress: es(f, 1678, 1698),
  };
};

const returnChipAt = (f: number): WorldState["returnChip"] => {
  if (f < 1860 || f > 1950) {
    return null;
  }
  const travel = es(f, 1872, 1932);
  return {
    x: mix(L.RETURN_CHIP_FROM.x, 180, travel),
    y: mix(L.RETURN_CHIP_FROM.y, 870, travel),
    opacity: Math.min(es(f, 1860, 1872), 1 - es(f, 1936, 1948)),
  };
};

// ─── beat 5: matrix rows (fixture verdicts; SB005 shown post-override) ───────

const l2r03Parts = DISPLAY.ruleCardL2R03.split(" · ");

const MATRIX_ROWS: readonly MatrixRow[] = [
  {
    ruleId: RECONCILIATION_VERDICTS[0].ruleId,
    label: RECONCILIATION_VERDICTS[0].sharedFact,
    state: "OPEN",
    note: COPY.statSuffix.resolved[0],
  },
  {
    ruleId: RECONCILIATION_VERDICTS[1].ruleId,
    label: RECONCILIATION_VERDICTS[1].sharedFact,
    state: RECONCILIATION_VERDICTS[1].state,
  },
  {
    ruleId: RECONCILIATION_VERDICTS[2].ruleId,
    label: RECONCILIATION_VERDICTS[2].sharedFact,
    state: RECONCILIATION_VERDICTS[2].state,
  },
  {
    ruleId: l2r03Parts[0],
    label: l2r03Parts[l2r03Parts.length - 1],
    state: "OPEN",
  },
];

// ─── beat 6/7: packets separate from the seal and exit to endpoints ──────────

const sealCentre = L.centreOf(L.SEAL_SURFACE);
const traySlot = (i: number): { x: number; y: number } => ({
  x: L.PACKET_TRAY.x + 270,
  y: L.PACKET_TRAY.y + 75 + i * 174,
});

const packetsAt = (f: number): WorldState["packets"] => {
  const arrive = [es(f, 2500, 2560), es(f, 2508, 2568)];
  const exit = [es(f, 2600, 2668), es(f, 2612, 2680)];
  const exitTo = [
    { x: -2600, y: 400 },
    { x: 1900, y: 240 },
  ];
  return {
    presence: es(f, 2492, 2516),
    offsets: [0, 1].map((i) => {
      const from = { x: sealCentre.x - traySlot(i).x, y: sealCentre.y - traySlot(i).y };
      return {
        x: mix(mix(from.x, 0, arrive[i]), exitTo[i].x, exit[i]),
        y: mix(mix(from.y, 0, arrive[i]), exitTo[i].y, exit[i]),
      };
    }),
    labelProgress: env(f, 2570, 2596, 2600 + 44, 2668),
  };
};

// ─── the per-frame world state ───────────────────────────────────────────────

const worldStateAt = (f: number, worldChrome: ReactNode): WorldState => ({
  intakeCards: intakeCardsAt(f),
  ...statAt(f),
  reconPresence: es(f, 596, 622),
  // The separators light vermilion for the catch and relax once the glyph
  // flips — vermilion never lingers past its moment (Bible §3).
  paneEmphasis: env(f, 828, 874, 1108, 1148),
  glyphFlip: es(f, 1084, 1104),
  sb005ChipProgress: es(f, 886, 906),
  correctionChars: f < 1044 ? 0 : (f - 1044) / TYPE_FRAMES_PER_CHAR,
  reviewerChipProgress: es(f, 1056, 1076),
  // The consequence line states the RISK; once the correction lands the risk
  // is averted, so the line retires with the resolution.
  consequenceProgress: env(f, 916, 952, 1052, 1096),
  ruleCard: {
    state: seg(f, 2006, 2026) >= 1 ? "OPEN" : "UNCLEAR",
    flip: es(f, 2006, 2026),
    missingOpacity: 1 - es(f, 1956, 1976),
    fieldProgress: [es(f, 1964, 1982), es(f, 1984, 2002)],
  },
  request: requestAt(f),
  supplierX: mix(L.SUPPLIER_ENTER_X, L.SUPPLIER_SURFACE.x, es(f, 1446, 1494)),
  supplier: {
    presence: 1,
    stepProgress: [es(f, 1776, 1794), es(f, 1806, 1824), es(f, 1842, 1860)],
    attachmentProgress: es(f, 1824, 1848),
  },
  returnChip: returnChipAt(f),
  matrix: {
    rows: MATRIX_ROWS,
    rowProgress: MATRIX_ROWS.map((_, i) => es(f, 2044 + 5 * i, 2064 + 5 * i)),
    aggregateProgress: es(f, 2094, 2124),
  },
  seal: {
    buttonState:
      f >= CURSOR_2_RESPONSE
        ? "sealed"
        : f >= 2359
          ? "pressed"
          : f >= 2344
            ? "active"
            : "idle",
    buttonEmphasis:
      f >= CURSOR_2_RESPONSE ? 1 - es(f, 2368, 2386) : es(f, 2344, 2356),
    stampProgress: es(f, CURSOR_2_RESPONSE, CURSOR_2_RESPONSE + 31),
    badgeProgress: [es(f, 2400, 2418), es(f, 2412, 2430)],
    hashProgress: seg(f, 2402, 2458),
    sealLineProgress: es(f, 2458, 2488),
  },
  packets: packetsAt(f),
  worldChrome,
});

// ─── screen-space chrome: captions and the end card ──────────────────────────

const CAPTION_POS = { left: 100, top: 906 } as const;

const captionAt = (f: number): { text: string; progress: number } | null => {
  if (f < 244) {
    return { text: COPY.captions.beat0, progress: env(f, 60, 96, 204, 244) };
  }
  if (f >= 640 && f < 792) {
    return { text: COPY.captions.beat1, progress: env(f, 640, 676, 756, 792) };
  }
  if (f >= 1240 && f < 1478) {
    return { text: COPY.captions.beat3, progress: env(f, 1240, 1276, 1442, 1478) };
  }
  if (f >= 2016 && f < 2140) {
    return { text: COPY.captions.beat4, progress: env(f, 2016, 2052, 2104, 2140) };
  }
  return null;
};

/** The end card — the one permitted dissolve besides the cold open. */
const EndCard = ({ opacity }: { readonly opacity: number }) =>
  opacity <= 0 ? null : (
    <AbsoluteFill
      style={{
        backgroundColor: color.navy,
        opacity,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          ...baseTextStyle,
          fontFamily: fontFamily.display,
          fontWeight: fontWeight.regular,
          fontSize: 112,
          color: color.cream,
        }}
      >
        {COPY.beat7.endCardTitle}
      </div>
      <div
        style={{
          width: 160,
          height: 2,
          margin: "28px 0",
          backgroundColor: color.vermilion,
        }}
      />
      <div
        style={{
          ...baseTextStyle,
          fontFamily: fontFamily.display,
          fontWeight: fontWeight.regular,
          fontSize: 30,
          color: rgba(color.cream, 0.75),
        }}
      >
        {COPY.beat7.endCardSub}
      </div>
    </AbsoluteFill>
  );

// ─── the film ────────────────────────────────────────────────────────────────

/** In-world cursor beats (rendered on the sharp text plane, world coords). */
const WorldCursors = () => (
  <>
    <Cursor
      startFrame={CURSOR_1_START}
      from={{ x: 2620, y: 1580 }}
      target={{ x: 1458, y: 1528 }}
      exitFrame={1724}
    />
    <Cursor
      startFrame={CURSOR_2_START}
      from={{ x: 1180, y: 900 }}
      target={{ x: 1770, y: 410 }}
      exitFrame={2440}
    />
  </>
);

export const Film = () => {
  const frame = useCurrentFrame();
  useVideoConfig(); // assert composition context early
  const cam = useCameraTrack(TRACK);
  const state = worldStateAt(frame, <WorldCursors />);
  const caption = captionAt(frame);
  const endCard = es(frame, 2632, 2676);

  return (
    <AbsoluteFill style={{ backgroundColor: color.cream }}>
      <Camera
        scale={cam.scale}
        x={cam.x}
        y={cam.y}
        focusRect={cam.focus?.rect ?? null}
        focusOpacity={cam.focus?.opacity ?? vignette.nonFocalOpacity}
        focusBlurPx={cam.focus?.blurPx ?? vignette.blurPx}
        focusStrength={cam.focus?.strength ?? 0}
        track={TRACK}
        textPlane={<World state={state} layer="text" />}
      >
        <World state={state} layer="graphics" />
      </Camera>
      {caption ? (
        <div style={{ position: "absolute", ...CAPTION_POS }}>
          <Caption text={caption.text} progress={caption.progress} />
        </div>
      ) : null}
      <EndCard opacity={endCard} />
    </AbsoluteFill>
  );
};
