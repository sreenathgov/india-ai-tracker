/** Reading space belongs to the section, not to a text node's bounding box. */
export interface Bounds { readonly left: number; readonly top: number; readonly right: number; readonly bottom: number }
export interface SectionFrame { readonly left: number; readonly top: number; readonly width: number; readonly height: number; readonly radius: number }
export type ReadingRail = "left" | "right" | null;

export const SECTION_SPACE = 14;
export const COACH_GAP = 32;
export const STAGE_MARGIN = 24;

/** Expand the real section, while respecting the sheet and its scrolling viewport. */
export function frameSection(subject: Bounds, clip: Bounds): SectionFrame {
  const left = Math.max(clip.left, subject.left - SECTION_SPACE);
  const top = Math.max(clip.top, subject.top - SECTION_SPACE);
  const right = Math.min(clip.right, subject.right + SECTION_SPACE);
  const bottom = Math.min(clip.bottom, subject.bottom + SECTION_SPACE);
  return { left, top, width: Math.max(0, right - left), height: Math.max(0, bottom - top), radius: 16 };
}

/** Place narration in its reserved rail, or beside a narrower native section. */
export function placeCoach(scope: Bounds, subject: SectionFrame | null, width: number, height: number, rail: ReadingRail, complete = false): { left: number; top: number } {
  const minX = scope.left + STAGE_MARGIN, maxX = scope.right - width - STAGE_MARGIN;
  const minY = scope.top + STAGE_MARGIN, maxY = Math.max(minY, scope.bottom - height - STAGE_MARGIN);
  const clampY = (y: number) => Math.max(minY, Math.min(y, maxY));
  if (complete) return { left: minX, top: clampY(Math.max(scope.top + 180, (subject?.top ?? scope.top) + (subject?.height ?? 0) + COACH_GAP)) };
  if (!subject) return { left: minX, top: minY };
  const top = clampY(subject.top + (subject.height - height) / 2);
  if (rail) return { left: rail === "left" ? minX : maxX, top };
  if (scope.right - subject.left - subject.width >= width + COACH_GAP + STAGE_MARGIN) return { left: subject.left + subject.width + COACH_GAP, top };
  if (subject.left - scope.left >= width + COACH_GAP + STAGE_MARGIN) return { left: subject.left - width - COACH_GAP, top };
  // Recovery for unusually narrow windows: keep navigation on screen. The
  // desktop presentation reserves a real rail for every full-width subject.
  const below = subject.top + subject.height + COACH_GAP;
  return { left: minX, top: below + height <= scope.bottom - STAGE_MARGIN ? below : clampY(subject.top - height - COACH_GAP) };
}
