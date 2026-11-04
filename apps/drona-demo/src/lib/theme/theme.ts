/**
 * Light / dark theme. The attribute lives on `<html>` as `data-theme`, and every
 * colour follows it through the semantic tokens — no component asks which theme
 * it is in.
 *
 * The first paint is decided by `THEME_BOOT_SCRIPT`, inlined into the document head
 * so the page never flashes the wrong ground: the stored choice if there is one,
 * otherwise the OS preference.
 */
export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "drona-theme";

export const isTheme = (value: unknown): value is Theme =>
  value === "light" || value === "dark";

/** The stored choice wins; with none (or storage blocked), the OS decides. */
export function resolveTheme(stored: string | null, prefersDark: boolean): Theme {
  if (isTheme(stored)) return stored;
  return prefersDark ? "dark" : "light";
}

export const THEME_BOOT_SCRIPT = `(function(){try{var s=null;try{s=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY
)})}catch(e){}var d=window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.setAttribute("data-theme",s==="light"||s==="dark"?s:d?"dark":"light")}catch(e){}})();`;

export function readTheme(): Theme {
  if (typeof document === "undefined") return "light";
  const attr = document.documentElement.getAttribute("data-theme");
  return isTheme(attr) ? attr : "light";
}

export function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute("data-theme", theme);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* Storage blocked (private mode): the theme still applies for this visit. */
  }
}
