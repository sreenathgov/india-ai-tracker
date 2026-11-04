"use client";

import * as TabsPrimitive from "@radix-ui/react-tabs";
import * as React from "react";

import { cn } from "@/lib/ui/cn";

/**
 * Adapted from shadcn/ui's tabs. A segmented control: the selected segment is a
 * white chip lifted off a quiet track, never a coloured underline.
 */
export const Tabs = TabsPrimitive.Root;

export function TabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>): React.ReactElement {
  return (
    <TabsPrimitive.List
      className={cn("inline-flex items-center gap-0.5 rounded-full bg-quiet p-[3px]", className)}
      {...props}
    />
  );
}

export function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>): React.ReactElement {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "inline-flex h-7 items-center justify-center gap-1.5 rounded-full px-3 text-caption text-label-tertiary transition-[color,background-color,box-shadow] duration-hover ease-overlay",
        "hover:text-label-primary",
        "data-[state=active]:bg-sheet data-[state=active]:font-medium data-[state=active]:text-label-primary data-[state=active]:shadow-lift",
        className
      )}
      {...props}
    />
  );
}

export function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>): React.ReactElement {
  return (
    <TabsPrimitive.Content
      className={cn("min-h-0 flex-1 outline-none data-[state=active]:animate-fade-in", className)}
      {...props}
    />
  );
}
