const LOCALIZATION_MANIFEST = require('../../data/supplier-programme/localization/manifest.json');
const CURRENT_PURPOSES = new Set(['cc_od','raw_materials','production_costs','confirmed_order','invoice_gap','other']);
const LEGACY_PURPOSES = new Set([...CURRENT_PURPOSES, 'capex']);
const ORDER_STATES = new Set(['confirmed_po','customer_release','forecast','no_order','not_sure']);
const LOCALE_BY_LANGUAGE = new Map(LOCALIZATION_MANIFEST.locales.map((entry) => [entry.languageCode, entry]));
const LEGACY_LANGUAGE_ALIASES = new Map([['bo','brx'],['kok','gom']]);
const APPLICATION_ID_RE = /^KSP-\d{8}-[A-Z0-9]{8}$/;

function clean(value, max) {
  return typeof value === 'string' ? value.trim().replace(/[\u0000-\u001f\u007f]/g, ' ').slice(0, max) : '';
}

function normalizePhone(value) {
  let digits = clean(value, 24).replace(/\D/g, '');
  if (digits.length === 10) digits = `91${digits}`;
  if (!/^91[6-9]\d{9}$/.test(digits)) return null;
  return `+${digits}`;
}

function validateApplication(body) {
  const errors = [];
  const source = body && typeof body.source === 'object' ? body.source : {};
  const rawLanguage = clean(body?.language, 16);
  const language = LEGACY_LANGUAGE_ALIASES.get(rawLanguage) || rawLanguage;
  const locale = LOCALE_BY_LANGUAGE.get(language);
  const shortLanguageFlow = locale?.experience === 'contact-flow';
  const clientSchemaVersion = clean(body?.schemaVersion, 40) === 'supplier-programme.v2' ? 'supplier-programme.v2' : 'supplier-programme.v1';
  const legacyClient = clientSchemaVersion === 'supplier-programme.v1';
  if (body?.schemaVersion && !['supplier-programme.v1', 'supplier-programme.v2'].includes(body.schemaVersion)) errors.push('schemaVersion');
  const workingCapital = shortLanguageFlow ? '' : clean(body?.workingCapital, 8);
  const companyName = clean(body?.companyName, 160);
  const manufacturingDescription = clean(body?.manufacturingDescription, 500);
  const contactName = clean(body?.contactName, 120);
  const whatsapp = normalizePhone(body?.whatsapp);
  const consent = body?.consent === true;
  const submittedConsentVersion = clean(body?.consentVersion, 80);
  const applicationId = clean(body?.applicationId, 32);

  if (!locale) errors.push('language');
  if (!APPLICATION_ID_RE.test(applicationId)) errors.push('applicationId');
  if (!companyName) errors.push('companyName');
  if (!manufacturingDescription) errors.push('manufacturingDescription');
  if (!contactName) errors.push('contactName');
  if (!whatsapp) errors.push('whatsapp');
  if (!consent) errors.push('consent');
  if (!legacyClient && submittedConsentVersion !== 'supplier-programme-2026-09-v2') errors.push('consentVersion');
  if (legacyClient && submittedConsentVersion && submittedConsentVersion !== 'supplier-programme-2026-09-v1') errors.push('consentVersion');
  if (!shortLanguageFlow && !['yes','no'].includes(workingCapital)) errors.push('workingCapital');

  const allowedPurposes = legacyClient ? LEGACY_PURPOSES : CURRENT_PURPOSES;
  const purposes = Array.isArray(body?.purposes) ? [...new Set(body.purposes.filter((v) => allowedPurposes.has(v)))] : [];
  const state = clean(body?.state, 120);
  const city = clean(body?.city, 120);
  const fundingAmountInr = Number(body?.fundingAmountInr);
  const orderStatus = clean(body?.orderStatus, 32);
  if (workingCapital === 'yes') {
    if (!purposes.length) errors.push('purposes');
    if (!state) errors.push('state');
    if (!city) errors.push('city');
    if (!Number.isSafeInteger(fundingAmountInr) || fundingAmountInr < 1 || fundingAmountInr > 100000000000) errors.push('fundingAmountInr');
    if (!ORDER_STATES.has(orderStatus)) errors.push('orderStatus');
  }

  if (errors.length) return { ok: false, errors };
  return {
    ok: true,
    data: {
      applicationId,
      language,
      localeCode: locale.localeCode,
      languageExperience: shortLanguageFlow ? 'contact-flow' : 'full-form',
      localizationVersion: LOCALIZATION_MANIFEST.localizationVersion,
      workingCapital: shortLanguageFlow ? null : workingCapital === 'yes',
      purposes: workingCapital === 'yes' ? purposes : [],
      companyName,
      manufacturingDescription,
      state: workingCapital === 'yes' ? state : null,
      city: workingCapital === 'yes' ? city : null,
      fundingAmountInr: workingCapital === 'yes' ? fundingAmountInr : null,
      orderStatus: workingCapital === 'yes' ? orderStatus : null,
      contactName,
      whatsapp,
      consent: true,
      consentVersion: legacyClient ? 'supplier-programme-2026-09-v1' : 'supplier-programme-2026-09-v2',
      schemaVersion: 'supplier-programme.v2',
      clientSchemaVersion,
      source: {
        referrer: safeReferrer(source.referrer),
        utmSource: clean(source.utm_source, 120),
        utmMedium: clean(source.utm_medium, 120),
        utmCampaign: clean(source.utm_campaign, 160),
        utmContent: clean(source.utm_content, 160)
      }
    }
  };
}

