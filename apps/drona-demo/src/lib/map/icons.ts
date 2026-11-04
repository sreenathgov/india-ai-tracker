/**
 * The map's icon grammar, as SVG data URLs.
 *
 * Three kinds of place, three silhouettes — so the plant, a buyer and a supplier are
 * told apart by shape before colour is read:
 *
 *   plant     maroon rounded square, white factory      — the one place we own
 *   buyer     white disc, ink hairline and flag           — where an order lands
 *   supplier  the concern shape (disc ◆ ▲) in its hue,   — concern first, then
 *             white glyph for what they supply              what they make
 *   cluster   white disc, ring in the worst concern hue  — count drawn on top
 *   upstream  small neutral mark, filled / ring / hollow — evidence, not concern
 *   subtier   the upstream mark with a role glyph, a     — what they supply, and
 *             neutral corner tab if flagged                 whether anything is noted
 *
 * The supplier's outer shape is `ConcernMark`'s ladder, so the map and every panel
 * say "critical" the same way. Drawn once per (shape × colour × glyph) and cached;
 * no image files ship with the app.
 *
 * Pure. No React, no DOM.
 */
import type { EvidenceFill } from "./epistemic";
import { toCss, type MapPalette } from "./palette";
import type { SubTierRole } from "@/lib/network/subtier";
import type { Concern, SupplyCategory } from "@/lib/network/types";

export interface MapIcon {
  readonly id: string;
  readonly url: string;
  readonly width: number;
  readonly height: number;
  readonly anchorY: number;
}

/** Icon raster size. Drawn at 2× the on-screen size so it stays crisp on Retina. */
const PX = 64;

const svgUrl = (body: string, size = PX): string =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 32 32">${body}</svg>`
  )}`;

const icon = (id: string, body: string): MapIcon => ({
  id,
  url: svgUrl(body),
  width: PX,
  height: PX,
  anchorY: PX / 2,
});

/* ── Supplier: concern shape, category glyph ──────────────────────────────────
   Shapes are ConcernMark's 16-unit paths at 2× — the same ladder, not a lookalike.
   A white keyline separates overlapping marks and lifts them off pale land. */
const CONCERN_SHAPE: Record<Concern, string> = {
  low: "M 16 5.4 A 10.6 10.6 0 1 1 15.98 5.4 Z",
  elevated: "M 16 3.4 L 28.6 16 L 16 28.6 L 3.4 16 Z",
  critical: "M 16 3 L 29.4 27.6 L 2.6 27.6 Z",
};

/** Where the glyph sits: a triangle's visual centre is well below its box centre. */
const GLYPH_ORIGIN: Record<Concern, readonly [number, number]> = {
  low: [10, 10],
  elevated: [10, 10],
  critical: [10, 13.2],
};

/* Glyphs in a 12-unit box, white, stroke-first so they survive at 20px. */
const GLYPH: Record<SupplyCategory, string> = {
  Drivetrain:
    '<circle cx="6" cy="6" r="2.4" fill="none"/><path d="M6 .9v2M6 9.1v2M.9 6h2M9.1 6h2M2.4 2.4l1.4 1.4M8.2 8.2l1.4 1.4M2.4 9.6l1.4-1.4M8.2 3.8l1.4-1.4"/>',
  Rotor: '<path d="M6 6V.8M6 6 1.5 8.6M6 6l4.5 2.6"/><circle cx="6" cy="6" r="1.4" fill="#fff" stroke="none"/>',
  Nacelle: '<rect x=".8" y="3.6" width="10.4" height="4.8" rx="2.4" fill="none"/><path d="M3.6 3.6v4.8"/>',
  Electrical: '<path d="M7.2.6 2.6 6.8h3.3L4.8 11.4l4.6-6.2H6.1Z" fill="#fff" stroke-width="0.6"/>',
  Tower: '<path d="M6 .8 3.4 11.2M6 .8l2.6 10.4M4.2 7.8h3.6M4.9 4.6h2.2M2.4 11.2h7.2"/>',
  Controls:
    '<rect x="3" y="3" width="6" height="6" rx="1" fill="none"/><path d="M4.6 .8V3M7.4 .8V3M4.6 9v2.2M7.4 9v2.2M.8 4.6H3M.8 7.4H3M9 4.6h2.2M9 7.4h2.2"/>',
};

const glyph = (category: SupplyCategory, concern: Concern): string => {
  const [x, y] = GLYPH_ORIGIN[concern];
  return `<g transform="translate(${x} ${y})" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none">${GLYPH[category]}</g>`;
};

