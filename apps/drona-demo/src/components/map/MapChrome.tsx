"use client";

import * as React from "react";

import { cn } from "@/lib/ui/cn";
import {
  buyerIcon,
  clusterIcon,
  plantIcon,
  subtierIcon,
  supplierIcon,
  upstreamIcon,
  type MapIcon,
} from "@/lib/map/icons";
import type { MapPalette } from "@/lib/map/palette";
import { ROLE_LABEL, SUBTIER_ROLES } from "@/lib/network/subtier";
import {
  toggleAbroad,
  toggleFlagged,
  toggleRole,
  type SubTierFilter,
} from "@/lib/network/subtier/filter";
import type { MapMode } from "./mapLayers";

/* Chrome on the map is white, hairlined and small: it is furniture, and the marks
   on the map are the content. */
const PANEL =
  "rounded-[12px] bg-[color:var(--bg-map-popover)] shadow-lift backdrop-blur-md";
const FOCUS =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-label-quaternary";

/** Globe ⇄ Map, and the zoom stack. Top-right, out of the way of the legend. */
export function MapControls({
  mode,
  onMode,
  onZoom,
  onReset,
}: {
  readonly mode: MapMode;
  readonly onMode: (mode: MapMode) => void;
  readonly onZoom: (delta: number) => void;
  readonly onReset: () => void;
}): React.ReactElement {
  return (
    <div className="absolute right-3 top-3 z-20 flex items-start gap-2">
      <div role="group" aria-label="Map projection" className={cn(PANEL, "flex p-0.5")}>
        {(["map", "globe"] as const).map((m) => (
          <button
            key={m}
            type="button"
            aria-pressed={mode === m}
            onClick={() => onMode(m)}
            className={cn(
              "rounded-pill px-3 py-1 text-caption transition-colors duration-fast",
              FOCUS,
              mode === m
                ? "bg-inset font-medium text-label-primary"
                : "text-label-tertiary hover:text-label-primary"
            )}
          >
            {m === "map" ? "Map" : "Globe"}
          </button>
        ))}
      </div>

      <div role="group" aria-label="Zoom" className={cn(PANEL, "flex flex-col p-0.5")}>
        <ChromeButton label="Zoom in" onClick={() => onZoom(1)}>
          +
        </ChromeButton>
        <ChromeButton label="Zoom out" onClick={() => onZoom(-1)}>
          −
        </ChromeButton>
        <ChromeButton label="Re-frame the map" onClick={onReset}>
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
            <path
              d="M1.5 4.5v-3h3M10.5 4.5v-3h-3M1.5 7.5v3h3M10.5 7.5v3h-3"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
            />
          </svg>
        </ChromeButton>
      </div>
    </div>
  );
}

function ChromeButton({
  label,
  onClick,
  children,
}: {
  readonly label: string;
  readonly onClick: () => void;
  readonly children: React.ReactNode;
}): React.ReactElement {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded-pill text-body-s text-label-secondary hover:bg-inset hover:text-label-primary",
        FOCUS
      )}
    >
      {children}
    </button>
  );
}

function Swatch({ icon, size = 14 }: { readonly icon: MapIcon; readonly size?: number }) {
  // A plain img: the source is a data URL, not an asset for next/image to optimise.
  return <img src={icon.url} alt="" width={size} height={size} className="shrink-0" />;
}

function Item({
  children,
  label,
}: {
  readonly children: React.ReactNode;
  readonly label: string;
}): React.ReactElement {
  return (
    <li className="flex items-center gap-2 text-caption leading-tight text-label-secondary">
      <span className="flex w-7 shrink-0 items-center justify-center gap-0.5">{children}</span>
      {label}
    </li>
  );
}

/** Width of the open key, CSS pixels. `CHROME_INSETS.left` keeps marks clear of it. */
export const LEGEND_WIDTH = 176;

/**
 * The key, drawn with the very icons the map draws — the same data URLs, not a
 * second rendition that could drift from the first.
 *
 * A narrow column in the top-left corner, collapsible to a single "Key" pill: a
 * reference the reviewer glances at, then folds away to give the map its room.
 */
