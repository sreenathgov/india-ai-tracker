import { describe, expect, it } from "vitest";

import { cn } from "./cn";

describe("cn", () => {
  it("keeps a type-scale size beside a colour", () => {
    expect(cn("text-body-s", "text-label-primary")).toBe("text-body-s text-label-primary");
    expect(cn("text-mono-s", "text-[color:var(--concern-critical-ink)]")).toContain("text-mono-s");
  });

  it("still lets a later size win over an earlier one", () => {
    expect(cn("text-body-s", "text-caption")).toBe("text-caption");
  });
});
