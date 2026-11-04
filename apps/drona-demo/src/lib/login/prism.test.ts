// @vitest-environment node
import fs from "node:fs";
import vm from "node:vm";
import { describe, expect, it } from "vitest";

/** Exercise the real renderer lifecycle with only GPU objects substituted. */
function prism({ reduced = false, unavailable = false, shaderFailure = false } = {}) {
  const frames = new Map<number, (time: number) => void>();
  const documentListeners: Record<string, () => void> = {};
  const windowListeners: Record<string, () => void> = {};
  const canvasListeners: Record<string, (event: { preventDefault(): void }) => void> = {};
  let preferenceChanged: (event: { matches: boolean }) => void = () => {};
  let click: () => void = () => {};
  let next = 0, draws = 0, clock = 0;
  let program: { uniforms: { iTime: { value: number } } };
  const label = { textContent: "Pause motion" };
  const button = {
    hidden: true,
    attributes: {} as Record<string, string>,
    setAttribute(name: string, value: string) { this.attributes[name] = value; },
    querySelector() { return label; },
    addEventListener(_name: string, fn: () => void) { click = fn; },
  };
  const container = {
    dataset: { animationType: "3drotate", noise: "0", maxFps: "30", render: "fallback", motionState: "" },
    clientWidth: 1200, clientHeight: 900,
    children: [] as unknown[],
    appendChild(child: unknown) { this.children.push(child); },
    querySelector() { return { remove: () => { this.children = []; } }; },
  };
  const document = {
    hidden: false,
    getElementById: (id: string) => id === "motion-toggle" ? button : container,
    addEventListener: (name: string, fn: () => void) => { documentListeners[name] = fn; },
  };
  class Renderer {
    gl;
    constructor() {
      if (unavailable) throw new Error("No WebGL");
      this.gl = {
        canvas: { addEventListener: (name: string, fn: (event: { preventDefault(): void }) => void) => { canvasListeners[name] = fn; } },
        disable() {}, drawingBufferWidth: 1200, drawingBufferHeight: 900,
        getProgramParameter: () => !shaderFailure,
      };
    }
    setSize() {}
    render() { draws++; }
  }
  const context = {
    document,
    window: {
      innerWidth: 1200, devicePixelRatio: 1,
      matchMedia: () => ({ matches: reduced, addEventListener: (_name: string, fn: typeof preferenceChanged) => { preferenceChanged = fn; } }),
      addEventListener: (name: string, fn: () => void) => { windowListeners[name] = fn; },
    },
    getComputedStyle: () => ({ getPropertyValue: () => "" }),
    performance: { now: () => clock },
    mockOGL: {
      Renderer, Triangle: class {},
      Program: class { constructor(_gl: unknown, options: { uniforms: typeof program.uniforms }) { Object.assign(this, options); program = this as unknown as typeof program; } },
      Mesh: class {},
    },
    ResizeObserver: class { observe() {} disconnect() {} },
    requestAnimationFrame(fn: (time: number) => void) { frames.set(++next, fn); return next; },
    cancelAnimationFrame(id: number) { frames.delete(id); },
  };
  const source = fs.readFileSync(new URL("./prism.browser.js", import.meta.url), "utf8")
    .replace('import { Renderer, Triangle, Program, Mesh } from "ogl";', "const { Renderer, Triangle, Program, Mesh } = mockOGL;");
  vm.runInNewContext(source, context);
  return {
    frames, button, container, label,
    draws: () => draws,
    elapsed: () => program.uniforms.iTime.value,
    frame(time: number) {
      clock = time;
      const item = frames.entries().next().value;
      if (!item) throw new Error("No scheduled frame");
      const [id, fn] = item;
      frames.delete(id); fn(time);
    },
    visibility(hidden: boolean, time: number) { clock = time; document.hidden = hidden; documentListeners.visibilitychange(); },
    click: () => click(),
    preference(matches: boolean) { preferenceChanged({ matches }); },
    loseContext() { canvasListeners.webglcontextlost({ preventDefault() {} }); },
  };
}

describe("standalone login prism", () => {
  it("renders once for reduced motion and hides an unnecessary pause control", () => {
    const app = prism({ reduced: true });
    app.frame(16);
    expect(app.draws()).toBe(1);
    expect(app.frames.size).toBe(0);
    expect(app.button.hidden).toBe(true);
    expect(app.container.dataset.motionState).toBe("reduced");
  });
  it("pauses on demand and resumes without jumping over the paused time", () => {
    const app = prism(); app.frame(16); app.click();
    expect(app.frames.size).toBe(0);
    expect(app.button.attributes["aria-pressed"]).toBe("true");
    expect(app.label.textContent).toBe("Resume motion");
    app.visibility(true, 20); app.visibility(false, 1020);
    expect(app.frames.size).toBe(0); // Becoming visible must not override the user.
    app.click(); app.frame(1032);
    expect(app.elapsed()).toBeCloseTo(.028);
    expect(app.label.textContent).toBe("Pause motion");
  });
  it("stops hidden-page animation and resumes without a time jump", () => {
    const app = prism(); app.frame(16); app.visibility(true, 20);
    expect(app.frames.size).toBe(0);
    app.visibility(false, 1020); app.frame(1032);
    expect(app.elapsed()).toBeCloseTo(.032);
    expect(app.frames.size).toBe(1);
  });
  it("caps drawing at 30 frames per second", () => {
    const app = prism();
    for (let time = 1; time <= 1000; time++) app.frame(time);
    expect(app.draws()).toBeLessThanOrEqual(30);
    expect(app.draws()).toBeGreaterThan(25);
  });
  it("responds when the system reduces motion after loading", () => {
    const app = prism(); app.frame(16); app.preference(true); app.frame(60);
    expect(app.frames.size).toBe(0);
    expect(app.button.hidden).toBe(true);
    app.preference(false); app.frame(100);
    expect(app.frames.size).toBe(1);
    expect(app.button.hidden).toBe(false);
  });
  it.each([{ unavailable: true }, { shaderFailure: true }])("keeps the fallback when the GPU cannot render (%j)", options => {
    const app = prism(options);
    expect(app.frames.size).toBe(0);
    expect(app.container.children).toHaveLength(0);
    expect(app.container.dataset.render).toBe("fallback");
    expect(app.button.hidden).toBe(true);
  });
  it("falls back and stops drawing if the WebGL context is lost", () => {
    const app = prism(); app.frame(16); app.loseContext();
    expect(app.frames.size).toBe(0);
    expect(app.container.dataset.render).toBe("fallback");
    expect(app.button.hidden).toBe(true);
  });
});