export function MapLegend({
  palette,
  tier1,
  compact = false,
  production = null,
  placement = "top",
}: {
  readonly palette: MapPalette;
  /** Scene 3 only: the chain's own Tier-1 mark. Switches the key to dependencies. */
  readonly tier1: MapIcon | null;
  /** A narrow map: the key starts folded so it does not cover the marks. */
  readonly compact?: boolean;
  /** The production view: the key doubles as the sub-tier filter. */
  readonly production?: LegendFilter | null;
  /** Scene 1's card keeps the top-left for its own title, so the key sits below. */
  readonly placement?: "top" | "bottom";
}): React.ReactElement {
  const [open, setOpen] = React.useState(!compact);
  /* Follows the map's width as it changes scene; the reviewer can still open it. */
  React.useEffect(() => setOpen(!compact), [compact]);
  const listId = React.useId();

  return (
    <div
      className={cn(
        PANEL,
        "absolute left-3 z-20 flex max-h-[calc(100%-24px)] flex-col overflow-y-auto",
        placement === "top" ? "top-3" : "bottom-3"
      )}
      style={open ? { width: LEGEND_WIDTH } : undefined}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center justify-between gap-3 rounded-chip px-3 py-1.5 text-micro uppercase text-label-tertiary hover:text-label-primary",
          FOCUS
        )}
      >
        Key
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          aria-hidden="true"
          className={cn("transition-transform duration-fast", open ? "rotate-180" : "")}
        >
          <path
            d="M2 3.5 5 6.5 8 3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open ? (
        <ul id={listId} className="flex flex-col gap-1.5 border-t border-separator px-3 pb-2.5 pt-2">
          <Item label="Manufacturing plant">
            <Swatch icon={plantIcon(palette)} />
          </Item>
          {production ? (
            <ProductionKey palette={palette} {...production} />
          ) : tier1 ? (
            <>
              <Item label="Tier-1 supplier">
                <Swatch icon={tier1} />
              </Item>
              <Item label="Upstream · verified">
                <Swatch icon={upstreamIcon(palette, "solid")} />
              </Item>
              <Item label="Upstream · inferred">
                <Swatch icon={upstreamIcon(palette, "ring")} />
              </Item>
              <Item label="Upstream · not established">
                <Swatch icon={upstreamIcon(palette, "hollow")} />
              </Item>
              <Item label="Link · verified">
                <span className="h-[1.5px] w-5 bg-[color:var(--map-flow)]" />
              </Item>
              <Item label="Link · weak evidence">
                <span className="w-5 border-t-2 border-dotted border-[color:var(--map-flow)]" />
              </Item>
            </>
          ) : (
            <>
              <Item label="Buyer">
                <Swatch icon={buyerIcon(palette)} />
              </Item>
              <Item label="Delivery route">
                <span className="h-[1.5px] w-5 bg-[color:var(--map-flow)]" />
              </Item>
              <Item label="Low concern">
                <Swatch icon={supplierIcon(palette, "low", "Nacelle")} />
              </Item>
              <Item label="Elevated concern">
                <Swatch icon={supplierIcon(palette, "elevated", "Nacelle")} />
              </Item>
              <Item label="Critical concern">
                <Swatch icon={supplierIcon(palette, "critical", "Nacelle")} />
              </Item>
              <Item label="Group · worst shown">
                <Swatch icon={clusterIcon(palette, "elevated")} />
              </Item>
            </>
          )}
        </ul>
      ) : null}
    </div>
  );
}

export interface LegendFilter {
  readonly filter: SubTierFilter;
  readonly onFilter: (filter: SubTierFilter) => void;
}

/**
 * The production view's key, after S3: what each object is, what each line means,
 * and — because the same marks are the filter — a toggle on every role. The weak
 * link is never filtered out, so its row carries no toggle.
 */
