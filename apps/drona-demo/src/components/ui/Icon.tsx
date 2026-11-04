import * as React from "react";

/**
 * The handful of glyphs Scene 1 needs, drawn inline at a 1.5 stroke so no icon
 * library joins the stack. Decorative: the adjacent text or aria-label names them.
 */
const PATHS = {
  expand: "M9.5 3.5h3v3M6.5 12.5h-3v-3M12.5 3.5 9 7M3.5 12.5 7 9",
  arrow: "M4 8h8M8.5 4.5 12 8l-3.5 3.5",
  close: "M4.5 4.5l7 7M11.5 4.5l-7 7",
  sun: "M8 5.2a2.8 2.8 0 1 0 0 5.6 2.8 2.8 0 0 0 0-5.6ZM8 1.8v1.4M8 12.8v1.4M1.8 8h1.4M12.8 8h1.4M3.6 3.6l1 1M11.4 11.4l1 1M3.6 12.4l1-1M11.4 4.6l1-1",
  moon: "M12.9 9.9A5.2 5.2 0 0 1 6.1 3.1a5.2 5.2 0 1 0 6.8 6.8Z",
  send: "M3 8h9M8.5 4.5 12 8l-3.5 3.5",
  filter: "M3 4.5h10M5 8h6M7 11.5h2",
  up: "M8 12.5v-9M4.5 7 8 3.5 11.5 7",
  doc: "M4.5 2.5h4.5l2.5 2.5v8.5h-7ZM9 2.5V5h2.5M6.5 8.5h3M6.5 10.5h3",
  ask: "M3 4.5a1.5 1.5 0 0 1 1.5-1.5h7A1.5 1.5 0 0 1 13 4.5v5a1.5 1.5 0 0 1-1.5 1.5H7l-3 2.5V11h.5A1.5 1.5 0 0 1 3 9.5Z",
  flag: "M4 13.5V3M4 3.5h7l-1.5 2.5L11 8.5H4",
  reply: "M6.5 4 3 7.5 6.5 11M3 7.5h6.5a3.5 3.5 0 0 1 3.5 3.5v1",
  rupee: "M4.5 3.5h7M4.5 6h7M6 3.5c2.2 0 3.5 1 3.5 2.5S8.2 8.5 6 8.5h-1.5L10 12.5",
  spark: "M8 2.5v3M8 10.5v3M2.5 8h3M10.5 8h3M4.2 4.2l1.6 1.6M10.2 10.2l1.6 1.6M4.2 11.8l1.6-1.6M10.2 5.8l1.6-1.6",
  check: "M3.5 8.5 6.5 11.5 12.5 4.5",
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, className }: { readonly name: IconName; readonly className?: string }): React.ReactElement {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className ?? "h-3.5 w-3.5"}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
