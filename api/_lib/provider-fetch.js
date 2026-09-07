// Bound both headers and body: fetch() alone resolves before the body has arrived.
// These JSON providers return small acknowledgements, never files or streams.
const MAX_RESPONSE_BYTES = 64 * 1024;
async function providerFetch(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);
  const signal = options.signal
    ? AbortSignal.any([controller.signal, options.signal]) : controller.signal;
  try {
    const response = await fetch(url, {...options, signal});
    const chunks = [];
    let size = 0;
    if (response.body) {
      const reader = response.body.getReader();
      try {
        while (true) {
          const {done, value} = await reader.read();
          if (done) break;
          size += value.byteLength;
          if (size > MAX_RESPONSE_BYTES) {
            controller.abort();
            throw new RangeError('Provider response is too large');
          }
          chunks.push(Buffer.from(value));
        }
      } finally { reader.releaseLock(); }
    }
    const body = Buffer.concat(chunks).toString('utf8');
    // Keep only the response interface the handlers use; no credentials or URL.
    return {ok:response.ok, status:response.status,
      text:async () => body, json:async () => JSON.parse(body)};
  }
  finally { clearTimeout(timeout); }
}
module.exports = {providerFetch};
