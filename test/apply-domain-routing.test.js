const test = require('node:test');
const assert = require('node:assert/strict');

const config = require('../vercel.json');

function findByHost(entries, source, host) {
  return entries.find((entry) => entry.source === source
    && Array.isArray(entry.has)
    && entry.has.some((condition) => condition.type === 'host' && condition.value === host));
}

test('apply.kananlabs.in root is served via a redirect, not a rewrite', () => {
  const rewrite = findByHost(config.rewrites, '/', 'apply.kananlabs.in');
  assert.equal(rewrite, undefined, 'the host-conditioned root rewrite must be removed — it does not take effect in Production');
});

test('apply.kananlabs.in root redirects to the Supplier Programme page', () => {
  const redirect = findByHost(config.redirects, '/', 'apply.kananlabs.in');
  assert.ok(redirect, 'expected a host-conditioned redirect for "/" on apply.kananlabs.in');
  assert.equal(redirect.destination, '/supplier-programme.html');
  assert.equal(redirect.permanent, false, 'must be a temporary redirect so the mapping can still be adjusted');
  assert.equal(config.redirects[0], redirect, 'the apply-domain root redirect must be the first entry in redirects');
});

test('apply.kananlabs.in robots.txt and sitemap.xml rewrites are unchanged', () => {
  const robots = findByHost(config.rewrites, '/robots.txt', 'apply.kananlabs.in');
  const sitemap = findByHost(config.rewrites, '/sitemap.xml', 'apply.kananlabs.in');
  assert.ok(robots, 'expected the apply.kananlabs.in robots.txt rewrite to remain');
  assert.equal(robots.destination, '/application-robots.txt');
  assert.ok(sitemap, 'expected the apply.kananlabs.in sitemap.xml rewrite to remain');
  assert.equal(sitemap.destination, '/application-sitemap.xml');
});

test('kananlabs.in supplier-programme.html still redirects to the apply subdomain', () => {
  const primary = config.redirects.find((entry) => entry.source === '/supplier-programme.html'
    && entry.has.some((condition) => condition.value === 'kananlabs.in'));
  const www = config.redirects.find((entry) => entry.source === '/supplier-programme.html'
    && entry.has.some((condition) => condition.value === 'www.kananlabs.in'));
  assert.ok(primary && primary.destination === 'https://apply.kananlabs.in/');
  assert.ok(www && www.destination === 'https://apply.kananlabs.in/');
});
