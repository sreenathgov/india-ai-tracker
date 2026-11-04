import * as React from "react";

import {
  Section,
  SwatchRow,
  TypeRow,
} from "@/components/styleguide/Specimen";
import { ConcernMark, ConcernTag } from "@/components/ui/ConcernMark";
import type { Concern } from "@/lib/network/types";

/**
 * The values, on the page and on the map, with nothing else on the page.
 *
 * This route exists to be looked at before the product is. Every wrong token in
 * this system is wrong in one of two ways — a hue that vanishes on the pale map, or a
 * tracking value that reads fine at 15px and falls apart at 56 — and both are
 * invisible in a screenshot of a finished screen and obvious here.
 *
 * It is not linked from the app. It is a workbench, not a page of the demo.
 */

const CONCERNS: readonly Concern[] = ["low", "elevated", "critical"];

const SPACING: readonly { readonly name: string; readonly px: number }[] = [
  { name: "1", px: 4 },
  { name: "2", px: 8 },
  { name: "3", px: 12 },
  { name: "4", px: 16 },
  { name: "6", px: 24 },
  { name: "7", px: 28 },
  { name: "8", px: 32 },
  { name: "12", px: 48 },
  { name: "16", px: 64 },
  { name: "24", px: 96 },
];

const RADII: readonly { readonly name: string; readonly px: number }[] = [
  { name: "stamp", px: 2 },
  { name: "pill", px: 6 },
  { name: "chip", px: 10 },
  { name: "card", px: 14 },
  { name: "frame", px: 20 },
  { name: "stage", px: 28 },
];

const DURATIONS: readonly { readonly name: string; readonly ms: number }[] = [
  { name: "fast", ms: 150 },
  { name: "gentle", ms: 220 },
  { name: "reveal", ms: 450 },
  { name: "settle", ms: 700 },
];

