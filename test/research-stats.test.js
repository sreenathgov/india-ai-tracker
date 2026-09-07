'use strict';

const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');

const { loadCorpus } = require('../scripts/research-stats/load-corpus');
const { extractRounds, isRoundTitle, parseAmounts } = require('../scripts/research-stats/extract-funding');
const { computeFigures } = require('../scripts/research-stats/compute');
const { numberToWord, formatCompactUsd, formatCount, buildPatch, checkDrift } = require('../scripts/research-stats/render');

const FIXTURE_ROOT = path.join(__dirname, 'fixtures', 'research-stats');
const corpus = loadCorpus(FIXTURE_ROOT);

const fs = require('node:fs');
const vm = require('node:vm');
const { patchInsights, patchTracker } = require('../scripts/generate-research-stats');
const approved = require('../data/strategic_insights.json');

test('weekly content cannot silently replace the approved research showcase at build time', () => {
  const reverted = JSON.parse(JSON.stringify(approved));
  reverted.cards[4] = { id: 'insight-1', type: 'insight', title: 'The Vernacular Voice Boom',
    metadata: { region: 'Consumer AI' } };
  assert.throws(() => patchInsights(reverted, buildPatch(computeFigures(corpus), extractRounds(corpus))),
    /editorial cards have reverted/);
});

test('regeneration updates the heading and embedded snapshot together, preserving editorial prose', () => {
  const patch = buildPatch(computeFigures(corpus), extractRounds(corpus));
  const next = patchInsights(approved, patch);
  const template = fs.readFileSync(path.join(__dirname, '../tracker.html'), 'utf8');
  const html = patchTracker(template, patch, next);
  const embedded = JSON.parse(html.match(/id="researchShowcaseData">([\s\S]*?)<\/script>/)[1]);
  assert.deepStrictEqual(embedded, next);
  assert.ok(html.includes(patch.subheading));
  assert.deepStrictEqual(next.cards.filter(c => c.type === 'insight'), approved.cards.filter(c => c.type === 'insight'));
  assert.strictEqual(patchTracker(html, patch, next), html, 'generation is idempotent');
});

test('embedded editorial text cannot break out of its JSON script element', () => {
  const patch = buildPatch(computeFigures(corpus), extractRounds(corpus));
  const next = patchInsights(approved, patch);
  next.newsletter = { title: '</script><script>alert(1)</script>' };
  const html = patchTracker(fs.readFileSync(path.join(__dirname, '../tracker.html'), 'utf8'), patch, next);
  const payload = html.match(/id="researchShowcaseData">([\s\S]*?)<\/script>/)[1];
  assert.ok(!payload.includes('<'));
  assert.deepStrictEqual(JSON.parse(payload), next);
});

test('browser loads approved cards from the page without requesting a stale weekly JSON file', async () => {
  const html = fs.readFileSync(path.join(__dirname, '../tracker.html'), 'utf8');
  const payload = html.match(/id="researchShowcaseData">([\s\S]*?)<\/script>/)[1];
  assert.deepStrictEqual(JSON.parse(payload), approved);
  const sandbox = {
    document: { addEventListener() {}, getElementById: id => id === 'researchShowcaseData' ? { textContent: payload } : null },
    fetch() { throw new Error('Separate content request would reintroduce version skew'); }
  };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/strategic-insights.js'), 'utf8')
    + '\nthis.showcase = new StrategicInsights();', sandbox);
  const data = await sandbox.showcase.loadData();
  assert.deepStrictEqual(JSON.parse(JSON.stringify(data)), approved);
});

/* ---------------------------------------------------------------- loader */

test('loadCorpus reads both API tiers and dedupes by url', () => {
  assert.strictEqual(corpus.length, 23);
  const urls = corpus.map((a) => a.url);
  assert.strictEqual(new Set(urls).size, urls.length, 'urls must be unique');
});

test('loadCorpus returns frozen records that callers cannot mutate', () => {
  assert.ok(Object.isFrozen(corpus));
  assert.throws(() => { corpus[0].title = 'clobbered'; }, TypeError);
});

test('loadCorpus throws on a missing store rather than yielding zero', () => {
  assert.throws(() => loadCorpus(path.join(__dirname, 'fixtures', 'does-not-exist')), /national tier/i);
});

test('loadCorpus throws on a malformed store rather than yielding zero', () => {
  assert.throws(() => loadCorpus(path.join(FIXTURE_ROOT, 'api', 'all-india')), /national tier/i);
});

/* ------------------------------------------------------- amount parsing */

test('parseAmounts converts USD magnitudes', () => {
  assert.deepStrictEqual(parseAmounts('raises $45 Mn in Series B'), [45e6]);
  assert.deepStrictEqual(parseAmounts('raises $1.2 billion'), [1.2e9]);
  assert.deepStrictEqual(parseAmounts('raises $130M Series C'), [130e6]);
});

