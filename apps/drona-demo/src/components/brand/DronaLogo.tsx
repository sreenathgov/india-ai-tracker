import * as React from "react";

import { cn } from "@/lib/ui/cn";

import { LOGO_D, LOGO_RONA, MONOGRAM_VIEWBOX, WORDMARK_VIEWBOX } from "./logoPaths";

/**
 * The Drona logo. One shape, painted in `--brand-logo` — deep maroon on the light
 * ground, cream on the dark — so it follows the theme with no asset swap and stays
 * sharp at every size.
 *
 *   DronaWordmark  the full "drona"; where the product introduces itself
 *   DronaMonogram  the "d" alone; where Drona speaks, and where space is tight
 *
 * Size by height only: width follows the artwork's proportions.
 */

type Box = { readonly x: number; readonly y: number; readonly width: number; readonly height: number };

interface LogoProps {
  /** Rendered height in CSS pixels. */
  readonly height: number;
  /** True where adjacent text already says "Drona". */
  readonly decorative?: boolean;
  readonly className?: string;
}

function LogoSvg({
  box,
  paths,
  height,
  decorative,
  className,
}: LogoProps & { readonly box: Box; readonly paths: readonly string[] }): React.ReactElement {
  const width = Math.round(((height * box.width) / box.height) * 10) / 10;
  const a11y = decorative
    ? ({ "aria-hidden": true } as const)
    : ({ role: "img", "aria-label": "Drona" } as const);
  return (
    <svg
      {...a11y}
      width={width}
      height={height}
      viewBox={`${box.x} ${box.y} ${box.width} ${box.height}`}
      focusable="false"
      className={cn("block shrink-0 text-brand-logo", className)}
    >
      {paths.map((d) => (
        <path key={d.slice(0, 24)} d={d} fill="currentColor" fillRule="evenodd" />
      ))}
    </svg>
  );
}

export function DronaWordmark({ decorative = false, ...rest }: LogoProps): React.ReactElement {
  return <LogoSvg box={WORDMARK_VIEWBOX} paths={[LOGO_D, LOGO_RONA]} decorative={decorative} {...rest} />;
}

export function DronaMonogram({ decorative = true, ...rest }: LogoProps): React.ReactElement {
  return <LogoSvg box={MONOGRAM_VIEWBOX} paths={[LOGO_D]} decorative={decorative} {...rest} />;
}
