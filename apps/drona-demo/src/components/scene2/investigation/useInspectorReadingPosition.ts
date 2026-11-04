"use client";

import * as React from "react";

/** A narrow inspector replaces the canvas. Start reading at its heading rather
 * than inheriting the scroll used to reach a node in the enlarged graph. */
export function useInspectorReadingPosition(row: React.RefObject<HTMLDivElement | null>, selectedId: string | null): void {
  const replaced = React.useRef<string | null>(null);
  React.useLayoutEffect(() => {
    const element = row.current;
    if (!element) return;
    const canvas = element.firstElementChild;
    const inspector = element.querySelector<HTMLElement>(":scope > aside");
    if (inspector && canvas && getComputedStyle(canvas).display === "none") {
      replaced.current = selectedId;
      inspector.scrollTop = 0;
      const scroller = element.closest<HTMLElement>("[data-material-tab-body]");
      if (scroller) scroller.scrollTop += inspector.getBoundingClientRect().top - scroller.getBoundingClientRect().top - 12;
      inspector.tabIndex = -1;
      inspector.focus({ preventScroll: true });
    } else if (!selectedId && replaced.current) {
      const id = replaced.current;
      const origin = Array.from(element.querySelectorAll<HTMLElement>("[data-reasoning-node], [data-graph-node]"))
        .find(node => node.dataset.reasoningNode === id || node.dataset.graphNode === id);
      origin?.focus({ preventScroll: true });
      replaced.current = null;
    }
  }, [row, selectedId]);
}
