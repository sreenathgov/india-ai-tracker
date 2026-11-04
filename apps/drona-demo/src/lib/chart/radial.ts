/**
 * Geometry for the one dependency radial. Angles are degrees clockwise from
 * twelve o'clock; each segment gives up half a gap either side so the gaps read
 * evenly all the way round.
 */
export interface RadialInput {
  readonly id: string;
  readonly value: number;
}

export interface RadialSegment {
  readonly id: string;
  readonly value: number;
  readonly start: number;
  readonly end: number;
}

export function radialSegments(values: readonly RadialInput[], gapDeg = 1.5): readonly RadialSegment[] {
  const present = values.filter((v) => v.value > 0);
  const total = present.reduce((sum, v) => sum + v.value, 0);
  if (total === 0) return [];

  const unit = (360 - present.length * gapDeg) / total;
  let cursor = 0;
  return present.map((v) => {
    const start = cursor + gapDeg / 2;
    const end = start + v.value * unit;
    cursor = end + gapDeg / 2;
    return { id: v.id, value: v.value, start, end };
  });
}

const trim = (n: number): string => String(Math.round(n * 100) / 100);

function pointAt(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

/** An SVG arc along radius r, for a stroked (not filled) segment. */
export function arcPath(cx: number, cy: number, r: number, start: number, end: number): string {
  const a = pointAt(cx, cy, r, start);
  const b = pointAt(cx, cy, r, end);
  const large = end - start > 180 ? 1 : 0;
  return `M ${trim(a.x)} ${trim(a.y)} A ${r} ${r} 0 ${large} 1 ${trim(b.x)} ${trim(b.y)}`;
}
