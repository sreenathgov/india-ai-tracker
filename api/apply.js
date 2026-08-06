/**
 * Vercel serverless function: POST /api/apply
 *
 * 1. Stores the applicant as a Brevo contact on the careers list, with the
 *    role and a searchable digest of their answers as attributes.
 * 2. Emails the founder the full, untruncated answers, with the CV attached.
 * 3. Sends the candidate an acknowledgement from a transactional template.
 *
 * Steps 2 and 3 are logged on failure but do not fail the request — by then
 * the application is already stored, and telling a candidate their submission
 * failed when it did not is the worse outcome. Same trade as api/consult.js.
 *
 * Environment variables (set in the Vercel dashboard):
 *   BREVO_API_KEY              — already set; shared with the other endpoints
 *   BREVO_CAREERS_LIST_ID      — required; numeric id of the applications list
 *   BREVO_CAREERS_TEMPLATE_ID  — optional; candidate acknowledgement template
 *   CAREERS_NOTIFY_EMAIL       — optional; where the founder notification goes
 *   CAREERS_SENDER_EMAIL       — optional; must be a VERIFIED Brevo sender
 *   MAKE_WEBHOOK_URL           — optional; fans the submission out to Make
 */

const { applyCors, rateLimit, checkHoneypot } = require('./_lib/security');
const { notifyMake } = require('./_lib/notify');
const {
    validateApplication,
    answersSummary,
    notificationHtml
} = require('./_lib/application');

const BREVO_CONTACTS_URL = 'https://api.brevo.com/v3/contacts';
const BREVO_EMAIL_URL = 'https://api.brevo.com/v3/smtp/email';

const DEFAULT_SENDER = { name: 'Kanan Labs', email: 'careers@kananlabs.in' };

function splitName(fullName) {
    const parts = fullName.split(/\s+/).filter(Boolean);
    return {
        first: parts[0] || fullName,
        last: parts.slice(1).join(' ')
    };
}

async function storeContact(headers, listId, { fields, role, answers, timestamp }) {
    const { first, last } = splitName(fields.fullName);

    const response = await fetch(BREVO_CONTACTS_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({
            email: fields.email,
            listIds: [listId],
            updateEnabled: true,
            attributes: {
                FIRSTNAME: first,
                LASTNAME: last,
                ROLE_SLUG: role.slug,
                ROLE_TITLE: role.title,
                LOCATION: fields.location,
                LINKEDIN: fields.linkedin,
                PORTFOLIO: fields.portfolio,
                CV_URL: fields.cvUrl,
                NOTICE_PERIOD: fields.noticePeriod,
                ANSWERS: answersSummary(answers),
                SUBMITTED_AT: timestamp
            }
        })
    });

    // 201 = created, 204 = updated — both are success.
    if (!response.ok && response.status !== 204) {
        const err = await response.json().catch(() => ({}));
        throw Object.assign(new Error('Brevo contact write failed'), {
            brevoStatus: response.status,
            brevoBody: err
        });
    }
}

async function notifyFounder(headers, { role, fields, answers, cv, timestamp }) {
    const to = process.env.CAREERS_NOTIFY_EMAIL;
    if (!to) {
        console.warn('CAREERS_NOTIFY_EMAIL is not set — no founder notification sent');
        return;
    }

    const payload = {
        sender: {
            name: DEFAULT_SENDER.name,
            email: process.env.CAREERS_SENDER_EMAIL || DEFAULT_SENDER.email
        },
        to: [{ email: to }],
        replyTo: { email: fields.email, name: fields.fullName },
        subject: `Application — ${role.title} — ${fields.fullName}`,
        htmlContent: notificationHtml({
            role,
            fields,
            answers,
            hasCv: Boolean(cv),
            submittedAt: timestamp
        })
    };

    if (cv) {
        payload.attachment = [{ name: cv.name, content: cv.content }];
    }

    const response = await fetch(BREVO_EMAIL_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        console.error('Brevo founder notification error:', response.status, err);
    }
}

async function acknowledgeCandidate(headers, { fields, role }) {
    const templateId = parseInt(process.env.BREVO_CAREERS_TEMPLATE_ID || '', 10);
    if (!Number.isInteger(templateId)) {
        console.warn('BREVO_CAREERS_TEMPLATE_ID is not set — no acknowledgement sent');
        return;
    }

    const response = await fetch(BREVO_EMAIL_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({
            to: [{ email: fields.email, name: fields.fullName }],
            templateId,
            params: { ROLE_TITLE: role.title, FIRSTNAME: splitName(fields.fullName).first }
        })
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        console.error('Brevo acknowledgement error:', response.status, err);
    }
}

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

    if (!rateLimit(req)) {
        return res.status(429).json({ message: 'Too many requests. Please try again later.' });
    }

    // A bot that filled the hidden field gets a clean 200 and no write, so it
    // has nothing to learn from the response.
    if (checkHoneypot(req.body)) {
        return res.status(200).json({ success: true });
    }

    const { errors, role, fields, answers, cv } = validateApplication(req.body);
    if (errors.length) {
        return res.status(400).json({ message: errors[0], errors });
    }

    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) {
        console.error('BREVO_API_KEY is not set');
        return res.status(500).json({ message: 'Server configuration error' });
    }

    const listId = parseInt(process.env.BREVO_CAREERS_LIST_ID || '', 10);
    if (!Number.isInteger(listId)) {
        console.error('BREVO_CAREERS_LIST_ID is not set to a numeric Brevo list id — '
            + 'create the list in Brevo and add the variable in Vercel, then redeploy');
        return res.status(500).json({ message: 'Server configuration error' });
    }

    const headers = {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        Accept: 'application/json'
    };

    const timestamp = (req.body && req.body.submittedAt) || new Date().toISOString();
    const context = { role, fields, answers, cv, timestamp };

    try {
        await storeContact(headers, listId, context);
    } catch (err) {
        if (err.brevoStatus) {
            console.error('Brevo add contact error:', err.brevoStatus, err.brevoBody);
            return res.status(502).json({ message: 'We could not send your application. Please try again.' });
        }
        console.error('Apply handler error (contact step):', err);
        return res.status(500).json({ message: 'Server error. Please try again.' });
    }

    // Past this point the application is safely stored. Nothing below may fail
    // the request.
    try {
        await notifyFounder(headers, context);
        await acknowledgeCandidate(headers, context);
        await notifyMake('apply', {
            roleSlug: role.slug,
            roleTitle: role.title,
            fullName: fields.fullName,
            email: fields.email,
            location: fields.location,
            noticePeriod: fields.noticePeriod,
            linkedin: fields.linkedin,
            portfolio: fields.portfolio,
            cvUrl: fields.cvUrl,
            hasCvAttachment: Boolean(cv),
            answers,
            submittedAt: timestamp
        });
    } catch (err) {
        console.error('Apply handler post-store error:', err);
    }

    return res.status(200).json({ success: true });
};
