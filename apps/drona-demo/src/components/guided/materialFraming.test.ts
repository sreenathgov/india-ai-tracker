import { describe, expect, it } from "vitest";
import { frameSection, placeCoach } from "./materialFraming";

const sheet = { left: 80, top: 24, right: 1416, bottom: 976 };
describe("supplier walkthrough section framing", () => {
  it("leaves reading space around every edge of a complete section", () => {
    const subject = { left: 472, top: 230, right: 1388, bottom: 850 };
    const frame = frameSection(subject, sheet);
    expect(frame.left).toBeLessThan(subject.left - 10);
    expect(frame.top).toBeLessThan(subject.top - 10);
    expect(frame.left + frame.width).toBeGreaterThan(subject.right + 10);
    expect(frame.top + frame.height).toBeGreaterThan(subject.bottom + 10);
  });
  it("keeps the aperture inside a scrolling reading viewport", () => {
    const viewport = { left: 108, top: 200, right: 1388, bottom: 930 };
    const frame = frameSection({ left: 120, top: 180, right: 1380, bottom: 960 }, viewport);
    expect(frame.top).toBe(viewport.top);
    expect(frame.top + frame.height).toBe(viewport.bottom);
    expect(frame.left).toBeGreaterThanOrEqual(viewport.left);
    expect(frame.left + frame.width).toBeLessThanOrEqual(viewport.right);
  });
  it.each(["left", "right"] as const)("keeps a %s reading rail separate from its subject", rail => {
    const subject = rail === "left" ? { left: 472, top: 230, right: 1388, bottom: 850 } : { left: 108, top: 230, right: 1024, bottom: 850 };
    const frame = frameSection(subject, sheet), coach = placeCoach(sheet, frame, 320, 360, rail);
    const gap = rail === "left" ? frame.left - coach.left - 320 : coach.left - frame.left - frame.width;
    expect(gap).toBeGreaterThanOrEqual(32);
    expect(coach.top).toBeGreaterThanOrEqual(sheet.top + 24);
    expect(coach.top + 360).toBeLessThanOrEqual(sheet.bottom - 24);
  });
  it("keeps completion on the left and below the full supplier header", () => {
    const header = frameSection({ left: 80, top: 24, right: 1416, bottom: 154 }, sheet);
    const coach = placeCoach(sheet, header, 320, 340, null, true);
    expect(coach.left).toBeLessThan(130);
    expect(coach.top - header.top - header.height).toBeGreaterThanOrEqual(32);
  });
});
