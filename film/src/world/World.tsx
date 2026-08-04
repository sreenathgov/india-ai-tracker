/**
 * The single persistent scene graph (Bible §4.1, §6). Everything exists in
 * one coordinate space from frame 0; the camera reveals it. The World owns
 * NO timing — Film.tsx computes a WorldState per frame and the World renders
 * it, twice: once per plane (layer="graphics" under motion blur, layer="text"
 * sharp), with identical box math so the planes register.
 *
 * The World also owns the small amount of glue §5 specifies but no component
 * covers: the workspace chrome line, the Beat 2 chip/consequence/override
 * rows, the travelling return PDF chip, and the background hairline grid
 * that gives the dolly its far plane.
 */

import type { CSSProperties, ReactNode } from "react";
import { AbsoluteFill } from "remotion";
import { color, depth, radius, rgba, stateColor } from "../design/tokens";
import { baseTextStyle, fontFamily, fontWeight, tracking } from "../design/type";
import {
  CELL_SUPPLIER,
  COPY,
  DISPLAY,
  INVOICE_TRAP,
  UN38_3,
  type RuleState,
} from "../data/shipment";
import { Depth, type WorldPoint } from "../camera/depth";
import { clamp01, mix, placeAt, SIZES, type WorldLayer } from "./contract";
import * as L from "./layout";
import { IntakeColumn } from "./IntakeColumn";
import type { DocumentCardChannels } from "./DocumentCard";
import { MatchPane, MATCH_PANE_DEPTH } from "./MatchPane";
import { MatchGlyph, MATCH_GLYPH_DEPTH } from "./MatchGlyph";
import { RuleCard, RULE_CARD_DEPTH } from "./RuleCard";
import { RequestCard, REQUEST_CARD_DEPTH, type RequestButtonState } from "./RequestCard";
import { SupplierSurface } from "./SupplierSurface";
import { ReadinessMatrix, type MatrixRow } from "./ReadinessMatrix";
import { SealSurface, type SealButtonState } from "./SealSurface";
import { PacketTray } from "./PacketTray";
import { StatLine } from "../chrome/StatLine";

// ─── state ───────────────────────────────────────────────────────────────────

export interface TravelPose {
  readonly x: number;
  readonly y: number;
  readonly opacity: number;
}

export interface WorldState {
  readonly intakeCards: readonly DocumentCardChannels[];
  readonly statSegments: readonly string[];
  readonly statEmphasis?: { readonly segment: number; readonly amount: number };
  /** Reconciliation cluster materialises as reconciliation runs (end Beat 1). */
  readonly reconPresence: number;
  readonly paneEmphasis: number;
  readonly glyphFlip: number;
  readonly sb005ChipProgress: number;
  readonly correctionChars: number;
  readonly reviewerChipProgress: number;
  readonly consequenceProgress: number;
  readonly ruleCard: {
    readonly state: RuleState;
    readonly flip: number;
    readonly missingOpacity: number;
    readonly fieldProgress: readonly number[];
  };
  readonly request: {
    readonly pose: TravelPose;
    readonly typedChars: number;
    readonly buttonState: RequestButtonState;
    readonly buttonEmphasis: number;
    readonly chipProgress: number;
  } | null;
  readonly supplierX: number;
  readonly supplier: {
    readonly presence: number;
    readonly stepProgress: readonly number[];
    readonly attachmentProgress: number;
  };
  readonly returnChip: TravelPose | null;
  readonly matrix: {
    readonly rows: readonly MatrixRow[];
    readonly rowProgress: readonly number[];
    readonly aggregateProgress: number;
  };
  readonly seal: {
    readonly buttonState: SealButtonState;
    readonly buttonEmphasis: number;
    readonly stampProgress: number;
    readonly badgeProgress: readonly number[];
    readonly hashProgress: number;
    readonly sealLineProgress: number;
  };
  readonly packets: {
    readonly presence: number;
    readonly offsets: readonly { readonly x: number; readonly y: number }[];
    readonly labelProgress: number;
  };
  /** Extra content on the world text plane (the in-world cursors). */
  readonly worldChrome?: ReactNode;
}

// ─── glue styles ─────────────────────────────────────────────────────────────

const capsText: CSSProperties = {
  ...baseTextStyle,
  fontFamily: fontFamily.ui,
  fontWeight: fontWeight.regular,
  letterSpacing: tracking.caps,
  textTransform: "uppercase",
};

// ─── chip row glue (pill on graphics, label on text — registered boxes) ──────

