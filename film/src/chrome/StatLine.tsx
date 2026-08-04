/**
 * StatLine — the workspace stat line (Bible §5 Beats 1 and 5), e.g.
 * "7 documents · 52 fields · source-linked". Pure text: the graphics plane
 * carries nothing (no surfaces, no bars — just words and numbers), so
 * layer="graphics" renders null.
 *
 * Digit runs inside each segment render in mono so counts read
 * character-exact even though the rest of the line is Telegraf.
 */

import type { CSSProperties } from "react";
import { clamp01, mix, SIZES, type LayerProps } from "../world/contract";
import { color, depth } from "../design/tokens";
import { baseTextStyle, fontFamily, fontWeight, tracking } from "../design/type";

export interface StatLineProps extends LayerProps {
  /** Pre-formatted upstream, joined with " · ". */
  readonly segments: readonly string[];
  readonly emphasis?: { readonly segment: number; readonly amount: number };
}

export const STAT_LINE_DEPTH = depth.background;

const FONT_SIZE = 15;
const SEPARATOR = " · ";
/** Emphasis scales the segment up to this factor at amount = 1. */
const EMPHASIS_SCALE = 1.06;

interface Run {
  readonly text: string;
  readonly mono: boolean;
}

/** Splits a segment into alternating digit / non-digit runs. */
const splitDigitRuns = (text: string): readonly Run[] => {
  const runs: Run[] = [];
  const digitPattern = /\d+/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = digitPattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      runs.push({ text: text.slice(lastIndex, match.index), mono: false });
    }
    runs.push({ text: match[0], mono: true });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    runs.push({ text: text.slice(lastIndex), mono: false });
  }
  return runs;
};

/** Local colour interpolation — mixes two already-imported design tokens
 * (rgba(...) or 6-digit hex strings). Introduces no new colour values. */
const parseColorChannels = (input: string): readonly [number, number, number, number] => {
  const hex = /^#([0-9a-f]{6})$/i.exec(input);
  if (hex) {
    const n = parseInt(hex[1], 16);
    return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff, 1];
  }
  const rgbaMatch =
    /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/i.exec(input);
  if (rgbaMatch) {
    return [
      Number(rgbaMatch[1]),
      Number(rgbaMatch[2]),
      Number(rgbaMatch[3]),
      rgbaMatch[4] !== undefined ? Number(rgbaMatch[4]) : 1,
    ];
  }
  throw new Error(`StatLine: unrecognised colour token "${input}"`);
};

const mixColor = (a: string, b: string, t: number): string => {
  const [ar, ag, ab, aa] = parseColorChannels(a);
  const [br, bg, bb, ba] = parseColorChannels(b);
  const r = Math.round(mix(ar, br, t));
  const g = Math.round(mix(ag, bg, t));
  const bl = Math.round(mix(ab, bb, t));
  const alpha = mix(aa, ba, t);
  return `rgba(${r}, ${g}, ${bl}, ${alpha})`;
};

const runStyle = (mono: boolean): CSSProperties => ({
  ...baseTextStyle,
  fontFamily: mono ? fontFamily.mono : fontFamily.ui,
  fontWeight: fontWeight.regular,
  fontSize: FONT_SIZE,
  letterSpacing: tracking.wide,
  // Runs render as flex items: without pre, the spaces at run boundaries
  // collapse and "7 documents" becomes "7documents".
  whiteSpace: "pre",
});

export const StatLine = ({ layer, segments, emphasis }: StatLineProps) => {
  if (layer === "graphics") {
    return null;
  }

  return (
    <div
      style={{
        position: "relative",
        width: SIZES.statLine.width,
        height: SIZES.statLine.height,
        display: "flex",
        alignItems: "center",
        whiteSpace: "nowrap",
      }}
    >
      {segments.map((segment, i) => {
        const isEmphasis = emphasis !== undefined && emphasis.segment === i;
        const amount = isEmphasis ? clamp01(emphasis.amount) : 0;
        const segmentColor = mixColor(color.inkDim, color.ink, amount);
        const scale = mix(1, EMPHASIS_SCALE, amount);
        return (
          <span key={i} style={{ display: "inline-flex", alignItems: "center" }}>
            {i > 0 && <span style={{ ...runStyle(false), color: color.inkDim }}>{SEPARATOR}</span>}
            <span
              style={{
                display: "inline-flex",
                transform: `scale(${scale})`,
                transformOrigin: "left center",
                color: segmentColor,
              }}
            >
              {splitDigitRuns(segment).map((run, ri) => (
                <span key={ri} style={{ ...runStyle(run.mono), color: "inherit" }}>
                  {run.text}
                </span>
              ))}
            </span>
          </span>
        );
      })}
    </div>
  );
};
