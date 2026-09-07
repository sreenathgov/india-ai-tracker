const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

test('deployed supplier form matches its source HTML and CSS', () => {
  assert.equal(
    read('dist/supplier-programme.html'),
    read('supplier-programme.html'),
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

test('deployed mobile form reserves space above actions and wraps its header label', () => {
  const html = read('dist/supplier-programme.html');
  const css = read('dist/css/supplier-programme.css');

  assert.match(html, /supplier-programme\.css\?v=11/);
  assert.match(css, /\.sp-form-screen\s*\{[\s\S]*?padding-bottom:\s*clamp\(2\.25rem,\s*7vh,\s*3rem\)/);
  assert.match(css, /\.sp-application-header\s*\{[\s\S]*?grid-template-columns:\s*auto minmax\(0,\s*1fr\) auto/);
  assert.match(css, /\.sp-application-header p\s*\{[\s\S]*?text-wrap:\s*balance/);
});