const ChipRow = ({
  layer,
  x,
  y,
  text,
  progress,
  tint,
  textColor,
  mono = false,
  caps = true,
}: {
  readonly layer: WorldLayer;
  readonly x: number;
  readonly y: number;
  readonly text: string;
  readonly progress: number;
  readonly tint: string;
  readonly textColor: string;
  readonly mono?: boolean;
  /** false preserves §5-verbatim casing (names, provenance refs). */
  readonly caps?: boolean;
}) => {
  const p = clamp01(progress);
  if (p <= 0) {
    return null;
  }
  const label: CSSProperties = mono
    ? { ...baseTextStyle, fontFamily: fontFamily.mono, fontWeight: fontWeight.regular, fontSize: 14 }
    : caps
      ? { ...capsText, fontSize: 12 }
      : {
          ...baseTextStyle,
          fontFamily: fontFamily.ui,
          fontWeight: fontWeight.regular,
          fontSize: 12.5,
          letterSpacing: tracking.wide,
        };
  const box: CSSProperties = {
    position: "absolute",
    left: x,
    top: y + mix(4, 0, p),
    height: 34,
    borderRadius: radius.pill,
    opacity: p,
    display: "flex",
    alignItems: "center",
    padding: "0 14px",
  };
  return layer === "graphics" ? (
    <div style={{ ...box, backgroundColor: tint }}>
      <span style={{ ...label, visibility: "hidden" }}>{text}</span>
    </div>
  ) : (
    <div style={box}>
      <span style={{ ...label, color: textColor }}>{text}</span>
    </div>
  );
};

// ─── the world ───────────────────────────────────────────────────────────────

const anchorOf = (r: L.WorldRect): WorldPoint => L.centreOf(r);

