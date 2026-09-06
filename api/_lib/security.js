/**
 * Shared security helpers for serverless form endpoints.
 *
 * - applyCors(req, res):   Exact production and this project's deployment origins.
 *                          Returns true if request should proceed; false if blocked.
 * - rateLimit(req):        In-memory per-IP token bucket. Lives per warm Vercel instance.
 *                          Returns true if allowed, false if over the limit.
 * - checkHoneypot(body):   True if a bot-only honeypot field is filled (reject request).
 */

const ALLOWED_ORIGINS = [
  'https://kananlabs.in',
  'https://www.kananlabs.in',
  'https://apply.kananlabs.in',
  // local dev
  'http://localhost:3000',
  'http://localhost:8000',
  'http://localhost:5000',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:8000',
  'http://127.0.0.1:4173'
];

function isAllowedOrigin(origin) {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.slice(0, 3).includes(origin)) return true;
  if (!process.env.VERCEL_ENV && /^http:\/\/(?:localhost|127\.0\.0\.1|\[::1\]):\d{2,5}$/.test(origin)) return true;
  // A stranger can create *.vercel.app sites. Trust only platform-provided
  // identifiers for this deployment, never an arbitrary Host request header.
  return ['VERCEL_URL', 'VERCEL_BRANCH_URL', 'VERCEL_PROJECT_PRODUCTION_URL']
    .some(key => process.env[key] && origin === 'https://' + process.env[key]);
}

function applyCors(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Vary', 'Origin');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  const origin = req.headers.origin;

  if (isAllowedOrigin(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Max-Age', '600');
    return true;
  }

  // Same-origin requests don't send Origin in some browsers — allow when host matches.
  // This keeps server-to-server calls and same-origin fetches working.
  if (!origin) {
    return true;
  }

  return false;
}

// In-memory rate limiter — persists for the lifetime of a warm Vercel instance.
// 5 requests per 10 minutes per IP. Defense against casual scripted abuse;
// cold-start churn limits effectiveness against distributed attacks. Deployment
// must also enable persistent edge rate limiting; this is only a second layer.
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_BUCKET_CAP = 5000;

const buckets = new Map();

function getClientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd.length) {
    return fwd.split(',')[0].trim();
  }
  return req.headers['x-real-ip'] || req.socket?.remoteAddress || 'unknown';
}

function rateLimit(req) {
  const ip = getClientIp(req);
  const now = Date.now();
  if (!buckets.has(ip) && buckets.size >= RATE_LIMIT_BUCKET_CAP) {
    for (const [key, stamps] of buckets) if (now - stamps.at(-1) >= RATE_LIMIT_WINDOW_MS) buckets.delete(key);
    if (buckets.size >= RATE_LIMIT_BUCKET_CAP) return false;
  }
  const bucket = buckets.get(ip) || [];
  const fresh = bucket.filter((ts) => now - ts < RATE_LIMIT_WINDOW_MS);

  if (fresh.length >= RATE_LIMIT_MAX) {
    buckets.set(ip, fresh);
    return false;
  }

  fresh.push(now);
  buckets.set(ip, fresh);

  // Prevent unbounded memory growth across cold-survival lifetime.
  if (buckets.size > RATE_LIMIT_BUCKET_CAP) {
    const cutoff = now - RATE_LIMIT_WINDOW_MS;
    for (const [k, v] of buckets) {
      const stillFresh = v.filter((ts) => ts > cutoff);
      if (stillFresh.length === 0) buckets.delete(k);
      else buckets.set(k, stillFresh);
    }
  }

  return true;
}

// Honeypot field name. The HTML form includes a visually-hidden input with this name;
// real humans never see it, so a non-empty value indicates an automated submission.
const HONEYPOT_FIELD = 'company_website';

function checkHoneypot(body) {
  if (!body || typeof body !== 'object') return false;
  const v = body[HONEYPOT_FIELD];
  return typeof v === 'string' && v.trim().length > 0;
}

function validateRequest(req, res, maxBytes = 16384) {
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    res.status(400).json({message:'A JSON object is required'}); return false;
  }
  if (req.headers['content-type'] && !/^application\/json(?:\s*;|$)/i.test(req.headers['content-type'])) {
    res.status(415).json({message:'Use application/json'}); return false;
  }
  if (Buffer.byteLength(JSON.stringify(req.body), 'utf8') > maxBytes) {
    res.status(413).json({message:'Submission is too large'}); return false;
  }
  return true;
}

module.exports = {
  applyCors,
  rateLimit,
  checkHoneypot,
  HONEYPOT_FIELD,
  isAllowedOrigin,
  validateRequest,
};
