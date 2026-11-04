import { describe, expect, it } from "vitest";

import { bandedFor, criticalComponents } from "@/lib/network/bom";
import {
  SUBTIER_NETWORKS,
  sharedSubTiers,
  subTierNetworkFor,
  weakLinkConfidence,
} from "./index";

const networks = [...SUBTIER_NETWORKS.values()];

describe("sub-tier networks", () => {
  it("maps exactly the five critical Tier-1s on the Wind Energy order", () => {
    const critical = new Set(criticalComponents(bandedFor("c1")).map((c) => c.supplier.id));
    expect(new Set(SUBTIER_NETWORKS.keys())).toEqual(critical);
  });

  it("returns undefined for an unmapped supplier rather than guessing", () => {
    expect(subTierNetworkFor("sup:does-not-exist")).toBeUndefined();
  });

  it.each(networks.map((n) => [n.supplierId, n] as const))(
    "%s is a realistic spread",
    (_id, network) => {
      expect(network.nodes.length).toBeGreaterThanOrEqual(20);
      expect(network.nodes.length).toBeLessThanOrEqual(35);

      const states = new Set(
        network.nodes.filter((n) => !n.abroad).map((n) => n.node.region)
      );
      expect(states.size).toBeGreaterThanOrEqual(5);

      const abroad = network.nodes.filter((n) => n.abroad).length;
      expect(abroad / network.nodes.length).toBeLessThanOrEqual(0.2);

      // Buys through traders as well as direct.
      const distributors = network.nodes.filter((n) => n.node.role === "distributor");
      expect(distributors.length).toBeGreaterThan(0);
      expect(network.nodes.some((n) => n.node.channel === "direct")).toBe(true);
    }
  );

  it("has at least one foreign source across the five", () => {
    expect(networks.some((network) => network.nodes.some((n) => n.abroad))).toBe(true);
  });

  it("has a distributor with tier-3 sources behind it in every network", () => {
    networks.forEach((network) => {
      const behindDistributor = network.edges.some((edge) =>
        network.nodes.some(
          (n) => n.node.id === edge.toId && n.node.role === "distributor"
        )
      );
      expect(behindDistributor, network.supplierId).toBe(true);
    });
  });

  it("derives tier from the edges, not the node", () => {
    const deccan = subTierNetworkFor("sup:deccan-mainshaft-forgings")!;
    const ludhiana = subTierNetworkFor("sup:ludhiana-ring-forgings")!;
    const durgapur = "st:durgapur-special-steels";
    expect(deccan.nodes.find((n) => n.node.id === durgapur)?.tier).toBe(3);
    expect(ludhiana.nodes.find((n) => n.node.id === durgapur)?.tier).toBe(2);
  });

  it("has exactly one weak link per network, and its route ends at the Tier-1", () => {
    networks.forEach((network) => {
      expect(network.nodes.filter((n) => n.weakLink)).toHaveLength(1);
      expect(network.weakLinkRoute[0]).toBe(network.weakLink.nodeId);
      const last = network.weakLinkRoute[network.weakLinkRoute.length - 1];
      expect(network.edges.some((e) => e.fromId === last && e.toId === network.supplierId)).toBe(true);
      expect(network.weakLink.conditions.length).toBeGreaterThanOrEqual(2);
    });
  });

  it("puts each weak link on a different primary risk kind", () => {
    const kinds = networks.map((network) => {
      const weak = network.nodes.find((n) => n.weakLink)!;
      return weak.node.signals[0]?.kind;
    });
    expect(kinds.every(Boolean)).toBe(true);
    expect(new Set(kinds).size).toBe(networks.length);
  });

  it("names at least two parties behind more than one critical Tier-1", () => {
    const shared = sharedSubTiers();
    expect(shared.length).toBeGreaterThanOrEqual(2);
    shared.forEach((entry) => {
      const flagged = entry.supplierIds.map(
        (id) => subTierNetworkFor(id)!.nodes.find((n) => n.node.id === entry.node.id)!.shared
      );
      expect(flagged.every(Boolean)).toBe(true);
    });
  });

  it("hides the magnesium import behind the nodulariser", () => {
    const saurashtra = subTierNetworkFor("sup:saurashtra-ductile-castings")!;
    const mg = saurashtra.edges.find((e) => e.fromId === "st:yulin-magnesium");
    expect(mg?.toId).toBe("st:nagpur-nodularisers");
    expect(saurashtra.nodes.find((n) => n.node.id === "st:yulin-magnesium")).toMatchObject({
      tier: 3,
      abroad: true,
    });
  });

  it("names a critical Tier-1 as a sub-tier of another", () => {
    const tiruchi = subTierNetworkFor("sup:tiruchi-tower-sections")!;
    expect(tiruchi.nodes.some((n) => n.node.tierOneId === "sup:ludhiana-ring-forgings")).toBe(true);
  });

  it("gives every edge a basis, and every weak link a confidence", () => {
    networks.forEach((network) => {
      network.edges.forEach((edge) => expect(edge.basis.length).toBeGreaterThan(0));
      expect(["verified", "inferred", "low", "missing"]).toContain(weakLinkConfidence(network));
    });
  });

  it("never gives a signal a level or a number", () => {
    networks.forEach((network) =>
      network.nodes.forEach((n) =>
        n.node.signals.forEach((signal) => {
          expect(Object.keys(signal).sort()).toEqual(["kind", "note"]);
          expect(signal.note).not.toMatch(/risk score|\d+\s*\/\s*10/i);
        })
      )
    );
  });
});
