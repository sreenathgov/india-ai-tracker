/* tw-demo-clone.js
 * Autoplay cycler for the TradeWatch demo stage on the landing page.
 * Crossfades through scenes 1–4 every SCENE_MS ms; triggers within-scene
 * reveals by adding .is-activated / .is-tagged / .is-in once a scene
 * becomes active. Respects prefers-reduced-motion. Demo only starts once
 * the stage enters the viewport (IntersectionObserver gate).
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
    // Pacing scaled 0.7× from the original 5500 / 450 for ~30% faster cycle.
    const SCENE_MS  = 3850;
    const REVEAL_MS = 315;

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
            setTimeout(() => row.classList.add('is-tagged'), 140 + i * 112);
        });

        const inboxStat = scene.querySelector('.tw-inbox-stat');
        if (inboxStat) setTimeout(() => inboxStat.classList.add('is-in'), 770);

        const pkgStat = scene.querySelector('.tw-pkg-compile-stat');
        if (pkgStat) setTimeout(() => pkgStat.classList.add('is-in'), 105);
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

    let started = false;
    let sceneTimer = null;
    let currentIdx = 0;

    function startLoop() {
        if (started) return;
        started = true;
        show(0);
        currentIdx = 0;
        if (reduced) return;
        sceneTimer = setInterval(() => {
            currentIdx = (currentIdx + 1) % scenes.length;
            show(currentIdx);
        }, SCENE_MS);
    }

    if (!('IntersectionObserver' in window)) {
        // Older browser — fall back to immediate start (matches old behaviour).
        startLoop();
        return;
    }

    const io = new IntersectionObserver((entries) => {
        for (const e of entries) {
            if (e.isIntersecting && e.intersectionRatio >= 0.25) {
                startLoop();
                io.disconnect();
                break;
            }
        }
    }, { threshold: 0.25, rootMargin: '0px 0px -10% 0px' });

    io.observe(stage);
})();
