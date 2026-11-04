/**
 * What kind of firm each critical Tier-1 is — the part of a supplier record that
 * Scene 1 never needed and the production view cannot do without.
 *
 * ── Everything here is invented. ──────────────────────────────────────────────
 *
 * Kept out of `Supplier` on purpose. Scene 1 reads eighty suppliers as dots and
 * bands; scale, process and ownership only become load-bearing once a reviewer is
 * looking at one foundry and asking whether it can absorb a shock. Widening the
 * shared type for five records would put fields on seventy-five that have nothing
 * truthful to say.
 *
 * Returns `undefined` for a supplier without a profile. The view says so rather
 * than inventing a scale for it.
 */
import { SUPPLIERS } from "./gazetteer";

export type Scale = "large" | "mid" | "small";
export type Ownership = "listed" | "private" | "msme";

export interface TierOneProfile {
  readonly supplierId: string;
  readonly scale: Scale;
  readonly ownership: Ownership;
  /** The process, in the words a foundry or fabrication engineer would use. */
  readonly process: string;
  /** One sentence on what the plant can physically do — the constraint, not a boast. */
  readonly capacityNote: string;
}

export const SCALE_LABEL: Readonly<Record<Scale, string>> = {
  large: "Large",
  mid: "Mid-size",
  small: "Small",
};

export const OWNERSHIP_LABEL: Readonly<Record<Ownership, string>> = {
  listed: "Listed",
  private: "Private",
  msme: "MSME",
};

/* [ supplierId, scale, ownership, process, capacityNote ] */
type ProfileRow = readonly [string, Scale, Ownership, string, string];

const PROFILE_ROWS: readonly ProfileRow[] = [
  [
    "sup:deccan-mainshaft-forgings",
    "large",
    "listed",
    "Open-die forging, 42CrMo4 main shafts, quench and temper",
    "One 6,000-tonne press rated for shafts of this length; a second press cannot take the ingot.",
  ],
  [
    "sup:saurashtra-ductile-castings",
    "mid",
    "private",
    "Ductile-iron foundry, EN-GJS-400-18U-LT, furan no-bake moulding",
    "Two pouring bays; the hub needs both ladles in one pour, so it books a whole shift.",
  ],
  [
    "sup:kovai-castings-machining",
    "small",
    "msme",
    "Single-bay ductile foundry with in-house boring and facing",
    "One melt line and one horizontal boring mill; any stoppage stops the housing outright.",
  ],
  [
    "sup:tiruchi-tower-sections",
    "large",
    "private",
    "Welded tower fabrication: plate cutting, rolling, submerged-arc welding, metallising",
    "Three rolling lines, but only one rolls plate above 60 mm — the base sections need it.",
  ],
  [
    "sup:ludhiana-ring-forgings",
    "small",
    "msme",
    "Ring-rolled flange forging, normalised, rough-machined",
    "One ring mill sized for tower-flange diameters; outsourced heat treatment and inspection.",
  ],
];

const PROFILES = new Map<string, TierOneProfile>(
  PROFILE_ROWS.map(([supplierId, scale, ownership, process, capacityNote]) => {
    if (!SUPPLIERS.some((s) => s.id === supplierId)) {
      throw new Error(`tierOne.ts: ${supplierId} is not in the gazetteer`);
    }
    return [supplierId, { supplierId, scale, ownership, process, capacityNote }];
  })
);

export const tierOneProfile = (supplierId: string): TierOneProfile | undefined =>
  PROFILES.get(supplierId);

export const PROFILED_SUPPLIER_IDS: readonly string[] = [...PROFILES.keys()];
