import * as React from "react";

import { ThemeToggle } from "@/components/ui/ThemeToggle";

const DATE = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

/**
 * The header band: where you are, the date — and the theme on the far right. The
 * logo lives once, at the top of the rail, so the header does not repeat it.
 *
 * No greeting. "Good morning, Arjun" is warmth borrowed from a consumer app. What
 * Drona has to say now lives in its own card on the surface, where it can carry
 * evidence; a header line could only carry a slogan.
 */
export function AppHeader({ asOf, logoutCsrf }: { readonly asOf: Date; readonly logoutCsrf?: string }): React.ReactElement {
  return (
    <header data-app-header className="flex h-14 shrink-0 items-center justify-between gap-4 px-6">
      <div className="flex min-w-0 items-center gap-3">
        <p className="flex min-w-0 items-baseline gap-2 truncate">
          <span className="text-body-s font-medium text-label-primary">Network</span>
          <span aria-hidden="true" className="text-label-quaternary">/</span>
          <span className="truncate text-body-s text-label-tertiary">Production Intelligence Surface</span>
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-4">
        <p className="hidden text-caption text-label-tertiary sm:block">Scenario · {DATE.format(asOf)}</p>
        <span className="hidden rounded-pill bg-quiet px-2.5 py-1 text-caption text-label-tertiary md:inline">Demo · authored records</span>
        <span data-guide-control=""><ThemeToggle /></span>
        {logoutCsrf ? <form method="post" action="/api/auth/logout" data-guide-control="">
          <input type="hidden" name="csrf" value={logoutCsrf} />
          <button type="submit" className="text-caption text-label-secondary underline underline-offset-4">Sign out</button>
        </form> : null}
      </div>
    </header>
  );
}
