const test = require('node:test');
const assert = require('node:assert/strict');
const handler = require('../api/supplier-programme');

function application(overrides = {}) {
  return {
    applicationId: 'KSP-20260904-ZYX98765',
    language: 'en',
    workingCapital: 'yes',
    purposes: ['raw_materials'],
    companyName: 'Test Precision Works',
    manufacturingDescription: 'Precision machined components',
    state: 'Tamil Nadu',
    city: 'Chennai',
    fundingAmountInr: 5000000,
    orderStatus: 'confirmed_po',
    contactName: 'Test Applicant',
    whatsapp: '9840247729',
    consent: true,
    consentVersion: 'supplier-programme-2026-09-v2',
    schemaVersion: 'supplier-programme.v2',
    ...overrides
  };
}

function request(body, ip) {
  return {
    method: 'POST',
    body,
    headers: {
      origin: 'https://apply.kananlabs.in',
      'x-forwarded-for': ip
    },
    socket: {}
  };
}

function response() {
  return {
    headers: {},
    statusCode: 200,
    payload: null,
    setHeader(name, value) { this.headers[name] = value; },
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.payload = payload; return this; },
    end() { return this; }
  };
}

async function withDeliveryEnvironment(values, run) {
  const original = {
    fetch: global.fetch,
    make: process.env.ORIGIN_MAKE_WEBHOOK_URL,
    makeApiKey: process.env.ORIGIN_MAKE_WEBHOOK_API_KEY,
    brevo: process.env.BREVO_API_KEY
  };
  process.env.ORIGIN_MAKE_WEBHOOK_URL = values.make || '';
  process.env.ORIGIN_MAKE_WEBHOOK_API_KEY = values.makeApiKey === undefined ? 'fixture-auth-key' : values.makeApiKey;
  process.env.BREVO_API_KEY = values.brevo || '';
  global.fetch = values.fetch;
  try { return await run(); }
  finally {
    global.fetch = original.fetch;
    if (original.make === undefined) delete process.env.ORIGIN_MAKE_WEBHOOK_URL;
    else process.env.ORIGIN_MAKE_WEBHOOK_URL = original.make;
    if (original.makeApiKey === undefined) delete process.env.ORIGIN_MAKE_WEBHOOK_API_KEY;
    else process.env.ORIGIN_MAKE_WEBHOOK_API_KEY = original.makeApiKey;
    if (original.brevo === undefined) delete process.env.BREVO_API_KEY;
    else process.env.BREVO_API_KEY = original.brevo;
  }
}

test('accepts the application when Make succeeds', async () => {
  const calls = [];
  const res = response();
  await withDeliveryEnvironment({
    make: 'https://hook.example.test/origin',
    makeApiKey: 'make-secret',
    fetch: async (url, options) => { calls.push({url, options}); return {ok: true, status: 200, json: async () => ({ok:true, recorded:true})}; }
  }, () => handler(request(application(), '198.51.100.10'), res));

  assert.equal(res.statusCode, 200);
  assert.equal(res.payload.success, true);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://hook.example.test/origin');
  assert.equal(calls[0].options.headers['X-Make-Apikey'], 'make-secret');
});

test('a duplicate receipt retains the original stored response deadline', async () => {
  const res = response();
  const deadline = '2026-09-07T08:00:00.000Z';
  await withDeliveryEnvironment({
    make: 'https://hook.example.test/origin',
    fetch: async () => ({ok:true,status:200,json:async()=>({ok:true,recorded:true,duplicate:true,responseDueAt:deadline})})
  }, () => handler(request(application(), '198.51.100.90'), res));
  assert.equal(res.statusCode, 200);
  assert.equal(res.payload.responseDueAt, deadline);
});

test('delivers one complete v2 application in each published language', async () => {
  const languages = ['en','hi','mr','gu','ta'];
  let delivered = 0;
  await withDeliveryEnvironment({
    make: 'https://hook.example.test/origin',
    fetch: async () => { delivered += 1; return {ok: true, status: 200, json: async () => ({ok:true, recorded:true})}; }
  }, async () => {
    for (const [index, language] of languages.entries()) {
      const res = response();
      const suffix = String(index + 1).padStart(8, '0');
      await handler(request(application({applicationId:`KSP-20260904-${suffix}`, language}), `198.51.100.${30 + index}`), res);
      assert.equal(res.statusCode, 200, language);
      assert.equal(res.payload.success, true, language);
    }
  });
  assert.equal(delivered, languages.length);
});

test('uses Brevo only as a recovery alert and does not show a false receipt', async () => {
  const calls = [];
  const res = response();
  await withDeliveryEnvironment({
    make: 'https://hook.example.test/origin',
    brevo: 'test-api-key',
    fetch: async (url) => {
      calls.push(url);
      return url.includes('hook.example.test') ? {ok: false, status: 502, json: async () => ({})} : {ok: true, status: 201, json: async () => ({messageId:'fallback'})};
    }
  }, () => handler(request(application({applicationId:'KSP-20260904-QWE45678'}), '198.51.100.11'), res));

  assert.equal(res.statusCode, 503);
  assert.equal(res.payload.fallbackNotified, true);
  assert.deepEqual(calls, ['https://hook.example.test/origin', 'https://api.brevo.com/v3/smtp/email']);
});

test('does not show a false receipt when both delivery paths fail', async () => {
  const res = response();
  await withDeliveryEnvironment({
    make: 'https://hook.example.test/origin',
    brevo: 'test-api-key',
    fetch: async () => ({ok: false, status: 503, json: async () => ({})})
  }, () => handler(request(application({applicationId:'KSP-20260904-ASD23456'}), '198.51.100.12'), res));

  assert.equal(res.statusCode, 503);
  assert.match(res.payload.message, /call or WhatsApp/i);
});

test('rejects a Make 200 response that does not confirm the Sheet write', async () => {
  const res = response();
  await withDeliveryEnvironment({
    make: 'https://hook.example.test/origin',
    fetch: async () => ({ok: true, status: 200, json: async () => ({ok:true})})
  }, () => handler(request(application({applicationId:'KSP-20260904-NOACK123'}), '198.51.100.13'), res));

  assert.equal(res.statusCode, 503);
  assert.match(res.payload.message, /record/i);
});
