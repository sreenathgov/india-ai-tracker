"use client";

import * as React from "react";
import { useMaterialWalkthrough } from "@/components/guided/MaterialWalkthrough";

import { evidenceRegisterRows, type EvidenceRegisterRow, type SupplierInvestigation } from "@/lib/scene2/investigation";
import { cn } from "@/lib/ui/cn";
import { EVIDENCE_FILTER_GROUP, EVIDENCE_FILTER_LABEL, type EvidenceFilter } from "../labels";
import { EvidenceSourceCard } from "./EvidenceSourceCard";

const FILTERS: readonly EvidenceFilter[] = [
  "all",
  "internal",
  "supplier",
  "external",
  "market",
  "regulatory",
  "contradicting",
  "unresolved",
];

function matchesFilter(row: EvidenceRegisterRow, filter: EvidenceFilter): boolean {
  if (filter === "all") return true;
  if (filter === "contradicting") return row.kind === "held" && row.contradicts.length > 0;
  if (filter === "unresolved") return row.kind === "requested";
  return row.kind === "held" && row.sourceType !== null && EVIDENCE_FILTER_GROUP[row.sourceType] === filter;
}

/**
 * The register: every source Drona holds, plus every source it's still asking for,
 * as one filterable, searchable list. A filter with nothing in it — "Contradicting",
 * today — still renders the chip and an honest empty state rather than hiding the
 * option, so the reviewer sees what was checked, not just what was found.
 */
export function EvidenceRegister({
  inv,
  selectedId,
  onSelect,
}: {
  readonly inv: SupplierInvestigation;
  readonly selectedId: string | null;
  readonly onSelect: (id: string | null) => void;
}): React.ReactElement {
  const tour = useMaterialWalkthrough();
  const [filter, setFilter] = React.useState<EvidenceFilter>("all");
  const [query, setQuery] = React.useState("");
  const itemRefs = React.useRef(new Map<string, HTMLDivElement>());

  React.useEffect(() => {
    setFilter("all");
    setQuery("");
  }, [inv.id]);

  const rows = React.useMemo(() => evidenceRegisterRows(inv), [inv]);

  const visible = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((row) => matchesFilter(row, filter) && (q === "" || row.source.toLowerCase().includes(q) || row.scope.toLowerCase().includes(q) || row.excerpt?.toLowerCase().includes(q)));
  }, [rows, filter, query]);

  React.useEffect(() => {
    if (!selectedId) return;
    setFilter("all"); setQuery("");
  }, [selectedId]);
  React.useEffect(() => {
    if (selectedId) itemRefs.current.get(selectedId)?.scrollIntoView({ block: "nearest", behavior: "auto" });
  }, [selectedId, visible]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3" data-evidence-register style={tour?.enabled && tour.beat === "source" ? { marginRight: 340 } : undefined}>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <div className="flex flex-wrap items-center gap-1" role="group" aria-label="Evidence filter">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              aria-pressed={filter === f}
              onClick={() => setFilter(f)}
              className={cn(
                "inline-flex h-7 items-center justify-center rounded-full border px-2.5 text-caption transition-colors",
                filter === f
                  ? "border-transparent bg-sheet font-medium text-label-primary shadow-lift"
                  : "border-transparent text-label-tertiary hover:text-label-primary"
              )}
            >
              {EVIDENCE_FILTER_LABEL[f]}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Search evidence" placeholder="Search evidence"
          className="ml-auto h-7 w-[180px] rounded-pill border border-separator bg-transparent px-2.5 text-caption text-label-primary placeholder:text-label-quaternary focus:outline-none focus:ring-1 focus:ring-label-quaternary"
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto rounded-card border border-separator bg-sheet-sunk p-2">
        {visible.length > 0 ? (
          <ul className="flex flex-col gap-1.5">
            {visible.map((row) => (
              <li key={row.id}>
                <EvidenceSourceCard
                  ref={(el) => {
                    if (el) itemRefs.current.set(row.id, el);
                    else itemRefs.current.delete(row.id);
                  }}
                  row={row}
                  selected={selectedId === row.id}
                  onSelect={() => onSelect(selectedId === row.id ? null : row.id)}
                />
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex h-full min-h-[120px] items-center justify-center">
            <p className="text-caption text-label-quaternary">
              {filter === "contradicting" ? "No held evidence contradicts a claim in this investigation." : "No evidence matches this filter."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
