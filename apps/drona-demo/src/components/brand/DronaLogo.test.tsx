import { cleanup, render, screen } from "@testing-library/react";
import * as React from "react";
import { afterEach, describe, expect, it } from "vitest";

import { DronaMonogram, DronaWordmark } from "./DronaLogo";
import { MONOGRAM_VIEWBOX, WORDMARK_VIEWBOX } from "./logoPaths";

afterEach(cleanup);

describe("DronaWordmark", () => {
  it("is one image named Drona, painted in the theme's logo colour", () => {
    render(<DronaWordmark height={20} />);
    const svg = screen.getByRole("img", { name: "Drona" });
    expect(svg.getAttribute("class")).toContain("text-brand-logo");
    expect(svg.querySelectorAll("path")).toHaveLength(2);
    for (const p of svg.querySelectorAll("path")) {
      expect(p.getAttribute("fill")).toBe("currentColor");
      expect(p.getAttribute("fill-rule")).toBe("evenodd");
    }
  });

  it("keeps the artwork's proportions at any height", () => {
    render(<DronaWordmark height={20} />);
    const svg = screen.getByRole("img", { name: "Drona" });
    const ratio = WORDMARK_VIEWBOX.width / WORDMARK_VIEWBOX.height;
    expect(Number(svg.getAttribute("width"))).toBeCloseTo(20 * ratio, 1);
    expect(svg.getAttribute("height")).toBe("20");
  });

  it("drops out of the accessibility tree when decorative", () => {
    const { container } = render(<DronaWordmark height={20} decorative />);
    expect(screen.queryByRole("img")).toBeNull();
    expect(container.querySelector("svg")?.getAttribute("aria-hidden")).toBe("true");
  });
});

describe("DronaMonogram", () => {
  it("is the wordmark's d alone, decorative by default", () => {
    const { container } = render(<DronaMonogram height={14} />);
    const svg = container.querySelector("svg")!;
    expect(svg.getAttribute("aria-hidden")).toBe("true");
    expect(svg.getAttribute("viewBox")).toBe(
      `${MONOGRAM_VIEWBOX.x} ${MONOGRAM_VIEWBOX.y} ${MONOGRAM_VIEWBOX.width} ${MONOGRAM_VIEWBOX.height}`
    );
    expect(svg.querySelectorAll("path")).toHaveLength(1);
  });
});
