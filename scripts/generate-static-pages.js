const fs = require('fs');
const path = require('path');
const { jurisdictions, validateJurisdictions } = require('./jurisdictions');

// Configuration
const DIST_DIR = path.resolve(__dirname, '../dist');
const BASE_URL = 'https://kananlabs.in';

const canonicalJurisdictions = validateJurisdictions(jurisdictions);

function replaceMetaContent(html, selectorType, selectorValue, content) {
    const escapedContent = escapeHtmlAttribute(content);
    const selector = selectorType === 'property' ? `property="${selectorValue}"` : `name="${selectorValue}"`;
    const pattern = new RegExp(`<meta ${selector} content="[^"]*"`);

    if (pattern.test(html)) {
        return html.replace(pattern, `<meta ${selector} content="${escapedContent}"`);
    }

    return html;
}

function escapeHtmlAttribute(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function ensureRootBaseHref(html) {
    if (html.includes('<base ')) return html;
    return html.replace('<head>', '<head>\n    <base href="/">');
}

function generateStaticPages() {
    if (!fs.existsSync(DIST_DIR)) {
        console.error('❌ dist/ directory not found. Run build first.');
        process.exit(1);
    }

    const template = fs.readFileSync(path.join(DIST_DIR, 'tracker.html'), 'utf-8');

    // 1. Generate /all-india/
    createPage(template, 'all-india', {
        title: 'All India AI Developments | Kanan Labs',
        description: 'Track comprehensive national-level AI policies, infrastructure updates, and strategic developments across India.',
        url: `${BASE_URL}/all-india/`,
        image: `${BASE_URL}/KANANLABS-LOGO-SET/Link-Previews/03-INDIA-AI-TRACKER.png`,
        imageAlt: 'India AI Tracker by Kanan Labs'
    });

    // 2. Generate canonical State/UT Pages
    let createdCount = 0;
    canonicalJurisdictions.forEach(jurisdiction => {
        createPage(template, `states/${jurisdiction.slug}`, {
            title: `${jurisdiction.name} AI Tracker | Kanan Labs`,
            description: `Track latest AI policies, startups, and infrastructure developments in ${jurisdiction.name}. Real-time intelligence by Kanan Labs.`,
            url: `${BASE_URL}/states/${jurisdiction.slug}/`,
            image: `${BASE_URL}/KANANLABS-LOGO-SET/Link-Previews/03-INDIA-AI-TRACKER.png`,
            imageAlt: 'India AI Tracker by Kanan Labs',
            jsonLd: {
                "@context": "https://schema.org",
                "@type": "GovernmentService",
                "name": `${jurisdiction.name} AI Ecosystem Tracker`,
                "areaServed": {
                    "@type": "State",
                    "name": jurisdiction.name
                },
                "provider": {
                    "@type": "Organization",
                    "name": "Kanan Labs",
                    "url": BASE_URL
                }
            }
        });
        createdCount++;
    });

    console.log(`✅ Generated static pages for All India + ${createdCount} jurisdictions.`);
}

function createPage(template, relativePath, meta) {
    // Ensure directory exists
    const dir = path.join(DIST_DIR, relativePath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    // Inject Metadata
    let html = ensureRootBaseHref(template);

    // Replace Title
    html = html.replace(/<title>.*?<\/title>/, `<title>${escapeHtmlAttribute(meta.title)}</title>`);

    // Replace Metadata
    // Note: This simple replacement assumes standard meta tag format in source
    // Ideally use a more robust parser or placeholder if index.html is controlled
    // But for this task, regex replacement of known properties is sufficient

    // Description
    if (html.includes('name="description"')) {
        html = replaceMetaContent(html, 'name', 'description', meta.description);
    } else {
        html = html.replace('</head>', `    <meta name="description" content="${escapeHtmlAttribute(meta.description)}">\n</head>`);
    }

    // OG Title
    html = replaceMetaContent(html, 'property', 'og:title', meta.title);

    // OG Description
    html = replaceMetaContent(html, 'property', 'og:description', meta.description);

    // OG URL
    html = replaceMetaContent(html, 'property', 'og:url', meta.url);

    if (meta.image) {
        html = replaceMetaContent(html, 'property', 'og:image', meta.image);
        html = replaceMetaContent(html, 'name', 'twitter:image', meta.image);
    }

    if (meta.imageAlt) {
        html = replaceMetaContent(html, 'property', 'og:image:alt', meta.imageAlt);
        html = replaceMetaContent(html, 'name', 'twitter:image:alt', meta.imageAlt);
    }

    html = replaceMetaContent(html, 'name', 'twitter:url', meta.url);
    html = replaceMetaContent(html, 'name', 'twitter:title', meta.title);
    html = replaceMetaContent(html, 'name', 'twitter:description', meta.description);

    // Canonical
    const canonicalTag = `<link rel="canonical" href="${meta.url}" />`;
    if (html.includes('<link rel="canonical"')) {
        html = html.replace(/<link rel="canonical" href="[^"]*"\s*\/?>/, canonicalTag);
    } else {
        html = html.replace('</head>', `    ${canonicalTag}\n</head>`);
    }

    // JSON-LD
    if (meta.jsonLd) {
        const script = `<script type="application/ld+json">${JSON.stringify(meta.jsonLd)}</script>`;
        html = html.replace('</head>', `    ${script}\n</head>`);
    }

    // Write file
    fs.writeFileSync(path.join(dir, 'index.html'), html);
}

generateStaticPages();
