const { test } = require('node:test');
const assert = require('node:assert/strict');
const { reflow, createCoordinator } = require('../js/tracker-layout');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

function fixture(overrides = {}) {
    const calls = [];
    const container = { clientWidth: 760, clientHeight: 480 };
    const map = {
        getContainer: () => container,
        invalidateSize: options => calls.push(['resize', options]),
        fitBounds: (bounds, options) => calls.push(['fit', bounds, options])
    };
    const state = { map, mode: 'state', panel: null, mobile: false,
        bounds: [[6.76, 68.1], [37.07, 97.38]], maxZoom: 5, ...overrides };
    return { calls, state, container };
}

function clock() {
    let time = 0;
    let id = 0;
    const timers = new Map();
    return {
        now: () => time,
        setTimer(fn, delay) { timers.set(++id, { fn, at: time + delay }); return id; },
        clearTimer(id) { timers.delete(id); },
        tick(ms) {
            time += ms;
            for (const [key, timer] of [...timers]) {
                if (timer.at <= time) { timers.delete(key); timer.fn(); }
            }
        },
        count: () => timers.size
    };
}

test('overview invalidates before fitting complete geographic bounds with padding and zoom cap', () => {
    const { state, calls } = fixture();
    assert.equal(reflow(state), true);
    assert.deepEqual(calls[0], ['resize', { animate: false, pan: false }]);
    assert.deepEqual(calls[1], ['fit', state.bounds, { padding: [24, 24], maxZoom: 5, animate: false, duration: 0 }]);
});

test('selected state uses its own bounds instead of the overview during resize', () => {
    const selectedBounds = [[12, 74], [18, 78]];
    const { state, calls } = fixture({ panel: 'Karnataka', selectedLayer: { getBounds: () => selectedBounds } });
    reflow(state, true);
    assert.deepEqual(calls[1], ['fit', selectedBounds, { padding: [30, 30], animate: true, duration: 0.3 }]);
});

test('hidden maps, zero-sized frames and mobile overlays defer map operations', () => {
    for (const overrides of [{ mode: 'allIndia' }, { mobile: true, panel: 'Karnataka' }]) {
        const { state, calls } = fixture(overrides);
        assert.equal(reflow(state), false);
        assert.equal(calls.length, 0);
    }
    const { state, calls, container } = fixture();
    container.clientWidth = 0;
    assert.equal(reflow(state), false);
    assert.equal(calls.length, 0);
});

test('mobile overview retains its zoom ceiling and startup fallback includes northern states', () => {
    const { state, calls } = fixture({ mobile: true, maxZoom: 4.3, bounds: undefined });
    reflow(state);
    assert.equal(calls[1][2].maxZoom, 4.3);
    assert.ok(calls[1][1][1][0] >= 37.07);
});

test('resize bursts wait for the panel transition and produce only one reflow', () => {
    const { state, calls } = fixture();
    const timers = clock();
    let settled = 0;
    const coordinator = createCoordinator({ readState: () => state, onSettled: () => settled++, ...timers });
    coordinator.schedule({ transition: true, animate: true });
    timers.tick(200);
    coordinator.schedule();
    timers.tick(200);
    coordinator.schedule();
    assert.equal(timers.count(), 1);
    timers.tick(99);
    assert.equal(calls.length, 0);
    timers.tick(1);
    assert.equal(calls.length, 2);
    assert.equal(calls[1][2].animate, true);
    assert.equal(settled, 1);
});

test('rapid state/view changes cannot apply a stale overview or selected-state fit', () => {
    const { state, calls } = fixture();
    const timers = clock();
    const coordinator = createCoordinator({ readState: () => state, ...timers });
    coordinator.schedule({ transition: true });
    state.mode = 'allIndia';
    coordinator.schedule({ transition: true });
    timers.tick(600);
    assert.equal(calls.length, 0);
    state.mode = 'state';
    coordinator.schedule({ transition: true });
    state.panel = 'Tamil Nadu';
    state.selectedLayer = { getBounds: () => 'latest state bounds' };
    coordinator.schedule({ transition: true });
    timers.tick(600);
    assert.equal(calls.length, 2);
    assert.equal(calls[1][1], 'latest state bounds');
});

test('cancel and dispose prevent late callbacks', () => {
    const { state, calls } = fixture();
    const timers = clock();
    const coordinator = createCoordinator({ readState: () => state, ...timers });
    coordinator.schedule();
    coordinator.cancel();
    timers.tick(200);
    coordinator.schedule();
    coordinator.dispose();
    coordinator.schedule();
    timers.tick(200);
    assert.equal(calls.length, 0);
    assert.equal(timers.count(), 0);
});

