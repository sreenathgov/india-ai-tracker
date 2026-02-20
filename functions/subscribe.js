/**
 * Vercel serverless function: POST /api/subscribe
 * Adds an email to the Brevo contact list server-side.
 * Set these environment variables in your Vercel project settings:
 *   BREVO_API_KEY  — your Brevo API key
 *   BREVO_LIST_ID  — the Brevo list ID (currently 2)
 */

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { email } = req.body || {};

  // Basic validation
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ message: 'Invalid email address' });
  }

  const apiKey = process.env.BREVO_API_KEY;
  const listId = parseInt(process.env.BREVO_LIST_ID || '2', 10);

  if (!apiKey) {
    console.error('BREVO_API_KEY environment variable is not set');
    return res.status(500).json({ message: 'Server configuration error' });
  }

  try {
    const brevoRes = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        email,
        listIds: [listId],
        updateEnabled: true
      })
    });

    // 201 = created, 204 = already existed but updated — both are success
    if (!brevoRes.ok && brevoRes.status !== 204) {
      const err = await brevoRes.json().catch(() => ({}));
      console.error('Brevo API error:', brevoRes.status, err);
      return res.status(502).json({ message: 'Failed to subscribe. Please try again.' });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Subscribe handler error:', err);
    return res.status(500).json({ message: 'Server error. Please try again.' });
  }
}
