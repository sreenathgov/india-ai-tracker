/**
 * Vercel serverless function: POST /api/consult
 * 1. Stores consultation submission as a Brevo contact (list #6, with attributes)
 * 2. Immediately sends acknowledgement email via transactional API (template #3)
 *
 * Environment variables (set in Vercel dashboard):
 *   BREVO_API_KEY          — your Brevo API key
 *   BREVO_DEMO_TEMPLATE_ID — optional; Raya's TradeWatch demo acknowledgement
 *                            template, used only when engagementType is
 *                            "TradeWatch demo". Falls back to template #3
 *                            (the generic acknowledgement) when unset.
 *   MAKE_WEBHOOK_URL       — optional; if set, fans the submission out to a Make scenario
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

  const {
    engagementType,
    companyName,
    website,
    sector,
    stage,
    strategicContext,
    contactName,
    email,
    role,
    submittedAt
  } = req.body || {};

  for (const field of ['engagementType','companyName','website','sector','stage','strategicContext','role']) {
    if (req.body[field] != null && (typeof req.body[field] !== 'string' || req.body[field].length > 2000)) return res.status(400).json({message:'Invalid field',field});
  }
  // Validate required fields
  if (typeof email !== 'string' || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ message: 'Invalid email address' });
  }
  if (typeof contactName !== 'string' || contactName.length > 160 || !contactName.trim()) {
    return res.status(400).json({ message: 'Contact name is required' });
  }
  if (!engagementType) {
    return res.status(400).json({ message: 'Engagement type is required' });
  }

  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.error('BREVO_API_KEY is not set');
    return res.status(500).json({ message: 'Server configuration error' });
  }

  const headers = {
    'api-key': apiKey,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };

  const timestamp = new Date().toISOString();

  try {
    // Step 1: Add contact to Brevo list #6 "Consultations" with all attributes
    const contactRes = await providerFetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        email,
        listIds: [6],
        updateEnabled: true,
        attributes: {
          FIRSTNAME: contactName.trim().split(' ')[0] || contactName.trim(),
          LASTNAME: contactName.trim().split(' ').slice(1).join(' ') || '',
          ENGAGEMENT_TYPE: engagementType || '',
          COMPANY: companyName || '',
          WEBSITE: website || '',
          SECTOR: sector || '',
          STAGE: stage || '',
          ROLE: role || '',
          CONTEXT: (strategicContext || '').substring(0, 1000), // Brevo text field limit
          SUBMITTED_AT: timestamp
        }
      })
    });

    // 201 = created, 204 = updated — both fine
    if (!contactRes.ok && contactRes.status !== 204) {
      const err = await contactRes.json().catch(() => ({}));
      console.error('Brevo add contact error:', err.code || 'provider-error');
      return res.status(502).json({ message: 'Failed to submit request. Please try again.' });
    }

    // Step 2: Send acknowledgement email immediately via transactional API.
    // TradeWatch demo requests get Raya's dedicated template when configured;
    // everything else keeps the generic acknowledgement (#3).
    const demoTemplateId = parseInt(process.env.BREVO_DEMO_TEMPLATE_ID || '', 10);
    const templateId = (engagementType === 'TradeWatch demo' && Number.isInteger(demoTemplateId))
      ? demoTemplateId
      : 3;

    // A saved request remains successful if the acknowledgement provider fails.
    try {
      const emailRes = await providerFetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          to: [{ email, name: contactName.trim() }],
          templateId
        })
      });

      if (!emailRes.ok) {
        const err = await emailRes.json().catch(() => ({}));
        // Log but don't fail — contact was stored successfully
        console.error('Brevo send email error:', err.code || 'provider-error');
      }
    } catch (error) {
      console.error('Brevo acknowledgement unavailable:', error.message);
    }

    await notifyMake('consult', {
      engagementType,
      contactName: contactName.trim(),
      email,
      companyName: companyName || '',
      website: website || '',
      sector: sector || '',
      stage: stage || '',
      role: role || '',
      strategicContext: strategicContext || '',
      submittedAt: timestamp
    });

    return res.status(200).json({ success: true });

  } catch (err) {
    console.error('Consult handler error:', err.name || 'provider-error');
    return res.status(500).json({ message: 'Server error. Please try again.' });
  }
};
