/** An optional invitation after reading, never a modal or a timed interruption. */
(function () {
  'use strict';

  const card = document.getElementById('resourcesSubscribe');
  const grid = document.getElementById('resourcesGrid');
  const SESSION_KEY = 'kanan:resources-subscribe:seen';
  if (!card || !grid || document.body.hasAttribute('data-resources-unbuilt')) return;
  try { if (sessionStorage.getItem(SESSION_KEY)) return; } catch (_) { /* Private storage may be unavailable. */ }

  let shown = false;
  let open = false;
  let scheduled = false;
  let previousScroll = window.scrollY;

  function otherPromptOpen() {
    return document.querySelector('.cookie-consent, .staggered-menu-wrapper[data-open], .contact-panel-overlay.active');
  }

  function close() {
    if (!open) return;
    open = false;
    // Return keyboard users to a visible article; mouse/scroll readers keep their focus.
    if (card.contains(document.activeElement)) {
      const target = Array.from(grid.querySelectorAll('.rc-card'))
        .find(article => article.getBoundingClientRect().bottom > 128)
        || document.querySelector('.rc-tab.is-active');
      if (target) target.focus({ preventScroll: true });
    }
    card.inert = true;
    card.setAttribute('aria-hidden', 'true');
    card.classList.remove('is-visible');
    const duration = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 400;
    window.setTimeout(() => { card.hidden = true; }, duration);
  }

  function reveal() {
    shown = true;
    open = true;
    // Cap impressions, not just dismissals: reloads and category changes must not nag.
    try { sessionStorage.setItem(SESSION_KEY, '1'); } catch (_) { /* In-memory cap still applies. */ }
    window.removeEventListener('scroll', onScroll);
    card.hidden = false;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (!open) return;
      card.inert = false;
      card.removeAttribute('aria-hidden');
      card.classList.add('is-visible');
    }));
  }

  function checkProgress() {
    scheduled = false;
    const movingDown = window.scrollY > previousScroll;
    previousScroll = window.scrollY;
    if (shown || !movingDown || document.hidden || otherPromptOpen()) return;
    if (document.querySelector('.rc-tab:disabled')) return;
    // Do not invite while someone is typing or after they have left the catalog.
    if (document.activeElement?.matches('input, textarea, select, [contenteditable="true"]')) return;
    if (grid.getBoundingClientRect().bottom <= 128) return;

    // Read actual visual rows, so 3/2/1-column layouts and newly rendered pages
    // all share the same trigger. At most nine rectangles are read per scroll frame.
    const rows = [];
    for (const article of grid.querySelectorAll('.rc-card')) {
      const rect = article.getBoundingClientRect();
      if (!rect.height) continue;
      const row = rows.at(-1);
      if (row && Math.abs(row.top - rect.top) < 2) row.bottom = Math.max(row.bottom, rect.bottom);
      else rows.push({ top: rect.top, bottom: rect.bottom });
      if (rows.length > 2) break;
    }
    // The second row has cleared the header and its reading space.
    if (rows.length >= 2 && rows[1].bottom <= 128) reveal();
  }

  function onScroll() {
    if (!scheduled) {
      scheduled = true;
      requestAnimationFrame(checkProgress);
    }
  }

  card.querySelector('.rc-subscribe__close').addEventListener('click', close);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !event.defaultPrevented && !otherPromptOpen()) close();
  }, true); // Check other panels before their own Escape handlers remove them.
  // An optional invitation must never obscure a control reached by keyboard.
  document.addEventListener('focusin', event => {
    if (!open || card.contains(event.target)) return;
    const focused = event.target.getBoundingClientRect();
    const invitation = card.getBoundingClientRect();
    if (focused.right > invitation.left && focused.left < invitation.right
      && focused.bottom > invitation.top && focused.top < invitation.bottom) close();
  });
  window.addEventListener('scroll', onScroll, { passive: true });
})();
