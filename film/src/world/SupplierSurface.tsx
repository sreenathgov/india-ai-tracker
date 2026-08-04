/**
 * SupplierSurface — Beat 4c (Bible §5 Beat 4c): the cell supplier's own
 * system, resolving the UN 38.3 request and returning the test summary.
 * Deliberately plain: "it is someone else's system, not ours" — no navy
 * tint, no state colours, no AuthorityMarks, no vermilion. Monochrome
 * ink/ink-dim only. See world/contract.tsx for the shared component rules.
 */

import type { CSSProperties } from "react";
import { type LayerProps, SIZES, clamp01, mix } from "./contract";
import { color, depth as depthTokens, radius } from "../design/tokens";
import { baseTextStyle, fontFamily, fontWeight } from "../design/type";

// ─── props ───────────────────────────────────────────────────────────────────

export interface SupplierSurfaceProps extends LayerProps {
  readonly name: string;
  readonly city: string;
  readonly steps: readonly string[];
  readonly stepProgress: readonly number[];
  readonly attachmentFilename: string;
  readonly attachmentProgress: number;
}

export const SUPPLIER_SURFACE_DEPTH = depthTokens.mid;

// ─── local geometry ───────────────────────────────────────────────────────────

const BOX = SIZES.supplierSurface;
const PAD = 28;
const HEADER_TOP = PAD;
const HEADER_HEIGHT = 32;
const RULE_Y = HEADER_TOP + HEADER_HEIGHT + 16;
const STEPS_TOP = RULE_Y + 28;
const STEP_ROW_HEIGHT = 40;
const STEP_GAP = 18;
const TICK_SIZE = 14;
const TICK_INSET = 3;
const CHIP_WIDTH = 380;
const CHIP_HEIGHT = 44;

const stepTop = (i: number): number => STEPS_TOP + i * (STEP_ROW_HEIGHT + STEP_GAP);

// ─── colour mixing (endpoints are ink / ink-dim tokens only) ─────────────────

const parseRgba = (input: string): { r: number; g: number; b: number; a: number } => {
  const parts = /rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/.exec(input);
  if (!parts) {
    throw new Error(`SupplierSurface: cannot parse colour token "${input}".`);
  }
  return {
    r: Number(parts[1]),
    g: Number(parts[2]),
    b: Number(parts[3]),
    a: parts[4] !== undefined ? Number(parts[4]) : 1,
  };
};

/** ink-dim → ink, linear, by t (0..1). Used for the per-step reveal colour. */
const inkMix = (t: number): string => {
  const from = parseRgba(color.inkDim);
  const to = parseRgba(color.ink);
  return `rgba(${mix(from.r, to.r, t)}, ${mix(from.g, to.g, t)}, ${mix(from.b, to.b, t)}, ${mix(from.a, to.a, t)})`;
};

// ─── component ────────────────────────────────────────────────────────────────

export const SupplierSurface = ({
  layer,
  name,
  city,
  steps,
  stepProgress,
  attachmentFilename,
  attachmentProgress,
}: SupplierSurfaceProps) => {
  if (steps.length !== stepProgress.length) {
    throw new Error(
      `SupplierSurface: steps (${steps.length}) and stepProgress (${stepProgress.length}) must be the same length.`
    );
  }

  const chipProgress = clamp01(attachmentProgress);
  const rootStyle: CSSProperties = { position: "absolute", left: 0, top: 0, width: BOX.width, height: BOX.height };

  if (layer === "graphics") {
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
            backgroundColor: "transparent",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: PAD,
            top: RULE_Y,
            width: BOX.width - PAD * 2,
            height: 1,
            backgroundColor: color.rule,
          }}
        />
        {steps.map((step, i) => {
          const progress = clamp01(stepProgress[i]);
          return (
            <div
              key={step}
              style={{
                position: "absolute",
                left: PAD,
                top: stepTop(i) + (STEP_ROW_HEIGHT - TICK_SIZE) / 2,
                width: TICK_SIZE,
                height: TICK_SIZE,
                border: `1px solid ${color.rule}`,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: TICK_INSET,
                  top: TICK_INSET,
                  right: TICK_INSET,
                  bottom: TICK_INSET,
                  backgroundColor: color.inkDim,
                  opacity: progress,
                }}
              />
            </div>
          );
        })}
        <div
          style={{
            position: "absolute",
            left: PAD,
            top: stepTop(steps.length) + 24,
            width: CHIP_WIDTH,
            height: CHIP_HEIGHT,
            borderRadius: radius.chip,
            border: `1px solid ${color.rule}`,
            backgroundColor: "transparent",
            opacity: chipProgress,
          }}
        />
      </div>
    );
  }

  // layer === "text"
  return (
    <div style={rootStyle}>
      <div
        style={{
          position: "absolute",
          left: PAD,
          top: HEADER_TOP,
          width: BOX.width - PAD * 2,
          height: HEADER_HEIGHT,
          display: "flex",
          alignItems: "baseline",
          gap: 10,
        }}
      >
        <div
          style={{
            ...baseTextStyle,
            fontFamily: fontFamily.ui,
            fontWeight: fontWeight.regular,
            fontSize: 16,
            color: color.ink,
          }}
        >
          {name}
        </div>
        <div
          style={{
            ...baseTextStyle,
            fontFamily: fontFamily.ui,
            fontWeight: fontWeight.regular,
            fontSize: 13,
            color: color.inkDim,
          }}
        >
          {city}
        </div>
      </div>
      {steps.map((step, i) => {
        const progress = clamp01(stepProgress[i]);
        return (
          <div
            key={step}
            style={{
              ...baseTextStyle,
              position: "absolute",
              left: PAD + TICK_SIZE + 14,
              top: stepTop(i),
              width: BOX.width - PAD * 2 - TICK_SIZE - 14,
              height: STEP_ROW_HEIGHT,
              display: "flex",
              alignItems: "center",
              fontFamily: fontFamily.ui,
              fontWeight: fontWeight.regular,
              fontSize: 14,
              color: inkMix(progress),
              opacity: progress,
              transform: `translateY(${mix(6, 0, progress)}px)`,
            }}
          >
            {step}
          </div>
        );
      })}
      <div
        style={{
          ...baseTextStyle,
          position: "absolute",
          left: PAD + 16,
          top: stepTop(steps.length) + 24,
          width: CHIP_WIDTH - 32,
          height: CHIP_HEIGHT,
          display: "flex",
          alignItems: "center",
          fontFamily: fontFamily.mono,
          fontWeight: fontWeight.regular,
          fontSize: 13,
          color: color.ink,
          opacity: chipProgress,
        }}
      >
        {attachmentFilename}
      </div>
    </div>
  );
};
