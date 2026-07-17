/**
 * catalog.js — derived publication surfaces, all generated from the manifest:
 *
 *   - dist/publications.html            static catalog (cards + cluster/type filters)
 *   - dist/publications/cluster/<c>/    one hub page per cluster with ≥1 article
 *   - llms.txt content                  answer-engine map, grouped by cluster
 *
 * Nothing here is maintained by hand; adding an article is adding one file.
 * Templates: templates/publication-catalog.html, templates/publication-hub.html.
 */

const fs = require('fs');
const path = require('path');
const { CLUSTERS, TYPES } = require('./contract');

const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const DIST_DIR = path.join(PROJECT_ROOT, 'dist');
const CATALOG_TEMPLATE = path.join(PROJECT_ROOT, 'templates', 'publication-catalog.html');
const HUB_TEMPLATE = path.join(PROJECT_ROOT, 'templates', 'publication-hub.html');
const CATALOG_CSS = path.join(PROJECT_ROOT, 'css', 'publications-catalog.css');
const BASE_URL = 'https://kananlabs.in';
const CATALOG_CSS_VERSION = '2';
const SUMMARY_TRUNCATE_AT = 200;

const CATALOG_LEDE = 'Operational notes, change-watches and concept pieces on India-linked trade: '
    + 'IGST and customs readiness, marine cargo evidence, EV and lithium export, export realization, '
    + 'and the architecture behind TradeWatch.';
const CATALOG_META_DESCRIPTION = 'Kanan Labs publications: sourced operational notes and regulatory '
    + 'change-watches on IGST refunds, customs readiness, marine cargo evidence and India-linked trade.';

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

