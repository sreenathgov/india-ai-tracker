import * as React from "react";

import type { EvidenceItem } from "@/lib/portfolio/attention";
import { EpistemicMark } from "./EpistemicMark";

/** Evidence lines, each with its state of knowledge. Low and missing read as unresolved. */
export function EvidenceList({ evidence }: { readonly evidence: readonly EvidenceItem[] }): React.ReactElement {
  return (
    <ul className="divide-y divide-separator">
      {evidence.map((item) => (
        <li key={item.label} className="py-3.5 first:pt-0 last:pb-0">
          <div className="flex items-baseline justify-between gap-4">
            <p className="text-body-s font-medium text-label-primary">{item.label}</p>
            <EpistemicMark state={item.confidence === "verified" ? "verified" : item.confidence === "inferred" ? "inferred" : "unresolved"} className="shrink-0" />
          </div>
          <p className="mt-1 text-caption text-label-secondary">{item.detail}</p>
          {item.confidence !== "verified" && item.confidence !== "inferred" ? (
            <p className="mt-1 text-caption text-label-tertiary">{item.confidenceLabel}</p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
