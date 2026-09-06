const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const integration = JSON.parse(fs.readFileSync(path.join(root, 'data/supplier-programme/integration/make-intake.v1.json'), 'utf8'));
const sample = JSON.parse(fs.readFileSync(path.join(root, 'data/supplier-programme/integration/sample-webhook-payload.v1.json'), 'utf8'));

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
