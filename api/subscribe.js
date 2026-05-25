/**
 * Vercel serverless function: POST /api/subscribe
 * 1. Adds contact to Brevo list
 * 2. Immediately sends welcome email via transactional API (template ID 1)
 *
 * Environment variables (set in Vercel dashboard):
 *   BREVO_API_KEY  — your Brevo API key
 *   BREVO_LIST_ID  — Brevo list ID (default: 2)
 */

const { applyCors, rateLimit, checkHoneypot } = require('./_lib/security');

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

  if (!rateLimit(req)) {
    return res.status(429).json({ message: 'Too many requests. Please try again later.' });
  }

  if (checkHoneypot(req.body)) {
    return res.status(200).json({ success: true });
  }

  const { email } = req.body || {};

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ message: 'Invalid email address' });
  }

  const apiKey = process.env.BREVO_API_KEY;
  const listId = parseInt(process.env.BREVO_LIST_ID || '2', 10);

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
    const contactRes = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers,
      body: JSON.stringify({ email, listIds: [listId], updateEnabled: true })
    });

    // 201 = created, 204 = updated — both fine. Anything else is an error.
    if (!contactRes.ok && contactRes.status !== 204) {
      const err = await contactRes.json().catch(() => ({}));
      console.error('Brevo add contact error:', contactRes.status, err);
      return res.status(502).json({ message: 'Failed to subscribe. Please try again.' });
    }

    // Step 2: Send welcome email immediately via transactional API
    const emailRes = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        to: [{ email }],
        templateId: 1
      })
    });

    if (!emailRes.ok) {
      const err = await emailRes.json().catch(() => ({}));
      // Log but don't fail — contact was added successfully
      console.error('Brevo send email error:', emailRes.status, err);
    }

    return res.status(200).json({ success: true });

  } catch (err) {
    console.error('Subscribe handler error:', err);
    return res.status(500).json({ message: 'Server error. Please try again.' });
  }
};
