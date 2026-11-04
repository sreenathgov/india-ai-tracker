"use client";

import * as React from "react";

import { REGULATORY_CASE } from "@/lib/regulatory/state";
import { RegulatoryProvider, useRegulatoryCase } from "@/components/regulatory/RegulatoryProvider";
import { SupplierInquiryProvider, useSupplierInquiry } from "@/components/scene2/investigation/overview/SupplierInquiryProvider";
import { GuidedDemoProvider, GuidedDemoRoot, GuidedDemoBoundary } from "@/components/guided";
import { SessionMonitor } from "@/components/SessionMonitor";
import { AppHeader } from "@/components/AppHeader";
import { DronaMap } from "@/components/map/DronaMap";
import { Rail } from "@/components/rail/Rail";
import { CommitmentScene } from "@/components/scene2/CommitmentScene";
import { OrderMapCaption } from "@/components/scene2/workspace/OrderMapCaption";
import { useAssessment } from "@/components/scene2/workspace/useAssessment";
import { useWorkbenchState } from "@/components/scene2/workspace/useWorkbenchState";
import { PathwayScene } from "@/components/scene3/PathwayScene";
import { CommitmentQueue } from "@/components/surface/CommitmentQueue";
import { isOverlayOpen } from "@/components/overlay/ContextOverlay";
import { CommitmentStateStrip } from "@/components/surface/CommitmentStateStrip";
import { DependencyRadial } from "@/components/surface/DependencyRadial";
import { DronaWorkspace } from "@/components/surface/drona/DronaWorkspace";
import { MapCardHeader, type MapScope } from "@/components/surface/MapCardHeader";
import { WorkingCapitalCard } from "@/components/surface/WorkingCapitalCard";
import { toggleFilter, type SurfaceFilter } from "@/components/surface/filter";
import { RECOMMENDED_COMMITMENT } from "@/lib/portfolio/portfolio";
import { DEMO_NOW, SESSION_START } from "@/lib/demo/clock";
import { chainPositions } from "@/lib/map/chainModel";
import { lonLat } from "@/lib/map/mapData";
import { dependencyChain } from "@/lib/network/dependencies";
import { cn } from "@/lib/ui/cn";
import {
  DESTINATIONS,
  PLANT,
  commitmentById,
  SUPPLIERS,
  suppliersForCommitment,
} from "@/lib/network/gazetteer";
import {
  INITIAL_SCENE,
  goBack,
  openCommitment,
  openComponent,
  reset,
  switchComponent,
  type SceneState,
} from "@/lib/scene/machine";

/**
 * One route, three scenes.
 *
 * The map is mounted here, once, and stays mounted for the life of the demo. Scene
 * transitions re-frame it and swap what sits beneath; nothing unmounts. That
 * continuity is not a flourish — it is the claim the demo is making, that this is
 * one surface increasing in resolution rather than a series of screens.
 */
/* What the working surface is called once the map above it has stopped being the
   whole network. Named by resolution, because that is what changes between them. */
const STAGE_LABEL: Record<1 | 2 | 3, string> = {
  1: "Production intelligence surface",
  2: "Production commitment",
  3: "Critical exposure",
};

/** "100 Wind Turbines — Wind Energy Coastal Programme" → "Wind Energy Coastal". */
function shortLabel(name: string): string {
  const title = name.split(" — ")[1] ?? name;
  return title.split(" ").slice(0, 2).join(" ");
}

export default function DemoExperience({ logoutCsrf }: { readonly logoutCsrf: string }): React.ReactElement {
  const [epoch, setEpoch] = React.useState(0);
  const replay = React.useCallback(() => setEpoch(value => value + 1), []);
  return <RegulatoryProvider key={epoch}><SupplierInquiryProvider><DemoPage onReplay={replay} logoutCsrf={logoutCsrf} /></SupplierInquiryProvider></RegulatoryProvider>;
}

