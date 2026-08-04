/**
 * MatchGlyph — Bible §5 Beat 2. The soft circular plate between the two
 * MatchPanes, holding "≠" (BLOCKED oxblood) then flipping to "=" (OPEN
 * green) once the reviewer's correction lands. Cross-fade with a counter-
 * scale, linear on flipProgress — no overshoot (Bible §4.10).
 *
 * Two-plane split: graphics owns the plate only; text owns both glyphs.
 */

import type { CSSProperties } from "react";
import { clamp01, mix, SIZES, type LayerProps } from "./contract";
import { color, depth, rgba, stateColor } from "../design/tokens";
import { baseTextStyle, fontFamily, fontWeight } from "../design/type";

export type MatchGlyphState = "mismatch" | "match";

export interface MatchGlyphProps extends LayerProps {
  readonly state: MatchGlyphState;
  readonly flipProgress: number;
}

export const MATCH_GLYPH_DEPTH = depth.foreground;

const BOX = SIZES.matchGlyph;
const GLYPH_FONT_SIZE = 64;
/** Counter-scale band for the cross-fade (Bible §5 Beat 2: no bounce, linear). */
const OUTGOING_SCALE = { from: 1, to: 0.9 } as const;
const INCOMING_SCALE = { from: 0.9, to: 1 } as const;

const rootStyle: CSSProperties = {
  position: "relative",
  width: BOX.width,
  height: BOX.height,
};

// A perfect circle's radius is fixed by its own diameter, not a stylistic
// choice — "50%" is the CSS idiom for that, not a new radius token.
const plateStyle: CSSProperties = {
  position: "absolute",
  left: 0,
  top: 0,
  width: BOX.width,
  height: BOX.height,
  borderRadius: "50%",
  border: `1px solid ${color.rule}`,
  backgroundColor: rgba(color.navy, 0.04),
};

const glyphBaseStyle: CSSProperties = {
  ...baseTextStyle,
  position: "absolute",
  left: 0,
  top: 0,
  width: BOX.width,
  height: BOX.height,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontFamily: fontFamily.mono,
  fontWeight: fontWeight.regular,
  fontSize: GLYPH_FONT_SIZE,
};

export const MatchGlyph = ({ layer, state, flipProgress }: MatchGlyphProps) => {
  if (layer === "graphics") {
    return (
      <div style={rootStyle}>
        <div style={plateStyle} />
      </div>
    );
  }

  const p = clamp01(flipProgress);
  const outgoingStyle: CSSProperties = {
    ...glyphBaseStyle,
    color: stateColor.BLOCKED,
    opacity: 1 - p,
    transform: `scale(${mix(OUTGOING_SCALE.from, OUTGOING_SCALE.to, p)})`,
  };
  const incomingStyle: CSSProperties = {
    ...glyphBaseStyle,
    color: stateColor.OPEN,
    opacity: p,
    transform: `scale(${mix(INCOMING_SCALE.from, INCOMING_SCALE.to, p)})`,
  };

  return (
    <div style={rootStyle} aria-label={state}>
      <div style={outgoingStyle}>{"≠"}</div>
      <div style={incomingStyle}>{"="}</div>
    </div>
  );
};
