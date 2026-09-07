/* Small, independently testable coordinator for the opt-in tracker layout.
   It reads current state at execution time; a queued close can never restore
   the overview over a subsequently opened state or a hidden All India map. */
(function (root, factory) {
    if (typeof module === 'object' && module.exports) module.exports = factory();
    else root.TrackerLayout = factory();
})(typeof window === 'undefined' ? globalThis : window, function () {
    const FALLBACK_BOUNDS = [[6.5, 68], [37.5, 97.5]];

    function fitOverview(map, bounds, maxZoom, animate = false) {
        map.fitBounds(bounds || FALLBACK_BOUNDS, {
            padding: [24, 24], maxZoom, animate,
            duration: animate ? 0.6 : 0
        });
    }

    function reflow(state, animate = false) {
        const { map, mode, panel, selectedLayer, mobile, bounds, maxZoom } = state;
        if (!map || mode !== 'state' || (mobile && panel)) return false;
        const container = map.getContainer();
        if (container.clientWidth < 2 || container.clientHeight < 2) return false;
        map.invalidateSize({ animate: false, pan: false });
        if (panel && selectedLayer) {
            map.fitBounds(selectedLayer.getBounds(), {
                padding: [30, 30], animate, duration: animate ? 0.3 : 0
            });
        } else if (!panel) {
            fitOverview(map, bounds, maxZoom, animate);
        }
        return true;
    }

    function createCoordinator({ readState, onSettled = () => {}, transitionMs = 450,
        setTimer = setTimeout, clearTimer = clearTimeout, now = Date.now }) {
        let timer = null;
        let revision = 0;
        let transitionUntil = 0;
        let pendingAnimate = false;
        let disposed = false;

        function cancel() {
            revision += 1;
            if (timer !== null) clearTimer(timer);
            timer = null;
        }

        function schedule({ transition = false, animate = false } = {}) {
            if (disposed) return;
            cancel();
            if (transition) {
                transitionUntil = now() + transitionMs + 50;
                pendingAnimate = animate;
            } else if (now() >= transitionUntil) {
                pendingAnimate = animate;
            }
            const scheduledRevision = revision;
            const delay = Math.max(100, transitionUntil - now());
            timer = setTimer(() => {
                if (disposed || scheduledRevision !== revision) return;
                timer = null;
                reflow(readState(), pendingAnimate);
                transitionUntil = 0;
                onSettled();
            }, delay);
        }

        return { schedule, cancel, dispose() { cancel(); disposed = true; } };
    }

    return { fitOverview, reflow, createCoordinator };
});
