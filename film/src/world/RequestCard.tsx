/**
 * RequestCard — Beat 4a/4b/4d (Bible §5 Beat 4): Nax's typed request to the
 * cell supplier, the "Approve and send" button (Human Beat 1's active cursor
 * target), and the approved-state chip. See world/contract.tsx for the
 * two-plane / position-agnostic component rules this file follows.
 */

import type { CSSProperties } from "react";
import { type LayerProps, SIZES, clamp01, mix } from "./contract";
import { color, depth, radius, rgba, stateColor } from "../design/tokens";
import { baseTextStyle, fontFamily, fontWeight, tracking } from "../design/type";

// ─── props ───────────────────────────────────────────────────────────────────

export interface RequestLine {
  readonly label: string;
  readonly value: string;
}

export type RequestButtonState = "idle" | "active" | "pressed" | "approved";

export interface RequestCardProps extends LayerProps {
  readonly lines: readonly RequestLine[];
  readonly typedChars: number;
  readonly buttonLabel: string;
  readonly buttonState: RequestButtonState;
  readonly buttonEmphasis: number;
  readonly approvedChip: string;
  readonly approvedChipProgress: number;
}

export const REQUEST_CARD_DEPTH = depth.foreground;

// ─── local geometry (world units inside the component's own box) ────────────

const BOX = SIZES.requestCard;
const PAD = 28;
const LABEL_COL_WIDTH = 130;
const VALUE_COL_X = PAD + LABEL_COL_WIDTH;
const VALUE_COL_WIDTH = BOX.width - PAD - VALUE_COL_X;
const ROW_HEIGHT = 54;
const ROW_GAP = 12;
const ROWS_TOP = PAD;
const BUTTON_TOP = 306;
const BUTTON_HEIGHT = 44;
const BUTTON_WIDTH = 220;
const CHIP_LEFT = PAD + BUTTON_WIDTH + 16;
const CHIP_WIDTH = BOX.width - PAD - CHIP_LEFT;
const CHIP_SLIDE_PX = 24;

const rowTop = (i: number): number => ROWS_TOP + i * (ROW_HEIGHT + ROW_GAP);

// ─── colour mixing (endpoints are token colours only — Bible §3) ─────────────

/** Parses a "#rrggbb" hex or "rgba(r,g,b[,a])" string into components. */
const parseColor = (input: string): { r: number; g: number; b: number; a: number } => {
  const hex = /^#([0-9a-f]{6})$/i.exec(input);
  if (hex) {
    const n = parseInt(hex[1], 16);
    return { r: (n >> 16) & 0xff, g: (n >> 8) & 0xff, b: n & 0xff, a: 1 };
  }
  const parts = /rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/.exec(input);
  if (parts) {
    return {
      r: Number(parts[1]),
      g: Number(parts[2]),
      b: Number(parts[3]),
      a: parts[4] !== undefined ? Number(parts[4]) : 1,
    };
  }
  throw new Error(`RequestCard: cannot parse colour token "${input}".`);
};

/** Linear rgb+alpha mix between two token colours by t (0..1). */
const mixColor = (from: string, to: string, t: number): string => {
  const a = parseColor(from);
  const b = parseColor(to);
  return `rgba(${mix(a.r, b.r, t)}, ${mix(a.g, b.g, t)}, ${mix(a.b, b.b, t)}, ${mix(a.a, b.a, t)})`;
};

// ─── typed-reveal math (shared by both layers, pure of props) ───────────────

interface TypedRow {
  readonly label: string;
  readonly shownValue: string;
  readonly caretHere: boolean;
}

const clampRange = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

/**
 * Reveals the four values sequentially: row i only receives characters once
 * every prior row's value has been fully typed. The caret sits after the
 * most recently typed character — the last row with any characters shown —
 * except when nothing at all has been typed yet, where it sits at the start
 * of row 0.
 */
const computeTypedRows = (
  lines: readonly RequestLine[],
  typedChars: number
): readonly TypedRow[] => {
  const floor = Math.floor(typedChars);
  const totalLen = lines.reduce((n, l) => n + l.value.length, 0);
  const shownCounts = lines.map((line, i) => {
    const offsetBefore = lines.slice(0, i).reduce((n, l) => n + l.value.length, 0);
    return clampRange(floor - offsetBefore, 0, line.value.length);
  });
  const lastNonZeroIndex = shownCounts.reduce((acc, c, i) => (c > 0 ? i : acc), -1);
  const caretRowIndex = floor >= totalLen ? -1 : floor === 0 ? 0 : lastNonZeroIndex;
  return lines.map((line, i) => ({
    label: line.label,
    shownValue: line.value.slice(0, shownCounts[i]),
    caretHere: i === caretRowIndex,
  }));
};

