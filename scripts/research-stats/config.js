'use strict';

/**
 * Tunables for the research-stats generator.
 *
 * Everything the extractor decides with lives here so the figures published on
 * the tracker page stay auditable: if a number on the site looks wrong, this is
 * the file that explains why.
 */

/**
 * The corpus contains a handful of records dated before the tracker launched —
 * publisher backfill and a few misparsed dates (2024-04, 2025-11, 2025-12).
 * They are real articles but they are not part of "what we have collected since
 * January", so every headline figure is computed from this date forward.
 */
const CORPUS_START_DATE = '2026-01-01';

const FUNDING_CONFIG = Object.freeze({
  // Nominal rate. Amounts are display-rounded down to one significant decimal,
  // so day-to-day FX drift never moves the published figure.
  inrPerUsd: 88,

  // Two reports of the same deal are treated as one when the amounts agree this
  // closely AND the titles share a distinctive capitalised token.
  amountTolerance: 0.02,

  // The same deal is often filed twice in different currencies ("Rs 193 Cr" and
  // "$20.5 Mn"), or as a round and its extension. Those land further apart than
  // the tight tolerance allows, so a wider one applies when the two titles agree
  // on more than one distinctive token.
  looseAmountTolerance: 0.15,
  looseSharedTokens: 2,

  amountPatterns: Object.freeze([
    { re: /(?:US)?\$\s*(\d{1,3}(?:,\d{2,3})*(?:\.\d+)?)\s*(?:mn\b|million\b|m\b)/gi, multiplier: 1e6, currency: 'usd' },
    { re: /(?:US)?\$\s*(\d{1,3}(?:,\d{2,3})*(?:\.\d+)?)\s*(?:bn\b|billion\b|b\b)/gi, multiplier: 1e9, currency: 'usd' },
    { re: /(?:rs\.?|₹|inr)\s*(\d{1,3}(?:,\d{2,3})*(?:\.\d+)?)\s*(?:cr\b|crore)/gi, multiplier: 1e7, currency: 'inr' },
    { re: /(?:rs\.?|₹|inr)\s*(\d{1,3}(?:,\d{2,3})*(?:\.\d+)?)\s*lakh/gi, multiplier: 1e5, currency: 'inr' },
  ]),

  // A round has to be announced as a raise, in the title. Amounts buried in a
  // summary are context, not the subject of the story.
  raise: /\b(raises?|raised|secures?|secured|bags?|bagged|nets?|mops?\s+up|garners?|series\s+[a-e]\b|seed\s+round|pre-series|pre-seed|funding\s+round)\b/i,

  // Valuations, market sizing and revenue are the biggest source of false
  // positives: "$965B valuation", "$550 billion by 2035", "$250 billion IT industry".
  exclude: /\b(valuation|values?\s+\w+\s+at|valued\s+at|market|economy|gdp|industry|opportunity|projected|projects?\b|could\s+add|by\s+20[3-9]\d|revenue|ipo|m-?cap|size)\b/i,

  // Weekly and half-yearly roundups restate money already counted deal by deal.
  aggregate: /\b(startups?\s+(?:raise|secure|bag|net|garner|mop)|this\s+week|h[12]\s+20|q[1-4]\s+20|weekly|funding\s+and\s+acquisitions|top\s+\d+|round[-\s]?up|demo\s+day|targeting)\b/i,

  // A fund close is capital raised *to invest*, not capital raised by a company.
  fundVehicle: /\b(fund|corpus|floats|lp\b|late-stage\s+bets|for\s+ai\s+and)\b/i,

  // Investor-led headlines where the investor, not a company, is the subject.
  investorLed: /^\s*(accel|sequoia|peak\s*xv|blume|elevation|lightspeed|matrix|nexus|kalaari|chiratae|yournest|fundamentum|valleynxt|venture\s+catalysts|3one4|stellaris|prime\s+venture)\b/i,

  // Capitalised words too common to identify a company in the dedupe step.
  tokenStopwords: Object.freeze([
    'series', 'seed', 'round', 'fund', 'capital', 'ventures', 'partners', 'led',
    'startup', 'startups', 'platform', 'tech', 'the', 'new', 'with',
    'india', 'indian', 'ai', 'mn', 'bn', 'rs', 'cr', 'crore', 'million', 'billion',
  ]),
});

module.exports = Object.freeze({ CORPUS_START_DATE, FUNDING_CONFIG });
