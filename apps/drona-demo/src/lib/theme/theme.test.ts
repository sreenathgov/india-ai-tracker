import { afterEach, describe, expect, it } from "vitest";

import { applyTheme, readTheme, resolveTheme, THEME_BOOT_SCRIPT, THEME_STORAGE_KEY } from "./theme";

describe("resolveTheme", () => {
  it("prefers the stored choice over the OS", () => {
    expect(resolveTheme("light", true)).toBe("light");
    expect(resolveTheme("dark", false)).toBe("dark");
  });

  it("falls back to the OS when nothing valid is stored", () => {
    expect(resolveTheme(null, true)).toBe("dark");
    expect(resolveTheme("sepia", false)).toBe("light");
  });
});

describe("applyTheme", () => {
  afterEach(() => {
    document.documentElement.removeAttribute("data-theme");
    localStorage.clear();
  });

  it("sets the attribute and persists the choice", () => {
    applyTheme("dark");
    expect(readTheme()).toBe("dark");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
  });

  it("boot script restores the stored choice before paint", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "dark");
    new Function(THEME_BOOT_SCRIPT)();
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });
});
