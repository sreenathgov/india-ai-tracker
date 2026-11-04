/**
 * The demo's fixed instant.
 *
 * Every date-derived figure on screen — days to nearest delivery, the header date,
 * the session stamp — resolves from this one value rather than from the wall clock.
 *
 * Two reasons, and the second is the important one. Server and client must agree or
 * React reports a hydration mismatch. And a demo whose headline figure silently
 * decrements overnight is a demo that reads differently on the day it is shown than
 * on the day it was rehearsed. Pinning the instant makes the surface reproducible.
 */
export const DEMO_NOW = new Date("2026-11-02T00:00:00.000Z");

/** Shown against the reviewer in the rail. Same reason: stable across machines. */
export const SESSION_START = "2 Nov 2026 · 21:30 IST";
