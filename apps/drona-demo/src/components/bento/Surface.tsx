import * as React from "react";

import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/ui/cn";

export type SurfaceWeight = "primary" | "supporting";
/** sheet: white paper, no line; veil: translucent, merges into the canvas; bare: no surface. */
export type SurfaceMaterial = "sheet" | "sunk" | "veil" | "bare";

const MATERIAL: Record<SurfaceMaterial, string> = {
  sheet: "sheet-material",
  sunk: "sheet-material sheet-sunk",
  veil: "veil-material",
  bare: "",
};

/**
 * One bento object. Weight sets padding and title scale, so the six surfaces are
 * unequal by construction rather than by per-card overrides. `interactive` adds
 * the hover grammar (a 1px lift, a shadow shift, a firmer edge) — reserved for
 * surfaces that open something, so not everything on the page invites a click.
 */
export function Surface({
  title,
  eyebrow,
  actions,
  weight = "supporting",
  material = "sheet",
  interactive = false,
  className,
  bodyClassName,
  children,
  as: Tag = "section",
  surfaceRef,
  surfaceId,
}: {
  readonly title?: React.ReactNode;
  readonly eyebrow?: React.ReactNode;
  readonly actions?: React.ReactNode;
  readonly weight?: SurfaceWeight;
  readonly material?: SurfaceMaterial;
  readonly interactive?: boolean;
  readonly className?: string;
  readonly bodyClassName?: string;
  readonly children: React.ReactNode;
  readonly as?: "section" | "div" | "aside";
  readonly surfaceRef?: React.Ref<HTMLElement>;
  readonly surfaceId?: string;
}): React.ReactElement {
  const titleId = React.useId();
  const primary = weight === "primary";
  return (
    <Tag
      ref={surfaceRef as React.Ref<HTMLElement & HTMLDivElement>}
      data-weight={weight}
      data-surface={surfaceId}
      aria-labelledby={title ? titleId : undefined}
      className={cn(
        "group/surface relative flex min-h-0 min-w-0 flex-col rounded-surface",
        material !== "bare" && "overflow-hidden",
        MATERIAL[material],
        interactive &&
          "transition-[transform,box-shadow] duration-hover ease-overlay hover:-translate-y-0.5 hover:shadow-hover",
        className
      )}
    >
      {title || actions ? (
        <header className={cn("flex shrink-0 items-start justify-between gap-3", primary ? "px-6 pt-5" : "px-5 pt-4")}>
          <div className="min-w-0">
            {title ? (
              <h2 id={titleId} className="text-[13.5px] font-medium leading-5 tracking-[-0.006em] text-label-primary">
                {title}
              </h2>
            ) : null}
            {eyebrow ? <p className="mt-0.5 text-caption text-label-quaternary">{eyebrow}</p> : null}
          </div>
          {actions ? <div className="flex shrink-0 items-center gap-1.5">{actions}</div> : null}
        </header>
      ) : null}
      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col",
          primary ? "px-6 pb-6" : "px-5 pb-5",
          title ? "pt-3" : primary ? "pt-5" : "pt-4",
          bodyClassName
        )}
      >
        {children}
      </div>
    </Tag>
  );
}

/** The quiet control in a surface header that opens its contextual overlay. */
export const InspectButton = React.forwardRef<
  HTMLButtonElement,
  { readonly label: string; readonly onClick: () => void; readonly children?: React.ReactNode }
>(function InspectButton({ label, onClick, children }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      data-overlay-trigger
      aria-label={label}
      onClick={onClick}
      className="inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-caption text-label-tertiary transition-colors duration-hover ease-overlay hover:bg-quiet hover:text-label-primary group-hover/surface:bg-quiet"
    >
      {children ?? "Inspect"}
      <Icon name="expand" className="h-3 w-3" />
    </button>
  );
});
