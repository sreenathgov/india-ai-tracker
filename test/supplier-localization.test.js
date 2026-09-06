const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const localizationDir = path.join(root, 'data', 'supplier-programme', 'localization');
const manifest = require('../data/supplier-programme/localization/manifest.json');

test('publishes exactly five complete form languages and retains all scheduled preferences', () => {
  assert.deepEqual(manifest.fullFormLocales, ['en-IN','hi-IN','mr-IN','gu-IN','ta-IN']);
  assert.equal(manifest.locales.length, 23);
  assert.equal(manifest.locales.filter((entry) => entry.experience === 'full-form').length, 5);
  assert.equal(manifest.locales.filter((entry) => entry.experience === 'contact-flow').length, 18);
});

test('uses canonical identifiers and scripts for corrected scheduled languages', () => {
  const byCode = new Map(manifest.locales.map((entry) => [entry.languageCode, entry]));
  assert.equal(byCode.get('brx').localeCode, 'brx-IN');
  assert.equal(byCode.get('gom').localeCode, 'gom-IN');
  assert.equal(byCode.get('mni').localeCode, 'mni-Mtei-IN');
  assert.equal(byCode.get('mni').script, 'Meitei Mayek');
  assert.equal(byCode.get('sat').localeCode, 'sat-Olck-IN');
  assert.equal(byCode.get('ks').localeCode, 'ks-Arab-IN');
  assert.equal(byCode.get('sd').localeCode, 'sd-Arab-IN');
});

test('all published bundles carry approval, source and mandatory boundary copy', () => {
  for (const locale of manifest.fullFormLocales) {
    const bundle = require(path.join(localizationDir, 'locales', `${locale}.json`));
    assert.equal(bundle.publicationStatus, 'published', locale);
    assert.equal(bundle.localizationVersion, manifest.localizationVersion, locale);
    assert.ok(bundle.researchSource.driveFileId, locale);
    assert.match(bundle.message.lender_boundary_copy, /NBFC/i, locale);
    assert.match(bundle.message.submission_confirmation, /receipt/i, locale);
    assert.match(bundle.message.submission_confirmation, /eligibility/i, locale);
    assert.match(bundle.message.submission_confirmation, /approval/i, locale);
    assert.ok(bundle.form.consent, locale);
    assert.match(bundle.form.failure, /98402/);
    assert.match(bundle.form.failure, /WhatsApp/i);
  }
});

test('deterministic build validates sources and produces a browser bundle', () => {
  execFileSync(process.execPath, [path.join(root, 'scripts', 'build-supplier-locales.js')], { cwd: root });
  const output = fs.readFileSync(path.join(root, 'js', 'supplier-programme-locales.generated.js'), 'utf8');
  assert.match(output, /supplier-locales\.2026-09-05\.v1/);
  assert.match(output, /Available in English and 4 Indian languages/);
  assert.doesNotMatch(output, /Project Origin/i);
  assert.doesNotMatch(output, /\bFREE\b/);
});

test('form loads the generated bundle without browser storage or live translation', () => {
  const page = fs.readFileSync(path.join(root, 'supplier-programme.html'), 'utf8');
  const script = fs.readFileSync(path.join(root, 'js', 'supplier-programme.js'), 'utf8');
  assert.ok(page.indexOf('supplier-programme-locales.generated.js') < page.indexOf('supplier-programme.js'));
  assert.doesNotMatch(script, /localStorage|sessionStorage/);
  assert.doesNotMatch(script, /translate\.google|generativelanguage|gemini/i);
  assert.doesNotMatch(script, /const COPY\s*=/);
  assert.match(script, /consent:false/);
  assert.match(script, /supplier-programme-2026-09-v2/);
});
