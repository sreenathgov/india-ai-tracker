/**
 * IntakeStill — Phase B review harness for the intake world (Bible §5 Beat 1).
 *
 * Stacks the graphics and text renders of every component in this batch at
 * registered absolute boxes on a single StillStage, so the pixel-registration
 * between planes and the on-screen copy can be checked in isolation, before
 * Film.tsx assembles the real camera-driven world.
 *
 * Small ink-dim variant labels below each item are review-harness only —
 * they never appear in the film itself.
 */

import type { CSSProperties, ReactNode } from "react";
import { AuthorityMark, type AuthorityKind } from "../chrome/AuthorityMark";
import { StatLine } from "../chrome/StatLine";
import { ScanSweep } from "../world/ScanSweep";
import { DocumentCard, type DocumentCardChannels, type DocumentCardState } from "../world/DocumentCard";
import { IntakeColumn } from "../world/IntakeColumn";
import { SIZES, StillStage } from "../world/contract";
import { color, radius, rgba } from "../design/tokens";
import { baseTextStyle, fontFamily, fontWeight, tracking } from "../design/type";
import { COPY, DOCUMENTS, DOCUMENT_COUNT, FIELD_COUNT, UN38_3 } from "../data/shipment";

const STAGE = { width: 1920, height: 1080 } as const;

// ─── review-harness label (stills only — never in the film) ──────────────────

const labelStyle: CSSProperties = {
  ...baseTextStyle,
  position: "absolute",
  fontFamily: fontFamily.ui,
  fontWeight: fontWeight.regular,
  fontSize: 13,
  letterSpacing: tracking.wide,
  color: color.inkDim,
};

const Label = ({ x, y, children }: { x: number; y: number; children: ReactNode }) => (
  <div style={{ ...labelStyle, left: x, top: y }}>{children}</div>
);

/** Stacks a graphics render and a text render at the same box, registering
 * the two planes exactly the way the camera does in the real film. */
const LayeredBox = ({ x, y, graphics, text }: { x: number; y: number; graphics: ReactNode; text: ReactNode }) => (
  <>
    <div style={{ position: "absolute", left: x, top: y }}>{graphics}</div>
    <div style={{ position: "absolute", left: x, top: y }}>{text}</div>
  </>
);

// ─── data assembled exactly as Film.tsx will (Bible §5, §6) ──────────────────

const documentChannels = (
  doc: (typeof DOCUMENTS)[number],
  overrides: Partial<DocumentCardChannels>
): DocumentCardChannels => ({
  filename: doc.displayFilename,
  typeLabel: doc.typeLabel,
  fieldNote: `${doc.fields.length} fields`,
  authority: "signed",
  state: "pending",
  scanProgress: 0,
  revealProgress: 0,
  flipProgress: 0,
  ...overrides,
});

const un38_3Channels: DocumentCardChannels = {
  filename: UN38_3.displayFilename,
  typeLabel: UN38_3.typeLabel,
  fieldNote: COPY.unverifiedCount,
  authority: "computed",
  state: "unclear",
  scanProgress: 1,
  revealProgress: 1,
  flipProgress: 0,
};

/** The full seven-row intake column, mid-Beat-1: three landed classified,
 * the Shipping Bill card mid green→BLOCKED flip, one mid-scan, one still
 * pending, and the UN 38.3 row unclear. Order matches Bible §5 Beat 1. */
const mainCards: readonly DocumentCardChannels[] = [
  documentChannels(DOCUMENTS[0], { state: "classified", scanProgress: 1, revealProgress: 1 }),
  documentChannels(DOCUMENTS[1], { state: "classified", scanProgress: 1, revealProgress: 1 }),
  documentChannels(DOCUMENTS[2], { state: "classified", scanProgress: 1, revealProgress: 1 }),
  documentChannels(DOCUMENTS[3], { state: "blocked", scanProgress: 1, revealProgress: 1, flipProgress: 0.5 }),
  documentChannels(DOCUMENTS[4], { state: "scanning", scanProgress: 0.5, revealProgress: 0 }),
  documentChannels(DOCUMENTS[5], { state: "pending", scanProgress: 0, revealProgress: 0 }),
  un38_3Channels,
];

