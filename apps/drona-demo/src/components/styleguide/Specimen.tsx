"use client";

import * as React from "react";

import { cn } from "@/lib/ui/cn";

/**
 * The furniture the styleguide is built from.
 *
 * Deliberately plain. A styleguide that is itself designed starts lying about the
 * values it is showing — a swatch on a beautifully composed card looks good because
 * of the card. These are labelled rectangles and nothing else.
 */

export function Section({
  title,
  note,
  children,
}: {
  readonly title: string;
  readonly note?: string;
  readonly children: React.ReactNode;
}): React.ReactElement {
  return (
    <section className="border-t border-separator pt-6">
      <h2 className="micro-label text-label-tertiary">{title}</h2>
      {note ? (
        <p className="mt-2 max-w-measure text-body-s text-label-secondary">
          {note}
        </p>
      ) : null}
      <div className="mt-6">{children}</div>
    </section>
  );
}

/** A colour, its token name, and its resolved value read back from the DOM. */
export function Swatch({ token }: { readonly token: string }): React.ReactElement {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const [resolved, setResolved] = React.useState("");

  /* Read the computed value rather than restating it here. A styleguide that
     hard-codes the hex it claims to be showing can drift from tokens.css and never
     say so — which is the one failure a styleguide must not have. */
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    setResolved(
      getComputedStyle(el).getPropertyValue(token).trim() || "—"
    );
  }, [token]);

  return (
    <div ref={ref} className="min-w-0">
      <div
        className="h-14 rounded-chip border border-separator"
        style={{ background: `var(${token})` }}
      />
      <p
        className="mt-2 truncate font-mono text-mono-s text-label-secondary"
      >
        {token}
      </p>
      <p
        className="truncate font-mono text-mono-s text-label-quaternary"
        data-figure
      >
        {resolved}
      </p>
    </div>
  );
}

export function SwatchRow({
  tokens,
}: {
  readonly tokens: readonly string[];
}): React.ReactElement {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      {tokens.map((token) => (
        <Swatch key={token} token={token} />
      ))}
    </div>
  );
}

/** One line of the type scale, shown at size with its own spec beside it. */
export function TypeRow({
  name,
  className,
  sample,
  family,
}: {
  readonly name: string;
  readonly className: string;
  readonly sample: string;
  readonly family?: string;
}): React.ReactElement {
  return (
    <div className="flex items-baseline gap-8 border-b border-separator py-4 last:border-0">
      <span className="w-[120px] shrink-0 font-mono text-mono-s text-label-tertiary">
        {name}
      </span>
      <span className={cn("min-w-0 flex-1 truncate", className, family)}>
        {sample}
      </span>
    </div>
  );
}
