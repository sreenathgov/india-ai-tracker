import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import config from "../../tailwind.config";

const SRC = path.resolve(__dirname, "..");
const TOKENS = readFileSync(path.join(SRC, "design/tokens.css"), "utf8");

function sourceFiles(dir: string): readonly string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(full);
    if (!/\.tsx?$/.test(entry.name) || entry.name.includes(".test.")) return [];
    return [full];
  });
}

/** Every colour name Tailwind knows, flattened to the form a class name uses. */
function colourNames(): readonly string[] {
  const colours = (config.theme?.extend?.colors ?? {}) as Record<string, unknown>;
  const out: string[] = [];
  for (const [name, value] of Object.entries(colours)) {
    if (typeof value === "string") {
      out.push(name);
      continue;
    }
    for (const key of Object.keys(value as Record<string, unknown>)) {
      out.push(key === "DEFAULT" ? name : `${name}-${key}`);
    }
  }
  return out;
}

const FILES = sourceFiles(SRC);
const COLOURS = colourNames();

describe("the token layer", () => {
  it("is never given an alpha modifier at a call site", () => {
    /* `bg-page/45` emits nothing at all.
       ────────────────────────────────────────────────────────────────
       Tailwind can only divide a colour into channels it can see, and every colour in
       this config is `var(--…)` — opaque to it by construction, which is the point of
       the semantic layer. Asked for an alpha modifier on one, Tailwind declines to
       emit the utility rather than failing loudly, so the class name stays in the
       markup, reads as intentional in review, and renders as *no background*.

       Three of these shipped before anyone measured: the identity gate's scrim, its
       PIN cells, and the map's hover card. The gate's veil was the consequential one —
       without it the panel's type sat over whatever the viewport height happened to put
       behind it, which on a short screen is the map.

       Translucent surfaces are therefore declared as tokens in tokens.css, where the
       alpha is a stated material decision rather than an inline guess, and reduced
       transparency can answer them all in one place. */
    const pattern = new RegExp(
      `\\b(?:bg|text|border|ring|fill|stroke|from|via|to)-(?:${COLOURS.join("|")})/\\d+`,
      "g"
    );

    /* The three that actually shipped. A guard that has never been watched to fail is
       an assertion about nothing, and this one passes trivially the moment the colour
       list or the utility list is mistyped. */
    expect(
      'bg-page/45 bg-surface/70 bg-map-raised/95'.match(pattern)
    ).toHaveLength(3);
    expect("bg-[color:var(--glass-scrim)] w-1/2 mt-4".match(pattern)).toBeNull();

    const offences = FILES.flatMap((file) => {
      const matches = readFileSync(file, "utf8").match(pattern) ?? [];
      return matches.map((m) => `${path.relative(SRC, file)} — ${m}`);
    });

    expect(offences).toEqual([]);
  });

  it("declares every translucent material it is asked for, including when the OS asks for none", () => {
    /* A token that is translucent in the default theme and absent from the
       reduced-transparency block would quietly stay translucent for the people who
       asked the OS to stop producing translucency. */
    const reduced = TOKENS.slice(
      TOKENS.indexOf("prefers-reduced-transparency")
    );

    for (const token of [
      "--glass-tint",
      "--glass-scrim",
      "--glass-field",
      "--bg-map-popover",
    ]) {
      expect(TOKENS).toContain(`${token}:`);
      expect(reduced).toContain(`${token}:`);
    }
  });
});
