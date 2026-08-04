/**
 * IntakeColumn — the frame that holds the seven intake rows (Bible §5 Beat 1).
 *
 * No header text: the Bible gives none for Beat 1, and inventing one would
 * violate contract.tsx rule 4 (every string comes from data/shipment.ts).
 * The header zone is a blank band closed off by a hairline rule.
 */

import { DocumentCard, type DocumentCardChannels } from "./DocumentCard";
import { INTAKE, SIZES, intakeSlotRect, placeAt, type LayerProps } from "./contract";
import { color, depth, radius, rgba } from "../design/tokens";

export interface IntakeColumnProps extends LayerProps {
  readonly cards: readonly DocumentCardChannels[];
}

export const INTAKE_COLUMN_DEPTH = depth.mid;

export const IntakeColumn = ({ layer, cards }: IntakeColumnProps) => {
  if (cards.length !== INTAKE.slotCount) {
    throw new Error(
      `IntakeColumn: expected ${INTAKE.slotCount} cards (Bible §5 Beat 1), got ${cards.length}.`
    );
  }

  const hairlineY = INTAKE.padding + INTAKE.headerHeight;

  return (
    <div
      style={{
        position: "relative",
        width: SIZES.intakeColumn.width,
        height: SIZES.intakeColumn.height,
      }}
    >
      {layer === "graphics" && (
        <>
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: SIZES.intakeColumn.width,
              height: SIZES.intakeColumn.height,
              borderRadius: radius.frame,
              border: `1px solid ${color.rule}`,
              backgroundColor: rgba(color.navy, 0.03),
            }}
          />
          <div
            style={{
              position: "absolute",
              left: INTAKE.padding,
              top: hairlineY,
              width: SIZES.intakeColumn.width - INTAKE.padding * 2,
              height: 1,
              backgroundColor: color.rule,
            }}
          />
        </>
      )}
      {cards.map((card, i) => {
        const rect = intakeSlotRect(i);
        return (
          <div key={`${i}-${card.filename}`} style={placeAt(rect.x, rect.y, SIZES.documentCard)}>
            <DocumentCard layer={layer} {...card} />
          </div>
        );
      })}
    </div>
  );
};