/* ── Cache ─────────────────────────────────────────────────────────────────────
   deck.gl packs icons into an atlas keyed by `id`; returning the same object for
   the same id keeps that atlas from being rebuilt every frame. */
const cache = new Map<string, MapIcon>();
const cached = (id: string, build: () => string): MapIcon => {
  const hit = cache.get(id);
  if (hit) return hit;
  const made = icon(id, build());
  cache.set(id, made);
  return made;
};

const key = (palette: MapPalette, ...parts: readonly unknown[]): string =>
  [...parts, palette.plant.join(","), palette.concern.critical.join(",")].join("|");

export function supplierIcon(
  palette: MapPalette,
  concern: Concern,
  category: SupplyCategory
): MapIcon {
  return cached(key(palette, "supplier", concern, category), () => {
    const fill = toCss(palette.concern[concern]);
    return `<path d="${CONCERN_SHAPE[concern]}" fill="${fill}" stroke="#fff" stroke-width="2" stroke-linejoin="round"/>${glyph(category, concern)}`;
  });
}

export function plantIcon(palette: MapPalette): MapIcon {
  return cached(key(palette, "plant"), () => {
    const fill = toCss(palette.plant);
    return `<rect x="2" y="2" width="28" height="28" rx="7" fill="${fill}" stroke="#fff" stroke-width="2"/><path d="M8 23V14.5l4.5 2.8v-2.8l4.5 2.8v-2.8l4.5 2.8V9h2.5v14Z" fill="#fff"/>`;
  });
}

