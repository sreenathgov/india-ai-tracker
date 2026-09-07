const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const script = fs.readFileSync(path.join(__dirname, '../js/resources-subscribe.js'), 'utf8');

function boot({ columns = 3, seen = false, unbuilt = false, storageBlocked = false, reducedMotion = false } = {}) {
  const events = {}, frames = [], timers = [];
  const storage = new Map(seen ? [['kanan:resources-subscribe:seen', '1']] : []);
  const classes = new Set();
  let dismiss;
  const card = { hidden: true, inert: true, attrs: { 'aria-hidden': 'true' },
    getBoundingClientRect: () => ({ top: 420, left: 920, right: 1256, bottom: 696 }),
    classList: { add: c => classes.add(c), remove: c => classes.delete(c) },
    setAttribute(k, v) { this.attrs[k] = v; }, removeAttribute(k) { delete this.attrs[k]; },
    contains: element => element === card,
    querySelector: () => ({ addEventListener: (_, fn) => { dismiss = fn; } }) };
  const document = { hidden: false, activeElement: { matches: () => false }, blocked: false, damaged: false,
    body: { hasAttribute: () => unbuilt },
    getElementById: id => id === 'resourcesSubscribe' ? card : grid,
    querySelector: selector => selector === '.rc-tab:disabled' ? document.damaged : document.blocked,
    addEventListener: (type, fn) => { events[type] = fn; } };
  const window = { scrollY: 0, matchMedia: () => ({ matches: reducedMotion }),
    addEventListener: (type, fn) => { events[type] = fn; },
    removeEventListener: type => { delete events[type]; },
    setTimeout: (fn, delay) => { timers.push({ fn, delay }); } };
  const grid = { columns, count: 9,
    getBoundingClientRect: () => ({ bottom: 5000 - window.scrollY }),
    querySelectorAll: () => Array.from({ length: grid.count }, (_, index) => ({
      getBoundingClientRect: () => {
        const top = 1000 + Math.floor(index / grid.columns) * 500 - window.scrollY;
        return { top, bottom: top + 400, height: 400 };
      },
      focus: () => { document.activeElement = { article: index }; }
    })) };
  vm.runInNewContext(script, { window, document,
    sessionStorage: { getItem: k => { if (storageBlocked) throw Error('blocked'); return storage.get(k); },
      setItem: (k, v) => { if (storageBlocked) throw Error('blocked'); storage.set(k, v); } },
    requestAnimationFrame: fn => frames.push(fn) });
  function scroll(y) { window.scrollY = y; events.scroll?.(); while (frames.length) frames.shift()(); }
  return { card, classes, document, window, grid, events, storage, timers, scroll, close: () => dismiss?.() };
}

test('waits until the second visual row is read at all responsive column counts', () => {
  for (const columns of [3, 2, 1]) {
    const state = boot({ columns });
    assert.equal(state.card.hidden, true);
    const focus = state.document.activeElement;
    state.scroll(1700);
    assert.equal(state.card.hidden, true);
    state.scroll(1800);
    assert.equal(state.card.hidden, false);
    assert.equal(state.card.inert, false);
    assert.ok(state.classes.has('is-visible'));
    assert.equal(state.document.activeElement, focus, 'entrance must not move focus');
    assert.equal(state.storage.size, 1);
  }
});

test('dismisses to the right, restores keyboard focus, and never reopens in the session', () => {
  const state = boot();
  state.scroll(1800);
  state.document.activeElement = state.card;
  state.close();
  assert.equal(state.card.inert, true);
  assert.equal(state.card.attrs['aria-hidden'], 'true');
  assert.equal(state.classes.has('is-visible'), false);
  assert.equal(state.document.activeElement.article, 6);
  assert.equal(state.timers[0].delay, 400);
  state.timers[0].fn();
  state.scroll(1900);
  assert.equal(state.card.hidden, true);
  const revisit = boot({ seen: true });
  revisit.scroll(1800);
  assert.equal(revisit.card.hidden, true);
});

test('Escape respects other overlays and reduced motion; dismissal does not steal outside focus', () => {
  const state = boot({ reducedMotion: true });
  state.scroll(1800);
  const focus = state.document.activeElement;
  state.document.blocked = true;
  state.events.keydown({ key: 'Escape' });
  assert.equal(state.card.inert, false);
  state.document.blocked = false;
  state.events.keydown({ key: 'Escape' });
  assert.equal(state.card.inert, true);
  assert.equal(state.timers[0].delay, 0);
  assert.equal(state.document.activeElement, focus);
});

test('defers while consent/menu is open or a form is being edited; never interrupts after the catalog', () => {
  const state = boot();
  state.document.blocked = true;
  state.scroll(1800);
  assert.equal(state.card.hidden, true);
  state.document.blocked = false;
  state.document.activeElement = { matches: () => true };
  state.scroll(1900);
  assert.equal(state.card.hidden, true);
  state.document.activeElement = { matches: () => false };
  state.scroll(5000);
  assert.equal(state.card.hidden, true);
  state.scroll(1700);
  assert.equal(state.card.hidden, true, 'upward scroll must not reveal');
  state.scroll(1800);
  assert.equal(state.card.hidden, false);
});

test('uses the current grid after filtering, pagination or resizing and ignores empty/damaged catalogs', () => {
  const state = boot();
  state.grid.count = 1;
  state.scroll(1800);
  assert.equal(state.card.hidden, true);
  state.grid.count = 9;
  state.grid.columns = 1;
  state.document.damaged = true;
  state.scroll(1810);
  assert.equal(state.card.hidden, true);
  state.document.damaged = false;
  state.scroll(1820);
  assert.equal(state.card.hidden, false);
  const source = boot({ unbuilt: true });
  source.scroll(1800);
  assert.equal(source.card.hidden, true);
});

test('unavailable session storage does not break reading or repeated-dismissal protection', () => {
  const state = boot({ storageBlocked: true });
  state.scroll(1800);
  assert.equal(state.card.hidden, false);
  state.close();
  state.timers[0].fn();
  state.scroll(1900);
  assert.equal(state.card.hidden, true);
});

test('retracts if it would obscure a focused page control', () => {
  const state = boot();
  state.scroll(1800);
  state.events.focusin({ target: { getBoundingClientRect: () => ({ top: 300, left: 40, right: 400, bottom: 600 }) } });
  assert.equal(state.card.inert, false);
  state.events.focusin({ target: { getBoundingClientRect: () => ({ top: 500, left: 880, right: 1200, bottom: 650 }) } });
  assert.equal(state.card.inert, true);
});
