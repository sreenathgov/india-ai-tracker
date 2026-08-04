/* Drona Funnel — homepage
 * Ten-second input → process → output loop. The timeline starts only when
 * visible, pauses off-screen / in a hidden tab, and resolves to a complete
 * static diagram for reduced-motion visitors or when GSAP is unavailable.
 */
(function () {
    'use strict';

    function init() {
        var section = document.getElementById('klDronaFunnel');
        if (!section) return;

        var stages = Array.from(section.querySelectorAll('[data-df-stage]'));
        var stations = Array.from(section.querySelectorAll('[data-station]'));
        var feeders = Array.from(section.querySelectorAll('.kl-df__feeders span'));
        var outputs = Array.from(section.querySelectorAll('.kl-df__outputs span'));
        var clips = [
            section.querySelector('[data-clip="1"]'),
            section.querySelector('[data-clip="2"]'),
            section.querySelector('[data-clip="3"]')
        ];
        var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        var hasGSAP = typeof window.gsap !== 'undefined';
        var timeline = null;
        var inViewport = false;

        function setStage(index) {
            stages.forEach(function (stage, i) {
                stage.classList.toggle('is-active', i === index);
                stage.classList.toggle('is-complete', i < index);
            });
            stations.forEach(function (station, i) {
                station.classList.toggle('is-active', i === index);
                station.classList.toggle('is-complete', i < index);
            });
        }

        function resetState() {
            stages.forEach(function (stage) { stage.classList.remove('is-active', 'is-complete'); });
            stations.forEach(function (station) { station.classList.remove('is-active', 'is-complete'); });

            if (!hasGSAP) return;
            window.gsap.set(feeders, { opacity: 0, y: -8 });
            window.gsap.set(outputs, { opacity: 0, y: 10 });
            clips.forEach(function (clip) {
                if (clip) clip.setAttribute('height', '0');
            });
        }

        function showFinalState() {
            stages.forEach(function (stage, i) {
                stage.classList.toggle('is-active', i === stages.length - 1);
                stage.classList.toggle('is-complete', i < stages.length - 1);
            });
            stations.forEach(function (station, i) {
                station.classList.toggle('is-active', i === stations.length - 1);
                station.classList.toggle('is-complete', i < stations.length - 1);
            });

            if (hasGSAP) {
                window.gsap.set(feeders, { opacity: 1, y: 0 });
                window.gsap.set(outputs, { opacity: 1, y: 0 });
            } else {
                feeders.forEach(function (item) { item.style.opacity = '1'; item.style.transform = 'none'; });
                outputs.forEach(function (item) { item.style.opacity = '1'; item.style.transform = 'none'; });
            }

            var heights = ['140', '156', '160'];
            clips.forEach(function (clip, i) {
                if (clip) clip.setAttribute('height', heights[i]);
            });
        }

        function buildTimeline() {
            resetState();

            timeline = window.gsap.timeline({
                paused: true,
                repeat: -1,
                repeatDelay: 0,
                onRepeat: resetState,
                defaults: { ease: 'power1.inOut' }
            });

            timeline.to(feeders, {
                opacity: 1,
                y: 0,
                duration: 0.4,
                stagger: 0.08,
                ease: 'power2.out'
            }, 0);

            timeline.call(function () { setStage(0); }, null, 0.65);
            timeline.to(clips[0], { attr: { height: 140 }, duration: 1.2 }, 0.65);

            timeline.call(function () { setStage(1); }, null, 2.25);
            timeline.to(clips[1], { attr: { height: 156 }, duration: 1.35 }, 2.25);

            timeline.call(function () { setStage(2); }, null, 4.1);
            timeline.to(clips[2], { attr: { height: 160 }, duration: 1.4 }, 4.1);

            timeline.to(outputs, {
                opacity: 1,
                y: 0,
                duration: 0.5,
                stagger: 0.15,
                ease: 'power2.out'
            }, 5.8);

            /* Empty tween holds the completed state until the exact 10s reset. */
            timeline.to({}, { duration: 3.55 }, 6.45);
        }

        if (reduced || !hasGSAP) {
            showFinalState();
            return;
        }

        buildTimeline();

        function resumeIfPossible() {
            if (!timeline || !inViewport || document.hidden) return;
            timeline.resume();
        }

        function pause() {
            if (timeline) timeline.pause();
        }

        if ('IntersectionObserver' in window) {
            var observer = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    inViewport = entry.isIntersecting && entry.intersectionRatio >= 0.16;
                    if (inViewport) resumeIfPossible();
                    else pause();
                });
            }, { threshold: [0, 0.16], rootMargin: '0px 0px -6% 0px' });
            observer.observe(section);
        } else {
            inViewport = true;
            resumeIfPossible();
        }

        document.addEventListener('visibilitychange', function () {
            if (document.hidden) pause();
            else resumeIfPossible();
        });
    }

    if (document.readyState === 'loading') {
        window.addEventListener('load', init);
    } else {
        init();
    }
})();
