/**
 * The deck.gl layer stack, bottom to top.
 *
 *   ocean  → land → routes → selection halo → clusters → upstream → buyers → plant
 *
 * Kept apart from `DeckMap` so the component reads as state and wiring, and this
 * file reads as drawing. Every colour arrives in `palette`, which is read from the
 * design tokens — nothing here names a hex value.
 *
 * Client-only: imports deck.gl, which touches WebGL at construction.
 */
import {
  GeoJsonLayer,
  IconLayer,
  PathLayer,
  ScatterplotLayer,
  SolidPolygonLayer,
  TextLayer,
} from "@deck.gl/layers";
import type { Layer } from "@deck.gl/core";

import type { SupplierCluster } from "@/lib/map/cluster";
import { evidenceMark } from "@/lib/map/epistemic";
import { facesCamera, type Facing } from "@/lib/map/hemisphere";
import { dotted } from "@/lib/map/flowPath";
import {
  buyerIcon,
  clusterIcon,
  plantIcon,
  subtierIcon,
  supplierIcon,
  upstreamIcon,
  type MapIcon,
} from "@/lib/map/icons";
import type { MapData, MapFlow, MapNode } from "@/lib/map/mapData";
import { MAX_LATITUDE, type LonLat } from "@/lib/map/mercator";
import { withAlpha, type MapPalette, type Rgba } from "@/lib/map/palette";
import land from "@/lib/map/geo/land-110m.json";

export type MapMode = "map" | "globe";

/** Polygon offset (factor, units) pushing the globe's ocean behind coplanar land. */
const OCEAN_DEPTH_OFFSET = { depthBias: 2, depthBiasSlopeScale: 2 } as const;

/* GlobeView culls back faces for every layer, and an icon's screen-space quad winds
   the "wrong" way once its y axis is flipped — so on the globe every icon and label
   would be culled whole. And depth-tested, each card stands half inside the sphere
   and loses its lower half to it. So the billboarded layers draw with neither, and
   the far side's marks are left out by `facesCamera` instead. */
const ON_TOP = {
  cullMode: "none",
  depthCompare: "always",
  depthWriteEnabled: false,
} as const;

/** On-screen icon sizes, CSS pixels. */
export const ICON_SIZE = {
  plant: 30,
  buyer: 26,
  supplier: 22,
  upstream: 20,
  subtier: 22,
} as const;

/** Clusters grow with count, but gently — the number inside carries the magnitude. */
export const clusterSize = (count: number): number =>
  Math.min(46, 26 + Math.sqrt(count) * 3.2);

/** Dot spacing on screen, CSS pixels, for the two broken-line grammars. */
const DOT_SPACING_PX = { low: 7, missing: 13 } as const;

/** Kilometres per CSS pixel at the equator for a given Web-Mercator zoom. */
const KM_PER_PX_ZOOM0 = 40075 / 512;
const kmPerPixel = (zoom: number): number => KM_PER_PX_ZOOM0 / 2 ** zoom;

export interface LayerInput {
  readonly mode: MapMode;
  readonly data: MapData;
  readonly clusters: readonly SupplierCluster[];
  readonly palette: MapPalette;
  /** Snapped zoom — dotted lines re-sample only when this changes. */
  readonly zoom: number;
  readonly selectedId: string | null;
  readonly highlightedCommitment: string | null;
  /** Scene 1: a commitment row under the pointer. Its parties stay bright; the rest recede. */
  readonly emphasisCommitment?: string | null;
  readonly fontFamily: string;
  /** Globe only: the part of the world the camera can see. Null on the flat map. */
  readonly facing: Facing | null;
}

/* The ocean is a polygon, not a clear colour, because on the globe it has to be
   *something*: an opaque sphere is what hides the far side's land and marks. On the
   flat map Mercator cannot reach the poles, so the same shape stops where it does. */
function oceanRing(mode: MapMode): readonly LonLat[] {
  const lat = mode === "globe" ? 90 : MAX_LATITUDE;
  return [
    [-180, lat],
    [0, lat],
    [180, lat],
    [180, -lat],
    [0, -lat],
    [-180, -lat],
  ];
}

function flowColor(flow: MapFlow, input: LayerInput): Rgba {
  const { palette, highlightedCommitment } = input;
  if (flow.kind === "delivery") {
    const quiet =
      highlightedCommitment !== null && flow.commitmentId !== highlightedCommitment;
    return quiet ? palette.flowMuted : palette.flow;
  }
  const confidence = flow.confidence ?? "missing";
  return confidence === "verified"
    ? palette.flow
    : withAlpha(palette.flow, palette.inferredOpacity);
}

