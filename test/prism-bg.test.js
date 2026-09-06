const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

async function prism({ reduced = false, unavailable = false } = {}) {
    const frames = new Map(), listeners = {};
    let next = 0, draws = 0, program, clock = 0;
    const container = { dataset: { palette: 'brand', animationType: '3drotate', noise: '0' }, clientWidth: 1200, clientHeight: 900, children: [], appendChild(child) { this.children.push(child); } };
    const document = { hidden: false, getElementById: () => container, addEventListener: (name, fn) => { listeners[name] = fn; } };
    class Renderer {
        constructor() {
            if (unavailable) throw new Error('WebGL unavailable');
            this.gl = { canvas: { style: {} }, disable() {}, drawingBufferWidth: 1200, drawingBufferHeight: 900 };
        }
        setSize() {} render() { draws++; }
    }
    const OGL = { Renderer, Triangle: class {}, Program: class { constructor(gl, options) { Object.assign(this, options); program = this; } }, Mesh: class {} };
    const context = { document, window: { devicePixelRatio: 1, matchMedia: () => ({ matches: reduced }), addEventListener() {} },
        getComputedStyle: () => ({ getPropertyValue: () => '118 44 54' }),
        performance: { now: () => clock }, console: { warn() {} }, mockOGL: OGL,
        ResizeObserver: class { observe() {} },
        requestAnimationFrame(fn) { frames.set(++next, fn); return next; },
        cancelAnimationFrame(id) { frames.delete(id); }
    };
    // Substitute only the external library import; exercise the actual lifecycle.
    const source = fs.readFileSync(path.join(__dirname, '../js/prism-bg.js'), 'utf8')
        .replace('import(/* webpackIgnore: true */ config.oglUrl)', 'Promise.resolve(mockOGL)');
    await vm.runInNewContext(source, context);
    return { frames, container, program, draws: () => draws,
        frame(t) { clock = t; const [id, fn] = frames.entries().next().value; frames.delete(id); fn(t); },
        visibility(hidden, t) { clock = t; document.hidden = hidden; listeners.visibilitychange(); }
    };
}
test('brand prism uses shared wine colour and renders only once for reduced motion', async () => {
    const app = await prism({ reduced: true });
    assert.equal(app.program.uniforms.uBrandPalette.value, 1);
    assert.equal(app.program.uniforms.uBrandWine.value[0], 118 / 255);
    app.frame(16); assert.equal(app.draws(), 1); assert.equal(app.frames.size, 0);
});
test('hidden page cancels prism frames and resumes without a time jump', async () => {
    const app = await prism(); app.frame(16); app.visibility(true, 20);
    assert.equal(app.frames.size, 0); app.visibility(false, 1020); app.frame(1032);
    assert.equal(app.program.uniforms.iTime.value, .032); assert.equal(app.frames.size, 1);
});
test('unavailable WebGL leaves the page background intact', async () => {
    const app = await prism({ unavailable: true });
    assert.equal(app.container.children.length, 0); assert.equal(app.frames.size, 0);
});
