const fs = require('fs');
const path = require('path');
const { jurisdictions, validateJurisdictions } = require('./jurisdictions');

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

const canonicalJurisdictions = validateJurisdictions(jurisdictions);

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

  // 2. Add All-India View (Clean URL) — derives from tracker.html via generate-static-pages.js
  xml += `
  <url>
    <loc>${BASE_URL}/all-india/</loc>
    <lastmod>${fileLastmod('index.html', currentDate)}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`;

  // 3. Add Dynamic State/UT Routes (canonical clean URLs only)
  canonicalJurisdictions.forEach(jurisdiction => {
    const url = `${BASE_URL}/states/${jurisdiction.slug}/`;

    xml += `
  <url>
    <loc>${url}</loc>
    <lastmod>${fileLastmod('index.html', currentDate)}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`;
  });

  // 4. Add Publications (from the manifest written by generate-publications.js)
  let publicationCount = 0;
  try {
    const manifestPath = path.join(PROJECT_ROOT, 'content', 'publications', 'index.json');
    const publications = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    publications.forEach(pub => {
      xml += `
  <url>
    <loc>${pub.url}</loc>
    <lastmod>${pub.updated || pub.date}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`;
      publicationCount++;
    });
  } catch (_) {
    // No manifest yet — publications simply aren't listed
  }

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
  console.log(`   - Dynamic jurisdiction routes: ${canonicalJurisdictions.length}`);
  console.log(`   - Publication routes: ${publicationCount}`);
}

generateSitemap();
