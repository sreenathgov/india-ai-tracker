const fs = require('node:fs');
const path = require('node:path');
const {createHash} = require('node:crypto');
const {ROOT, DIST, walk, localPath} = require('./inventory');
const holding = new Set(['drona.html', 'drona-aos.html', 'tradewatch.html']);
const footer = fs.readFileSync(path.join(ROOT, 'templates/shared-footer.html'), 'utf8');
const preview = process.env.VERCEL_ENV === 'preview';
for (const file of walk(DIST).filter(file => file.endsWith('.html'))) {
  const relative = path.relative(DIST, file);
  let html = fs.readFileSync(file, 'utf8');
  if (holding.has(relative)) html = html.replace(/\s*<script src="js\/footer\.js[^\"]*" defer><\/script>/, '\n' + footer);
  // Change anchors only: never rewrite a stylesheet, preload or canonical.
  html = html.replace(/<a\b([^>]*?)href="([^"\n]+)"/g, (match, attrs, href) => {
    if (/^(?:#|mailto:|tel:)/.test(href)) return match;
    const base = relative.includes('/') ? 'https://kananlabs.in/' : 'https://kananlabs.in/' + relative;
    let url; try { url = new URL(href.replace(/&amp;/g, '&'), base); } catch (_) { return match; }
    if (!['kananlabs.in', 'www.kananlabs.in', 'apply.kananlabs.in'].includes(url.hostname)) return match;
    if (url.hostname === 'apply.kananlabs.in' || /^\/(?:supplier-programme|project-origin)(?:\.html)?\/?$/.test(url.pathname)) {
      url = new URL((preview ? 'https://kananlabs.in/supplier-programme.html' : 'https://apply.kananlabs.in/') + url.search + url.hash);
      if (relative !== 'index.html' && url.searchParams.get('utm_source') === 'kanan_homepage') {
        url.searchParams.set('utm_source', 'kanan_' + relative.split('/')[0].replace(/\.html$/, ''));
      }
    }
    const output = preview ? url.pathname + url.search + url.hash : url.href;
    return '<a' + attrs + 'href="' + output.replace(/&/g, '&amp;') + '"';
  });
  if (!html.includes('/js/site-routes.js')) html = html.replace('</body>', '<script src="/js/site-routes.js" defer></script>\n</body>');
  // Existing visitors may have year-long immutable caches for these paths.
  // A content-derived query version changes only when the actual asset changes.
  html = html.replace(/\b(src|href)="([^"\n]+)"/g, (match, attribute, href) => {
    const target = localPath(href, html.includes('<base href="/"') ? 'index.html' : relative);
    if (!target || !/\.(?:css|js)$/.test(target)) return match;
    const asset = path.join(DIST, target);
    if (!fs.existsSync(asset)) return match; // The output verifier reports missing assets.
    const version = createHash('sha256').update(fs.readFileSync(asset)).digest('hex').slice(0,16);
    const [beforeHash, hash] = href.replace(/&amp;/g,'&').split('#');
    const [pathname, query] = beforeHash.split('?');
    const params = new URLSearchParams(query || '');
    params.set('v', version);
    return `${attribute}="${pathname}?${params.toString().replace(/&/g,'&amp;')}${hash ? '#'+hash : ''}"`;
  });
  fs.writeFileSync(file, html);
}
fs.writeFileSync(path.join(DIST, 'application-sitemap.xml'), '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://apply.kananlabs.in/</loc></url></urlset>\n');
fs.writeFileSync(path.join(DIST, 'application-robots.txt'), 'User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: https://apply.kananlabs.in/sitemap.xml\n');
console.log('Finalized shared footers, environment-aware routes and application discovery files.');
