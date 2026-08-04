/**
 * Resolve Still — Phase B review harness (contract.tsx StillStage) for
 * ReadinessMatrix, SealSurface and PacketTray in isolation. Assembles rows
 * and props exactly from data/shipment.ts exports; nothing on screen is
 * invented (Bible §2).
 *
 * Layout is still-only staging (scale + grid position to fit several
 * instances on one 1920×1080 canvas for review) — it carries no product
 * meaning and is not part of Film.tsx.
 */

import type { CSSProperties, ReactNode } from "react";
import { placeAt, SIZES, StillStage } from "../world/contract";
import { ReadinessMatrix, type MatrixRow } from "../world/ReadinessMatrix";
import { SealSurface, type SealSurfaceProps } from "../world/SealSurface";
import { PacketTray } from "../world/PacketTray";
import { color, radius, rgba } from "../design/tokens";
import { baseTextStyle, fontFamily, fontWeight, tracking } from "../design/type";
import { COPY, DISPLAY, RECONCILIATION_VERDICTS } from "../data/shipment";

// ─── rows assembled exactly from shipment exports (Bible §2 — do not invent) ─

const l2r03Parts = DISPLAY.ruleCardL2R03.split(" · ");

const ROWS: readonly MatrixRow[] = [
  {
    ruleId: RECONCILIATION_VERDICTS[0].ruleId,
    label: RECONCILIATION_VERDICTS[0].sharedFact,
    // Post-override state at Beat 5 (Bible §5 Beat 2 resolves this to green
    // before the readiness cascade runs) — not the raw pre-override verdict.
    state: "OPEN",
    note: COPY.beat5.overrideLog,
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
    label: l2r03Parts.slice(1).join(" · "),
    // Bible §5 Beat 4d: "The L2-R03 card flips UNCLEAR → OPEN" once the
    // supplier loop closes, which precedes Beat 5.
    state: "OPEN",
  },
];

const ROW_PROGRESS = [1, 1, 0.55, 0.15];

// ─── seal surface instances ───────────────────────────────────────────────────

const sealBase = {
  buttonLabel: COPY.beat6.sealButton,
  hashText: DISPLAY.sealHash,
  sealLine: COPY.beat6.sealLine,
} as const;

const SEAL_INSTANCES: readonly (Omit<SealSurfaceProps, "layer"> & { readonly caption: string })[] = [
  {
    ...sealBase,
    caption: "SealSurface · idle",
    buttonState: "idle",
    buttonEmphasis: 0,
    stampProgress: 0,
    badgeProgress: [0, 0],
    hashProgress: 0,
    sealLineProgress: 0,
  },
  {
    ...sealBase,
    caption: "SealSurface · active (cursor target)",
    buttonState: "active",
    buttonEmphasis: 1,
    stampProgress: 0,
    badgeProgress: [0, 0],
    hashProgress: 0,
    sealLineProgress: 0,
  },
  {
    ...sealBase,
    caption: "SealSurface · stamp mid-overshoot",
    buttonState: "pressed",
    buttonEmphasis: 1,
    stampProgress: 0.55,
    badgeProgress: [0.6, 0.4],
    hashProgress: 0.5,
    sealLineProgress: 0.2,
  },
  {
    ...sealBase,
    caption: "SealSurface · sealed",
    buttonState: "sealed",
    buttonEmphasis: 0,
    stampProgress: 1,
    badgeProgress: [1, 1],
    hashProgress: 1,
    sealLineProgress: 1,
  },
];

// ─── packet tray instances ────────────────────────────────────────────────────

const PACKET_TRAY_TOGETHER = {
  packets: COPY.beat7.packets,
  presence: 1,
  offsets: [
    { x: 0, y: 0 },
    { x: 0, y: 0 },
  ],
  labelProgress: 1,
} as const;

const PACKET_TRAY_SEPARATED = {
  packets: COPY.beat7.packets,
  presence: 1,
  offsets: [
    { x: -60, y: -20 },
    { x: 60, y: 20 },
  ],
  labelProgress: 1,
} as const;

