import { type ClassValue, clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/* The type scale in tailwind.config.ts. Without it tailwind-merge reads `text-body-s`
   as a colour, so `cn("text-body-s", "text-label-primary")` silently drops the size. */
const TYPE_SCALE = [
  "display-xl",
  "display-l",
  "display-m",
  "title-l",
  "title-m",
  "heading",
  "body",
  "body-s",
  "caption",
  "micro",
  "mono",
  "mono-s",
] as const;

const twMerge = extendTailwindMerge({
  extend: { classGroups: { "font-size": [{ text: [...TYPE_SCALE] }] } },
});

/** Conditional classes with later Tailwind utilities winning over earlier ones. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
