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
 *   - content/publications/index.json  (catalog manifest)
 *   - dist/llms.txt                    (answer-engine index)
 *
 * The authoring contract lives in content/publications/AUTHORING.md.
 * Validation violations FAIL THE BUILD (exit 1); style issues warn.
 */

const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const yaml = require('js-yaml');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const CONTENT_DIR = path.join(PROJECT_ROOT, 'content', 'publications');
const TEMPLATE_PATH = path.join(PROJECT_ROOT, 'templates', 'publication.html');
const DIST_DIR = path.join(PROJECT_ROOT, 'dist');
const MANIFEST_PATH = path.join(CONTENT_DIR, 'index.json');
const BASE_URL = 'https://kananlabs.in';
const DEFAULT_OG_IMAGE = `${BASE_URL}/KANANLABS-LOGO-SET/Link-Previews/01-KANANLABS.png`;
const CATEGORIES = [
    'AI Governance',
    'Policy Analysis',
    'Trade & Technology',
    'Regulatory Intelligence',
    'Research Dossier'
];
const WPM = 220;
// Keep in sync with the cache-busted asset versions used by the preview shell
const CSS_VERSION = '21';
const JS_VERSION = '17';

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

function formatDisplayDate(isoDate) {
    const d = new Date(`${isoDate}T00:00:00Z`);
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
}

