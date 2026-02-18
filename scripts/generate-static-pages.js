const fs = require('fs');
const path = require('path');

// Configuration
const DIST_DIR = path.resolve(__dirname, '../dist');
const BASE_URL = 'https://kananlabs.in';

// State Mapping (Duplicated from app-final.js for independence)
const STATE_CODE_MAP = {
    'Tamil Nadu': 'TN',
    'Maharashtra': 'MH',
    'Karnataka': 'KA',
    'Delhi': 'DL',
    'NCT of Delhi': 'DL',
    'Telangana': 'TG',
    'Telengana': 'TG',
    'Andhra Pradesh': 'AP',
    'West Bengal': 'WB',
    'Gujarat': 'GJ',
    'Rajasthan': 'RJ',
    'Uttar Pradesh': 'UP',
    'Kerala': 'KL',
    'Punjab': 'PB',
    'Haryana': 'HR',
    'Madhya Pradesh': 'MP',
    'Bihar': 'BR',
    'Odisha': 'OD',
    'Orissa': 'OD',
    'Assam': 'AS',
    'Jharkhand': 'JH',
    'Chhattisgarh': 'CG',
    'Chattisgarh': 'CG',
    'Uttarakhand': 'UK',
    'Uttaranchal': 'UK',
    'Goa': 'GA',
    'Himachal Pradesh': 'HP',
    'Jammu and Kashmir': 'JK',
    'Jammu & Kashmir': 'JK',
    'Manipur': 'MN',
    'Meghalaya': 'ML',
    'Mizoram': 'MZ',
    'Nagaland': 'NL',
    'Tripura': 'TR',
    'Arunachal Pradesh': 'AR',
    'Sikkim': 'SK',
    'Puducherry': 'PY',
    'Pondicherry': 'PY',
    'Ladakh': 'LA',
    'Andaman and Nicobar Islands': 'AN',
    'Andaman & Nicobar Islands': 'AN',
    'Andaman and Nicobar': 'AN',
    'Chandigarh': 'CH',
    'Dadra and Nagar Haveli and Daman and Diu': 'DD',
    'Lakshadweep': 'LD',
};

// Unique states (preferring longer/standard names for display)
const uniqueStates = Array.from(new Set(Object.keys(STATE_CODE_MAP)));

function toSlug(name) {
    return name.toLowerCase().replace(/\s+/g, '-').replace(/[&]/g, 'and');
}

function generateStaticPages() {
    if (!fs.existsSync(DIST_DIR)) {
        console.error('❌ dist/ directory not found. Run build first.');
        process.exit(1);
    }

    const template = fs.readFileSync(path.join(DIST_DIR, 'index.html'), 'utf-8');

    // 1. Generate /all-india/
    createPage(template, 'all-india', {
        title: 'All India AI Developments | Kanan Labs',
        description: 'Track comprehensive national-level AI policies, infrastructure updates, and strategic developments across India.',
        url: `${BASE_URL}/all-india/`
    });

    // 2. Generate State Pages
    let createdCount = 0;
    uniqueStates.forEach(stateName => {
        const slug = toSlug(stateName);
        createPage(template, `states/${slug}`, {
            title: `${stateName} AI Tracker | Kanan Labs`,
            description: `Track latest AI policies, startups, and infrastructure developments in ${stateName}. Real-time intelligence by Kanan Labs.`,
            url: `${BASE_URL}/states/${slug}/`,
            jsonLd: {
                "@context": "https://schema.org",
                "@type": "GovernmentService",
                "name": `${stateName} AI Ecosystem Tracker`,
                "areaServed": {
                    "@type": "State",
                    "name": stateName
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

    console.log(`✅ Generated static pages for All India + ${createdCount} states.`);
}

function createPage(template, relativePath, meta) {
    // Ensure directory exists
    const dir = path.join(DIST_DIR, relativePath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    // Inject Metadata
    let html = template;

    // Replace Title
    html = html.replace(/<title>.*?<\/title>/, `<title>${meta.title}</title>`);

    // Replace Metadata
    // Note: This simple replacement assumes standard meta tag format in source
    // Ideally use a more robust parser or placeholder if index.html is controlled
    // But for this task, regex replacement of known properties is sufficient

    // Description
    if (html.includes('name="description"')) {
        html = html.replace(/<meta name="description" content="[^"]*"/, `<meta name="description" content="${meta.description}"`);
    } else {
        html = html.replace('</head>', `    <meta name="description" content="${meta.description}">\n</head>`);
    }

    // OG Title
    if (html.includes('property="og:title"')) {
        html = html.replace(/<meta property="og:title" content="[^"]*"/, `<meta property="og:title" content="${meta.title}"`);
    }

    // OG Description
    if (html.includes('property="og:description"')) {
        html = html.replace(/<meta property="og:description" content="[^"]*"/, `<meta property="og:description" content="${meta.description}"`);
    }

    // OG URL
    if (html.includes('property="og:url"')) {
        html = html.replace(/<meta property="og:url" content="[^"]*"/, `<meta property="og:url" content="${meta.url}"`);
    }

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
