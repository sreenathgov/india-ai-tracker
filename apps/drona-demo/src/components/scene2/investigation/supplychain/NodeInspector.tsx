import * as React from "react";

import { Icon } from "@/components/ui/Icon";
import {
  CONCERN_LABEL,
  EVIDENCE_LABEL,
  EVIDENCE_MEANING,
  NODE_TYPE_LABEL,
  RELATION_LABEL,
  TIER_LABEL,
} from "@/lib/scene2/supplychain/labels";
import { CONCERN_SURFACE } from "@/lib/scene2/supplychain/marks";
import type { GraphEdge, GraphNode } from "@/lib/scene2/supplychain/types";
import type { VisibleGraph } from "@/lib/scene2/supplychain/view";
import { cn } from "@/lib/ui/cn";

/**
 * The selected object, read without leaving the graph.
 *
 * It answers what this object is, what it contributes to this order, whether the
 * concern runs through it, and what Drona is resting each relationship on. It stops
 * there: the evidence trail and the reasoning behind a claim are a different surface,
 * and folding them in here would make the graph a second, worse version of it.
 */
export function NodeInspector({
  node,
  graph,
  onSelect,
  onClose,
  onShowInEvidence,
}: {
  readonly node: GraphNode;
  readonly graph: VisibleGraph;
  readonly onSelect: (id: string) => void;
  readonly onClose: () => void;
  readonly onShowInEvidence?: (claimId: string) => void;
}): React.ReactElement {
  const byId = new Map(graph.nodes.map((entry) => [entry.id, entry] as const));
  const depends = graph.edges.filter((edge) => edge.fromId === node.id);
  const supports = graph.edges.filter((edge) => edge.toId === node.id);
  const surface = CONCERN_SURFACE[node.concern];

  return (
    <aside
      data-node-inspector={node.id}
      className="flex h-full w-[312px] shrink-0 flex-col overflow-y-auto rounded-card border border-card-edge bg-card"
    >
      <header
        className="relative border-b px-4 pb-3.5 pt-4"
        style={{
          background: surface.wash ?? "transparent",
          borderColor: surface.edge ?? "var(--separator)",
        }}
      >
        <div className="flex items-start justify-between gap-2">
          <p className="micro-label pt-1 text-label-quaternary">
            {node.type === "supplier" && node.tier
              ? `${NODE_TYPE_LABEL.supplier} · ${TIER_LABEL[node.tier]}`
              : NODE_TYPE_LABEL[node.type]}
          </p>
          <button
            type="button"
            aria-label="Close the inspector"
            onClick={onClose}
            className="-mr-1 -mt-1 rounded-pill p-1 text-label-quaternary transition-colors hover:bg-hover hover:text-label-secondary"
          >
            <Icon name="close" />
          </button>
        </div>
        <h3 className="mt-1.5 text-title-m leading-tight text-label-primary">{node.name}</h3>
        {node.detail ? <p className="mt-1 text-body-s leading-[1.5] text-label-secondary">{node.detail}</p> : null}
        {node.place ? <p className="mt-0.5 text-caption text-label-tertiary">{node.place}</p> : null}
      </header>

      <div className="flex flex-col gap-5 px-4 py-4">
        <State node={node} />
        {node.facts.length > 0 ? (
          <Section label="On this order">
            <dl className="flex flex-col gap-2.5">
              {node.facts.map((fact) => (
                <div key={fact.label}>
                  <dt className="text-caption text-label-quaternary">{fact.label}</dt>
                  <dd className="mt-0.5 text-body-s leading-[1.5] text-label-primary">{fact.value}</dd>
                </div>
              ))}
            </dl>
          </Section>
        ) : null}

        {depends.length > 0 ? (
          <Section label="Depends on">
            <Links edges={depends} byId={byId} pick={(edge) => edge.toId} onSelect={onSelect} />
          </Section>
        ) : null}
        {supports.length > 0 ? (
          <Section label="Reached through">
            <Links edges={supports} byId={byId} pick={(edge) => edge.fromId} onSelect={onSelect} />
          </Section>
        ) : null}

        <div className="border-t border-separator pt-3">
          {node.reasoningClaimIds.length > 0 && onShowInEvidence ? (
            <button
              type="button"
              onClick={() => onShowInEvidence(node.reasoningClaimIds[0])}
              className="w-full rounded-chip border border-separator px-3 py-2 text-center text-body-s font-medium text-label-secondary transition-colors hover:bg-hover hover:text-label-primary"
            >
              View evidence & reasoning
            </button>
          ) : (
            <p className="text-caption leading-[1.5] text-label-quaternary">
              No claim in the reasoning graph rests on this object yet.
            </p>
          )}
        </div>
      </div>
    </aside>
  );
}

/** The two axes, stated in words so neither can be read off colour alone. */
function State({ node }: { readonly node: GraphNode }): React.ReactElement {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="micro-label mb-1.5 text-label-quaternary">State</p>
        <p className="text-body-s font-medium leading-[1.5] text-label-primary">{CONCERN_LABEL[node.concern]}</p>
        {node.concernNote ? (
          <p className="mt-1 text-caption leading-[1.55] text-label-secondary">{node.concernNote}</p>
        ) : null}
      </div>
      <div>
        <p className="micro-label mb-1.5 text-label-quaternary">How Drona holds it</p>
        <span className="inline-flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className={cn(
              "inline-block h-[6px] w-[6px] shrink-0 rounded-full",
              node.evidence === "verified" && "bg-label-tertiary",
              node.evidence === "inferred" && "border-[1.5px] border-label-tertiary",
              node.evidence === "unresolved" && "border-[1.5px] border-dashed border-label-tertiary"
            )}
          />
          <span className="text-body-s font-medium text-label-primary">{EVIDENCE_LABEL[node.evidence]}</span>
        </span>
        <p className="mt-1 text-caption leading-[1.55] text-label-tertiary">{EVIDENCE_MEANING[node.evidence]}</p>
      </div>
    </div>
  );
}

function Links({
  edges,
  byId,
  pick,
  onSelect,
}: {
  readonly edges: readonly GraphEdge[];
  readonly byId: ReadonlyMap<string, GraphNode>;
  readonly pick: (edge: GraphEdge) => string;
  readonly onSelect: (id: string) => void;
}): React.ReactElement {
  return (
    <ul className="flex flex-col gap-2.5">
      {edges.map((edge) => {
        const other = byId.get(pick(edge));
        if (!other) return null;
        return (
          <li key={edge.id}>
            <button
              type="button"
              onClick={() => onSelect(other.id)}
              className="w-full rounded-chip px-2 py-1.5 -mx-2 text-left transition-colors hover:bg-hover"
            >
              <p className="text-body-s leading-[1.4] text-label-primary">{other.name}</p>
              <p className="mt-0.5 text-caption text-label-tertiary">
                {RELATION_LABEL[edge.relation]} · {NODE_TYPE_LABEL[other.type]}
              </p>
              <p className="mt-1 text-caption leading-[1.5] text-label-quaternary">{edge.basis}</p>
            </button>
          </li>
        );
      })}
    </ul>
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
    <section>
      <h4 className="micro-label mb-2 text-label-quaternary">{label}</h4>
      {children}
    </section>
  );
}
