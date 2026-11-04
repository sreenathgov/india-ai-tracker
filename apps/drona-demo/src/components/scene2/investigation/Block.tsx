import * as React from "react";

import { cn } from "@/lib/ui/cn";

/**
 * One block of the briefing.
 *
 * Blocks are separated by a hairline and a label, not by cards stacked on cards.
 * The workspace is already a surface; boxing every section inside it would turn a
 * briefing into a dashboard. Only the fracture path takes a ground of its own.
 */
export function Block({
  label,
  children,
  className,
  sunk = false,
  ...rest
}: {
  readonly label: string;
  readonly children: React.ReactNode;
  readonly className?: string;
  /** The one block that sits on its own ground rather than on the sheet. */
  readonly sunk?: boolean;
} & React.HTMLAttributes<HTMLElement>): React.ReactElement {
  return (
    <section
      className={cn(
        "min-w-0",
        sunk ? "rounded-card bg-quiet px-5 py-4" : "border-t border-separator pt-3.5",
        className
      )}
      {...rest}
    >
      <h3 className="micro-label mb-3 text-label-quaternary">{label}</h3>
      {children}
    </section>
  );
}

/** A figure and its name: the number leads, in the display face. */
export function Figure({
  value,
  label,
  muted = false,
}: {
  readonly value: string;
  readonly label: string;
  readonly muted?: boolean;
}): React.ReactElement {
  return (
    <div className="min-w-0">
      <p
        data-figure
        className={cn(
          "font-display text-title-m leading-none",
          muted ? "text-label-tertiary" : "text-label-primary"
        )}
      >
        {value}
      </p>
      <p className="mt-1.5 text-caption text-label-tertiary">{label}</p>
    </div>
  );
}
