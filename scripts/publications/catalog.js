/**
 * catalog.js — derived publication surfaces, all generated from the manifest:
 *
 *   - dist/publications/cluster/<c>/    one hub page per cluster with ≥1 article
 *   - llms.txt content                  answer-engine map, grouped by cluster
 *
 * The catalog page itself lives in ./resources-catalog.js → dist/resources.html.
 * Nothing here is maintained by hand; adding an article is adding one file.
 * Template: templates/publication-hub.html.
 */

const fs = require('fs');
const path = require('path');
const { CLUSTERS, TYPES } = require('./contract');
const { siteEntityNodes } = require('./entities');

const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const DIST_DIR = path.join(PROJECT_ROOT, 'dist');
const HUB_TEMPLATE = path.join(PROJECT_ROOT, 'templates', 'publication-hub.html');
const CATALOG_CSS = path.join(PROJECT_ROOT, 'css', 'publications-catalog.css');
const BASE_URL = 'https://kananlabs.in';
const CATALOG_CSS_VERSION = '2';
const SUMMARY_TRUNCATE_AT = 200;

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
    const cover = entry.image
        ? `<div class="pub-card-cover"><img src="/publications/${entry.slug}/${escapeHtmlAttribute(String(entry.image).replace(/^\//, ''))}" alt="${escapeHtmlAttribute(entry.title)}" loading="lazy"></div>`
        : '';

    return `            <article class="pub-card" data-cluster="${escapeHtmlAttribute(entry.cluster)}" data-type="${escapeHtmlAttribute(entry.type)}">
                ${cover}
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
                    { '@type': 'ListItem', position: 2, name: 'Resources', item: `${BASE_URL}/resources.html` },
                    { '@type': 'ListItem', position: 3, name: def.hub, item: hubUrl(cluster) }
                ]
            },
            ...siteEntityNodes()
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

    // The fast path (npm run build:publications) skips build-full-site's css/
    // copy, so ship the hub stylesheet ourselves.
    fs.mkdirSync(path.join(distDir, 'css'), { recursive: true });
    fs.copyFileSync(CATALOG_CSS, path.join(distDir, 'css', 'publications-catalog.css'));

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
        `> Full catalog of every publication, whitepaper and press item: ${BASE_URL}/resources.html`,
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
        lines.push('- No publications in production yet.');
        lines.push('');
    }

    lines.push('## Trackers');
    lines.push('');
    lines.push('- [India AI Tracker](https://kananlabs.in/tracker.html): State-by-state tracking of AI policies, startups and infrastructure across India.');
    lines.push('- [TradeWatch](https://kananlabs.in/tradewatch.html): Trade and technology intelligence.');
    lines.push('');
    return lines.join('\n');
}

module.exports = { writeHubs, renderLlmsTxt };
