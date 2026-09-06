/**
 * resources-catalog.js — the Resources page, generated from the manifest.
 *
 * This is the single catalog surface. It merges two sources:
 *
 *   - content/publications/index.json   → the "insight" bucket (generated)
 *   - data/resources-extra.json         → whitepapers + news (curated by hand)
 *
 * and writes dist/resources.html.
 *
 * Cards are PRERENDERED into the grid rather than left to js/resources.js to
 * draw on load. The point of this pipeline is SEO/AEO — a crawler that runs no
 * JavaScript must still see every card. js/resources.js re-renders the same
 * markup from the same embedded JSON on init, so the two agree and there is no
 * flash; it owns filtering and pagination from there.
 *
 * Nothing here is maintained by hand. Adding an article is adding one file.
 */

const fs = require('fs');
const path = require('path');
const { validateResourceItems } = require('./validate');
const { siteEntityNodes } = require('./entities');

const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const PAGE_TEMPLATE = path.join(PROJECT_ROOT, 'resources.html');
const EXTRA_ITEMS_PATH = path.join(PROJECT_ROOT, 'data', 'resources-extra.json');
const RESOURCES_JS = path.join(PROJECT_ROOT, 'js', 'resources.js');
const BASE_URL = 'https://kananlabs.in';

// Mirrors js/resources.js — keep in lockstep.
const BUCKET_LABELS = Object.freeze({
    insight: 'Insight',
    whitepaper: 'Whitepaper',
    news: 'News & Press'
});
const FALLBACK_TILE_SRC = 'assets/logos/kanan-kl-hor-white.png';
const PAGE_SIZE = 9;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function escapeHtmlText(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function escapeHtmlAttribute(value) {
    return escapeHtmlText(value).replace(/"/g, '&quot;');
}

function isExternal(href) {
    return /^https?:\/\//i.test(String(href));
}

// Matches js/resources.js formatDate(). The browser parses 'T00:00:00' as local
// midnight and we parse 'T00:00:00Z' as UTC midnight — same calendar date, so
// both render the same string and the hydrated DOM matches the prerendered one.
function formatDate(iso) {
    if (typeof iso !== 'string') return '';
    const date = new Date(`${iso}T00:00:00Z`);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC'
    });
}

// ---------------------------------------------------------------------------
// Item assembly
// ---------------------------------------------------------------------------

// Manifest entry → Resources item. The manifest stores `image` relative to the
// article directory ('assets/cover.png'), so it needs the slug prefix to
// resolve from the catalog page at the site root.
function manifestToItem(entry) {
    const href = `publications/${entry.slug}/`;
    return {
        slug: entry.slug,
        bucket: 'insight',
        title: entry.title,
        description: entry.description,
        date: entry.date,
        image: entry.image ? `${href}${entry.image}` : null,
        href
    };
}

function readExtraItems() {
    if (!fs.existsSync(EXTRA_ITEMS_PATH)) return [];
    const parsed = JSON.parse(fs.readFileSync(EXTRA_ITEMS_PATH, 'utf-8'));
    const items = Array.isArray(parsed) ? parsed : parsed.items;
    if (!Array.isArray(items)) {
        throw new Error(`${path.relative(PROJECT_ROOT, EXTRA_ITEMS_PATH)}: expected an "items" array`);
    }
    // Insights are generated; a hand-written one would silently compete with
    // the manifest entry for the same slug.
    items.forEach(item => {
        if (item && item.bucket === 'insight') {
            throw new Error(
                `${path.relative(PROJECT_ROOT, EXTRA_ITEMS_PATH)}: item "${item.title}" uses bucket "insight" — `
                + `insights are generated from the publications manifest. Use whitepaper or news.`);
        }
    });
    return items;
}

function byDateDesc(a, b) {
    return String(b.date || '').localeCompare(String(a.date || ''));
}

/**
 * Merge manifest + curated entries into the render list.
 * Newest item is featured unless a curated entry claims it explicitly.
 */
