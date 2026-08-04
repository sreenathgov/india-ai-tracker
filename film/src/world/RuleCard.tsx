/**
 * RuleCard — Bible §5 Beat 3 / Beat 4d. The L2-R03 rule surface: UNCLEAR
 * while the Wh observation is missing, flipping to OPEN once the supplier
 * loop closes and its two fields land with provenance. No numeric
 * confidence anywhere — states render as words only (Bible §1).
 *
 * Two-plane split: graphics owns the card surface and the state-chip pill;
 * text owns the title, the chip word, the missing-input line and every
 * field row (including AuthorityMark, which is a glyph and so only ever
 * rendered on the text plane).
 */

import type { CSSProperties } from "react";
import { AuthorityMark } from "../chrome/AuthorityMark";
import type { RuleState } from "../data/shipment";
import { clamp01, mix, SIZES, type LayerProps } from "./contract";
import { color, depth, radius, rgba, stateColor } from "../design/tokens";
import { baseTextStyle, fontFamily, fontWeight, tracking } from "../design/type";

export interface ExtractedFieldRow {
  readonly label: string;
  readonly value: string;
  readonly provenance: string;
}

export interface RuleCardProps extends LayerProps {
  readonly title: string;
  readonly state: RuleState;
  readonly flipProgress: number;
  readonly missingInput: string;
  readonly missingOpacity: number;
  readonly fields: readonly ExtractedFieldRow[];
  readonly fieldProgress: readonly number[];
}

export const RULE_CARD_DEPTH = depth.foreground;

const BOX = SIZES.ruleCard;
const PADDING_X = 24;

const CHIP = { width: 150, height: 30, y: 20 } as const;
/** Title clears the state chip: width stops 12px short of the chip's left
 * edge so the rule id never runs underneath it. */
const TITLE = {
  x: PADDING_X,
  y: 24,
  fontSize: 15,
  width: BOX.width - PADDING_X * 2 - CHIP.width - 12,
} as const;
const CHIP_X = BOX.width - PADDING_X - CHIP.width;
const MISSING = { x: PADDING_X, y: 76, width: BOX.width - PADDING_X * 2, fontSize: 14 } as const;
const FIELDS_TOP = 132;
const ROW_HEIGHT = 46;
const ROW_LABEL = { x: PADDING_X, width: 200 } as const;
const ROW_VALUE = { x: PADDING_X + 200, width: 160 } as const;
const ROW_RIGHT = { x: BOX.width - PADDING_X - 160, width: 160 } as const;
/** Field-row reveal rise, per Bible §5 Beat 4d ("opacity + 6px rise, linear"). */
const ROW_RISE_PX = 6;
const AUTHORITY_MARK_SIZE = 13;

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
  backgroundColor: rgba(color.navy, 0.04),
};

const chipPillBackground = (flipP: number): string =>
  `color-mix(in srgb, ${rgba(stateColor.UNCLEAR, 0.12)} ${(1 - flipP) * 100}%, ${rgba(
    stateColor.OPEN,
    0.12
  )} ${flipP * 100}%)`;

const chipPillStyle = (flipP: number): CSSProperties => ({
  position: "absolute",
  left: CHIP_X,
  top: CHIP.y,
  width: CHIP.width,
  height: CHIP.height,
  borderRadius: radius.pill,
  backgroundColor: chipPillBackground(flipP),
});

const titleStyle: CSSProperties = {
  ...baseTextStyle,
  position: "absolute",
  left: TITLE.x,
  top: TITLE.y,
  width: TITLE.width,
  fontFamily: fontFamily.mono,
  fontWeight: fontWeight.regular,
  fontSize: TITLE.fontSize,
  lineHeight: 1.4,
  color: color.ink,
};

const chipWordBaseStyle: CSSProperties = {
  ...baseTextStyle,
  position: "absolute",
  left: CHIP_X,
  top: CHIP.y,
  width: CHIP.width,
  height: CHIP.height,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontFamily: fontFamily.ui,
  fontWeight: fontWeight.regular,
  fontSize: 12,
  letterSpacing: tracking.caps,
  textTransform: "uppercase",
};

const missingStyle = (opacity: number): CSSProperties => ({
  ...baseTextStyle,
  position: "absolute",
  left: MISSING.x,
  top: MISSING.y,
  width: MISSING.width,
  fontFamily: fontFamily.ui,
  fontWeight: fontWeight.regular,
  fontSize: MISSING.fontSize,
  color: color.inkDim,
  opacity: clamp01(opacity),
});

const rowLabelStyle: CSSProperties = {
  ...baseTextStyle,
  position: "absolute",
  left: ROW_LABEL.x,
  width: ROW_LABEL.width,
  fontFamily: fontFamily.ui,
  fontWeight: fontWeight.regular,
  fontSize: 14,
  color: color.ink,
};

const rowValueStyle: CSSProperties = {
  ...baseTextStyle,
  position: "absolute",
  left: ROW_VALUE.x,
  width: ROW_VALUE.width,
  fontFamily: fontFamily.mono,
  fontWeight: fontWeight.regular,
  fontSize: 16,
  color: color.ink,
};

const rowRightStyle: CSSProperties = {
  position: "absolute",
  left: ROW_RIGHT.x,
  width: ROW_RIGHT.width,
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: 6,
};

const rowProvenanceStyle: CSSProperties = {
  ...baseTextStyle,
  fontFamily: fontFamily.mono,
  fontWeight: fontWeight.regular,
  fontSize: 12,
  color: color.inkDim,
};

export const RuleCard = ({
  layer,
  title,
  state,
  flipProgress,
  missingInput,
  missingOpacity,
  fields,
  fieldProgress,
}: RuleCardProps) => {
  const p = clamp01(flipProgress);

  if (layer === "graphics") {
    return (
      <div style={rootStyle}>
        <div style={surfaceStyle} />
        <div style={chipPillStyle(p)} />
      </div>
    );
  }

  return (
    <div style={rootStyle}>
      <div style={titleStyle}>{title}</div>
      <div style={{ ...chipWordBaseStyle, color: stateColor.UNCLEAR, opacity: 1 - p }} aria-label={state}>
        UNCLEAR
      </div>
      <div style={{ ...chipWordBaseStyle, color: stateColor.OPEN, opacity: p }}>OPEN</div>
      <div style={missingStyle(missingOpacity)}>{missingInput}</div>
      {fields.map((field, i) => {
        const rp = clamp01(fieldProgress[i] ?? 0);
        const rowStyle: CSSProperties = {
          position: "absolute",
          left: 0,
          top: FIELDS_TOP + i * ROW_HEIGHT,
          width: BOX.width,
          height: ROW_HEIGHT,
          opacity: rp,
          transform: `translateY(${mix(ROW_RISE_PX, 0, rp)}px)`,
        };
        return (
          <div key={field.label} style={rowStyle}>
            <div style={rowLabelStyle}>{field.label}</div>
            <div style={rowValueStyle}>{field.value}</div>
            <div style={rowRightStyle}>
              <AuthorityMark kind="signed" size={AUTHORITY_MARK_SIZE} />
              <span style={rowProvenanceStyle}>{field.provenance}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
