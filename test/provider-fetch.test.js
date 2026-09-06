const test = require('node:test');
const assert = require('node:assert/strict');
const {providerFetch} = require('../api/_lib/provider-fetch');

test('provider response is completely consumed before returning', async t => {
  t.mock.method(globalThis, 'fetch', async () => new Response('{"id":123}', {status:201}));
  const response = await providerFetch('https://example.test');
  assert.equal(response.status, 201);
  assert.equal(response.ok, true);
  assert.deepEqual(await response.json(), {id:123});
});

test('provider timeout remains active while response body is stalled', async t => {
  t.mock.timers.enable({apis:['setTimeout']});
  let begin;
  const started = new Promise(resolve => { begin = resolve; });
  t.mock.method(globalThis, 'fetch', async (_url, {signal}) => new Response(new ReadableStream({
    start(controller) {
      signal.addEventListener('abort', () => controller.error(signal.reason), {once:true});
      begin();
    }
  })));
  const pending = providerFetch('https://example.test');
  const rejected = assert.rejects(pending, {name:'AbortError'});
  await started;
  t.mock.timers.tick(6000);
  await rejected;
});

test('oversized provider body fails closed', async t => {
  let signal;
  t.mock.method(globalThis, 'fetch', async (_url, options) => {
    signal = options.signal;
    return new Response('x'.repeat(65537));
  });
  await assert.rejects(providerFetch('https://example.test'), RangeError);
  assert.equal(signal.aborted, true);
});

test('empty 204 response and caller cancellation are supported', async t => {
  t.mock.method(globalThis, 'fetch', async (_url, {signal}) => {
    signal.throwIfAborted();
    return new Response(null, {status:204});
  });
  assert.equal((await providerFetch('https://example.test')).status, 204);
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(providerFetch('https://example.test', {signal:controller.signal}), {name:'AbortError'});
});