function buildItems(manifest) {
    const items = [...manifest.map(manifestToItem), ...readExtraItems()].sort(byDateDesc);

    if (!items.some(i => i.featured === true)) {
        const newest = items.find(i => i.bucket === 'insight') || items[0];
        if (newest) newest.featured = true;
    }
    return items;
}

// ---------------------------------------------------------------------------
// Prerendering — mirrors the DOM builders in js/resources.js
// ---------------------------------------------------------------------------

function renderMedia(item, mediaClass) {
    const img = src => `<img src="${escapeHtmlAttribute(src)}" alt="" loading="lazy" decoding="async">`;
    return item.image
        ? `<div class="${mediaClass}">${img(item.image)}</div>`
        : `<div class="${mediaClass} rc-media--fallback">${img(FALLBACK_TILE_SRC)}</div>`;
}

function renderLinkAttrs(item) {
    const href = ` href="${escapeHtmlAttribute(item.href)}"`;
    return isExternal(item.href) ? `${href} target="_blank" rel="noopener noreferrer"` : href;
}

function renderMetaRow(item) {
    const parts = [];
    if (item.bucket === 'whitepaper' && item.meta && Number.isFinite(item.meta.pages)) {
        parts.push(`PDF · ${item.meta.pages} pages`);
    }
    if (item.bucket === 'news' && item.meta && item.meta.source) {
        parts.push(String(item.meta.source) + (isExternal(item.href) ? ' ↗' : ''));
    }
    const dateText = formatDate(item.date);
    if (dateText) parts.push(dateText);

    return `<div class="rc-card__meta">`
        + `<span class="rc-pill">${escapeHtmlText(BUCKET_LABELS[item.bucket])}</span>`
        + `<span class="rc-card__date">${escapeHtmlText(parts.join('  ·  '))}</span>`
        + `</div>`;
}

function renderCard(item) {
    const desc = item.description
        ? `<p class="rc-card__desc">${escapeHtmlText(item.description)}</p>` : '';
    return `<a class="rc-card"${renderLinkAttrs(item)}>`
        + renderMedia(item, 'rc-card__media')
        + `<div class="rc-card__body">`
        + renderMetaRow(item)
        + `<h3 class="rc-card__title">${escapeHtmlText(item.title)}</h3>`
        + desc
        + `</div></a>`;
}

function renderFeatured(item) {
    const desc = item.description
        ? `<p class="rc-featured__desc">${escapeHtmlText(item.description)}</p>` : '';
    const dateText = formatDate(item.date);
    const date = dateText ? `<span class="rc-card__date">${escapeHtmlText(dateText)}</span>` : '';
    return `<a class="rc-featured__card"${renderLinkAttrs(item)}>`
        + renderMedia(item, 'rc-featured__media')
        + `<div class="rc-featured__body">`
        + `<span class="rc-featured__eyebrow">Featured</span>`
        + `<h2 class="rc-featured__title">${escapeHtmlText(item.title)}</h2>`
        + desc
        + date
        + `<span class="rc-featured__cta">Read →</span>`
        + `</div></a>`;
}

// ---------------------------------------------------------------------------
// JSON-LD
// ---------------------------------------------------------------------------

// The Organization/WebSite nodes ride along in this graph because the page
// template's own CollectionPage block references them as publisher/isPartOf,
// and an @id reference only resolves against nodes defined on the same page.
function itemListJsonLd(items) {
    const absolute = href => (isExternal(href) ? href : `${BASE_URL}/${String(href).replace(/^\/+/, '')}`);
    return JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'ItemList',
                '@id': `${BASE_URL}/resources.html#catalog`,
                name: 'Kanan Labs Resources',
                numberOfItems: items.length,
                itemListElement: items.map((item, i) => ({
                    '@type': 'ListItem',
                    position: i + 1,
                    url: absolute(item.href),
                    name: item.title
                }))
            },
            ...siteEntityNodes()
        ]
    }, null, 4);
}

