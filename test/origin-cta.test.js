const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const homepage = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const styles = fs.readFileSync(path.join(root, 'css/origin-cta.css'), 'utf8');
const behaviour = fs.readFileSync(path.join(root, 'js/origin-cta.js'), 'utf8');

function applicationLink(content) {
  return `https://apply.kananlabs.in/?utm_source=kanan_homepage&amp;utm_medium=owned&amp;utm_campaign=supplier_programme&amp;utm_content=${content}`;
}

test('renders the approved Project Origin conversion act', () => {
  assert.match(homepage, /id="klOriginCta"/);
  assert.match(homepage, /SUPPLIER PROGRAMME · APPLICATIONS OPEN/);
  assert.match(homepage, /Do not let working capital hold back a real order\./);
  assert.match(homepage, /We help Indian manufacturers pursue working-capital finance\. The first 15 selected receive hands-on support at no charge\./);
  assert.doesNotMatch(homepage, /guaranteed financing|approval probability|Kanan underwriting|lender matching/i);
});

test('routes homepage conversion points to the canonical supplier subdomain with distinct attribution', () => {
  assert.ok(homepage.includes(applicationLink('hero') + '#apply'));
  assert.ok(homepage.includes(applicationLink('origin_cta') + '"'));
  assert.ok(homepage.includes(applicationLink('capability_reel') + '#apply'));
  assert.match(homepage, /data-supplier-programme-link/);
  assert.match(behaviour, /supplier-programme\.html/);
  assert.match(homepage, /href="#klOriginCta" class="kl-btn-secondary">See how it works<\/a>/);
});

test('removes the legacy homepage demo while retaining independent Origin assets', () => {
  assert.doesNotMatch(homepage, /class="kl-twdemo|tw-demo-clone\.(css|js)|Export with an AI agent you can audit|Explore TradeWatch/);
  assert.match(homepage, /css\/origin-cta\.css/);
  assert.match(homepage, /js\/origin-cta\.js/);
  assert.doesNotMatch(homepage, /id="origin-band-grid"|tradewatch-band-grid/);
  assert.ok(homepage.indexOf('id="klOriginCta"') < homepage.indexOf('class="kl-footer"'));
});

test('keeps the institution decision explicit and never depicts approval', () => {
  const start = homepage.indexOf('<section class="kl-origin-cta"');
  const end = homepage.indexOf('</section>', start);
  const section = homepage.slice(start, end);
  assert.match(section, /Institution decides/);
  assert.doesNotMatch(section, /approved|sanctioned|approval tick|✓|✔/i);
});

test('provides visibility-aware motion, reduced-motion fallback and a dedicated mobile composition', () => {
  assert.match(behaviour, /IntersectionObserver/);
  assert.match(behaviour, /visibilitychange/);
  assert.match(behaviour, /cycleMs = 13000/);
  assert.match(styles, /prefers-reduced-motion: reduce/);
  assert.match(homepage, /kl-origin-workflow__stage--desktop/);
  assert.match(homepage, /kl-origin-workflow__stage--mobile/);
  assert.match(styles, /\.kl-origin-workflow__stage--mobile\s*{\s*display: block/);
  assert.match(styles, /min-height: 52px/);
  assert.match(styles, /\.kl-origin-band \.kl-scope__cta-btn\s*{\s*min-height: 48px/);
});
