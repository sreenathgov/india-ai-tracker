"use client";

import * as React from "react";

/**
 * Reveals authored paragraphs at a reading cadence.
 *
 * This is a *cadence*, not a simulation of thinking. The text already exists; the
 * pacing exists so the reviewer's eye arrives with the sentence instead of being
 * handed a finished block to re-scan. It is skippable for exactly that reason — the
 * moment it stops helping, it should get out of the way.
 *
 * Under `prefers-reduced-motion` it does not animate at all: the full text is there
 * on first paint. An accessibility preference is not a slower version of the effect.
 */
const CHARS_PER_TICK = 3;
const TICK_MS = 16;

export function useTypedReveal(paragraphs: readonly string[]): {
  readonly visible: readonly string[];
  readonly done: boolean;
  readonly skip: () => void;
} {
  const full = React.useMemo(() => paragraphs.join("\n"), [paragraphs]);
  const [revealed, setRevealed] = React.useState(0);

  React.useEffect(() => {
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (reduced) {
      setRevealed(full.length);
      return;
    }

    setRevealed(0);
    const id = window.setInterval(() => {
      setRevealed((n) => {
        if (n >= full.length) {
          window.clearInterval(id);
          return n;
        }
        return Math.min(full.length, n + CHARS_PER_TICK);
      });
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, [full]);

  const visible = React.useMemo(() => {
    const sliced = full.slice(0, revealed).split("\n");
    /* Trailing empty paragraphs are dropped so an unstarted paragraph does not
       reserve a blank line and make the block jump when it fills. */
    while (sliced.length > 0 && sliced[sliced.length - 1] === "") sliced.pop();
    return sliced;
  }, [full, revealed]);

  const skip = React.useCallback(() => setRevealed(full.length), [full.length]);

  return { visible, done: revealed >= full.length, skip };
}
