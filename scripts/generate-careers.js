#!/usr/bin/env node
/**
 * generate-careers.js — build the careers surface from data/careers.json.
 *
 *   data/careers.json  ──┬──▶  dist/careers.html                  (listing)
 *                        └──▶  dist/careers/<slug>/index.html     (one per role)
 *
 * Mirrors the resources/publications split: careers.html at the repo root is a
 * TEMPLATE with empty injection anchors and is never served. It is deliberately
 * absent from FILES_TO_COPY in scripts/build-full-site.js — copying it would
 * ship a page with no roles on it.
 *
 * Malformed data fails the build (exit 1). See scripts/careers/validate.js for
 * why that is the right trade.
 */

const fs = require('fs');
const path = require('path');

const { validateCareers } = require('./careers/validate');
const { listingJsonLd, roleJsonLd } = require('./careers/jsonld');
const { escapeHtml, escapeJsonForScript } = require('./careers/schema');
const {
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
} = require('./careers/render');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const DATA_FILE = path.join(PROJECT_ROOT, 'data', 'careers.json');
const LISTING_TEMPLATE = path.join(PROJECT_ROOT, 'careers.html');
const ROLE_TEMPLATE = path.join(PROJECT_ROOT, 'templates', 'career-role.html');
const DIST_DIR = path.join(PROJECT_ROOT, 'dist');

const BASE_URL = 'https://kananlabs.in';

// ---------------------------------------------------------------------------
// Injection helpers
// ---------------------------------------------------------------------------

/**
 * Replace the inner content of an element addressed by id, leaving its opening
 * tag (and every attribute on it) untouched. Same contract as the publications
 * catalog injector — a template that loses an anchor must fail loudly rather
 * than silently ship an empty section.
 */
function replaceById(html, id, inner, label) {
    const pattern = new RegExp(`(<([a-zA-Z][\\w-]*)[^>]*\\bid="${id}"[^>]*>)([\\s\\S]*?)(</\\2>)`);
    if (!pattern.test(html)) {
        throw new Error(`careers.html: could not find #${id} to inject ${label}. `
            + 'The generator and the page template have diverged — fix the template, not this error.');
    }
    return html.replace(pattern, (_m, open, _tag, _old, close) => `${open}${inner}${close}`);
}

function injectJsonLd(html, jsonLd) {
    if (!html.includes('</head>')) {
        throw new Error('careers.html: no </head> to inject JSON-LD into');
    }
    return html.replace('</head>', `<script type="application/ld+json">\n${jsonLd}\n    </script>\n</head>`);
}

/** Substitute every {{TOKEN}} and fail if any survives. */
function fillTemplate(template, tokens, label) {
    let out = template;
    Object.entries(tokens).forEach(([key, value]) => {
        out = out.split(`{{${key}}}`).join(value);
    });

    const leftover = out.match(/\{\{[A-Z0-9_]+\}\}/g);
    if (leftover) {
        throw new Error(`${label}: unresolved template token(s) ${[...new Set(leftover)].join(', ')}`);
    }
    return out;
}

// ---------------------------------------------------------------------------
// Listing
// ---------------------------------------------------------------------------

function writeListing(data, advertised) {
    let html = fs.readFileSync(LISTING_TEMPLATE, 'utf-8');

    // The client-side payload carries only what the filter needs, not the full
    // JD — the detail pages already hold that, and shipping it twice would add
    // ~30 KB to every careers.html request for no benefit.
    const payload = {
        roles: advertised.map(r => ({
            slug: r.slug,
            title: r.title,
            team: r.team,
            workMode: r.workMode,
            employmentType: r.employmentType,
            status: r.status
        }))
    };

    html = replaceById(html, 'careers-data',
        escapeJsonForScript(JSON.stringify(payload)), 'roles payload');
    html = replaceById(html, 'careersFilters',
        renderFilters(data.teams, advertised), 'filter pills');
    html = replaceById(html, 'careersGrid',
        advertised.map(renderRoleRow).join('\n'), 'role rows');
    html = replaceById(html, 'careersCount',
        renderCount(advertised), 'role count');
    html = injectJsonLd(html, listingJsonLd(advertised));

    fs.mkdirSync(DIST_DIR, { recursive: true });
    fs.writeFileSync(path.join(DIST_DIR, 'careers.html'), html);
}

