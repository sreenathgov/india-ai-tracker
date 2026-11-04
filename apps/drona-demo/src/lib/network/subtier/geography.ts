/**
 * Which part of the world a sub-tier party sits in, at the grain the independence
 * test needs.
 *
 * A state is too fine: Durgapur and Angul are in different states and share a rail
 * corridor, a monsoon and a coal belt. A country is too coarse for India. So Indian
 * parties roll up to the regional grain the rest of the demo speaks in ("Eastern
 * India"), and parties abroad to their country — which is the grain at which trade
 * measures, the thing that reaches them, actually apply.
 */
import type { SubTierNode } from "./types";

const INDIAN_REGION: Readonly<Record<string, string>> = {
  "West Bengal": "Eastern India",
  Odisha: "Eastern India",
  Jharkhand: "Eastern India",
  Chhattisgarh: "Eastern India",
  Bihar: "Eastern India",
  Meghalaya: "North-eastern India",
  Assam: "North-eastern India",
  Maharashtra: "Western India",
  Gujarat: "Western India",
  Goa: "Western India",
  Karnataka: "Southern India",
  "Tamil Nadu": "Southern India",
  Kerala: "Southern India",
  "Andhra Pradesh": "Southern India",
  Telangana: "Southern India",
  Punjab: "Northern India",
  Haryana: "Northern India",
  Delhi: "Northern India",
  "Uttar Pradesh": "Northern India",
  Rajasthan: "Northern India",
  "Madhya Pradesh": "Central India",
};

/** Throws on an Indian state it does not know, rather than filing it somewhere wrong. */
export function broadRegion(node: Pick<SubTierNode, "id" | "region" | "country">): string {
  if (node.country !== "India") return node.country;
  const region = INDIAN_REGION[node.region];
  if (!region) throw new Error(`subtier/geography: no broad region for "${node.region}" (${node.id})`);
  return region;
}