function ProductionKey({
  palette,
  filter,
  onFilter,
}: { readonly palette: MapPalette } & LegendFilter): React.ReactElement {
  const plain = { flagged: false, weakLink: false, abroad: false };
  return (
    <>
      <Item label="Critical Tier-1">
        <Swatch icon={supplierIcon(palette, "critical", "Nacelle")} />
      </Item>

      <Heading>Sub-tier · what they supply</Heading>
      {SUBTIER_ROLES.map((role) => (
        <Toggle
          key={role}
          label={ROLE_LABEL[role]}
          pressed={filter.roles.has(role)}
          onClick={() => onFilter(toggleRole(filter, role))}
        >
          <Swatch icon={subtierIcon(palette, "solid", role, plain)} />
        </Toggle>
      ))}

      <Heading>Evidence</Heading>
      <Item label="Verified">
        <Swatch icon={subtierIcon(palette, "solid", "distributor", plain)} />
      </Item>
      <Item label="Inferred">
        <Swatch icon={subtierIcon(palette, "ring", "distributor", plain)} />
      </Item>
      <Item label="Not established">
        <Swatch icon={subtierIcon(palette, "hollow", "distributor", plain)} />
      </Item>
      <Item label="Signal noted">
        <Swatch icon={subtierIcon(palette, "ring", "distributor", { ...plain, flagged: true })} />
      </Item>
      <Item label="Sourced abroad">
        <Swatch icon={subtierIcon(palette, "ring", "distributor", { ...plain, abroad: true })} />
      </Item>
      <Item label="Weak link">
        <Swatch icon={subtierIcon(palette, "ring", "distributor", { ...plain, weakLink: true })} />
      </Item>
      <Item label="Link · verified">
        <span className="h-[1.5px] w-5 bg-[color:var(--map-flow)]" />
      </Item>
      <Item label="Link · weak evidence">
        <span className="w-5 border-t-2 border-dotted border-[color:var(--map-flow)]" />
      </Item>

      <Heading>Show only</Heading>
      <Toggle
        label="Signal noted"
        pressed={filter.flaggedOnly}
        dimWhenOff={false}
        onClick={() => onFilter(toggleFlagged(filter))}
      >
        <Check on={filter.flaggedOnly} />
      </Toggle>
      <Toggle
        label="Sourced abroad"
        pressed={filter.abroadOnly}
        dimWhenOff={false}
        onClick={() => onFilter(toggleAbroad(filter))}
      >
        <Check on={filter.abroadOnly} />
      </Toggle>
    </>
  );
}

function Heading({ children }: { readonly children: React.ReactNode }): React.ReactElement {
  return (
    <li className="mt-1.5 text-micro uppercase leading-tight text-label-tertiary" role="presentation">
      {children}
    </li>
  );
}

function Toggle({
  children,
  label,
  pressed,
  onClick,
  dimWhenOff = true,
}: {
  readonly children: React.ReactNode;
  readonly label: string;
  readonly pressed: boolean;
  readonly onClick: () => void;
  /** A role switched off fades; a "show only" box unticked is the normal state. */
  readonly dimWhenOff?: boolean;
}): React.ReactElement {
  return (
    <li>
      <button
        type="button"
        aria-pressed={pressed}
        onClick={onClick}
        className={cn(
          "-mx-1 flex w-[calc(100%+8px)] items-center gap-2 rounded-pill px-1 text-left text-caption leading-tight transition-opacity duration-fast hover:bg-inset",
          FOCUS,
          pressed || !dimWhenOff ? "text-label-secondary" : "text-label-quaternary opacity-60"
        )}
      >
        <span className="flex w-7 shrink-0 items-center justify-center">{children}</span>
        {label}
      </button>
    </li>
  );
}

function Check({ on }: { readonly on: boolean }): React.ReactElement {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex h-3 w-3 items-center justify-center rounded-[3px] border",
        on ? "border-label-primary bg-label-primary" : "border-label-quaternary"
      )}
    >
      {on ? (
        <svg width="8" height="8" viewBox="0 0 8 8">
          <path d="M1.5 4.2 3.2 5.8 6.5 2.2" fill="none" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : null}
    </span>
  );
}
