import * as React from "react";

import { evidenceMark } from "@/lib/map/epistemic";
import { CONFIDENCE_LABEL, type Confidence } from "@/lib/network/confidence";
import {
  CHANNEL_LABEL,
  RISK_KIND_LABEL,
  ROLE_LABEL,
  SUBTIER_ROLES,
  subTierNetworkFor,
  type ResolvedSubTierNode,
} from "@/lib/network/subtier";
import {
  isFiltered,
  passes,
  toggleAbroad,
  toggleFlagged,
  toggleRole,
  ALL_SUBTIER,
  type SubTierFilter,
} from "@/lib/network/subtier/filter";
import { cn } from "@/lib/ui/cn";

/**
 * Everything behind one Tier-1, grouped by what it is to that Tier-1.
 *
 * The same filter drives the map legend, so the table and the map always show the
 * same parties. Hovering a row lights its node on the map, and the other way round.
 *
 * Ink stays neutral here (BRAND §5): sub-tiers carry evidence, not concern. The weak
 * link is the only row marked, and it is marked with a word as well as a rule, so
 * the distinction survives without colour. Signals are chips that name a kind and
 * say what was observed — never a level.
 */
export function SubTierTable({
  supplierId,
  filter,
  onFilter,
  highlightId,
  onHover,
}: {
  readonly supplierId: string;
  readonly filter: SubTierFilter;
  readonly onFilter: (filter: SubTierFilter) => void;
  readonly highlightId: string | null;
  readonly onHover: (nodeId: string | null) => void;
}): React.ReactElement {
  const network = subTierNetworkFor(supplierId);

  if (!network) {
    return (
      <section aria-label="Sub-tier network">
        <h3 className="micro-label text-label-quaternary">Behind this supplier</h3>
        <p className="mt-3 rounded-card bg-inset px-4 py-3 text-body-s text-label-secondary">
          Sub-tier network not yet mapped for this supplier.
        </p>
      </section>
    );
  }

  const shown = network.nodes.filter((entry) => passes(entry, filter));
  const abroad = network.nodes.filter((n) => n.abroad).length;
  const flagged = network.nodes.filter((n) => n.node.signals.length > 0).length;
  const regions = new Set(network.nodes.filter((n) => !n.abroad).map((n) => n.node.region)).size;

  return (
    <section aria-label="Sub-tier network">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="micro-label text-label-quaternary">Behind this supplier</h3>
        <p className="font-mono text-mono-s text-label-tertiary" data-figure>
          {network.nodes.length} parties · {regions} states · {abroad} abroad · {flagged} flagged
        </p>
      </div>

      <FilterBar filter={filter} onFilter={onFilter} />

      <div className="mt-3 overflow-hidden rounded-card bg-surface shadow-card">
        {SUBTIER_ROLES.map((role) => {
          const rows = shown.filter((entry) => entry.node.role === role);
          if (rows.length === 0) return null;
          return (
            <div key={role} role="group" aria-label={ROLE_LABEL[role]}>
              <p className="micro-label border-b border-separator bg-raised px-4 py-1.5 text-label-tertiary">
                {ROLE_LABEL[role]}{" "}
                <span className="font-mono text-mono-s text-label-quaternary">{rows.length}</span>
              </p>
              <ul>
                {rows.map((entry) => (
                  <Row
                    key={entry.node.id}
                    entry={entry}
                    highlighted={entry.node.id === highlightId}
                    onHover={onHover}
                  />
                ))}
              </ul>
            </div>
          );
        })}
        {shown.length === 0 ? (
          <p className="px-4 py-3 text-caption text-label-tertiary">No party matches this filter.</p>
        ) : null}
      </div>
    </section>
  );
}

