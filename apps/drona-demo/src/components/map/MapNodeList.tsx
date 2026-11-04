"use client";

import * as React from "react";

import type { MapData, MapNode } from "@/lib/map/mapData";
import { CONCERN_LABEL } from "@/components/ui/ConcernMark";

const describe = (node: MapNode): string => {
  switch (node.kind) {
    case "plant":
      return `${node.title}, manufacturing plant, ${node.place}`;
    case "destination":
      return `${node.title}, buyer, ${node.place}`;
    case "upstream":
      return `${node.title}, ${node.role ?? "upstream dependency"}, ${node.place}`;
    case "subtier": {
      const signals = node.subtier?.node.signals.length ?? 0;
      return [
        node.title,
        node.role ?? "sub-tier supplier",
        node.subtier ? `supplies ${node.subtier.node.sources}` : null,
        node.place,
        signals > 0 ? `${signals} ${signals === 1 ? "signal" : "signals"} noted` : null,
        node.subtier?.weakLink ? "weak link" : null,
      ]
        .filter(Boolean)
        .join(", ");
    }
    case "supplier":
      return `${node.title}, Tier-1 supplier, ${node.place}, ${CONCERN_LABEL[node.concern ?? "low"]}`;
  }
};

/**
 * The map, as a list.
 *
 * A canvas has no accessibility tree, so everything the map shows is also here as a
 * real button: a screen reader hears the network, and a keyboard can reach any node
 * and have the map fly to it. Visually hidden until focused, when it surfaces as a
 * compact panel so a sighted keyboard user can see where focus is.
 */
export function MapNodeList({
  data,
  onFocus,
}: {
  readonly data: MapData;
  readonly onFocus: (node: MapNode) => void;
}): React.ReactElement {
  const nodes = [data.plant, ...data.destinations, ...data.suppliers, ...data.upstream];

  return (
    <nav
      aria-label="Map nodes"
      className="sr-only focus-within:not-sr-only focus-within:absolute focus-within:left-3 focus-within:top-3 focus-within:z-40 focus-within:max-h-[60%] focus-within:w-[300px] focus-within:overflow-y-auto focus-within:rounded-chip focus-within:border focus-within:border-separator focus-within:bg-surface focus-within:p-2 focus-within:shadow-popover"
    >
      <ul>
        {nodes.map((node) => (
          <li key={node.id}>
            <button
              type="button"
              onClick={() => onFocus(node)}
              className="w-full rounded-pill px-2 py-1 text-left text-caption text-label-secondary focus-visible:bg-inset focus-visible:text-label-primary focus-visible:outline-none"
            >
              {describe(node)}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
