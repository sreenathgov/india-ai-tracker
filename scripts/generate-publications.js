/**
 * generate-publications.js
 *
 * Compiles content/publications/*.md into fully pre-rendered static pages at
 * dist/publications/<slug>/index.html — the SEO/AEO engine for the layered reader.
 *
 * Every article page carries ALL THREE layers as semantic HTML in the initial
 * document (h1 title → h2 chapters → h3 sections → h4 notes; Layer-2/3 content
 * embedded per-card in a hidden .layer-detail block), plus per-article meta,
 * canonical, OG/Twitter tags and Article JSON-LD. js/publications.js detects
 * <body data-prerendered> and hydrates the interactive layers from this DOM.
 *
 * Also maintains:
 *   - content/publications/index.json  (catalog manifest, build-side)
 *   - dist/publications/index.json     (catalog manifest, deployed)
 *   - dist/publications.html           (static catalog page)
 *   - dist/publications/cluster/<c>/   (hub pages, one per cluster with articles)
 *   - dist/llms.txt                    (answer-engine index, grouped by cluster)
 *
 * The authoring contract lives in content/publications/AUTHORING.md (v2).
 * Validation violations FAIL THE BUILD (exit 1); style issues warn. Every
 * error across every file is reported before exiting, grouped by file with
 * frontmatter line numbers where determinable.
 */

const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const yaml = require('js-yaml');
const { validatePublication } = require('./publications/validate');
const { TYPES, CLUSTERS, AUTHORITIES, BOUNDARY_STATEMENTS } = require('./publications/contract');
const { writeCatalog, writeHubs, renderLlmsTxt } = require('./publications/catalog');

const PROJECT_ROOT = path.resolve(__dirname, '..');
// PUB_CONTENT_DIR / PUB_DIST_DIR: test-harness overrides so fixture runs never
// touch the real content/ or dist/ trees. Unset in normal builds and CI.
const CONTENT_DIR = process.env.PUB_CONTENT_DIR
    ? path.resolve(process.env.PUB_CONTENT_DIR)
    : path.join(PROJECT_ROOT, 'content', 'publications');
const TEMPLATE_PATH = path.join(PROJECT_ROOT, 'templates', 'publication.html');
const DIST_DIR = process.env.PUB_DIST_DIR
    ? path.resolve(process.env.PUB_DIST_DIR)
    : path.join(PROJECT_ROOT, 'dist');
