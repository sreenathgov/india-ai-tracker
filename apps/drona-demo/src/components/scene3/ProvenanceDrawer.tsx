"use client";

import * as React from "react";

import { ledgerSummary, provenanceLedger, type ProvenanceRow } from "@/lib/drona/provenance";
import { evidenceMark } from "@/lib/map/epistemic";
import { cn } from "@/lib/ui/cn";

/**
 * `Show the evidence.` — the provenance principle, made literal.
 *
 * Everywhere else Drona *tells* you it separates what it knows from what it inferred.
 * Here that separation is auditable: one row per relationship in the chain, each
 * naming what Drona is holding and what that artefact does and does not establish.
 * The answer to "show the evidence" is not a paragraph about evidence. It is the
 * evidence, including the places where the honest entry is that there is none.
 *
 * **It covers the working surface and not the map.** A modal over the whole screen
 * would suspend the scene; this is a deeper reading of the surface already below the
 * map, so the chain stays lit above it and the reviewer can look from a row to the
 * node it describes without dismissing anything. That is also the strongest argument
 * the drawer makes — the mark beside each row is drawn from `map/epistemic.ts`, the
 * same module that draws the nodes overhead, so a row and its node cannot disagree.
 *
 * Nothing here is fetched. Every row is read off `dependencies.ts` at render time.
 */
export function ProvenanceDrawer({
  componentId,
  onClose,
}: {
  readonly componentId: string;
  readonly onClose: () => void;
}): React.ReactElement | null {
  const ledger = React.useMemo(
    () => provenanceLedger(componentId),
    [componentId]
  );

  const panelRef = React.useRef<HTMLDivElement | null>(null);
  const closeRef = React.useRef<HTMLButtonElement | null>(null);

  /* Focus moves in on open and goes back where it came from on close, so a reviewer
     driving this from the keyboard is never dropped at the top of the document. The
     anchor is captured at mount rather than passed in: the drawer is the thing that
     moved focus, so it is the thing that owes it back. */
  React.useEffect(() => {
    const anchor = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    return () => anchor?.focus?.();
  }, []);

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        /* The page listens for Escape too, and steps back a scene with it. The
           innermost open layer owns the key: closing a drawer and leaving the scene
           at the same time is the kind of double-action that makes a demo feel
           unpredictable on stage. Capture phase reaches this handler before the
           page's window listener, so stopping propagation here is what makes the
           claim true rather than merely intended. */
        event.stopPropagation();
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") return;
      const panel = panelRef.current;
      if (!panel) return;
      const focusable = panel.querySelectorAll<HTMLElement>(
        'button, [href], [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [onClose]);

  if (!ledger) return null;

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="provenance-title"
      className={cn(
        "absolute inset-0 z-20 flex flex-col bg-page",
        "shadow-[0_-12px_40px_-20px_rgba(11,11,13,0.45)]",
        "motion-safe:animate-fade-rise"
      )}
    >
      <header className="flex shrink-0 items-start gap-6 border-b border-separator px-8 pb-5 pt-6">
        <div className="min-w-0">
          <p className="micro-label text-label-quaternary">Provenance</p>
          <h2
            id="provenance-title"
            className="mt-2 text-heading text-label-primary"
          >
            What I am holding for this chain
          </h2>
          {/* Derived from the rows, so it can never describe a chain they do not
              show — and it closes on the absences rather than on the documents. */}
          <p className="mt-2 max-w-measure text-caption text-label-secondary" data-figure>
            {ledgerSummary(ledger)}
          </p>
        </div>

        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          className="ml-auto shrink-0 rounded-chip border border-separator px-3 py-1.5 text-caption text-label-tertiary motion-safe:transition-colors motion-safe:duration-fast hover:bg-raised hover:text-label-primary"
        >
          Close
          <span aria-hidden="true" className="ml-2 text-label-quaternary">
            Esc
          </span>
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-8 py-2">
        <ul>
          {ledger.rows.map((row) => (
            <Row key={row.id} row={row} />
          ))}
        </ul>

        {/* The last word belongs to the limit, not to the list. Without this the
            ledger could be read as a completed picture, which is the one reading it
            must not permit. */}
        <p className="max-w-measure border-t border-separator py-6 text-caption italic text-label-tertiary">
          This is everything Drona holds. Where a row says nothing is held, that is the
          finding — it has not been left out pending a better source, and Drona has not
          completed the picture on your behalf.
        </p>
      </div>
    </div>
  );
}

function Row({ row }: { readonly row: ProvenanceRow }): React.ReactElement {
  return (
    <li className="grid grid-cols-1 gap-x-8 gap-y-3 border-b border-separator py-6 last:border-b-0 lg:grid-cols-[minmax(0,260px)_minmax(0,1fr)]">
      <div className="flex gap-3">
        <EdgeGlyph row={row} />
        <div className="min-w-0">
          <p className="text-body-s text-label-primary">{row.from}</p>
          <p className="mt-0.5 text-caption text-label-tertiary">{row.fromRole}</p>
          <p className="mt-2 text-caption text-label-quaternary">
            supplies {row.to}
          </p>
        </div>
      </div>

      <div className="min-w-0">
        <div className="flex flex-wrap items-baseline gap-x-3">
          <p
            className={cn(
              "micro-label",
              row.contracted ? "text-label-secondary" : "text-label-tertiary"
            )}
          >
            {row.label}
          </p>
          {/* Geist Italic, spent on the qualification itself — the one use BRAND.md
              §2.1 reserves it for. The sentence is `CONFIDENCE_MEANING` verbatim:
              what this standing licenses Drona to say, printed beside every row that
              claims it rather than explained once in a legend nobody reads. */}
          <p className="min-w-0 flex-1 text-caption italic text-label-tertiary">
            {row.meaning}
          </p>
        </div>

        <dl className="mt-4">
          <dt className="micro-label text-label-quaternary">Held</dt>
          <dd className="mt-1.5 text-body-s text-label-primary">{row.holding}</dd>

          <dt className="sr-only">What it establishes</dt>
          <dd className="mt-3 max-w-measure text-caption leading-relaxed text-label-secondary">
            {row.basis}
          </dd>
        </dl>
      </div>
    </li>
  );
}

/**
 * The relationship, drawn the way the map draws it.
 *
 * Connector then node, with the dash pattern and body treatment taken from
 * `evidenceMark` rather than chosen here. A ledger that invented its own vocabulary
 * for confidence would leave the reviewer translating between two pictures of the
 * same claim, and one of the two would eventually be wrong.
 */
function EdgeGlyph({ row }: { readonly row: ProvenanceRow }): React.ReactElement {
  const mark = evidenceMark(row.confidence);
  const tint = "var(--label-secondary)";

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 22 14"
      className="mt-[3px] h-[14px] w-[22px] shrink-0"
      style={{ opacity: mark.opacity }}
    >
      <path
        d="M0 7h11"
        fill="none"
        stroke={tint}
        strokeWidth={1.3}
        style={{ strokeDasharray: mark.dash ?? undefined }}
      />
      <circle
        cx="16.5"
        cy="7"
        r="4"
        fill={mark.fill === "solid" ? tint : "none"}
        stroke={tint}
        strokeWidth={1.3}
        style={{
          strokeDasharray:
            mark.fill === "hollow" ? (mark.dash ?? undefined) : undefined,
        }}
      />
    </svg>
  );
}
