"use client";

import * as React from "react";

import { DronaWordmark } from "@/components/brand/DronaLogo";
import { REVIEWER } from "@/components/rail/Rail";
import { cn } from "@/lib/ui/cn";

/** Demo PIN. The gate exists to establish reviewer-of-record, not to secure anything. */
const DEMO_PIN = "0000";
const PIN_LENGTH = 4;

/**
 * The identity gate.
 *
 * It is here because of a single doctrinal commitment: every conclusion this
 * surface reaches is attributable to a named reviewer. Naming Arjun before the
 * dashboard appears — rather than tucking him into an avatar menu afterwards —
 * makes that the frame of the session instead of a footnote to it.
 *
 * Material is glass over the live, dimmed dashboard, so the reviewer sees what they
 * are about to take responsibility for. Type steps one weight heavier than it would
 * on an opaque surface: translucency eats stroke contrast, and the compensation is
 * not optional. Where the OS asks for reduced transparency, tokens.css collapses the
 * tint to an opaque surface and the heavier weight simply reads as emphasis.
 *
 * A wrong PIN fails visibly. Silent rejection is the failure mode this whole system
 * is built to refuse.
 */
export function IdentityGate({
  onAdmit,
}: {
  readonly onAdmit: () => void;
}): React.ReactElement {
  const [digits, setDigits] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [leaving, setLeaving] = React.useState(false);
  const panelRef = React.useRef<HTMLDivElement | null>(null);
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    inputRef.current?.focus();
  }, []);

  /* Focus stays inside the panel while it is open. There is nothing behind it the
     reviewer is permitted to reach yet, so letting Tab escape would be a lie about
     the state of the session. */
  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const panel = panelRef.current;
      if (!panel) return;
      const focusable = panel.querySelectorAll<HTMLElement>(
        'button, input, [href], [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const submit = React.useCallback(
    (value: string) => {
      if (value !== DEMO_PIN) {
        setError("That PIN was not recognised. Try again.");
        setDigits("");
        inputRef.current?.focus();
        return;
      }
      setError(null);
      setLeaving(true);
      window.setTimeout(onAdmit, 700);
    },
    [onAdmit]
  );

  const onChange = (raw: string) => {
    const next = raw.replace(/\D/g, "").slice(0, PIN_LENGTH);
    setDigits(next);
    if (error) setError(null);
    if (next.length === PIN_LENGTH) submit(next);
  };

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 grid place-items-center",
        "motion-safe:transition-opacity motion-safe:duration-settle motion-safe:ease-calm",
        leaving ? "pointer-events-none opacity-0" : "opacity-100"
      )}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[color:var(--glass-scrim)] backdrop-blur-[10px]"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="gate-title"
        className="glass relative w-[392px] rounded-frame px-8 py-10 text-center"
      >
        <DronaWordmark height={24} className="mx-auto" />
        <p className="mt-8 micro-label text-label-tertiary">Reviewer of record</p>
        <h1
          id="gate-title"
          className="mt-4 font-display text-display-m text-brand-mark"
        >
          {REVIEWER.name}
        </h1>
        <p className="mt-3 text-body-s font-medium text-label-secondary">
          Everything reviewed in this session is attributed to you.
        </p>

        <form
          className="mt-8"
          onSubmit={(event) => {
            event.preventDefault();
            submit(digits);
          }}
        >
          <label htmlFor="gate-pin" className="sr-only">
            Four-digit PIN
          </label>

          {/* One real input, four drawn cells. Four separate inputs would break
              paste, password managers and the screen-reader's sense of one field. */}
          <input
            ref={inputRef}
            id="gate-pin"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={digits}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "gate-error" : undefined}
            onChange={(event) => onChange(event.target.value)}
            className="peer absolute h-px w-px opacity-0"
          />

          <button
            type="button"
            onClick={() => inputRef.current?.focus()}
            aria-label="Enter PIN"
            className="mx-auto flex items-center justify-center gap-3"
          >
            {Array.from({ length: PIN_LENGTH }).map((_, index) => (
              <span
                key={index}
                className={cn(
                  "grid h-14 w-12 place-items-center rounded-chip border bg-[color:var(--glass-field)]",
                  "motion-safe:transition-colors motion-safe:duration-fast",
                  error
                    ? "border-[color:var(--concern-critical-deep)]"
                    : index === digits.length
                      ? "border-brand-mark"
                      : "border-separator"
                )}
              >
                <span
                  className={cn(
                    "block h-2.5 w-2.5 rounded-full bg-label-primary",
                    "motion-safe:transition-opacity motion-safe:duration-fast",
                    index < digits.length ? "opacity-100" : "opacity-0"
                  )}
                />
              </span>
            ))}
          </button>

          <p
            id="gate-error"
            role="alert"
            className={cn(
              "mt-4 text-caption",
              /* The ring and the sentence are drawn in one hue because they are one
                 event. Tertiary, not quaternary, for the resting hint: the bottom of
                 the ladder is solved against opaque ground, and this panel is not. */
              error
                ? "text-[color:var(--concern-critical-deep)]"
                : "text-label-tertiary"
            )}
          >
            {error ?? "Demonstration PIN 0000"}
          </p>
        </form>
      </div>
    </div>
  );
}
