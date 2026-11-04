import { suppliersForCommitment } from "@/lib/network/gazetteer";
import { subTierNetworkFor } from "@/lib/network/subtier";

/** Registered parties behind this order's direct suppliers, not a claim of full
 * order participation. Canonical IDs dedupe shared parties and cross-tier aliases.
 * Case-only graph objects are deliberately outside this registry-based metric. */
export function mappedSuppliers(commitmentId: string) {
  const direct = suppliersForCommitment(commitmentId);
  const directIds = new Set(direct.map(supplier => supplier.id));
  const identities = new Set(directIds);
  let expandedRoots = 0;
  for (const supplier of direct) {
    const network = subTierNetworkFor(supplier.id);
    if (!network) continue;
    expandedRoots++;
    for (const { node } of network.nodes) identities.add(node.tierOneId ?? node.id);
  }
  return { direct: directIds.size, upstream: identities.size - directIds.size, total: identities.size, expandedRoots };
}