const MANIFEST_PATH = path.join(CONTENT_DIR, 'index.json');
const DIST_MANIFEST_PATH = path.join(DIST_DIR, 'publications', 'index.json');
const BASE_URL = 'https://kananlabs.in';
const DEFAULT_OG_IMAGE = `${BASE_URL}/KANANLABS-LOGO-SET/Link-Previews/01-KANANLABS.png`;
const WPM = 220;
// Keep in sync with the cache-busted asset versions used by the preview shell
const CSS_VERSION = '29';
const JS_VERSION = '23';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function escapeHtmlAttribute(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function escapeHtmlText(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

// MUST mirror slugify() in js/publications.js so hydrated ids/deep links match
function slugify(text) {
    return String(text).toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}

function stripHtml(html) {
    return html.replace(/<[^>]+>/g, ' ');
}

function countWords(text) {
    return text.split(/\s+/).filter(Boolean).length;
}

// Read a PNG's real pixel dimensions from its IHDR chunk — width/height are
// the big-endian uint32s at bytes 16-23 of any valid PNG. No new dependency.
// Returns null (caller falls back to the sitewide default) for non-PNG/unreadable files.
function readPngDimensions(absPath) {
    try {
        const fd = fs.openSync(absPath, 'r');
        const buf = Buffer.alloc(24);
        fs.readSync(fd, buf, 0, 24, 0);
        fs.closeSync(fd);
        const isPng = buf.readUInt32BE(0) === 0x89504e47 && buf.readUInt32BE(4) === 0x0d0a1a0a;
        if (!isPng) return null;
        return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
    } catch {
        return null;
    }
}

function formatDisplayDate(isoDate) {
    const d = new Date(`${isoDate}T00:00:00Z`);
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
}

// Day-precision date for trust signals (Last reviewed, Retrieved)
function formatFullDate(isoDate) {
    const d = new Date(`${isoDate}T00:00:00Z`);
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

// ---------------------------------------------------------------------------
// Parsing: frontmatter + H1/H2/H3 layer tree (mirrors js/publications.js)
// ---------------------------------------------------------------------------

function parseFrontmatter(raw) {
    const match = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
    if (!match) return { metadata: null, content: raw };
    return { metadata: yaml.load(match[1]), content: match[2] };
}

function parseStructure(markdown) {
    const chapters = [];
    let currentH1 = null;
    let currentH2 = null;
    let currentH3 = null;
    let buffer = [];
    let preambleText = '';

    const flush = () => {
        const text = buffer.join('\n').trim();
        const html = text ? marked.parse(text) : '';
        if (currentH3) {
            currentH3.content += html;
        } else if (currentH2) {
            currentH2.content += html;
        } else if (currentH1) {
            currentH1.content += html;
        } else if (text) {
            preambleText += text;
        }
        buffer = [];
    };

    for (const line of markdown.split('\n')) {
        if (/^#\s/.test(line)) {
            flush();
            if (currentH3 && currentH2) currentH2.subsections.push(currentH3);
            if (currentH2 && currentH1) currentH1.sections.push(currentH2);
            if (currentH1) chapters.push(currentH1);
            currentH1 = { id: slugify(line.slice(2)), title: line.slice(2).trim(), content: '', sections: [] };
            currentH2 = null;
            currentH3 = null;
        } else if (/^##\s/.test(line)) {
            flush();
            if (currentH3 && currentH2) currentH2.subsections.push(currentH3);
            if (currentH2 && currentH1) currentH1.sections.push(currentH2);
            currentH2 = { id: slugify(line.slice(3)), title: line.slice(3).trim(), content: '', subsections: [] };
            currentH3 = null;
        } else if (/^###\s/.test(line) && !/^####/.test(line)) {
            flush();
            if (currentH3 && currentH2) currentH2.subsections.push(currentH3);
            currentH3 = { id: slugify(line.slice(4)), title: line.slice(4).trim(), content: '' };
        } else {
            buffer.push(line);
        }
    }
    flush();
    if (currentH3 && currentH2) currentH2.subsections.push(currentH3);
    if (currentH2 && currentH1) currentH1.sections.push(currentH2);
    if (currentH1) chapters.push(currentH1);

    return { chapters, preambleText };
}

// ---------------------------------------------------------------------------
// Discovery: content/publications/<type>/<slug>/<slug>.md (AUTHORING.md v2.1)
// ---------------------------------------------------------------------------

function discoverArticleFiles() {
    const results = [];
    for (const type of Object.keys(TYPES)) {
        const typeDir = path.join(CONTENT_DIR, type);
        if (!fs.existsSync(typeDir) || !fs.statSync(typeDir).isDirectory()) continue;
        for (const slug of fs.readdirSync(typeDir)) {
            const articleDir = path.join(typeDir, slug);
            const mdPath = path.join(articleDir, `${slug}.md`);
            if (fs.statSync(articleDir).isDirectory() && fs.existsSync(mdPath)) {
                results.push({ absPath: mdPath, relLabel: `${type}/${slug}/${slug}.md`, articleDir, folderType: type });
            }
        }
    }
    return results.sort((a, b) => a.relLabel.localeCompare(b.relLabel));
}

// ---------------------------------------------------------------------------
// Validation lives in scripts/publications/validate.js
// (contract: content/publications/AUTHORING.md v2, §9 — every blocking check)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

function firstParagraphOf(html) {
    const match = html.match(/<p>[\s\S]*?<\/p>/);
    return match ? match[0] : '';
}

function renderTocItems(chapters) {
    return chapters.map((chapter, index) => {
        const subs = chapter.sections.length
            ? `<ul class="toc-sub">${chapter.sections.map((section, sectionIndex) => `
                        <li><a href="#${chapter.id}"
                               onclick="openAnalysisPanel(${index}, ${sectionIndex}); return false;">
                            ${escapeHtmlText(section.title)}
                        </a></li>`).join('')}
                    </ul>`
            : '';
        return `
                        <li class="toc-item" data-chapter="${index}">
                            <span class="toc-marker" aria-hidden="true"></span>
                            <div class="toc-item-row">
                                <span class="toc-num">${String(index + 1).padStart(2, '0')}</span>
                                <a href="#${chapter.id}" class="toc-link" data-chapter="${index}"
                                   onclick="scrollToChapter('${chapter.id}'); return false;">
                                    ${escapeHtmlText(chapter.title)}
                                </a>
                            </div>
                            ${subs}
                        </li>`;
    }).join('\n');
}

function renderMasthead(meta, readingMinutes) {
    const sep = '<span class="byline-sep">&middot;</span>';
    const byline = [
        `By ${escapeHtmlText(meta.author)}`,
        formatDisplayDate(meta.date),
        `${readingMinutes} min read`
    ].join(sep);
    const clusterHref = `/publications/cluster/${meta.cluster}/`;
    return `
                    <header class="publication-masthead">
                        <div class="masthead-kicker">
                            <span class="masthead-type">${escapeHtmlText(meta.typeLabel)}</span>
                            <span class="byline-sep">&middot;</span>
                            <a class="masthead-cluster" href="${clusterHref}">${escapeHtmlText(meta.clusterLabel)}</a>
                        </div>
                        <h1 class="masthead-title">${escapeHtmlText(meta.title)}</h1>
                        <div class="masthead-byline">${byline}</div>
                        <div class="masthead-reviewed">Last reviewed: <time datetime="${meta.reviewed}">${formatFullDate(meta.reviewed)}</time></div>
                        <p class="masthead-lede">${escapeHtmlText(meta.description)}</p>
                    </header>`;
}

// Inline markdown for frontmatter-sourced text (takeaways, FAQ): escape first
// (frontmatter is untrusted input — no raw HTML passes), then let marked
// render inline emphasis and links. parseInline, NOT parse: parse() wraps in
// <p> tags and breaks the flex bullet layout.
function renderInlineMarkdown(text) {
    return marked.parseInline(escapeHtmlText(String(text).trim()));
}

// Key-takeaways block (AUTHORING.md §4). First thing below the masthead,
// before any chapter. Semantic <ul>/<li> — the list structure is the
// extraction target; the checkmark is decorative.
function renderTakeaways(meta) {
    const block = meta.takeaways && typeof meta.takeaways === 'object' ? meta.takeaways : {};
    const items = Array.isArray(block.points)
        ? block.points.map(t => String(t).trim()).filter(Boolean)
        : [];
    if (!items.length) return '';

    const summaryText = block.summary ? String(block.summary).trim() : '';
    const summary = summaryText
        ? `
                        <p class="pub-takeaways-summary">${renderInlineMarkdown(summaryText)}</p>
                        <hr class="pub-takeaways-rule">`
        : '';
    const list = items
        .map(item => `<li><span class="pub-takeaway-check" aria-hidden="true">&#10003;</span><span class="pub-takeaway-text">${renderInlineMarkdown(item)}</span></li>`)
        .join('\n                            ');

    return `
                    <aside class="pub-takeaways" aria-label="Key takeaways">
                        <div class="pub-takeaways-kicker">Key takeaways</div>${summary}
                        <ul class="pub-takeaways-list">
                            ${list}
                        </ul>
                    </aside>`;
}

// Sources (§6) — anchor stays required frontmatter for internal citability
// grading (validate.js), but is not surfaced in the UI; the display is a
// plain numbered title + publisher/date list.
function renderSources(meta) {
    const sources = Array.isArray(meta.sources) ? meta.sources : [];
    if (!sources.length) return '';

    const items = sources.map(s => `
                            <li class="pub-source" id="source-${escapeHtmlAttribute(s.id)}">
                                <a class="pub-source-title" href="${escapeHtmlAttribute(s.url)}" target="_blank" rel="noopener">${escapeHtmlText(s.title)}</a>
                                <div class="pub-source-meta">${escapeHtmlText(AUTHORITIES[s.authority] || s.authority)}<span class="byline-sep">&middot;</span>Retrieved ${formatFullDate(s.retrieved)}</div>
                            </li>`).join('');

    return `
                    <section class="pub-sources" aria-label="Sources">
                        <div class="pub-foot-kicker">Sources</div>
                        <ol class="pub-sources-list">${items}
                        </ol>
                    </section>`;
}

// Boundary (§8.2) — the statements are rendered VERBATIM from the contract.
function renderBoundary(meta) {
    const values = Array.isArray(meta.boundary) ? meta.boundary : [];
    const statements = values
        .map(v => BOUNDARY_STATEMENTS[v])
        .filter(Boolean)
        .map(text => `
                        <p class="pub-boundary-statement">${escapeHtmlText(text)}</p>`)
        .join('');
    if (!statements) return '';

    return `
                    <aside class="pub-boundary" aria-label="Boundary">
                        <div class="pub-foot-kicker">Boundary</div>${statements}
                    </aside>`;
}

// FAQ — visible content backing the FAQPage JSON-LD (structured data must
// match on-page content).
function renderFaq(meta) {
    const faq = Array.isArray(meta.faq) ? meta.faq : [];
    if (!faq.length) return '';

    const items = faq.map(f => `
                        <div class="pub-faq-item">
                            <h3 class="pub-faq-q">${renderInlineMarkdown(f.q)}</h3>
                            <p class="pub-faq-a">${renderInlineMarkdown(f.a)}</p>
                        </div>`).join('');

    return `
                    <section class="pub-faq" aria-label="Frequently asked questions">
                        <div class="pub-foot-kicker">Frequently asked questions</div>${items}
                    </section>`;
}

// Inline "Weekly Brief" block at the end of the article — the laptop/mobile home
// for the CTA (the fixed .pub-sub gutter block only appears ≥1900px). Mirrors
// buildInlineSignupHtml() in js/publications.js.
function renderInlineSignup() {
    return `
                    <aside class="pub-signup-inline" aria-label="Subscribe to the Weekly Brief">
                        <div class="pub-sub-kicker">Weekly Brief</div>
                        <h2 class="pub-signup-inline-title">Get our insights delivered to your inbox.</h2>
                        <form class="pub-sub-form" novalidate>
                            <input type="email" class="pub-sub-input" name="email" placeholder="Your email address"
                                   autocomplete="email" required aria-label="Email address">
                            <button type="submit" class="pub-sub-btn">Subscribe</button>
                        </form>
                        <p class="pub-sub-note">Governance analysis, no spam &mdash; unsubscribe anytime.</p>
                        <p class="pub-sub-success">Thanks &mdash; you're on the list.</p>
                        <a class="pub-sub-linkedin" href="https://www.linkedin.com/company/kanan-labs/"
                           target="_blank" rel="noopener">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z"/></svg>
                            <span>Follow on LinkedIn</span>
                        </a>
                    </aside>`;
}

function renderArticleContent(meta, chapters, readingMinutes) {
    let html = renderMasthead(meta, readingMinutes) + renderTakeaways(meta);

    chapters.forEach((chapter, chapterIndex) => {
        const chapterNumber = chapterIndex + 1;
        html += `
                    <section class="chapter-card" id="${chapter.id}" data-chapter="${chapterIndex}">
                        <div class="chapter-kicker">Chapter ${chapterNumber}</div>
                        <h2 class="chapter-title">${escapeHtmlText(chapter.title)}</h2>
                        <div class="chapter-content">${chapter.content}</div>`;

        chapter.sections.forEach((section, sectionIndex) => {
            const notesList = section.subsections.length
                ? `
                            <div class="subsection-notes">
                                <div class="notes-label">See more about</div>
                                ${section.subsections.map((sub, subIndex) =>
                                    `<button type="button" class="note-item" data-chapter="${chapterIndex}" data-section="${sectionIndex}" data-sub="${subIndex}"><span>&#9776;&nbsp; Note: ${escapeHtmlText(sub.title)}</span></button>`).join('')}
                            </div>`
                : '';

            // Full Layer-2 content with nested Layer-3 notes — present in the raw
            // HTML for crawlers ("hidden" content is indexed like tabbed content);
            // publications.js lifts it into the panels at runtime.
            const layerDetail = `
                            <div class="layer-detail" hidden>
                                ${section.content}
                                ${section.subsections.map(sub => `
                                <section class="layer-note" data-note-title="${escapeHtmlAttribute(sub.title)}">
                                    <h4>${escapeHtmlText(sub.title)}</h4>
                                    ${sub.content}
                                </section>`).join('')}
                            </div>`;

            html += `
                        <div class="subsection-card"
                             id="card-${chapterIndex}-${sectionIndex}"
                             onclick="openAnalysisPanel(${chapterIndex}, ${sectionIndex})"
                             role="button"
                             tabindex="0">
                            <div class="subsection-id">${chapterNumber}.${sectionIndex + 1}</div>
                            <h3 class="subsection-title">${escapeHtmlText(section.title)}</h3>
                            <div class="subsection-teaser">${firstParagraphOf(section.content)}</div>
                            ${notesList}
                            ${layerDetail}
                            <div class="more-strip">Get the details <span class="more-icon">&rarr;</span></div>
                        </div>`;
        });

        html += `
                    </section>`;
    });

    html += renderFaq(meta);
    html += renderSources(meta);
    html += renderBoundary(meta);
    html += renderInlineSignup();

    return html;
}

function buildJsonLd(meta, url, wordCount, readingMinutes) {
    const takeawaysSummary = meta.takeaways && meta.takeaways.summary
        ? String(meta.takeaways.summary).trim().replace(/\*\*/g, '')
        : undefined;
    const citations = (Array.isArray(meta.sources) ? meta.sources : []).map(s => ({
        '@type': 'CreativeWork',
        name: `${s.title}, ${s.anchor}`,
        url: s.url
    }));

    const graph = [
        {
            '@type': 'Article',
            '@id': `${url}#article`,
            mainEntityOfPage: { '@type': 'WebPage', '@id': url },
            url,
            headline: meta.title,
            description: meta.description,
            abstract: takeawaysSummary,
            author: { '@type': 'Person', name: meta.author },
            publisher: { '@id': `${BASE_URL}/#organization` },
            isPartOf: { '@id': `${BASE_URL}/#website` },
            datePublished: meta.date,
            dateModified: meta.updated || meta.date,
            image: meta.ogImage,
            articleSection: meta.clusterLabel,
            keywords: (meta.tags || []).join(', '),
            ...(citations.length ? { citation: citations } : {}),
            wordCount,
            timeRequired: `PT${readingMinutes}M`,
            inLanguage: 'en'
        },
        {
            '@type': 'BreadcrumbList',
            itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Home', item: `${BASE_URL}/` },
                { '@type': 'ListItem', position: 2, name: 'Publications', item: `${BASE_URL}/publications.html` },
                { '@type': 'ListItem', position: 3, name: meta.title, item: url }
            ]
        }
    ];

    if (Array.isArray(meta.faq) && meta.faq.length) {
        graph.push({
            '@type': 'FAQPage',
            '@id': `${url}#faq`,
            mainEntity: meta.faq.map(f => ({
                '@type': 'Question',
                name: f.q,
                acceptedAnswer: { '@type': 'Answer', text: f.a }
            }))
        });
    }

    return { '@context': 'https://schema.org', '@graph': graph };
}

function renderPage(template, meta, chapters) {
    const url = `${BASE_URL}/publications/${meta.slug}/`;
    const allText = stripHtml(chapters.map(ch =>
        ch.content
        + ch.sections.map(s => s.content + s.subsections.map(x => x.content).join(' ')).join(' ')
    ).join(' '));
    const wordCount = countWords(allText);
    const readingMinutes = Math.max(1, Math.round(wordCount / WPM));

    const replacements = {
        TITLE_TAG: escapeHtmlText(`${meta.title} | Kanan Labs`),
        TITLE: escapeHtmlText(meta.title),
        OG_TITLE: escapeHtmlAttribute(`${meta.title} | Kanan Labs`),
        META_DESCRIPTION: escapeHtmlAttribute(meta.description),
        CANONICAL_URL: url,
        OG_IMAGE: escapeHtmlAttribute(meta.ogImage),
        OG_IMAGE_WIDTH: String(meta.ogImageWidth),
        OG_IMAGE_HEIGHT: String(meta.ogImageHeight),
        OG_IMAGE_ALT: escapeHtmlAttribute(meta.title),
        DATE_PUBLISHED: meta.date,
        DATE_MODIFIED: meta.updated || meta.date,
        DATE_DISPLAY: formatDisplayDate(meta.date),
        AUTHOR: escapeHtmlAttribute(meta.author),
        CLUSTER_LABEL: escapeHtmlAttribute(meta.clusterLabel),
        JSON_LD: JSON.stringify(buildJsonLd(meta, url, wordCount, readingMinutes), null, 2),
        TOC_ITEMS: renderTocItems(chapters),
        ARTICLE_CONTENT: renderArticleContent(meta, chapters, readingMinutes),
        CSS_VERSION,
        JS_VERSION
    };

    let html = template;
    for (const [key, value] of Object.entries(replacements)) {
        html = html.split(`{{${key}}}`).join(value);
    }
    return { html, wordCount, readingMinutes, url };
}

// ---------------------------------------------------------------------------
// Failure report: every error across every file, grouped, with line numbers
// ---------------------------------------------------------------------------

function printFindings(kind, findingsByFile) {
    const icon = kind === 'error' ? '❌' : '⚠️ ';
    for (const [file, findings] of findingsByFile) {
        if (!findings.length) continue;
        console.error(`\n${icon} content/publications/${file}`);
        findings.forEach(({ line, msg }) => {
            console.error(`   ${line ? `L${line}` : '  —'}  ${msg}`);
        });
    }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function generatePublications() {
    // dist/ is untracked build output — create it if this is the first build
    // step to run (fresh clone, CI validation job).
    fs.mkdirSync(DIST_DIR, { recursive: true });

    const template = fs.readFileSync(TEMPLATE_PATH, 'utf-8');
    const files = discoverArticleFiles();

    const manifest = [];
    const knownSlugs = new Set();
    const errorsByFile = new Map();
    const warningsByFile = new Map();

    files.forEach(({ absPath, relLabel, articleDir, folderType }) => {
        const raw = fs.readFileSync(absPath, 'utf-8');
        const { metadata, content } = parseFrontmatter(raw);
        const { errors, warnings } = validatePublication(relLabel, raw, metadata, knownSlugs, {
            projectRoot: PROJECT_ROOT,
            articleDir,
            folderType
        });

        if (warnings.length) warningsByFile.set(relLabel, warnings);
        if (errors.length) {
            errorsByFile.set(relLabel, errors);
            return;
        }

        knownSlugs.add(metadata.slug);
        const pngDims = metadata.image
            ? readPngDimensions(path.join(articleDir, String(metadata.image).replace(/^\//, '')))
            : null;
        const meta = {
            ...metadata,
            tags: metadata.tags || [],
            typeLabel: TYPES[metadata.type].label,
            clusterLabel: CLUSTERS[metadata.cluster].hub,
            ogImage: metadata.image
                ? `${BASE_URL}/publications/${metadata.slug}/${String(metadata.image).replace(/^\//, '')}`
                : DEFAULT_OG_IMAGE,
            ogImageWidth: pngDims ? pngDims.width : 1200,
            ogImageHeight: pngDims ? pngDims.height : 630
        };

        const structure = parseStructure(content);
        const { html, wordCount, readingMinutes, url } = renderPage(template, meta, structure.chapters);

        const outDir = path.join(DIST_DIR, 'publications', meta.slug);
        fs.mkdirSync(outDir, { recursive: true });
        fs.writeFileSync(path.join(outDir, 'index.html'), html);

        const assetsSrc = path.join(articleDir, 'assets');
        if (fs.existsSync(assetsSrc)) {
            fs.cpSync(assetsSrc, path.join(outDir, 'assets'), {
                recursive: true,
                filter: (src) => !src.endsWith('.DS_Store') && !src.endsWith('.gitkeep')
            });
        }

        manifest.push({
            slug: meta.slug,
            title: meta.title,
            description: meta.description,
            author: meta.author,
            date: meta.date,
            updated: meta.updated || meta.date,
            reviewed: meta.reviewed,
            type: meta.type,
            cluster: meta.cluster,
            entities: meta.entities || [],
            summary: meta.takeaways.summary,
            tags: meta.tags,
            image: meta.image || null,
            readingMinutes,
            wordCount,
            url
        });
        console.log(`✅ Generated publications/${meta.slug}/ (${wordCount} words, ${readingMinutes} min)`);
    });

    printFindings('warning', warningsByFile);
    if (errorsByFile.size) {
        printFindings('error', errorsByFile);
        const total = [...errorsByFile.values()].reduce((n, e) => n + e.length, 0);
        console.error(`\n❌ Publication build failed — ${total} violation${total === 1 ? '' : 's'} in ${errorsByFile.size} file${errorsByFile.size === 1 ? '' : 's'} (contract: content/publications/AUTHORING.md).`);
        process.exit(1);
    }

    // Newest first
    manifest.sort((a, b) => (a.date < b.date ? 1 : -1));

    // Manifest: content/ copy is the build-side input (sitemap reads it);
    // dist/ copy is what production serves. content/ itself is never shipped.
    fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n');
    fs.mkdirSync(path.dirname(DIST_MANIFEST_PATH), { recursive: true });
    fs.writeFileSync(DIST_MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n');

    writeCatalog(manifest, DIST_DIR);
    writeHubs(manifest, DIST_DIR);
    fs.writeFileSync(path.join(DIST_DIR, 'llms.txt'), renderLlmsTxt(manifest));

    console.log(`✅ Manifest: content/publications/index.json + dist/publications/index.json (${manifest.length} publications)`);
    console.log('✅ Catalog: dist/publications.html');
    console.log('✅ llms.txt written to dist/');
}

generatePublications();
