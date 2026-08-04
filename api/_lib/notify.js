/**
 * Fire-and-forget fan-out to a Make.com webhook.
 * Lets a Make scenario handle Google Sheets logging, owner email notification,
 * and any conditional routing (e.g. flagging a preferred time in free-text
 * fields) without further changes to this codebase.
 *
 * Environment variables (set in Vercel dashboard):
 *   MAKE_WEBHOOK_URL — Make scenario's custom webhook URL. If unset, this is a no-op.
 */

const TIMEOUT_MS = 4000;

async function notifyMake(formType, payload) {
  const url = process.env.MAKE_WEBHOOK_URL;
  if (!url) return;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ formType, ...payload }),
      signal: controller.signal
    });
  } catch (err) {
    // Never let a Make outage break the user-facing form submission.
    console.error('Make webhook notify error:', err.message);
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = { notifyMake };
