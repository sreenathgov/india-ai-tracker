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
    SENIORITY_LABELS,
    STATUS_LABELS,
    CLOSED_STATUSES,
    applyByLabel,
    formatDate,
    escapeHtml
} = require('./schema');

const ALL_TEAMS_FILTER = 'all';

function isAdvertised(role) {
    return !CLOSED_STATUSES.includes(role.status);
}

/**
 * True when the location string already says the work mode, e.g. workMode
 * `remote` with location "Remote (IST overlap) / Chennai" — which would
 * otherwise chip out as "REMOTE · REMOTE (IST OVERLAP) / CHENNAI".
 *
 * Whole-word only, so a `hybrid` role located at "Chennai / Remote" keeps its
 * Hybrid chip — that pair carries two different facts, not one repeated.
 */
function locationStatesWorkMode(role) {
    const label = WORK_MODE_LABELS[role.workMode];
    if (!label || !role.location) return false;
    const escaped = label.replace(/[.*+?^${}()|[\]\\-]/g, '\\$&');
    return new RegExp(`\\b${escaped}\\b`, 'i').test(role.location);
}

/** The chip set shown under a role title, in fixed reading order. */
function metaChips(role) {
    return [
        EMPLOYMENT_TYPE_LABELS[role.employmentType],
        locationStatesWorkMode(role) ? null : WORK_MODE_LABELS[role.workMode],
        role.location,
        applyByLabel(role.applyBy)
    ].filter(Boolean);
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

function renderFilters(teams, roles) {
    const present = teams.filter(team => roles.some(r => r.team === team));
    const buttons = [
        `<button class="cr-filter is-active" type="button" data-team="${ALL_TEAMS_FILTER}" aria-pressed="true">`
        + `View all<span class="cr-filter__count">${roles.length}</span></button>`
    ];

    present.forEach((team) => {
        const count = roles.filter(r => r.team === team).length;
        buttons.push(
            `<button class="cr-filter" type="button" data-team="${escapeHtml(team)}" aria-pressed="false">`
            + `${escapeHtml(team)}<span class="cr-filter__count">${count}</span></button>`
        );
    });

    return buttons.join('\n');
}

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
        <a class="cr-role__apply" href="${href}" tabindex="-1" aria-hidden="true">
            <span>Apply</span>
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
                    <h2 class="crd-block__title" id="crd-nice">Nice to have</h2>
                    <ul class="crd-list">
                        ${renderListItems(role.niceToHave)}
                    </ul>
                </section>`;
}

/** The sticky summary rail beside the JD. */
function renderRail(role) {
    const rows = [
        ['Team', role.team],
        ['Location', role.location],
        ['Work mode', WORK_MODE_LABELS[role.workMode]],
        ['Employment', EMPLOYMENT_TYPE_LABELS[role.employmentType]],
        ['Level', SENIORITY_LABELS[role.seniority]],
        ['Hiring timeline', role.timeline],
        ['Applications', formatDate(role.applyBy) ? `Close ${formatDate(role.applyBy)}` : 'Rolling'],
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

/** The one-line hiring-runway note under the apply button in the navy band. */
function renderTimelineLine(role) {
    const close = formatDate(role.applyBy);
    const closing = close ? `Applications close ${close}.` : 'Applications reviewed weekly.';
    return `${escapeHtml(role.timeline)}. ${closing}`;
}

module.exports = {
    ALL_TEAMS_FILTER,
    isAdvertised,
    metaChips,
    renderChip,
    renderStatusBadge,
    renderFilters,
    renderRoleRow,
    renderCount,
    renderParagraphs,
    renderListItems,
    renderNiceToHave,
    renderRail,
    renderQuestions,
    renderTimelineLine
};