// ---------------------------------------------------------------------------
// Injection
// ---------------------------------------------------------------------------

// Replace the inner content of an element addressed by id, leaving its opening
// tag (and every attribute on it) untouched.
function replaceById(html, id, inner, label) {
    const pattern = new RegExp(`(<([a-zA-Z][\\w-]*)[^>]*\\bid="${id}"[^>]*>)([\\s\\S]*?)(</\\2>)`);
    if (!pattern.test(html)) {
        throw new Error(`resources.html: could not find #${id} to inject ${label}. `
            + `The generator and the page template have diverged — fix the template, not this error.`);
    }
    return html.replace(pattern, (_m, open, _tag, _old, close) => `${open}${inner}${close}`);
}

function injectJsonLd(html, jsonLd) {
    const block = `<script type="application/ld+json">\n${jsonLd}\n    </script>\n</head>`;
    if (!html.includes('</head>')) throw new Error('resources.html: no </head> to inject JSON-LD into');
    return html.replace('</head>', block);
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

/**
 * writeResourcesCatalog — build dist/resources.html from the manifest + extras.
 *
 * @param {Array<object>} manifest  publications manifest entries
 * @param {string} distDir          built tree (also the href-resolution root)
 * @returns {{items: Array<object>, warnings: string[]}}
 */
function writeResourcesCatalog(manifest, distDir) {
    const items = buildItems(manifest);

    // Blocking gate. Runs against distDir, so per-article pages must already be
    // written — call this after the article/hub writers.
    const { errors, warnings } = validateResourceItems(items, distDir);
    if (errors.length) {
        console.error(`\n❌ Resources catalog: ${errors.length} blocking error(s) — dist/resources.html NOT written:`);
        errors.forEach(e => console.error(`   ✗ ${e}`));
        console.error('');
        process.exit(1);
    }
    warnings.forEach(w => console.warn(`   ⚠ Resources: ${w}`));

    const featured = items.find(i => i.featured === true);
    // Every non-featured item is prerendered, NOT just the first page. This
    // deliberately diverges from renderCatalog(items, 'all') in js/resources.js,
    // which draws PAGE_SIZE at a time: pagination there is JS-only, with no
    // per-page URL for a crawler to follow, so anything past page 1 would have
    // no anchor in the served HTML and would receive no internal links from the
    // catalog — while the ItemList below still claimed it. Serving every card
    // keeps the markup and the structured data telling the same story, and gives
    // the no-JS baseline the full catalog (unfiltered, which is the correct
    // degradation). js/resources.js re-renders page 1 over this on init.
    const gridItems = items.filter(i => i !== featured);

    let html = fs.readFileSync(PAGE_TEMPLATE, 'utf-8');
    html = replaceById(html, 'resources-data', JSON.stringify({ items }, null, 2), 'catalog data');
    html = replaceById(html, 'resourcesFeatured', featured ? renderFeatured(featured) : '', 'featured card');
    html = replaceById(html, 'resourcesGrid', gridItems.map(renderCard).join('\n'), 'card grid');
    html = html.replace(' data-resources-unbuilt', '');
    html = replaceById(html, 'resourcesStatus', '', 'build status');
    html = html.replace('id="resourcesStatus" role="status"', 'id="resourcesStatus" role="status" hidden');
    html = injectJsonLd(html, itemListJsonLd(items));

    fs.mkdirSync(distDir, { recursive: true });
    fs.writeFileSync(path.join(distDir, 'resources.html'), html);

    // The fast path (npm run build:publications) skips build-full-site's js/
    // copy, so ship the renderer ourselves.
    fs.mkdirSync(path.join(distDir, 'js'), { recursive: true });
    fs.copyFileSync(RESOURCES_JS, path.join(distDir, 'js', 'resources.js'));

    return { items, warnings };
}

module.exports = { writeResourcesCatalog, buildItems, PAGE_SIZE };