function formatFullDate(isoDate) {
    const d = new Date(`${isoDate}T00:00:00Z`);
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

// Frontmatter summaries carry inline markdown; card/llms surfaces are plain text
function plainText(markdown) {
    return String(markdown)
        .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
        .replace(/[*_`]/g, '')
        .trim();
}

function truncateAtWord(text, max) {
    if (text.length <= max) return text;
    const cut = text.slice(0, max);
    return `${cut.slice(0, cut.lastIndexOf(' '))}…`;
}

function fillTemplate(template, replacements) {
    let html = template;
    for (const [key, value] of Object.entries(replacements)) {
        html = html.split(`{{${key}}}`).join(value);
    }
    return html;
}

function hubUrl(cluster) {
    return `${BASE_URL}/publications/cluster/${cluster}/`;
}

// Clusters that actually have articles, in §2.2 declaration order
function activeClusters(manifest) {
    return Object.keys(CLUSTERS).filter(c => manifest.some(e => e.cluster === c));
}

// ---------------------------------------------------------------------------
// Card (shared by catalog + hubs)
// ---------------------------------------------------------------------------

function renderCard(entry, { linkCluster = true } = {}) {
    const typeLabel = TYPES[entry.type] ? TYPES[entry.type].label : entry.type;
    const clusterLabel = CLUSTERS[entry.cluster] ? CLUSTERS[entry.cluster].hub : entry.cluster;
    const summary = truncateAtWord(plainText(entry.summary || entry.description), SUMMARY_TRUNCATE_AT);
    const clusterBadge = linkCluster
        ? `<a class="pub-badge pub-badge-cluster" href="/publications/cluster/${entry.cluster}/">${escapeHtmlText(clusterLabel)}</a>`
        : `<span class="pub-badge pub-badge-cluster">${escapeHtmlText(clusterLabel)}</span>`;

    return `            <article class="pub-card" data-cluster="${escapeHtmlAttribute(entry.cluster)}" data-type="${escapeHtmlAttribute(entry.type)}">
                <div class="pub-card-badges">
                    <span class="pub-badge pub-badge-type">${escapeHtmlText(typeLabel)}</span>
                    ${clusterBadge}
                </div>
                <h2 class="pub-card-title"><a href="/publications/${entry.slug}/">${escapeHtmlText(entry.title)}</a></h2>
                <p class="pub-card-summary">${escapeHtmlText(summary)}</p>
                <div class="pub-card-meta">${formatFullDate(entry.date)}<span class="byline-sep">&middot;</span>${entry.readingMinutes} min read</div>
            </article>`;
}

// ---------------------------------------------------------------------------
// Catalog page → dist/publications.html
// ---------------------------------------------------------------------------

function renderFilters(manifest) {
    if (!manifest.length) return '';

    const button = (group, value, label, active) =>
        `<button class="pub-filter-btn${active ? ' is-active' : ''}" data-filter-group="${group}" data-filter-value="${escapeHtmlAttribute(value)}" aria-pressed="${active ? 'true' : 'false'}">${escapeHtmlText(label)}</button>`;

    const clusterButtons = [
        button('cluster', 'all', 'All', true),
        ...activeClusters(manifest).map(c => button('cluster', c, CLUSTERS[c].hub, false))
    ].join('\n                ');

    const typeButtons = [
        button('type', 'all', 'All', true),
        ...Object.keys(TYPES)
            .filter(t => manifest.some(e => e.type === t))
            .map(t => button('type', t, TYPES[t].label, false))
    ].join('\n                ');

    return `        <div class="pub-catalog-filters" aria-label="Filter publications">
            <div class="pub-filter-row">
                <span class="pub-filter-label">Cluster</span>
                ${clusterButtons}
            </div>
            <div class="pub-filter-row">
                <span class="pub-filter-label">Type</span>
                ${typeButtons}
            </div>
        </div>`;
}

function catalogJsonLd(manifest) {
    return JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'CollectionPage',
                '@id': `${BASE_URL}/publications.html#collection`,
                url: `${BASE_URL}/publications.html`,
                name: 'Publications — Kanan Labs',
                description: CATALOG_META_DESCRIPTION,
                isPartOf: { '@id': `${BASE_URL}/#website` },
                publisher: { '@id': `${BASE_URL}/#organization` },
                ...(manifest.length ? {
                    mainEntity: {
                        '@type': 'ItemList',
                        itemListElement: manifest.map((e, i) => ({
                            '@type': 'ListItem', position: i + 1, name: e.title, url: e.url
                        }))
                    }
                } : {})
            },
            {
                '@type': 'BreadcrumbList',
                itemListElement: [
                    { '@type': 'ListItem', position: 1, name: 'Home', item: `${BASE_URL}/` },
                    { '@type': 'ListItem', position: 2, name: 'Publications', item: `${BASE_URL}/publications.html` }
                ]
            }
        ]
    }, null, 2);
}

function writeCatalog(manifest, distDir = DIST_DIR) {
    const template = fs.readFileSync(CATALOG_TEMPLATE, 'utf-8');
    const cards = manifest.length
        ? manifest.map(e => renderCard(e)).join('\n')
        : '            <div class="pub-catalog-empty">First publications are in production — the Weekly Brief will announce them.</div>';

    const html = fillTemplate(template, {
        META_DESCRIPTION: escapeHtmlAttribute(CATALOG_META_DESCRIPTION),
        PAGE_LEDE: escapeHtmlText(CATALOG_LEDE),
        JSON_LD: catalogJsonLd(manifest),
        FILTERS: renderFilters(manifest),
        CARDS: cards,
        CATALOG_CSS_VERSION
    });

    fs.writeFileSync(path.join(distDir, 'publications.html'), html);
    // The fast path (npm run build:publications) skips build-full-site's css/
    // copy, so ship the catalog stylesheet ourselves.
    fs.mkdirSync(path.join(distDir, 'css'), { recursive: true });
    fs.copyFileSync(CATALOG_CSS, path.join(distDir, 'css', 'publications-catalog.css'));
}

// ---------------------------------------------------------------------------
// Hub pages → dist/publications/cluster/<cluster>/index.html
// ---------------------------------------------------------------------------

