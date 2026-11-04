import type { GraphNode, GraphNodeType } from "./types";
import type { VisibleGraph } from "./view";

/**
 * Where the cards go.
 *
 * Layered left to right, one column per step away from the order, because that is the
 * sentence the reader is trying to finish: this order needs this component, which
 * comes from this supplier, which depends on this. A force-directed cloud would place
 * the same objects by an arithmetic nobody can read, and would place them somewhere
 * new every time the view changed.
 *
 * The vertical order is a tidy tree: leaves take the next free row, and a parent sits
 * at the midpoint of its children. Pure and deterministic, so a filter change moves
 * only what it should and the same graph always looks the same.
 */

/** Card sizes by type. The hierarchy is in the geometry before it is in the ink. */
const SIZE: Readonly<Record<GraphNodeType, readonly [number, number]>> = {
  order: [158, 88],
  component: [176, 88],
  supplier: [236, 128],
  material: [186, 104],
  process: [186, 104],
  facility: [186, 104],
  route: [186, 104],
  regulatory: [186, 104],
  authority: [186, 104],
};

/** Tier-2 supplier: the next-most-important object on the canvas. */
const SIZE_SUPPLIER_TIER_2: readonly [number, number] = [206, 110];
/** Tier-3+ supplier: context on the anchor's dependency, not a subject in its own right. */
const SIZE_SUPPLIER_TIER_3: readonly [number, number] = [188, 98];

/** A deeper supplier is not the subject; it reads progressively smaller by tier. */
export const sizeOf = (node: GraphNode): readonly [number, number] => {
  if (node.type !== "supplier") return SIZE[node.type];
  const tier = node.tier ?? 1;
  if (tier <= 1) return SIZE.supplier;
  if (tier === 2) return SIZE_SUPPLIER_TIER_2;
  return SIZE_SUPPLIER_TIER_3;
};

const ROW = 138;
const COLUMN_GAP = 44;
const LANE_GAP = 22;
const PAD_X = 30;
const PAD_Y = 30;

/**
 * How tall a fan of background parties is allowed to get before it packs sideways.
 *
 * "All mapped" hangs every party Drona holds behind the Tier-1 off one card. In a
 * single column that is a wall — fourteen rows against a canvas four rows tall — so
 * past this many leaves the fan runs in lanes instead. A fan is a set, not a
 * sequence, so nothing is lost by reading it as a block.
 */
export const FAN_ROWS = 5;

/** A packed fan, and where its bundled connectors run. */
export interface FanRoute {
  /** Member id → lane. */
  readonly lanes: ReadonlyMap<string, number>;
  /** The horizontal bundle, above every card in the fan. */
  readonly railY: number;
  /** Where the bundle leaves the parent's column. */
  readonly riserX: number;
  /** Where each lane's connectors come down, in that lane's left gutter. */
  readonly laneX: readonly number[];
}

export interface NodeBox {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  /** The anchor edges, precomputed so the edge layer does no geometry of its own. */
  readonly cx: number;
  readonly cy: number;
}

export interface GraphLayout {
  readonly boxes: ReadonlyMap<string, NodeBox>;
  readonly width: number;
  readonly height: number;
  /** Parent id → its packed fan, where one was packed. */
  readonly fans: ReadonlyMap<string, FanRoute>;
  /** The Tier-1 supplier: what the canvas opens on when the graph cannot fit. */
  readonly anchorId: string | null;
}

