const fs = require('fs');
const path = require('path');

// Base URL for the production site
const BASE_URL = 'https://kananlabs.in';
const PROJECT_ROOT = path.resolve(__dirname, '..');

// Static routes with per-route SEO metadata.
// `file` is resolved against PROJECT_ROOT for real `lastmod` derivation.
// `priority` and `changefreq` are differentiated per page type — Google largely
// ignores them, but a coherent sitemap is a positive signal.
const staticRoutes = [
  { path: '/',                   file: 'index.html',         priority: '1.0', changefreq: 'weekly'  },
  { path: '/tradewatch.html',    file: 'tradewatch.html',    priority: '0.9', changefreq: 'weekly'  },
  { path: '/tracker.html',       file: 'tracker.html',       priority: '0.9', changefreq: 'daily'   },
  { path: '/sector-watch.html',  file: 'sector-watch.html',  priority: '0.7', changefreq: 'monthly' },
  { path: '/about.html',         file: 'about.html',         priority: '0.7', changefreq: 'monthly' },
  { path: '/publications.html',  file: 'publications.html',  priority: '0.5', changefreq: 'monthly' },
  { path: '/privacy-policy.html',file: 'privacy-policy.html',priority: '0.3', changefreq: 'yearly'  },
  { path: '/disclaimers.html',   file: 'disclaimers.html',   priority: '0.3', changefreq: 'yearly'  }
];

function fileLastmod(relFile, fallback) {
  try {
    const abs = path.join(PROJECT_ROOT, relFile);
    const stat = fs.statSync(abs);
    return stat.mtime.toISOString().split('T')[0];
  } catch (_) {
    return fallback;
  }
}

// State mapping from js/app-final.js (duplicated here to avoid module import issues in simple script)
const STATE_CODE_MAP = {
  // Major States
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
  // Northeast States
  'Manipur': 'MN',
  'Meghalaya': 'ML',
  'Mizoram': 'MZ',
  'Nagaland': 'NL',
  'Tripura': 'TR',
  'Arunachal Pradesh': 'AR',
  'Sikkim': 'SK',
  // Union Territories
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

// Get unique state names to avoid duplicates (e.g., Orissa/Odisha)
// preferring the keys as they are the display names used in deep linking
const uniqueStates = new Set(Object.keys(STATE_CODE_MAP));

// Helper to slugify (duplicate of app-final.js logic)
function toSlug(name) {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[&]/g, 'and');
}

function generateSitemap() {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

  const currentDate = new Date().toISOString().split('T')[0];

  // 1. Add Static Routes (real lastmod from source HTML mtime, differentiated priority/changefreq)
  staticRoutes.forEach(route => {
    const url = route.path === '/' ? `${BASE_URL}/` : `${BASE_URL}${route.path}`;
    const lastmod = fileLastmod(route.file, currentDate);
    xml += `
  <url>
    <loc>${url}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`;
  });

  // 2. Add All-India View (Clean URL) — derives from index.html template via generate-static-pages.js
  xml += `
  <url>
    <loc>${BASE_URL}/all-india/</loc>
    <lastmod>${fileLastmod('index.html', currentDate)}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`;

  // 3. Add Dynamic State Routes (Clean URLs)
  uniqueStates.forEach(stateName => {
    const slug = toSlug(stateName);
    const url = `${BASE_URL}/states/${slug}/`;

    xml += `
  <url>
    <loc>${url}</loc>
    <lastmod>${fileLastmod('index.html', currentDate)}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`;
  });

  xml += `
</urlset>`;

  // Determine output path (dist/ folder is standard for Vite build output)
  const distDir = path.resolve(__dirname, '../dist');
  const outputPath = path.join(distDir, 'sitemap.xml');

  // Ensure dist directory exists (it should after build, but just in case)
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, xml);
  console.log(`✅ Sitemap generated at: ${outputPath}`);
  console.log(`   - Static routes: ${staticRoutes.length}`);
  console.log(`   - Dynamic state routes: ${uniqueStates.size}`);
}

generateSitemap();