function hubJsonLd(cluster, entries) {
    const def = CLUSTERS[cluster];
    return JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'CollectionPage',
                '@id': `${hubUrl(cluster)}#collection`,
                url: hubUrl(cluster),
                name: `${def.hub} — Kanan Labs`,
                description: def.description,
                isPartOf: { '@id': `${BASE_URL}/#website` },
                publisher: { '@id': `${BASE_URL}/#organization` },
                mainEntity: {
                    '@type': 'ItemList',
                    itemListElement: entries.map((e, i) => ({
                        '@type': 'ListItem', position: i + 1, name: e.title, url: e.url
                    }))
                }
            },
            {
                '@type': 'BreadcrumbList',
                itemListElement: [
                    { '@type': 'ListItem', position: 1, name: 'Home', item: `${BASE_URL}/` },
                    { '@type': 'ListItem', position: 2, name: 'Publications', item: `${BASE_URL}/publications.html` },
                    { '@type': 'ListItem', position: 3, name: def.hub, item: hubUrl(cluster) }
                ]
            }
        ]
    }, null, 2);
}

function writeHubs(manifest, distDir = DIST_DIR) {
    const template = fs.readFileSync(HUB_TEMPLATE, 'utf-8');
    const clusters = activeClusters(manifest);

    clusters.forEach(cluster => {
        const def = CLUSTERS[cluster];
        const entries = manifest.filter(e => e.cluster === cluster); // manifest is newest-first
        const html = fillTemplate(template, {
            HUB_NAME: escapeHtmlText(def.hub),
            HUB_DESCRIPTION: escapeHtmlText(def.description),
            HUB_PERSONAS: escapeHtmlText(def.personas),
            META_DESCRIPTION: escapeHtmlAttribute(def.description),
            CANONICAL_URL: hubUrl(cluster),
            JSON_LD: hubJsonLd(cluster, entries),
            CARDS: entries.map(e => renderCard(e, { linkCluster: false })).join('\n'),
            CATALOG_CSS_VERSION
        });

        const outDir = path.join(distDir, 'publications', 'cluster', cluster);
        fs.mkdirSync(outDir, { recursive: true });
        fs.writeFileSync(path.join(outDir, 'index.html'), html);
        console.log(`✅ Hub: publications/cluster/${cluster}/ (${entries.length} article${entries.length === 1 ? '' : 's'})`);
    });

    return clusters.map(hubUrl);
}

// ---------------------------------------------------------------------------
// llms.txt — the answer-engine map, organised by cluster
// ---------------------------------------------------------------------------

function renderLlmsTxt(manifest) {
    const lines = [
        '# Kanan Labs',
        '',
        '> India-focused trade and AI-governance intelligence: sourced publications, cluster hubs and live trackers.',
        '> Site: https://kananlabs.in',
        ''
    ];

    activeClusters(manifest).forEach(cluster => {
        const def = CLUSTERS[cluster];
        lines.push(`## ${def.hub}`);
        lines.push('');
        lines.push(`> ${def.description}`);
        lines.push(`> Hub: ${hubUrl(cluster)}`);
        lines.push('');
        manifest.filter(e => e.cluster === cluster).forEach(e => {
            lines.push(`- [${e.title}](${e.url}): ${plainText(e.summary || e.description)}`);
        });
        lines.push('');
    });

    if (!manifest.length) {
        lines.push('## Publications');
        lines.push('');
        lines.push(`- Catalog: ${BASE_URL}/publications.html (first publications in production)`);
        lines.push('');
    }

    lines.push('## Trackers');
    lines.push('');
    lines.push('- [India AI Tracker](https://kananlabs.in/tracker.html): State-by-state tracking of AI policies, startups and infrastructure across India.');
    lines.push('- [TradeWatch](https://kananlabs.in/tradewatch.html): Trade and technology intelligence.');
    lines.push('');
    return lines.join('\n');
}

module.exports = { writeCatalog, writeHubs, renderLlmsTxt };
