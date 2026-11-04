"use client";

import * as React from "react";
import { useRegulatoryCase } from "@/components/regulatory/RegulatoryProvider";
import type { ActivityEvent } from "@/lib/portfolio/activity";

import { DronaMonogram } from "@/components/brand/DronaLogo";
import { ContextOverlay, useOverlay } from "@/components/overlay/ContextOverlay";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { activityFeed, addComment } from "@/lib/portfolio/activity";
import { nordvindAttention } from "@/lib/portfolio/attention";
import { RECOMMENDED_COMMITMENT } from "@/lib/portfolio/portfolio";
import { cn } from "@/lib/ui/cn";
import { ActivityPane } from "./ActivityPane";
import { AssistantPane } from "./AssistantPane";
import { EvidenceList } from "./EvidenceList";

type Mode = "assistant" | "activity";

/**
 * F — Drona as a small shared workspace, not a chat. Assistant holds what Drona
 * would look at first; Activity holds what moved and what the team said about it.
 * Investigate is the one path into Scene 2 from here, and it is the same path as
 * opening Wind Energy from the list.
 */
export function DronaWorkspace({
  onOpen,
  className,
}: {
  readonly onOpen: (commitmentId: string) => void;
  readonly className?: string;
}): React.ReactElement {
  const [mode, setMode] = React.useState<Mode>("assistant");
  const { state } = useRegulatoryCase();
  const [comments, setComments] = React.useState<readonly ActivityEvent[]>([]);
  const feed = React.useMemo(() => [...comments, ...activityFeed(state)], [comments, state]);
  const evidence = useOverlay<HTMLElement>();

  return (
    <aside
      ref={evidence.originRef}
      aria-label="Drona"
      className={cn(
        "sheet-material relative flex min-h-0 min-w-0 flex-col overflow-hidden rounded-surface",
        className
      )}
    >
      <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)} className="flex min-h-0 flex-1 flex-col px-4 pb-4 pt-4">
        <TabsList aria-label="Drona workspace" className="grid w-full shrink-0 grid-cols-2">
          <TabsTrigger value="assistant">
            <DronaMonogram height={12} />
            Assistant
          </TabsTrigger>
          <TabsTrigger value="activity">
            Activity
            <span data-figure className="text-label-quaternary">{feed.length}</span>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="assistant" className="mt-4">
          <AssistantPane
            onInvestigate={() => onOpen(RECOMMENDED_COMMITMENT)}
            onEvidence={evidence.show}
            onChanges={() => setMode("activity")}
          />
        </TabsContent>
        <TabsContent value="activity" className="mt-4">
          <ActivityPane feed={feed} onComment={(text) => setComments((f) => addComment(f, text))} />
        </TabsContent>
      </Tabs>

      <ContextOverlay
        open={evidence.open}
        onOpenChange={evidence.setOpen}
        originRef={evidence.originRef}
        eyebrow="Drona · Evidence"
        title="What the Wind Energy note rests on"
        description="Each line carries how Drona knows it. Synthetic records for demonstration."
        footer={
          <button
            type="button"
            onClick={() => {
              evidence.setOpen(false);
              onOpen(RECOMMENDED_COMMITMENT);
            }}
            className="inline-flex h-8 items-center rounded-full bg-action px-4 text-caption font-medium text-action-on transition-colors duration-hover hover:bg-action-hover"
          >
            Open Wind Energy Coastal
          </button>
        }
      >
        <EvidenceList evidence={nordvindAttention(state).evidence} />
      </ContextOverlay>
    </aside>
  );
}
