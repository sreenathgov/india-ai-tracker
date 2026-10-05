const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');

function app({ contactStatus = 201, env = {}, providerThrows = false } = {}) {
  const calls = [];
  const notifications = [];
  const context = {
    module: { exports: {} },
    process: { env: { BREVO_API_KEY: 'test-key', BREVO_REPORT_ACCESS_LIST_ID: '13', ...env } },
    console: { error() {} },
    Date,
    require(name) {
      if (name.endsWith('security')) return {
        applyCors: () => true,
        validateRequest: () => true,
        rateLimit: () => true,
        checkHoneypot: () => false
      };
      if (name.endsWith('provider-fetch')) return { providerFetch: (...args) => context.fetch(...args) };
      if (name.endsWith('notify')) return { notifyMake: async (...args) => notifications.push(args) };
      if (name.endsWith('resources-extra.json')) return { items: [{
        slug: 'weaponised-containers-hormuz-shipping-crisis',
        bucket: 'whitepaper',
        title: 'Weaponised Containers Could Trigger the Next Hormuz Shipping Crisis',
        access: { mode: 'lead-gate' }
      }] };
      throw new Error(`Unexpected require: ${name}`);
    },
    fetch: async (url, options) => {
      if (providerThrows) throw new Error('provider unavailable');
      calls.push({ url, body: JSON.parse(options.body) });
      return { status: contactStatus, ok: contactStatus >= 200 && contactStatus < 300, json: async () => ({ code: 'fixture' }) };
    }
  };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'api/report-access.js'), 'utf8'), context);
  return {
    calls,
    notifications,
    async send(overrides = {}) {
      const res = {
        status(code) { this.code = code; return this; },
        json(body) { this.body = body; return this; },
        end() { this.ended = true; return this; }
      };
      await context.module.exports({
        method: 'POST',
        body: {
          name: 'Test Person',
          email: 'Reader@Example.com',
          reportSlug: 'weaponised-containers-hormuz-shipping-crisis',
          ...overrides
        }
      }, res);
      return res;
    }
  };
}

test('report access stores the named request in the dedicated Brevo list', async () => {
  const subject = app();
  const result = await subject.send();
  assert.equal(result.code, 200);
  assert.equal(result.body.success, true);
  assert.equal(subject.calls[0].body.email, 'reader@example.com');
  assert.deepEqual(subject.calls[0].body.listIds, [13]);
  assert.equal(subject.calls[0].body.attributes.FIRSTNAME, 'Test');
  assert.equal(subject.calls[0].body.attributes.LASTNAME, 'Person');
  assert.match(subject.calls[0].body.attributes.CONTEXT, /Weaponised Containers/);
  assert.equal(subject.notifications[0][0], 'report-access');
});

test('report access rejects invalid fields and unknown reports before Brevo', async () => {
  for (const overrides of [
    { name: '' },
    { email: 'not-an-email' },
    { reportSlug: 'invented-report' }
  ]) {
    const subject = app();
    const result = await subject.send(overrides);
    assert.equal(result.code, 400);
    assert.equal(subject.calls.length, 0);
  }
});

test('report access accepts Brevo updates and fails closed on provider errors', async () => {
  assert.equal((await app({ contactStatus: 204 }).send()).code, 200);
  assert.equal((await app({ contactStatus: 503 }).send()).code, 502);
  assert.equal((await app({ providerThrows: true }).send()).code, 500);
  assert.equal((await app({ env: { BREVO_REPORT_ACCESS_LIST_ID: '' } }).send()).code, 500);
});
