/**
 * DocumentCard — one row of the intake column (Bible §5 Beat 1).
 *
 * Renders into its canonical SIZES.documentCard box at origin (0,0). Owns no
 * timing: every visual is a linear function of the channel props Film.tsx
 * computes per frame.
 */

import type { CSSProperties } from "react";
import { AuthorityMark, type AuthorityKind } from "../chrome/AuthorityMark";
import { ScanSweep } from "./ScanSweep";
import { SIZES, clamp01, mix, type LayerProps } from "./contract";
import { color, depth, radius, rgba, stateColor } from "../design/tokens";
import { baseTextStyle, fontFamily, fontWeight, tracking } from "../design/type";

// ─── channels ────────────────────────────────────────────────────────────────

export type DocumentCardState = "pending" | "scanning" | "classified" | "blocked" | "unclear";

export interface DocumentCardChannels {
  readonly filename: string;
  readonly typeLabel: string;
  /** Pre-assembled upstream, e.g. "13 fields" or "0 verified". */
  readonly fieldNote: string;
  readonly authority: AuthorityKind;
  readonly state: DocumentCardState;
  /** 0..1 sweep progress. */
  readonly scanProgress: number;
  /** 0..1 chip + field note + authority mark snap-in. */
  readonly revealProgress: number;
  /** 0..1 classified(green)→BLOCKED(crimson) flip; 0 for all but the SB card. */
  readonly flipProgress: number;
}

export interface DocumentCardProps extends DocumentCardChannels, LayerProps {}

export const DOCUMENT_CARD_DEPTH = depth.mid;

// ─── local geometry (presentational only — no governed values here) ──────────

const BOX = SIZES.documentCard;
const BAR_WIDTH = 3;
const BAR_INSET_Y = 8;
const CONTENT_LEFT = 34;
const RIGHT_PAD = 20;
const FILENAME_TOP = 18;
const FILENAME_FONT_SIZE = 15;
const ROW2_TOP = 56;
const CHIP_HEIGHT = 22;
const CHIP_FONT_SIZE = 12;
const CHIP_PAD_X = 10;
/** Deterministic width estimate for uppercase, tracked Telegraf at 12px — no
 * DOM text measurement, so graphics (chip pill) and text (chip label) share
 * identical box math on both planes (contract.tsx rule 2). */
const CHIP_CHAR_WIDTH = 8.6;
const FIELD_NOTE_FONT_SIZE = 13;
const REVEAL_RISE_PX = 4;

const chipWidth = (label: string): number =>
  Math.round(label.length * CHIP_CHAR_WIDTH + CHIP_PAD_X * 2);

/** Local colour interpolation — mixes two already-imported 6-digit hex
 * tokens. Introduces no new colour values; used only for the state-bar's
 * classified→BLOCKED crossfade. */
const mixHex = (a: string, b: string, t: number): string => {
  const pa = /^#([0-9a-f]{6})$/i.exec(a);
  const pb = /^#([0-9a-f]{6})$/i.exec(b);
  if (!pa || !pb) {
    throw new Error(`DocumentCard: expected 6-digit hex colours, got "${a}" / "${b}"`);
  }
  const na = parseInt(pa[1], 16);
  const nb = parseInt(pb[1], 16);
  const channel = (shift: number) =>
    Math.round(mix((na >> shift) & 0xff, (nb >> shift) & 0xff, t));
  return `rgb(${channel(16)}, ${channel(8)}, ${channel(0)})`;
};

const stateBarColor = (state: DocumentCardState, flipProgress: number): string => {
  switch (state) {
    case "classified":
      return stateColor.OPEN;
    case "blocked":
      return mixHex(stateColor.OPEN, stateColor.BLOCKED, clamp01(flipProgress));
    case "unclear":
      return stateColor.UNCLEAR;
    default:
      return "transparent";
  }
};

// ─── component ───────────────────────────────────────────────────────────────

export const DocumentCard = ({
  layer,
  filename,
  typeLabel,
  fieldNote,
  authority,
  state,
  scanProgress,
  revealProgress,
  flipProgress,
}: DocumentCardProps) => {
  const reveal = clamp01(revealProgress);
  const revealStyle: CSSProperties = {
    opacity: reveal,
    transform: `translateY(${mix(REVEAL_RISE_PX, 0, reveal)}px)`,
  };
  const cWidth = chipWidth(typeLabel);
  const dim = state === "pending" || state === "scanning";

  if (layer === "graphics") {
    return (
      <div style={{ position: "relative", width: BOX.width, height: BOX.height }}>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: BOX.width,
            height: BOX.height,
            borderRadius: radius.card,
            border: `1px solid ${color.rule}`,
            backgroundColor: rgba(color.navy, 0.04),
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 8,
            top: BAR_INSET_Y,
            width: BAR_WIDTH,
            height: BOX.height - BAR_INSET_Y * 2,
            borderRadius: radius.stamp,
            backgroundColor: stateBarColor(state, flipProgress),
          }}
        />
        {state === "scanning" && (
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: BOX.width,
              height: BOX.height,
              borderRadius: radius.card,
              overflow: "hidden",
            }}
          >
            <ScanSweep progress={scanProgress} width={BOX.width} height={BOX.height} />
          </div>
        )}
        <div
          style={{
            position: "absolute",
            left: CONTENT_LEFT,
            top: ROW2_TOP,
            width: cWidth,
            height: CHIP_HEIGHT,
            borderRadius: radius.pill,
            backgroundColor: rgba(color.navy, 0.06),
            ...revealStyle,
          }}
        />
      </div>
    );
  }

  // layer === "text"
  return (
    <div style={{ position: "relative", width: BOX.width, height: BOX.height }}>
      <div
        style={{
          ...baseTextStyle,
          position: "absolute",
          left: CONTENT_LEFT,
          top: FILENAME_TOP,
          width: BOX.width - CONTENT_LEFT - RIGHT_PAD,
          fontFamily: fontFamily.mono,
          fontWeight: fontWeight.regular,
          fontSize: FILENAME_FONT_SIZE,
          color: dim ? color.inkDim : color.ink,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {filename}
      </div>
      <div
        style={{
          ...baseTextStyle,
          position: "absolute",
          left: CONTENT_LEFT,
          top: ROW2_TOP,
          width: cWidth,
          height: CHIP_HEIGHT,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: fontFamily.ui,
          fontWeight: fontWeight.regular,
          fontSize: CHIP_FONT_SIZE,
          letterSpacing: tracking.caps,
          textTransform: "uppercase",
          color: color.ink,
          ...revealStyle,
        }}
      >
        {typeLabel}
      </div>
      <div
        style={{
          position: "absolute",
          right: RIGHT_PAD,
          top: ROW2_TOP,
          height: CHIP_HEIGHT,
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: 6,
          ...revealStyle,
        }}
      >
        <AuthorityMark kind={authority} size={12} />
        <span
          style={{
            ...baseTextStyle,
            fontFamily: fontFamily.mono,
            fontWeight: fontWeight.regular,
            fontSize: FIELD_NOTE_FONT_SIZE,
            color: color.inkDim,
            whiteSpace: "nowrap",
          }}
        >
          {fieldNote}
        </span>
      </div>
    </div>
  );
};
