"use client";

import * as React from "react";

import { DronaWordmark } from "@/components/brand/DronaLogo";
import { useGuidedDemo } from "@/components/guided";
import { MONOGRAM_VIEWBOX, WORDMARK_VIEWBOX } from "@/components/brand/logoPaths";
import { cn } from "@/lib/ui/cn";

/* The rail's wordmark: 18px tall, showing only the "d" (plus a hair) when collapsed. */
const LOGO = (() => {
  const height = 18;
  const scale = height / WORDMARK_VIEWBOX.height;
  return {
    height,
    collapsed: Math.ceil(MONOGRAM_VIEWBOX.width * scale) + 1,
    full: Math.ceil(WORDMARK_VIEWBOX.width * scale),
  } as const;
})();

/**
 * The left rail. Monochrome by construction — nothing in here competes with the
 * map or with the single primary action a screen is allowed.
 *
 * Icons are hand-drawn inline paths rather than an icon package: five glyphs do not
 * justify a dependency, and adding one would trip the third founder gate.
 */

interface RailItem {
  readonly id: string;
  readonly label: string;
  readonly path: string;
  /**
   * Whether this item goes anywhere in the demo. Only Network does.
   *
   * The other three are not disabled buttons — a button that absorbs a click and
   * does nothing is a silent failure, which `CLAUDE.md` rule 6 rules out, and a
   * *disabled* button says "you may not", which is a different and untrue claim.
   * They render as plain labels: the shape of the product around this demo,
   * honestly not wired.
   */
  readonly navigable: boolean;
}

const ITEMS: readonly RailItem[] = [
  { id: "network", label: "Network", path: "M10 2.5a7.5 7.5 0 1 0 0 15 7.5 7.5 0 0 0 0-15Zm0 0c2 2 3 4.6 3 7.5s-1 5.5-3 7.5m0-15c-2 2-3 4.6-3 7.5s1 5.5 3 7.5M3 10h14", navigable: true },
  { id: "commitments", label: "Commitments", path: "M3.5 4.5h13M3.5 10h13M3.5 15.5h8", navigable: false },
  { id: "evidence", label: "Evidence", path: "M5 2.5h6.5L15.5 6.5V17.5h-10.5ZM11.5 2.5V6.5h4", navigable: false },
  { id: "activity", label: "Activity", path: "M2.5 11h3.2l2.1-5.4 3.2 9.2 2-3.8h4.5", navigable: false },
];

const REVIEWER = {
  name: "Demo Reviewer",
  initials: "DR",
  role: "Fictional demonstration workspace",
} as const;

export function Rail({
  activeId,
  onSelect,
  onRestart,
  sessionStart,
}: {
  readonly activeId: string;
  readonly onSelect?: (id: string) => void;
  /** Returns the demo to the gate, so the narrative can be run again on stage. */
  readonly onRestart?: () => void;
  /** Fixed by the caller, so the rail renders the same on every machine. */
  readonly sessionStart: string;
}): React.ReactElement {
  const [expanded, setExpanded] = React.useState(false);
  const guide = useGuidedDemo();

  return (
    <nav
      aria-label="Primary"
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      className={cn(
        "relative z-30 flex h-full shrink-0 flex-col justify-between py-6",
        "motion-safe:transition-[width] motion-safe:duration-gentle motion-safe:ease-calm",
        expanded ? "w-[236px]" : "w-16"
      )}
    >
      <div>
        <div className="flex h-8 items-center pl-6">
          {/* One wordmark, clipped to its "d" while the rail is narrow: opening the
              rail reveals the rest of the name rather than swapping marks. */}
          <button type="button" aria-label="Return to dashboard" onClick={() => guide ? guide.dashboard() : onSelect?.("network")}
            className="-ml-2 inline-flex min-h-10 min-w-10 items-center rounded-chip px-2 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-mark">
          <span
            className="block overflow-hidden motion-safe:transition-[width] motion-safe:duration-gentle motion-safe:ease-calm"
            style={{ width: expanded ? LOGO.full : LOGO.collapsed }}
          >
            <DronaWordmark height={LOGO.height} />
          </span>
          </button>
        </div>

        <ul className="mt-8 space-y-1 px-2">
          {ITEMS.map((item) => {
            const active = item.id === activeId;
            const body = (
              <>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  aria-hidden="true"
                  className="shrink-0"
                >
                  <path
                    d={item.path}
                    stroke="currentColor"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span
                  className={cn(
                    "whitespace-nowrap text-body-s",
                    expanded ? "animate-fade-in opacity-100" : "sr-only"
                  )}
                >
                  {item.label}
                </span>
              </>
            );

            const shared = "flex h-10 w-full items-center gap-3 rounded-chip px-3 text-left";

            return (
              <li key={item.id}>
                {item.navigable ? (
                  <button
                    type="button"
                    aria-current={active ? "page" : undefined}
                    onClick={() => onSelect?.(item.id)}
                    className={cn(
                      shared,
                      "motion-safe:transition-colors motion-safe:duration-fast",
                      active
                        ? "bg-inset text-label-primary"
                        : "text-label-tertiary hover:bg-raised hover:text-label-secondary"
                    )}
                  >
                    {body}
                  </button>
                ) : (
                  <span className={cn(shared, "text-label-quaternary")}>
                    {body}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {/* Reviewer of record. Identity lives at the foot of the rail, not in a header
          menu: the person accountable for what is on screen is part of the frame,
          not an account setting. */}
      <div className="px-2">
        <div
          className={cn(
            "flex items-center gap-3 rounded-chip px-3 py-2",
            expanded && "bg-raised"
          )}
        >
          <span
            aria-hidden="true"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-separator text-caption font-medium text-label-secondary"
          >
            {REVIEWER.initials}
          </span>
          {expanded ? (
            <span className="animate-fade-in overflow-hidden">
              <span className="block truncate text-body-s text-label-primary">
                {REVIEWER.name}
              </span>
              <span className="block truncate text-caption text-label-tertiary">
                {REVIEWER.role}
              </span>
              <span className="mt-1 block font-mono text-mono-s text-label-quaternary">
                Session {sessionStart}
              </span>
            </span>
          ) : (
            <span className="sr-only">
              {REVIEWER.name}, {REVIEWER.role}, session started {sessionStart}
            </span>
          )}
        </div>

        {/* The stage control, and the only element in the app that admits the app is
            a demo. It appears only while the rail is open, so the resting screen —
            the one that ends up in a screenshot — never carries it. Restarting
            returns to the gate rather than to Scene 1: the gate is the first beat of
            the narrative, and a replay that skips it is not a replay. */}
        {expanded && onRestart ? (
          <button
            type="button"
            onClick={onRestart}
            className="mt-2 flex h-8 w-full animate-fade-in items-center rounded-chip px-3 text-caption text-label-quaternary motion-safe:transition-colors motion-safe:duration-fast hover:bg-raised hover:text-label-secondary"
          >
            Restart demo
          </button>
        ) : null}
      </div>
    </nav>
  );
}

export { REVIEWER };
