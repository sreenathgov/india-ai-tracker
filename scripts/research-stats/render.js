'use strict';

/**
 * Turns computed figures into the text the tracker page shows.
 * Owns every formatting decision, so the published wording is testable.
 */

const ONES = Object.freeze([
  'ZERO', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE',
  'TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN',
  'SEVENTEEN', 'EIGHTEEN', 'NINETEEN',
]);
const TENS = Object.freeze([
  '', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY',
]);
const MONTH_NAMES = Object.freeze([
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]);

/** The heading says the month count in words, so it reads as a sentence. */
function numberToWord(n) {
  if (!Number.isInteger(n) || n < 0 || n > 99) {
    throw new RangeError(`numberToWord expects an integer 0-99, got ${n}`);
  }
  if (n < 20) return ONES[n];
  const unit = n % 10;
  return unit === 0 ? TENS[Math.floor(n / 10)] : `${TENS[Math.floor(n / 10)]}-${ONES[unit]}`;
}

/**
 * Compact currency, always rounded DOWN: the published figure must never
 * claim more capital than the record actually supports.
 */
function formatCompactUsd(usd) {
  if (!Number.isFinite(usd) || usd < 0) throw new RangeError(`formatCompactUsd expects a positive number, got ${usd}`);
  if (usd >= 1e9) return `$${(Math.floor(usd / 1e8) / 10).toFixed(1)}B`;
  if (usd >= 1e6) return `$${Math.floor(usd / 1e6)}M`;
  return `$${Math.floor(usd / 1e3)}K`;
}

function formatCount(n) {
  return Number(n).toLocaleString('en-US');
}

function monthLabel(yyyyMm) {
  const [year, month] = String(yyyyMm).split('-');
  const name = MONTH_NAMES[Number(month) - 1];
  return name ? `${name} ${year}` : '';
}

/** Every figure the page or its prose is allowed to cite, in one flat map. */
function figureMap(figures, funding) {
  return Object.freeze({
    ...figures,
    roundCount: funding.count,
    capitalUsd: funding.totalUsd,
    medianRoundUsd: funding.medianRoundUsd,
    largestRoundShare: funding.largestRoundShare,
  });
}

/**
 * @returns {Readonly<{heading: string, subheading: string, stats: object[], computed: object}>}
 */
function buildPatch(figures, funding) {
  const stats = [
    {
      value: formatCompactUsd(funding.totalUsd),
      title: 'Capital Tracked',
      description: `Across ${formatCount(funding.count)} disclosed rounds, de-duplicated by deal.`,
    },
    {
      value: formatCount(figures.totalSignals),
      title: 'Signals Filed',
      description: 'Each one classified, geo-attributed and adjudicated before it enters the record.',
    },
    {
      value: formatCount(figures.policyCount),
      title: 'Policy Moves Logged',
      description: 'Central and state action, held apart from the announcement noise around it.',
    },
    {
      value: formatCount(figures.jurisdictionCount),
      title: 'States & UTs Mapped',
      description: 'Every jurisdiction kept as its own record, not folded into a national feed.',
    },
  ].map(Object.freeze);

  return Object.freeze({
    heading: `${numberToWord(figures.monthsActive)} MONTHS OF SIGNAL`,
    subheading: `Every AI signal out of India — ${formatCount(figures.totalSignals)} of them — `
      + `read, filed and cross-checked since ${monthLabel(figures.firstMonth)}.`,
    stats: Object.freeze(stats),
    computed: figureMap(figures, funding),
  });
}

/**
 * The insight cards are written by hand. Rather than let their figures rot
 * silently, each card declares what it asserts and we report — never rewrite —
 * anything that has since moved.
 *
 * @returns {string[]} one warning per drifted figure; empty while the prose holds
 */
function checkDrift(checks, figures, funding) {
  const available = figureMap(figures, funding);
  return (checks || []).flatMap((check) => {
    if (!(check.figure in available)) {
      throw new Error(`Drift check names an unknown figure: "${check.figure}"`);
    }
    const actual = available[check.figure];
    const tolerance = check.tolerance || 0;
    if (Math.abs(actual - check.expected) <= tolerance) return [];
    return [`${check.figure}: prose says ${check.expected}, corpus now says ${actual}`];
  });
}

module.exports = { numberToWord, formatCompactUsd, formatCount, monthLabel, buildPatch, checkDrift };
