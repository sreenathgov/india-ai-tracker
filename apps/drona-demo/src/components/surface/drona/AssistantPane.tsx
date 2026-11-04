"use client";
import * as React from "react";
import { useRegulatoryCase } from "@/components/regulatory/RegulatoryProvider";

import { Icon } from "@/components/ui/Icon";
import { dronaAssistant } from "@/lib/portfolio/assistant";
import { EpistemicMark } from "./EpistemicMark";

const QUIET =
  "inline-flex h-7 items-center rounded-full bg-quiet px-2.5 text-caption text-label-secondary transition-colors duration-hover ease-overlay hover:bg-quiet-hover hover:text-label-primary";

/** One observation, one note, three reasoned lines, three small moves. */
export function AssistantPane({
  onInvestigate,
  onEvidence,
  onChanges,
}: {
  readonly onInvestigate: () => void;
  readonly onEvidence: () => void;
  readonly onChanges: () => void;
}): React.ReactElement {
  const { state } = useRegulatoryCase();
  const a = React.useMemo(() => dronaAssistant(state), [state]);
  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto [mask-image:linear-gradient(to_bottom,black_calc(100%-20px),transparent)] pb-3">
        <p className="font-display text-[18px] leading-[1.25] tracking-[-0.005em] text-label-primary">{a.headline}</p>
        <p data-figure className="mt-2 text-body-s leading-5 text-label-secondary">{a.observation}</p>
        <p data-figure className="mt-1 text-caption text-label-tertiary">{a.note}</p>
        <ul className="mt-3 space-y-1.5">
          {a.reasoning.map((line) => (
            <li key={line.text} className="grid grid-cols-[76px_1fr] items-baseline gap-2 text-caption">
              <EpistemicMark state={line.state} />
              <span className="text-label-tertiary">{line.text}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-3 flex shrink-0 flex-wrap items-center gap-1">
        <button
          type="button"
          onClick={onInvestigate}
          className="inline-flex h-7 items-center gap-1 rounded-full bg-action px-2.5 text-caption font-medium text-action-on transition-colors duration-hover hover:bg-action-hover"
        >
          Investigate
          <Icon name="arrow" className="h-3 w-3" />
        </button>
        <button type="button" onClick={onEvidence} className={QUIET}>
          Evidence
        </button>
        <button type="button" onClick={onChanges} className={QUIET}>
          What changed?
        </button>
      </div>
    </div>
  );
}
