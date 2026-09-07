#!/usr/bin/env node
'use strict';

/**
 * Regenerates the tracker page's research showcase from the canonical store.
 *
 * The section used to be a hand-maintained weekly digest, which is why it went
 * eight months stale. Every number it now shows is derived here at build time:
 * the heading's month count, the four stat cards, and the byline. The four
 * insight cards stay hand-written — their figures are checked, never rewritten.
 *
 * Usage: node scripts/generate-research-stats.js [--check]
 *   --check  report what would change and exit non-zero, without writing
 */

const fs = require('fs');
const path = require('path');

const { CORPUS_START_DATE } = require('./research-stats/config');
const { loadCorpus } = require('./research-stats/load-corpus');
const { computeFigures } = require('./research-stats/compute');
const { extractRounds } = require('./research-stats/extract-funding');
const { buildPatch, checkDrift } = require('./research-stats/render');

const ROOT = path.join(__dirname, '..');
const INSIGHTS_PATH = path.join(ROOT, 'data', 'strategic_insights.json');
const TRACKER_PATH = path.join(ROOT, 'tracker.html');

const HEADING_RE = /(<h2 class="shiny-text" id="shinyText">)([\s\S]*?)(<\/h2>)/;
const SUBTITLE_RE = /(<p class="shiny-text-subtitle">)([\s\S]*?)(<\/p>)/;
const PAYLOAD_RE = /(<script type="application\/json" id="researchShowcaseData">)[\s\S]*?(<\/script>)/;

// These are the approved corpus-wide editorial cards, not a weekly digest.
// Reject an old file before patching stats could conceal its reverted prose.
function validateEditorialCards(cards) {
  const expected = ['Geography', 'Capital', 'Governance', 'Sources'];
  const insights = cards.filter((card) => card.type === 'insight');
  if (insights.length !== expected.length || insights.some((card, i) =>
    card.id !== `insight-${i + 1}` || card.metadata?.region !== expected[i]
    || !card.checks?.length)) {
    throw new Error('Research showcase editorial cards have reverted or lost their figure checks; restore the approved corpus-wide insights.');
  }
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    throw new Error(`Cannot read ${path.relative(ROOT, file)}: ${error.message}`);
  }
}

/** Applies generated values to the stat cards; insight cards pass through. */
function patchInsights(existing, patch) {
  validateEditorialCards(existing.cards);
  let statIndex = 0;
  const cards = existing.cards.map((card) => {
    if (card.type !== 'stat') return card;
    const stat = patch.stats[statIndex];
    statIndex += 1;
    if (!stat) return card;
    return { ...card, title: stat.title, value: stat.value, description: stat.description };
  });

  if (statIndex !== patch.stats.length) {
    throw new Error(`Expected ${patch.stats.length} stat cards in strategic_insights.json, found ${statIndex}`);
  }

  return {
    ...existing,
    lastUpdated: patch.computed.latestSignalDate,
    heading: patch.heading,
    subheading: patch.subheading,
    cards,
    computed: patch.computed,
  };
}

function patchTracker(html, patch, insights) {
  if (!HEADING_RE.test(html)) throw new Error('tracker.html: could not find <h2 id="shinyText">');
  if (!SUBTITLE_RE.test(html)) throw new Error('tracker.html: could not find .shiny-text-subtitle');
  if (!PAYLOAD_RE.test(html)) throw new Error('tracker.html: could not find #researchShowcaseData');
  // Escape '<' so editorial text cannot terminate the inert JSON script tag.
  const payload = JSON.stringify(insights).replace(/</g, '\\u003c');
  return html
    .replace(HEADING_RE, (_, open, __, close) => `${open}${escapeHtml(patch.heading)}${close}`)
    .replace(SUBTITLE_RE, (_, open, __, close) => `${open}${escapeHtml(patch.subheading)}${close}`)
    .replace(PAYLOAD_RE, (_, open, close) => `${open}${payload}${close}`);
}

function collectDrift(cards, figures, funding) {
  return cards.flatMap((card) => checkDrift(card.checks, figures, funding)
    .map((warning) => `  ${card.id}: ${warning}`));
}

function main() {
  const checkOnly = process.argv.includes('--check');

  const corpus = loadCorpus(ROOT);
  const figures = computeFigures(corpus);
  const funding = extractRounds(corpus.filter((a) => (a.date_published || '') >= CORPUS_START_DATE));
  const patch = buildPatch(figures, funding);

  const existing = readJson(INSIGHTS_PATH);
  const insights = patchInsights(existing, patch);
  const nextInsights = `${JSON.stringify(insights, null, 2)}\n`;
  const nextTracker = patchTracker(fs.readFileSync(TRACKER_PATH, 'utf8'), patch, insights);

  const drift = collectDrift(existing.cards, figures, funding);

  console.log(`research-stats: ${figures.totalSignals} signals · ${figures.monthsActive} months · `
    + `${funding.count} rounds · ${figures.policyCount} policy moves · ${figures.jurisdictionCount} jurisdictions`);
  console.log(`  heading  "${patch.heading}"`);
  console.log(`  byline   "${patch.subheading}"`);
  for (const stat of patch.stats) console.log(`  ${stat.value.padStart(7)}  ${stat.title}`);

  if (drift.length > 0) {
    console.warn('\nresearch-stats: insight prose cites figures that have moved —');
    for (const warning of drift) console.warn(warning);
    console.warn('  (prose is never rewritten automatically; edit data/strategic_insights.json)\n');
  }

  if (checkOnly) {
    const stale = nextInsights !== `${JSON.stringify(existing, null, 2)}\n`
      || nextTracker !== fs.readFileSync(TRACKER_PATH, 'utf8');
    if (stale) {
      console.error('research-stats: generated content is out of date — run npm run build:research-stats');
      process.exitCode = 1;
    }
    return;
  }

  fs.writeFileSync(INSIGHTS_PATH, nextInsights);
  fs.writeFileSync(TRACKER_PATH, nextTracker);
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(`research-stats: ${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = { patchInsights, patchTracker, validateEditorialCards };
