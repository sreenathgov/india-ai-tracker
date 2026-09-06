const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
// Public schema only: real workbook identifiers and operational samples stay private.
const integration = JSON.parse(fs.readFileSync(path.join(root, 'data/supplier-programme/contracts/intake.v1.json'), 'utf8'));
const {validateApplication, enrichApplication, sheetRecord} = require('../api/_lib/supplier-programme');
const validated = validateApplication({schemaVersion:'supplier-programme.v2',applicationId:'KSP-20260906-CONTRACT',language:'en',workingCapital:'yes',purposes:['invoice_gap'],companyName:'Example Manufacturing',manufacturingDescription:'Test-only casting parts',state:'Tamil Nadu',city:'Chennai',fundingAmountInr:500000,orderStatus:'no_order',contactName:'Example contact',whatsapp:'9000000000',consent:true,consentVersion:'supplier-programme-2026-09-v2',source:{}});
assert.equal(validated.ok, true);
const sample = sheetRecord(enrichApplication(validated.data, new Date('2026-09-06T00:00:00Z')));

test('Make integration owns one ordered and duplicate-free Sheet schema', () => {
  assert.equal(integration.workbook.sheetName, 'Supplier Intake Raw');
  assert.equal(integration.workbook.headerRow, 1);
  assert.equal(integration.workbook.firstLiveRow, 2);
  const columns = integration.columns.map((entry) => entry.column);
  assert.equal(columns.length, 38);
  assert.equal(new Set(columns).size, columns.length);
  assert.deepEqual(columns.slice(7, 12), ['Language', 'Locale Code', 'Language Experience', 'Localization Version', 'Schema Version']);
  assert.deepEqual(columns.slice(-4), ['Reminder At', 'Reminder Sent At', 'Escalation At', 'Escalation Sent At']);
});

test('Make acknowledges only a completed durable write', () => {
  assert.equal(integration.webhookResponse.status, 200);
  assert.deepEqual(integration.webhookResponse.body, {ok:true, recorded:true});
});

test('sample webhook payload covers every automatic source path', () => {
  function read(source) {
    return source.split('.').reduce((value, key) => value?.[key], sample);
  }
  for (const entry of integration.columns) {
    if (!entry.source.includes('.') && ['constant','manual','automation'].includes(entry.source)) continue;
    assert.notEqual(read(entry.source), undefined, `${entry.column}: ${entry.source}`);
  }
});
