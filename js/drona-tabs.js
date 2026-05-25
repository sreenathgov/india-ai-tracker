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
                label: 'Without Drona',
                body:  'A confident sentence. The classification <em>sounds</em> right. But there is no source, no rule trail and nothing to hand to customs officials when asked where this came from.'
            },
            with: {
                label: 'With Drona',
                body:  'Every code resolves against a structured rule pack with the source clause, the schedule, and the version stamped to the answer. <em>The AI extracts; the symbol decides.</em>'
            }
        },
        {
            without: {
                label: 'Without Drona',
                body:  'A black-box output. A high confidence score and no audit trail. Three years later, in a Section 149 review, the model is gone and so is the reasoning.'
            },
            with: {
                label: 'With Drona',
                body:  'Every claim resolves to one of four states — <em>Open, Blocked, Conditional, Unclear</em> — and every state points to the rule that produced it. Deterministic-first, replayable, defensible.'
            }
        },
        {
            without: {
                label: 'Without Drona',
                body:  'One model, one answer, every jurisdiction. The same packet is "compliant" in Mumbai and silently non-compliant in Rotterdam — and you only find out at the port.'
            },
            with: {
                label: 'With Drona',
                body:  'A jurisdiction-portable architecture. The same shipment fact produces an Indian Shipping Bill, an EU AES declaration, and a US ITN-bearing filing.'
            }
        },
        {
            without: {
                label: 'Without Drona',
                body:  'The regulation changed last quarter. Your tool answered it the old way. Nothing in the system knows when, why, or against which version of the law a decision was made.'
            },
            with: {
                label: 'With Drona',
                body:  'A bi-temporal knowledge layer that remembers when a rule was true and when it changed. <em>Yesterday\'s packet stays defensible</em>. Today\'s decisions ride the live rule pack.'
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
        var CHIP_ORDERS = [0, 2, 4, 6];

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