/** One isolated card per state, for reviewing each visual mode in the clear. */
const isolatedCards: readonly { state: DocumentCardState; note: string; channels: DocumentCardChannels }[] = [
  {
    state: "pending",
    note: "pending",
    channels: documentChannels(DOCUMENTS[0], { state: "pending" }),
  },
  {
    state: "scanning",
    note: "scanning · scan 0.5",
    channels: documentChannels(DOCUMENTS[1], { state: "scanning", scanProgress: 0.5, revealProgress: 0 }),
  },
  {
    state: "classified",
    note: "classified",
    channels: documentChannels(DOCUMENTS[2], { state: "classified", scanProgress: 1, revealProgress: 1 }),
  },
  {
    state: "blocked",
    note: "blocked · flip 0.5",
    channels: documentChannels(DOCUMENTS[3], {
      state: "blocked",
      scanProgress: 1,
      revealProgress: 1,
      flipProgress: 0.5,
    }),
  },
  {
    state: "unclear",
    note: "unclear",
    channels: un38_3Channels,
  },
];

const authorityKinds: readonly AuthorityKind[] = ["signed", "qualified", "computed"];

const statSegments: readonly string[] = [
  `${DOCUMENT_COUNT} documents`,
  `${FIELD_COUNT} fields`,
  COPY.statSuffix.intake,
];

// ─── layout ────────────────────────────────────────────────────────────────

const INTAKE_POS = { x: 60, y: 70 } as const;
const ISOLATED_POS = { x: 640, y: 70 } as const;
const ISOLATED_GAP = 16;
const SWEEP_POS = { x: 640, y: 640 } as const;
const SWEEP_BOX = { width: 460, height: 60 } as const;
const AUTHORITY_POS = { x: 640, y: 780 } as const;
const AUTHORITY_GAP = 120;
const STAT_POS = { x: 60, y: 940 } as const;

export const IntakeStill = () => (
  <StillStage width={STAGE.width} height={STAGE.height}>
    <Label x={INTAKE_POS.x} y={INTAKE_POS.y - 24}>
      IntakeColumn · mid-Beat-1
    </Label>
    <LayeredBox
      x={INTAKE_POS.x}
      y={INTAKE_POS.y}
      graphics={<IntakeColumn layer="graphics" cards={mainCards} />}
      text={<IntakeColumn layer="text" cards={mainCards} />}
    />

    <Label x={ISOLATED_POS.x} y={ISOLATED_POS.y - 24}>
      DocumentCard · one per state
    </Label>
    {isolatedCards.map((item, i) => {
      const y = ISOLATED_POS.y + i * (SIZES.documentCard.height + ISOLATED_GAP);
      return (
        <div key={item.state}>
          <Label x={ISOLATED_POS.x + SIZES.documentCard.width + 12} y={y + SIZES.documentCard.height / 2 - 8}>
            {item.note}
          </Label>
          <LayeredBox
            x={ISOLATED_POS.x}
            y={y}
            graphics={<DocumentCard layer="graphics" {...item.channels} />}
            text={<DocumentCard layer="text" {...item.channels} />}
          />
        </div>
      );
    })}

    <Label x={SWEEP_POS.x} y={SWEEP_POS.y - 24}>
      ScanSweep · progress 0.5
    </Label>
    <div
      style={{
        position: "absolute",
        left: SWEEP_POS.x,
        top: SWEEP_POS.y,
        width: SWEEP_BOX.width,
        height: SWEEP_BOX.height,
        borderRadius: radius.card,
        border: `1px solid ${color.rule}`,
        backgroundColor: rgba(color.navy, 0.04),
        overflow: "hidden",
      }}
    >
      <ScanSweep progress={0.5} width={SWEEP_BOX.width} height={SWEEP_BOX.height} />
    </div>

    <Label x={AUTHORITY_POS.x} y={AUTHORITY_POS.y - 24}>
      AuthorityMark · signed · qualified · computed
    </Label>
    <div
      style={{
        position: "absolute",
        left: AUTHORITY_POS.x,
        top: AUTHORITY_POS.y,
        display: "flex",
        alignItems: "center",
      }}
    >
      {authorityKinds.map((kind, i) => (
        <div
          key={kind}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginLeft: i === 0 ? 0 : AUTHORITY_GAP,
          }}
        >
          <AuthorityMark kind={kind} size={20} />
          <span style={{ ...labelStyle, position: "static" }}>{kind}</span>
        </div>
      ))}
    </div>

    <Label x={STAT_POS.x} y={STAT_POS.y - 24}>
      StatLine · Beat 1 · emphasis on fields
    </Label>
    <LayeredBox
      x={STAT_POS.x}
      y={STAT_POS.y}
      graphics={<StatLine layer="graphics" segments={statSegments} emphasis={{ segment: 1, amount: 1 }} />}
      text={<StatLine layer="text" segments={statSegments} emphasis={{ segment: 1, amount: 1 }} />}
    />
  </StillStage>
);
