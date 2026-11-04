import type { RiskBand } from "@/lib/network/bom";

/**
 * One place that says how each band sits on a card and a row, so Cards and List
 * cannot style the same band two ways. Washes and edges are the `--band-*` tokens.
 * `null` is the unassessed card: neutral, and the same as low.
 */
export const CARD_BAND: Readonly<Record<RiskBand | "none", string>> = {
  critical:
    "border-[color:color-mix(in_srgb,var(--band-critical-edge)_55%,transparent)] bg-[color:var(--band-critical-wash)] hover:border-[color:var(--band-critical-edge-hover)] hover:bg-[color:var(--band-critical-wash-hover)]",
  elevated:
    "border-[color:color-mix(in_srgb,var(--band-elevated-edge)_55%,transparent)] bg-[color:var(--band-elevated-wash)] hover:border-[color:var(--band-elevated-edge-hover)] hover:bg-[color:var(--band-elevated-wash-hover)]",
  low: "border-transparent bg-inset hover:border-card-edge-strong",
  none: "border-transparent bg-inset hover:border-card-edge-strong",
};

export const ROW_BAND: Readonly<Record<RiskBand | "none", string>> = {
  critical: "bg-[color:var(--band-critical-row)]",
  elevated: "bg-[color:var(--band-elevated-row)]",
  low: "",
  none: "",
};

/** The band's word in its own ink: stronger than the wash, quieter than the mark. */
export const BAND_INK: Readonly<Record<RiskBand, string>> = {
  critical: "text-[color:var(--concern-critical-ink)]",
  elevated: "text-[color:var(--concern-elevated-ink)]",
  low: "text-label-tertiary",
};

export const bandKey = (band: RiskBand | null): RiskBand | "none" => band ?? "none";
