import * as React from "react";

import { SUBTIER_NODES } from "@/lib/network/subtier";
import type { SupplierInvestigation } from "@/lib/scene2/investigation";
import type { InvestigationTab } from "@/lib/scene2/supplierView";
import { DEPENDENCY_KIND_LABEL, SOURCE_TYPE_LABEL } from "./labels";

/** What each unbuilt surface will become, said plainly rather than implied. */
const PROMISE: Readonly<Record<Exclude<InvestigationTab, "overview">, string>> = {
  "supply-chain": "The dependency map, its shared parties and the independence test arrive in a later phase.",
  evidence: "The evidence register, each claim's trail and the contradiction view arrive in a later phase.",
};

/**
 * A surface that is routed but not built.
 *
 * It shows what the investigation already holds — nothing invented, nothing
 * interactive — so the tab is honest about the state of the work rather than
 * pretending with a spinner or an empty frame.
 */
export function PendingTab({
  tab,
  inv,
}: {
  readonly tab: Exclude<InvestigationTab, "overview">;
  readonly inv: SupplierInvestigation | null;
}): React.ReactElement {
  return (
    <div className="max-w-measure-tight pt-1" data-pending-tab={tab}>
      {inv ? <Preview tab={tab} inv={inv} /> : null}
      <p className="mt-6 border-t border-separator pt-3.5 text-caption leading-[1.5] text-label-quaternary">
        {PROMISE[tab]}
      </p>
    </div>
  );
}

function Preview({
  tab,
  inv,
}: {
  readonly tab: Exclude<InvestigationTab, "overview">;
  readonly inv: SupplierInvestigation;
}): React.ReactElement {
  if (tab === "supply-chain") return <Dependencies inv={inv} />;
  return <Sources inv={inv} />;
}

/** The dependencies as text. No graph: a graph is the later phase's whole job. */
function Dependencies({ inv }: { readonly inv: SupplierInvestigation }): React.ReactElement {
  return (
    <Section label="Dependencies on this route">
      <ul className="flex flex-col gap-3">
        {inv.dependencies.map((dependency) => {
          const node = dependency.subTierNodeId ? SUBTIER_NODES.get(dependency.subTierNodeId) : undefined;
          return (
            <li key={dependency.id} className="min-w-0">
              <p className="text-body-s leading-[1.5] text-label-primary">{dependency.label}</p>
              <p className="mt-0.5 text-caption text-label-tertiary">
                {DEPENDENCY_KIND_LABEL[dependency.kind]}
                {node ? ` · ${node.name}, ${node.city}` : ""}
              </p>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}

/** How many pieces of evidence of each kind the finding rests on. */
function Sources({ inv }: { readonly inv: SupplierInvestigation }): React.ReactElement {
  const counts = inv.evidence.reduce<ReadonlyMap<string, number>>(
    (acc, item) => new Map(acc).set(item.sourceType, (acc.get(item.sourceType) ?? 0) + 1),
    new Map()
  );
  return (
    <Section label={`${inv.evidence.length} pieces of evidence`}>
      <ul className="flex flex-col gap-2">
        {[...counts.entries()].map(([sourceType, count]) => (
          <li key={sourceType} className="flex items-baseline justify-between gap-4 text-body-s text-label-secondary">
            <span>{SOURCE_TYPE_LABEL[sourceType as keyof typeof SOURCE_TYPE_LABEL]}</span>
            <span className="tabular-nums text-label-tertiary">{count}</span>
          </li>
        ))}
      </ul>
    </Section>
  );
}

function Section({
  label,
  children,
}: {
  readonly label: string;
  readonly children: React.ReactNode;
}): React.ReactElement {
  return (
    <section className="min-w-0">
      <h3 className="micro-label mb-3 text-label-quaternary">{label}</h3>
      {children}
    </section>
  );
}