const isBroken = (flow: MapFlow): boolean =>
  flow.kind === "dependency" && (flow.confidence === "low" || flow.confidence === "missing");

interface Dot {
  readonly position: LonLat;
  readonly color: Rgba;
}

function dotsFor(flows: readonly MapFlow[], input: LayerInput): readonly Dot[] {
  const km = kmPerPixel(input.zoom);
  return flows.flatMap((flow) => {
    const spacing = DOT_SPACING_PX[flow.confidence === "low" ? "low" : "missing"] * km;
    const color = flowColor(flow, input);
    return dotted(flow.path, spacing).map((position) => ({ position, color }));
  });
}

function nodeIcon(node: MapNode, palette: MapPalette): MapIcon {
  switch (node.kind) {
    case "plant":
      return plantIcon(palette);
    case "destination":
      return buyerIcon(palette);
    case "upstream":
      return upstreamIcon(palette, evidenceMark(node.confidence ?? "missing").fill);
    case "subtier": {
      const entry = node.subtier;
      return subtierIcon(
        palette,
        evidenceMark(node.confidence ?? "missing").fill,
        entry?.node.role ?? "consumable",
        {
          flagged: (entry?.node.signals.length ?? 0) > 0,
          weakLink: entry?.weakLink ?? false,
          abroad: entry?.abroad ?? false,
        }
      );
    }
    case "supplier":
      return supplierIcon(
        palette,
        node.concern ?? "low",
        node.supplier?.category ?? "Nacelle"
      );
  }
}

const nodeSize = (node: MapNode): number =>
  node.kind === "destination" ? ICON_SIZE.buyer : ICON_SIZE[node.kind];

/** Where the selected thing is, and how big a halo it needs. */
function haloFor(input: LayerInput): { position: LonLat; radius: number } | null {
  const { selectedId, data, clusters } = input;
  if (!selectedId) return null;
  const node = [data.plant, ...data.destinations, ...data.upstream].find(
    (n) => n.id === selectedId
  );
  if (node) return { position: node.position, radius: nodeSize(node) * 0.85 };
  const cluster = clusters.find((c) => c.members.some((m) => m.id === selectedId));
  if (!cluster) return null;
  return {
    position: cluster.position,
    radius: (cluster.resolved ? ICON_SIZE.supplier : clusterSize(cluster.count)) * 0.85,
  };
}

/* The weak link is drawn last among the sub-tier marks, so a neighbour in the same
   city never covers the one mark carrying critical ink. */
const byWeakLinkLast = (nodes: readonly MapNode[]): readonly MapNode[] => [
  ...nodes.filter((n) => !n.subtier?.weakLink),
  ...nodes.filter((n) => n.subtier?.weakLink),
];

/** Alpha for a mark outside the emphasised commitment: present, but not competing. */
const RECEDED_ALPHA = 64;

const serves = (node: MapNode, commitmentId: string): boolean =>
  node.kind === "plant" || node.commitmentIds.includes(commitmentId);

