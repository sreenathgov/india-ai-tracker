/**
 * MatchPane — Bible §5 Beat 2. One of the two invoice-number panes pushed to
 * in the SB005 catch: a labelled mono value with its separator character
 * isolated and scaled toward vermilion as emphasisProgress advances. This is
 * the ONE sanctioned appearance of vermilion in the film (Bible §3, §5).
 *
 * Two-plane split (world/contract.tsx rule 2): graphics owns the card
 * surface only; text owns the label and every character of the value.
 */

import type { CSSProperties } from "react";
import { clamp01, mix, SIZES, type LayerProps } from "./contract";
import { color, depth, radius, rgba } from "../design/tokens";
import { baseTextStyle, fontFamily, fontWeight, tracking } from "../design/type";

export interface MatchPaneProps extends LayerProps {
  readonly label: string;
  readonly value: string;
  readonly emphasisChar: string;
  readonly emphasisProgress: number;
}

export const MATCH_PANE_DEPTH = depth.foreground;

const BOX = SIZES.matchPane;
const PADDING_X = 28;
const LABEL_TOP = 22;
const LABEL_FONT_SIZE = 13;
const VALUE_TOP = 54;
const VALUE_FONT_SIZE = 44;
/** The emphasised separator's peak scale (Bible §5 Beat 2: "isolate and scale to 1.6x"). */
const EMPHASIS_SCALE_MAX = 1.6;

const rootStyle: CSSProperties = {
  position: "relative",
  width: BOX.width,
  height: BOX.height,
};

const surfaceStyle: CSSProperties = {
  position: "absolute",
  left: 0,
  top: 0,
  width: BOX.width,
  height: BOX.height,
  borderRadius: radius.card,
  border: `1px solid ${color.rule}`,
  backgroundColor: rgba(color.navy, 0.03),
};

const labelStyle: CSSProperties = {
  ...baseTextStyle,
  position: "absolute",
  left: PADDING_X,
  top: LABEL_TOP,
  fontFamily: fontFamily.ui,
  fontWeight: fontWeight.regular,
  fontSize: LABEL_FONT_SIZE,
  // §5 gives the pane headers verbatim ("Commercial Invoice · Tally · p1") —
  // no case transform, so the provenance ref "p1" stays lowercase-exact.
  letterSpacing: tracking.wide,
  color: color.inkDim,
};

const valueRowStyle: CSSProperties = {
  position: "absolute",
  left: PADDING_X,
  top: VALUE_TOP,
  display: "flex",
  flexDirection: "row",
};

const charBoxStyle: CSSProperties = {
  ...baseTextStyle,
  display: "inline-block",
  width: "1ch",
  textAlign: "center",
  fontFamily: fontFamily.mono,
  fontWeight: fontWeight.regular,
  fontSize: VALUE_FONT_SIZE,
  lineHeight: 1,
};

export const MatchPane = ({
  layer,
  label,
  value,
  emphasisChar,
  emphasisProgress,
}: MatchPaneProps) => {
  if (layer === "graphics") {
    return (
      <div style={rootStyle}>
        <div style={surfaceStyle} />
      </div>
    );
  }

  const p = clamp01(emphasisProgress);
  const emphasisStyle: CSSProperties = {
    ...charBoxStyle,
    transform: `scale(${mix(1, EMPHASIS_SCALE_MAX, p)})`,
    transformOrigin: "center 70%",
    color: `color-mix(in srgb, ${color.ink} ${(1 - p) * 100}%, ${color.vermilion} ${p * 100}%)`,
  };
  const plainStyle: CSSProperties = { ...charBoxStyle, color: color.ink };

  return (
    <div style={rootStyle}>
      <div style={labelStyle}>{label}</div>
      <div style={valueRowStyle}>
        {value.split("").map((ch, i) => (
          <span key={`${ch}-${i}`} style={ch === emphasisChar ? emphasisStyle : plainStyle}>
            {ch}
          </span>
        ))}
      </div>
    </div>
  );
};