export function layoutGraph(visible: VisibleGraph): GraphLayout {
  const nodes = visible.nodes;
  if (nodes.length === 0) return { boxes: new Map(), width: 0, height: 0, fans: new Map(), anchorId: null };

  const children = new Map<string, GraphNode[]>();
  const roots: GraphNode[] = [];
  const present = new Set(nodes.map((node) => node.id));
  for (const node of nodes) {
    if (node.parentId && present.has(node.parentId)) {
      const list = children.get(node.parentId);
      if (list) list.push(node);
      else children.set(node.parentId, [node]);
    } else {
      roots.push(node);
    }
  }

  /* Rows and lanes, by descent: leaves take the next slot, parents take their midpoint.
     A parent with more leaf children than a canvas can stack packs them into lanes. */
  const slot = new Map<string, number>();
  const lane = new Map<string, number>();
  const fanMembers = new Map<string, readonly string[]>();
  let cursor = 0;

  const place = (node: GraphNode): number => {
    const kids = children.get(node.id) ?? [];
    if (kids.length === 0) {
      const own = cursor;
      cursor += 1;
      slot.set(node.id, own);
      return own;
    }
    /* Only background parties pack. An authored dependency is the path, not a block. */
    const leaves = kids.filter((kid) => kid.context && !children.has(kid.id));
    const packed = leaves.length > FAN_ROWS ? leaves : [];
    const isPacked = new Set(packed.map((kid) => kid.id));
    const spans: number[] = [];
    for (const kid of kids) {
      if (isPacked.has(kid.id)) continue;
      spans.push(place(kid));
    }
    if (packed.length > 0) {
      const lanes = Math.ceil(packed.length / FAN_ROWS);
      const rows = Math.ceil(packed.length / lanes);
      const start = cursor;
      packed.forEach((kid, index) => {
        slot.set(kid.id, start + (index % rows));
        lane.set(kid.id, Math.floor(index / rows));
      });
      cursor = start + rows;
      spans.push(start, start + rows - 1);
      fanMembers.set(node.id, packed.map((kid) => kid.id));
    }
    spans.sort((a, b) => a - b);
    const mid = (spans[0] + spans[spans.length - 1]) / 2;
    slot.set(node.id, mid);
    return mid;
  };
  for (const root of roots) place(root);

  /* Then column widths: a column is as wide as its widest card times its lane count. */
  const maxDepth = Math.max(...nodes.map((node) => node.depth));
  const laneWidth: number[] = Array.from({ length: maxDepth + 1 }, () => 0);
  const laneCount: number[] = Array.from({ length: maxDepth + 1 }, () => 1);
  for (const node of nodes) {
    laneWidth[node.depth] = Math.max(laneWidth[node.depth], sizeOf(node)[0]);
    laneCount[node.depth] = Math.max(laneCount[node.depth], (lane.get(node.id) ?? 0) + 1);
  }
  const columnX: number[] = [];
  let x = PAD_X;
  for (let d = 0; d <= maxDepth; d += 1) {
    columnX.push(x);
    x += laneCount[d] * laneWidth[d] + (laneCount[d] - 1) * LANE_GAP + COLUMN_GAP;
  }
  const laneLeft = (depth: number, index: number): number =>
    columnX[depth] + index * (laneWidth[depth] + LANE_GAP);

  const boxes = new Map<string, NodeBox>();
  for (const node of nodes) {
    const [width, height] = sizeOf(node);
    const left = laneLeft(node.depth, lane.get(node.id) ?? 0) + (laneWidth[node.depth] - width) / 2;
    const top = PAD_Y + slot.get(node.id)! * ROW + (ROW - height) / 2;
    boxes.set(node.id, { id: node.id, x: left, y: top, width, height, cx: left + width / 2, cy: top + height / 2 });
  }

  /* Each packed fan gets a bundle: one rail above the block, one riser per lane. */
  const fans = new Map<string, FanRoute>();
  for (const [parentId, members] of fanMembers) {
    const depth = nodes.find((node) => node.id === members[0])!.depth;
    const tops = members.map((id) => boxes.get(id)!.y);
    fans.set(parentId, {
      lanes: new Map(members.map((id) => [id, lane.get(id) ?? 0])),
      railY: Math.min(...tops) - LANE_GAP,
      riserX: columnX[depth] - COLUMN_GAP / 2,
      laneX: Array.from({ length: laneCount[depth] }, (_, index) => laneLeft(depth, index) - LANE_GAP / 2),
    });
  }

  const anchor = nodes.find((node) => node.type === "supplier" && (node.tier ?? 1) === 1);

  return {
    boxes,
    fans,
    anchorId: anchor?.id ?? roots[0]?.id ?? null,
    width: columnX[maxDepth] + laneCount[maxDepth] * laneWidth[maxDepth] + (laneCount[maxDepth] - 1) * LANE_GAP + PAD_X,
    height: PAD_Y * 2 + Math.max(1, cursor) * ROW,
  };
}

/** A polyline with its corners rounded, so an orthogonal route still reads as drawn. */
function roundedPath(points: readonly (readonly [number, number])[], radius: number): string {
  let d = `M ${points[0][0]} ${points[0][1]}`;
  for (let i = 1; i < points.length - 1; i += 1) {
    const [px, py] = points[i - 1];
    const [cx, cy] = points[i];
    const [nx, ny] = points[i + 1];
    const into = Math.min(radius, Math.hypot(cx - px, cy - py) / 2);
    const out = Math.min(radius, Math.hypot(nx - cx, ny - cy) / 2);
    const ax = cx + Math.sign(px - cx) * into;
    const ay = cy + Math.sign(py - cy) * into;
    const bx = cx + Math.sign(nx - cx) * out;
    const by = cy + Math.sign(ny - cy) * out;
    d += ` L ${ax} ${ay} Q ${cx} ${cy}, ${bx} ${by}`;
  }
  const last = points[points.length - 1];
  return `${d} L ${last[0]} ${last[1]}`;
}

/**
 * The connector into a packed fan.
 *
 * A fan's members are a set, and drawing fifteen separate curves into a block of
 * cards would cross every lane. So the connectors bundle instead: one riser out of
 * the parent, one rail over the top of the block, and one drop per lane down its own
 * gutter. It reads as what it is — background Drona holds, arriving together — and
 * never crosses a card.
 */
export function fanPath(from: NodeBox, to: NodeBox, route: FanRoute, lane: number): string {
  const dropX = route.laneX[lane] ?? route.laneX[route.laneX.length - 1];
  return roundedPath(
    [
      [from.x + from.width, from.cy],
      [route.riserX, from.cy],
      [route.riserX, route.railY],
      [dropX, route.railY],
      [dropX, to.cy],
      [to.x, to.cy],
    ],
    10
  );
}

/**
 * The connector between two cards.
 *
 * A flat cubic: it leaves the dependent's right edge horizontally and arrives at the
 * dependency's left edge horizontally, so every line reads as one step further from
 * the order even where the rows are far apart. Lateral relations are drawn as a
 * shallow arc under the cards instead, because they are not a step at all.
 */
export function edgePath(from: NodeBox, to: NodeBox, lateral = false): string {
  if (lateral) {
    const y = Math.max(from.y + from.height, to.y + to.height) + 22;
    return `M ${from.cx} ${from.y + from.height} C ${from.cx} ${y}, ${to.cx} ${y}, ${to.cx} ${to.y + to.height}`;
  }
  const x1 = from.x + from.width;
  const x2 = to.x;
  const bend = Math.max(20, (x2 - x1) * 0.42);
  return `M ${x1} ${from.cy} C ${x1 + bend} ${from.cy}, ${x2 - bend} ${to.cy}, ${x2} ${to.cy}`;
}
