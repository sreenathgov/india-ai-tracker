"use client";

import * as React from "react";
import DeckGL from "@deck.gl/react";
import {
  FlyToInterpolator,
  LinearInterpolator,
  MapView,
  _GlobeView as GlobeView,
  type PickingInfo,
} from "@deck.gl/core";

import { clusterSuppliers, drillZoom, type SupplierCluster } from "@/lib/map/cluster";
import {
  COMPACT_MAP_WIDTH,
  chromeInsets,
  MAX_ZOOM,
  MIN_ZOOM,
  WORLD_FRAMING,
  boundsOf,
  frameBounds,
  frameGlobe,
  toGlobeZoom,
  toMapZoom,
  wholeGlobeZoom,
  type Framing,
  type MapChromeLayout,
} from "@/lib/map/framing";
import { supplierIcon } from "@/lib/map/icons";
import { buildMapData, type MapNode } from "@/lib/map/mapData";
import type { LonLat } from "@/lib/map/mercator";
import { FALLBACK_PALETTE, paletteFrom, type MapPalette } from "@/lib/map/palette";
import type { DependencyChain } from "@/lib/network/dependencies";
import type { SubTierNetwork } from "@/lib/network/subtier";
import type { SubTierFilter } from "@/lib/network/subtier/filter";
import type { Destination, Plant, Supplier } from "@/lib/network/types";
import { MapControls, MapLegend } from "./MapChrome";
import { MapNodeList } from "./MapNodeList";
import { NodeHoverCard, type HoverTarget } from "./NodeHoverCard";
import { SupplierDetail } from "./SupplierDetail";
import { buildLayers, type MapMode } from "./mapLayers";
import { horizonCos, type Facing } from "@/lib/map/hemisphere";

export interface DeckMapProps {
  readonly onUnavailable?: () => void;
  readonly plant: Plant;
  readonly suppliers: readonly Supplier[];
  readonly destinations: readonly Destination[];
  readonly chain?: DependencyChain | null;
  /** What the scene wants in view. Null frames the whole network. */
  readonly frameTo: readonly LonLat[] | null;
  /** Scene 2 once resolved: the critical Tier-1s are selectable and one network shows. */
  readonly production?: ProductionMap | null;
  /** Scene 1: the commitment whose row is hovered or focused. Null leaves every mark as drawn. */
  readonly emphasisCommitmentId?: string | null;
  /** "card" is Scene 1's bento map: its own header top-left, key folded bottom-left. */
  readonly layout?: MapChromeLayout;
}

/**
 * The production view's hold on the map. The page owns the selection, the filter and
 * the hovered party, because the map and the sub-tier table are siblings and must
 * agree; the map only reports what the reviewer did on it.
 */
export interface ProductionMap {
  readonly network: SubTierNetwork | null;
  readonly selectedSupplierId: string | null;
  /** A party hovered in the table — haloed here. */
  readonly highlightNodeId: string | null;
  readonly filter: SubTierFilter;
  readonly onSelectSupplier: (supplierId: string) => void;
  readonly onHoverNode: (nodeId: string | null) => void;
  readonly onFilter: (filter: SubTierFilter) => void;
}

interface ViewState extends Framing {
  readonly pitch?: number;
  readonly bearing?: number;
  readonly minZoom: number;
  readonly maxZoom: number;
  /* Null lifts the globe controller's default, which pins the globe's height to
     the viewport's and so forbids ever seeing it whole on a short map. */
  readonly maxBounds?: null;
  readonly transitionDuration?: number;
  readonly transitionInterpolator?: FlyToInterpolator | LinearInterpolator;
}

interface Hover {
  readonly target: HoverTarget;
  readonly x: number;
  readonly y: number;
}

const SCENE_DURATION = 700;
/* Effectively a jump — but not zero. deck.gl lets a flight in progress run on when
   the next view state asks for no transition, so a resize landing mid-flight would
   be overwritten by the old destination. Any non-zero duration interrupts it. */
const INSTANT = 1;
/** The globe may shrink below the flat map's floor: seen whole, it is still content. */
const GLOBE_MIN_ZOOM = -1;
const STEP_DURATION = 280;
/** Clusters regroup per quarter zoom level, not per animation frame. */
const snap = (zoom: number): number => Math.round(zoom * 4) / 4;

/* Built once: a view is configuration, and a new instance per render would make
   deck.gl rebuild its viewports every frame. */
