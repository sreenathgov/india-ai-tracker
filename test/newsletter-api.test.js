const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');

function newsletter(env = {}) {
  const calls = [];
  const notifications = [];
  const context = {
    module: { exports: {} },
    process: { env: { BREVO_API_KEY: 'test-key', BREVO_LIST_ID: '2', ...env } },
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
      return { status: url.endsWith('/contacts') ? 201 : 201, ok: true, json: async () => ({}) };
    }
  };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'api/subscribe.js'), 'utf8'), context);
  return {
    calls,
    notifications,
    async send() {
      const res = {
        status(code) { this.code = code; return this; },
        json(body) { this.body = body; return this; }
      };
      await context.module.exports({ method: 'POST', body: { email: 'reader@example.test' } }, res);
      return res;
    }
  };
}

test('newsletter acknowledgement uses the configured active template', async () => {
  const app = newsletter({ BREVO_NEWSLETTER_TEMPLATE_ID: '6' });
  const result = await app.send();
  assert.equal(result.code, 200);
  assert.deepEqual(app.calls[0].body.listIds, [2]);
  assert.equal(app.calls[1].body.templateId, 6);
  assert.equal(app.notifications[0][0], 'subscribe');
});

test('newsletter subscription remains durable when no acknowledgement template is configured', async () => {
  const app = newsletter();
  const result = await app.send();
  assert.equal(result.code, 200);
  assert.equal(app.calls.length, 1);
  assert.equal(app.notifications.length, 1);
});
