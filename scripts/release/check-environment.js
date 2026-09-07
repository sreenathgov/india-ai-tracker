// A staged Production build must not publish forms with missing delivery config.
// Only variable names are reported; never their values. Local/CI checks need no secrets.
function missingConfiguration(env) {
  const missing = ['BREVO_API_KEY','ORIGIN_MAKE_WEBHOOK_URL','ORIGIN_MAKE_WEBHOOK_API_KEY']
    .filter(key => !String(env[key] || '').trim() || env[key] === '[SENSITIVE]');
  if (!/^[1-9]\d*$/.test(env.BREVO_CAREERS_LIST_ID || '')) missing.push('BREVO_CAREERS_LIST_ID');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(env.CAREERS_NOTIFY_EMAIL || '')) missing.push('CAREERS_NOTIFY_EMAIL');
  if (env.CAREERS_SENDER_EMAIL && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(env.CAREERS_SENDER_EMAIL)) missing.push('CAREERS_SENDER_EMAIL');
  for (const key of ['BREVO_LIST_ID','BREVO_EARLY_ACCESS_LIST_ID','BREVO_CAREERS_TEMPLATE_ID','BREVO_NEWSLETTER_TEMPLATE_ID','BREVO_DEMO_TEMPLATE_ID']) {
    if (env[key] && !/^[1-9]\d*$/.test(env[key])) missing.push(key);
  }
  if (env.ORIGIN_MAKE_WEBHOOK_URL) {
    try { if (new URL(env.ORIGIN_MAKE_WEBHOOK_URL).protocol !== 'https:') missing.push('ORIGIN_MAKE_WEBHOOK_URL (HTTPS required)'); }
    catch { missing.push('ORIGIN_MAKE_WEBHOOK_URL (valid URL required)'); }
  }
  return missing;
}
if (require.main === module && process.env.VERCEL_ENV) {
  const missing = missingConfiguration(process.env);
  if (missing.length) {
    console.error('Delivery configuration requires attention: ' + missing.join(', '));
    if (process.env.VERCEL_ENV === 'production') process.exitCode = 1;
  } else console.log('Required delivery configuration is present; live delivery still requires verification.');
}
module.exports = {missingConfiguration};
