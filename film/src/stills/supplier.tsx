/**
 * SupplierStill — Phase B review harness (Bible §7 Phase 2) for RequestCard
 * and SupplierSurface. Renders each component at several frozen progress
 * moments, graphics plane under text plane, in registered boxes on the
 * StillStage. Small ink-dim Telegraf caption labels are stills-only —
 * neither world component renders its own caption.
 */

import type { CSSProperties } from "react";
import { StillStage, placeAt, SIZES } from "../world/contract";
import { RequestCard, type RequestCardProps } from "../world/RequestCard";
import { SupplierSurface, type SupplierSurfaceProps } from "../world/SupplierSurface";
import { CELL_SUPPLIER, COPY, UN38_3 } from "../data/shipment";
import { color } from "../design/tokens";
import { baseTextStyle, fontFamily, fontWeight, tracking } from "../design/type";

// ─── props assembled exactly as Film.tsx will (Bible §5 Beat 4) ─────────────

const REQUEST_LINES = [
  { label: COPY.beat4.requestLabels.to, value: COPY.beat4.request.to },
  { label: COPY.beat4.requestLabels.requested, value: COPY.beat4.request.requested },
  { label: COPY.beat4.requestLabels.requiredFor, value: COPY.beat4.request.requiredFor },
  { label: COPY.beat4.requestLabels.scope, value: COPY.beat4.request.scope },
];

const REQUEST_TOTAL_CHARS = REQUEST_LINES.reduce((n, l) => n + l.value.length, 0);

const REQUEST_MOMENTS: readonly { readonly caption: string; readonly props: Omit<RequestCardProps, "layer"> }[] = [
  {
    caption: "4a · mid-typing, caret live",
    props: {
      lines: REQUEST_LINES,
      typedChars: REQUEST_LINES[0].value.length + 10,
      buttonLabel: COPY.beat4.approveButton,
      buttonState: "idle",
      buttonEmphasis: 0,
      approvedChip: COPY.beat4.approvedChip,
      approvedChipProgress: 0,
    },
  },
  {
    caption: "4b · fully typed, active cursor target",
    props: {
      lines: REQUEST_LINES,
      typedChars: REQUEST_TOTAL_CHARS,
      buttonLabel: COPY.beat4.approveButton,
      buttonState: "active",
      buttonEmphasis: 1,
      approvedChip: COPY.beat4.approvedChip,
      approvedChipProgress: 0,
    },
  },
  {
    caption: "4b · approved, chip in",
    props: {
      lines: REQUEST_LINES,
      typedChars: REQUEST_TOTAL_CHARS,
      buttonLabel: COPY.beat4.approveButton,
      buttonState: "approved",
      buttonEmphasis: 1,
      approvedChip: COPY.beat4.approvedChip,
      approvedChipProgress: 1,
    },
  },
];

const SUPPLIER_MOMENTS: readonly { readonly caption: string; readonly props: Omit<SupplierSurfaceProps, "layer"> }[] = [
  {
    caption: "4c · steps mid-cascade",
    props: {
      name: CELL_SUPPLIER.name,
      city: CELL_SUPPLIER.city,
      steps: COPY.beat4.responderSteps,
      stepProgress: [1, 0.5, 0],
      attachmentFilename: UN38_3.returnedFilename,
      attachmentProgress: 0,
    },
  },
  {
    caption: "4c · resolved, attachment in",
    props: {
      name: CELL_SUPPLIER.name,
      city: CELL_SUPPLIER.city,
      steps: COPY.beat4.responderSteps,
      stepProgress: [1, 1, 1],
      attachmentFilename: UN38_3.returnedFilename,
      attachmentProgress: 1,
    },
  },
];

// ─── stage layout (stills-only geometry) ─────────────────────────────────────

const ROW1_TOP = 50;
const ROW1_CAPTION_TOP = 24;
const ROW2_TOP = 450;
const ROW2_CAPTION_TOP = 424;
const CARD_GAP = 40;
const SURFACE_GAP = 60;

const requestLefts = (() => {
  const w = SIZES.requestCard.width;
  const totalWidth = 3 * w + 2 * CARD_GAP;
  const start = (1920 - totalWidth) / 2;
  return [start, start + w + CARD_GAP, start + 2 * (w + CARD_GAP)];
})();

const supplierLefts = (() => {
  const w = SIZES.supplierSurface.width;
  const totalWidth = 2 * w + SURFACE_GAP;
  const start = (1920 - totalWidth) / 2;
  return [start, start + w + SURFACE_GAP];
})();

const captionStyle = (left: number, top: number, width: number): CSSProperties => ({
  ...baseTextStyle,
  position: "absolute",
  left,
  top,
  width,
  fontFamily: fontFamily.ui,
  fontWeight: fontWeight.regular,
  fontSize: 13,
  letterSpacing: tracking.wide,
  textTransform: "uppercase",
  color: color.inkDim,
});

// ─── still ────────────────────────────────────────────────────────────────────

export const SupplierStill = () => (
  <StillStage width={1920} height={1080}>
    {REQUEST_MOMENTS.map((moment, i) => (
      <div key={moment.caption} style={placeAt(requestLefts[i], ROW1_TOP, SIZES.requestCard)}>
        <div style={captionStyle(0, ROW1_CAPTION_TOP - ROW1_TOP, SIZES.requestCard.width)}>{moment.caption}</div>
        <RequestCard layer="graphics" {...moment.props} />
        <RequestCard layer="text" {...moment.props} />
      </div>
    ))}
    {SUPPLIER_MOMENTS.map((moment, i) => (
      <div key={moment.caption} style={placeAt(supplierLefts[i], ROW2_TOP, SIZES.supplierSurface)}>
        <div style={captionStyle(0, ROW2_CAPTION_TOP - ROW2_TOP, SIZES.supplierSurface.width)}>{moment.caption}</div>
        <SupplierSurface layer="graphics" {...moment.props} />
        <SupplierSurface layer="text" {...moment.props} />
      </div>
    ))}
  </StillStage>
);
