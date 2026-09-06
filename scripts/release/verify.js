const fs = require('node:fs');
const path = require('node:path');
const {createHash} = require('node:crypto');
const {ROOT, DIST, INVENTORY, pageFiles, functions, forbidden, walk, references, localPath} = require('./inventory');
const config = require('../../vercel.json');
const inventory = JSON.parse(fs.readFileSync(INVENTORY, 'utf8'));
const allowed = new Set([...inventory.assets, ...inventory.publicFiles, ...pageFiles,
  'resources.html','careers.html','sitemap.xml','application-sitemap.xml','application-robots.txt',
  'llms.txt','publications/index.json','text-pressure-bundle.js','scroll-reveal-bundle.js',
  'dist/text-pressure-bundle.js','dist/scroll-reveal-bundle.js']);
const files = walk(DIST).map(file => path.relative(DIST, file));
const errors = [];
const routes = files.filter(file => file.endsWith('.html'));
const emitted = new Set(files);
function resolves(file) {
  if (file === 'supplier-programme.html') return emitted.has(file);
  if (emitted.has(file)) return true;
  if (functions.some(name => file === 'api/' + name)) return true;
  const redirect = config.redirects.find(rule => !rule.has && !rule.source.includes(':') && rule.source === '/' + file.replace(/index\.html$/, ''));
  return redirect && (redirect.destination.startsWith('https:') || resolves(redirect.destination.slice(1)));
}
for (const file of files) {
  if (forbidden.test(file)) errors.push(`Private file emitted: ${file}`);
  const generatedPage = /^(?:all-india|states\/[^/]+|publications\/(?:cluster\/)?[^/]+|careers\/[^/]+)\/index\.html$/.test(file);
  const publicationAsset = /^publications\/[^/]+\/(?:assets\/)?[^/]+\.(?:png|jpe?g|webp|svg|pdf)$/.test(file);
  if (!allowed.has(file) && !generatedPage && !publicationAsset) errors.push(`File not in public inventory: ${file}`);
  if (!/\.(?:html|css)$/.test(file)) continue;
  const html = fs.readFileSync(path.join(DIST, file), 'utf8');
  const base = file.endsWith('.html') && /<base\s+href=["']\//.test(html) ? 'index.html' : file;
  const withoutEmbeddedImages = html.replace(/url\(\s*(["'])data:[\s\S]*?\1\s*\)/gi, '');
  const refs = [...withoutEmbeddedImages.matchAll(/(?:src|href|poster|data-src)\s*=\s*["']([^"']+)["']|url\(\s*["']?([^"')]+)/gi)].map(match => (match[1] || match[2]).replace(/&amp;/g, '&').trim());
  for (const ref of refs) {
    let target = localPath(ref, base);
    if (/^https:\/\/apply\.kananlabs\.in\/?(?:[?#]|$)/.test(ref)) target = 'supplier-programme.html';
    if (target && !resolves(target)) errors.push(`Broken destination: ${file} -> ${target}`);
    if (file.endsWith('.html') && target && emitted.has(target) && /\.(?:css|js)$/.test(target)) {
      const expected = createHash('sha256').update(fs.readFileSync(path.join(DIST, target))).digest('hex').slice(0,16);
      if (new URL(ref,'https://kananlabs.in/').searchParams.get('v') !== expected) errors.push(`Stale asset version: ${file} -> ${target}`);
    }
  }
  if (file.endsWith('.html') && !html.includes('/js/site-routes.js')) errors.push(`Missing routing contract: ${file}`);
}
for (const page of ['drona.html','drona-aos.html','tradewatch.html']) {
  const html = fs.readFileSync(path.join(DIST, page), 'utf8');
  if (!html.includes('class="kl-footer"') || html.includes('js/footer.js')) errors.push(`Missing shared footer: ${page}`);
}
const unique = [...new Set(errors)];
if (unique.length) {console.error(unique.join('\n')); process.exit(1);}
console.log(`Public release checks passed: ${routes.length} HTML routes, ${files.length} files; all static links/assets resolve.`);
if (process.env.RELEASE_EVIDENCE_DIR) {
  fs.mkdirSync(process.env.RELEASE_EVIDENCE_DIR,{recursive:true});
  fs.writeFileSync(path.join(process.env.RELEASE_EVIDENCE_DIR,'public-output.json'), JSON.stringify({routes, files, bytes:files.reduce((sum,file)=>sum+fs.statSync(path.join(DIST,file)).size,0)},null,2));
}
