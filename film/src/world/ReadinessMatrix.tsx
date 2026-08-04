/**
 * ReadinessMatrix — Beat 5 (Bible §5): the readiness cascade resolving into
 * an aggregate verdict. Pure function of props; owns no timing (contract.tsx
 * rule 1). Renders one of the two world planes per `layer` (rule 2), sharing
 * identical box math so graphics and text register pixel-exactly.
 */

import type { CSSProperties } from "react";
import type { RuleState } from "../data/shipment";
import { clamp01, SIZES, type LayerProps } from "./contract";
import { color, depth, radius, rgba, stateColor } from "../design/tokens";
import { baseTextStyle, fontFamily, fontWeight, tracking } from "../design/type";

// ─── props ───────────────────────────────────────────────────────────────────

export interface MatrixRow {
  readonly ruleId: string;
  readonly label: string;
  readonly state: RuleState;
  readonly note?: string;
}

export interface ReadinessMatrixProps extends LayerProps {
  readonly rows: readonly MatrixRow[];
  /** Per-row 0..1 — the row's state lands (cascade staggered upstream). */
  readonly rowProgress: readonly number[];
  readonly aggregate: string;
  readonly defensibility: string;
  readonly overrideLog: string;
  /** 0..1 footer reveal. */
  readonly aggregateProgress: number;
}

export const READINESS_MATRIX_DEPTH = depth.mid;

// ─── geometry (identical box math for both planes) ───────────────────────────

const BOX = SIZES.readinessMatrix;
const FRAME_PADDING = 24;
const ROW_HEIGHT = 64;
const TICK_WIDTH = 3;
const RULE_ID_WIDTH = 300;
const COLUMN_GAP = 12;
const CHIP_WIDTH = 140;
const CHIP_HEIGHT = 28;
const FOOTER_HEIGHT = 116;
const FOOTER_RULE_GAP = 16;
const AGG_CHIP_WIDTH = 160;
const AGG_CHIP_HEIGHT = 32;

interface Rect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

const rowTop = (i: number): number => FRAME_PADDING + i * ROW_HEIGHT;
const tickRect = (i: number): Rect => ({ x: 0, y: rowTop(i), width: TICK_WIDTH, height: ROW_HEIGHT });
const ruleIdRect = (i: number): Rect => ({
  x: FRAME_PADDING + TICK_WIDTH + COLUMN_GAP,
  y: rowTop(i),
  width: RULE_ID_WIDTH,
  height: ROW_HEIGHT,
});
const chipRect = (i: number): Rect => ({
  x: BOX.width - FRAME_PADDING - CHIP_WIDTH,
  y: rowTop(i) + (ROW_HEIGHT - CHIP_HEIGHT) / 2,
  width: CHIP_WIDTH,
  height: CHIP_HEIGHT,
});
const labelRect = (i: number): Rect => {
  const start = ruleIdRect(i).x + RULE_ID_WIDTH + COLUMN_GAP;
  const end = chipRect(i).x - COLUMN_GAP;
  return { x: start, y: rowTop(i), width: Math.max(0, end - start), height: ROW_HEIGHT };
};
const footerTop = (rowCount: number): number =>
  Math.max(rowTop(rowCount) + FOOTER_RULE_GAP, BOX.height - FRAME_PADDING - FOOTER_HEIGHT);
const footerRuleRect = (rowCount: number): Rect => ({
  x: FRAME_PADDING,
  y: footerTop(rowCount) - FOOTER_RULE_GAP / 2,
  width: BOX.width - FRAME_PADDING * 2,
  height: 1,
});
const aggChipRect = (rowCount: number): Rect => ({
  x: FRAME_PADDING,
  y: footerTop(rowCount),
  width: AGG_CHIP_WIDTH,
  height: AGG_CHIP_HEIGHT,
});

const rectStyle = (r: Rect): CSSProperties => ({
  position: "absolute",
  left: r.x,
  top: r.y,
  width: r.width,
  height: r.height,
});