test('parseAmounts converts INR crore at the configured rate', () => {
  const [usd] = parseAmounts('raises Rs 387 Cr in funding round');
  assert.ok(Math.abs(usd - (387e7 / 88)) < 1, `got ${usd}`);
});

test('parseAmounts handles thousands separators', () => {
  const [usd] = parseAmounts('raises Rs 1,800 Cr');
  assert.ok(Math.abs(usd - (1800e7 / 88)) < 1, `got ${usd}`);
});

/* ------------------------------------------------- round classification */

test('isRoundTitle accepts genuine disclosed rounds', () => {
  assert.ok(isRoundTitle('Blacksmith raises $45 Mn in Series B led by Peak XV'));
  assert.ok(isRoundTitle('Wealthtech platform Veriqus raises Rs 387 Cr in funding round led by Norwest'));
  assert.ok(isRoundTitle('Agentic AI platform Vibrium raises $1 Mn in seed round'));
});

test('isRoundTitle rejects valuations', () => {
  assert.ok(!isRoundTitle('Anthropic hits $965B valuation; AI complexity plagues Indian companies'));
  assert.ok(!isRoundTitle('Blackstone Confirms Investment in Neysa, Values Startup at $300 million'));
});

test('isRoundTitle rejects market-size projections', () => {
  assert.ok(!isRoundTitle("AI could add $550 billion to India's economy by 2035"));
  assert.ok(!isRoundTitle('PwC India report projects AI to unlock USD 550 billion across five sectors by 2035'));
});

test('isRoundTitle rejects industry-size figures', () => {
  assert.ok(!isRoundTitle('Is AI rewriting the rules for $250 billion Indian IT industry?'));
});

test('isRoundTitle rejects aggregate roundups', () => {
  assert.ok(!isRoundTitle('Indian startups raise $7.4 Bn in H1 2026 as CRED-Meta deal lifts funding'));
  assert.ok(!isRoundTitle('Funding and acquisitions in Indian startups this week [July 06 - July 11]'));
});

test('isRoundTitle rejects VC fund formation, which is not a company round', () => {
  assert.ok(!isRoundTitle('Accel raises $5 Bn for AI and late-stage bets'));
  assert.ok(!isRoundTitle('YourNest Venture Capital raises Rs 400 Cr for Continuum Fund'));
  assert.ok(!isRoundTitle('ValleyNXT Ventures floats Rs 400 Cr fund to back seed- to pre-Series A startups'));
});

test('isRoundTitle rejects titles with no raise verb at all', () => {
  assert.ok(!isRoundTitle('India eyes investments worth $200 billion in data centres: minister'));
});

/* ------------------------------------------------------------ extraction */

test('extractRounds keeps only real rounds from the fixture corpus', () => {
  const { rounds, count, totalUsd } = extractRounds(corpus);
  assert.strictEqual(count, 5, rounds.map((r) => r.title).join('\n'));
  const expected = 130e6 + 45e6 + (387e7 / 88) + 30e6 + 30e6;
  assert.ok(Math.abs(totalUsd - expected) < 1, `got ${totalUsd}, expected ${expected}`);
});

test('extractRounds de-duplicates one deal reported by two outlets', () => {
  const { rounds } = extractRounds(corpus);
  const emergent = rounds.filter((r) => /Emergent/.test(r.title));
  assert.strictEqual(emergent.length, 1);
});

test('extractRounds merges one deal filed in two currencies', () => {
  // Plum Insurance, reported as both "Rs 193 Cr" and "$20.5 Mn" — 7% apart at
  // our nominal rate, so only the shared names identify it as one round.
  const { rounds } = extractRounds([
    { url: 'a', title: 'Plum Insurance raises Rs 193 Cr in Series B round led by Peak XV Partners', date_published: '2026-05-02' },
    { url: 'b', title: 'Plum Insurance raises $20.5 Mn in Series B round led by Peak XV', date_published: '2026-05-03' },
  ]);
  assert.strictEqual(rounds.length, 1, 'one deal, two filings');
});

test('extractRounds merges a round with its own extension', () => {
  const { rounds } = extractRounds([
    { url: 'a', title: 'Semiconductor startup C2i Semiconductors raises $15 Mn led by Peak XV', date_published: '2026-04-01' },
    { url: 'b', title: 'C2i Semiconductors extends Series A round to $16.7 Mn with backing from TDK Ventures', date_published: '2026-06-01' },
  ]);
  assert.strictEqual(rounds.length, 1);
  assert.ok(Math.abs(rounds[0].amountUsd - 16.7e6) < 1, 'the fuller figure survives');
});

test('extractRounds matches a mixed-case company name a leading-capital rule would miss', () => {
  const { rounds } = extractRounds([
    { url: 'a', title: 'Oncology startup 4baseCare closes Rs 128 Cr Series B round', date_published: '2026-03-01' },
    { url: 'b', title: 'Infosys-backed precision oncology startup 4baseCare raises Rs 128 Cr', date_published: '2026-03-02' },
  ]);
  assert.strictEqual(rounds.length, 1);
});

