"use client";

import * as React from "react";

import { applyTheme, readTheme, type Theme } from "@/lib/theme/theme";
import { cn } from "@/lib/ui/cn";
import { Icon } from "./Icon";

const OPTIONS: readonly { readonly value: Theme; readonly label: string; readonly icon: "sun" | "moon" }[] = [
  { value: "light", label: "Light", icon: "sun" },
  { value: "dark", label: "Dark", icon: "moon" },
];

/**
 * Two-state segmented control with a thumb that slides between them. The boot
 * script has already set the theme; this reads it.
 */
export function ThemeToggle(): React.ReactElement {
  const [theme, setTheme] = React.useState<Theme>("light");

  React.useEffect(() => setTheme(readTheme()), []);

  const choose = (next: Theme) => {
    applyTheme(next);
    setTheme(next);
  };

  return (
    <div
      role="group"
      aria-label="Colour theme"
      className="relative grid grid-cols-2 items-center rounded-pill border border-card-edge bg-selected p-0.5"
    >
      <span
        aria-hidden="true"
        className={cn(
          "absolute inset-y-0.5 left-0.5 w-[calc(50%-2px)] rounded-pill bg-card shadow-rest motion-safe:transition-transform motion-safe:duration-hover motion-safe:ease-overlay",
          theme === "dark" && "translate-x-full"
        )}
      />
      {OPTIONS.map((option) => {
        const active = option.value === theme;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => choose(option.value)}
            className={cn(
              "relative z-[1] inline-flex items-center justify-center gap-1.5 rounded-pill px-2.5 py-1 text-caption transition-colors duration-hover",
              active ? "font-medium text-label-primary" : "text-label-tertiary hover:text-label-primary"
            )}
          >
            <Icon name={option.icon} className="h-3.5 w-3.5" />
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