// Exercise the actual application integration around network races and URLs.
// No browser is needed: initialization is deferred by DOMContentLoaded.
function appContext(compact = true) {
    const context = vm.createContext({
        document: { documentElement: { dataset: { trackerLayout: compact ? 'compact' : undefined } },
            addEventListener() {} },
        window: { innerWidth: 1440 }, console,
        setTimeout, clearTimeout, setInterval, clearInterval,
        TrackerLayout: require('../js/tracker-layout')
    });
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/app-final.js'), 'utf8'), context);
    return context;
}

test('state deep links resolve the existing geographic layer without needing a map click', async () => {
    const context = appContext();
    await vm.runInContext(`
        indexJurisdictions([{ name: 'Maharashtra', code: 'MH', slug: 'maharashtra' }]);
        const targetLayer = { feature: { properties: { ST_NM: 'Maharashtra' } } };
        geojsonLayer = { eachLayer: callback => callback(targetLayer) };
        showPanel = () => {};
        fetchStateData = async () => null;
        openStatePanel('Maharashtra');
    `, context);
    assert.equal(vm.runInContext('selectedLayer === targetLayer', context), true);
});

test('a late state fetch cannot reopen a panel after switching to All India', async () => {
    const context = appContext();
    const pending = vm.runInContext(`
        indexJurisdictions([{ name: 'Maharashtra', code: 'MH', slug: 'maharashtra' }]);
        let resolveState;
        let shown = 0;
        showPanel = () => shown++;
        fetchStateData = () => new Promise(resolve => { resolveState = resolve; });
        openStatePanel('Maharashtra');
    `, context);
    vm.runInContext(`currentViewMode = 'allIndia'; stateRequestVersion++;
        resolveState({ categories: {}, todayUpdates: [] });`, context);
    await pending;
    assert.equal(vm.runInContext('shown', context), 1); // Only the initial loading panel.
});

test('a late national fetch cannot overwrite the newly selected state data', async () => {
    const context = appContext();
    const pending = vm.runInContext(`
        currentViewMode = 'allIndia';
        const content = { innerHTML: '' };
        document.getElementById = () => content;
        let resolveNational;
        fetch = () => new Promise(resolve => { resolveNational = resolve; });
        loadAllIndiaContent();
    `, context);
    vm.runInContext(`currentViewMode = 'state'; stateRequestVersion++;
        currentCategoriesData = { selected: 'Maharashtra' };
        resolveNational({ ok: true, json: async () => ({ categories: { national: [] } }) });`, context);
    await pending;
    assert.equal(vm.runInContext('currentCategoriesData.selected', context), 'Maharashtra');
});

test('removing the page flag restores the previous fixed overview', () => {
    const context = appContext(false);
    vm.runInContext(`
        let previousView;
        map = { setView: (center, zoom) => { previousView = { center, zoom }; } };
        resetMapToIndia(false);
    `, context);
    assert.equal(vm.runInContext('previousView.zoom', context), 5);
    assert.equal(vm.runInContext('previousView.center[0]', context), 22.3);
});

test('carousel touch pause keeps one eight-second resume and cannot restart on desktop', () => {
    const context = appContext();
    const timers = clock();
    Object.assign(context, { setTimeout: timers.setTimer, clearTimeout: timers.clearTimer,
        setInterval: timers.setTimer, clearInterval: timers.clearTimer });
    vm.runInContext(`
        window.innerWidth = 390;
        const handlers = {};
        const track = { style: {}, addEventListener: (event, fn) => { handlers[event] = fn; } };
        const panel = { classList: { contains: () => false } };
        document.getElementById = id => id === 'feedCarouselTrack' ? track : id === 'feedPanel' ? panel : null;
        document.querySelectorAll = () => [];
        initMobileCarousel(3);
        handlers.touchstart({ touches: [{ clientX: 200 }] });
    `, context);
    assert.equal(timers.count(), 0);
    vm.runInContext(`handlers.touchend({ changedTouches: [{ clientX: 100 }] });`, context);
    assert.equal(vm.runInContext('carouselCurrentPage', context), 1);
    assert.equal(timers.count(), 1);
    timers.tick(7999);
    assert.equal(vm.runInContext('carouselAutoAdvanceTimer', context), null);
    timers.tick(1);
    assert.notEqual(vm.runInContext('carouselAutoAdvanceTimer', context), null);
    assert.equal(timers.count(), 1);

    vm.runInContext(`handlers.touchstart({ touches: [{ clientX: 200 }] });
        handlers.touchend({ changedTouches: [{ clientX: 100 }] });
        window.innerWidth = 1440;`, context);
    timers.tick(8000);
    assert.equal(timers.count(), 0);
    assert.equal(vm.runInContext('carouselAutoAdvanceTimer', context), null);
});
