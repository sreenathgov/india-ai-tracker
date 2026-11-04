"use client";

import * as React from "react";

import type { SupplierCluster } from "@/lib/map/cluster";
import type { MapNode } from "@/lib/map/mapData";
import {
  CONFIDENCE_LABEL,
  CONFIDENCE_MEANING,
} from "@/lib/network/dependencies";
import { CHANNEL_LABEL, RISK_KIND_LABEL, type ResolvedSubTierNode } from "@/lib/network/subtier";
import type { Concern } from "@/lib/network/types";
import { CONCERN_LABEL, ConcernMark } from "@/components/ui/ConcernMark";
import { StateDot } from "@/components/ui/StateDot";
import { commitmentById } from "@/lib/network/gazetteer";
import { STATE_LABEL, stateOf } from "@/lib/portfolio/portfolio";

/** What the pointer is over: one node, or a cluster standing in for several. */
export type HoverTarget =
  | { readonly kind: "node"; readonly node: MapNode }
  | { readonly kind: "cluster"; readonly cluster: SupplierCluster };

const CARD_WIDTH = 256;
const OFFSET = 16;
/** Clearance kept between the card and the map's edges. */
const EDGE = 8;
const CONCERNS: readonly Concern[] = ["critical", "elevated", "low"];

/**
 * Five lines. Not six — plus, for a supplier, what we buy from it.
 *
 * The temptation on a hover card is to add one more useful thing, and then one
 * more, until it is a panel that happens to follow the cursor. Identity, place,
 * tier, current state, and how much depends on it — that is the whole question a
 * reviewer asks of a mark. "Supplies" earns the extra line because with eighty
 * suppliers on screen the name alone no longer says which one this is.
 *
 * Anchored at the pointer position deck.gl reports, flipped across it near the
 * right edge and held between the top and bottom edges, so it never leaves the map.
 */
export function NodeHoverCard({
  target,
  x,
  y,
  containerWidth,
  containerHeight,
}: {
  readonly target: HoverTarget;
  readonly x: number;
  readonly y: number;
  readonly containerWidth: number;
  readonly containerHeight: number;
}): React.ReactElement {
  /* Placed with `left`, not a transform: the entry animation holds `transform` at
     its final keyframe, which would silently cancel the flip. Beside the pointer
     where it fits, across it where it does not, and never outside the map — which
     in the production view is barely wider than the card. */
  const right = x + OFFSET;
  const across = x - OFFSET - CARD_WIDTH;
  const preferred = right + CARD_WIDTH <= containerWidth - EDGE ? right : across;
  const left = Math.max(EDGE, Math.min(preferred, containerWidth - CARD_WIDTH - EDGE));
  /* Centred on the pointer, then held inside the map: the map is often only a few
     hundred pixels tall, and a card cut off at the bottom edge reads as broken. */
  const ref = React.useRef<HTMLDivElement | null>(null);
  const [height, setHeight] = React.useState(0);
  React.useLayoutEffect(() => {
    setHeight(ref.current?.offsetHeight ?? 0);
  }, [target]);
  const top = Math.max(EDGE, Math.min(y - height / 2, containerHeight - height - EDGE));

  return (
    <div
      ref={ref}
      role="status"
      className="pointer-events-none absolute z-20 animate-fade-rise rounded-[14px] bg-[color:var(--bg-map-popover)] px-4 pb-3.5 pt-3.5 shadow-float backdrop-blur-md"
      style={{
        width: CARD_WIDTH,
        left,
        top,
      }}
    >
      {target.kind === "cluster" ? (
        <ClusterLines cluster={target.cluster} />
      ) : (
        <NodeLines node={target.node} />
      )}
    </div>
  );
}

function CommitmentLine({ count }: { readonly count: number }): React.ReactElement | null {
  if (count === 0) return null;
  return (
    <p className="mt-2 text-caption text-label-secondary">
      <span data-figure>{count}</span>
      {count === 1 ? " active production commitment" : " active production commitments"}
    </p>
  );
}

function ClusterLines({
  cluster,
}: {
  readonly cluster: SupplierCluster;
}): React.ReactElement {
  const countries = new Set(cluster.members.map((m) => m.supplier?.country ?? ""));
  const place =
    countries.size === 1 ? [...countries][0] : `${countries.size} countries`;
  const commitments = new Set(cluster.members.flatMap((m) => m.commitmentIds)).size;

  return (
    <>
      <p className="text-body-s font-medium text-label-primary">
        <span data-figure>{cluster.count}</span> Tier-1 suppliers
      </p>
      <p className="mt-1 text-caption text-label-secondary">{place}</p>
      <ul className="mt-3 space-y-1">
        {CONCERNS.filter((c) => cluster.breakdown[c] > 0).map((concern) => (
          <li
            key={concern}
            className="flex items-center gap-2 text-caption text-label-secondary"
          >
            <ConcernMark concern={concern} size={11} className="translate-y-[0.5px]" />
            <span data-figure>{cluster.breakdown[concern]}</span>
            {CONCERN_LABEL[concern].toLowerCase()}
          </li>
        ))}
      </ul>
      <CommitmentLine count={commitments} />
      <p className="mt-3 text-caption text-label-tertiary">Click to look closer</p>
    </>
  );
}