function isValidIsoDate(value) {
    return /^\d{4}-\d{2}-\d{2}$/.test(String(value)) && !isNaN(new Date(`${value}T00:00:00Z`).getTime());
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
// Validation (contract: content/publications/AUTHORING.md)
// ---------------------------------------------------------------------------

function validate(filename, metadata, structure, rawBody, knownSlugs) {
    const errors = [];
    const warnings = [];

    if (!metadata) {
        errors.push('Missing YAML frontmatter block.');
        return { errors, warnings };
    }

    for (const field of ['title', 'slug', 'description', 'abstract', 'author', 'date', 'category']) {
        if (!metadata[field] || String(metadata[field]).trim() === '') {
            errors.push(`Missing required frontmatter field: "${field}".`);
        }
    }

    if (metadata.slug) {
        if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(metadata.slug)) {
            errors.push(`Slug "${metadata.slug}" is not kebab-case.`);
        }
        if (path.basename(filename, '.md') !== metadata.slug) {
            errors.push(`Filename "${filename}" does not match slug "${metadata.slug}".`);
        }
        if (knownSlugs.has(metadata.slug)) {
            errors.push(`Duplicate slug "${metadata.slug}".`);
        }
    }

    if (metadata.date && !isValidIsoDate(metadata.date)) {
        errors.push(`"date" must be a valid ISO date (YYYY-MM-DD), got "${metadata.date}".`);
    }
    if (metadata.updated && !isValidIsoDate(metadata.updated)) {
        errors.push(`"updated" must be a valid ISO date (YYYY-MM-DD), got "${metadata.updated}".`);
    }
    if (metadata.category && !CATEGORIES.includes(metadata.category)) {
        errors.push(`Category "${metadata.category}" is not in the controlled list: ${CATEGORIES.join(' · ')}.`);
    }
    if (metadata.image) {
        const imgPath = path.join(PROJECT_ROOT, String(metadata.image).replace(/^\//, ''));
        if (!fs.existsSync(imgPath)) errors.push(`Frontmatter image not found in repo: "${metadata.image}".`);
    }

    if (structure.preambleText) {
        errors.push('Content found before the first "#" chapter heading.');
    }
    if (structure.chapters.length === 0) {
        errors.push('No "#" chapter headings found — the article has no Layer-1 structure.');
    }
    structure.chapters.forEach(ch => {
        ch.sections.forEach(sec => {
            if (!/^<p>/.test(sec.content.trim())) {
                warnings.push(`Section "${sec.title}" does not open with a plain teaser paragraph.`);
            }
        });
    });
    if (/<\s*(script|iframe|object|embed|form)\b/i.test(rawBody)) {
        errors.push('Raw HTML (script/iframe/object/embed/form) is not allowed in article bodies.');
    }

    if (metadata.title && String(metadata.title).length > 70) {
        warnings.push(`Title is ${String(metadata.title).length} chars (recommended ≤ 70).`);
    }
    if (metadata.description) {
        const len = String(metadata.description).length;
        if (len < 120 || len > 170) {
            warnings.push(`Description is ${len} chars (target 150–160).`);
        }
    }

    return { errors, warnings };
}

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
                            <div class="toc-item-row">
                                <span class="toc-num">${index + 1}</span>
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
    return `
                    <header class="publication-masthead">
                        <div class="masthead-kicker">${escapeHtmlText(meta.category)}</div>
                        <h1 class="masthead-title">${escapeHtmlText(meta.title)}</h1>
                        <div class="masthead-byline">${byline}</div>
                        <p class="masthead-lede">${escapeHtmlText(meta.abstract)}</p>
                    </header>`;
}

function renderArticleContent(meta, chapters, readingMinutes) {
    let html = renderMasthead(meta, readingMinutes);

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
                                ${section.subsections.map(sub =>
                                    `<div class="note-item">&#9776;&nbsp; Note: ${escapeHtmlText(sub.title)}</div>`).join('')}
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

    return html;
}

function buildJsonLd(meta, url, wordCount, readingMinutes) {
    return {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'Article',
                '@id': `${url}#article`,
                mainEntityOfPage: { '@type': 'WebPage', '@id': url },
                url,
                headline: meta.title,
                description: meta.description,
                abstract: meta.abstract,
                author: { '@type': 'Person', name: meta.author },
                publisher: { '@id': `${BASE_URL}/#organization` },
                isPartOf: { '@id': `${BASE_URL}/#website` },
                datePublished: meta.date,
                dateModified: meta.updated || meta.date,
                image: meta.ogImage,
                articleSection: meta.category,
                keywords: (meta.tags || []).join(', '),
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
        ]
    };
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
        OG_IMAGE_ALT: escapeHtmlAttribute(meta.title),
        DATE_PUBLISHED: meta.date,
        DATE_MODIFIED: meta.updated || meta.date,
        DATE_DISPLAY: formatDisplayDate(meta.date),
        AUTHOR: escapeHtmlAttribute(meta.author),
        CATEGORY: escapeHtmlAttribute(meta.category),
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
// llms.txt (answer-engine index)
// ---------------------------------------------------------------------------

function renderLlmsTxt(manifest) {
    const lines = [
        '# Kanan Labs',
        '',
        '> India-focused AI governance intelligence: publications, trackers and regulatory analysis.',
        '> Site: https://kananlabs.in',
        '',
        '## Publications',
        ''
    ];
    manifest.forEach(entry => {
        lines.push(`- [${entry.title}](${entry.url}): ${entry.description}`);
    });
    lines.push('');
    lines.push('## Trackers');
    lines.push('');
    lines.push('- [India AI Tracker](https://kananlabs.in/tracker.html): State-by-state tracking of AI policies, startups and infrastructure across India.');
    lines.push('- [TradeWatch](https://kananlabs.in/tradewatch.html): Trade and technology intelligence.');
    lines.push('');
    return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function generatePublications() {
    if (!fs.existsSync(DIST_DIR)) {
        console.error('❌ dist/ directory not found. Run build-full-site first.');
        process.exit(1);
    }

    const template = fs.readFileSync(TEMPLATE_PATH, 'utf-8');
    const files = fs.readdirSync(CONTENT_DIR)
        .filter(f => f.endsWith('.md') && !f.startsWith('_') && f !== 'AUTHORING.md')
        .sort();

    const manifest = [];
    const knownSlugs = new Set();
    let hadErrors = false;

    files.forEach(file => {
        const raw = fs.readFileSync(path.join(CONTENT_DIR, file), 'utf-8');
        const { metadata, content } = parseFrontmatter(raw);
        const structure = parseStructure(content);
        const { errors, warnings } = validate(file, metadata, structure, content, knownSlugs);

        warnings.forEach(w => console.warn(`⚠️  [${file}] ${w}`));
        if (errors.length) {
            errors.forEach(e => console.error(`❌ [${file}] ${e}`));
            hadErrors = true;
            return;
        }

        knownSlugs.add(metadata.slug);
        const meta = {
            ...metadata,
            tags: metadata.tags || [],
            ogImage: metadata.image
                ? `${BASE_URL}/${String(metadata.image).replace(/^\//, '')}`
                : DEFAULT_OG_IMAGE
        };

        const { html, wordCount, readingMinutes, url } = renderPage(template, meta, structure.chapters);

        const outDir = path.join(DIST_DIR, 'publications', meta.slug);
        fs.mkdirSync(outDir, { recursive: true });
        fs.writeFileSync(path.join(outDir, 'index.html'), html);

        manifest.push({
            slug: meta.slug,
            title: meta.title,
            description: meta.description,
            author: meta.author,
            date: meta.date,
            updated: meta.updated || meta.date,
            category: meta.category,
            tags: meta.tags,
            readingMinutes,
            wordCount,
            url
        });
        console.log(`✅ Generated publications/${meta.slug}/ (${wordCount} words, ${readingMinutes} min)`);
    });

    if (hadErrors) {
        console.error('❌ Publication build failed — fix the violations above (see content/publications/AUTHORING.md).');
        process.exit(1);
    }

    // Newest first
    manifest.sort((a, b) => (a.date < b.date ? 1 : -1));

    fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n');
    fs.writeFileSync(path.join(DIST_DIR, 'llms.txt'), renderLlmsTxt(manifest));

    console.log(`✅ Manifest: content/publications/index.json (${manifest.length} publications)`);
    console.log('✅ llms.txt written to dist/');
}

generatePublications();