export default function StyleguidePage(): React.ReactElement {
  return (
    <div className="min-h-dvh bg-page px-8 py-12 lg:px-16">
      <header className="mb-12">
        <p className="micro-label text-label-tertiary">Drona · design system</p>
        <h1 className="mt-3 font-display text-display-l text-brand-mark">
          Values, before anything is built with them
        </h1>
        <p className="mt-3 max-w-measure text-body text-label-secondary">
          Two grounds, one grammar. Every colour below is read back from the
          computed style, so this page cannot quietly disagree with{" "}
          <span className="font-mono text-mono">tokens.css</span>.
        </p>
      </header>

      <div className="space-y-12">
        <Section
          title="Type scale"
          note="Tracking tightens as size grows and opens as it shrinks. That behaviour is bound to the size token, not left to call sites — which is why the scale is worth reading top to bottom rather than sampling."
        >
          <div className="rounded-card border border-separator bg-surface px-7 py-2">
            <TypeRow
              name="display-xl"
              className="text-display-xl text-brand-mark"
              family="font-display"
              sample="Drona"
            />
            <TypeRow
              name="display-l"
              className="text-display-l text-brand-mark"
              family="font-display"
              sample="Production network"
            />
            <TypeRow
              name="display-m"
              className="text-display-m text-label-primary"
              family="font-display"
              sample="What deserves attention"
            />
            <TypeRow
              name="title-l"
              className="text-title-l text-label-primary"
              sample="Ten suppliers in critical concern"
            />
            <TypeRow
              name="title-m"
              className="text-title-m text-label-primary"
              sample="Ten suppliers in critical concern"
            />
            <TypeRow
              name="heading"
              className="text-heading text-label-primary"
              sample="Production commitments"
            />
            <TypeRow
              name="body"
              className="text-body text-label-secondary"
              sample="I have not established why those suppliers are in concern."
            />
            <TypeRow
              name="body-s"
              className="text-body-s text-label-secondary"
              sample="I have not established why those suppliers are in concern."
            />
            <TypeRow
              name="caption"
              className="text-caption text-label-tertiary"
              sample="Open one to see what inside it deserves attention"
            />
            <TypeRow
              name="micro"
              className="micro-label text-label-tertiary"
              sample="Observation"
            />
            <TypeRow
              name="mono"
              className="text-mono text-label-secondary"
              family="font-mono"
              sample="18 Nov 2026 · 12 d margin"
            />
            <TypeRow
              name="mono-s"
              className="text-mono-s uppercase text-label-quaternary"
              family="font-mono"
              sample="Required"
            />
            <TypeRow
              name="italic"
              className="text-body italic text-label-secondary"
              sample="Inferred, not established — reserved for epistemic qualification."
            />
          </div>
        </Section>

        <Section
          title="Surfaces · silver"
          note="The working ladder. Five steps, and nothing between them: a surface that needs a sixth value is usually a layout that needs one fewer box."
        >
          <SwatchRow
            tokens={[
              "--bg-page",
              "--bg-surface",
              "--bg-raised",
              "--bg-inset",
              "--bg-band",
            ]}
          />
        </Section>

        <Section
          title="Surfaces · map"
          note="A pale cool ocean at the band's luminance, near-white land with a hairline coast. The continents are context; the marks on them are the content, and they are the only saturated thing on the map."
        >
          <SwatchRow
            tokens={[
              "--bg-map",
              "--map-land",
              "--map-land-edge",
              "--map-buyer",
              "--map-upstream",
              "--map-flow",
            ]}
          />
        </Section>

        <Section
          title="Brand"
          note="Maroon is brand and authority, never a state colour and never chrome. It carries the wordmark, display type, and exactly one primary action per screen."
        >
          <SwatchRow
            tokens={[
              "--brand-mark",
              "--brand-deep",
              "--action-primary",
              "--action-primary-hover",
              "--action-on-primary",
            ]}
          />
          <div className="mt-6 flex items-center gap-4">
            <button
              type="button"
              className="rounded-pill bg-action px-6 py-3 text-body-s text-action-on motion-safe:transition-colors motion-safe:duration-fast hover:bg-action-hover"
            >
              Analyze production risk
            </button>
            <p className="text-caption text-label-tertiary">
              The only saturated non-state element permitted on a screen.
            </p>
          </div>
        </Section>

        <Section
          title="Concern · on silver"
          note="Colour and shape, always both. The shape ladder gains vertices as concern rises, so severity survives a monochrome screenshot and a projector in a bright room."
        >
          <SwatchRow
            tokens={[
              "--concern-low",
              "--concern-elevated",
              "--concern-critical",
              "--concern-critical-deep",
            ]}
          />
          <div className="mt-6 flex flex-wrap items-center gap-8 rounded-card border border-separator bg-surface px-7 py-6">
            {CONCERNS.map((concern) => (
              <span key={concern} className="flex items-center gap-3">
                <ConcernMark concern={concern} size={22} />
                <ConcernTag concern={concern} />
              </span>
            ))}
          </div>
          <p className="mt-5 max-w-measure text-caption text-label-tertiary">
            The first three are marks. They are tuned to be spotted and are held to
            WCAG&rsquo;s 3.0 floor for non-text, which they clear on every ground here.
            The fourth is the same state written as a sentence — the deep cut exists
            because 4.5 is a different floor, and{" "}
            <span className="font-sans italic">critical</span> is the one state whose
            words a reviewer cannot be allowed to miss.
          </p>
        </Section>

        <Section
          title="Label tiers"
          note="Alpha-modulated ink rather than separate greys, so every tier composites correctly over any surface in its own ladder."
        >
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-card border border-separator bg-surface px-7 py-6">
              <p className="text-body text-label-primary">Primary · the claim</p>
              <p className="mt-2 text-body text-label-secondary">
                Secondary · the reasoning
              </p>
              <p className="mt-2 text-body text-label-tertiary">
                Tertiary · the aside
              </p>
              <p className="mt-2 text-body text-label-quaternary">
                Quaternary · the field name
              </p>
              <hr className="mt-4 border-separator" />
            </div>
            <div className="rounded-card bg-map px-7 py-6">
              <p className="text-body text-label-primary">Primary · on the map</p>
              <p className="mt-2 text-body text-label-secondary">
                Secondary · on the map
              </p>
              <p className="mt-2 text-body text-label-tertiary">
                Tertiary · on the map
              </p>
              <p className="mt-2 text-body text-label-quaternary">
                Quaternary · on the map
              </p>
              <hr className="mt-4 border-separator" />
            </div>
          </div>
        </Section>

        <Section
          title="Spacing rhythm"
          note="4px base, 8px layout rhythm. Section gaps are 32 / 48 / 64 — never 16, which is the value that makes two unrelated things look related."
        >
          <div className="space-y-3">
            {SPACING.map((step) => (
              <div key={step.name} className="flex items-center gap-6">
                <span className="w-[56px] shrink-0 font-mono text-mono-s text-label-tertiary">
                  {step.name}
                </span>
                <span
                  className="h-3 rounded-stamp bg-brand-mark"
                  style={{ width: `${step.px}px` }}
                />
                <span
                  className="font-mono text-mono-s text-label-quaternary"
                  data-figure
                >
                  {step.px}px
                </span>
              </div>
            ))}
          </div>
        </Section>

        <Section
          title="Radius scale"
          note="Six steps, each tied to a kind of object: a stamp, a pill, a chip, a card, a frame, a stage. The name is the constraint — if a thing does not fit one of the six, it is the wrong thing."
        >
          <div className="flex flex-wrap gap-6">
            {RADII.map((radius) => (
              <div key={radius.name}>
                <div
                  className="h-20 w-20 border border-separator bg-surface"
                  style={{ borderRadius: `var(--radius-${radius.name})` }}
                />
                <p className="mt-2 font-mono text-mono-s text-label-secondary">
                  {radius.name}
                </p>
                <p
                  className="font-mono text-mono-s text-label-quaternary"
                  data-figure
                >
                  {radius.px}px
                </p>
              </div>
            ))}
          </div>
        </Section>

        <Section
          title="Motion"
          note="One curve for everything meaningful. Hover to run each duration against it — the point of a single easing is that these read as the same system moving at different speeds, not as four different animations."
        >
          <div className="flex flex-wrap gap-4">
            {DURATIONS.map((duration) => (
              <div
                key={duration.name}
                className="group w-[200px] overflow-hidden rounded-card border border-separator bg-surface p-4"
              >
                <p className="font-mono text-mono-s text-label-secondary">
                  {duration.name}
                </p>
                <p
                  className="font-mono text-mono-s text-label-quaternary"
                  data-figure
                >
                  {duration.ms}ms
                </p>
                <div className="mt-4 h-2 rounded-pill bg-inset">
                  <div
                    className="h-full w-0 rounded-pill bg-brand-mark motion-safe:transition-[width] motion-safe:ease-calm group-hover:w-full"
                    style={{ transitionDuration: `${duration.ms}ms` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section
          title="Epistemic encoding"
          note="Declared here so the grammar is one decision rather than a per-component improvisation. Scene 3 makes it load-bearing: Drona must never present inferred knowledge as established fact."
        >
          <div className="rounded-card bg-map p-7">
            <svg
              viewBox="0 0 520 120"
              className="h-[120px] w-full max-w-[520px]"
              role="img"
              aria-label="Verified, inferred, low-confidence and missing dependency treatments"
            >
              {/* Every epistemic value is applied through `style`, never as an SVG
                  presentation attribute: `var()` resolves in the CSS cascade and is
                  taken literally in an attribute, so the attribute form would
                  silently draw nothing. */}
              <g stroke="var(--map-upstream)" fill="none">
                <line x1="40" y1="30" x2="180" y2="30" strokeWidth="1.5" />
                <line
                  x1="40"
                  y1="60"
                  x2="180"
                  y2="60"
                  strokeWidth="1.5"
                  style={{ opacity: "var(--evidence-inferred-opacity)" }}
                />
                <line
                  x1="40"
                  y1="90"
                  x2="180"
                  y2="90"
                  strokeWidth="1.5"
                  style={{
                    strokeDasharray: "var(--evidence-low-confidence-dash)",
                  }}
                />
              </g>
              <circle cx="30" cy="30" r="6" fill="var(--map-upstream)" />
              <circle
                cx="30"
                cy="60"
                r="6"
                fill="none"
                stroke="var(--map-upstream)"
                strokeWidth="1.5"
                style={{ opacity: "var(--evidence-inferred-opacity)" }}
              />
              <circle
                cx="30"
                cy="90"
                r="6"
                fill="none"
                stroke="var(--map-upstream)"
                strokeWidth="1.5"
                style={{ strokeDasharray: "var(--evidence-missing-dash)" }}
              />
              <g fill="var(--label-secondary)" fontSize="12">
                <text x="196" y="34">
                  Verified — solid node, solid line
                </text>
                <text x="196" y="64">
                  Inferred — faint node, reduced opacity
                </text>
                <text x="196" y="94">
                  Unestablished — hollow node, dotted relation
                </text>
              </g>
            </svg>
          </div>
        </Section>
      </div>
    </div>
  );
}
