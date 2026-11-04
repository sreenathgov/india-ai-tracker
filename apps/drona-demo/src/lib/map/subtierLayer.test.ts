import { describe, expect, it } from "vitest";

import { criticalProfiles } from "@/lib/network/criticalProfile";
import { PLANT } from "@/lib/network/gazetteer";
import { subTierNetworkFor } from "@/lib/network/subtier";
import { ALL_SUBTIER, toggleAbroad, toggleFlagged } from "@/lib/network/subtier/filter";
import { buildMapData } from "./mapData";
import { productionPositions, subTierLayer } from "./subtierLayer";

const tierOnes = criticalProfiles("c1").map((p) => p.supplier);
const first = tierOnes[0];
const network = subTierNetworkFor(first.id)!;

describe("subTierLayer", () => {
  it("links every critical Tier-1 to the plant, solid, even with no network selected", () => {
    const layer = subTierLayer({ plant: PLANT, tierOnes, network: null, filter: ALL_SUBTIER });
    expect(layer.nodes).toHaveLength(0);
    expect(layer.flows).toHaveLength(5);
    expect(layer.flows.every((f) => f.confidence === "verified")).toBe(true);
  });

  it("places the whole selected network with its metadata", () => {
    const layer = subTierLayer({ plant: PLANT, tierOnes, network, filter: ALL_SUBTIER });
    expect(layer.nodes).toHaveLength(network.nodes.length);
    expect(layer.nodes.every((n) => n.kind === "subtier" && n.subtier && n.concern === null)).toBe(true);
    expect(layer.nodes.filter((n) => n.subtier!.weakLink)).toHaveLength(1);
    expect(layer.flows).toHaveLength(5 + network.edges.length);
  });

  it("carries each edge's own evidence, not the plant link's", () => {
    const layer = subTierLayer({ plant: PLANT, tierOnes, network, filter: ALL_SUBTIER });
    for (const edge of network.edges) {
      const flow = layer.flows.find((f) => f.id === `dep:${edge.fromId}->${edge.toId}`);
      expect(flow?.confidence).toBe(edge.confidence);
    }
  });

  it("drops edges to parties the filter has hidden, and keeps the weak link", () => {
    const layer = subTierLayer({
      plant: PLANT,
      tierOnes,
      network,
      filter: toggleFlagged(ALL_SUBTIER),
    });
    const visible = new Set([first.id, ...layer.nodes.map((n) => n.id)]);
    expect(layer.nodes.length).toBeLessThan(network.nodes.length);
    expect(layer.nodes.some((n) => n.subtier!.weakLink)).toBe(true);
    for (const flow of layer.flows.slice(5)) {
      const [from, to] = flow.id.replace("dep:", "").split("->");
      expect(visible.has(from) && visible.has(to)).toBe(true);
    }
  });

  it("names the country, not the state, for parties abroad", () => {
    const layer = subTierLayer({
      plant: PLANT,
      tierOnes,
      network,
      filter: toggleAbroad(ALL_SUBTIER),
    });
    for (const node of layer.nodes.filter((n) => n.subtier!.abroad)) {
      expect(node.place.endsWith(node.subtier!.node.country)).toBe(true);
    }
  });
});

describe("productionPositions", () => {
  it("frames on India — domestic parties only", () => {
    const positions = productionPositions({ plant: PLANT, tierOnes, network });
    const domestic = network.nodes.filter((n) => !n.abroad).length;
    expect(positions).toHaveLength(1 + 5 + domestic);
    for (const [lon, lat] of positions.slice(1)) {
      expect(lon).toBeGreaterThan(66);
      expect(lon).toBeLessThan(98);
      expect(lat).toBeGreaterThan(6);
      expect(lat).toBeLessThan(37);
    }
  });
});

describe("buildMapData — production view", () => {
  it("swaps delivery lines for dependency links", () => {
    const data = buildMapData({
      plant: PLANT,
      suppliers: tierOnes,
      destinations: [],
      production: { network, filter: ALL_SUBTIER },
    });
    expect(data.suppliers).toHaveLength(5);
    expect(data.upstream).toHaveLength(network.nodes.length);
    expect(data.flows.every((f) => f.kind === "dependency")).toBe(true);
  });
});
