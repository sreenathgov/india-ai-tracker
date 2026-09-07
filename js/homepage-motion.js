/* Each effect has a single lifecycle owner. User pause survives scrolling,
   backgrounding and a reduced-motion preference change. */
(function (root) {
    'use strict';
    function motionState({ reduced, paused, visible, hidden }) {
        if (reduced) return 'static';
        if (paused) return 'paused';
        return visible && !hidden ? 'running' : 'suspended';
    }
    function createController(win, doc) {
        const preference = win.matchMedia('(prefers-reduced-motion: reduce)');
        const effects = new Set();
        function update(effect) {
            const next = motionState({ reduced: preference.matches, paused: effect.paused,
                visible: effect.visible, hidden: doc.hidden });
            if (effect.button) {
                effect.button.hidden = preference.matches;
                effect.button.textContent = effect.paused ? effect.resumeLabel : effect.pauseLabel;
                effect.button.setAttribute('aria-label', effect.button.textContent + ': ' + effect.label);
                effect.button.setAttribute('aria-pressed', String(effect.paused));
            }
            if (next === effect.state) return;
            effect.state = next;
            effect.element.dataset.motionState = next;
            if (next === 'static') effect.static();
            else if (next === 'running') effect.resume();
            else effect.pause();
        }
        const observer = win.IntersectionObserver ? new win.IntersectionObserver(entries => {
            entries.forEach(entry => effects.forEach(effect => {
                if (effect.element === entry.target) {
                    effect.visible = entry.isIntersecting;
                    update(effect);
                }
            }));
        }, { threshold: 0 }) : null;
        function refresh() { effects.forEach(update); }
        preference.addEventListener('change', refresh);
        doc.addEventListener('visibilitychange', refresh);
        return {
            register(options) {
                const effect = { paused: false, visible: !observer, state: '', ...options };
                if (effect.button) {
                    effect.pauseLabel = effect.button.textContent;
                    effect.resumeLabel = effect.pauseLabel.replace('Pause', 'Resume');
                    effect.button.setAttribute('aria-label', effect.pauseLabel + ': ' + effect.label);
                    effect.button.addEventListener('click', () => {
                        effect.paused = !effect.paused;
                        update(effect);
                        effect.button.setAttribute('aria-label', effect.button.textContent + ': ' + effect.label);
                    });
                }
                effects.add(effect);
                update(effect);
                if (observer) observer.observe(effect.element);
                return { refresh: () => update(effect), setPaused(value) { effect.paused = value; update(effect); },
                    get state() { return effect.state; } };
            },
            refresh
        };
    }
    if (typeof module !== 'undefined' && module.exports) module.exports = { motionState, createController };
    else root.KananHomepageMotion = { motionState, createController };
})(typeof window === 'undefined' ? globalThis : window);
