const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');

function consult({ contactStatus = 201, emailStatus = 201, emailThrows = false, limited = false } = {}) {
    const calls = [], notifications = [];
    const context = {
        module: { exports: {} },
        process: { env: { BREVO_API_KEY: 'test-key', BREVO_DEMO_TEMPLATE_ID: '99' } },
        console: { error() {} },
        require(name) {
            if (name.endsWith('security')) return { applyCors: () => true, validateRequest: () => true, rateLimit: () => !limited, checkHoneypot: body => Boolean(body.company_website) };
            if (name.endsWith('provider-fetch')) return {providerFetch:(...args)=>context.fetch(...args)};
            return { notifyMake: async (...args) => notifications.push(args) };
        },
        fetch: async (url, options) => {
            calls.push({ url, body: JSON.parse(options.body) });
            const isEmail = url.endsWith('/email');
            if (isEmail && emailThrows) throw new Error('Connection lost');
            const status = isEmail ? emailStatus : contactStatus;
            return { status, ok: status >= 200 && status < 300, json: async () => ({}) };
        }
    };
    vm.runInNewContext(fs.readFileSync(path.join(root, 'api/consult.js'), 'utf8'), context);
    return { calls, notifications, async send(overrides = {}) {
        const res = { status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
        await context.module.exports({ method: 'POST', body: { engagementType: 'Drona demo', contactName: 'Test Person', companyName: 'Example OEM', email: 'test@example.com', strategicContext: 'Supplier working capital', ...overrides } }, res);
        return res;
    } };
}

test('Drona demo saves contact in the consultations list and uses generic acknowledgement', async () => {
    const app = consult(); const result = await app.send();
    assert.equal(result.code, 200);
    assert.equal(result.body.success, true);
    assert.deepEqual(app.calls[0].body.listIds, [6]);
    assert.equal(app.calls[0].body.attributes.ENGAGEMENT_TYPE, 'Drona demo');
    assert.equal(app.calls[0].body.attributes.COMPANY, 'Example OEM');
    assert.equal(app.calls[1].body.templateId, 3);
    assert.equal(app.notifications[0][0], 'consult');
});
test('legacy TradeWatch requests retain dedicated acknowledgement routing', async () => {
    const app = consult(); await app.send({ engagementType: 'TradeWatch demo' });
    assert.equal(app.calls[1].body.templateId, 99);
});
test('failed contact storage does not acknowledge or report success', async () => {
    const app = consult({ contactStatus: 503 }); const result = await app.send();
    assert.equal(result.code, 502); assert.equal(app.calls.length, 1); assert.equal(app.notifications.length, 0);
});
for (const failure of [{ emailStatus: 503 }, { emailThrows: true }]) {
    test(`saved contact remains successful after acknowledgement failure ${JSON.stringify(failure)}`, async () => {
        const app = consult(failure); const result = await app.send();
        assert.equal(result.code, 200); assert.equal(result.body.success, true); assert.equal(app.notifications.length, 1);
    });
}
test('rate limiting and honeypot rejection never reach Brevo', async () => {
    const limited = consult({ limited: true }); assert.equal((await limited.send()).code, 429); assert.equal(limited.calls.length, 0);
    const bot = consult(); await bot.send({ company_website: 'spam' }); assert.equal(bot.calls.length, 0);
});

function browserForm(fetch) {
    const nodes = new Map(); let focused;
    function node(id) {
        if (!nodes.has(id)) nodes.set(id, { value: '', textContent: '', hidden: false, disabled: false, attrs: {}, listeners: {},
            setAttribute(k, v) { this.attrs[k] = v; }, removeAttribute(k) { delete this.attrs[k]; },
            addEventListener(k, fn) { this.listeners[k] = fn; }, focus() { focused = id; },
            querySelector: node
        });
        return nodes.get(id);
    }
    const document = { getElementById: node, querySelector: node };
    vm.runInNewContext(fs.readFileSync(path.join(root, 'js/request-demo.js'), 'utf8'), { document, fetch, AbortController, setTimeout, clearTimeout });
    node('demo-name').value = 'Test Person'; node('demo-email').value = 'test@example.com'; node('demo-company').value = 'Example OEM';
    return { node, focused: () => focused, submit: () => node('demoRequestForm').listeners.submit({ preventDefault() {} }) };
}
test('form prevents duplicate in-flight requests and only confirms accepted storage', async () => {
    let resolve, count = 0, payload;
    const app = browserForm((url, options) => { count++; payload = JSON.parse(options.body); return new Promise(r => { resolve = r; }); });
    const pending = app.submit(); await app.submit();
    assert.equal(count, 1); assert.equal(payload.engagementType, 'Drona demo');
    resolve({ ok: true, json: async () => ({ success: true }) }); await pending;
    assert.equal(app.node('demoRequestForm').hidden, true); assert.equal(app.focused(), 'demoSuccess');
});
test('form preserves data and permits retry after service failure or unexpected response', async () => {
    for (const response of [{ ok: false, status: 429, json: async () => ({}) }, { ok: true, json: async () => ({}) }]) {
        const app = browserForm(async () => response); await app.submit();
        assert.equal(app.node('demo-company').value, 'Example OEM'); assert.equal(app.node('demoRequestForm').hidden, false);
        assert.ok(app.node('demoSubmitError').textContent); assert.equal(app.node('.demo-submit').disabled, false);
    }
});
test('invalid fields are identified before any network request', async () => {
    const app = browserForm(() => { throw new Error('Must not submit'); }); app.node('demo-email').value = 'invalid'; await app.submit();
    assert.equal(app.node('demo-email').attrs['aria-invalid'], 'true'); assert.equal(app.focused(), 'demo-email');
});