export const World = ({
  state,
  layer,
}: {
  readonly state: WorldState;
  readonly layer: WorldLayer;
}) => {
  const text = layer === "text";
  const requestPose = state.request?.pose ?? null;

  return (
    <AbsoluteFill>
      {/* Workspace chrome — background plane, top-left. */}
      <Depth factor={depth.background}>
        {text ? (
          <div
            style={{
              ...capsText,
              position: "absolute",
              left: L.CHROME_LINE.x,
              top: L.CHROME_LINE.y,
              fontSize: 15,
              letterSpacing: tracking.wide,
              textTransform: "none",
              color: color.ink,
            }}
          >
            {COPY.chrome}
          </div>
        ) : null}
        <div style={placeAt(L.STAT_LINE.x, L.STAT_LINE.y, SIZES.statLine)}>
          <StatLine layer={layer} segments={state.statSegments} emphasis={state.statEmphasis} />
        </div>
      </Depth>

      {/* Intake column. */}
      <Depth factor={depth.mid} anchor={anchorOf(L.INTAKE_COLUMN)}>
        <div style={placeAt(L.INTAKE_COLUMN.x, L.INTAKE_COLUMN.y, SIZES.intakeColumn)}>
          <IntakeColumn layer={layer} cards={state.intakeCards} />
        </div>
      </Depth>

      {/* Reconciliation cluster — materialises when reconciliation runs. */}
      {state.reconPresence > 0 ? (
        <div style={{ opacity: clamp01(state.reconPresence) }}>
          <Depth factor={MATCH_PANE_DEPTH} anchor={anchorOf(L.MATCH_PANE_TALLY)}>
            <div style={placeAt(L.MATCH_PANE_TALLY.x, L.MATCH_PANE_TALLY.y, SIZES.matchPane)}>
              <MatchPane
                layer={layer}
                label={COPY.beat2.paneTally}
                value={INVOICE_TRAP.tally}
                emphasisChar={INVOICE_TRAP.tallySeparator}
                emphasisProgress={state.paneEmphasis}
              />
            </div>
          </Depth>
          <Depth factor={MATCH_GLYPH_DEPTH} anchor={anchorOf(L.MATCH_GLYPH)}>
            <div style={placeAt(L.MATCH_GLYPH.x, L.MATCH_GLYPH.y, SIZES.matchGlyph)}>
              <MatchGlyph layer={layer} state={state.glyphFlip >= 1 ? "match" : "mismatch"} flipProgress={state.glyphFlip} />
            </div>
          </Depth>
          <Depth factor={MATCH_PANE_DEPTH} anchor={anchorOf(L.MATCH_PANE_ICEGATE)}>
            <div style={placeAt(L.MATCH_PANE_ICEGATE.x, L.MATCH_PANE_ICEGATE.y, SIZES.matchPane)}>
              <MatchPane
                layer={layer}
                label={COPY.beat2.paneIcegate}
                value={INVOICE_TRAP.icegate}
                emphasisChar={INVOICE_TRAP.icegateSeparator}
                emphasisProgress={state.paneEmphasis}
              />
            </div>
          </Depth>
          <Depth factor={MATCH_PANE_DEPTH} anchor={{ x: 1020, y: 740 }}>
            {/* SB005 verdict chip, typed correction, reviewer chip, consequence. */}
            <ChipRow
              layer={layer}
              x={L.RECON_CHIP_ROW.x}
              y={L.RECON_CHIP_ROW.y}
              text={DISPLAY.sb005Chip}
              progress={state.sb005ChipProgress}
              tint={rgba(stateColor.BLOCKED, 0.12)}
              textColor={stateColor.BLOCKED}
              mono
            />
            {state.correctionChars > 0 && text ? (
              <div
                style={{
                  ...baseTextStyle,
                  position: "absolute",
                  left: L.RECON_CHIP_ROW.x + 4,
                  top: L.RECON_REVIEWER_CHIP.y + 8,
                  fontFamily: fontFamily.mono,
                  fontWeight: fontWeight.regular,
                  fontSize: 16,
                  color: color.ink,
                }}
              >
                {INVOICE_TRAP.tally.slice(0, Math.floor(state.correctionChars))}
                {state.correctionChars < INVOICE_TRAP.tally.length ? (
                  <span
                    style={{
                      display: "inline-block",
                      width: 2,
                      height: 16,
                      marginLeft: 1,
                      backgroundColor: color.ink,
                      verticalAlign: "text-bottom",
                    }}
                  />
                ) : null}
              </div>
            ) : null}
            <ChipRow
              layer={layer}
              x={L.RECON_REVIEWER_CHIP.x}
              y={L.RECON_REVIEWER_CHIP.y}
              text={COPY.beat2.reviewerChip}
              progress={state.reviewerChipProgress}
              tint={rgba(color.navy, 0.06)}
              textColor={color.inkDim}
              caps={false}
            />
            {text ? (
              <div
                style={{
                  ...baseTextStyle,
                  position: "absolute",
                  left: L.RECON_CONSEQUENCE_ROW.x,
                  top: L.RECON_CONSEQUENCE_ROW.y + 34 + mix(8, 0, clamp01(state.consequenceProgress)),
                  maxWidth: 760,
                  fontFamily: fontFamily.display,
                  fontWeight: fontWeight.regular,
                  fontSize: 25,
                  lineHeight: 1.3,
                  color: color.ink,
                  opacity: clamp01(state.consequenceProgress),
                }}
              >
                {COPY.beat2.consequence}
              </div>
            ) : null}
          </Depth>
        </div>
      ) : null}

      {/* Rule card L2-R03 — persistent, honest UNCLEAR from frame 0. */}
      <Depth factor={RULE_CARD_DEPTH} anchor={anchorOf(L.RULE_CARD)}>
        <div style={placeAt(L.RULE_CARD.x, L.RULE_CARD.y, SIZES.ruleCard)}>
          <RuleCard
            layer={layer}
            title={DISPLAY.ruleCardL2R03}
            state={state.ruleCard.state}
            flipProgress={state.ruleCard.flip}
            missingInput={COPY.beat3.missingInput}
            missingOpacity={state.ruleCard.missingOpacity}
            fields={COPY.beat4.extractedFields}
            fieldProgress={state.ruleCard.fieldProgress}
          />
        </div>
      </Depth>

      {/* Readiness matrix. */}
      <Depth factor={depth.mid} anchor={anchorOf(L.READINESS_MATRIX)}>
        <div style={placeAt(L.READINESS_MATRIX.x, L.READINESS_MATRIX.y, SIZES.readinessMatrix)}>
          <ReadinessMatrix
            layer={layer}
            rows={state.matrix.rows}
            rowProgress={state.matrix.rowProgress}
            aggregate={COPY.beat5.aggregate}
            defensibility={COPY.beat5.defensibility}
            overrideLog={COPY.beat5.overrideLog}
            aggregateProgress={state.matrix.aggregateProgress}
          />
        </div>
      </Depth>

      {/* Seal surface. */}
      <Depth factor={depth.mid} anchor={anchorOf(L.SEAL_SURFACE)}>
        <div style={placeAt(L.SEAL_SURFACE.x, L.SEAL_SURFACE.y, SIZES.sealSurface)}>
          <SealSurface
            layer={layer}
            buttonLabel={COPY.beat6.sealButton}
            buttonState={state.seal.buttonState}
            buttonEmphasis={state.seal.buttonEmphasis}
            stampProgress={state.seal.stampProgress}
            badgeProgress={state.seal.badgeProgress}
            hashText={DISPLAY.sealHash}
            hashProgress={state.seal.hashProgress}
            sealLine={COPY.beat6.sealLine}
            sealLineProgress={state.seal.sealLineProgress}
          />
        </div>
      </Depth>

      {/* Packet tray — materialises as the seal produces its outputs. */}
      {state.packets.presence > 0 ? (
        <Depth factor={depth.mid} anchor={anchorOf(L.PACKET_TRAY)}>
          <div style={placeAt(L.PACKET_TRAY.x, L.PACKET_TRAY.y, { width: L.PACKET_TRAY.width, height: L.PACKET_TRAY.height })}>
            <PacketTray
              layer={layer}
              packets={COPY.beat7.packets}
              presence={state.packets.presence}
              offsets={state.packets.offsets}
              labelProgress={state.packets.labelProgress}
            />
          </div>
        </Depth>
      ) : null}

      {/* Supplier surface — slides in from the far right (Beat 4). */}
      {state.supplier.presence > 0 ? (
        <Depth
          factor={depth.mid}
          anchor={{ x: state.supplierX + SIZES.supplierSurface.width / 2, y: L.SUPPLIER_SURFACE.y + SIZES.supplierSurface.height / 2 }}
        >
          <div style={{ ...placeAt(state.supplierX, L.SUPPLIER_SURFACE.y, SIZES.supplierSurface), opacity: clamp01(state.supplier.presence) }}>
            <SupplierSurface
              layer={layer}
              name={CELL_SUPPLIER.name}
              city={CELL_SUPPLIER.city}
              steps={COPY.beat4.responderSteps}
              stepProgress={state.supplier.stepProgress}
              attachmentFilename={UN38_3.returnedFilename}
              attachmentProgress={state.supplier.attachmentProgress}
            />
          </div>
        </Depth>
      ) : null}

      {/* The request card — born beside the rule card, travels the corridor. */}
      {state.request && requestPose && requestPose.opacity > 0 ? (
        <Depth
          factor={REQUEST_CARD_DEPTH}
          anchor={{ x: requestPose.x + SIZES.requestCard.width / 2, y: requestPose.y + SIZES.requestCard.height / 2 }}
        >
          <div style={{ ...placeAt(requestPose.x, requestPose.y, SIZES.requestCard), opacity: clamp01(requestPose.opacity) }}>
            <RequestCard
              layer={layer}
              lines={[
                { label: COPY.beat4.requestLabels.to, value: COPY.beat4.request.to },
                { label: COPY.beat4.requestLabels.requested, value: COPY.beat4.request.requested },
                { label: COPY.beat4.requestLabels.requiredFor, value: COPY.beat4.request.requiredFor },
                { label: COPY.beat4.requestLabels.scope, value: COPY.beat4.request.scope },
              ]}
              typedChars={state.request.typedChars}
              buttonLabel={COPY.beat4.approveButton}
              buttonState={state.request.buttonState}
              buttonEmphasis={state.request.buttonEmphasis}
              approvedChip={COPY.beat4.approvedChip}
              approvedChipProgress={state.request.chipProgress}
            />
          </div>
        </Depth>
      ) : null}

      {/* The returned UN 38.3 PDF — travels back across the whole workspace. */}
      {state.returnChip && state.returnChip.opacity > 0 ? (
        <Depth
          factor={depth.foreground}
          anchor={{ x: state.returnChip.x + L.RETURN_CHIP_SIZE.width / 2, y: state.returnChip.y + L.RETURN_CHIP_SIZE.height / 2 }}
        >
          <div
            style={{
              ...placeAt(state.returnChip.x, state.returnChip.y, L.RETURN_CHIP_SIZE),
              opacity: clamp01(state.returnChip.opacity),
            }}
          >
            {layer === "graphics" ? (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: radius.chip,
                  border: `1px solid ${color.rule}`,
                  backgroundColor: rgba(color.navy, 0.05),
                }}
              />
            ) : (
              <div
                style={{
                  ...baseTextStyle,
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: fontFamily.mono,
                  fontWeight: fontWeight.regular,
                  fontSize: 13,
                  color: color.ink,
                }}
              >
                {UN38_3.returnedFilename}
              </div>
            )}
          </div>
        </Depth>
      ) : null}

      {/* In-world sharp chrome (cursors) — text plane only. */}
      {text ? state.worldChrome ?? null : null}
    </AbsoluteFill>
  );
};
