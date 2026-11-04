import * as React from "react";

import { cn } from "@/lib/ui/cn";

/**
 * The bento card: one question, one surface. Radius 20, a hairline edge, the card
 * ground — and a shadow only in light, where a white card on paper needs one
 * pixel of lift. The header is optional; a card that is all figure needs none.
 */
export function BentoCard({
  title,
  eyebrow,
  actions,
  className,
  bodyClassName,
  children,
  as: Tag = "section",
  labelledBy,
}: {
  readonly title?: React.ReactNode;
  readonly eyebrow?: React.ReactNode;
  readonly actions?: React.ReactNode;
  readonly className?: string;
  readonly bodyClassName?: string;
  readonly children: React.ReactNode;
  readonly as?: "section" | "div" | "aside";
  readonly labelledBy?: string;
}): React.ReactElement {
  const titleId = React.useId();
  return (
    <Tag
      aria-labelledby={title ? labelledBy ?? titleId : undefined}
      className={cn(
        "relative flex min-h-0 min-w-0 flex-col overflow-hidden rounded-[20px] border border-card-edge bg-card shadow-bento",
        className
      )}
    >
      {title || actions ? (
        <header className="flex shrink-0 items-start justify-between gap-3 px-5 pt-4">
          <div className="min-w-0">
            {title ? (
              <h2 id={titleId} className="text-body-s font-medium text-label-primary">
                {title}
              </h2>
            ) : null}
            {eyebrow ? <p className="mt-0.5 text-caption text-label-tertiary">{eyebrow}</p> : null}
          </div>
          {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
        </header>
      ) : null}
      <div className={cn("flex min-h-0 flex-1 flex-col px-5 pb-4", title ? "pt-3" : "pt-4", bodyClassName)}>
        {children}
      </div>
    </Tag>
  );
}
