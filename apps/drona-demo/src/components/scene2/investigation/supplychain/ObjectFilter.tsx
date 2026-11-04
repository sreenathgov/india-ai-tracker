"use client";

import * as React from "react";

import { NODE_TYPE_LABEL } from "@/lib/scene2/supplychain/labels";
import { OBJECT_KINDS } from "@/lib/scene2/supplychain/view";
import type { GraphView, ObjectKind } from "@/lib/scene2/supplychain/view";
import { cn } from "@/lib/ui/cn";

const PLURAL: Readonly<Record<ObjectKind, string>> = {
  supplier: "Suppliers",
  material: "Materials",
  process: "Processes",
  facility: "Facilities",
  route: "Routes",
};

/**
 * Which kinds of object to draw, behind one control.
 *
 * A permanent row of five toggles would turn an investigation surface into a
 * dashboard filter bar, so the choice lives in a popover and the trigger says only
 * whether anything is being held back. Nothing here can hide an object the concern
 * runs through — `applyView` pins those — and the note in the panel says so, rather
 * than leaving a reader to wonder why a card stayed put.
 */
export function ObjectFilter({
  view,
  onToggle,
}: {
  readonly view: GraphView;
  readonly onToggle: (kind: ObjectKind) => void;
}): React.ReactElement {
  const [open, setOpen] = React.useState(false);
  const shellRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const away = (event: MouseEvent): void => {
      if (!shellRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent): void => {
      if (event.key !== "Escape") return;
      event.stopPropagation();
      setOpen(false);
    };
    document.addEventListener("mousedown", away);
    document.addEventListener("keydown", escape, true);
    return () => {
      document.removeEventListener("mousedown", away);
      document.removeEventListener("keydown", escape, true);
    };
  }, [open]);

  const shown = OBJECT_KINDS.length - view.hidden.size;

  return (
    <div ref={shellRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((was) => !was)}
        className={cn(
          "rounded-pill border px-2.5 py-1 text-caption transition-colors",
          view.hidden.size > 0
            ? "border-card-edge-strong bg-card text-label-secondary"
            : "border-transparent text-label-tertiary hover:bg-hover hover:text-label-secondary"
        )}
      >
        {view.hidden.size === 0 ? "All objects" : `${shown} of ${OBJECT_KINDS.length} objects`}
      </button>

      {open ? (
        <div className="float-material absolute right-0 top-[calc(100%+6px)] z-30 w-[228px] rounded-chip p-2">
          <ul className="flex flex-col">
            {OBJECT_KINDS.map((kind) => {
              const hidden = view.hidden.has(kind);
              return (
                <li key={kind}>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={!hidden}
                    onClick={() => onToggle(kind)}
                    className="flex w-full items-center gap-2.5 rounded-chip px-2 py-1.5 text-left text-body-s text-label-secondary transition-colors hover:bg-hover"
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "h-[7px] w-[7px] shrink-0 rounded-full border",
                        hidden ? "border-label-quaternary bg-transparent" : "border-label-secondary bg-label-secondary"
                      )}
                    />
                    <span className={cn(hidden && "text-label-quaternary")}>
                      {PLURAL[kind] ?? NODE_TYPE_LABEL[kind]}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="mt-1 border-t border-separator px-2 pb-0.5 pt-2 text-caption leading-[1.45] text-label-quaternary">
            An object the concern runs through stays on the canvas either way.
          </p>
        </div>
      ) : null}
    </div>
  );
}
