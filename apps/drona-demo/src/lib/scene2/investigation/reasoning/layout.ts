import { edgePath, type FanRoute, type GraphLayout, type NodeBox } from "@/lib/scene2/supplychain/layout";
import { RN_MATERIALITY_WEIGHT } from "./taxonomy";
import { REASONING_COLUMNS, type ReasoningColumnKey, type ReasoningGraph, type ReasoningNode } from "./graph";

export { edgePath };

/** Claim cards carry a sentence and a type tag; dependency/action cards are terser. */
const SIZE: Readonly<Record<ReasoningNode["kind"], readonly [number, number]>> = {
  observation: [224, 112],
  inference: [224, 112],
  forecast: [224, 124],
  scenario: [224, 124],
  dependency: [204, 92],
  action: [204, 96],
};

const ROW = 132;
const COLUMN_GAP = 68;
const PAD_X = 32;
const PAD_Y = 48;

export interface ReasoningColumn {
  readonly stage: ReasoningColumnKey;
  readonly x: number;
}

export interface ReasoningLayout extends GraphLayout {
  readonly columns: readonly ReasoningColumn[];
}

/**
 * Where the reasoning graph's cards go.
 *
 * Columns are the investigation's own fracture path — condition, dependency, supplier,
 * production, commitment — with dependencies and actions trailing as what claims point
 * at, and an "unstaged" column absorbing any claim the fracture path never names, so a
 * gap in authoring shows up as a visible column rather than a card that silently vanishes.
 * Within a column, claims sort by materiality — controlling first — so the case a reader
 * most needs sits at the top of its stage.
 *
 * This returns a `GraphLayout`-shaped object on purpose: `frame.ts`'s pan/zoom/fit
 * functions read only `boxes`/`width`/`height`/`fans`/`anchorId`, so this layout drops
 * straight into `fitFrame`/`panBy`/`zoomAt`/`frameOn` with no changes to that module.
 */
export function layoutReasoningGraph(graph: ReasoningGraph): ReasoningLayout {
  if (graph.nodes.length === 0) {
    return { boxes: new Map(), width: 0, height: 0, fans: new Map<string, FanRoute>(), anchorId: null, columns: [] };
  }

  const rowHeight = graph.compact ? 116 : ROW;
  const padY = graph.compact ? 28 : PAD_Y;
  const nodeSize = (node: ReasoningNode): readonly [number, number] => graph.compact && node.claimId ? [224, 104] : SIZE[node.kind];
  const byColumn = new Map<ReasoningColumnKey, ReasoningNode[]>();
  for (const node of graph.nodes) {
    const list = byColumn.get(node.column);
    if (list) list.push(node);
    else byColumn.set(node.column, [node]);
  }
  for (const list of byColumn.values()) {
    list.sort((a, b) => {
      const wa = a.materialityWeight ?? RN_MATERIALITY_WEIGHT.contextual;
      const wb = b.materialityWeight ?? RN_MATERIALITY_WEIGHT.contextual;
      return wa - wb;
    });
  }

  const activeColumns = REASONING_COLUMNS.filter((stage) => byColumn.has(stage));

  const boxes = new Map<string, NodeBox>();
  const columns: ReasoningColumn[] = [];
  let x = PAD_X;
  let maxRows = 0;

  for (const stage of activeColumns) {
    const members = byColumn.get(stage) ?? [];
    const columnWidth = Math.max(...members.map((node) => nodeSize(node)[0]));
    columns.push({ stage, x });
    members.forEach((node, row) => {
      const [width, height] = nodeSize(node);
      const left = x + (columnWidth - width) / 2;
      const top = padY + row * rowHeight + (rowHeight - height) / 2;
      boxes.set(node.id, { id: node.id, x: left, y: top, width, height, cx: left + width / 2, cy: top + height / 2 });
    });
    maxRows = Math.max(maxRows, members.length);
    x += columnWidth + COLUMN_GAP;
  }

  const controlling = graph.nodes.find((node) => (node.materialityWeight ?? 99) === RN_MATERIALITY_WEIGHT.controlling);

  return {
    boxes,
    fans: new Map<string, FanRoute>(),
    anchorId: controlling?.id ?? graph.nodes[0]?.id ?? null,
    columns,
    width: x - COLUMN_GAP + PAD_X,
    height: padY * 2 + Math.max(1, maxRows) * rowHeight,
  };
}
