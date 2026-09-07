const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

// finalize.js (scripts/release/finalize.js) applies known, intentional transforms to every
// dist HTML file: it rewrites the ?v= query on css/js assets to a content hash for immutable
// caching, absolutizes same-site relative links to https://kananlabs.in/... (this page is
// served cross-subdomain on apply.kananlabs.in, where a relative link would resolve wrong),
// and injects a site-routes script tag if missing. Reverse those before comparing to source
// so this test still catches a genuinely stale (un-rebuilt) dist/ without fighting finalize.js.
function normalizeFinalizedHtml(html) {
  return html
    .replace(/(\.(?:css|js)\?v=)[0-9a-f]+/g, '$1HASH')
    .replace(/https:\/\/kananlabs\.in\//g, '/')
    .replace(/<script src="\/js\/site-routes\.js[^"]*" defer><\/script>\n/, '');
}

test('deployed supplier form matches its source HTML and CSS', () => {
  assert.equal(
    normalizeFinalizedHtml(read('dist/supplier-programme.html')),
    normalizeFinalizedHtml(read('supplier-programme.html')),
    'dist/supplier-programme.html is stale; run npm run build'
  );
  assert.equal(
    read('dist/css/supplier-programme.css'),
    read('css/supplier-programme.css'),
    'dist/css/supplier-programme.css is stale; run npm run build'
  );
  assert.equal(
    read('dist/js/supplier-programme.js'),
    read('js/supplier-programme.js'),
    'dist/js/supplier-programme.js is stale; run npm run build'
  );
  assert.equal(
    read('dist/js/prism-bg.js'),
    read('js/prism-bg.js'),
    'dist/js/prism-bg.js is stale; run npm run build'
  );
});

test('deployed supplier form links its versioned stylesheet', () => {
  const html = read('dist/supplier-programme.html');
  assert.match(html, /supplier-programme\.css\?v=[0-9a-f]+/);
});