// ─── still-only staging helpers ───────────────────────────────────────────────

const captionStyle: CSSProperties = {
  ...baseTextStyle,
  position: "absolute",
  fontFamily: fontFamily.ui,
  fontWeight: fontWeight.regular,
  fontSize: 13,
  letterSpacing: tracking.wide,
  textTransform: "uppercase",
  color: color.inkDim,
};

/** Scales a component's own box down for grid placement, then stacks its
 * graphics and text renders inside — per StillStage's review convention. */
const ScaledInstance = ({
  x,
  y,
  scale,
  boxWidth,
  boxHeight,
  caption,
  children,
}: {
  readonly x: number;
  readonly y: number;
  readonly scale: number;
  readonly boxWidth: number;
  readonly boxHeight: number;
  readonly caption: string;
  readonly children: ReactNode;
}) => (
  <>
    <div style={{ ...captionStyle, left: x, top: y - 24 }}>{caption}</div>
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: boxWidth,
        height: boxHeight,
        borderRadius: radius.frame,
        backgroundColor: rgba(color.navy, 0.015),
      }}
    >
      <div
        style={{
          ...placeAt(0, 0, { width: boxWidth / scale, height: boxHeight / scale }),
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        {children}
      </div>
    </div>
  </>
);

const SCALE = 0.5;

// ─── still ────────────────────────────────────────────────────────────────────

export const ResolveStill = () => (
  <StillStage width={1920} height={1080}>
    <ScaledInstance
      x={30}
      y={56}
      scale={SCALE}
      boxWidth={SIZES.readinessMatrix.width * SCALE}
      boxHeight={SIZES.readinessMatrix.height * SCALE}
      caption="ReadinessMatrix · mid-cascade, aggregate revealed"
    >
      <ReadinessMatrix
        layer="graphics"
        rows={ROWS}
        rowProgress={ROW_PROGRESS}
        aggregate={COPY.beat5.aggregate}
        defensibility={COPY.beat5.defensibility}
        overrideLog={COPY.beat5.overrideLog}
        aggregateProgress={1}
      />
      <ReadinessMatrix
        layer="text"
        rows={ROWS}
        rowProgress={ROW_PROGRESS}
        aggregate={COPY.beat5.aggregate}
        defensibility={COPY.beat5.defensibility}
        overrideLog={COPY.beat5.overrideLog}
        aggregateProgress={1}
      />
    </ScaledInstance>

    {SEAL_INSTANCES.map((instance, i) => (
      <ScaledInstance
        key={instance.caption}
        x={500 + i * 340}
        y={56}
        scale={SCALE}
        boxWidth={SIZES.sealSurface.width * SCALE}
        boxHeight={SIZES.sealSurface.height * SCALE}
        caption={instance.caption}
      >
        <SealSurface layer="graphics" {...instance} />
        <SealSurface layer="text" {...instance} />
      </ScaledInstance>
    ))}

    <ScaledInstance
      x={30}
      y={366}
      scale={SCALE}
      boxWidth={SIZES.packetCard.width * SCALE}
      boxHeight={(SIZES.packetCard.height * 2 + 24) * SCALE}
      caption="PacketTray · together, presence 1"
    >
      <PacketTray layer="graphics" {...PACKET_TRAY_TOGETHER} />
      <PacketTray layer="text" {...PACKET_TRAY_TOGETHER} />
    </ScaledInstance>

    <ScaledInstance
      x={340}
      y={366}
      scale={SCALE}
      boxWidth={SIZES.packetCard.width * SCALE}
      boxHeight={(SIZES.packetCard.height * 2 + 24) * SCALE}
      caption="PacketTray · mid-separation"
    >
      <PacketTray layer="graphics" {...PACKET_TRAY_SEPARATED} />
      <PacketTray layer="text" {...PACKET_TRAY_SEPARATED} />
    </ScaledInstance>
  </StillStage>
);
