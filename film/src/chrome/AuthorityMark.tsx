/**
 * AuthorityMark — the provenance glyph (Bible §3): the strongest single
 * design idea in the corpus. Three states, drawn as SVG shapes (never font
 * glyphs) so the dashing on "computed" stays crisp at any render scale:
 *
 *   signed     ◆  solid navy diamond
 *   qualified  ◇  hairline-outlined diamond, no fill
 *   computed   ◌  dashed, faint circle — unsigned
 *
 * A glyph, not a layered world component: it carries no `layer` prop. The
 * parent decides where it lives (always the text plane — see contract.tsx
 * rule 2, "the MatchGlyph, typed characters" are text-plane citizens).
 */

import { color } from "../design/tokens";

export type AuthorityKind = "signed" | "qualified" | "computed";

export interface AuthorityMarkProps {
  readonly kind: AuthorityKind;
  /** Diameter of the glyph's bounding box, px. */
  readonly size?: number;
}

const DEFAULT_SIZE = 12;
const VIEWBOX = "0 0 24 24";
/** Diamond = a square rotated 45° about the viewBox centre. */
const DIAMOND_ROTATE = "rotate(45 12 12)";

export const AuthorityMark = ({ kind, size = DEFAULT_SIZE }: AuthorityMarkProps) => {
  const common = {
    width: size,
    height: size,
    viewBox: VIEWBOX,
    style: { display: "inline-block", flexShrink: 0 },
    "aria-hidden": true,
  } as const;

  if (kind === "signed") {
    return (
      <svg {...common}>
        <rect x="4" y="4" width="16" height="16" rx="1.5" fill={color.navy} transform={DIAMOND_ROTATE} />
      </svg>
    );
  }

  if (kind === "qualified") {
    return (
      <svg {...common}>
        <rect
          x="4.5"
          y="4.5"
          width="15"
          height="15"
          rx="1.5"
          fill="none"
          stroke={color.navy}
          strokeWidth="1"
          transform={DIAMOND_ROTATE}
        />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <circle
        cx="12"
        cy="12"
        r="8"
        fill="none"
        stroke={color.inkDim}
        strokeWidth="1"
        strokeDasharray="2 2.5"
        opacity={0.75}
      />
    </svg>
  );
};