test('isRoundTitle rejects a multi-company roundup whatever verb it uses', () => {
  assert.strictEqual(isRoundTitle("Invention Engine's four portfolio startups secure $2.5 Mn"), false);
  assert.strictEqual(isRoundTitle('Indian startups raise $7.4 Bn in H1 2026'), false);
});

test('extractRounds keeps two distinct deals that share an amount', () => {
  const { rounds } = extractRounds(corpus);
  const thirties = rounds.filter((r) => r.amountUsd === 30e6);
  assert.strictEqual(thirties.length, 2, 'Equal AI and Innefu Labs are different companies');
});

test('extractRounds reports median and largest-round share', () => {
  const { medianRoundUsd, largestRoundShare, largestRoundTitle } = extractRounds(corpus);
  assert.ok(Math.abs(medianRoundUsd - (387e7 / 88)) < 1);
  assert.ok(largestRoundShare > 0.46 && largestRoundShare < 0.47, `got ${largestRoundShare}`);
  assert.match(largestRoundTitle, /Emergent/);
});

/* --------------------------------------------------------------- compute */

test('computeFigures tallies the corpus inventory', () => {
  const f = computeFigures(corpus);
  assert.strictEqual(f.totalSignals, 23);
  assert.strictEqual(f.policyCount, 4);
  assert.strictEqual(f.sourceCount, 6);
  assert.strictEqual(f.jurisdictionCount, 6, 'empty scaffold states must not count');
  assert.strictEqual(f.monthsActive, 8, '2026-01 through 2026-08 inclusive');
});

test('computeFigures derives concentration shares', () => {
  const f = computeFigures(corpus);
  assert.ok(Math.abs(f.topStateShare - 7 / 9) < 1e-9, `got ${f.topStateShare}`);
  assert.ok(Math.abs(f.topSourceShare - 17 / 23) < 1e-9, `got ${f.topSourceShare}`);
  assert.deepStrictEqual(f.topStates.slice(0, 2), ['KA', 'DL']);
});

test('computeFigures excludes pre-launch backfill from the signal count', () => {
  const withBackfill = Object.freeze([
    ...corpus,
    Object.freeze({ url: 'https://example.test/old', title: 'Old', date_published: '2024-04-01',
      source_name: 'Alpha Wire', category: 'Events', state_codes: ['IN'] }),
  ]);
  assert.strictEqual(computeFigures(withBackfill).totalSignals, 23);
});

/* ---------------------------------------------------------------- render */

test('numberToWord spells the month count', () => {
  assert.strictEqual(numberToWord(8), 'EIGHT');
  assert.strictEqual(numberToWord(12), 'TWELVE');
  assert.strictEqual(numberToWord(21), 'TWENTY-ONE');
});

test('formatCompactUsd rounds down so the figure is never overstated', () => {
  assert.strictEqual(formatCompactUsd(2481193182), '$2.4B');
  assert.strictEqual(formatCompactUsd(2999999999), '$2.9B');
  assert.strictEqual(formatCompactUsd(278977272), '$278M');
});

test('formatCount groups thousands', () => {
  assert.strictEqual(formatCount(1949), '1,949');
  assert.strictEqual(formatCount(29), '29');
});

test('buildPatch produces heading, byline and four stat cards', () => {
  const patch = buildPatch(computeFigures(corpus), extractRounds(corpus));
  assert.strictEqual(patch.heading, 'EIGHT MONTHS OF SIGNAL');
  assert.match(patch.subheading, /23 of them/);
  assert.strictEqual(patch.stats.length, 4);
  assert.strictEqual(patch.stats[1].value, '23');
  assert.strictEqual(patch.stats[2].value, '4');
  assert.strictEqual(patch.stats[3].value, '6');
  assert.match(patch.stats[0].description, /5 disclosed rounds/);
});

/* ----------------------------------------------------------- drift guard */

test('checkDrift stays silent while prose figures still hold', () => {
  const figures = computeFigures(corpus);
  const checks = [{ figure: 'policyCount', expected: 4 }];
  assert.deepStrictEqual(checkDrift(checks, figures, extractRounds(corpus)), []);
});

test('checkDrift names every prose figure that has moved', () => {
  const figures = computeFigures(corpus);
  const checks = [
    { figure: 'policyCount', expected: 165 },
    { figure: 'topStateShare', expected: 0.6, tolerance: 0.02 },
  ];
  const warnings = checkDrift(checks, figures, extractRounds(corpus));
  assert.strictEqual(warnings.length, 2);
  assert.match(warnings[0], /policyCount/);
});

test('checkDrift rejects a check naming an unknown figure', () => {
  assert.throws(
    () => checkDrift([{ figure: 'nope', expected: 1 }], computeFigures(corpus), extractRounds(corpus)),
    /unknown figure/i,
  );
});
