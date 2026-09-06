/**
 * Blocking validation for data/careers.json.
 *
 * This is deliberately strict and deliberately fatal. A careers page that
 * half-renders — a role with no summary, an apply button pointing at a slug
 * that was never generated, a question the endpoint will reject — is worse
 * than a red build, because nobody notices it until a candidate does.
 *
 * Returns a flat array of human-readable error strings. Empty array = valid.
 */

const {
    WORK_MODES,
    EMPLOYMENT_TYPES,
    SENIORITIES,
    STATUSES,
    SLUG_RE,
    QUESTION_ID_RE,
    ISO_DATE_RE,
    QUESTION_MIN_LENGTH,
    QUESTION_MAX_LENGTH
} = require('./schema');

const REQUIRED_STRINGS = [
    'slug', 'title', 'team', 'workMode', 'employmentType',
    'seniority', 'status', 'datePosted', 'summary', 'description'
];

const REQUIRED_ARRAYS = ['responsibilities', 'lookingFor'];

const SUMMARY_MAX = 200;

function isNonEmptyString(v) {
    return typeof v === 'string' && v.trim().length > 0;
}

function validateEnum(errors, where, field, value, allowed) {
    if (!allowed.includes(value)) {
        errors.push(`${where}: ${field} is "${value}" — must be one of ${allowed.join(' | ')}`);
    }
}

function validateStringArray(errors, where, field, value) {
    if (!Array.isArray(value)) {
        errors.push(`${where}: ${field} must be an array of strings`);
        return;
    }
    if (!value.length) {
        errors.push(`${where}: ${field} is empty — a role with no ${field} is not ready to publish`);
        return;
    }
    value.forEach((entry, i) => {
        if (!isNonEmptyString(entry)) {
            errors.push(`${where}: ${field}[${i}] is not a non-empty string`);
        }
    });
}

function validateQuestions(errors, where, questions) {
    if (questions === undefined) return;
    if (!Array.isArray(questions)) {
        errors.push(`${where}: questions must be an array (use [] for none)`);
        return;
    }

    const seen = new Set();
    questions.forEach((q, i) => {
        const at = `${where}: questions[${i}]`;

        if (!q || typeof q !== 'object') {
            errors.push(`${at} is not an object`);
            return;
        }
        if (!isNonEmptyString(q.id)) {
            errors.push(`${at}.id is missing — the id is the answer key the endpoint validates against`);
        } else if (!QUESTION_ID_RE.test(q.id)) {
            errors.push(`${at}.id "${q.id}" must match [a-z0-9][a-z0-9_-]*`);
        } else if (seen.has(q.id)) {
            errors.push(`${at}.id "${q.id}" is duplicated within this role — answers would collide`);
        } else {
            seen.add(q.id);
        }

        if (!isNonEmptyString(q.prompt)) {
            errors.push(`${at}.prompt is missing`);
        }
        if (q.hint !== undefined && !isNonEmptyString(q.hint)) {
            errors.push(`${at}.hint is present but empty — omit the key instead`);
        }
        if (!Number.isInteger(q.maxLength)
            || q.maxLength < QUESTION_MIN_LENGTH
            || q.maxLength > QUESTION_MAX_LENGTH) {
            errors.push(`${at}.maxLength must be an integer between `
                + `${QUESTION_MIN_LENGTH} and ${QUESTION_MAX_LENGTH}`);
        }
        if (typeof q.required !== 'boolean') {
            errors.push(`${at}.required must be true or false`);
        }
    });
}

