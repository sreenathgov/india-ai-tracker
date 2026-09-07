const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.resolve(__dirname, '../..');
const DIST = path.join(ROOT, 'dist');
const INVENTORY = path.join(__dirname, 'public-files.json');
const pageFiles = [
  'index.html', 'about.html', 'sector-watch.html', 'tradewatch.html', 'tracker.html',
  'request-demo.html', 'supplier-programme.html', 'drona.html', 'drona-aos.html',
  'privacy-policy.html', 'terms-of-use.html', 'supplier-programme-terms.html',
  'disclaimers.html', '404.html'
];
const functions = ['apply', 'consult', 'subscribe', 'early-access', 'supplier-programme'];
const forbidden = /(?:^|\/)(?:\.env[^/]*|\.git|_lib|backups?|archive|integration|localization|node_modules|backend|docs|test|scripts|templates)(?:\/|$)|\.map$|(?:^|\/)api\/.*\.(?:js|ts)$/i;
function walk(dir) {
  return fs.readdirSync(dir, {withFileTypes:true}).flatMap(entry => {
    const file = path.join(dir, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Symlink is not a public asset: ${file}`);
    return entry.isDirectory() ? walk(file) : [file];
  });
}
function references(text) {
  const found = [];
  for (const match of text.matchAll(/(?:src|href|poster|data-src)\s*=\s*["']([^"']+)["']|url\(\s*["']?([^"')]+)|["'`]([^"'`\n]+\.(?:js|css|png|jpe?g|svg|webp|gif|ico|avif|mp4|webm|woff2?|ttf|otf|geojson|json|pdf)(?:[?#][^"'`\s]*)?)["'`]/gi)) {
    found.push((match[1] || match[2] || match[3]).replace(/&amp;/g, '&').trim());
  }
  return found;
}
function localPath(value, from) {
  if (/^(?:#|data:|mailto:|tel:|javascript:|blob:)/i.test(value) || value.includes('${')) return null;
  let url;
  try { url = new URL(value, 'https://kananlabs.in/' + from); } catch (_) { return null; }
  if (!['kananlabs.in', 'www.kananlabs.in', 'apply.kananlabs.in'].includes(url.hostname)) return null;
  const decoded = decodeURIComponent(url.pathname).replace(/^\//, '');
  return decoded.endsWith('/') || !decoded ? decoded + 'index.html' : decoded;
}
module.exports = {ROOT, DIST, INVENTORY, pageFiles, functions, forbidden, walk, references, localPath};
