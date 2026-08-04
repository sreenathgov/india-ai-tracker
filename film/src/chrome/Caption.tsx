/**
 * Caption — Bible §5. Screen-space narration, rendered OUTSIDE the camera by
 * Film (not part of the world, no layer split, no depth). `progress` maps
 * linearly to opacity and rise; Film shapes the envelope, including the
 * fade-out, by driving progress back down — the mapping here stays monotone.
 */

import type { CSSProperties } from "react";
import { clamp01 } from "../world/contract";
import { color } from "../design/tokens";
import { baseTextStyle, fontFamily, fontWeight } from "../design/type";

export interface CaptionProps {
  readonly text: string;
  readonly progress: number;
}

const MAX_WIDTH = 880;
const FONT_SIZE = 44;
const RISE_PX = 10;

export const Caption = ({ text, progress }: CaptionProps) => {
  const p = clamp01(progress);
  const style: CSSProperties = {
    ...baseTextStyle,
    fontFamily: fontFamily.display,
    fontWeight: fontWeight.regular,
    fontSize: FONT_SIZE,
    color: color.ink,
    maxWidth: MAX_WIDTH,
    textAlign: "left",
    opacity: p,
    transform: `translateY(${(1 - p) * RISE_PX}px)`,
  };
  return <div style={style}>{text}</div>;
};
