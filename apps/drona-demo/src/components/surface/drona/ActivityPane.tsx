import * as React from "react";

import { DronaMonogram } from "@/components/brand/DronaLogo";
import { Icon, type IconName } from "@/components/ui/Icon";
import { ACTIVITY_LABEL, type ActivityEvent, type ActivityKind } from "@/lib/portfolio/activity";
import { cn } from "@/lib/ui/cn";

/* Kind is carried by a glyph and the label, never by a fill. Comments show their
   author's initial and Drona's entries its monogram, so neither needs a glyph. */
const GLYPH: Readonly<Record<Exclude<ActivityKind, "comment" | "drona">, IconName>> = {
  supplier_update: "up",
  evidence_received: "doc",
  evidence_requested: "ask",
  milestone: "flag",
  finance: "rupee",
};

/** Events newer than this read as unread: a small dot, nothing louder. */
const UNREAD_MINUTES = 60;

/** "Priya, Procurement" → "P"; "You" → "Y". */
const initial = (actor: string): string => actor.trim().charAt(0).toUpperCase();

/** What moved across the network, newest first, as a timeline with a place to add a note. */
export function ActivityPane({
  feed,
  onComment,
}: {
  readonly feed: readonly ActivityEvent[];
  readonly onComment: (text: string) => void;
}): React.ReactElement {
  return (
    <div className="flex h-full flex-col">
      <ol aria-label="Activity" className="relative min-h-0 flex-1 overflow-y-auto pr-1">
        {feed.map((event, i) => (
          <TimelineItem key={event.id} event={event} last={i === feed.length - 1} />
        ))}
      </ol>
      <Composer onComment={onComment} />
    </div>
  );
}

function TimelineItem({ event, last }: { readonly event: ActivityEvent; readonly last: boolean }): React.ReactElement {
  const comment = event.kind === "comment";
  return (
    <li className="relative grid grid-cols-[24px_1fr] gap-3 pb-4 motion-safe:animate-fade-in">
      {last ? null : <span aria-hidden="true" className="absolute bottom-0 left-[11.5px] top-7 w-px bg-separator" />}
      <Node event={event} />
      <div className="min-w-0 pt-[3px]">
        <p className="flex items-baseline gap-1.5 text-[11px] leading-4 text-label-tertiary">
          <span className="truncate font-medium text-label-secondary">{event.actor}</span>
          <span className="shrink-0">{comment ? "commented" : ACTIVITY_LABEL[event.kind].toLowerCase()}</span>
          <span className="ml-auto flex shrink-0 items-center gap-1.5 tabular text-label-quaternary">
            {event.minutesAgo < UNREAD_MINUTES ? (
              <>
                <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-state-action" />
                <span className="sr-only">New</span>
              </>
            ) : null}
            {event.when}
          </span>
        </p>
        <p
          className={cn(
            "mt-1 text-caption leading-[18px]",
            comment ? "rounded-[12px] bg-sheet px-3 py-2 text-label-primary shadow-lift" : "text-label-secondary"
          )}
        >
          {event.text}
        </p>
      </div>
    </li>
  );
}

function Node({ event }: { readonly event: ActivityEvent }): React.ReactElement {
  if (event.kind === "comment") {
    return (
      <span aria-hidden="true" className="relative z-10 grid h-6 w-6 place-items-center rounded-full bg-ink-button text-[10.5px] font-medium text-ink-on-button">
        {initial(event.actor)}
      </span>
    );
  }
  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative z-10 grid h-6 w-6 place-items-center rounded-full bg-sheet shadow-lift",
        event.kind === "drona" ? "text-brand-mark" : "text-label-tertiary"
      )}
    >
      {/* Drona's own entries carry its monogram, as everywhere Drona speaks. */}
      {event.kind === "drona" ? <DronaMonogram height={11} /> : <Icon name={GLYPH[event.kind]} className="h-3 w-3" />}
    </span>
  );
}

function Composer({ onComment }: { readonly onComment: (text: string) => void }): React.ReactElement {
  const [draft, setDraft] = React.useState("");
  const empty = !draft.trim();
  return (
    <form
      className="mt-2 flex shrink-0 items-center gap-2 rounded-full bg-sheet py-1 pl-1 pr-1 shadow-lift transition-shadow duration-hover focus-within:shadow-hover"
      onSubmit={(e) => {
        e.preventDefault();
        if (empty) return;
        onComment(draft);
        setDraft("");
      }}
    >
      <span aria-hidden="true" className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-quiet text-[10.5px] font-medium text-label-secondary">
        Y
      </span>
      <label htmlFor="activity-comment" className="sr-only">Add a note for the team</label>
      <input
        id="activity-comment"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Leave a note for the team…"
        autoComplete="off"
        className="min-w-0 flex-1 bg-transparent py-1 text-caption text-label-primary outline-none placeholder:text-label-quaternary"
      />
      <button
        type="submit"
        aria-label="Post note"
        disabled={empty}
        className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-ink-button text-ink-on-button transition-opacity duration-hover disabled:opacity-25"
      >
        <Icon name="up" className="h-3.5 w-3.5" />
      </button>
    </form>
  );
}
