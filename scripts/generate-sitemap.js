const fs = require('fs');
const path = require('path');

// Base URL for the production site
const BASE_URL = 'https://kananlabs.in';

// Static routes in your project
const staticRoutes = [
  '/',
  '/about.html',
  '/sector-watch.html',
  '/tradewatch.html',
  '/tracker.html',
  '/publications.html'
];

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

  // 1. Add Static Routes
  staticRoutes.forEach(route => {
    const url = route === '/' ? BASE_URL : `${BASE_URL}${route}`;
    xml += `
  <url>
    <loc>${url}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`;
  });

  // 2. Add All-India View (Clean URL)
  xml += `
  <url>
    <loc>${BASE_URL}/all-india/</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>`;

  // 3. Add Dynamic State Routes (Clean URLs)
  uniqueStates.forEach(stateName => {
    const slug = toSlug(stateName);
    const url = `${BASE_URL}/states/${slug}/`;

    xml += `
  <url>
    <loc>${url}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
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
