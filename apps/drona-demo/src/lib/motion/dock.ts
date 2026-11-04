/**
 * Where a contextual panel floats: docked beside the card that summoned it, so the
 * panel reads as that card's extension rather than as a modal from nowhere. Pure
 * geometry — the overlay measures the card and the viewport and applies the result.
 */
import type { Rect } from "./flip";

export interface Viewport {
  readonly width: number;
  readonly height: number;
}

export type DockSide = "left" | "right" | "center";

export interface DockPlacement {
  readonly side: DockSide;
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly maxHeight: number;
}

/**
 * Page margin, the gap between card and panel, the least height a panel needs, and
 * the share of its width that must be free beside the card before it tucks there.
 */
export const DOCK = { margin: 16, gap: 16, minHeight: 420, centredTop: 0.09, tuckShare: 0.75 } as const;

const clamp = (n: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, n));

function dockTop(originTop: number, viewport: Viewport): number {
  const highest = viewport.height - DOCK.margin - DOCK.minHeight;
  return Math.round(clamp(originTop, DOCK.margin, Math.max(DOCK.margin, highest)));
}

function centred(viewport: Viewport, width: number, top: number): DockPlacement {
  const w = Math.min(width, viewport.width - DOCK.margin * 2);
  return {
    side: "center",
    left: Math.round((viewport.width - w) / 2),
    top,
    width: w,
    maxHeight: viewport.height - top - DOCK.margin,
  };
}

export function dockPanel(origin: Rect | null, viewport: Viewport, width: number): DockPlacement {
  if (!origin) {
    return centred(viewport, width, Math.max(DOCK.margin, Math.round(viewport.height * DOCK.centredTop)));
  }
  const top = dockTop(origin.y, viewport);
  const need = width + DOCK.gap + DOCK.margin;
  const roomLeft = origin.x;
  const roomRight = viewport.width - (origin.x + origin.width);
  const fitsLeft = roomLeft >= need;
  const fitsRight = roomRight >= need;
  const maxHeight = viewport.height - top - DOCK.margin;

  if (fitsLeft && (!fitsRight || roomLeft >= roomRight)) {
    return { side: "left", left: origin.x - DOCK.gap - width, top, width, maxHeight };
  }
  if (fitsRight) {
    return { side: "right", left: origin.x + origin.width + DOCK.gap, top, width, maxHeight };
  }
  /* A little short on the roomier side: tuck against the page margin and let the
     panel overlap the card's edge, rather than centring it over the whole card. */
  const tuckLeft = roomLeft >= roomRight;
  if (Math.max(roomLeft, roomRight) >= width * DOCK.tuckShare) {
    const w = Math.min(width, viewport.width - DOCK.margin * 2);
    const left = tuckLeft ? DOCK.margin : viewport.width - DOCK.margin - w;
    return { side: tuckLeft ? "left" : "right", left, top, width: w, maxHeight };
  }
  return centred(viewport, width, top);
}

/**
 * The veil over the page with the summoning card cut out of it, as an even-odd
 * `clip-path: path()` — so the card stays lit and sharp while the canvas dims and
 * softens around it. The inner contour is a rounded rect matching the card.
 */
export function spotlightPath(viewport: Viewport, rect: Rect, radius: number): string {
  const r = Math.min(radius, rect.width / 2, rect.height / 2);
  const { x, y, width: w, height: h } = rect;
  const n = (v: number): number => Math.round(v * 10) / 10;
  return [
    `M0 0H${n(viewport.width)}V${n(viewport.height)}H0Z`,
    `M${n(x + r)} ${n(y)}H${n(x + w - r)}A${n(r)} ${n(r)} 0 0 1 ${n(x + w)} ${n(y + r)}`,
    `V${n(y + h - r)}A${n(r)} ${n(r)} 0 0 1 ${n(x + w - r)} ${n(y + h)}`,
    `H${n(x + r)}A${n(r)} ${n(r)} 0 0 1 ${n(x)} ${n(y + h - r)}`,
    `V${n(y + r)}A${n(r)} ${n(r)} 0 0 1 ${n(x + r)} ${n(y)}Z`,
  ].join("");
}
