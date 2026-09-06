const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

function earlyAccess({ contactStatus = 201 } = {}) {
  const calls = [];
  const notifications = [];
  const context = {
    module: { exports: {} },
    process: { env: { BREVO_API_KEY: 'test-key', BREVO_EARLY_ACCESS_LIST_ID: '7' } },
    console: { error() {} },
    require(name) {
      if (name.endsWith('security')) {
        return {
          applyCors: () => true,
          validateRequest: () => true,
          rateLimit: () => true,
          checkHoneypot: () => false
        };
      }
      if (name.endsWith('provider-fetch')) return { providerFetch: (...args) => context.fetch(...args) };
      return { notifyMake: async (...args) => notifications.push(args) };
    },
    fetch: async (url, options) => {
      calls.push({ url, body: JSON.parse(options.body) });
      return { status: contactStatus, ok: contactStatus >= 200 && contactStatus < 300, json: async () => ({}) };
    }
  };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'api/early-access.js'), 'utf8'), context);
  return {
    calls,
    notifications,
    async send(overrides = {}) {
      const res = {
        status(code) { this.code = code; return this; },
        json(body) { this.body = body; return this; }
      };
      await context.module.exports({
        method: 'POST',
        body: {
          name: 'Test Person',
          email: 'test@example.com',
          company: 'Example Exporter',
          tradeNeeds: ['Supply chain analysis'],
          ...overrides
        }
      }, res);
      return res;
    }
  };
}

test('Sector Watch early access stores the selected need in list 7', async () => {
  const app = earlyAccess();
  const result = await app.send();
  assert.equal(result.code, 200);
  assert.equal(result.body.success, true);
  assert.deepEqual(app.calls[0].body.listIds, [7]);
  assert.equal(app.calls[0].body.attributes.CONTEXT, 'Supply chain analysis');
  assert.equal(app.notifications[0][0], 'early-access');
});

test('Sector Watch early access rejects missing or invented needs before Brevo', async () => {
  for (const tradeNeeds of [[], ['Invented need']]) {
    const app = earlyAccess();
    const result = await app.send({ tradeNeeds });
    assert.equal(result.code, 400);
    assert.equal(app.calls.length, 0);
  }
});

test('Sector Watch panel posts its mapped fields to the dedicated endpoint', () => {
  const source = fs.readFileSync(path.join(root, 'js/contact-panel.js'), 'utf8');
  assert.match(source, /fetch\('\/api\/early-access'/);
  assert.match(source, /name:\s*formData\.contactName/);
  assert.match(source, /company:\s*formData\.organisation/);
  assert.doesNotMatch(source, /fetch\('\/api\/consult'/);
});
