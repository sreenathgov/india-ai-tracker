import type { Claim, ClaimConfidence, ClaimFigure, ForecastHorizon } from "./types";

/**
 * How a forward-looking claim is qualified: how far, by when, how firmly.
 *
 * Only forecasts and scenarios have one. An observation is read off a record and a
 * an inference is drawn from observations; neither runs forward, so neither needs a
 * horizon. A forecast without its horizon and its confidence is under-specified —
 * the reader cannot tell a two-week claim from a two-month one.
 */
export interface ForecastQualifier {
  /** How far the forecast says the thing moves, when it says. */
  readonly magnitude: string | null;
  /** By when, with the basis the author measured it from. */
  readonly horizon: string;
  /** How firmly. Qualitative: Drona never shows confidence as a percentage. */
  readonly confidence: ClaimConfidence;
}

const EN_DASH = "–";
const MINUS = "−";

/** A movement carries its direction. A bare "11%" does not say which way. */
const signed = (n: number): string => (n < 0 ? `${MINUS}${Math.abs(n)}` : `+${n}`);

const percentRange = (figure: ClaimFigure): string =>
  figure.upTo === undefined
    ? `${signed(figure.value)}%`
    : `${signed(figure.value)}% to ${signed(figure.upTo)}%`;

/**
 * The magnitude of the movement, and only that.
 *
 * Day counts and money are the claim's own subject and are already in its sentence;
 * repeating them under it would be noise. A percentage is the one figure that says
 * how far a forecast moves and cannot be read off the wording.
 */
function magnitudeOf(figures: readonly ClaimFigure[] | undefined): string | null {
  const percents = (figures ?? []).filter((f) => f.unit === "percent");
  if (percents.length === 0) return null;
  return percents.map((f) => `${f.label} ${percentRange(f)}`).join(" · ");
}

function horizonOf(horizon: ForecastHorizon): string {
  const { fromDays, toDays, basis } = horizon;
  const span =
    toDays <= fromDays
      ? `${fromDays} days`
      : fromDays === 0
        ? `within ${toDays} days`
        : `${fromDays}${EN_DASH}${toDays} days`;
  return `${span}, ${basis}`;
}

/**
 * The qualifier for a forward-looking claim, or null where there is nothing to
 * qualify: a claim that does not run forward, or one whose author left no horizon.
 */
export function forecastQualifier(claim: Claim): ForecastQualifier | null {
  const forward = claim.claimType === "forecast" || claim.claimType === "scenario";
  if (!forward || !claim.forecastHorizon) return null;
  return {
    magnitude: magnitudeOf(claim.figures),
    horizon: horizonOf(claim.forecastHorizon),
    confidence: claim.confidence,
  };
}
