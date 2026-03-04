/**
 * Newsletter subscription utility.
 * POSTs to /api/subscribe (Vercel serverless function) which holds the Brevo API key server-side.
 * Set BREVO_API_KEY and BREVO_LIST_ID in your Vercel project environment variables.
 */

window.brevoSubscribe = async function(email) {
  const response = await fetch('/api/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || `Subscribe error: ${response.status}`);
  }

  return true;
};
