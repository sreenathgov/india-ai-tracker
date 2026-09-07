const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const {JSDOM} = require('jsdom');

test('production build ships the approved homepage composition and its dependencies', () => {
  const dom = new JSDOM(fs.readFileSync('dist/index.html', 'utf8'));
  try {
    const doc = dom.window.document;
    assert.ok(doc.body.classList.contains('kl-homepage'));
    for (const asset of ['css/homepage-mobile.css', 'js/homepage-motion.js', 'js/homepage.js']) {
      assert.ok(fs.existsSync('dist/' + asset), asset);
      assert.ok([...doc.querySelectorAll('[src],[href]')].some(el =>
        (el.getAttribute('src') || el.getAttribute('href')).includes(asset + '?v=')), asset);
    }
    assert.deepEqual([...doc.querySelectorAll('.kl-roadmap__mobile-summary h3')].map(el => el.textContent.trim()), [
      'Research and Development', 'Design Partnerships', 'Launch early 2027', 'Enabling Supply Chain Financing'
    ]);
    assert.match(doc.querySelector('#klManifestoReveal').textContent.replace(/\s+/g, ' '), /Kanan builds the intelligence layer that makes you resilient/);
    assert.equal(doc.querySelector('.kl-origin-workflow__stage--mobile .kl-origin-workflow__process-caption'), null);
    assert.equal([...doc.querySelectorAll('button')].filter(el => /Pause (video|animation|background)/.test(el.textContent)).length, 0);
  } finally { dom.window.close(); }
});
