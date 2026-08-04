/**
 * PacketTray — Beat 7 (Bible §5): the two signed packets separating and
 * travelling to their endpoints. Pure function of props; owns no timing
 * (contract.tsx rule 1). Renders one of the two world planes per `layer`
 * (rule 2), sharing identical box math so graphics and text register
 * pixel-exactly.
 */

import type { CSSProperties } from "react";
import { clamp01, SIZES, type LayerProps } from "./contract";
import { color, depth, radius, rgba } from "../design/tokens";
import { baseTextStyle, fontFamily, fontWeight } from "../design/type";

// ─── props ───────────────────────────────────────────────────────────────────

export interface PacketSpec {
  readonly title: string;
  readonly endpoint: string;
  readonly microLine: string;
}

export interface PacketTrayProps extends LayerProps {
  /** COPY.beat7.packets (length 2). */
  readonly packets: readonly PacketSpec[];
  /** 0..1 — cards materialise (opacity + 8px rise, linear). */
  readonly presence: number;
  /** Per-packet travel offset, computed upstream — applied as translate. */
  readonly offsets: readonly { readonly x: number; readonly y: number }[];
  /** 0..1 — endpoint line + micro-line reveal. */
  readonly labelProgress: number;
}

export const PACKET_TRAY_DEPTH = depth.mid;

// ─── geometry (identical box math for both planes) ───────────────────────────

const CARD = SIZES.packetCard;
const STACK_GAP = 24;
const BOX = { width: CARD.width, height: CARD.height * 2 + STACK_GAP };

const CARD_PADDING = 20;
const TITLE_TOP = 20;
const RULE_TOP = 52;
const ENDPOINT_TOP = 68;
const MICRO_TOP = 96;

const cardLocalTop = (i: number): number => i * (CARD.height + STACK_GAP);

const cardTranslate = (presence: number, offset: { readonly x: number; readonly y: number }): string => {
  const p = clamp01(presence);
  return `translate(${offset.x}px, ${offset.y + (1 - p) * 8}px)`;
};

const rowText: CSSProperties = {
  ...baseTextStyle,
  position: "absolute",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

// ─── component ───────────────────────────────────────────────────────────────

export const PacketTray = ({
  layer,
  packets,
  presence,
  offsets,
  labelProgress,
}: PacketTrayProps) => {
  const presenceP = clamp01(presence);
  const labelP = clamp01(labelProgress);

  if (layer === "graphics") {
    return (
      <div style={{ position: "absolute", left: 0, top: 0, width: BOX.width, height: BOX.height }}>
        {packets.map((packet, i) => {
          const offset = offsets[i] ?? { x: 0, y: 0 };
          return (
            <div
              key={packet.title}
              style={{
                position: "absolute",
                left: 0,
                top: cardLocalTop(i),
                width: CARD.width,
                height: CARD.height,
                opacity: presenceP,
                transform: cardTranslate(presence, offset),
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  width: CARD.width,
                  height: CARD.height,
                  borderRadius: radius.card,
                  border: `1px solid ${color.rule}`,
                  backgroundColor: rgba(color.navy, 0.04),
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: CARD_PADDING,
                  top: RULE_TOP,
                  width: CARD.width - CARD_PADDING * 2,
                  height: 1,
                  backgroundColor: color.rule,
                }}
              />
            </div>
          );
        })}
      </div>
    );
  }

  // layer === "text"
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: BOX.width, height: BOX.height }}>
      {packets.map((packet, i) => {
        const offset = offsets[i] ?? { x: 0, y: 0 };
        const top = cardLocalTop(i);
        return (
          <div
            key={packet.title}
            style={{
              position: "absolute",
              left: 0,
              top,
              width: CARD.width,
              height: CARD.height,
              opacity: presenceP,
              transform: cardTranslate(presence, offset),
            }}
          >
            <div
              style={{
                ...rowText,
                left: CARD_PADDING,
                top: TITLE_TOP,
                width: CARD.width - CARD_PADDING * 2,
                fontFamily: fontFamily.ui,
                fontWeight: fontWeight.regular,
                fontSize: 16,
                color: color.ink,
              }}
            >
              {packet.title}
            </div>
            <div
              style={{
                ...rowText,
                left: CARD_PADDING,
                top: ENDPOINT_TOP,
                width: CARD.width - CARD_PADDING * 2,
                fontFamily: fontFamily.ui,
                fontWeight: fontWeight.regular,
                fontSize: 14,
                color: color.inkDim,
                opacity: labelP,
              }}
            >
              {`→ ${packet.endpoint}`}
            </div>
            <div
              style={{
                ...rowText,
                left: CARD_PADDING,
                top: MICRO_TOP,
                width: CARD.width - CARD_PADDING * 2,
                fontFamily: fontFamily.ui,
                fontWeight: fontWeight.regular,
                fontSize: 12,
                color: color.inkDim,
                opacity: labelP,
              }}
            >
              {packet.microLine}
            </div>
          </div>
        );
      })}
    </div>
  );
};
