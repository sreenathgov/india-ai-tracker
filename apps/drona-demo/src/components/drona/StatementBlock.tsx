import * as React from "react";

import { STANDING_LABEL, type Standing, type Statement } from "@/lib/drona/exposure";
import { cn } from "@/lib/ui/cn";

/**
 * A titled list of Drona's statements, each led by its standing — Known, Inferred,
 * Unknown, Next evidence — drawn as a shape before it is written as a word.
 *
 * Shared by Scene 2's production column and Scene 3's exposure column, so the two
 * cannot drift into different ways of saying how well something is known.
 */
export function StatementBlock({
  title,
  statements,
}: {
  readonly title: string;
  readonly statements: readonly Statement[];
}): React.ReactElement {
  return (
    <div>
      <h3 className="micro-label text-label-quaternary">{title}</h3>
      <ul className="mt-3 flex flex-col gap-4">
        {statements.map((statement) => (
          <li key={statement.text} className="flex gap-3">
            <StandingMark standing={statement.standing} />
            <div className="min-w-0">
              {/* The standing is announced before the sentence, not appended to it.
                  A qualification that arrives after the claim has already been read
                  is a disclaimer; one that arrives before it is a frame. */}
              <p
                className={cn(
                  "micro-label",
                  statement.standing === "known"
                    ? "text-label-tertiary"
                    : "font-sans italic text-label-tertiary"
                )}
              >
                {STANDING_LABEL[statement.standing]}
              </p>
              <p
                className={cn(
                  "mt-1 text-body-s leading-relaxed",
                  statement.standing === "known"
                    ? "text-label-primary"
                    : "text-label-secondary"
                )}
              >
                {statement.text}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Four standings, four shapes.
 *
 * Deliberately not concern-coloured: a standing says how well something is known, not
 * how bad it is, and borrowing the concern palette here would quietly merge the two
 * questions the whole scene is built to keep apart.
 */
function StandingMark({
  standing,
}: {
  readonly standing: Standing;
}): React.ReactElement {
  const common = "mt-[3px] shrink-0";

  if (standing === "known") {
    return (
      <span
        aria-hidden="true"
        className={cn(common, "h-[9px] w-[9px] rounded-full bg-label-secondary")}
      />
    );
  }

  if (standing === "inferred") {
    return (
      <span
        aria-hidden="true"
        className={cn(common, "h-[9px] w-[9px] rounded-full")}
        style={{ border: "1.5px solid var(--label-tertiary)" }}
      />
    );
  }

  if (standing === "unknown") {
    /* A dashed CSS border rounds its dashes to fit the perimeter, which turns two
       distinct dash tokens into one look. Drawn as an SVG so the dash pattern is
       the one the token actually specifies. */
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 12 12"
        className={cn(common, "h-[11px] w-[11px]")}
      >
        <circle
          cx="6"
          cy="6"
          r="4.6"
          fill="none"
          stroke="var(--label-tertiary)"
          strokeWidth="1.3"
          style={{ strokeDasharray: "var(--evidence-missing-dash)" }}
        />
      </svg>
    );
  }

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 12 12"
      className={cn(common, "h-[11px] w-[11px] text-label-tertiary")}
    >
      <path
        d="M2.5 6h7M6.8 3.2 9.6 6l-2.8 2.8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
