/**
 * Reconciliation still — review harness for MatchPane, MatchGlyph, RuleCard
 * and Caption in isolation (world/contract.tsx StillStage). Stacks each
 * component's graphics and text renders at a registered stage position so
 * both planes compose into the complete visual, the way <Depth>/<Camera>
 * would in the film. Still-only: not part of the film's frame timeline.
 */

import type { CSSProperties, ReactNode } from "react";
import { placeAt, SIZES, StillStage, type WorldLayer } from "../world/contract";
import { MatchPane } from "../world/MatchPane";
import { MatchGlyph } from "../world/MatchGlyph";
import { RuleCard, type ExtractedFieldRow } from "../world/RuleCard";
import { Caption } from "../chrome/Caption";
import { color } from "../design/tokens";
import { baseTextStyle, fontFamily, fontWeight, tracking } from "../design/type";
import { COPY, DISPLAY, INVOICE_TRAP } from "../data/shipment";

const STAGE = { width: 1920, height: 1080 } as const;

// Small ink-dim Telegraf labels — still-only harness chrome, per contract's
// StillStage review convention. Never rendered inside the film's world.
const labelStyle: CSSProperties = {
  ...baseTextStyle,
  position: "absolute",
  fontFamily: fontFamily.ui,
  fontWeight: fontWeight.regular,
  fontSize: 12,
  letterSpacing: tracking.caps,
  textTransform: "uppercase",
  color: color.inkDim,
};

/** Stacks a world component's graphics + text renders at a fixed stage box. */
const Instance = ({
  x,
  y,
  size,
  label,
  render,
}: {
  readonly x: number;
  readonly y: number;
  readonly size: { readonly width: number; readonly height: number };
  readonly label: string;
  readonly render: (layer: WorldLayer) => ReactNode;
}) => (
  <>
    <div style={{ ...labelStyle, left: x, top: y - 20 }}>{label}</div>
    <div style={placeAt(x, y, size)}>{render("graphics")}</div>
    <div style={placeAt(x, y, size)}>{render("text")}</div>
  </>
);

const RULE_CARD_FIELDS: readonly ExtractedFieldRow[] = COPY.beat4.extractedFields;

export const ReconciliationStill = () => (
  <StillStage width={STAGE.width} height={STAGE.height}>
    <Instance
      x={60}
      y={80}
      size={SIZES.matchPane}
      label="MatchPane · emphasis 0"
      render={(layer) => (
        <MatchPane
          layer={layer}
          label={COPY.beat2.paneTally}
          value={INVOICE_TRAP.tally}
          emphasisChar={INVOICE_TRAP.tallySeparator}
          emphasisProgress={0}
        />
      )}
    />
    <Instance
      x={820}
      y={80}
      size={SIZES.matchPane}
      label="MatchPane · emphasis 1"
      render={(layer) => (
        <MatchPane
          layer={layer}
          label={COPY.beat2.paneIcegate}
          value={INVOICE_TRAP.icegate}
          emphasisChar={INVOICE_TRAP.icegateSeparator}
          emphasisProgress={1}
        />
      )}
    />

    <Instance
      x={60}
      y={280}
      size={SIZES.matchGlyph}
      label="MatchGlyph · flip 0"
      render={(layer) => <MatchGlyph layer={layer} state="mismatch" flipProgress={0} />}
    />
    <Instance
      x={220}
      y={280}
      size={SIZES.matchGlyph}
      label="MatchGlyph · flip 0.5"
      render={(layer) => <MatchGlyph layer={layer} state="mismatch" flipProgress={0.5} />}
    />
    <Instance
      x={380}
      y={280}
      size={SIZES.matchGlyph}
      label="MatchGlyph · flip 1"
      render={(layer) => <MatchGlyph layer={layer} state="match" flipProgress={1} />}
    />

    <Instance
      x={60}
      y={460}
      size={SIZES.ruleCard}
      label="RuleCard · Beat 3 UNCLEAR"
      render={(layer) => (
        <RuleCard
          layer={layer}
          title={DISPLAY.ruleCardL2R03}
          state="UNCLEAR"
          flipProgress={0}
          missingInput={COPY.beat3.missingInput}
          missingOpacity={1}
          fields={RULE_CARD_FIELDS}
          fieldProgress={[0, 0]}
        />
      )}
    />
    <Instance
      x={700}
      y={460}
      size={SIZES.ruleCard}
      label="RuleCard · Beat 4d OPEN"
      render={(layer) => (
        <RuleCard
          layer={layer}
          title={DISPLAY.ruleCardL2R03}
          state="OPEN"
          flipProgress={1}
          missingInput={COPY.beat3.missingInput}
          missingOpacity={0}
          fields={RULE_CARD_FIELDS}
          fieldProgress={[1, 1]}
        />
      )}
    />

    <div style={{ ...labelStyle, left: 60, top: 780 }}>Caption · beat3, progress 1</div>
    <div style={{ position: "absolute", left: 60, top: 800, width: 880 }}>
      <Caption text={COPY.captions.beat3} progress={1} />
    </div>
  </StillStage>
);