function safeReferrer(value) {
  try {
    const url = new URL(value);
    return /^https?:$/.test(url.protocol) ? clean(url.origin + url.pathname, 500) : '';
  } catch (_) { return ''; }
}

// Make uses USER_ENTERED for timestamp columns. Prefix user-controlled text
// separately so Sheets never evaluates an applicant's text as a formula.
function sheetText(value) {
  return typeof value === 'string' && /^[\s\uFEFF]*[=+\-@]/.test(value) ? "'" + value : value;
}
function sheetRecord(record) {
  const result = {...record, source:{...record.source}};
  for (const key of ['companyName','manufacturingDescription','state','city','contactName']) result[key] = sheetText(result[key]);
  for (const key of Object.keys(result.source)) result.source[key] = sheetText(result.source[key]);
  // WhatsApp is already explicitly formatted as text by the Make column mapping.
  return result;
}

function addHours(date, hours) { return new Date(date.getTime() + hours * 60 * 60 * 1000).toISOString(); }

function enrichApplication(data, now = new Date()) {
  const receivedAt = now.toISOString();
  let route = 'non-working-capital';
  if (data.languageExperience === 'contact-flow') route = 'language-follow-up';
  else if (data.workingCapital) route = 'working-capital';
  return {...data, route, receivedAt, reminderAt: addHours(now,18), escalationAt: addHours(now,22), responseDueAt: addHours(now,24)};
}

function escapeHtml(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
}

function renderInternalEmail(record) {
  const rows = [
    ['Application', record.applicationId],['Route', record.route],['Due by', record.responseDueAt],['Language', `${record.language} · ${record.localeCode}`],
    ['Language experience', record.languageExperience],['Localization', record.localizationVersion],
    ['Company', record.companyName],['Manufactures', record.manufacturingDescription],['Working capital', record.workingCapital === null ? 'Language follow-up' : record.workingCapital ? 'Yes' : 'No'],
    ['Purposes', record.purposes.join(', ') || '—'],['Location', [record.city,record.state].filter(Boolean).join(', ') || '—'],['Amount', record.fundingAmountInr ? `₹${record.fundingAmountInr.toLocaleString('en-IN')}` : '—'],
    ['Demand', record.orderStatus || '—'],['Contact', record.contactName],['WhatsApp', record.whatsapp],['UTM source', record.source.utmSource || '—']
  ];
  return `<h1>New Kanan Supplier Programme application</h1><p><strong>Personal response due within 24 hours.</strong></p><table cellpadding="8" cellspacing="0" border="1" style="border-collapse:collapse">${rows.map(([a,b])=>`<tr><th align="left">${escapeHtml(a)}</th><td>${escapeHtml(b)}</td></tr>`).join('')}</table><p>18-hour reminder: ${escapeHtml(record.reminderAt)}<br>22-hour escalation: ${escapeHtml(record.escalationAt)}</p>`;
}

module.exports = { validateApplication, enrichApplication, renderInternalEmail, normalizePhone, sheetText, sheetRecord };