// ---------------------------------------------------------------------------
// Role detail pages
// ---------------------------------------------------------------------------

const CLOSED_NOTICE = `<div class="crd-closed" role="status">
                    <p class="crd-closed__kicker">This role is closed</p>
                    <p>We are no longer accepting applications for this position.
                       <a href="/careers.html">See what else is open</a>.</p>
                </div>`;

// Heading + form, swapped out wholesale on a closed role. Non-greedy, and the
// apply form is the first </form> in the document — the footer newsletter form
// comes later — so this cannot over-match.
const APPLY_BLOCK_RE = /<div class="crd-apply__heading"[\s\S]*?<\/form>/;

function writeRolePage(template, role) {
    const advertised = isAdvertised(role);
    const canonical = `${BASE_URL}/careers/${role.slug}/`;

    const html = fillTemplate(template, {
        TITLE_TAG: escapeHtml(`${role.title} — Careers | Kanan Labs`),
        META_DESCRIPTION: escapeHtml(role.summary),
        OG_TITLE: escapeHtml(`${role.title} — Kanan Labs`),
        CANONICAL_URL: canonical,
        ROBOTS: advertised ? 'index,follow,max-image-preview:large' : 'noindex,follow',
        JSON_LD: roleJsonLd(role, { advertised }),

        ROLE_SLUG: escapeHtml(role.slug),
        ROLE_TITLE: escapeHtml(role.title),
        TEAM: escapeHtml(role.team),
        STATUS_BADGE: renderStatusBadge(role.status),
        META_CHIPS: metaChips(role).map(renderChip).join('\n                '),
        TIMELINE_LINE: renderTimelineLine(role),

        DESCRIPTION_HTML: renderParagraphs(role.description),
        RESPONSIBILITIES_HTML: renderListItems(role.responsibilities),
        LOOKING_FOR_HTML: renderListItems(role.lookingFor),
        NICE_TO_HAVE_BLOCK: renderNiceToHave(role),
        RAIL_HTML: renderRail(role),
        QUESTIONS_HTML: renderQuestions(role)
    }, `careers/${role.slug}`);

    let finalHtml = html;
    if (!advertised) {
        if (!APPLY_BLOCK_RE.test(finalHtml)) {
            throw new Error(`careers/${role.slug}: role is closed but the apply block could not be `
                + 'located to remove it — templates/career-role.html has changed shape.');
        }
        finalHtml = finalHtml.replace(APPLY_BLOCK_RE, CLOSED_NOTICE);
    }

    const outDir = path.join(DIST_DIR, 'careers', role.slug);
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, 'index.html'), finalHtml);
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

function generateCareers() {
    let data;
    try {
        data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    } catch (err) {
        console.error(`\n❌ Careers: could not read data/careers.json — ${err.message}\n`);
        process.exit(1);
    }

    const errors = validateCareers(data);
    if (errors.length) {
        console.error(`\n❌ Careers: ${errors.length} blocking error(s) — nothing written:`);
        errors.forEach(e => console.error(`   ✗ ${e}`));
        console.error('');
        process.exit(1);
    }

    const advertised = data.roles.filter(isAdvertised);
    const closed = data.roles.length - advertised.length;

    try {
        writeListing(data, advertised);
        const roleTemplate = fs.readFileSync(ROLE_TEMPLATE, 'utf-8');
        data.roles.forEach(role => writeRolePage(roleTemplate, role));
    } catch (err) {
        console.error(`\n❌ Careers: ${err.message}\n`);
        process.exit(1);
    }

    console.log(`✅ Careers generated at: ${path.join(DIST_DIR, 'careers.html')}`);
    console.log(`   - Advertised roles: ${advertised.length}`);
    console.log(`   - Closed roles (noindex, no JobPosting): ${closed}`);
    console.log(`   - Role pages: ${data.roles.length}`);
}

generateCareers();
