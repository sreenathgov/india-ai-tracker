// Explicit maintenance command, never run by deployment. Review its JSON diff.
const fs = require('node:fs');
const path = require('node:path');
const {ROOT, DIST, INVENTORY, forbidden, walk, references, localPath} = require('./inventory');
const queue = walk(DIST).filter(file => file.endsWith('.html')).map(file => path.relative(DIST, file));
queue.push('data/jurisdictions.json', 'data/advisory_services.json', 'data/strategic_insights.json',
  'js/india-states-clean.geojson', 'api/all-india/categories.json', 'api/states/recent-counts.json',
  'api/last-updated.json', 'js/site-routes.js', 'dossiers/kl-handbook-india-ai-regulations.pdf', '.well-known/security.txt');
for (const entry of fs.readdirSync(path.join(ROOT, 'api/states'), {withFileTypes:true})) {
  if (entry.isDirectory() && /^[A-Z]{2}$/.test(entry.name)) queue.push(`api/states/${entry.name}/categories.json`);
}
const seen = new Set();
const assets = new Set();
while (queue.length) {
  const relative = queue.shift();
  if (seen.has(relative)) continue;
  seen.add(relative);
  if (forbidden.test(relative)) throw new Error(`Private dependency referenced: ${relative}`);
  const source = path.join(ROOT, relative);
  const generated = path.join(DIST, relative);
  const file = relative.endsWith('.html') && fs.existsSync(generated) ? generated : fs.existsSync(source) ? source : generated;
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) continue;
  if (!relative.endsWith('.html') && fs.existsSync(source)) assets.add(relative);
  if (!/\.(html|css|js|json)$/.test(relative)) continue;
  const content = fs.readFileSync(file, 'utf8');
  const base = relative.endsWith('.html') && /<base\s+href=["']\//.test(content) ? 'index.html' : relative;
  for (const ref of references(content)) {
    const candidate = localPath(ref, relative.endsWith('.js') ? 'index.html' : base);
    if (candidate && !candidate.endsWith('.html')) queue.push(candidate);
  }
}
assets.delete('.well-known/security.txt');
const inventory = {version:1, assets:[...assets].sort(), publicFiles:['.well-known/security.txt', 'robots.txt']};
fs.writeFileSync(INVENTORY, JSON.stringify(inventory, null, 2) + '\n');
console.log(`Public inventory: ${assets.size} individually approved source assets. Review before committing.`);
