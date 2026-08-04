/**
 * World geography — the one continuous coordinate space (Bible §4.1).
 *
 * World units equal viewport pixels at camera scale 1; the rest pose shows
 * x 0..1920, y 0..1080 centred at (960, 540). Everything below exists from
 * frame 0 (surfaces persist; the camera reveals them). The supplier surface
 * lives far right across an always-empty travel corridor — the Beat 4
 * expansion move is the only time the camera goes there.
 *
 * Layout math the beats depend on:
 * - Beat 2 push (1.9) centres the reconciliation cluster; the cluster is on
 *   the foreground depth plane, and a centred anchor has zero parallax
 *   displacement, so it lands exactly.
 * - Beat 5 pull (0.92) must show the stat line (y ~104), the matrix bottom
 *   (y 1140) and the intake column: camera (1130, 660) covers y 73..1247,
 *   x 87..2173 — the 7 px shaved off the intake/matrix outer borders is
 *   invisible under the frame edge.
 * - The corridor x 2180..2760 stays empty at all times: the request card
 *   and the returned PDF cross it, and nothing else may sit in it.
 */

import { SIZES } from "./contract";

export interface WorldRect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

const rect = (
  x: number,
  y: number,
  size: { readonly width: number; readonly height: number }
): WorldRect => ({ x, y, width: size.width, height: size.height });

export const centreOf = (r: WorldRect): { x: number; y: number } => ({
  x: r.x + r.width / 2,
  y: r.y + r.height / 2,
});

// ─── workspace chrome (top-left, background plane) ───────────────────────────

export const CHROME_LINE = { x: 80, y: 48 } as const;
export const STAT_LINE = rect(80, 92, SIZES.statLine);

// ─── exporter workspace ──────────────────────────────────────────────────────

/** Intake column — Beats 0/1, and the UN 38.3 row again in Beats 3/4d. */
export const INTAKE_COLUMN = rect(80, 150, SIZES.intakeColumn);

/** Reconciliation cluster — Beat 2. Two panes, glyph between, chips below. */
export const MATCH_PANE_TALLY = rect(660, 300, SIZES.matchPane);
export const MATCH_GLYPH = rect(1022, 442, SIZES.matchGlyph);
export const MATCH_PANE_ICEGATE = rect(660, 564, SIZES.matchPane);
/** SB005 chip, then correction + reviewer chip on a second row, then the
 * consequence line — stacked so nothing collides with the matrix (x ≥ 1300)
 * and the whole cluster stays inside the Beat 2 viewport (y ≤ 844). */
export const RECON_CHIP_ROW = { x: 660, y: 688 } as const;
export const RECON_REVIEWER_CHIP = { x: 830, y: 726 } as const;
export const RECON_CONSEQUENCE_ROW = { x: 660, y: 736 } as const;
/** The whole cluster, as the Beat 2 focus rect. */
export const RECON_CLUSTER: WorldRect = { x: 640, y: 280, width: 760, height: 570 };

/** Rule card L2-R03 — Beats 3 and 4d. */
export const RULE_CARD = rect(660, 860, SIZES.ruleCard);

/** Readiness matrix — Beat 5. */
export const READINESS_MATRIX = rect(1300, 680, SIZES.readinessMatrix);

/** Seal surface — Beat 6. */
export const SEAL_SURFACE = rect(1460, 140, SIZES.sealSurface);

/** Packet tray — materialises at the seal's foot late in Beat 6, in the zone
 * the request card vacated (no simultaneous overlap). */
export const PACKET_TRAY = rect(
  1400,
  1220,
  { width: SIZES.packetCard.width, height: SIZES.packetCard.height * 2 + 24 }
);

// ─── the supplier side (Beat 4) ──────────────────────────────────────────────

/** Where the request card is composed (Beat 4a) — right of the rule card,
 * clear of matrix (above) and packet tray timing (tray appears after the
 * card has left). */
export const REQUEST_CARD_BIRTH = rect(1320, 1200, SIZES.requestCard);

/** Supplier surface rest position; it slides in from SUPPLIER_ENTER_X. */
export const SUPPLIER_SURFACE = rect(2760, 260, SIZES.supplierSurface);
export const SUPPLIER_ENTER_X = 3560;

/** Where the request card docks on the supplier surface (Beat 4c). */
export const REQUEST_CARD_DOCK = { x: 2840, y: 320 } as const;

/** The returned PDF chip: born at the supplier, lands on the UN 38.3 row. */
export const RETURN_CHIP_SIZE = { width: 300, height: 52 } as const;
export const RETURN_CHIP_FROM = { x: 2980, y: 780 } as const;

// ─── beat frame ranges (Bible §5 — exact) ────────────────────────────────────

export const BEAT = {
  coldOpen: { from: 0, to: 240 },
  intake: { from: 240, to: 780 },
  sb005: { from: 780, to: 1200 },
  unclear: { from: 1200, to: 1440 },
  supplierLoop: { from: 1440, to: 2040 },
  readiness: { from: 2040, to: 2280 },
  seal: { from: 2280, to: 2520 },
  dispatch: { from: 2520, to: 2700 },
  total: 2700,
} as const;
