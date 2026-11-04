import * as React from "react";

import type { Condition, WeakLink as WeakLinkModel } from "@/lib/network/pathway";

/**
 * The mechanism, and the conditions that make it one.
 *
 * This is the argument's hinge. Above it the pathway has shown *where* the trouble
 * enters; here the reviewer learns *how* — and every supporting fact arrives with its
 * own figure attached, so a reviewer who disagrees can see precisely which number to
 * argue with. That is the difference between an explanation and a verdict, and it is
 * why nothing on this screen is summarised into a single figure.
 *
 * The conditions are paragraphs rather than chips, deliberately. A condition is a
 * claim about the world and a claim needs a sentence; compress it to a badge and it
 * becomes a label, and a label is one step from the score this scene exists to refuse.
 * `pathway.ts` withholds any condition the data does not support — so if one is
 * missing here, that absence is the model speaking, not an oversight.
 */
export function WeakLink({
  link,
  conditions,
}: {
  readonly link: WeakLinkModel;
  readonly conditions: readonly Condition[];
}): React.ReactElement {
  return (
    <section aria-label="Weak link">
      <h2 className="micro-label text-label-quaternary">Weak link</h2>

      <div className="mt-4 rounded-card border border-separator bg-raised p-6">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h3 className="text-heading text-label-primary">{link.title}</h3>
          <p className="text-caption text-label-tertiary">
            enters at {link.stage.name.toLowerCase()}
          </p>
        </div>

        <p className="mt-3 max-w-measure text-body-s text-label-secondary">
          {link.mechanism}
        </p>

        {/* Four facts, each carrying its own figure. Not a summary of them. */}
        <ul className="mt-5 flex flex-col gap-2.5">
          {link.facts.map((fact) => (
            <li key={fact} className="flex gap-3">
              <span
                aria-hidden="true"
                className="mt-[9px] h-px w-3 shrink-0 bg-label-quaternary"
              />
              <span className="max-w-measure text-caption text-label-secondary">
                {fact}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {conditions.length > 0 ? (
        <div className="mt-8">
          <h2 className="micro-label text-label-quaternary">
            Contributing conditions
          </h2>
          <div className="mt-4 flex flex-col gap-6">
            {conditions.map((condition) => (
              <article key={condition.id}>
                <h3 className="text-body-s font-medium text-label-primary">
                  {condition.title}
                </h3>
                <p className="mt-1.5 max-w-measure text-caption leading-relaxed text-label-secondary">
                  {condition.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
