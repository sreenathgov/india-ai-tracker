const { applyCors, rateLimit, checkHoneypot, validateRequest } = require('./_lib/security');
const { validateApplication, enrichApplication, renderInternalEmail, sheetRecord } = require('./_lib/supplier-programme');

const TIMEOUT_MS = 6000;

async function postJson(url, payload, headers = {}) {
  if (!url) return { configured: false, ok: false };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, {method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(payload),signal:controller.signal});
    let body = null;
    try {
      if (typeof response.json === 'function') body = await response.json();
      else if (typeof response.text === 'function') {
        const text = await response.text();
        body = text ? JSON.parse(text) : null;
      }
    } catch (_) {
      body = null;
    }
    return { configured: true, ok: response.ok, status: response.status, body };
  } catch (error) {
    console.error('Supplier Programme delivery error:', error.name === 'AbortError' ? 'timeout' : 'provider-unreachable');
    return { configured: true, ok: false };
  } finally { clearTimeout(timeout); }
}

module.exports = async function handler(req, res) {
  if (!applyCors(req, res)) return res.status(403).json({ message: 'Origin not allowed' });
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });
  if (!validateRequest(req, res)) return;
  if (!rateLimit(req)) return res.status(429).json({ message: 'Too many requests. Please try again later.' });
  if (checkHoneypot(req.body)) return res.status(200).json({ success: true });

  const validated = validateApplication(req.body || {});
  if (!validated.ok) return res.status(400).json({ message: 'Invalid application', fields: validated.errors });
  const record = enrichApplication(validated.data);

  const makeUrl = process.env.ORIGIN_MAKE_WEBHOOK_URL;
  const makeApiKey = process.env.ORIGIN_MAKE_WEBHOOK_API_KEY;
  const makeHeaders = makeApiKey ? { 'X-Make-Apikey': makeApiKey } : {};
  const make = makeApiKey ? await postJson(makeUrl, { formType: 'supplier-programme', ...sheetRecord(record) }, makeHeaders)
    : {configured:false, ok:false};
  const makeRecorded = make.ok && make.body?.ok === true && make.body?.recorded === true;

  if (makeRecorded) {
    // A retried application keeps the deadline established by its first Sheet write.
    const storedDueAt = make.body.responseDueAt;
    const responseDueAt = typeof storedDueAt === 'string' && Number.isFinite(Date.parse(storedDueAt))
      ? new Date(storedDueAt).toISOString() : record.responseDueAt;
    return res.status(200).json({ success: true, applicationId: record.applicationId, responseDueAt });
  }

  const apiKey = process.env.BREVO_API_KEY;
  const notifyEmail = process.env.ORIGIN_NOTIFY_EMAIL || 'sreenath@kananlabs.in';
  const senderEmail = process.env.ORIGIN_SENDER_EMAIL || 'raya@kananlabs.in';
  const email = apiKey ? await postJson('https://api.brevo.com/v3/smtp/email', {
    sender: { name: 'Raya at Kanan Labs', email: senderEmail },
    to: [{ email: notifyEmail, name: 'Kanan Supplier Programme' }],
    subject: `[DELIVERY FALLBACK · ${record.route}] ${record.companyName} · Sheet write not confirmed`,
    htmlContent: renderInternalEmail(record)
  }, {'api-key': apiKey, Accept: 'application/json'}) : { configured: false, ok: false };

  console.error('Supplier Programme Sheet delivery was not confirmed', {
    makeConfigured: make.configured,
    makeStatus: make.status,
    fallbackConfigured: email.configured,
    fallbackSent: email.ok
  });
  return res.status(503).json({
    message: 'Unable to record the application safely. Please call or WhatsApp Kanan.',
    applicationId: record.applicationId,
    fallbackNotified: email.ok
  });
};