function NodeLines({ node }: { readonly node: MapNode }): React.ReactElement {
  return (
    <>
      <p className="text-body-s font-medium text-label-primary">{node.title}</p>
      <p className="mt-1 text-caption text-label-secondary">{node.place}</p>

      {node.kind === "destination" ? (
        <DestinationLines commitmentId={node.commitmentIds[0]} />
      ) : node.kind === "plant" ? (
        <p className="mt-3 text-caption text-label-tertiary">Manufacturing plant</p>
      ) : node.kind === "subtier" && node.subtier ? (
        <SubTierLines node={node} entry={node.subtier} />
      ) : node.kind === "upstream" ? (
        /* No concern mark. Drona has located this node, not assessed it, and a
           concern colour here would be an assessment the model never made. What it
           can honestly say is how well it knows the node is there at all. */
        <>
          <p className="mt-3 text-caption text-label-tertiary">
            {node.role ?? "Upstream dependency"}
          </p>
          <p className="mt-2 text-caption text-label-secondary">
            {CONFIDENCE_LABEL[node.confidence ?? "missing"]}
          </p>
          <p className="mt-1 max-w-measure-tight font-sans text-micro italic text-label-tertiary">
            {CONFIDENCE_MEANING[node.confidence ?? "missing"]}
          </p>
        </>
      ) : (
        <>
          <p className="mt-3 text-caption text-label-tertiary">
            Tier 1{node.supplier ? ` · ${node.supplier.category}` : ""}
          </p>
          {node.supplier ? (
            <p className="mt-1 text-caption text-label-secondary">
              Supplies {node.supplier.supplies.join(", ")}
            </p>
          ) : null}
          <p className="mt-2 flex items-center gap-2 text-caption text-label-secondary">
            <ConcernMark
              concern={node.concern ?? "low"}
              size={11}
              className="translate-y-[0.5px]"
            />
            {CONCERN_LABEL[node.concern ?? "low"]}
          </p>
        </>
      )}

      {node.kind === "destination" ? null : <CommitmentLine count={node.commitmentIds.length} />}
    </>
  );
}

const DUE = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

/** A destination is a commitment's far end: say which one, how big, when, and where it stands. */
function DestinationLines({ commitmentId }: { readonly commitmentId?: string }): React.ReactElement {
  const commitment = commitmentId ? commitmentById(commitmentId) : undefined;
  const state = commitmentId ? stateOf(commitmentId) : undefined;
  if (!commitment) {
    return <p className="mt-3 text-caption text-label-tertiary">Buyer · delivery destination</p>;
  }
  return (
    <>
      <p className="mt-3 text-caption text-label-primary">{commitment.name}</p>
      <p className="mt-1 text-caption text-label-secondary">
        <span data-figure>{commitment.units}</span> units · required{" "}
        <span data-figure>{DUE.format(new Date(commitment.requiredBy))}</span>
      </p>
      {state ? (
        <p className="mt-2 flex items-center gap-2 text-caption text-label-secondary">
          <StateDot state={state} />
          {STATE_LABEL[state]}
        </p>
      ) : null}
    </>
  );
}

/**
 * A sub-tier party: what it is, what it supplies, how it is reached, what is noted
 * against it, and how well Drona knows the link. Signals are listed by kind, never
 * graded — they are metadata here, not an assessment. The weak link says so in words
 * as well as in its ring, so the one critical mark is never colour alone.
 */
function SubTierLines({
  node,
  entry,
}: {
  readonly node: MapNode;
  readonly entry: ResolvedSubTierNode;
}): React.ReactElement {
  const { signals } = entry.node;
  return (
    <>
      <p className="mt-3 text-caption text-label-tertiary">
        {node.role} · {CHANNEL_LABEL[entry.node.channel]}
      </p>
      <p className="mt-1 text-caption text-label-secondary">Supplies {entry.node.sources}</p>
      {signals.length > 0 ? (
        <ul className="mt-2 space-y-0.5">
          {signals.map((signal) => (
            <li key={`${signal.kind}:${signal.note}`} className="text-caption text-label-secondary">
              <span className="text-label-primary">{RISK_KIND_LABEL[signal.kind]}</span> —{" "}
              {signal.note}
            </li>
          ))}
        </ul>
      ) : null}
      {entry.weakLink ? (
        <p className="mt-2 text-caption text-[color:var(--concern-critical-ink)]">
          Weak link for this Tier-1
        </p>
      ) : null}
      <p className="mt-2 text-caption text-label-secondary">{CONFIDENCE_LABEL[entry.confidence]}</p>
    </>
  );
}