function Row({
  entry,
  highlighted,
  onHover,
}: {
  readonly entry: ResolvedSubTierNode;
  readonly highlighted: boolean;
  readonly onHover: (nodeId: string | null) => void;
}): React.ReactElement {
  const { node } = entry;
  return (
    <li
      onMouseEnter={() => onHover(node.id)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(node.id)}
      onBlur={() => onHover(null)}
      tabIndex={0}
      aria-current={highlighted || undefined}
      className={cn(
        "grid grid-cols-[16px_minmax(0,1.3fr)_minmax(0,1fr)] gap-x-3 border-b border-separator px-4 py-2.5 outline-none last:border-b-0",
        "motion-safe:transition-colors motion-safe:duration-fast",
        highlighted ? "bg-inset" : "hover:bg-raised focus-visible:bg-raised",
        entry.weakLink && "shadow-[inset_2px_0_0_var(--concern-critical-ink)]"
      )}
    >
      <EvidenceDot confidence={entry.confidence} />
      <div className="min-w-0">
        <p className="flex flex-wrap items-baseline gap-x-2 text-body-s text-label-primary">
          <span className="truncate">{node.name}</span>
          {entry.weakLink ? (
            <span className="micro-label text-[color:var(--concern-critical-ink)]">Weak link</span>
          ) : null}
          {entry.shared ? <span className="micro-label text-label-tertiary">Shared</span> : null}
          {node.tierOneId ? <span className="micro-label text-label-tertiary">Also Tier-1</span> : null}
        </p>
        <p className="mt-0.5 text-caption text-label-secondary">{node.sources}</p>
        {node.signals.length > 0 ? (
          <ul className="mt-1.5 flex flex-wrap gap-1.5">
            {node.signals.map((signal) => (
              <li
                key={signal.kind + signal.note}
                title={signal.note}
                className="rounded-chip bg-inset px-2 py-0.5 text-caption text-label-secondary"
              >
                {RISK_KIND_LABEL[signal.kind]}
                <span className="sr-only">: {signal.note}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <div className="min-w-0 text-right text-caption text-label-tertiary">
        <p className="truncate">
          {entry.abroad ? (
            <span className="mr-1 text-label-secondary" aria-label="Imported">
              ↗
            </span>
          ) : null}
          {node.city}, {entry.abroad ? node.country : node.region}
        </p>
        <p className="mt-0.5 font-mono text-mono-s text-label-quaternary">
          T{entry.tier} · {CHANNEL_LABEL[node.channel]} · {node.sourcing}
        </p>
      </div>
    </li>
  );
}

function EvidenceDot({ confidence }: { readonly confidence: Confidence }): React.ReactElement {
  const mark = evidenceMark(confidence);
  return (
    <svg
      role="img"
      aria-label={CONFIDENCE_LABEL[confidence]}
      width="10"
      height="10"
      viewBox="0 0 10 10"
      className="mt-[5px] text-label-secondary"
    >
      <title>{CONFIDENCE_LABEL[confidence]}</title>
      <circle
        cx="5"
        cy="5"
        r="4"
        fill={mark.fill === "solid" ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.3"
        style={{ strokeDasharray: mark.dash ?? undefined }}
      />
      {mark.fill === "ring" ? <circle cx="5" cy="5" r="1.6" fill="currentColor" /> : null}
    </svg>
  );
}

function FilterBar({
  filter,
  onFilter,
}: {
  readonly filter: SubTierFilter;
  readonly onFilter: (filter: SubTierFilter) => void;
}): React.ReactElement {
  return (
    <div role="toolbar" aria-label="Filter sub-tier parties" className="mt-3 flex flex-wrap gap-1.5">
      {SUBTIER_ROLES.map((role) => (
        <Toggle key={role} strike on={filter.roles.has(role)} onClick={() => onFilter(toggleRole(filter, role))}>
          {ROLE_LABEL[role]}
        </Toggle>
      ))}
      <span aria-hidden="true" className="mx-1 w-px self-stretch bg-separator" />
      <Toggle on={filter.flaggedOnly} onClick={() => onFilter(toggleFlagged(filter))}>
        Flagged only
      </Toggle>
      <Toggle on={filter.abroadOnly} onClick={() => onFilter(toggleAbroad(filter))}>
        Abroad only
      </Toggle>
      {isFiltered(filter) ? (
        <button
          type="button"
          onClick={() => onFilter(ALL_SUBTIER)}
          className="rounded-chip px-2 py-0.5 text-caption text-label-tertiary underline-offset-2 hover:underline"
        >
          Show all
        </button>
      ) : null}
    </div>
  );
}

function Toggle({
  on,
  strike = false,
  onClick,
  children,
}: {
  readonly on: boolean;
  /** Role toggles include by default, so "off" reads as struck out; modifiers do not. */
  readonly strike?: boolean;
  readonly onClick: () => void;
  readonly children: React.ReactNode;
}): React.ReactElement {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        "rounded-chip px-2.5 py-0.5 text-caption motion-safe:transition-colors motion-safe:duration-fast",
        on
          ? "bg-inset text-label-primary"
          : cn("text-label-tertiary hover:bg-raised", strike && "text-label-quaternary line-through")
      )}
    >
      {children}
    </button>
  );
}