export function buildLayers(raw: LayerInput): Layer[] {
  /* A hovered row brightens its route the same way a clicked destination does; a
     click, being deliberate, wins over a passing pointer. */
  const emphasis = raw.emphasisCommitment ?? null;
  const input: LayerInput = {
    ...raw,
    highlightedCommitment: raw.highlightedCommitment ?? emphasis,
  };
  const { mode, data, clusters, palette, facing } = input;
  const nodeAlpha = (node: MapNode): number =>
    emphasis === null || serves(node, emphasis) ? 255 : RECEDED_ALPHA;
  const clusterAlpha = (c: SupplierCluster): number =>
    emphasis === null || c.members.some((m) => serves(m, emphasis)) ? 255 : RECEDED_ALPHA;
  const solidFlows = data.flows.filter((f) => !isBroken(f));
  const brokenFlows = data.flows.filter(isBroken);
  const visible = <T extends { readonly position: LonLat }>(items: readonly T[]): T[] =>
    facing ? items.filter((item) => facesCamera(item.position, facing)) : [...items];
  const multi = visible(clusters.filter((c) => !c.resolved));
  const single = visible(clusters.filter((c) => c.resolved).map((c) => c.members[0]));
  const halo = haloFor(input);
  const colorKey = palette.flow.join(",");
  const faceParams = mode === "globe" ? ON_TOP : {};

  return [
    new SolidPolygonLayer<readonly LonLat[]>({
      id: `ocean-${mode}`,
      data: [oceanRing(mode)],
      getPolygon: (d) => d as LonLat[],
      getFillColor: palette.ocean as Rgba as [number, number, number, number],
      updateTriggers: { getFillColor: palette.ocean.join(",") },
      /* On the globe, land lies on the ocean's surface and the two fight for the
         same depth. Nudging the ocean back lets land win everywhere, while the
         ocean's near face still hides the far side of the world. */
      parameters: mode === "globe" ? OCEAN_DEPTH_OFFSET : {},
    }),

    new GeoJsonLayer({
      /* Keyed by mode like the ocean: deck.gl only re-tessellates a polygon when its
         data changes, and the globe needs the land cut into a fine grid so it
         follows the sphere instead of cutting chords through it. */
      id: `land-${mode}`,
      data: land as never,
      filled: true,
      stroked: true,
      getFillColor: palette.land as [number, number, number, number],
      getLineColor: palette.landEdge as [number, number, number, number],
      lineWidthUnits: "pixels",
      getLineWidth: 0.75,
      updateTriggers: {
        getFillColor: palette.land.join(","),
        getLineColor: palette.landEdge.join(","),
      },
    }),

    new PathLayer<MapFlow>({
      id: "routes",
      data: solidFlows,
      getPath: (f) => f.path as LonLat[],
      getColor: (f) => flowColor(f, input) as [number, number, number, number],
      getWidth: (f) =>
        f.kind === "delivery" && f.commitmentId === input.highlightedCommitment ? 2.5 : 1.5,
      widthUnits: "pixels",
      capRounded: true,
      jointRounded: true,
      updateTriggers: {
        getColor: [input.highlightedCommitment, colorKey],
        getWidth: input.highlightedCommitment,
      },
    }),

    new ScatterplotLayer<Dot>({
      id: "routes-dotted",
      data: dotsFor(brokenFlows, input),
      getPosition: (d) => d.position as LonLat as [number, number],
      getFillColor: (d) => d.color as [number, number, number, number],
      getRadius: 1.4,
      radiusUnits: "pixels",
    }),

    new ScatterplotLayer<{ position: LonLat; radius: number }>({
      id: "halo",
      data: halo ? [halo] : [],
      getPosition: (d) => d.position as [number, number],
      getRadius: (d) => d.radius,
      radiusUnits: "pixels",
      getFillColor: palette.halo as [number, number, number, number],
      stroked: true,
      getLineColor: [palette.halo[0], palette.halo[1], palette.halo[2], 110],
      getLineWidth: 1,
      lineWidthUnits: "pixels",
    }),

    new IconLayer<SupplierCluster>({
      id: "clusters",
      data: multi,
      parameters: faceParams,
      pickable: true,
      getPosition: (c) => c.position as [number, number],
      getIcon: (c) => clusterIcon(palette, c.worstConcern),
      getSize: (c) => clusterSize(c.count),
      sizeUnits: "pixels",
      /* Icons are not masks, so only the alpha of getColor applies. */
      getColor: (c) => [255, 255, 255, clusterAlpha(c)],
      updateTriggers: { getColor: emphasis },
    }),

    new TextLayer<SupplierCluster>({
      id: "cluster-counts",
      data: multi,
      parameters: faceParams,
      getPosition: (c) => c.position as [number, number],
      getText: (c) => String(c.count),
      getSize: 12,
      getColor: (c) => [palette.label[0], palette.label[1], palette.label[2], clusterAlpha(c)],
      updateTriggers: { getColor: [emphasis, palette.label.join(",")] },
      fontFamily: input.fontFamily,
      fontWeight: 600,
      getTextAnchor: "middle",
      getAlignmentBaseline: "center",
    }),

    new IconLayer<MapNode>({
      id: "nodes",
      parameters: faceParams,
      /* Painter's order: suppliers under upstream under buyers under the plant, so
         the one mark the whole map is about is never covered. */
      data: [
        ...single,
        ...visible([...byWeakLinkLast(data.upstream), ...data.destinations, data.plant]),
      ],
      pickable: true,
      getPosition: (n) => n.position as [number, number],
      getIcon: (n) => nodeIcon(n, palette),
      getSize: nodeSize,
      sizeUnits: "pixels",
      getColor: (n) => [255, 255, 255, nodeAlpha(n)],
      updateTriggers: { getIcon: palette.concern.critical.join(","), getColor: emphasis },
    }),
  ];
}
