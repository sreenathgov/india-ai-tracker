const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SOURCE_DIR = path.join(ROOT, 'data', 'supplier-programme', 'localization');
const LOCALE_DIR = path.join(SOURCE_DIR, 'locales');
const OUTPUT = path.join(ROOT, 'js', 'supplier-programme-locales.generated.js');

const REQUIRED_FORM_KEYS = [
  'applicationTitle', 'availability', 'back', 'next', 'submit', 'required', 'invalidPhone',
  'choose', 'shortTitle', 'shortHelp', 'yes', 'no', 'purpose', 'ccod',
  'raw', 'production', 'order', 'invoice', 'other', 'machineryNote', 'company', 'manufacture',
  'manufactureHint', 'state', 'city', 'amount', 'amountHint', 'demand', 'po', 'release',
  'forecast', 'none', 'unsure', 'name', 'phone', 'phoneHint', 'consent', 'received',
  'receivedBody', 'otherReceived', 'otherBody', 'languageReceived', 'languageBody',
  'reference', 'failure', 'selectedReview', 'progressLabel', 'help', 'call', 'whatsapp',
  'close', 'sending', 'privacy', 'terms'
];

const REQUIRED_MESSAGE_KEYS = [
  'risk_diagnostic_title', 'risk_diagnostic_body', 'risk_scope_note', 'lender_boundary_copy',
  'privacy_microcopy', 'submission_confirmation', 'terms_retained_in_english'
];

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function fail(message) {
  throw new Error(`Supplier localization build failed: ${message}`);
}

function requireText(object, key, locale, allowEmpty = false) {
  if (typeof object[key] !== 'string' || (!allowEmpty && !object[key].trim())) {
    fail(`${locale} is missing ${key}`);
  }
}

function assertNoUnsafeClaims(locale, bundle) {
  const content = JSON.stringify(bundle);
  const prohibited = [
    [/\bFREE\b/, 'headline-style FREE claim'],
    [/Project Origin/i, 'public Project Origin reference'],
    [/guaranteed approval/i, 'guaranteed approval claim'],
    [/instant (?:risk|credit|loan)/i, 'instant assessment claim'],
    [/accepted by (?:banks|financiers)/i, 'lender-acceptance claim'],
    [/\b(?:bankable|creditworthy)\b/i, 'bankability classification']
  ];
  for (const [pattern, label] of prohibited) {
    if (pattern.test(content)) fail(`${locale} contains a prohibited ${label}`);
  }
}

function validateBundle(locale, bundle, manifest, approval) {
  if (bundle.locale !== locale) fail(`${locale} bundle has a mismatched locale code`);
  if (bundle.localizationVersion !== manifest.localizationVersion) fail(`${locale} has a stale localization version`);
  if (bundle.publicationStatus !== 'published') fail(`${locale} is not marked published`);
  if (!approval.approvedLocales.includes(locale)) fail(`${locale} is not present in the approval record`);
  if (!bundle.researchSource?.driveFileId || !bundle.researchSource?.glossaryVersion) fail(`${locale} lacks source metadata`);
  for (const key of REQUIRED_FORM_KEYS) requireText(bundle.form, key, locale);
  if (!Array.isArray(bundle.form.titles) || bundle.form.titles.length !== 6) fail(`${locale} must have six question titles`);
  if (!Array.isArray(bundle.form.ctx) || bundle.form.ctx.length !== 6) fail(`${locale} must have six context records`);
  for (const [index, context] of bundle.form.ctx.entries()) {
    if (!Array.isArray(context) || typeof context[0] !== 'string' || !context[0].trim() || typeof context[1] !== 'string') {
      fail(`${locale} has an invalid context record at index ${index}`);
    }
  }
  for (const key of REQUIRED_MESSAGE_KEYS) {
    if (key === 'terms_retained_in_english') {
      if (!Array.isArray(bundle.message[key]) || !bundle.message[key].includes('working capital')) fail(`${locale} lacks the governed terminology list`);
    } else requireText(bundle.message, key, locale);
  }
  const boundary = bundle.message.lender_boundary_copy;
  const boundaryComplete = locale === 'en-IN'
    ? /bank|NBFC/i.test(boundary) && /guarantee/i.test(boundary) && /institution/i.test(boundary)
    : /bank/i.test(boundary) && /NBFC/i.test(boundary) && /financial institution/i.test(boundary) && /loan|credit|finance/i.test(boundary);
  if (!boundaryComplete) {
    fail(`${locale} lender boundary is incomplete`);
  }
  if (!/receipt/i.test(bundle.message.submission_confirmation) || !/eligibility/i.test(bundle.message.submission_confirmation) || !/approval/i.test(bundle.message.submission_confirmation)) {
    fail(`${locale} receipt confirmation is incomplete`);
  }
  assertNoUnsafeClaims(locale, bundle);
}

function build() {
  const manifest = readJson(path.join(SOURCE_DIR, 'manifest.json'));
  const approval = readJson(path.join(SOURCE_DIR, 'approval-record.json'));
  const expected = ['en-IN', 'hi-IN', 'mr-IN', 'gu-IN', 'ta-IN'];
  if (JSON.stringify(manifest.fullFormLocales) !== JSON.stringify(expected)) fail('published locale order or scope changed');
  if (approval.localizationVersion !== manifest.localizationVersion) fail('approval record version does not match the manifest');
  if (approval.reviewerIdentities !== 'Not supplied; no identities have been inferred or invented.') fail('reviewer identity control changed');
  if (!Array.isArray(manifest.locales) || manifest.locales.length !== 23) fail('language registry must contain English plus all 22 scheduled languages');

  const seenCodes = new Set();
  const seenLocales = new Set();
  for (const entry of manifest.locales) {
    if (seenCodes.has(entry.languageCode) || seenLocales.has(entry.localeCode)) fail('language registry contains duplicate identifiers');
    seenCodes.add(entry.languageCode);
    seenLocales.add(entry.localeCode);
    if (!entry.languageNameNative || !entry.script || entry.direction !== 'ltr') fail(`${entry.localeCode} has incomplete script metadata`);
    const shouldBeFull = expected.includes(entry.localeCode);
    if ((entry.experience === 'full-form') !== shouldBeFull) fail(`${entry.localeCode} has an invalid experience classification`);
  }

  const bundles = {};
  for (const locale of expected) {
    const bundle = readJson(path.join(LOCALE_DIR, `${locale}.json`));
    validateBundle(locale, bundle, manifest, approval);
    // Public copy only. Provenance and approval metadata stay build-side.
    bundles[locale] = {form:bundle.form, message:bundle.message};
  }

  const browserRegistry = {
    schemaVersion: manifest.schemaVersion,
    localizationVersion: manifest.localizationVersion,
    availabilityClaim: manifest.availabilityClaim,
    fullFormLocales: manifest.fullFormLocales,
    languages: manifest.locales.map(({languageCode, localeCode, languageNameEnglish, languageNameNative, script, direction, experience}) => ({
      languageCode, localeCode, languageNameEnglish, languageNameNative, script, direction, experience
    })),
    bundles
  };
  const output = `/* Generated by scripts/build-supplier-locales.js. Do not edit directly. */\nwindow.KANAN_SUPPLIER_LOCALIZATION = ${JSON.stringify(browserRegistry)};\n`;
  fs.writeFileSync(OUTPUT, output, 'utf8');
  console.log(`✓ Validated ${expected.length} published supplier-form locales`);
  console.log(`✓ Generated ${path.relative(ROOT, OUTPUT)} (${Buffer.byteLength(output).toLocaleString('en-IN')} bytes)`);
}

build();
