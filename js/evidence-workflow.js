/* evidence-workflow.js
 * Staggered ScrollTrigger entrance for the 5 evidence-workflow stages.
 * Modelled on triptych.js (opacity + y-translate, 0.10s stagger).
 * Depends on GSAP + ScrollTrigger (already loaded by the page).
 */
(function () {
    'use strict';

    function init() {
        var stages = document.querySelectorAll('.kl-flow__stage');
        if (!stages.length) return;

        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            stages.forEach(function (s) {
                s.style.opacity = '1';
                s.style.transform = 'none';
            });
            return;
        }

        if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
            stages.forEach(function (s) {
                s.style.opacity = '1';
                s.style.transform = 'none';
            });
            return;
        }

        gsap.set(stages, { opacity: 0, y: 28 });

        ScrollTrigger.create({
            trigger: '.kl-flow',
            start: 'top 82%',
            once: true,
            onEnter: function () {
                gsap.to(stages, {
                    opacity: 1,
                    y: 0,
                    duration: 0.95,
                    ease: 'power2.out',
                    stagger: 0.10,
                });
            },
        });
    }

    if (document.readyState === 'loading') {
        window.addEventListener('load', init);
    } else {
        init();
    }
})();
