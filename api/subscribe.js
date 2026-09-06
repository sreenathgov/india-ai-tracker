/**
 * Vercel serverless function: POST /api/subscribe
 * 1. Adds contact to Brevo list
 * 2. Sends the configured welcome email via the transactional API
 *
 * Environment variables (set in Vercel dashboard):
 *   BREVO_API_KEY     — your Brevo API key
 *   BREVO_LIST_ID     — Brevo list ID (default: 2)
 *   BREVO_NEWSLETTER_TEMPLATE_ID — active welcome template ID
 *   MAKE_WEBHOOK_URL  — optional; if set, fans the submission out to a Make scenario
 */

const { applyCors, rateLimit, checkHoneypot, validateRequest } = require('./_lib/security');
const { notifyMake } = require('./_lib/notify');
const {providerFetch} = require('./_lib/provider-fetch');

module.exports = async function handler(req, res) {
  if (!applyCors(req, res)) {
    return res.status(403).json({ message: 'Origin not allowed' });
  }

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  if (!validateRequest(req, res, 16384)) return;

  if (!rateLimit(req)) {
    return res.status(429).json({ message: 'Too many requests. Please try again later.' });
  }

  if (checkHoneypot(req.body)) {
    return res.status(200).json({ success: true });
  }

  const { email } = req.body || {};

  if (typeof email !== 'string' || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ message: 'Invalid email address' });
  }

  const apiKey = process.env.BREVO_API_KEY;
  const listId = parseInt(process.env.BREVO_LIST_ID || '2', 10);
  const welcomeTemplateId = parseInt(process.env.BREVO_NEWSLETTER_TEMPLATE_ID || '', 10);

  if (!apiKey) {
    console.error('BREVO_API_KEY is not set');
    return res.status(500).json({ message: 'Server configuration error' });
  }

  const headers = {
    'api-key': apiKey,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };

  try {
    // Step 1: Add contact to list
    const contactRes = await providerFetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers,
      body: JSON.stringify({ email, listIds: [listId], updateEnabled: true })
    });

    // 201 = created, 204 = updated — both fine. Anything else is an error.
    if (!contactRes.ok && contactRes.status !== 204) {
      const err = await contactRes.json().catch(() => ({}));
      console.error('Brevo add contact error:', err.code || 'provider-error');
      return res.status(502).json({ message: 'Failed to subscribe. Please try again.' });
    }

    // Step 2: Send the welcome email when an approved template is configured.
    // Subscription still succeeds if acknowledgement delivery is unavailable:
    // the contact record is the durable outcome of this endpoint.
    if (Number.isInteger(welcomeTemplateId) && welcomeTemplateId > 0) {
      try {
        const emailRes = await providerFetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            to: [{ email }],
            templateId: welcomeTemplateId
          })
        });

        if (!emailRes.ok) {
          const err = await emailRes.json().catch(() => ({}));
          console.error('Brevo send email error:', err.code || 'provider-error');
        }
      } catch (_) {
        console.error('Newsletter acknowledgement unavailable; contact saved');
      }
    } else {
      console.error('BREVO_NEWSLETTER_TEMPLATE_ID is not configured; contact saved without acknowledgement');
    }

    await notifyMake('subscribe', { email, submittedAt: new Date().toISOString() });

    return res.status(200).json({ success: true });

  } catch (err) {
    console.error('Subscribe handler error:', err.name || 'provider-error');
    return res.status(500).json({ message: 'Server error. Please try again.' });
  }
};
