import * as React from "react";

import type { EvidenceRegisterRow } from "@/lib/scene2/investigation";
import { cn } from "@/lib/ui/cn";
import { INDEPENDENCE_LABEL, SOURCE_TYPE_LABEL } from "../labels";

/**
 * One row of the Evidence Register — a held source or a requested one, told apart
 * by a "Requested" badge rather than a separate layout, so the two kinds still read
 * as one list. Supports/contradicts counts come straight off the row; a held source
 * that contradicts nothing says so by simply omitting the contradicts count, not by
 * printing a zero.
 */
export const EvidenceSourceCard = React.forwardRef<HTMLDivElement, {
  readonly row: EvidenceRegisterRow;
  readonly selected: boolean;
  readonly onSelect: () => void;
}>(function EvidenceSourceCard({ row, selected, onSelect }, ref) {
  const requested = row.kind === "requested";

  return (
    <div ref={ref} data-evidence-row={row.id}>
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        className={cn(
          "w-full rounded-card border px-3 py-2.5 text-left transition-colors",
          selected ? "border-label-quaternary bg-hover" : "border-separator hover:bg-hover"
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <p className="text-body-s font-medium leading-[1.4] text-label-primary">{row.source}</p>
          {requested ? (
            <span className="micro-label shrink-0 rounded-pill bg-quiet px-1.5 py-0.5 text-label-tertiary">Requested</span>
          ) : null}
        </div>

        <p className="mt-1 text-caption text-label-tertiary">
          {[row.sourceType ? SOURCE_TYPE_LABEL[row.sourceType] : null, row.date ? `${row.dateKind === "reviewed" ? "Reviewed " : ""}${row.date}` : null, row.state ? INDEPENDENCE_LABEL[row.state] : null]
            .filter(Boolean)
            .join(" · ")}
        </p>

        <p className="mt-1 text-caption leading-[1.4] text-label-tertiary">{row.scope}</p>

        {row.owner ? <p className="mt-1 text-caption text-label-quaternary">Owner: {row.owner}</p> : null}

        {row.supports.length > 0 || row.contradicts.length > 0 ? (
          <p className="mt-1.5 text-caption">
            {row.supports.length > 0 ? (
              <span className="text-label-tertiary">Supports {row.supports.length}</span>
            ) : null}
            {row.supports.length > 0 && row.contradicts.length > 0 ? <span className="text-label-quaternary"> · </span> : null}
            {row.contradicts.length > 0 ? (
              <span className="text-concern-elevated">Contradicts {row.contradicts.length}</span>
            ) : null}
          </p>
        ) : null}
      </button>
      {selected && row.kind === "held" && row.excerpt ? <section className="mx-3 mb-3 mt-2 border-t border-separator py-4" aria-label="Source extract" data-source-extract={row.id}>
        <p className="text-[11px] font-medium uppercase tracking-[.08em] text-label-tertiary">{row.synthetic ? "Fictional source extract" : "Source extract"}</p>
        <p className="mt-3 max-w-[90ch] whitespace-pre-line text-[14px] leading-[1.7] text-label-primary">{row.excerpt}</p>
        {row.eventAt ? <p className="mt-3 text-[12px] text-label-secondary">Event date · {row.eventAt}</p> : null}
        {row.limitation ? <p className="mt-3 max-w-[90ch] text-[12px] leading-relaxed text-label-secondary">{row.limitation}</p> : null}
        {row.supports.length ? <div className="mt-4"><h4 className="text-[12px] font-medium text-label-secondary">Used in this assessment</h4><ul className="mt-2 space-y-2">{row.supports.map(claim => <li key={claim.id} className="text-[13px] leading-relaxed text-label-secondary">{claim.title ?? claim.claim}</li>)}</ul></div> : null}
      </section> : null}
      {row.kind === "held" ? <p className="px-3 pb-2 pt-1 text-caption text-label-quaternary">{row.synthetic ? "Authored demo record" : "Real public authority · reviewed 2 Nov 2026"}{row.receivedAt ? ` · received/reviewed ${row.receivedAt.slice(0, 10)}` : ""}{row.url ? <> · <a href={row.url} target="_blank" rel="noreferrer" className="text-label-secondary underline underline-offset-2">Open official source ↗</a></> : null}</p> : null}
    </div>
  );
});
