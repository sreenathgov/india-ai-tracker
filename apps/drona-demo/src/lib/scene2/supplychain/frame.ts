import type { GraphLayout } from "./layout";

/**
 * Where the reader is standing, relative to the laid-out graph.
 *
 * The layout is fixed in its own coordinates; this is the only thing that moves.
 * Keeping it pure means the canvas component holds one piece of state and no maths,
 * and the fit rule — never magnify, only ever shrink to bring the whole path into
 * view — is a line that can be tested rather than a behaviour to be trusted.
 */
export interface Frame {
  readonly scale: number;
  readonly x: number;
  readonly y: number;
}

export const MIN_SCALE = 0.4;
/** Never above 1: a card drawn larger than its designed size loses its type scale. */
export const MAX_SCALE = 1;
/**
 * The smallest scale at which a card still reads.
 *
 * Below it, fitting the whole graph stops being a service: "All mapped" shrank to the
 * floor, was illegible, and still overflowed the canvas. So past this threshold the
 * canvas stops fitting and starts framing — it holds a readable size, opens on the
 * supplier under investigation, and lets the reader pan for the rest.
 */
export const LEGIBLE_SCALE = 0.62;

export const PAD = 32;

export const clampScale = (scale: number): number => Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));

export interface Viewport {
  readonly width: number;
  readonly height: number;
}

/**
 * Fit the graph to the canvas and centre it.
 *
 * A graph that already fits is left at full size and centred, rather than blown up
 * to fill the frame — the brief's "do not simply centre the graph with infinite
 * whitespace" is answered by the canvas being dense, not by stretching four cards
 * across a metre of screen.
 */
export function fitFrame(layout: GraphLayout, viewport: Viewport): Frame {
  if (layout.width <= 0 || layout.height <= 0 || viewport.width <= 0 || viewport.height <= 0) {
    return { scale: 1, x: 0, y: 0 };
  }
  const whole = Math.min((viewport.width - PAD * 2) / layout.width, (viewport.height - PAD * 2) / layout.height);
  if (whole >= LEGIBLE_SCALE) {
    const scale = clampScale(whole);
    return {
      scale,
      x: (viewport.width - layout.width * scale) / 2,
      y: (viewport.height - layout.height * scale) / 2,
    };
  }

  /* Too large to show whole: hold a readable size and open on the anchor instead. */
  const scale = LEGIBLE_SCALE;
  const anchor = layout.anchorId ? layout.boxes.get(layout.anchorId) : undefined;
  return {
    scale,
    x: axis(viewport.width, layout.width * scale, anchor ? anchor.cx * scale : 0),
    y: axis(viewport.height, layout.height * scale, anchor ? anchor.cy * scale : 0),
  };
}

/**
 * One axis of the framing rule: centre what fits, and otherwise put the anchor in the
 * middle without ever leaving a margin where there is still graph to show.
 */
function axis(viewport: number, content: number, anchor: number): number {
  if (content <= viewport) return (viewport - content) / 2;
  /* The far bound carries no padding: an edge you cannot reach the end of is not a
     margin, and reserving one there clips a further PAD of graph for nothing. */
  return Math.min(PAD, Math.max(viewport - content, viewport / 2 - anchor));
}

export const panBy = (frame: Frame, dx: number, dy: number): Frame => ({
  ...frame,
  x: frame.x + dx,
  y: frame.y + dy,
});

/**
 * Zoom about a point in canvas space, so whatever is under the pointer stays there.
 * Without this the graph appears to slide away while the reader is zooming into it.
 */
export function zoomAt(frame: Frame, factor: number, px: number, py: number): Frame {
  const scale = clampScale(frame.scale * factor);
  const ratio = scale / frame.scale;
  return { scale, x: px - (px - frame.x) * ratio, y: py - (py - frame.y) * ratio };
}

/** Bring one card into view without changing the zoom, when it is off the canvas. */
export function frameOn(frame: Frame, box: { x: number; y: number; width: number; height: number }, viewport: Viewport): Frame {
  const left = frame.x + box.x * frame.scale;
  const top = frame.y + box.y * frame.scale;
  const right = left + box.width * frame.scale;
  const bottom = top + box.height * frame.scale;
  let dx = 0;
  let dy = 0;
  if (left < PAD) dx = PAD - left;
  else if (right > viewport.width - PAD) dx = viewport.width - PAD - right;
  if (top < PAD) dy = PAD - top;
  else if (bottom > viewport.height - PAD) dy = viewport.height - PAD - bottom;
  return dx === 0 && dy === 0 ? frame : panBy(frame, dx, dy);
}
