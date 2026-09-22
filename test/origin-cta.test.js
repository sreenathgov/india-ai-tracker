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

test('renders the production-reliability conversion act', () => {
  assert.match(homepage, /id="klOriginCta"/);
  assert.match(homepage, /DESIGN PARTNERSHIPS · MAKE-TO-ORDER MANUFACTURERS/);
  assert.match(homepage, /Start with one consequential production order\./);
  assert.match(homepage, /Kanan works with manufacturers to examine the critical components, suppliers and dependencies/);
  assert.match(homepage, /The lender retains the decision\./);
  assert.doesNotMatch(homepage, /guaranteed financing|approval probability|Kanan underwriting|lender matching/i);
});

test('routes production-reliability conversion points to an order discussion', () => {
  assert.match(homepage, /href="request-demo\.html\?utm_source=kanan_homepage&amp;utm_medium=owned&amp;utm_campaign=production_reliability&amp;utm_content=hero"/);
  assert.match(homepage, /<span>Request Demo<\/span>/);
  assert.match(homepage, /class="kl-origin-cta__button" href="supplier-programme\.html"/);
  assert.match(homepage, /<span>Discuss an order<\/span>/);
  assert.match(homepage, /class="kl-origin-cta__drona-link" href="drona\.html">Explore Drona<\/a>/);
  assert.match(homepage, /class="kl-scope__cta-btn"[\s\S]*?Explore Drona/);
  assert.match(behaviour, /supplier-programme\.html/);
  assert.match(homepage, /href="drona\.html" class="kl-btn-secondary">Explore Drona<\/a>/);
});

test('removes the legacy homepage demo while retaining independent Origin assets', () => {
  assert.doesNotMatch(homepage, /class="kl-twdemo|tw-demo-clone\.(css|js)|Export with an AI agent you can audit|Explore TradeWatch/);
  assert.match(homepage, /css\/origin-cta\.css/);
  assert.match(homepage, /js\/origin-cta\.js/);
  assert.doesNotMatch(homepage, /id="origin-band-grid"|tradewatch-band-grid/);
  assert.ok(homepage.indexOf('id="klOriginCta"') < homepage.indexOf('class="kl-footer"'));
});

test('keeps financier authority explicit and never depicts approval', () => {
  const start = homepage.indexOf('<section class="kl-origin-cta"');
  const end = homepage.indexOf('</section>', start);
  const section = homepage.slice(start, end);
  assert.match(homepage, /The lender retains the decision\./);
  assert.match(homepage, /The financier retains credit authority\./);
  assert.doesNotMatch(homepage, /guaranteed financing|approval probability|Kanan underwriting|lender matching/i);
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
