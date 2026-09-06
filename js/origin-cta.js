(function () {
    'use strict';

    // Production links always use the canonical application subdomain. During
    // local reviews, keep the same journey on the active localhost server.
    if (/^(localhost|127\.0\.0\.1|\[::1\])$/.test(window.location.hostname)) {
        document.querySelectorAll('[data-supplier-programme-link]').forEach(function (link) {
            var target = new URL(link.href);
            link.href = window.location.origin + '/supplier-programme.html' + target.search + target.hash;
        });
    }

    var workflow = document.querySelector('[data-origin-workflow]');
    if (!workflow) return;

    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    var cycleMs = 13000;
    var cycleTimer = 0;
    var cycleStartedAt = 0;
    var remainingMs = cycleMs;
    var isVisible = false;
    var hasStarted = false;

    function clearCycle() {
        if (cycleTimer) window.clearTimeout(cycleTimer);
        cycleTimer = 0;
    }

    function replay() {
        if (!isVisible || document.hidden || reduceMotion.matches) return;

        clearCycle();
        workflow.classList.remove('is-paused', 'is-running');
        void workflow.offsetWidth;
        workflow.classList.add('is-running');
        hasStarted = true;
        remainingMs = cycleMs;
        cycleStartedAt = window.performance.now();
        cycleTimer = window.setTimeout(replay, cycleMs);
    }

    function pause() {
        if (!hasStarted || workflow.classList.contains('is-paused')) return;

        remainingMs = Math.max(0, remainingMs - (window.performance.now() - cycleStartedAt));
        clearCycle();
        workflow.classList.add('is-paused');
    }

    function resume() {
        if (!isVisible || document.hidden || reduceMotion.matches) return;

        if (!hasStarted || remainingMs <= 0) {
            replay();
            return;
        }

        workflow.classList.remove('is-paused');
        cycleStartedAt = window.performance.now();
        cycleTimer = window.setTimeout(replay, remainingMs);
    }

    function applyMotionPreference() {
        clearCycle();

        if (reduceMotion.matches) {
            hasStarted = false;
            remainingMs = cycleMs;
            workflow.classList.remove('is-animated', 'is-running', 'is-paused');
            return;
        }

        workflow.classList.add('is-animated');
        if (isVisible && !document.hidden) replay();
    }

    if ('IntersectionObserver' in window) {
        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.target !== workflow) return;
                isVisible = entry.isIntersecting && entry.intersectionRatio >= 0.12;
                if (isVisible) resume();
                else pause();
            });
        }, { threshold: [0, 0.12, 0.3] });

        observer.observe(workflow);
    } else {
        isVisible = true;
    }

    document.addEventListener('visibilitychange', function () {
        if (document.hidden) pause();
        else resume();
    });

    if (typeof reduceMotion.addEventListener === 'function') {
        reduceMotion.addEventListener('change', applyMotionPreference);
    } else if (typeof reduceMotion.addListener === 'function') {
        reduceMotion.addListener(applyMotionPreference);
    }

    window.addEventListener('pagehide', clearCycle, { once: true });
    applyMotionPreference();
}());