const MAP_VIEW = new MapView({
  id: "map",
  repeat: false,
  controller: { dragRotate: false, touchRotate: false, keyboard: true, doubleClickZoom: true },
});
const GLOBE_VIEW = new GlobeView({
  id: "globe",
  controller: { keyboard: true, doubleClickZoom: true },
});

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * The map itself: one deck.gl canvas, flat by default, a globe on request.
 *
 * Both views read the same `MapData` and the same camera — longitude, latitude,
 * zoom — so switching projection is a change of lens, never of content. The
 * component is mounted once for the life of the demo (see `page.tsx`); scenes
 * re-frame it by handing over new positions, and it flies there.
 *
 * Accessibility does not ride on the canvas: every node is also a real button in
 * `MapNodeList`, and every overlay is HTML.
 */
export default function DeckMap({
  plant,
  suppliers,
  destinations,
  chain = null,
  frameTo,
  production = null,
  emphasisCommitmentId = null,
  layout = "scene",
  onUnavailable,
}: DeckMapProps): React.ReactElement {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [size, setSize] = React.useState<{ width: number; height: number } | null>(null);
  const [palette, setPalette] = React.useState<MapPalette>(FALLBACK_PALETTE);
  const [fontFamily, setFontFamily] = React.useState("system-ui, sans-serif");
  const [mode, setMode] = React.useState<MapMode>("map");
  const [viewState, setViewState] = React.useState<ViewState>({
    ...WORLD_FRAMING,
    minZoom: MIN_ZOOM,
    maxZoom: MAX_ZOOM,
    maxBounds: null,
  });
  const [hover, setHover] = React.useState<Hover | null>(null);
  const [pinnedId, setPinnedId] = React.useState<string | null>(null);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [highlighted, setHighlighted] = React.useState<string | null>(null);

  /* Tokens are the single source of colour; read them once the element exists. */
  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    setPalette(paletteFrom(el));
    setFontFamily(getComputedStyle(el).fontFamily || "system-ui, sans-serif");
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ width, height });
    });
    observer.observe(el);
    /* The silver ground steps down on the dark page; re-read when the theme flips. */
    const themeWatch = new MutationObserver(() => setPalette(paletteFrom(el)));
    themeWatch.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => {
      observer.disconnect();
      themeWatch.disconnect();
    };
  }, []);

  const network = production?.network ?? null;
  const filter = production?.filter ?? null;
  const data = React.useMemo(
    () =>
      buildMapData({
        plant,
        suppliers,
        destinations,
        chain,
        production: filter ? { network, filter } : null,
      }),
    [plant, suppliers, destinations, chain, network, filter]
  );

  /* Reported once per change, not per pointer move: the table re-renders on it. */
  const onHoverNode = production?.onHoverNode;
  const hoveredNode = React.useRef<string | null>(null);
  const reportHover = React.useCallback(
    (id: string | null) => {
      if (hoveredNode.current === id) return;
      hoveredNode.current = id;
      onHoverNode?.(id);
    },
    [onHoverNode]
  );

  const allPositions = React.useMemo(
    () =>
      [data.plant, ...data.destinations, ...data.suppliers, ...data.upstream].map(
        (n) => n.position
      ),
    [data]
  );

  const zoomStep = snap(viewState.zoom);
  const clusters = React.useMemo(
    () => clusterSuppliers(data.suppliers, zoomStep),
    [data.suppliers, zoomStep]
  );

  const flyTo = React.useCallback(
    (target: Framing, duration: number) => {
      const reduced = prefersReducedMotion();
      setViewState((current) => ({
        ...current,
        ...target,
        transitionDuration: reduced ? 0 : duration,
        transitionInterpolator:
          mode === "globe"
            ? new LinearInterpolator(["longitude", "latitude", "zoom"])
            : new FlyToInterpolator({ speed: 1.6 }),
      }));
    },
    [mode]
  );

  const sceneFraming = React.useCallback(
    (lens: MapMode = mode): Framing => {
      /* No opinion from the scene means "the whole network" — fitted to whatever
         height the map has been left with, not a fixed world view that crops it. */
      const positions = frameTo ?? allPositions;
      const bounds = boundsOf(positions);
      if (!bounds || !size) return WORLD_FRAMING;
      return lens === "globe"
        ? frameGlobe(positions, size.width, size.height, chromeInsets(size.width, layout)) ?? WORLD_FRAMING
        : frameBounds(bounds, size.width, size.height, chromeInsets(size.width, layout));
    },
    [frameTo, allPositions, size, mode, layout]
  );

  /* A scene change re-frames and lets go of anything the reviewer had picked out:
     the pin belonged to the picture that just went away. Keyed on `frameTo`'s
     identity, which page.tsx memoises per scene, and on first learning the size. */
  const hasSize = size !== null;
  /* Set once the reviewer drags or zooms: from then on the camera is theirs, and a
     resize must not snatch it back. A scene change hands it back to the scene. */
  const userMoved = React.useRef(false);
  React.useEffect(() => {
    if (!hasSize) return;
    userMoved.current = false;
    flyTo(sceneFraming(), SCENE_DURATION);
    setPinnedId(null);
    setSelectedId(null);
    setHighlighted(null);
    setHover(null);
    // Deliberately narrow deps: re-frame on a scene change, not on every resize.
  }, [frameTo, hasSize]);

  /* A resize re-fits the scene — the map's height changes with the layout below
     it — unless the reviewer has taken the camera. No animation: nothing moved. */
  React.useEffect(() => {
    if (!size || userMoved.current) return;
    flyTo(sceneFraming(), INSTANT);
    // sceneFraming already depends on size; flyTo only on mode.
  }, [size?.width, size?.height]);

  const clearPicks = React.useCallback((): boolean => {
    const had = pinnedId !== null || selectedId !== null || highlighted !== null;
    setPinnedId(null);
    setSelectedId(null);
    setHighlighted(null);
    return had;
  }, [pinnedId, selectedId, highlighted]);

  /* Escape clears a pick before it is allowed to step the scene back. Capture phase
     on window runs ahead of page.tsx's listener, so one press does one thing. */
  React.useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (clearPicks()) event.stopImmediatePropagation();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [clearPicks]);

  const focusNode = React.useCallback(
    (node: MapNode) => {
      setSelectedId(node.id);
      setPinnedId(node.kind === "supplier" ? node.id : null);
      setHighlighted(node.kind === "destination" ? node.commitmentIds[0] ?? null : null);
      userMoved.current = true;
      flyTo(
        {
          longitude: node.position[0],
          latitude: node.position[1],
          zoom: Math.max(viewState.zoom, 5),
        },
        SCENE_DURATION
      );
    },
    [flyTo, viewState.zoom]
  );

  const onClick = React.useCallback(
    (info: PickingInfo) => {
      const object = info.object as MapNode | SupplierCluster | undefined;
      if (!object) {
        clearPicks();
        return;
      }
      if ("members" in object) {
        setHover(null);
        userMoved.current = true;
        flyTo(
          {
            longitude: object.position[0],
            latitude: object.position[1],
            zoom: drillZoom(viewState.zoom),
          },
          SCENE_DURATION
        );
        return;
      }
      if (object.kind === "destination") {
        const commitment = object.commitmentIds[0] ?? null;
        const again = highlighted === commitment;
        setHighlighted(again ? null : commitment);
        setSelectedId(again ? null : object.id);
        setPinnedId(null);
        return;
      }
      /* In the production view a Tier-1 is a selector, the same as its tile: the
         risk view beside the map is its detail panel, so no second one opens here. */
      if (production && object.kind === "supplier") {
        production.onSelectSupplier(object.id);
        setSelectedId(null);
        setPinnedId(null);
        return;
      }
      setSelectedId(object.id);
      setHighlighted(null);
      setPinnedId(object.kind === "supplier" ? object.id : null);
    },
    [clearPicks, flyTo, highlighted, viewState.zoom, production]
  );

  const onHover = React.useCallback((info: PickingInfo) => {
    const object = info.object as MapNode | SupplierCluster | undefined;
    reportHover(object && !("members" in object) && object.kind === "subtier" ? object.id : null);
    if (!object) {
      setHover(null);
      return;
    }
    const target: HoverTarget =
      "members" in object
        ? { kind: "cluster", cluster: object }
        : { kind: "node", node: object };
    setHover({ target, x: info.x, y: info.y });
  }, [reportHover]);

  /* The globe's visible cap, recomputed per whole degree of turn rather than per
     frame: a mark at the limb is a sliver either way. */
  const facingLon = Math.round(viewState.longitude);
  const facingLat = Math.round(viewState.latitude);
  const facing = React.useMemo<Facing | null>(
    () =>
      mode === "globe" && size
        ? {
            centre: [facingLon, facingLat],
            minCos: horizonCos(zoomStep, facingLat, size.height),
          }
        : null,
    [mode, size, facingLon, facingLat, zoomStep]
  );

  /* The halo follows, in order: a party hovered in the table, one picked on the map,
     then the Tier-1 whose network is showing. */
  const haloId =
    production?.highlightNodeId ?? selectedId ?? production?.selectedSupplierId ?? null;

  const layers = React.useMemo(
    () =>
      buildLayers({
        mode,
        data,
        clusters,
        palette,
        zoom: zoomStep,
        selectedId: haloId,
        highlightedCommitment: highlighted,
        emphasisCommitment: emphasisCommitmentId,
        fontFamily,
        facing,
      }),
    [mode, data, clusters, palette, zoomStep, haloId, highlighted, emphasisCommitmentId, fontFamily, facing]
  );

  const pinned = pinnedId
    ? data.suppliers.find((s) => s.id === pinnedId)?.supplier ?? null
    : null;

  const switchMode = (next: MapMode) => {
    if (next === mode) return;
    setHover(null);
    /* Only the lens changes. Left to the scene, the camera takes the scene's framing
       for the new lens; taken by the reviewer, it keeps their place and ground scale
       — never closer in on the globe than seeing it whole. */
    setViewState((current) => {
      const target: Framing = !userMoved.current
        ? sceneFraming(next)
        : {
            longitude: current.longitude,
            latitude: current.latitude,
            zoom:
              next === "globe"
                ? Math.max(
                    toGlobeZoom(current.zoom, current.latitude),
                    size ? wholeGlobeZoom(size.width, size.height, current.latitude) : 0
                  )
                : toMapZoom(current.zoom, current.latitude),
          };
      return {
        ...current,
        ...target,
        pitch: 0,
        bearing: 0,
        minZoom: next === "globe" ? GLOBE_MIN_ZOOM : MIN_ZOOM,
        maxBounds: null,
        transitionDuration: 0,
        transitionInterpolator: undefined,
      };
    });
    setMode(next);
  };

  return (
    <div
      ref={containerRef}
      className={
        mode === "globe"
          ? "absolute inset-0 bg-[color:var(--map-space)]"
          : "absolute inset-0 bg-[color:var(--bg-map)]"
      }
    >
      <div aria-hidden="true" className="absolute inset-0">
        <DeckGL
          onError={() => onUnavailable?.()}
          views={mode === "globe" ? GLOBE_VIEW : MAP_VIEW}
          viewState={viewState as never}
          onViewStateChange={({ viewState: next, interactionState }) => {
            if (
              interactionState.isDragging ||
              interactionState.isPanning ||
              interactionState.isZooming
            ) {
              userMoved.current = true;
            }
            setViewState(next as unknown as ViewState);
            if (hover) setHover(null);
          }}
          layers={layers}
          onClick={onClick}
          onHover={onHover}
          getCursor={({ isDragging, isHovering }) =>
            isDragging ? "grabbing" : isHovering ? "pointer" : "grab"
          }
        />
      </div>

      <MapControls
        mode={mode}
        onMode={switchMode}
        onZoom={(delta) => {
          userMoved.current = true;
          flyTo(
            {
              longitude: viewState.longitude,
              latitude: viewState.latitude,
              zoom: Math.min(MAX_ZOOM, Math.max(viewState.minZoom, viewState.zoom + delta)),
            },
            STEP_DURATION
          );
        }}
        onReset={() => {
          userMoved.current = false;
          clearPicks();
          flyTo(sceneFraming(), SCENE_DURATION);
        }}
      />

      <MapLegend
        palette={palette}
        compact={layout === "card" || (size !== null && size.width < COMPACT_MAP_WIDTH)}
        placement={layout === "card" ? "bottom" : "top"}
        production={
          production ? { filter: production.filter, onFilter: production.onFilter } : null
        }
        tier1={
          chain
            ? supplierIcon(palette, chain.supplier.concern, chain.supplier.category)
            : null
        }
      />

      {/* The pinned supplier already has its panel open; a card repeating it is noise. */}
      {hover && size && !(hover.target.kind === "node" && hover.target.node.id === pinnedId) ? (
        <NodeHoverCard
          target={hover.target}
          x={hover.x}
          y={hover.y}
          containerWidth={size.width}
          containerHeight={size.height}
        />
      ) : null}

      {pinned ? <SupplierDetail supplier={pinned} onClose={clearPicks} /> : null}

      <MapNodeList data={data} onFocus={focusNode} />
    </div>
  );
}
