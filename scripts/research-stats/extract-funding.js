'use strict';

const { FUNDING_CONFIG } = require('./config');

/**
 * Recovers disclosed funding rounds from article titles.
 *
 * The corpus carries no structured funding field — amounts exist only as prose.
 * A plain currency regex over this corpus sums to trillions, because it happily
 * swallows valuations ("$965B valuation"), market projections ("$550 billion by
 * 2035") and industry sizing ("$250 billion IT industry"). Everything below
 * exists to throw those away, and to prefer under-counting over over-counting.
 */

const TRAILING_PUNCT = /(?:'s|’s|[.,:;'’"?!])+$/;
const WORD = /[A-Za-z0-9][A-Za-z0-9.'’]{2,}/g;

/**
 * @param {string} text
 * @returns {number[]} every amount found, normalised to USD
 */
function parseAmounts(text) {
  if (typeof text !== 'string' || text === '') return [];
  const amounts = [];
  for (const { re, multiplier, currency } of FUNDING_CONFIG.amountPatterns) {
    // Fresh regex per call: the configured ones are global and would otherwise
    // carry `lastIndex` between invocations.
    for (const match of text.matchAll(new RegExp(re.source, re.flags))) {
      const value = Number(match[1].replace(/,/g, '')) * multiplier;
      if (!Number.isFinite(value) || value <= 0) continue;
      amounts.push(currency === 'inr' ? value / FUNDING_CONFIG.inrPerUsd : value);
    }
  }
  return amounts;
}

/**
 * Is this headline announcing a company raising a round?
 * @param {string} title
 * @returns {boolean}
 */
function isRoundTitle(title) {
  if (typeof title !== 'string' || title === '') return false;
  const { raise, exclude, aggregate, fundVehicle, investorLed } = FUNDING_CONFIG;
  if (!raise.test(title)) return false;
  if (exclude.test(title)) return false;
  if (aggregate.test(title)) return false;
  if (fundVehicle.test(title)) return false;
  if (investorLed.test(title)) return false;
  return true;
}

/**
 * Distinctive name-like tokens, used to tell two deals apart.
 * A capital anywhere in the word marks it as a name rather than prose, which
 * keeps mixed-case company names ("4baseCare", "C2i") that a leading-capital
 * rule would miss.
 */
function keyTokens(title) {
  const stop = new Set(FUNDING_CONFIG.tokenStopwords);
  const tokens = (title.match(WORD) || [])
    .filter((word) => /[A-Z]/.test(word))
    .map((word) => word.replace(TRAILING_PUNCT, '').toLowerCase())
    .filter((word) => word.length >= 3 && !stop.has(word));
  return new Set(tokens);
}

function sharedTokenCount(a, b) {
  let shared = 0;
  for (const token of a) if (b.has(token)) shared += 1;
  return shared;
}

/** Same money, same names — the same deal filed twice. */
function isSameDeal(a, b) {
  const delta = Math.abs(a.amountUsd - b.amountUsd) / Math.max(a.amountUsd, b.amountUsd, 1);
  const shared = sharedTokenCount(a.tokens, b.tokens);
  if (shared === 0) return false;
  if (delta < FUNDING_CONFIG.amountTolerance) return true;
  return shared >= FUNDING_CONFIG.looseSharedTokens && delta < FUNDING_CONFIG.looseAmountTolerance;
}

/**
 * @param {ReadonlyArray<object>} articles
 * @returns {{rounds: object[], count: number, totalUsd: number,
 *            medianRoundUsd: number, largestRoundShare: number, largestRoundTitle: string}}
 */
function extractRounds(articles) {
  const candidates = [];
  for (const article of articles) {
    const title = article.title || '';
    if (!isRoundTitle(title)) continue;
    const amounts = parseAmounts(title);
    if (amounts.length === 0) continue;
    candidates.push({
      amountUsd: Math.max(...amounts),
      title,
      date: article.date_published || '',
      url: article.url,
      tokens: keyTokens(title),
    });
  }

  // Largest first, so the fullest report of a deal survives de-duplication.
  candidates.sort((a, b) => (b.amountUsd - a.amountUsd) || a.date.localeCompare(b.date));

  const kept = [];
  for (const candidate of candidates) {
    if (!kept.some((k) => isSameDeal(k, candidate))) kept.push(candidate);
  }

  const rounds = kept.map(({ amountUsd, title, date, url }) => Object.freeze({ amountUsd, title, date, url }));
  const totalUsd = rounds.reduce((sum, r) => sum + r.amountUsd, 0);
  const ascending = rounds.map((r) => r.amountUsd).sort((a, b) => a - b);
  const middle = Math.floor(ascending.length / 2);
  const medianRoundUsd = ascending.length === 0
    ? 0
    : (ascending.length % 2 === 1 ? ascending[middle] : (ascending[middle - 1] + ascending[middle]) / 2);

  return Object.freeze({
    rounds: Object.freeze(rounds),
    count: rounds.length,
    totalUsd,
    medianRoundUsd,
    largestRoundShare: totalUsd > 0 ? rounds[0].amountUsd / totalUsd : 0,
    largestRoundTitle: rounds.length > 0 ? rounds[0].title : '',
  });
}

module.exports = { parseAmounts, isRoundTitle, extractRounds };
