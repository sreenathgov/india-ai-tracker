const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const script = fs.readFileSync(path.join(__dirname, '../js/resources.js'), 'utf8');

// Minimal DOM adapter exercises the real renderer, including click/hash events.
class Element {
  constructor(tag = 'div') {
    this.tagName = tag; this.childNodes = []; this.dataset = {}; this.attrs = {};
    this.events = {}; this.hidden = false; this.textContent = '';
    const classes = new Set();
    this.classList = { add: c => classes.add(c), toggle: (c, on) => on ? classes.add(c) : classes.delete(c) };
  }
  appendChild(node) { this.childNodes.push(node); return node; }
  replaceChildren(...nodes) { this.childNodes = nodes; }
  setAttribute(k, v) { this.attrs[k] = v; }
  addEventListener(k, fn) { this.events[k] = fn; }
  scrollIntoView() {}
}
function boot(data, { unbuilt = false, hash = '', failRender = false } = {}) {
  const nodes = Object.fromEntries(['resources-data', 'resourcesFeatured', 'resourcesGrid', 'resourcesPagination', 'resourcesStatus'].map(id => [id, new Element()]));
  nodes['resources-data'].textContent = typeof data === 'string' ? data : JSON.stringify(data);
  const original = new Element('a'); nodes.resourcesGrid.appendChild(original);
  const tabs = ['all', 'insight', 'whitepaper', 'news'].map(bucket => Object.assign(new Element('button'), { dataset: { bucket } }));
  const win = { location: { hash, pathname: '/resources.html' }, events: {}, addEventListener(k, fn) { this.events[k] = fn; } };
  vm.runInNewContext(script, {
    document: { body: { hasAttribute: () => unbuilt }, getElementById: id => nodes[id], querySelectorAll: () => tabs,
      createElement: tag => { if (failRender) throw new Error('fixture render failure'); return new Element(tag); } },
    window: win, history: { replaceState: (_, __, value) => { win.location.hash = value.startsWith('#') ? value : ''; } },
    console: { error() {} }
  });
  return { nodes, tabs, win, original };
}
const items = Array.from({ length: 22 }, (_, n) => ({ title: `Article ${n}`, href: `publications/a${n}/`, bucket: 'insight', date: '2026-08-07', featured: n === 0 }));
test('unbuilt source explains the preview workflow instead of an empty publication state', () => {
  const { nodes, tabs } = boot({ items: [] }, { unbuilt: true });
  assert.match(nodes.resourcesStatus.textContent, /npm run preview/);
  assert.ok(tabs.every(t => t.disabled));
});
test('malformed JSON and invalid records preserve prerendered content', () => {
  for (const data of ['{broken', { items: [{ title: 'Missing fields' }] }]) {
    const { nodes, tabs, original } = boot(data);
    assert.equal(nodes.resourcesGrid.childNodes[0], original);
    assert.match(nodes.resourcesStatus.textContent, /temporarily unavailable/);
    assert.ok(tabs.every(t => t.disabled));
  }
});
test('failed enhancement restores the static baseline', () => {
  const { nodes, original } = boot({ items }, { failRender: true });
  assert.equal(nodes.resourcesGrid.childNodes[0], original);
  assert.match(nodes.resourcesStatus.textContent, /temporarily unavailable/);
});
test('featured article and nine-card pagination survive category changes', () => {
  const { nodes, tabs, win } = boot({ items });
  assert.equal(nodes.resourcesFeatured.childNodes.length, 1);
  assert.equal(nodes.resourcesGrid.childNodes.length, 9);
  nodes.resourcesPagination.childNodes.at(-1).events.click();
  assert.equal(nodes.resourcesGrid.childNodes[0].href, 'publications/a10/');
  tabs[1].events.click();
  assert.equal(win.location.hash, '#insights');
  assert.equal(nodes.resourcesFeatured.childNodes.length, 0);
  assert.equal(nodes.resourcesGrid.childNodes[0].href, 'publications/a0/');
  tabs[3].events.click();
  assert.equal(nodes.resourcesGrid.childNodes.length, 0);
  assert.match(nodes.resourcesStatus.textContent, /Nothing published/);
  assert.equal(nodes.resourcesPagination.hidden, true);
  win.location.hash = ''; win.events.hashchange();
  assert.equal(nodes.resourcesGrid.childNodes.length, 9);
});
test('deep-linked category and failed image use the intended fallback', () => {
  const { nodes } = boot({ items: [...items, { title: 'Paper', href: 'dossiers/p.pdf', bucket: 'whitepaper', image: 'missing.png' }] }, { hash: '#whitepapers' });
  const media = nodes.resourcesGrid.childNodes[0].childNodes[0];
  media.childNodes[0].events.error();
  assert.equal(media.childNodes[0].src, 'assets/logos/kanan-kl-hor-white.png');
});

test('newsletter keeps its pill label and arrow through success and failure', async () => {
  const html = fs.readFileSync(path.join(__dirname, '../resources.html'), 'utf8');
  const inline = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]).find(s => s.includes('resourcesBriefForm'));
  for (const failure of [false, true]) {
    let submit;
    let called = 0;
    const label = { textContent: 'Subscribe' };
    const button = { disabled: false, querySelector: () => label };
    Object.defineProperty(button, 'textContent', { set() { throw new Error('Button children must be preserved'); } });
    const input = { value: 'reader@example.test', reportValidity: () => true };
    const status = { hidden: true, style: {} };
    const form = { addEventListener: (_, fn) => { submit = fn; }, querySelector: s => s.startsWith('input') ? input : button, reset() { input.value = ''; } };
    vm.runInNewContext(inline, {
      document: { addEventListener: (_, fn) => fn(), getElementById: id => id === 'resourcesBriefForm' ? form : status },
      window: { brevoSubscribe: async email => { called++; assert.equal(email, 'reader@example.test'); if (failure) throw new Error('fixture'); } }
    });
    submit({ preventDefault() {} });
    assert.equal(label.textContent, 'Subscribing…');
    submit({ preventDefault() {} });
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(called, 1);
    assert.equal(button.disabled, false);
    assert.equal(label.textContent, 'Subscribe');
    assert.match(status.textContent, failure ? /try again/ : /Thank you/);
    assert.equal(input.value, failure ? 'reader@example.test' : '');
  }
});
