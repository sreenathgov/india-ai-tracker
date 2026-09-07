'use strict';

const { CORPUS_START_DATE } = require('./config');

/**
 * Turns a loaded corpus into the figures the tracker page publishes.
 * Pure: the corpus is read, never modified.
 */

const POLICY_CATEGORY = 'Policies and Initiatives';
const NATIONAL_CODE = 'IN';
const TOP_STATES = 4;
const TOP_SOURCES = 3;
const THIN_STATE_THRESHOLD = 15;

/** Records before the tracker launched are backfill, not collected signal. */
function sinceLaunch(corpus) {
  return corpus.filter((a) => (a.date_published || '') >= CORPUS_START_DATE);
}

function tally(values) {
  const counts = new Map();
  for (const value of values) counts.set(value, (counts.get(value) || 0) + 1);
  return counts;
}

function descending(counts) {
  return [...counts.entries()].sort((a, b) => (b[1] - a[1]) || a[0].localeCompare(b[0]));
}

function shareOfTop(counts, n) {
  const ranked = descending(counts);
  const total = ranked.reduce((sum, [, count]) => sum + count, 0);
  const top = ranked.slice(0, n).reduce((sum, [, count]) => sum + count, 0);
  return total === 0 ? 0 : top / total;
}

function monthOf(article) {
  return (article.date_published || '').slice(0, 7);
}

/**
 * @param {ReadonlyArray<object>} corpus
 * @returns {Readonly<object>} every figure the page or its prose can cite
 */
function computeFigures(corpus) {
  const articles = sinceLaunch(corpus);

  const months = tally(articles.map(monthOf).filter(Boolean));
  const sources = tally(articles.map((a) => a.source_name).filter(Boolean));
  const states = tally(articles.flatMap(
    (a) => (a.state_codes || []).filter((code) => code && code !== NATIONAL_CODE),
  ));

  const policies = articles.filter((a) => a.category === POLICY_CATEGORY);
  const policyMonths = descending(tally(policies.map(monthOf).filter(Boolean)));
  const policyMonthCounts = policyMonths.map(([, count]) => count);

  const orderedMonths = [...months.keys()].sort();
  const orderedDates = articles.map((a) => a.date_published || '').filter(Boolean).sort();

  return Object.freeze({
    totalSignals: articles.length,
    monthsActive: months.size,
    firstMonth: orderedMonths[0] || '',
    lastMonth: orderedMonths[orderedMonths.length - 1] || '',
    // "As of" the record, not the day the generator happened to run — so a
    // rebuild that changes nothing produces no diff.
    latestSignalDate: orderedDates[orderedDates.length - 1] || '',

    policyCount: policies.length,
    policyTopTwoMonthsShare: policies.length === 0
      ? 0
      : policyMonthCounts.slice(0, 2).reduce((sum, n) => sum + n, 0) / policies.length,
    policyQuietMonthCount: policyMonthCounts.length === 0
      ? 0
      : policyMonthCounts[policyMonthCounts.length - 1],

    sourceCount: sources.size,
    topSourceShare: shareOfTop(sources, TOP_SOURCES),
    topSources: Object.freeze(descending(sources).slice(0, TOP_SOURCES).map(([name]) => name)),

    jurisdictionCount: states.size,
    topStateShare: shareOfTop(states, TOP_STATES),
    topStates: Object.freeze(descending(states).slice(0, TOP_STATES).map(([code]) => code)),
    thinStateCount: [...states.values()].filter((count) => count < THIN_STATE_THRESHOLD).length,
  });
}

module.exports = { computeFigures, THIN_STATE_THRESHOLD, TOP_STATES, TOP_SOURCES };
