/* triptych.js
 * Staggered ScrollTrigger entrance for the three portrait cards.
 * Depends on GSAP + ScrollTrigger, both already loaded by the page.
 */
(function () {
    'use strict';

    function init() {
        var cards = document.querySelectorAll('.kl-triptych__card');
        if (!cards.length) return;

        /* Reduced motion: just show them immediately */
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            cards.forEach(function (card) {
                card.style.opacity = '1';
                card.style.transform = 'none';
            });
            return;
        }

        if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
            /* GSAP not available — fallback: show cards */
            cards.forEach(function (card) {
                card.style.opacity = '1';
                card.style.transform = 'none';
            });
            return;
        }

        gsap.set(cards, { opacity: 0, y: 40 });

        ScrollTrigger.create({
            trigger: '.kl-triptych',
            start: 'top 82%',
            once: true,
            onEnter: function () {
                gsap.to(cards, {
                    opacity: 1,
                    y: 0,
                    duration: 1.0,
                    ease: 'power2.out',
                    stagger: 0.10,
                });
            },
        });
    }

    if (document.readyState === 'loading') {
        window.addEventListener('load', init);
    } else {
        /* Page already loaded (deferred late execution) */
        init();
    }
})();