function validateRole(errors, role, index, teams, slugsSeen) {
    const label = (role && role.slug) ? `role "${role.slug}"` : `roles[${index}]`;

    if (!role || typeof role !== 'object') {
        errors.push(`${label} is not an object`);
        return;
    }

    REQUIRED_STRINGS.forEach((field) => {
        if (!isNonEmptyString(role[field])) {
            errors.push(`${label}: ${field} is missing or empty`);
        }
    });

    ['city', 'region', 'country'].forEach(field => {
        if (!isNonEmptyString(role.location?.[field])) {
            errors.push(`${label}: location.${field} is missing or empty`);
        }
    });
    if (role.location?.country && !/^[A-Z]{2}$/.test(role.location.country)) {
        errors.push(`${label}: location.country must be a two-letter country code`);
    }

    if (isNonEmptyString(role.slug)) {
        if (!SLUG_RE.test(role.slug)) {
            errors.push(`${label}: slug must be lower-case kebab-case ([a-z0-9] separated by single hyphens)`);
        }
        if (slugsSeen.has(role.slug)) {
            errors.push(`${label}: duplicate slug — two roles would write to the same /careers/${role.slug}/`);
        }
        slugsSeen.add(role.slug);
    }

    if (isNonEmptyString(role.team) && !teams.includes(role.team)) {
        errors.push(`${label}: team "${role.team}" is not in teams[] — add it there or fix the typo`);
    }

    if (isNonEmptyString(role.workMode)) validateEnum(errors, label, 'workMode', role.workMode, WORK_MODES);
    if (isNonEmptyString(role.employmentType)) validateEnum(errors, label, 'employmentType', role.employmentType, EMPLOYMENT_TYPES);
    if (isNonEmptyString(role.seniority)) validateEnum(errors, label, 'seniority', role.seniority, SENIORITIES);
    if (isNonEmptyString(role.status)) validateEnum(errors, label, 'status', role.status, STATUSES);

    if (isNonEmptyString(role.datePosted) && !ISO_DATE_RE.test(role.datePosted)) {
        errors.push(`${label}: datePosted "${role.datePosted}" must be YYYY-MM-DD`);
    }
    if (role.applyBy !== null && role.applyBy !== undefined) {
        if (!ISO_DATE_RE.test(String(role.applyBy))) {
            errors.push(`${label}: applyBy "${role.applyBy}" must be YYYY-MM-DD, or null for a rolling role`);
        } else if (ISO_DATE_RE.test(role.datePosted || '') && role.applyBy < role.datePosted) {
            errors.push(`${label}: applyBy (${role.applyBy}) is before datePosted (${role.datePosted})`);
        }
    }

    if (isNonEmptyString(role.summary) && role.summary.trim().length > SUMMARY_MAX) {
        errors.push(`${label}: summary is ${role.summary.trim().length} chars — keep it under ${SUMMARY_MAX} `
            + `so the card stays one readable line`);
    }

    REQUIRED_ARRAYS.forEach((field) => validateStringArray(errors, label, field, role[field]));

    if (role.niceToHave !== undefined && !Array.isArray(role.niceToHave)) {
        errors.push(`${label}: niceToHave must be an array (omit the key entirely to hide the section)`);
    }

    validateQuestions(errors, label, role.questions);
}

/**
 * @param {object} data  parsed data/careers.json
 * @returns {string[]}   blocking errors; empty means the data is publishable
 */
function validateCareers(data) {
    const errors = [];

    if (!data || typeof data !== 'object') {
        return ['data/careers.json did not parse to an object'];
    }
    if (!isNonEmptyString(data.companyDescription)) {
        errors.push('companyDescription is missing or empty');
    }
    if (!Array.isArray(data.teams) || !data.teams.length) {
        errors.push('teams[] is missing or empty — every role must belong to a declared team');
    }
    if (!Array.isArray(data.roles)) {
        return errors.concat('roles[] is missing or is not an array');
    }
    if (!data.roles.length) {
        errors.push('roles[] is empty — the careers page would publish with nothing on it');
    }

    const teams = Array.isArray(data.teams) ? data.teams : [];
    const slugsSeen = new Set();
    data.roles.forEach((role, i) => validateRole(errors, role, i, teams, slugsSeen));

    return errors;
}

module.exports = { validateCareers };
