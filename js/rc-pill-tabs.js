/**
 * Resources tab bar — GSAP hover-circle-fill + label crossfade, ported from
 * the reactbits.dev PillNav component to vanilla DOM/GSAP. The currently
 * active tab (per resources.js's `is-active` class) stays locked in the
 * filled state; hover previews the same fill on any other tab.
 */
(function () {
  'use strict';

  if (typeof window.gsap === 'undefined') return;

  const rail = document.querySelector('.rc-tabs');
  if (!rail) return;

  const tabs = Array.from(rail.querySelectorAll('.rc-tab'));
  if (!tabs.length) return;

  const timelines = new Map();

  function layoutTab(tab) {
    const circle = tab.querySelector('.rc-tab__hover-circle');
    const label = tab.querySelector('.rc-tab__label');
    const labelHover = tab.querySelector('.rc-tab__label-hover');
    if (!circle || !label || !labelHover) return;

    const rect = tab.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    if (!w || !h) return;

    const R = ((w * w) / 4 + h * h) / (2 * h);
    const D = Math.ceil(2 * R) + 2;
    const delta = Math.ceil(R - Math.sqrt(Math.max(0, R * R - (w * w) / 4))) + 1;
    const originY = D - delta;

    circle.style.width = D + 'px';
    circle.style.height = D + 'px';
    circle.style.bottom = -delta + 'px';

    gsap.set(circle, { xPercent: -50, scale: 0, transformOrigin: '50% ' + originY + 'px' });
    gsap.set(label, { y: 0 });
    gsap.set(labelHover, { y: h + 12, opacity: 0 });

    const tl = gsap.timeline({ paused: true });
    tl.to(circle, { scale: 1.2, xPercent: -50, duration: 2, ease: 'power3.easeOut', overwrite: 'auto' }, 0);
    tl.to(label, { y: -(h + 8), duration: 2, ease: 'power3.easeOut', overwrite: 'auto' }, 0);
    gsap.set(labelHover, { y: Math.ceil(h + 100), opacity: 0 });
    tl.to(labelHover, { y: 0, opacity: 1, duration: 2, ease: 'power3.easeOut', overwrite: 'auto' }, 0);

    timelines.get(tab)?.tl.kill();
    timelines.set(tab, { tl, active: null });

    syncTab(tab);
  }

  function layoutAll() {
    tabs.forEach(layoutTab);
  }

  function syncTab(tab) {
    const entry = timelines.get(tab);
    if (!entry) return;
    entry.active?.kill();
    const target = tab.classList.contains('is-active') ? entry.tl.duration() : 0;
    entry.tl.progress(target / entry.tl.duration());
  }

  function syncAll() {
    tabs.forEach(syncTab);
  }

  tabs.forEach(tab => {
    tab.addEventListener('mouseenter', () => {
      const entry = timelines.get(tab);
      if (!entry) return;
      entry.active?.kill();
      entry.active = entry.tl.tweenTo(entry.tl.duration(), { duration: 0.3, ease: 'power3.easeOut', overwrite: 'auto' });
    });

    tab.addEventListener('mouseleave', () => {
      const entry = timelines.get(tab);
      if (!entry) return;
      if (tab.classList.contains('is-active')) return;
      entry.active?.kill();
      entry.active = entry.tl.tweenTo(0, { duration: 0.2, ease: 'power3.easeOut', overwrite: 'auto' });
    });
  });

  layoutAll();

  window.addEventListener('resize', layoutAll);
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(layoutAll).catch(() => {});
  }

  const observer = new MutationObserver(syncAll);
  observer.observe(rail, { attributes: true, attributeFilter: ['class'], subtree: true });
})();