const rowText: CSSProperties = {
  ...baseTextStyle,
  position: "absolute",
  display: "flex",
  alignItems: "center",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

// ─── component ───────────────────────────────────────────────────────────────

export const ReadinessMatrix = ({
  layer,
  rows,
  rowProgress,
  aggregate,
  defensibility,
  overrideLog,
  aggregateProgress,
}: ReadinessMatrixProps) => {
  const aggP = clamp01(aggregateProgress);
  const aggChip = aggChipRect(rows.length);

  if (layer === "graphics") {
    return (
      <div style={rectStyle({ x: 0, y: 0, width: BOX.width, height: BOX.height })}>
        <div
          style={{
            ...rectStyle({ x: 0, y: 0, width: BOX.width, height: BOX.height }),
            borderRadius: radius.frame,
            border: `1px solid ${color.rule}`,
            backgroundColor: rgba(color.navy, 0.03),
          }}
        />
        {rows.slice(1).map((_, idx) => (
          <div
            key={`sep-${idx + 1}`}
            style={{
              ...rectStyle({ x: FRAME_PADDING, y: rowTop(idx + 1), width: BOX.width - FRAME_PADDING * 2, height: 1 }),
              backgroundColor: color.rule,
            }}
          />
        ))}
        {rows.map((row, i) => {
          const p = clamp01(rowProgress[i] ?? 0);
          return (
            <div key={`bar-${row.ruleId}`}>
              <div style={{ ...rectStyle(tickRect(i)), backgroundColor: stateColor[row.state], opacity: p }} />
              <div
                style={{
                  ...rectStyle(chipRect(i)),
                  borderRadius: radius.pill,
                  backgroundColor: rgba(stateColor[row.state], 0.12),
                  transform: `scaleX(${p})`,
                  transformOrigin: "left",
                }}
              />
            </div>
          );
        })}
        <div style={{ ...rectStyle(footerRuleRect(rows.length)), backgroundColor: color.rule }} />
        <div
          style={{
            ...rectStyle(aggChip),
            borderRadius: radius.pill,
            backgroundColor: rgba(stateColor.OPEN, 0.12),
            transform: `scaleX(${aggP})`,
            transformOrigin: "left",
          }}
        />
      </div>
    );
  }

  // layer === "text"
  return (
    <div style={rectStyle({ x: 0, y: 0, width: BOX.width, height: BOX.height })}>
      {rows.map((row, i) => {
        const p = clamp01(rowProgress[i] ?? 0);
        return (
          <div key={row.ruleId}>
            <div
              style={{
                ...rowText,
                ...rectStyle(ruleIdRect(i)),
                fontFamily: fontFamily.mono,
                fontWeight: fontWeight.regular,
                fontSize: 12.5,
                color: color.ink,
              }}
            >
              {row.ruleId}
            </div>
            <div
              style={{
                ...rowText,
                ...rectStyle(labelRect(i)),
                fontFamily: fontFamily.ui,
                fontWeight: fontWeight.regular,
                fontSize: 13,
                color: color.inkDim,
                gap: 6,
              }}
            >
              <span>{row.label}</span>
              {/* The note (e.g. the override record) is an OUTCOME — it lands
                  with the row's evaluation, never before it. */}
              {row.note ? (
                <span style={{ fontSize: 11, opacity: p }}>· {row.note}</span>
              ) : null}
            </div>
            <div
              style={{
                ...rowText,
                ...rectStyle(chipRect(i)),
                justifyContent: "center",
                fontFamily: fontFamily.ui,
                fontWeight: fontWeight.regular,
                fontSize: 12,
                textTransform: "uppercase",
                letterSpacing: tracking.caps,
                color: stateColor[row.state],
                opacity: p,
              }}
            >
              {row.state}
            </div>
          </div>
        );
      })}
      <div
        style={{
          ...rowText,
          ...rectStyle(aggChip),
          justifyContent: "center",
          fontFamily: fontFamily.ui,
          fontWeight: fontWeight.regular,
          fontSize: 14,
          textTransform: "uppercase",
          letterSpacing: tracking.caps,
          color: stateColor.OPEN,
          opacity: aggP,
        }}
      >
        {aggregate}
      </div>
      <div
        style={{
          ...rowText,
          ...rectStyle({ x: FRAME_PADDING, y: aggChip.y + AGG_CHIP_HEIGHT + 12, width: BOX.width - FRAME_PADDING * 2, height: 20 }),
          fontFamily: fontFamily.ui,
          fontWeight: fontWeight.regular,
          fontSize: 13,
          color: color.inkDim,
          opacity: aggP,
        }}
      >
        {defensibility}
      </div>
      <div
        style={{
          ...rowText,
          ...rectStyle({ x: FRAME_PADDING, y: aggChip.y + AGG_CHIP_HEIGHT + 34, width: BOX.width - FRAME_PADDING * 2, height: 20 }),
          fontFamily: fontFamily.ui,
          fontWeight: fontWeight.regular,
          fontSize: 13,
          color: color.inkDim,
          opacity: aggP,
        }}
      >
        {overrideLog}
      </div>
    </div>
  );
};
