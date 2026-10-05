/**
 * Vercel serverless function: POST /api/report-access
 * Records a gated report request in a dedicated Brevo list. The browser starts
 * the public PDF download only after this endpoint confirms the contact write.
 *
 * Environment variables:
 *   BREVO_API_KEY              — Brevo API key
 *   BREVO_REPORT_ACCESS_LIST_ID — dedicated list for report-access contacts
 *   MAKE_WEBHOOK_URL           — optional operational fan-out
 */

const { applyCors, rateLimit, checkHoneypot, validateRequest } = require('./_lib/security');
const { notifyMake } = require('./_lib/notify');
const { providerFetch } = require('./_lib/provider-fetch');
const resources = require('../data/resources-extra.json');

function gatedReport(slug) {
  const items = Array.isArray(resources) ? resources : resources.items;
  return Array.isArray(items)
    ? items.find(item => item && item.slug === slug && item.bucket === 'whitepaper'
        && item.access && item.access.mode === 'lead-gate')
    : null;
}

module.exports = async function handler(req, res) {
  if (!applyCors(req, res)) return res.status(403).json({ message: 'Origin not allowed' });
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });
  if (!validateRequest(req, res, 16384)) return;
  if (!rateLimit(req)) return res.status(429).json({ message: 'Too many requests. Please try again later.' });
  if (checkHoneypot(req.body)) return res.status(200).json({ success: true });

  const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const reportSlug = typeof req.body.reportSlug === 'string' ? req.body.reportSlug.trim() : '';
  const report = gatedReport(reportSlug);

  if (!name || name.length > 160) return res.status(400).json({ message: 'Name is required' });
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ message: 'Invalid email address' });
  }
  if (!report) return res.status(400).json({ message: 'Unknown report' });

  const apiKey = process.env.BREVO_API_KEY;
  const listId = Number(process.env.BREVO_REPORT_ACCESS_LIST_ID);
  if (!apiKey || !Number.isInteger(listId) || listId < 1) {
    console.error('Report access delivery configuration is incomplete');
    return res.status(500).json({ message: 'Server configuration error' });
  }

  const nameParts = name.split(/\s+/);
  const firstName = nameParts.shift();
  const lastName = nameParts.join(' ');

  try {
    const contactRes = await providerFetch('https://api.brevo.com/v3/contacts', {
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
          CONTEXT: `Requested report: ${report.title}`
        },
        listIds: [listId],
        updateEnabled: true
      })
    });

    if (!contactRes.ok && contactRes.status !== 204) {
      const error = await contactRes.json().catch(() => ({}));
      console.error('Brevo report access error:', error.code || 'provider-error');
      return res.status(502).json({ message: 'We could not prepare the report. Please try again.' });
    }

    await notifyMake('report-access', {
      contactName: name,
      email,
      reportSlug,
      reportTitle: report.title,
      submittedAt: new Date().toISOString()
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Report access handler error:', error.name || 'provider-error');
    return res.status(500).json({ message: 'Server error. Please try again.' });
  }
};
