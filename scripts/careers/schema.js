/**
 * Careers schema — the enums and small formatters shared by the validator,
 * the renderers and the JSON-LD builder.
 *
 * Everything the careers surface knows about the *shape* of a role lives here,
 * so adding a field means touching one vocabulary, not four files.
 */

const WORK_MODES = ['on-site', 'hybrid', 'remote'];
const EMPLOYMENT_TYPES = ['full-time', 'contract', 'internship'];
const SENIORITIES = ['junior', 'mid', 'senior', 'founding'];
const STATUSES = ['open', 'rolling', 'closing-soon', 'filled'];

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const QUESTION_ID_RE = /^[a-z0-9][a-z0-9_-]*$/;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const QUESTION_MIN_LENGTH = 100;
const QUESTION_MAX_LENGTH = 4000;

/** Roles with this status are not advertised: no card, no sitemap entry, no JobPosting. */
const CLOSED_STATUSES = ['filled'];

const WORK_MODE_LABELS = {
    'on-site': 'On-site',
    'hybrid': 'Hybrid',
    'remote': 'Remote'
};

const EMPLOYMENT_TYPE_LABELS = {
    'full-time': 'Full-time',
    'contract': 'Contract',
    'internship': 'Internship'
};

const SENIORITY_LABELS = {
    'junior': 'Junior',
    'mid': 'Mid-level',
    'senior': 'Senior',
    'founding': 'Founding'
};

const STATUS_LABELS = {
    'open': 'Open',
    'rolling': 'Rolling',
    'closing-soon': 'Closing soon',
    'filled': 'Filled'
};

/** Display and structured metadata both read the role's structured address. */
function locationLabel(role) {
    return role.location.city;
}

/** schema.org employmentType values, keyed by our own vocabulary. */
const SCHEMA_EMPLOYMENT_TYPE = {
    'full-time': 'FULL_TIME',
    'contract': 'CONTRACTOR',
    'internship': 'INTERN'
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** '2026-09-30' → '30 Sep 2026'. Returns '' for a falsy or malformed input. */
function formatDate(iso) {
    if (!iso || !ISO_DATE_RE.test(iso)) return '';
    const [y, m, d] = iso.split('-');
    const month = MONTHS[parseInt(m, 10) - 1];
    if (!month) return '';
    return `${parseInt(d, 10)} ${month} ${y}`;
}

/** The one-line answer to "when do applications close?" — used in chips and the rail. */
function applyByLabel(applyBy) {
    const formatted = formatDate(applyBy);
    return formatted ? `Applications close ${formatted}` : 'Applications open';
}

/**
 * HTML-escape. Role copy is authored by hand in data/careers.json rather than
 * submitted by users, but it still reaches the DOM as markup — an unescaped
 * ampersand in a job title is enough to break a page, and the discipline costs
 * nothing.
 */
function escapeHtml(value) {
    return String(value == null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/** Escape for embedding JSON inside a <script> block without closing it early. */
function escapeJsonForScript(json) {
    return json.replace(/</g, '\\u003c').replace(/>/g, '\\u003e');
}

module.exports = {
    locationLabel,
    WORK_MODES,
    EMPLOYMENT_TYPES,
    SENIORITIES,
    STATUSES,
    CLOSED_STATUSES,
    SLUG_RE,
    QUESTION_ID_RE,
    ISO_DATE_RE,
    QUESTION_MIN_LENGTH,
    QUESTION_MAX_LENGTH,
    WORK_MODE_LABELS,
    EMPLOYMENT_TYPE_LABELS,
    SENIORITY_LABELS,
    STATUS_LABELS,
    SCHEMA_EMPLOYMENT_TYPE,
    formatDate,
    applyByLabel,
    escapeHtml,
    escapeJsonForScript
};
