/**
 * careers.js — hero lattice animation, scroll reveals, and team filtering
 * for dist/careers.html.
 *
 * Degradation contract: the stylesheet renders every element in its FINAL,
 * fully-lit state. This file only ever animates *from* a hidden state *to* the
 * state CSS already describes. If GSAP fails to load, or JavaScript is off, the
 * page is complete and static — never blank.
 */

(function () {
    'use strict';

    var ALL_TEAMS = 'all';
    var reduced = window.matchMedia
        && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // -----------------------------------------------------------------------
    // Data
    // -----------------------------------------------------------------------

    /** The trimmed payload injected by scripts/generate-careers.js. */
    function readRoles() {
        var el = document.getElementById('careers-data');
        if (!el) return [];
        try {
            var parsed = JSON.parse(el.textContent);
            return Array.isArray(parsed.roles) ? parsed.roles : [];
        } catch (err) {
            console.warn('Careers: #careers-data did not parse —', err.message);
            return [];
        }
    }

    function countLabel(n) {
        return n === 1 ? '1 open role' : n + ' open roles';
    }

    // -----------------------------------------------------------------------
    // Team filter
    // -----------------------------------------------------------------------

    function initFilters() {
        var filters = document.getElementById('careersFilters');
        var grid = document.getElementById('careersGrid');
        var empty = document.getElementById('careersEmpty');
        var count = document.getElementById('careersCount');
        if (!filters || !grid) return;

        var buttons = Array.prototype.slice.call(filters.querySelectorAll('.cr-filter'));
        if (!buttons.length) return;

        var roles = readRoles();
        var rows = Array.prototype.slice.call(grid.querySelectorAll('.cr-role'));

        // Rows are keyed by slug so the payload — not the DOM order — decides
        // what a filter matches. Adding a role is then a pure data edit.
        var rowBySlug = {};
        rows.forEach(function (row) {
            rowBySlug[row.getAttribute('data-slug')] = row;
        });

        function apply(team) {
            var visible = 0;

            roles.forEach(function (role) {
                var row = rowBySlug[role.slug];
                if (!row) return;
                var show = (team === ALL_TEAMS) || role.team === team;
                row.hidden = !show;
                if (show) visible += 1;
            });

            // A row with no matching payload entry would otherwise be stranded
            // visible on every filter. Hide anything the data does not know.
            rows.forEach(function (row) {
                var slug = row.getAttribute('data-slug');
                var known = roles.some(function (r) { return r.slug === slug; });
                if (!known) row.hidden = true;
            });

            if (empty) empty.hidden = visible > 0;
            if (count) count.textContent = countLabel(visible);

            buttons.forEach(function (btn) {
                var on = btn.getAttribute('data-team') === team;
                btn.classList.toggle('is-active', on);
                btn.setAttribute('aria-pressed', on ? 'true' : 'false');
            });
        }

        buttons.forEach(function (btn) {
            btn.addEventListener('click', function () {
                apply(btn.getAttribute('data-team') || ALL_TEAMS);
            });
        });
    }

    // -----------------------------------------------------------------------
    // Hero lattice
    // -----------------------------------------------------------------------

    /**
     * Lay a short travelling dash over each bright route, so the corridors read
     * as carrying traffic rather than as static decoration.
     *
     * A clone rather than re-dashing the original, so the route stays fully
     * drawn underneath the pulse. Implemented as a dash offset rather than with
     * MotionPathPlugin — that is a separate GSAP file the page does not load,
     * and this needs no new dependency.
     *
     * Called only from animateHero(), which returns early under
     * prefers-reduced-motion, so these elements never enter the DOM there.
     */
    function pulseRoutes(gsap, svg) {
        var DASH = 18;
        var routes = svg.querySelectorAll('.cr-route:not(.cr-route--faint)');

        Array.prototype.forEach.call(routes, function (route, i) {
            var length = typeof route.getTotalLength === 'function'
                ? route.getTotalLength()
                : 0;
            if (length <= DASH) return;

            var pulse = route.cloneNode(false);
            pulse.setAttribute('class', 'cr-route__pulse');
            route.parentNode.insertBefore(pulse, route.nextSibling);

            gsap.set(pulse, {
                strokeDasharray: DASH + ' ' + (length - DASH),
                strokeDashoffset: 0
            });
            gsap.to(pulse, {
                strokeDashoffset: -length,
                duration: 2.6,
                repeat: -1,
                ease: 'none',
                // Start once the intro draw-on has settled.
                delay: 1.6 + i * 0.6
            });
        });
    }

    /**
     * NOTE: nothing here animates a transform on `.cr-stratum`. Two of the
     * three strata carry a `transform="translate(...)"` attribute, and a CSS
     * transform on an SVG element replaces the attribute rather than composing
     * with it — the layers would collapse onto each other. Opacity only.
     */
    function animateHero() {
        var gsap = window.gsap;
        var svg = document.querySelector('.cr-lattice');
        if (reduced || !gsap || !svg) return;

        var strata = svg.querySelectorAll('.cr-stratum');
        var threads = svg.querySelectorAll('.cr-thread');
        var routes = svg.querySelectorAll('.cr-route');
        var nodes = svg.querySelectorAll('.cr-node');
        var liveNodes = svg.querySelectorAll('.cr-node--live');

        var tl = gsap.timeline({ defaults: { ease: 'power2.out' } });

        tl.from(strata, { opacity: 0, duration: 0.85, stagger: 0.16 }, 0)
            .from(threads, { opacity: 0, duration: 0.7, stagger: 0.09 }, 0.55);

        // Draw each route on. getTotalLength is the only reliable way to get a
        // dash length for an arbitrary path.
        Array.prototype.forEach.call(routes, function (route, i) {
            var length = typeof route.getTotalLength === 'function'
                ? route.getTotalLength()
                : 0;
            if (!length) return;

            gsap.set(route, { strokeDasharray: length, strokeDashoffset: length });
            tl.to(route, {
                strokeDashoffset: 0,
                duration: 1.15,
                ease: 'power1.inOut'
            }, 0.5 + i * 0.11);
        });

        tl.from(nodes, {
            opacity: 0,
            scale: 0,
            transformOrigin: 'center center',
            duration: 0.45,
            stagger: 0.045
        }, 0.95);

        pulseRoutes(gsap, svg);

        // Radar ping on the live nodes, once the intro has settled.
        Array.prototype.forEach.call(liveNodes, function (node, i) {
            gsap.to(node, {
                strokeWidth: 11,
                duration: 1.7,
                delay: 2.1 + i * 0.35,
                repeat: -1,
                yoyo: true,
                ease: 'sine.inOut'
            });
        });
    }

    // -----------------------------------------------------------------------
    // Scroll reveals
    // -----------------------------------------------------------------------

    function initReveals() {
        var gsap = window.gsap;
        if (reduced || !gsap || !window.ScrollTrigger) return;

        gsap.registerPlugin(window.ScrollTrigger);

        var groups = [
            { selector: '.cr-role', stagger: 0.08 },
            { selector: '.cr-stage', stagger: 0.1 }
        ];

        groups.forEach(function (group) {
            var items = document.querySelectorAll(group.selector);
            if (!items.length) return;

            gsap.from(items, {
                opacity: 0,
                y: 22,
                duration: 0.7,
                ease: 'power2.out',
                stagger: group.stagger,
                scrollTrigger: {
                    trigger: items[0].parentNode,
                    start: 'top 82%',
                    once: true
                }
            });
        });
    }

    // -----------------------------------------------------------------------

    function init() {
        initFilters();
        animateHero();
        initReveals();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
