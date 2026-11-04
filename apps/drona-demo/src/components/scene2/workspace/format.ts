const DAY = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

/** "2026-11-18" → "18 Nov 2026". Dates are authored as ISO days, in UTC. */
export const formatDay = (isoDay: string): string => DAY.format(new Date(`${isoDay}T00:00:00Z`));
