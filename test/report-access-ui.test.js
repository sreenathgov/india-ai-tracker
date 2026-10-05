const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { JSDOM } = require('jsdom');

function boot(fetchImpl) {
  const dom = new JSDOM(`<!doctype html><html><body>
    <a id="trigger" href="/dossiers/report.pdf" download data-report-gate data-report-slug="report" data-report-title="Risk report">Report</a>
    <dialog id="reportAccessDialog"><button data-report-close>Close</button><span data-report-title></span>
      <form id="reportAccessForm"><input name="name" required><input name="email" type="email" required><input name="company_website"><button type="submit"><span data-report-submit-label>Download report</span></button></form>
      <p id="reportAccessStatus" hidden></p><a data-report-download-again href="#" hidden>Again</a>
    </dialog>
  </body></html>`, { url: 'https://kananlabs.in/resources.html', runScripts: 'outside-only', pretendToBeVisual: true });
  const { window } = dom;
  const dialog = window.document.getElementById('reportAccessDialog');
  dialog.showModal = function () { this.open = true; };
  dialog.close = function () { this.open = false; this.dispatchEvent(new window.Event('close')); };
  window.fetch = fetchImpl;
  let downloads = 0;
  const originalClick = window.HTMLAnchorElement.prototype.click;
  window.HTMLAnchorElement.prototype.click = function () {
    if (this.dataset.reportGate !== undefined) return originalClick.call(this);
    downloads += 1;
  };
  window.eval(fs.readFileSync('js/report-access.js', 'utf8'));
  return { dom, window, dialog, trigger: window.document.getElementById('trigger'), downloads: () => downloads,
    restore: () => { window.HTMLAnchorElement.prototype.click = originalClick; dom.window.close(); } };
}

test('report gate captures name and email once, then starts and remembers the download', async () => {
  let resolveFetch;
  const calls = [];
  const state = boot((url, options) => {
    calls.push({ url, body: JSON.parse(options.body) });
    return new Promise(resolve => { resolveFetch = resolve; });
  });
  try {
    state.trigger.click();
    assert.equal(state.dialog.open, true);
    assert.equal(state.window.document.activeElement.name, 'name');
    const form = state.window.document.getElementById('reportAccessForm');
    form.elements.name.value = 'Test Person';
    form.elements.email.value = 'test@example.com';
    form.dispatchEvent(new state.window.Event('submit', { bubbles: true, cancelable: true }));
    form.dispatchEvent(new state.window.Event('submit', { bubbles: true, cancelable: true }));
    assert.equal(calls.length, 1, 'a pending request cannot be submitted twice');
    resolveFetch({ ok: true, json: async () => ({ success: true }) });
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(calls[0].url, '/api/report-access');
    assert.equal(calls[0].body.reportSlug, 'report');
    assert.equal(state.downloads(), 1);
    assert.equal(state.window.sessionStorage.getItem('kanan:report-access:report'), '1');
    assert.equal(form.hidden, true);
    assert.equal(state.window.document.querySelector('[data-report-download-again]').hidden, false);
  } finally { state.restore(); }
});

test('report gate keeps the dialog open on failure and restores focus when closed', async () => {
  const state = boot(async () => ({ ok: false, json: async () => ({ message: 'Provider unavailable' }) }));
  try {
    state.trigger.focus();
    state.trigger.click();
    const form = state.window.document.getElementById('reportAccessForm');
    form.elements.name.value = 'Test Person';
    form.elements.email.value = 'test@example.com';
    form.dispatchEvent(new state.window.Event('submit', { bubbles: true, cancelable: true }));
    await new Promise(resolve => setImmediate(resolve));
    assert.match(state.window.document.getElementById('reportAccessStatus').textContent, /Provider unavailable/);
    assert.equal(state.downloads(), 0);
    assert.equal(state.window.sessionStorage.getItem('kanan:report-access:report'), null);
    const cancelled = new state.window.Event('cancel', { cancelable: true });
    state.dialog.dispatchEvent(cancelled);
    assert.equal(cancelled.defaultPrevented, true);
    assert.equal(state.dialog.open, false);
    assert.equal(state.window.document.activeElement, state.trigger);
  } finally { state.restore(); }
});
