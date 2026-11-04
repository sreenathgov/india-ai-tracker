import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { FALLBACK_PALETTE, parseColor, readPalette, toCss, withAlpha } from "./palette";

describe("parseColor", () => {
  it("reads every hex form", () => {
    expect(parseColor("#fff")).toEqual([255, 255, 255, 255]);
    expect(parseColor("#843535")).toEqual([132, 53, 53, 255]);
    expect(parseColor("#84353580")).toEqual([132, 53, 53, 128]);
  });

  it("reads rgb and rgba, with or without commas", () => {
    expect(parseColor("rgb(21, 23, 26)")).toEqual([21, 23, 26, 255]);
    expect(parseColor("rgba(21, 23, 26, 0.5)")).toEqual([21, 23, 26, 128]);
    expect(parseColor(" rgb(21 23 26 / 0.5) ")).toEqual([21, 23, 26, 128]);
  });

  it("refuses what it cannot resolve rather than guessing", () => {
    expect(parseColor("color-mix(in srgb, red 50%, transparent)")).toBeNull();
    expect(parseColor("")).toBeNull();
    expect(parseColor("maroon")).toBeNull();
  });
});

describe("readPalette", () => {
  it("falls back token by token, so one bad value cannot blank the map", () => {
    const palette = readPalette((token) => (token === "--bg-map" ? "#010203" : ""));
    expect(palette.ocean).toEqual([1, 2, 3, 255]);
    expect(palette.land).toEqual(FALLBACK_PALETTE.land);
    expect(palette.inferredOpacity).toBe(FALLBACK_PALETTE.inferredOpacity);
  });
});

describe("FALLBACK_PALETTE", () => {
  /* The fallback is a mirror of tokens.css, not a second opinion. Pin the ones that
     are authored as plain hex there, so tuning a hue cannot leave the map behind. */
  const css = readFileSync(resolve(__dirname, "../../design/tokens.css"), "utf8");
  const hexOf = (primitive: string) =>
    parseColor(new RegExp(`${primitive}:\\s*(#[0-9a-fA-F]{3,8})`).exec(css)![1]);

  it("matches the token file's concern hues and brand mark", () => {
    expect(FALLBACK_PALETTE.concern.low).toEqual(hexOf("--concern-low-silver"));
    expect(FALLBACK_PALETTE.concern.elevated).toEqual(hexOf("--concern-elevated-silver"));
    expect(FALLBACK_PALETTE.concern.critical).toEqual(hexOf("--concern-critical-silver"));
    expect(FALLBACK_PALETTE.plant).toEqual(hexOf("--maroon"));
    expect(FALLBACK_PALETTE.buyer).toEqual(hexOf("--map-buyer-ink"));
    expect(FALLBACK_PALETTE.upstream).toEqual(hexOf("--map-upstream-ink"));
  });

  it("matches the token file's silver map ground", () => {
    expect(FALLBACK_PALETTE.ocean).toEqual(hexOf("--map-ocean-silver"));
    expect(FALLBACK_PALETTE.land).toEqual(hexOf("--map-land-silver"));
    expect(FALLBACK_PALETTE.landEdge).toEqual(hexOf("--map-land-edge-silver"));
  });
});

describe("toCss / withAlpha", () => {
  it("round-trips through CSS", () => {
    expect(parseColor(toCss([132, 53, 53, 128]))).toEqual([132, 53, 53, 128]);
  });

  it("fades by a factor and clamps it", () => {
    expect(withAlpha([1, 2, 3, 200], 0.5)).toEqual([1, 2, 3, 100]);
    expect(withAlpha([1, 2, 3, 200], 3)).toEqual([1, 2, 3, 200]);
  });
});
