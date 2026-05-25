/**
 * Vercel serverless function: POST /api/early-access
 * Adds a Sector Watch early-access request to Brevo.
 *
 * Environment variables (set in Vercel dashboard):
 *   BREVO_API_KEY              — your Brevo API key
 *   BREVO_EARLY_ACCESS_LIST_ID — Brevo list ID (default: 7)
 */

const { applyCors, rateLimit, checkHoneypot } = require('./_lib/security');

module.exports = async function handler(req, res) {
  // CORS allowlist (kananlabs.in + *.vercel.app + local dev)
  if (!applyCors(req, res)) {
    return res.status(403).json({ message: 'Origin not allowed' });
  }

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Rate limit: 5 requests / 10 min / IP (per warm instance)
  if (!rateLimit(req)) {
    return res.status(429).json({ message: 'Too many requests. Please try again later.' });
  }

  // Honeypot: silently accept and discard automated submissions
  if (checkHoneypot(req.body)) {
    return res.status(200).json({ success: true });
  }

  const { name, company, email } = req.body || {};

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ message: 'Invalid email address' });
  }
  if (!name || name.trim().length < 1) {
    return res.status(400).json({ message: 'Name is required' });
  }

  const apiKey = process.env.BREVO_API_KEY;
  const listId = parseInt(process.env.BREVO_EARLY_ACCESS_LIST_ID || '7', 10);

  if (!apiKey) {
    console.error('BREVO_API_KEY is not set');
    return res.status(500).json({ message: 'Server configuration error' });
  }

  // Split full name into first / last for Brevo
  const nameParts = name.trim().split(' ');
  const firstName = nameParts[0];
  const lastName = nameParts.slice(1).join(' ') || '';

  try {
    const contactRes = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        email,
        attributes: {
          FIRSTNAME: firstName,
          LASTNAME: lastName,
          COMPANY: company || ''
        },
        listIds: [listId],
        updateEnabled: true
      })
    });

    // 201 = created, 204 = already exists (updated) — both fine
    if (!contactRes.ok && contactRes.status !== 204) {
      const err = await contactRes.json().catch(() => ({}));
      console.error('Brevo early-access error:', contactRes.status, err);
      return res.status(502).json({ message: 'Failed to submit. Please try again.' });
    }

    return res.status(200).json({ success: true });

  } catch (err) {
    console.error('Early-access handler error:', err);
    return res.status(500).json({ message: 'Server error. Please try again.' });
  }
};
