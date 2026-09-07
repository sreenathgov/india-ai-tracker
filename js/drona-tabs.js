/* drona-tabs.js
 * Act A — Drona Regulatory Brain.
 * Click a failure-mode tab on the left, the right-side With/Without
 * cards cross-fade to that mode's narrative. Section also fades in on
 * scroll via ScrollTrigger (modelled on triptych.js).
 * Vanilla DOM — no framework. Respects prefers-reduced-motion.
 */
(function () {
    'use strict';

    /* ---- Content map: tab index → { without, with } narrative ---- */
    var SCRIPTS = [
        {
            without: {
                label: 'Without Kanan',
                body:  'Standard supplier reports show financial and delivery performance. Risks deeper in the supply chain may become visible <em>only after they affect production or delivery</em>.'
            },
            with: {
                label: 'With Kanan',
                body:  'Kanan connects authorised supplier, order and external-risk evidence to show where disruption could reach the production programme—giving the manufacturer <em>an earlier opportunity to respond</em>.'
            }
        },
        {
            without: {
                label: 'Without Kanan',
                body:  'The supplier may have a genuine PO, but the financing request, order documents and relevant risks reach the bank <em>as separate pieces</em>.'
            },
            with: {
                label: 'With Kanan',
                body:  'Kanan connects the supplier\'s stated working-capital request to the PO, supporting evidence and a one-time risk diagnosis—<em>creating a clearer path into bank or NBFC review</em>.'
            }
        },
        {
            without: {
                label: 'Without Kanan',
                body:  'Conventional appraisal begins with financial history, banking conduct and collateral. It may say much less about <em>what could affect completion of the specific order being financed</em>.'
            },
            with: {
                label: 'With Kanan',
                body:  'Kanan adds the order-level context: demand evidence, production dependencies and relevant external risks—showing what could affect fulfilment, why it matters and <em>what remains uncertain</em>.'
            }
        }
    ];

    function init() {
        var section = document.querySelector('.kl-drona');
        if (!section) return;

        var tabs   = Array.from(section.querySelectorAll('.kl-drona__tab'));
        var panels = Array.from(section.querySelectorAll('.kl-drona__panel'));
        if (!tabs.length || !panels.length) return;

        var reduced = window.matchMedia &&
                      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        /* ---- Entrance reveal ---- */
        if (reduced) {
            section.classList.add('is-in');
        } else if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
            ScrollTrigger.create({
                trigger: section,
                start: 'top 78%',
                once: true,
                onEnter: function () { section.classList.add('is-in'); }
            });
        } else {
            /* GSAP absent — fall back to IntersectionObserver */
            if ('IntersectionObserver' in window) {
                var io = new IntersectionObserver(function (entries) {
                    entries.forEach(function (e) {
                        if (e.isIntersecting) {
                            section.classList.add('is-in');
                            io.disconnect();
                        }
                    });
                }, { threshold: 0.18 });
                io.observe(section);
            } else {
                section.classList.add('is-in');
            }
        }

        /* ---- Tab swap ---- */
        /* Per-chip CSS `order` values used on tablet/mobile (match the
           --drona-tab-order rules in drona-brain.css). Chips spaced by 2
           so the panel block can slot at an odd integer between them. */
        var CHIP_ORDERS = [0, 2, 4];

        function swapTo(index) {
            var script = SCRIPTS[index];
            if (!script) return;

            /* Update tab state */
            tabs.forEach(function (t, i) {
                t.setAttribute('aria-selected', i === index ? 'true' : 'false');
            });

            /* Mobile/tablet: re-order the panel block to sit directly after
               the active chip. Must be an integer — CSS `order` rejects fractions. */
            var activeOrder = (CHIP_ORDERS[index] != null ? CHIP_ORDERS[index] : index * 2) + 1;
            section.style.setProperty('--drona-active-order', String(activeOrder));

            /* Cross-fade panels */
            panels.forEach(function (panel) {
                var state = panel.getAttribute('data-state'); // "without" | "with"
                var copy  = script[state];
                if (!copy) return;

                if (reduced) {
                    panel.querySelector('.kl-drona__panel-label').textContent = copy.label;
                    panel.querySelector('.kl-drona__panel-body').innerHTML    = copy.body;
                    return;
                }

                panel.classList.add('is-swapping');
                setTimeout(function () {
                    panel.querySelector('.kl-drona__panel-label').textContent = copy.label;
                    panel.querySelector('.kl-drona__panel-body').innerHTML    = copy.body;
                    panel.classList.remove('is-swapping');
                }, 220);
            });
        }

        var isMobileLayout = function () {
            return window.matchMedia('(max-width: 1023px)').matches;
        };

        tabs.forEach(function (tab, i) {
            tab.addEventListener('click', function () {
                if (isMobileLayout()) {
                    var wasActive = tab.getAttribute('aria-selected') === 'true';
                    if (wasActive) {
                        /* Collapse: deselect all, hide panels */
                        tabs.forEach(function (t) { t.setAttribute('aria-selected', 'false'); });
                        section.classList.remove('has-active-tab');
                    } else {
                        /* Expand: swap content, show panels */
                        swapTo(i);
                        section.classList.add('has-active-tab');
                    }
                } else {
                    swapTo(i);
                }
            });
            tab.addEventListener('keydown', function (e) {
                if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
                    e.preventDefault();
                    var next = (i + 1) % tabs.length;
                    tabs[next].focus();
                    swapTo(next);
                } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
                    e.preventDefault();
                    var prev = (i - 1 + tabs.length) % tabs.length;
                    tabs[prev].focus();
                    swapTo(prev);
                }
            });
        });

        /* Initial state */
        if (isMobileLayout()) {
            /* Mobile: all tabs collapsed, panels hidden */
            tabs.forEach(function (t) { t.setAttribute('aria-selected', 'false'); });
        } else {
            swapTo(0);
        }
    }

    if (document.readyState === 'loading') {
        window.addEventListener('load', init);
    } else {
        init();
    }
})();
