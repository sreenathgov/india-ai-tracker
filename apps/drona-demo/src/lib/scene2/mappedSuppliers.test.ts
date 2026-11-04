import { describe, expect, it } from "vitest";
import { suppliersForCommitment } from "@/lib/network/gazetteer";
import { subTierNetworkFor } from "@/lib/network/subtier";
import { mappedSuppliers } from "./mappedSuppliers";

describe("registered mapped-supplier coverage", () => {
  it("deduplicates shared parties and direct/upstream aliases instead of counting appearances", () => {
    const networks = suppliersForCommitment("c1").flatMap(s => subTierNetworkFor(s.id)?.nodes ?? []);
    expect(networks).toHaveLength(131);
    expect(new Set(networks.map(n => n.node.id)).size).toBe(121);
    const directIds = suppliersForCommitment("c1").map(s => s.id);
    expect(networks.some(n => n.node.tierOneId && directIds.includes(n.node.tierOneId))).toBe(true);
    expect(mappedSuppliers("c1")).toEqual({ direct: 41, upstream: 120, total: 161, expandedRoots: 5 });
  });
  it("scopes coverage to the selected order rather than borrowing the featured network", () => {
    expect(mappedSuppliers("c2").direct).toBe(suppliersForCommitment("c2").length);
    expect(mappedSuppliers("c2").total).not.toBe(161);
    expect(mappedSuppliers("not-an-order")).toEqual({ direct: 0, upstream: 0, total: 0, expandedRoots: 0 });
  });
});
