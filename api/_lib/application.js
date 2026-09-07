/**
 * Server-side shape and content checks for a careers application, plus the
 * composition of the notification email.
 *
 * Everything here is driven by data/careers.json — the same file that renders
 * the form. A question added, removed or reworded there changes what this
 * accepts, with no code edit. That is the whole point: the two can never
 * disagree about which answers are valid.
 */

const careers = require('../../data/careers.json');

// A role that is filled is not accepting applications. Kept in step with
// CLOSED_STATUSES in scripts/careers/schema.js.
const CLOSED_STATUSES = ['filled'];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Vercel caps a serverless request body at 4.5 MB; base64 inflates by ~33%.
const MAX_CV_BYTES = 3 * 1024 * 1024;
const MAX_CV_BASE64_CHARS = 4.4 * 1024 * 1024;

const LIMITS = {
    fullName: 120,
    email: 180,
    location: 120,
    noticePeriod: 80,
    linkedin: 300,
    portfolio: 300,
    cvUrl: 300
};

const ATTRIBUTE_TEXT_LIMIT = 1000;

function findRole(slug) {
    if (typeof slug !== 'string' || !slug) return null;
    return careers.roles.find(role => role.slug === slug) || null;
}

function isAdvertised(role) {
    return Boolean(role) && !CLOSED_STATUSES.includes(role.status);
}

function str(value) {
    return typeof value === 'string' ? value.trim() : '';
}

