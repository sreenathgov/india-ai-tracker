/**
 * HTML renderers for the careers surface.
 *
 * Two consumers: the listing (cards, filter pills) and the role detail page
 * (meta chips, JD sections, the screening-question fields). Both draw from the
 * same role object, so a data edit propagates to every surface at once.
 */

const {
    WORK_MODE_LABELS,
    EMPLOYMENT_TYPE_LABELS,
    STATUS_LABELS,
    CLOSED_STATUSES,
    locationLabel,
    formatDate,
    escapeHtml
} = require('./schema');

function isAdvertised(role) {
    return !CLOSED_STATUSES.includes(role.status);
}

/** Compact metadata shared by listing rows and role headers. */
function metaChips(role) {
    return [locationLabel(role), WORK_MODE_LABELS[role.workMode],
        EMPLOYMENT_TYPE_LABELS[role.employmentType]].filter(Boolean);
}

function renderChip(text) {
    return `<li class="cr-tag"><span class="cr-tag__dot" aria-hidden="true"></span>${escapeHtml(text)}</li>`;
}

function renderStatusBadge(status) {
    if (status === 'open') return '';
    const modifier = status.replace(/[^a-z-]/g, '');
    return `<span class="cr-badge cr-badge--${modifier}">${escapeHtml(STATUS_LABELS[status] || status)}</span>`;
}

// ---------------------------------------------------------------------------
// Listing
// ---------------------------------------------------------------------------

function renderRoleRow(role) {
    const href = `/careers/${role.slug}/`;
    const chips = metaChips(role).map(renderChip).join('');

    return `<article class="cr-role" data-team="${escapeHtml(role.team)}" data-slug="${escapeHtml(role.slug)}">
    <div class="cr-role__body">
        <h3 class="cr-role__title">
            <a href="${href}">${escapeHtml(role.title)}</a>${renderStatusBadge(role.status)}
        </h3>
        <p class="cr-role__summary">${escapeHtml(role.summary)}</p>
        <ul class="cr-role__meta">${chips}</ul>
    </div>
    <div class="cr-role__aside">
        <a class="cr-role__apply" href="${href}" aria-label="View role: ${escapeHtml(role.title)}">
            <span>View role</span>
            <span class="cr-role__apply-arrow">&#8599;</span>
        </a>
    </div>
</article>`;
}

/**
 * The count line above the grid. Rendered server-side so the no-JS baseline
 * and the first paint agree; js/careers.js rewrites it when a filter changes.
 */
function renderCount(roles) {
    const n = roles.length;
    return n === 1 ? '1 open role' : `${n} open roles`;
}

// ---------------------------------------------------------------------------
// Detail page
// ---------------------------------------------------------------------------

/** Plain-text paragraphs separated by \n\n become <p> elements. */
function renderParagraphs(text) {
    return String(text || '')
        .split(/\n{2,}/)
        .map(p => p.trim())
        .filter(Boolean)
        .map(p => `<p>${escapeHtml(p)}</p>`)
        .join('\n                    ');
}

function renderListItems(items) {
    return (items || [])
        .map(item => `<li>${escapeHtml(item)}</li>`)
        .join('\n                        ');
}

function renderNiceToHave(role) {
    if (!Array.isArray(role.niceToHave) || !role.niceToHave.length) return '';
    return `<section class="crd-block" aria-labelledby="crd-nice">
                    <h2 class="crd-block__title" id="crd-nice">Preferred experience</h2>
                    <ul class="crd-list">
                        ${renderListItems(role.niceToHave)}
                    </ul>
                </section>`;
}

/** The sticky summary rail beside the JD. */
function renderRail(role) {
    const rows = [
        ['Team', role.team],
        ['Location', [role.location.city, role.location.region, role.location.country === 'IN' ? 'India' : role.location.country].join(', ')],
        ['Work mode', WORK_MODE_LABELS[role.workMode]],
        ['Employment', EMPLOYMENT_TYPE_LABELS[role.employmentType]],
        ['Applications', formatDate(role.applyBy) ? `Close ${formatDate(role.applyBy)}` : 'Open'],
        ['Posted', formatDate(role.datePosted)]
    ];

    return rows
        .filter(([, value]) => Boolean(value))
        .map(([term, value]) => `<div class="crd-rail__row">
                        <dt>${escapeHtml(term)}</dt>
                        <dd>${escapeHtml(value)}</dd>
                    </div>`)
        .join('\n                    ');
}

/**
 * One field per screening question. `data-question-id` is what
 * js/careers-apply.js posts back and what api/apply.js validates against, so
 * this markup and the endpoint stay in agreement by construction.
 */
function renderQuestions(role) {
    const questions = Array.isArray(role.questions) ? role.questions : [];
    if (!questions.length) return '';

    return questions.map((q) => {
        const fieldId = `ap-q-${q.id}`;
        const optional = q.required ? '' : ' <span>Optional</span>';
        const hint = q.hint
            ? `\n                            <p class="crd-field__hint">${escapeHtml(q.hint)}</p>`
            : '';

        return `<div class="crd-field crd-field--question">
                            <label for="${escapeHtml(fieldId)}">${escapeHtml(q.prompt)}${optional}</label>
                            <textarea id="${escapeHtml(fieldId)}"
                                      data-question-id="${escapeHtml(q.id)}"
                                      rows="5"
                                      maxlength="${q.maxLength}"
                                      ${q.required ? 'data-required="true"' : ''}></textarea>${hint}
                            <p class="crd-field__counter" data-counter-for="${escapeHtml(fieldId)}">
                                <span>0</span> / ${q.maxLength}
                            </p>
                            <p class="crd-field__error" id="${escapeHtml(fieldId)}-error"></p>
                        </div>`;
    }).join('\n\n                        ');
}

module.exports = {
    isAdvertised,
    metaChips,
    renderChip,
    renderStatusBadge,
    renderRoleRow,
    renderCount,
    renderParagraphs,
    renderListItems,
    renderNiceToHave,
    renderRail,
    renderQuestions
};