function DemoPage({ onReplay, logoutCsrf }: { readonly onReplay: () => void; readonly logoutCsrf: string }): React.ReactElement {
  const { dispatch } = useRegulatoryCase();
  const { dispatch: dispatchInquiry } = useSupplierInquiry();
  const admitted = true;
  const [scene, setScene] = React.useState<SceneState>(INITIAL_SCENE);

  /* Scene 1 shows the whole network. From Scene 2 on, the map is *filtered* rather
     than dimmed: the suppliers that have nothing to do with this order are removed,
     not greyed. The screen gets quieter as resolution increases, which is the claim
     the whole demo is making, and greying everything out would say the opposite —
     that the rest is still your problem, just harder to read. */
  const open = scene.commitmentId;

  /* Scene 1's own state. The filter narrows the queue from the state card or the
     ring; emphasis is whichever row the reviewer is pointing at, echoed on the map;
     scope is the map's "All commitments | <one>" toggle. The one it can scope to is
     Drona's recommendation until the reviewer opens another. */
  const [filter, setFilter] = React.useState<SurfaceFilter>(null);
  const [emphasis, setEmphasis] = React.useState<string | null>(null);
  const [scope, setScope] = React.useState<MapScope>("all");
  const [scopeId, setScopeId] = React.useState<string>(RECOMMENDED_COMMITMENT);
  const surface = scene.scene === 1;
  const scoped = surface && scope === "selected" ? scopeId : null;
  const scopeLabel = React.useMemo(() => shortLabel(commitmentById(scopeId)?.name ?? ""), [scopeId]);

  const onOpen = React.useCallback((commitmentId: string) => {
    setEmphasis(null);
    setScopeId(commitmentId);
    setScene((current) => openCommitment(current, commitmentId));
  }, []);

  /* Escape steps back one level, the same move the on-screen affordance makes.
     Presenting from a lectern means one hand on a clicker and no pointer worth
     trusting; a key that always goes up one level is the difference between
     recovering from a wrong turn and apologising for it.

     It is ignored while the gate is up, where Escape would otherwise read as
     "dismiss" — and this panel is not dismissible. */
  React.useEffect(() => {
    if (!admitted) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      /* An open overlay owns Escape: it closes the overlay, never the scene. The
         overlay stays in the DOM through its exit, so a second press mid-exit is
         also swallowed rather than stepping back a level. */
      if (event.defaultPrevented || isOverlayOpen()) return;
      setScene(goBack);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [admitted]);

  /* Back to the gate, not to Scene 1. The gate is the first beat of the narrative,
     so a replay that begins after it is not the same demo. */
  const restart = onReplay;

  /* Held here rather than inside Scene 2 so that stepping down into an exposure and
     back up neither replays nor loses an assessment. Opening an order never starts
     one: the order header's button is the only trigger. */
  const assessment = useAssessment(open);
  const workbench = useWorkbenchState(open);
  const workspace = scene.scene === 2;

  /* Scene 3 narrows once more. The chain carries its own upstream tiers, so from here
     the map is a causal dependency map rather than a network view — and the Tier-1
     suppliers that belong to the order but not to *this* exposure drop away with the
     rest. Resolution increases; the screen gets quieter again. */
  const chain = React.useMemo(
    () => (scene.componentId ? dependencyChain(scene.componentId) ?? null : null),
    [scene.componentId]
  );

  /* Focus follows the narrative.
     ──────────────────────────────────────────────────────────────────────────
     Opening a commitment unmounts the row that opened it, and the browser answers
     that by dropping focus to <body>. For a pointer that is invisible; for a
     keyboard it means the reviewer arrives at the scene they just asked for and
     then has to Tab back down through the entire rail to reach it — every time.
     Moving focus to the working surface makes the transition mean the same thing
     either way, and gives a screen reader the region's name at the moment the
     surface changes underneath it.

     Admission is a transition too, and the last one the gate is responsible for:
     it dissolves, taking the focused PIN field with it, and without this the
     reviewer is dropped at <body> on the very first move of the demo. The gate
     owns focus for exactly as long as it is up — which is what the guard says —
     and hands it to the surface it was standing in front of. */
  const stageRef = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => {
    if (!admitted) return;
    stageRef.current?.focus();
  }, [admitted, scene.scene]);

  /* Scene 2 shows the order's planned network: plant, its Tier-1s and its
     destination. The production sub-tier overlay returns with the supplier panels. */
  const regulatoryPath = scene.componentId === REGULATORY_CASE.componentId;
  const suppliers = React.useMemo(
    () =>
      chain
        ? [chain.supplier]
        : open
          ? suppliersForCommitment(open)
          : scoped
            ? suppliersForCommitment(scoped)
            : SUPPLIERS,
    [chain, open, scoped]
  );
  const destinations = React.useMemo(
    () =>
      chain && !regulatoryPath ? [] : open ? DESTINATIONS.filter((d) => d.commitmentId === open) : DESTINATIONS,
    [chain, open, regulatoryPath]
  );

  /* Memoised on the scene's ids, not rebuilt per render: DronaMap re-frames — and
     drops any manual pan or zoom — whenever this array's identity changes. */
  const frameTo = React.useMemo(() => {
    if (chain && !regulatoryPath) return chainPositions(chain);
    if (!open && !scoped) return null;
    return [PLANT, ...suppliers, ...destinations].map((node) => lonLat(node.coordinate));
  }, [chain, open, scoped, suppliers, destinations, regulatoryPath]);

  return (
    <GuidedDemoProvider navigation={{ scene: scene.scene, commitmentId: scene.commitmentId, assessmentStatus: assessment?.status, openOrder: () => onOpen("c1"), openSupplier: id => workbench.update({ investigation: { supplierId: id, tab: "overview" } }), resetNavigation: () => { setScene(reset()); setFilter(null); setEmphasis(null); setScope("all"); setScopeId(RECOMMENDED_COMMITMENT); } }} onReplay={onReplay} logoutCsrf={logoutCsrf}>
    <>
      {/* Clipped, not hidden: a hidden box is still a scroll container, and focus or
          scrollIntoView on a row deep in the stage would scroll the whole app up. */}
      <SessionMonitor />
      <GuidedDemoBoundary>
      <div className="flex h-dvh w-full overflow-clip">
        <Rail
          activeId="network"
          onSelect={(id) => {
            if (id === "network") setScene(reset());
          }}
          onRestart={restart}
          sessionStart={SESSION_START}
        />

        <main className="flex min-w-0 flex-1 flex-col">
          <AppHeader asOf={DEMO_NOW} logoutCsrf={logoutCsrf} />
          <div data-exploration-host />

          {/* Scene 1 is an asymmetric bento: commitments down the left as the main
              work surface; the map, then dependencies beside working capital and
              Drona, on the right. Scenes 2 and 3 are the split. The map's parent is
              the same element either way — only its classes change — so it never
              remounts. Below 1100px the surface stacks, commitments first. */}
          <div
            className={cn(
              "flex min-h-0 flex-1",
              surface
                ? "mx-auto w-full max-w-[1600px] flex-col overflow-y-auto px-5 pb-5 pt-1 min-[1100px]:overflow-hidden"
                : workspace
                  ? "mx-auto w-full max-w-[1600px] flex-col overflow-y-auto px-5 pb-6 pt-1"
                  : "flex-row"
            )}
          >
          <div
            className={cn(
              surface
                ? "flex shrink-0 flex-col gap-4 min-[1100px]:grid min-[1100px]:min-h-0 min-[1100px]:flex-1 min-[1100px]:grid-cols-12 min-[1100px]:grid-rows-[minmax(240px,36fr)_64fr]"
                : workspace
                  ? /* Scene 2: one 12-column grid. The stage below spans it as a subgrid,
                       so the map (page-owned, never remounted) and the workspace
                       surfaces share one set of tracks. */
                    "flex shrink-0 flex-col gap-3 min-[1100px]:grid min-[1100px]:grid-cols-12 min-[1100px]:grid-rows-[auto_minmax(272px,auto)_auto]"
                  : "flex min-h-0 flex-1 flex-row"
            )}
          >
          <DronaMap
            plant={PLANT}
            suppliers={suppliers}
            destinations={destinations}
            chain={regulatoryPath ? null : chain}
            frameTo={frameTo}
            production={null}
            layout={surface || workspace ? "card" : "scene"}
            emphasisCommitmentId={surface ? emphasis : null}
            overlay={
              surface ? (
                <MapCardHeader scope={scope} selectedLabel={scopeLabel} onScope={setScope} />
              ) : workspace ? (
                <OrderMapCaption />
              ) : regulatoryPath ? <div className="pointer-events-none absolute left-4 top-4 z-20 rounded-card bg-surface p-3"><p className="text-body-s text-label-primary">India → Denmark</p><p className="text-caption text-label-tertiary">Planned geography · scope checked in the investigation</p></div> : null
            }
            className={
              surface
                ? "order-2 h-[300px] shrink-0 rounded-surface shadow-rest min-[1100px]:order-none min-[1100px]:col-span-7 min-[1100px]:col-start-6 min-[1100px]:row-start-1 min-[1100px]:h-auto"
                : workspace
                  ? /* z-[1] lifts the map over the stage's subgrid, which spans this
                       cell but leaves it empty, so the map keeps its pointer. */
                    "order-2 h-[272px] shrink-0 rounded-surface shadow-rest min-[1100px]:z-[1] min-[1100px]:order-none min-[1100px]:col-span-5 min-[1100px]:col-start-8 min-[1100px]:row-start-2 min-[1100px]:h-auto min-[1100px]:min-h-[272px]"
                  : "h-full min-w-[300px] shrink-0 basis-[34%] border-r border-separator xl:min-w-[380px]"
            }
          />

          {/* Keyed on the scene, so React remounts this subtree and the entrance
              animation replays on every transition — including backwards. The map
              above is deliberately *outside* the key: it must not remount, and
              everything in this file exists to keep that true.

              The remount is also why the assessment lives in the page. Scene 2 is thrown
              away on the way into Scene 3; if the analysis state lived inside it,
              coming back would replay eight steps the reviewer already watched. */}
          <div
            key={scene.scene}
            ref={stageRef}
            /* -1, not 0: this is a destination for focus, never a stop on the way
               through. A reviewer tabbing the surface should meet the controls, not
               the container that holds them. */
            tabIndex={-1}
            role="region"
            aria-label={STAGE_LABEL[scene.scene]}
            className={cn(
              "flex flex-col outline-none motion-safe:animate-scene-enter",
              surface
                ? "order-1 min-h-0 gap-2 min-[1100px]:order-none min-[1100px]:col-span-5 min-[1100px]:col-start-1 min-[1100px]:row-span-2 min-[1100px]:row-start-1"
                : workspace
                  ? "order-1 gap-3 min-[1100px]:order-none min-[1100px]:col-span-12 min-[1100px]:col-start-1 min-[1100px]:row-span-3 min-[1100px]:row-start-1 min-[1100px]:grid min-[1100px]:grid-cols-subgrid min-[1100px]:grid-rows-subgrid"
                  : "h-full min-h-0 min-w-0 flex-1"
            )}
          >
            {surface ? (
              <>
                <CommitmentStateStrip
                  filter={filter}
                  onFilterState={(state) => setFilter((current) => toggleFilter(current, { kind: "state", state }))}
                  className="shrink-0"
                />
                <CommitmentQueue
                  filter={filter}
                  onClearFilter={() => setFilter(null)}
                  onOpen={onOpen}
                  onEmphasis={setEmphasis}
                  className="min-h-[620px] flex-1 min-[1100px]:min-h-0"
                />
              </>
            ) : null}

            {scene.scene === 2 && open && assessment ? (
              <CommitmentScene
                commitmentId={open}
                assessment={assessment}
                workbench={workbench}
                onBack={() => setScene(goBack)}
                onOpenComponent={(componentId) =>
                  setScene((current) => openComponent(current, componentId))
                }
              />
            ) : null}

            {scene.scene === 3 && chain ? (
              <PathwayScene
                chain={chain}
                onBack={() => setScene(goBack)}
                onSwitch={(componentId) =>
                  setScene((current) => switchComponent(current, componentId))
                }
              />
            ) : null}
          </div>

          {/* The right column beneath the map: the analytical heart beside two
              supporting surfaces. Scene 1 only, so it mounts fresh on every return. */}
          {surface ? (
            <div className="order-3 flex flex-col gap-4 motion-safe:animate-scene-enter min-[1100px]:order-none min-[1100px]:col-span-7 min-[1100px]:col-start-6 min-[1100px]:row-start-2 min-[1100px]:grid min-[1100px]:min-h-0 min-[1100px]:grid-cols-[minmax(0,5fr)_minmax(0,3fr)] min-[1100px]:grid-rows-[auto_1fr]">
              <DependencyRadial
                filter={filter}
                onFilterType={(type) => setFilter((current) => toggleFilter(current, { kind: "type", type }))}
                className="min-h-[600px] min-[1100px]:col-start-1 min-[1100px]:row-span-2 min-[1100px]:min-h-0"
              />
              <WorkingCapitalCard className="min-[1100px]:col-start-2" />
              <DronaWorkspace onOpen={onOpen} className="min-h-[320px] min-[1100px]:col-start-2 min-[1100px]:min-h-0" />
            </div>
          ) : null}
          </div>
          </div>
        </main>
      </div>

      </GuidedDemoBoundary>
      <GuidedDemoRoot />
    </>
    </GuidedDemoProvider>
  );
}
