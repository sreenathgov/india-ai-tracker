/**
 * Optional lead gate for downloadable Resources reports.
 * The PDF remains a public static asset; this script gates the normal catalog
 * journey and records access before starting the browser download.
 */
(function () {
  'use strict';

  const dialog = document.getElementById('reportAccessDialog');
  const form = document.getElementById('reportAccessForm');
  const status = document.getElementById('reportAccessStatus');
  if (!dialog || !form || !status || typeof dialog.showModal !== 'function') return;

  const titleNode = dialog.querySelector('[data-report-title]');
  const submit = form.querySelector('button[type="submit"]');
  const submitLabel = form.querySelector('[data-report-submit-label]');
  const downloadAgain = dialog.querySelector('[data-report-download-again]');
  const closeButton = dialog.querySelector('[data-report-close]');
  const nameInput = form.querySelector('input[name="name"]');
  const emailInput = form.querySelector('input[name="email"]');
  const honeypot = form.querySelector('input[name="company_website"]');

  let activeTrigger = null;
  let activeReport = null;

  function accessKey(slug) {
    return `kanan:report-access:${slug}`;
  }

  function hasAccess(slug) {
    try { return sessionStorage.getItem(accessKey(slug)) === '1'; }
    catch (_) { return false; }
  }

  function rememberAccess(slug) {
    try { sessionStorage.setItem(accessKey(slug), '1'); }
    catch (_) { /* The current successful download still proceeds. */ }
  }

  function setStatus(message, ok) {
    status.textContent = message;
    status.hidden = !message;
    status.dataset.state = ok ? 'success' : 'error';
  }

  function startDownload(href) {
    const link = document.createElement('a');
    link.href = href;
    link.download = '';
    link.hidden = true;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  function openGate(trigger) {
    activeTrigger = trigger;
    activeReport = {
      slug: trigger.dataset.reportSlug,
      title: trigger.dataset.reportTitle || 'this report',
      href: trigger.href
    };
    titleNode.textContent = activeReport.title;
    form.hidden = false;
    form.reset();
    downloadAgain.hidden = true;
    downloadAgain.href = '#';
    setStatus('', false);
    dialog.showModal();
    nameInput.focus();
  }

  document.addEventListener('click', function (event) {
    const trigger = event.target.closest('[data-report-gate]');
    if (!trigger) return;
    const slug = trigger.dataset.reportSlug;
    if (!slug || hasAccess(slug)) return;
    event.preventDefault();
    openGate(trigger);
  });

  closeButton.addEventListener('click', function () { dialog.close(); });
  dialog.addEventListener('cancel', function (event) {
    event.preventDefault();
    dialog.close();
  });
  dialog.addEventListener('close', function () {
    if (activeTrigger && activeTrigger.isConnected) activeTrigger.focus();
  });

  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    if (submit.disabled || !activeReport || !form.reportValidity()) return;

    submit.disabled = true;
    submitLabel.textContent = 'Preparing download…';
    setStatus('', false);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    try {
      const response = await fetch('/api/report-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: nameInput.value.trim(),
          email: emailInput.value.trim(),
          reportSlug: activeReport.slug,
          company_website: honeypot.value
        }),
        signal: controller.signal
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.success !== true) {
        throw new Error(result.message || 'We could not prepare the report. Please try again.');
      }

      rememberAccess(activeReport.slug);
      form.reset();
      form.hidden = true;
      downloadAgain.href = activeReport.href;
      downloadAgain.hidden = false;
      setStatus('Your download has started.', true);
      startDownload(activeReport.href);
    } catch (error) {
      const message = error.name === 'AbortError'
        ? 'The connection timed out. Please try again.'
        : error.message;
      setStatus(message, false);
    } finally {
      clearTimeout(timeout);
      submit.disabled = false;
      submitLabel.textContent = 'Download report';
    }
  });
})();