// ─── component ────────────────────────────────────────────────────────────────

export const RequestCard = ({
  layer,
  lines,
  typedChars,
  buttonLabel,
  buttonState,
  buttonEmphasis,
  approvedChip,
  approvedChipProgress,
}: RequestCardProps) => {
  if (lines.length === 0) {
    throw new Error("RequestCard: lines must be non-empty.");
  }
  if (!Number.isFinite(typedChars) || typedChars < 0) {
    throw new Error(`RequestCard: typedChars must be a finite number >= 0, got ${typedChars}.`);
  }

  const emphasis = clamp01(buttonEmphasis);
  const chipProgress = clamp01(approvedChipProgress);
  const rows = computeTypedRows(lines, typedChars);

  const isApproved = buttonState === "approved";
  const isPressed = buttonState === "pressed";
  const buttonTransform = isPressed ? "scale(0.97)" : "scale(1)";
  const buttonOpacity = isApproved ? 0.4 : 1;

  const rootStyle: CSSProperties = { position: "absolute", left: 0, top: 0, width: BOX.width, height: BOX.height };

  if (layer === "graphics") {
    const buttonFill = mixColor(rgba(color.navy, 0.04), rgba(color.vermilion, 0.08), emphasis);
    const buttonBorder = mixColor(color.rule, color.vermilion, emphasis);
    return (
      <div style={rootStyle}>
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
            left: PAD,
            top: BUTTON_TOP,
            width: BUTTON_WIDTH,
            height: BUTTON_HEIGHT,
            borderRadius: radius.pill,
            border: `1px solid ${buttonBorder}`,
            backgroundColor: buttonFill,
            transform: buttonTransform,
            transformOrigin: "50% 50%",
            opacity: buttonOpacity,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: mix(CHIP_LEFT + CHIP_SLIDE_PX, CHIP_LEFT, chipProgress),
            top: BUTTON_TOP,
            width: CHIP_WIDTH,
            height: BUTTON_HEIGHT,
            borderRadius: radius.pill,
            backgroundColor: rgba(stateColor.OPEN, 0.12),
            opacity: chipProgress,
          }}
        />
      </div>
    );
  }

  // layer === "text"
  const labelStyle: CSSProperties = {
    ...baseTextStyle,
    position: "absolute",
    left: PAD,
    width: LABEL_COL_WIDTH,
    fontFamily: fontFamily.ui,
    fontWeight: fontWeight.regular,
    fontSize: 12,
    letterSpacing: tracking.caps,
    textTransform: "uppercase",
    color: color.inkDim,
  };

  const valueWrapStyle: CSSProperties = {
    position: "absolute",
    left: VALUE_COL_X,
    width: VALUE_COL_WIDTH,
    fontFamily: fontFamily.mono,
    fontWeight: fontWeight.regular,
    fontSize: 15,
    lineHeight: 1.35,
    color: color.ink,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  };

  const buttonLabelColor = mixColor(color.ink, color.vermilion, emphasis);

  return (
    <div style={rootStyle}>
      {rows.map((row, i) => (
        <div key={row.label}>
          <div style={{ ...labelStyle, top: rowTop(i) }}>{row.label}</div>
          <div style={{ ...baseTextStyle, ...valueWrapStyle, top: rowTop(i) }}>
            {row.shownValue}
            {row.caretHere ? (
              <span
                style={{
                  display: "inline-block",
                  width: 2,
                  height: "1em",
                  marginLeft: 1,
                  verticalAlign: "text-bottom",
                  backgroundColor: color.ink,
                }}
              />
            ) : null}
          </div>
        </div>
      ))}
      <div
        style={{
          ...baseTextStyle,
          position: "absolute",
          left: PAD,
          top: BUTTON_TOP,
          width: BUTTON_WIDTH,
          height: BUTTON_HEIGHT,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: fontFamily.ui,
          fontWeight: fontWeight.regular,
          fontSize: 14,
          color: buttonLabelColor,
          transform: buttonTransform,
          transformOrigin: "50% 50%",
          opacity: buttonOpacity,
        }}
      >
        {buttonLabel}
      </div>
      <div
        style={{
          ...baseTextStyle,
          position: "absolute",
          left: mix(CHIP_LEFT + CHIP_SLIDE_PX, CHIP_LEFT, chipProgress),
          top: BUTTON_TOP,
          width: CHIP_WIDTH,
          height: BUTTON_HEIGHT,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: fontFamily.ui,
          fontWeight: fontWeight.regular,
          fontSize: 12,
          letterSpacing: tracking.caps,
          textTransform: "uppercase",
          color: stateColor.OPEN,
          opacity: chipProgress,
        }}
      >
        {approvedChip}
      </div>
    </div>
  );
};
