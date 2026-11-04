"use client";

import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import * as React from "react";

import { cn } from "@/lib/ui/cn";

/**
 * A definition on demand — adapted from shadcn/ui's tooltip and restyled to the
 * float material. Glance-level only: nothing inside a tooltip is interactive.
 */
export function Tooltip({
  content,
  children,
  side = "top",
  className,
}: {
  readonly content: React.ReactNode;
  readonly children: React.ReactElement;
  readonly side?: "top" | "right" | "bottom" | "left";
  readonly className?: string;
}): React.ReactElement {
  return (
    <TooltipPrimitive.Provider delayDuration={250} skipDelayDuration={120}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side={side}
            sideOffset={8}
            collisionPadding={12}
            className={cn(
              "float-material z-50 max-w-[260px] rounded-chip px-3 py-2 text-caption text-label-secondary",
              "data-[state=delayed-open]:animate-float-in data-[state=instant-open]:animate-float-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
              className
            )}
          >
            {content}
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}