export function buyerIcon(palette: MapPalette): MapIcon {
  return cached(key(palette, "buyer", palette.buyer.join(",")), () => {
    const fill = toCss(palette.buyer);
    /* A white disc with an ink hairline and ink flag: a destination is a place to
       read, not a warning, so it sits lighter than the concern markers. */
    return `<circle cx="16" cy="16" r="12.5" fill="#fff" stroke="${fill}" stroke-width="1.75"/><path d="M12.5 21.5V10.5M12.5 11h7l-1.7 2.6 1.7 2.6h-7" stroke="${fill}" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;
  });
}

export function clusterIcon(palette: MapPalette, worst: Concern): MapIcon {
  return cached(key(palette, "cluster", worst), () => {
    const ring = toCss(palette.concern[worst]);
    return `<circle cx="16" cy="16" r="15" fill="#26221c" fill-opacity="0.06"/><circle cx="16" cy="16" r="12.5" fill="#fff" stroke="${ring}" stroke-width="2.25"/>`;
  });
}

export function upstreamIcon(palette: MapPalette, fill: EvidenceFill): MapIcon {
  return cached(key(palette, "upstream", fill, palette.upstream.join(",")), () => {
    const ink = toCss(palette.upstream);
    if (fill === "solid") {
      return `<rect x="7" y="7" width="18" height="18" rx="4" fill="${ink}" stroke="#fff" stroke-width="2"/>`;
    }
    if (fill === "ring") {
      return `<rect x="7" y="7" width="18" height="18" rx="4" fill="#fff" stroke="${ink}" stroke-width="3.5"/>`;
    }
    return `<rect x="7.5" y="7.5" width="17" height="17" rx="4" fill="none" stroke="${ink}" stroke-width="2" stroke-dasharray="2 2.6"/>`;
  });
}

/* ── Sub-tier: evidence mark, role glyph ───────────────────────────────────────
   The upstream square, so a sub-tier party reads as evidence rather than concern,
   with what it supplies drawn inside. Glyphs sit in a 10-unit box, stroked in
   whatever contrasts with the fill: white on solid, ink on ring and hollow. */
const ROLE_GLYPH: Record<SubTierRole, string> = {
  "raw-material": '<path d="M.8 8.2h8.4L7.6 2.8H2.4Z"/>',
  "alloy-chemical": '<path d="M3.4 1h3.2M4 1v3L1.2 8.4a.7.7 0 0 0 .6 1h6.4a.7.7 0 0 0 .6-1L6 4V1"/>',
  consumable:
    '<circle cx="2.4" cy="7.2" r="1.3"/><circle cx="7.6" cy="7.2" r="1.3"/><circle cx="5" cy="2.8" r="1.3"/>',
  "process-service": '<circle cx="6.6" cy="3.4" r="2.2"/><path d="M5 5 1.2 8.8"/>',
  logistics:
    '<path d="M.8 2.4h5.4v5H.8ZM6.2 4.2h1.9l1.3 1.7v1.5H6.2"/><circle cx="2.8" cy="8.6" r=".7"/><circle cx="7.6" cy="8.6" r=".7"/>',
  distributor: '<path d="M.8 9.2V4L5 1.2 9.2 4v5.2M3.3 9.2V6.2h3.4v3"/>',
};

export interface SubTierMarks {
  /** Carries at least one signal — a neutral corner tab, never a concern hue. */
  readonly flagged: boolean;
  /** The one party whose failure stops the Tier-1 — the only critical ink here. */
  readonly weakLink: boolean;
  /** Outside India — a small outbound arrow. */
  readonly abroad: boolean;
}

export function subtierIcon(
  palette: MapPalette,
  fill: EvidenceFill,
  role: SubTierRole,
  marks: SubTierMarks
): MapIcon {
  const { flagged, weakLink, abroad } = marks;
  return cached(
    key(palette, "subtier", fill, role, flagged, weakLink, abroad, palette.upstream.join(",")),
    () => {
      const ink = toCss(palette.upstream);
      const critical = toCss(palette.concern.critical);
      const glyphInk = fill === "solid" ? "#fff" : ink;
      const parts: string[] = [];
      if (weakLink) {
        parts.push(
          `<rect x="3" y="3" width="26" height="26" rx="8" fill="#fff" stroke="${critical}" stroke-width="2.6"/>`
        );
      }
      parts.push(upstreamBody(fill, ink));
      parts.push(
        `<g transform="translate(11 11)" stroke="${glyphInk}" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" fill="none">${ROLE_GLYPH[role]}</g>`
      );
      if (flagged) {
        parts.push(`<path d="M20 2.6h9.4V12Z" fill="${ink}" stroke="#fff" stroke-width="1.4" stroke-linejoin="round"/>`);
      }
      if (abroad) {
        parts.push(
          `<path d="M3 29 8.6 23.4M4.8 23.4h3.8v3.8" stroke="#fff" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M3 29 8.6 23.4M4.8 23.4h3.8v3.8" stroke="${ink}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`
        );
      }
      return parts.join("");
    }
  );
}

function upstreamBody(fill: EvidenceFill, ink: string): string {
  if (fill === "solid") {
    return `<rect x="7" y="7" width="18" height="18" rx="4" fill="${ink}" stroke="#fff" stroke-width="2"/>`;
  }
  if (fill === "ring") {
    return `<rect x="7" y="7" width="18" height="18" rx="4" fill="#fff" stroke="${ink}" stroke-width="2.4"/>`;
  }
  return `<rect x="7.5" y="7.5" width="17" height="17" rx="4" fill="#fff" stroke="${ink}" stroke-width="1.8" stroke-dasharray="2 2.6"/>`;
}

/** For tests: the number of distinct icons drawn so far. */
export const iconCacheSize = (): number => cache.size;
