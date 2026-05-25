/* tw-demo-clone.js
 * Autoplay cycler for the TradeWatch demo stage on the landing page.
 * Crossfades through scenes 1–4 every SCENE_MS ms; triggers within-scene
 * reveals by adding .is-activated / .is-tagged / .is-in once a scene
 * becomes active. Respects prefers-reduced-motion.
 */
(function () {
    'use strict';

    const stage = document.querySelector('.kl-twdemo__stage');
    if (!stage) return;

    const scenes = Array.from(stage.querySelectorAll('.tw-scene'));
    const dots   = Array.from(stage.querySelectorAll('.tw-scene-meter-dot'));
    const label  = stage.querySelector('#twChromeScene');
    if (scenes.length < 2) return;

    const SCENE_TITLES = [
        'Morning Brief',
        'Plugs into your stack',
        'Bundle arrives',
        'Reviewer signs · packets delivered'
    ];
    const SCENE_MS  = 5500;
    const REVEAL_MS = 450;

    const reduced = window.matchMedia &&
                    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function resetScene(scene) {
        const brief = scene.querySelector('.tw-brief');
        if (brief) brief.classList.remove('is-activated');
        scene.querySelectorAll('.tw-inbox-row.is-tagged').forEach(r => r.classList.remove('is-tagged'));
        const inboxStat = scene.querySelector('.tw-inbox-stat');
        if (inboxStat) inboxStat.classList.remove('is-in');
        const pkgStat = scene.querySelector('.tw-pkg-compile-stat');
        if (pkgStat) pkgStat.classList.remove('is-in');
    }

    function activateInner(scene) {
        const brief = scene.querySelector('.tw-brief');
        if (brief) brief.classList.add('is-activated');

        const inboxRows = scene.querySelectorAll('.tw-inbox-row');
        inboxRows.forEach((row, i) => {
            setTimeout(() => row.classList.add('is-tagged'), 200 + i * 160);
        });

        const inboxStat = scene.querySelector('.tw-inbox-stat');
        if (inboxStat) setTimeout(() => inboxStat.classList.add('is-in'), 1100);

        const pkgStat = scene.querySelector('.tw-pkg-compile-stat');
        if (pkgStat) setTimeout(() => pkgStat.classList.add('is-in'), 150);
    }

    function show(i) {
        scenes.forEach((s, k) => {
            const active = k === i;
            s.classList.toggle('is-active', active);
            if (!active) resetScene(s);
        });
        dots.forEach((d, k) => d.classList.toggle('is-active', k === i));
        if (label && SCENE_TITLES[i]) label.textContent = SCENE_TITLES[i];

        setTimeout(() => activateInner(scenes[i]), REVEAL_MS);
    }

    show(0);
    if (reduced) return;

    setInterval(() => {
        const next = (scenes.findIndex(s => s.classList.contains('is-active')) + 1) % scenes.length;
        show(next);
    }, SCENE_MS);
})();
