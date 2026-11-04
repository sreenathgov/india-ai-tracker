import { describe, expect, it } from "vitest";

import { buyerIcon, clusterIcon, plantIcon, subtierIcon, supplierIcon, upstreamIcon } from "./icons";
import { FALLBACK_PALETTE } from "./palette";

const P = FALLBACK_PALETTE;
const svg = (url: string) => decodeURIComponent(url.split(",").slice(1).join(","));

describe("map icons", () => {
  it("are self-contained SVG data URLs — no image files ship", () => {
    for (const i of [plantIcon(P), buyerIcon(P), clusterIcon(P, "low"), upstreamIcon(P, "ring")]) {
      expect(i.url.startsWith("data:image/svg+xml")).toBe(true);
      expect(svg(i.url)).toContain("<svg");
    }
  });

  it("gives plant, buyer and supplier different silhouettes", () => {
    const ids = new Set([
      plantIcon(P).url,
      buyerIcon(P).url,
      supplierIcon(P, "low", "Rotor").url,
    ]);
    expect(ids.size).toBe(3);
  });

  it("draws a supplier in its concern hue, with the concern shape", () => {
    const critical = svg(supplierIcon(P, "critical", "Tower").url);
    expect(critical).toContain("rgba(206, 74, 51, 1)");
    expect(critical).toContain("L 2.6 27.6"); // triangle
    const low = svg(supplierIcon(P, "low", "Tower").url);
    expect(low).toContain("A 10.6 10.6"); // disc
  });

  it("changes the glyph with the category, not the outline", () => {
    const a = svg(supplierIcon(P, "elevated", "Rotor").url);
    const b = svg(supplierIcon(P, "elevated", "Electrical").url);
    expect(a).not.toEqual(b);
    expect(a).toContain("L 16 28.6");
    expect(b).toContain("L 16 28.6");
  });

  it("returns the same object for the same icon, so the atlas is not rebuilt", () => {
    expect(supplierIcon(P, "low", "Controls")).toBe(supplierIcon(P, "low", "Controls"));
  });

  it("draws upstream evidence three ways — fact, claim, absence", () => {
    const urls = new Set(["solid", "ring", "hollow"].map((f) => upstreamIcon(P, f as never).url));
    expect(urls.size).toBe(3);
    expect(svg(upstreamIcon(P, "hollow").url)).toContain("stroke-dasharray");
  });

  it("draws a sub-tier party in neutral ink, whatever its signals", () => {
    const plain = { flagged: false, weakLink: false, abroad: false };
    const flagged = svg(subtierIcon(P, "solid", "consumable", { ...plain, flagged: true }).url);
    expect(flagged).not.toContain("rgba(206, 74, 51, 1)");
    expect(flagged).toContain("M20 2.6"); // the corner tab
    expect(svg(subtierIcon(P, "solid", "consumable", plain).url)).not.toContain("M20 2.6");
  });

  it("gives only the weak link critical ink", () => {
    const plain = { flagged: true, weakLink: false, abroad: true };
    expect(svg(subtierIcon(P, "ring", "alloy-chemical", plain).url)).not.toContain(
      "rgba(206, 74, 51, 1)"
    );
    expect(
      svg(subtierIcon(P, "ring", "alloy-chemical", { ...plain, weakLink: true }).url)
    ).toContain("rgba(206, 74, 51, 1)");
  });

  it("changes the glyph with the role", () => {
    const plain = { flagged: false, weakLink: false, abroad: false };
    const urls = new Set(
      (["raw-material", "alloy-chemical", "consumable", "process-service", "logistics", "distributor"] as const).map(
        (role) => subtierIcon(P, "solid", role, plain).url
      )
    );
    expect(urls.size).toBe(6);
  });
});
