import * as React from "react";

import { cn } from "@/lib/ui/cn";
import type { PathwayStage } from "@/lib/network/pathway";

/**
 * Six stages, and where the trouble enters.
 *
 * This is the **transmission** step of the scene's argument, and the reason there is
 * no score anywhere on the screen: a percentage can say how bad, never *through what*.
 * The pathway's whole job is to show that the stage in trouble is not the stage that
 * hurts — allocation is upstream of forging, and a surface that painted both the same
 * would send a reviewer to audit the wrong shop floor.
 *
 * So the three statuses are drawn as three different marks rather than three colours.
 * `clear` is a hairline. `exposed` is a filled stop, the only saturated thing here.
 * `downstream` is a hollow ring — inheriting, not originating. Colour carries none of
 * the meaning on its own; the shapes hold it in a monochrome screenshot and on a
 * washed-out projector, which is where this will actually be seen.
 */
export function ProductionPathway({
  stages,
}: {
  readonly stages: readonly PathwayStage[];
}): React.ReactElement | null {
  if (stages.length === 0) return null;

  return (
    <section aria-label="Production pathway">
      <h2 className="micro-label text-label-quaternary">Production pathway</h2>

      <ol className="mt-4 flex flex-col gap-0">
        {stages.map((stage, index) => (
          <li key={stage.id} className="flex gap-4">
            {/* The rail runs behind the marks so the six stages read as one sequence
                rather than six items that happen to be stacked. */}
            <div className="relative flex w-4 shrink-0 flex-col items-center">
              <span
                aria-hidden="true"
                className={cn(
                  "w-px flex-none",
                  index === 0 ? "h-3 bg-transparent" : "h-3 bg-separator"
                )}
              />
              <StageMark status={stage.status} />
              <span
                aria-hidden="true"
                className={cn(
                  "w-px flex-1",
                  index === stages.length - 1 ? "bg-transparent" : "bg-separator"
                )}
              />
            </div>

            <div className="min-w-0 pb-5 pt-2">
              <p
                className={cn(
                  "text-body-s",
                  stage.status === "exposed"
                    ? "font-medium text-label-primary"
                    : "text-label-secondary"
                )}
              >
                {stage.name}
              </p>
              <p className="mt-1 max-w-measure-tight text-caption italic text-label-tertiary">
                {stage.note}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function StageMark({
  status,
}: {
  readonly status: PathwayStage["status"];
}): React.ReactElement {
  if (status === "exposed") {
    return (
      <span
        aria-hidden="true"
        className="block h-[11px] w-[11px] shrink-0 rounded-full"
        style={{
          background: "var(--concern-critical)",
          boxShadow: "0 0 0 3px rgba(168, 84, 84, 0.14)",
        }}
      />
    );
  }

  if (status === "downstream") {
    return (
      <span
        aria-hidden="true"
        className="block h-[9px] w-[9px] shrink-0 rounded-full"
        style={{ border: "1.5px solid var(--concern-critical)", opacity: 0.55 }}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className="block h-[5px] w-[5px] shrink-0 rounded-full bg-label-quaternary"
    />
  );
}
