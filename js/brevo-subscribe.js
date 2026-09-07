/**
 * Newsletter subscription utility.
 * POSTs to /api/subscribe (Vercel serverless function) which holds the Brevo API key server-side.
 * Set BREVO_API_KEY and BREVO_LIST_ID in your Vercel project environment variables.
 * Kept as a local static asset so newsletter setup never delays page readiness.
 */

window.brevoSubscribe = async function(email) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
  const response = await fetch('/api/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
    signal: controller.signal
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok || result?.success !== true) {
    throw new Error(result?.message || 'We could not confirm your subscription. Please try again.');
  }

  return true;
  } catch (error) {
    if (error.name === 'AbortError') throw new Error('The connection timed out. Please try again.');
    throw error;
  } finally { clearTimeout(timeout); }
};