function isUsableUrl(value) {
    try {
        const url = new URL(value);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (err) {
        return false;
    }
}

/**
 * Match the submitted answers against the role's own questions[].
 * Unknown ids are rejected rather than ignored — a payload carrying keys the
 * role does not define means the client and the data have drifted, and
 * silently dropping the extra text would lose a candidate's answer.
 *
 * @returns {{errors: string[], answers: Array<{id, prompt, answer}>}}
 */
function validateAnswers(role, submitted) {
    const errors = [];
    const questions = Array.isArray(role.questions) ? role.questions : [];
    const byId = new Map(questions.map(q => [q.id, q]));

    const incoming = Array.isArray(submitted) ? submitted : [];
    const seen = new Set();
    const answers = [];

    incoming.forEach((entry) => {
        const id = entry && typeof entry === 'object' ? str(entry.id) : '';
        if (!id) {
            errors.push('An answer was submitted without a question id.');
            return;
        }

        const question = byId.get(id);
        if (!question) {
            errors.push(`Unknown question "${id}" for this role.`);
            return;
        }
        if (seen.has(id)) {
            errors.push(`Question "${id}" was answered twice.`);
            return;
        }
        seen.add(id);

        const answer = str(entry.answer);
        if (answer.length > question.maxLength) {
            errors.push(`Your answer to "${question.prompt}" is over ${question.maxLength} characters.`);
            return;
        }

        answers.push({ id, prompt: question.prompt, answer });
    });

    questions.forEach((question) => {
        if (!question.required) return;
        const given = answers.find(a => a.id === question.id);
        if (!given || !given.answer) {
            errors.push(`Please answer: ${question.prompt}`);
        }
    });

    return { errors, answers };
}

/** Shape, length and format checks for everything the candidate typed. */
function validateApplication(body) {
    const errors = [];
    const data = body && typeof body === 'object' ? body : {};

    const role = findRole(str(data.roleSlug));
    if (!role) {
        return { errors: ['We could not find that role. It may have been taken down.'], role: null };
    }
    if (!isAdvertised(role)) {
        return { errors: ['This role is no longer accepting applications.'], role };
    }

    const fields = {};
    Object.keys(LIMITS).forEach((key) => {
        fields[key] = str(data[key]);
        if (fields[key].length > LIMITS[key]) {
            errors.push(`${key} is longer than ${LIMITS[key]} characters.`);
        }
    });

    if (!fields.fullName) errors.push('Please tell us your name.');
    if (!EMAIL_RE.test(fields.email)) errors.push('Please give us a valid email address.');

    ['linkedin', 'portfolio', 'cvUrl'].forEach((key) => {
        if (fields[key] && !isUsableUrl(fields[key])) {
            errors.push(`${key} must be a full http(s) link.`);
        }
    });

    const cv = validateCv(data.cvFile, errors);
    if (!cv && !fields.cvUrl) {
        errors.push('Please upload your CV as a PDF or provide a link to it.');
    }
    const { errors: answerErrors, answers } = validateAnswers(role, data.answers);

    return { errors: errors.concat(answerErrors), role, fields, answers, cv };
}

function validateCv(cvFile, errors) {
    if (!cvFile || typeof cvFile !== 'object') return null;

    const name = str(cvFile.name);
    const content = typeof cvFile.content === 'string' ? cvFile.content : '';

    if (!content) return null;

    if (!/\.pdf$/i.test(name)) {
        errors.push('The attachment must be a PDF.');
        return null;
    }
    if (content.length > MAX_CV_BASE64_CHARS) {
        errors.push('That attachment is over 3 MB. Please send a link instead.');
        return null;
    }

    const bytes = Buffer.from(content, 'base64').length;
    if (!bytes) {
        errors.push('We could not read that attachment. Please send a link instead.');
        return null;
    }
    if (bytes > MAX_CV_BYTES) {
        errors.push('That attachment is over 3 MB. Please send a link instead.');
        return null;
    }

    return { name, content };
}

// ---------------------------------------------------------------------------
// Composition
// ---------------------------------------------------------------------------

function escapeHtml(value) {
    return String(value == null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/** Preserves the candidate's paragraph breaks without trusting their markup. */
function escapeParagraphs(value) {
    return String(value == null ? '' : value)
        .split(/\n{2,}/)
        .map(p => p.trim())
        .filter(Boolean)
        .map(p => `<p style="margin:0 0 12px;">${escapeHtml(p).replace(/\n/g, '<br>')}</p>`)
        .join('');
}

/**
 * The one-line-per-answer digest stored on the Brevo contact. Brevo text
 * attributes are capped, so this is the searchable summary — the untruncated
 * text lives in the notification email.
 */
function answersSummary(answers) {
    return answers
        .map(a => `${a.id}: ${a.answer}`)
        .join(' | ')
        .substring(0, ATTRIBUTE_TEXT_LIMIT);
}

/** Founder notification. Carries the full, untruncated answers. */
function notificationHtml({ role, fields, answers, hasCv, submittedAt }) {
    const row = (label, value) => (value
        ? `<tr><td style="padding:6px 16px 6px 0;color:#6b7684;font-size:13px;white-space:nowrap;">${escapeHtml(label)}</td>`
          + `<td style="padding:6px 0;color:#0a2f52;font-size:14px;">${escapeHtml(value)}</td></tr>`
        : '');

    const answerBlocks = answers.map(a => `
        <div style="margin:0 0 26px;">
            <p style="margin:0 0 8px;color:#0a2f52;font-size:14px;font-weight:600;">${escapeHtml(a.prompt)}</p>
            <div style="color:#3d4c5c;font-size:14px;line-height:1.7;">
                ${a.answer ? escapeParagraphs(a.answer) : '<p style="margin:0;color:#98a2b3;">(no answer)</p>'}
            </div>
        </div>`).join('');

    return `<div style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;max-width:640px;">
        <p style="margin:0 0 4px;color:#db4a2b;font-size:11px;letter-spacing:.16em;text-transform:uppercase;">New application</p>
        <h1 style="margin:0 0 20px;color:#0a2f52;font-size:22px;font-weight:600;">${escapeHtml(role.title)}</h1>

        <table style="border-collapse:collapse;margin:0 0 28px;">
            ${row('Name', fields.fullName)}
            ${row('Email', fields.email)}
            ${row('Based in', fields.location)}
            ${row('Notice', fields.noticePeriod)}
            ${row('LinkedIn', fields.linkedin)}
            ${row('Portfolio', fields.portfolio)}
            ${row('CV link', fields.cvUrl)}
            ${row('CV attached', hasCv ? 'Yes — see attachment' : '')}
            ${row('Submitted', submittedAt)}
        </table>

        <hr style="border:none;border-top:1px solid #e3e6ea;margin:0 0 26px;">
        ${answerBlocks || '<p style="color:#98a2b3;font-size:14px;">No additional information provided.</p>'}
    </div>`;
}

module.exports = {
    findRole,
    isAdvertised,
    validateApplication,
    answersSummary,
    notificationHtml,
    MAX_CV_BYTES
};
