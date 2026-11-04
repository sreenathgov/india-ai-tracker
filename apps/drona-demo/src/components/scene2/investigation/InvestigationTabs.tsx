"use client";

import * as TabsPrimitive from "@radix-ui/react-tabs";
import * as React from "react";

import type { InvestigationTab } from "@/lib/scene2/supplierView";

/** Inquiry and action live in Overview; network and evidence remain inspectable. */
export const INVESTIGATION_TABS: readonly { readonly id: InvestigationTab; readonly label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "supply-chain", label: "Supply chain" },
  { id: "evidence", label: "Evidence & reasoning" },
];

/**
 * Underlined tabs, not the pill track used elsewhere.
 *
 * A pill row reads as a control; inside the workspace these are places in a
 * document, and the underline is the quieter way to say so. The rule beneath the
 * row is the workspace's only full-width division.
 */
export function InvestigationTabList(): React.ReactElement {
  return (
    <TabsPrimitive.List
      className="flex shrink-0 flex-wrap items-center gap-x-7 gap-y-1 border-b border-separator px-7 max-[600px]:gap-x-4 max-[600px]:px-5"
      aria-label="Investigation surfaces"
    >
      {INVESTIGATION_TABS.map((tab) => (
        <TabsPrimitive.Trigger
          key={tab.id}
          value={tab.id}
          className="relative -mb-px h-10 whitespace-nowrap text-body-s text-label-tertiary outline-none transition-colors duration-hover after:absolute after:inset-x-0 after:bottom-0 after:h-[2px] hover:text-label-secondary focus-visible:text-label-primary data-[state=active]:text-label-primary data-[state=active]:after:bg-label-primary"
        >
          {tab.label}
        </TabsPrimitive.Trigger>
      ))}
    </TabsPrimitive.List>
  );
}
