/* Review controls only. The reusable SVG component contains no study-page UI. */
(() => {
  'use strict';

  const params = new URLSearchParams(location.search);
  const initialFrame = Math.max(0, Math.min(5, (Number(params.get('frame')) || 1) - 1));
  const initialPreview = ['wine', 'light', 'compare'].includes(params.get('preview')) ? params.get('preview') : 'wine';
  const roots = Array.from(document.querySelectorAll('[data-drona-frame]'));
  const studies = roots.map(root => new DronaOrderStyleFrames(root, { frame: initialFrame }));
  const frameButtons = Array.from(document.querySelectorAll('.dos-frame-list button[data-frame]'));
  const previewButtons = Array.from(document.querySelectorAll('[data-preview-mode]'));
  const title = document.getElementById('frame-title');
  const note = document.getElementById('frame-note');
  const count = document.getElementById('frame-count');
  let index = initialFrame;

  function updateUrl() {
    const next = new URL(location.href);
    next.searchParams.set('frame', String(index + 1));
    next.searchParams.set('preview', document.body.dataset.preview);
    history.replaceState(null, '', next);
  }

  function renderFrame(nextIndex, focusButton = false) {
    index = (nextIndex + DRONA_ORDER_FRAMES.length) % DRONA_ORDER_FRAMES.length;
    studies.forEach(study => study.setFrame(index));
    const frame = DRONA_ORDER_FRAMES[index];
    count.textContent = `FRAME ${String(index + 1).padStart(2, '0')} / 06`;
    title.textContent = frame.title;
    note.textContent = frame.note;
    frameButtons.forEach((button, buttonIndex) => {
      if (buttonIndex === index) button.setAttribute('aria-current', 'true');
      else button.removeAttribute('aria-current');
    });
    if (focusButton) frameButtons[index].focus({ preventScroll: true });
    updateUrl();
  }

  function setPreview(mode) {
    document.body.dataset.preview = mode;
    previewButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.previewMode === mode)));
    updateUrl();
  }

  frameButtons.forEach(button => button.addEventListener('click', () => renderFrame(Number(button.dataset.frame))));
  previewButtons.forEach(button => button.addEventListener('click', () => setPreview(button.dataset.previewMode)));
  document.querySelector('[data-previous]').addEventListener('click', () => renderFrame(index - 1));
  document.querySelector('[data-next]').addEventListener('click', () => renderFrame(index + 1));

  document.addEventListener('keydown', event => {
    if (event.target.matches('a, button, input, select, textarea')) return;
    if (event.key === 'ArrowLeft') renderFrame(index - 1, true);
    if (event.key === 'ArrowRight') renderFrame(index + 1, true);
  });

  setPreview(initialPreview);
  renderFrame(initialFrame);
})();
