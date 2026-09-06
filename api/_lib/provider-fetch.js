// Bound provider latency without logging payloads or credential-bearing URLs.
async function providerFetch(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);
  try { return await fetch(url, {...options, signal:controller.signal}); }
  finally { clearTimeout(timeout); }
}
module.exports = {providerFetch};
