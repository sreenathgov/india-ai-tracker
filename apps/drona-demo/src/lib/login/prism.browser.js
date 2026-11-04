/*! react-bits-prism.txt
MIT + Commons Clause License Condition v1.0

Copyright (c) 2026 David Haz

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, and distribute the Software **as part of an application, website, or product**, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

## Commons Clause Restriction

You may use this Software, including for any commercial purpose, **so long as you do not sell, sublicense, or redistribute the components themselves-whether alone, in a bundle, or as a ported version.**

The same restriction covers the React Bits tools (Background Studio, Texture Lab, Shape Magic, Center Stage, Sound Lab and any tools added later) and the sounds in the sound library. **You may not sell, sublicense, or redistribute the tools or the sounds themselves, or offer the tools or a substantially similar copy of them as a hosted service-whether alone, in a bundle, or as a ported version.**

What you make with the tools is yours to use. You can use exported code, images, videos, and audio files in any personal or commercial application, website, or product, including paid ones. **You may not sell or redistribute the exports on their own, either individually or as the product itself, such as a sound, texture, background, or template pack.**

## No Warranty

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

*/
/*! ogl-unlicense.txt
This is free and unencumbered software released into the public domain.

Anyone is free to copy, modify, publish, use, compile, sell, or
distribute this software, either in source code form or as a compiled
binary, for any purpose, commercial or non-commercial, and by any
means.

In jurisdictions that recognize copyright laws, the author or authors
of this software dedicate any and all copyright interest in the
software to the public domain. We make this dedication for the benefit
of the public at large and to the detriment of our heirs and
successors. We intend this dedication to be an overt act of
relinquishment in perpetuity of all present and future rights to this
software under copyright law.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR
OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.

For more information, please refer to <https://unlicense.org>

*/
/*! Drona login prism: adapted from the existing Kanan Prism background.
 * Shader geometry and rotation originate in React Bits Prism (DavidHDev).
 * Uses OGL 1.0.11; see the bundled third-party notices in the source module.
 */
import { Renderer, Triangle, Program, Mesh } from "ogl";
(function () {
  'use strict';

  const container = document.getElementById('demo-prism-bg');
  if (!container) return;
  const motionButton = document.getElementById('motion-toggle');
  let stopAnimation = () => {};
  const fallback = () => {
    stopAnimation();
    container.dataset.render = 'fallback';
    container.dataset.motionState = 'unavailable';
    container.querySelector('canvas')?.remove();
    if (motionButton) motionButton.hidden = true;
  };
  try {

  const DEFAULTS = {
    height: 3.5,
    baseWidth: 5.5,
    animationType: 'rotate',
    glow: 1,
    offsetX: 0,
    offsetY: 0,
    noise: 0.5,
    transparent: true,
    scale: 3.6,
    hueShift: 0,
    colorFrequency: 1,
    hoverStrength: 2,
    inertia: 0.05,
    bloom: 1,
    timeScale: 0.5,
    maxDpr: 2,
    maxFps: 60,
    steps: 100
  };

  function readConfig() {
    const d = container.dataset;
    const num = (key, fallback) => (d[key] !== undefined ? parseFloat(d[key]) : fallback);
    const str = (key, fallback) => (d[key] !== undefined ? d[key] : fallback);
    const bool = (key, fallback) => (d[key] !== undefined ? d[key] !== 'false' : fallback);
    return {
      palette: str('palette', 'spectrum'),
      height: num('height', DEFAULTS.height),
      baseWidth: num('baseWidth', DEFAULTS.baseWidth),
      animationType: str('animationType', DEFAULTS.animationType),
      glow: num('glow', DEFAULTS.glow),
      offsetX: num('offsetX', DEFAULTS.offsetX),
      offsetY: num('offsetY', DEFAULTS.offsetY),
      noise: num('noise', DEFAULTS.noise),
      transparent: bool('transparent', DEFAULTS.transparent),
      scale: num('scale', DEFAULTS.scale),
      hueShift: num('hueShift', DEFAULTS.hueShift),
      colorFrequency: num('colorFrequency', DEFAULTS.colorFrequency),
      hoverStrength: num('hoverStrength', DEFAULTS.hoverStrength),
      inertia: num('inertia', DEFAULTS.inertia),
      bloom: num('bloom', DEFAULTS.bloom),
      timeScale: num('timeScale', DEFAULTS.timeScale),
      maxDpr: num('maxDpr', DEFAULTS.maxDpr),
      maxFps: num('maxFps', DEFAULTS.maxFps),
      steps: num('steps', DEFAULTS.steps)
    };
  }

  const config = readConfig();
  const brandStyles = getComputedStyle(container);
  const brandColor = (token, fallback) => (brandStyles.getPropertyValue(token).trim() || fallback)
    .split(/\s+/).map(channel => Number(channel) / 255);
  const brandWine = brandColor('--kanan-wine-rgb', '118 44 54');
  const brandRose = brandColor('--kanan-accent-rgb', '143 85 85');
  const brandInk = brandColor('--kanan-primary-rgb', '76 44 44');
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  let prefersReducedMotion = motionPreference.matches;

  const H = Math.max(0.001, config.height);
  const BW = Math.max(0.001, config.baseWidth);
  const BASE_HALF = BW * 0.5;
  const GLOW = Math.max(0.0, config.glow);
  const NOISE = Math.max(0.0, config.noise);
  const offX = config.offsetX;
  const offY = config.offsetY;
  const SAT = config.transparent ? 1.5 : 1;
  const SCALE = Math.max(0.001, config.scale);
  const HUE = config.hueShift || 0;
  const CFREQ = Math.max(0.0, config.colorFrequency || 1);
  const BLOOM = Math.max(0.0, config.bloom || 1);
  let TS = prefersReducedMotion ? 0 : Math.max(0, config.timeScale || 1);
  const HOVSTR = Math.max(0, config.hoverStrength || 1);
  const INERT = Math.max(0, Math.min(1, config.inertia || 0.12));
  const animationType = prefersReducedMotion && config.animationType === 'hover'
    ? 'rotate'
    : config.animationType;
  const shaderSteps = Math.max(32, Math.min(100, Math.round(config.steps)));
  const frameInterval = 1000 / Math.max(1, Math.min(30, config.maxFps));

  let renderer;
  try {
    const dpr = Math.min(Math.max(0.75, config.maxDpr), window.innerWidth <= 600 ? 1 : 1.5, window.devicePixelRatio || 1);
    renderer = new Renderer({ dpr, alpha: config.transparent, antialias: false });
  } catch (err) {
    fallback();
    return;
  }
  const gl = renderer.gl;
  gl.disable(gl.DEPTH_TEST);
  gl.disable(gl.CULL_FACE);
  gl.disable(gl.BLEND);

  container.appendChild(gl.canvas);

  const vertex = /* glsl */ `
    attribute vec2 position;
    void main() {
      gl_Position = vec4(position, 0.0, 1.0);
    }
  `;

  const fragment = /* glsl */ `
    precision highp float;

    uniform vec2  iResolution;
    uniform float iTime;

    uniform float uHeight;
    uniform float uBaseHalf;
    uniform mat3  uRot;
    uniform int   uUseBaseWobble;
    uniform float uGlow;
    uniform vec2  uOffsetPx;
    uniform float uNoise;
    uniform float uSaturation;
    uniform float uScale;
    uniform float uHueShift;
    uniform float uColorFreq;
    uniform float uBloom;
    uniform float uCenterShift;
    uniform float uInvBaseHalf;
    uniform float uInvHeight;
    uniform float uMinAxis;
    uniform float uPxScale;
    uniform float uTimeScale;
    uniform int uBrandPalette;
    uniform vec3 uBrandWine;
    uniform vec3 uBrandRose;
    uniform vec3 uBrandInk;

    vec4 tanh4(vec4 x){
      vec4 e2x = exp(2.0*x);
      return (e2x - 1.0) / (e2x + 1.0);
    }

    float rand(vec2 co){
      return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453123);
    }

    float sdOctaAnisoInv(vec3 p){
      vec3 q = vec3(abs(p.x) * uInvBaseHalf, abs(p.y) * uInvHeight, abs(p.z) * uInvBaseHalf);
      float m = q.x + q.y + q.z - 1.0;
      return m * uMinAxis * 0.5773502691896258;
    }

    float sdPyramidUpInv(vec3 p){
      float oct = sdOctaAnisoInv(p);
      float halfSpace = -p.y;
      return max(oct, halfSpace);
    }

    mat3 hueRotation(float a){
      float c = cos(a), s = sin(a);
      mat3 W = mat3(
        0.299, 0.587, 0.114,
        0.299, 0.587, 0.114,
        0.299, 0.587, 0.114
      );
      mat3 U = mat3(
         0.701, -0.587, -0.114,
        -0.299,  0.413, -0.114,
        -0.300, -0.588,  0.886
      );
      mat3 V = mat3(
         0.168, -0.331,  0.500,
         0.328,  0.035, -0.500,
        -0.497,  0.296,  0.201
      );
      return W + U * c + V * s;
    }

    void main(){
      vec2 f = (gl_FragCoord.xy - 0.5 * iResolution.xy - uOffsetPx) * uPxScale;

      float z = 5.0;
      float d = 0.0;

      vec3 p;
      vec4 o = vec4(0.0);

      float centerShift = uCenterShift;
      float cf = uColorFreq;

      mat2 wob = mat2(1.0);
      if (uUseBaseWobble == 1) {
        float t = iTime * uTimeScale;
        float c0 = cos(t + 0.0);
        float c1 = cos(t + 33.0);
        float c2 = cos(t + 11.0);
        wob = mat2(c0, c1, c2, c0);
      }

      const int STEPS = ${shaderSteps};
      for (int i = 0; i < STEPS; i++) {
        p = vec3(f, z);
        p.xz = p.xz * wob;
        p = uRot * p;
        vec3 q = p;
        q.y += centerShift;
        d = 0.1 + 0.2 * abs(sdPyramidUpInv(q));
        z -= d;
        o += (sin((p.y + z) * cf + vec4(0.0, 1.0, 2.0, 3.0)) + 1.0) / d;
      }

      o = tanh4(o * o * (uGlow * uBloom) / 1e5);

      vec3 col = o.rgb;
      float n = rand(gl_FragCoord.xy + vec2(iTime));
      col += (n - 0.5) * uNoise;
      col = clamp(col, 0.0, 1.0);

      float L = dot(col, vec3(0.2126, 0.7152, 0.0722));
      col = clamp(mix(vec3(L), col, uSaturation), 0.0, 1.0);

      if(abs(uHueShift) > 0.0001){
        col = clamp(hueRotation(uHueShift) * col, 0.0, 1.0);
      }

      if (uBrandPalette == 1) {
        // Preserve the prism's geometry while replacing its spectrum entirely.
        float intensity = smoothstep(0.08, 0.95, L);
        vec3 red = mix(uBrandRose, uBrandWine, smoothstep(0.1, 0.65, L));
        red = mix(red, uBrandInk, smoothstep(0.65, 1.0, L));
        // Empty space stays transparent; white is the page, never a prism colour.
        gl_FragColor = vec4(red, intensity);
      } else {
        gl_FragColor = vec4(col, o.a);
      }
    }
  `;

  const geometry = new Triangle(gl);
  const iResBuf = new Float32Array(2);
  const offsetPxBuf = new Float32Array(2);

  const program = new Program(gl, {
    vertex,
    fragment,
    uniforms: {
      uBrandPalette: { value: config.palette === 'brand' ? 1 : 0 },
      uBrandWine: { value: brandWine },
      uBrandRose: { value: brandRose },
      uBrandInk: { value: brandInk },
      iResolution: { value: iResBuf },
      iTime: { value: 0 },
      uHeight: { value: H },
      uBaseHalf: { value: BASE_HALF },
      uUseBaseWobble: { value: 1 },
      uRot: { value: new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1]) },
      uGlow: { value: GLOW },
      uOffsetPx: { value: offsetPxBuf },
      uNoise: { value: NOISE },
      uSaturation: { value: SAT },
      uScale: { value: SCALE },
      uHueShift: { value: HUE },
      uColorFreq: { value: CFREQ },
      uBloom: { value: BLOOM },
      uCenterShift: { value: H * 0.25 },
      uInvBaseHalf: { value: 1 / BASE_HALF },
      uInvHeight: { value: 1 / H },
      uMinAxis: { value: Math.min(BASE_HALF, H) },
      uPxScale: { value: 1 / ((gl.drawingBufferHeight || 1) * 0.1 * SCALE) },
      uTimeScale: { value: TS }
    }
  });
  if (!gl.getProgramParameter(program.program, gl.LINK_STATUS)) {
    fallback();
    return;
  }
  const mesh = new Mesh(gl, { geometry, program });
  container.dataset.render = 'ready';

  const dpr = Math.min(Math.max(0.75, config.maxDpr), window.innerWidth <= 600 ? 1 : 1.5, window.devicePixelRatio || 1);
  const resize = () => {
    const w = container.clientWidth || 1;
    const h = container.clientHeight || 1;
    renderer.setSize(w, h);
    iResBuf[0] = gl.drawingBufferWidth;
    iResBuf[1] = gl.drawingBufferHeight;
    offsetPxBuf[0] = offX * dpr;
    offsetPxBuf[1] = offY * dpr;
    program.uniforms.uPxScale.value = 1 / ((gl.drawingBufferHeight || 1) * 0.1 * SCALE);
  };
  const ro = new ResizeObserver(() => { resize(); startRAF(); });
  ro.observe(container);
  resize();

  const rotBuf = new Float32Array(9);
  const setMat3FromEuler = (yawY, pitchX, rollZ, out) => {
    const cy = Math.cos(yawY), sy = Math.sin(yawY);
    const cx = Math.cos(pitchX), sx = Math.sin(pitchX);
    const cz = Math.cos(rollZ), sz = Math.sin(rollZ);
    const r00 = cy * cz + sy * sx * sz;
    const r01 = -cy * sz + sy * sx * cz;
    const r02 = sy * cx;

    const r10 = cx * sz;
    const r11 = cx * cz;
    const r12 = -sx;

    const r20 = -sy * cz + cy * sx * sz;
    const r21 = sy * sz + cy * sx * cz;
    const r22 = cy * cx;

    out[0] = r00; out[1] = r10; out[2] = r20;
    out[3] = r01; out[4] = r11; out[5] = r21;
    out[6] = r02; out[7] = r12; out[8] = r22;
    return out;
  };

  const NOISE_IS_ZERO = NOISE < 1e-6;
  let raf = 0;
  let t0 = performance.now();
  let pausedAt = document.hidden ? t0 : null;
  let lastRenderAt = 0;
  let inViewport = true;
  let externallyPaused = false;
  let userPaused = false;
  let contextLost = false;
  const canRender = () => !document.hidden && inViewport && !externallyPaused && !userPaused && !contextLost;
  const updateControl = () => {
    container.dataset.motionState = prefersReducedMotion ? 'reduced' : canRender() ? 'running' : 'paused';
    if (!motionButton) return;
    motionButton.hidden = prefersReducedMotion || contextLost;
    motionButton.setAttribute('aria-pressed', String(userPaused));
    motionButton.setAttribute('aria-label', userPaused ? 'Resume background animation' : 'Pause background animation');
    motionButton.title = userPaused ? 'Resume background animation' : 'Pause background animation';
    motionButton.querySelector('[data-motion-label]').textContent = userPaused ? 'Resume motion' : 'Pause motion';
  };
  const startRAF = () => {
    updateControl();
    if (raf || !canRender()) return;
    if (pausedAt !== null) {
      t0 += performance.now() - pausedAt;
      pausedAt = null;
    }
    raf = requestAnimationFrame(render);
  };
  const stopRAF = () => {
    if (pausedAt === null) pausedAt = performance.now();
    cancelAnimationFrame(raf);
    raf = 0;
    updateControl();
  };
  stopAnimation = stopRAF;

  const rnd = () => Math.random();
  const wX = 0.3 + rnd() * 0.6;
  const wY = 0.2 + rnd() * 0.7;
  const wZ = 0.1 + rnd() * 0.5;
  const phX = rnd() * Math.PI * 2;
  const phZ = rnd() * Math.PI * 2;

  let yaw = 0, pitch = 0, roll = 0;
  let targetYaw = 0, targetPitch = 0;
  const lerp = (a, b, t) => a + (b - a) * t;

  const pointer = { x: 0, y: 0, inside: true };
  const onMove = e => {
    const ww = Math.max(1, window.innerWidth);
    const wh = Math.max(1, window.innerHeight);
    const cx = ww * 0.5;
    const cy = wh * 0.5;
    const nx = (e.clientX - cx) / (ww * 0.5);
    const ny = (e.clientY - cy) / (wh * 0.5);
    pointer.x = Math.max(-1, Math.min(1, nx));
    pointer.y = Math.max(-1, Math.min(1, ny));
    pointer.inside = true;
  };
  const onLeave = () => { pointer.inside = false; };
  const onBlur = () => { pointer.inside = false; };

  if (animationType === 'hover') {
    const onPointerMove = e => { onMove(e); startRAF(); };
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('mouseleave', onLeave);
    window.addEventListener('blur', onBlur);
    program.uniforms.uUseBaseWobble.value = 0;
  } else if (animationType === '3drotate') {
    program.uniforms.uUseBaseWobble.value = 0;
  } else {
    program.uniforms.uUseBaseWobble.value = 1;
  }

  const render = t => {
    if (!canRender()) {
      stopRAF();
      return;
    }
    if (lastRenderAt && t - lastRenderAt < frameInterval) {
      raf = requestAnimationFrame(render);
      return;
    }
    lastRenderAt = t;
    const time = (t - t0) * 0.001;
    program.uniforms.iTime.value = time;

    let continueRAF = true;

    if (animationType === 'hover') {
      const maxPitch = 0.6 * HOVSTR;
      const maxYaw = 0.6 * HOVSTR;
      targetYaw = (pointer.inside ? -pointer.x : 0) * maxYaw;
      targetPitch = (pointer.inside ? pointer.y : 0) * maxPitch;
      yaw = lerp(yaw, targetYaw, INERT);
      pitch = lerp(pitch, targetPitch, INERT);
      roll = lerp(roll, 0, 0.1);
      program.uniforms.uRot.value = setMat3FromEuler(yaw, pitch, roll, rotBuf);

      if (NOISE_IS_ZERO) {
        const settled = Math.abs(yaw - targetYaw) < 1e-4 && Math.abs(pitch - targetPitch) < 1e-4 && Math.abs(roll) < 1e-4;
        if (settled) continueRAF = false;
      }
    } else if (animationType === '3drotate') {
      const tScaled = time * TS;
      yaw = tScaled * wY;
      pitch = Math.sin(tScaled * wX + phX) * 0.6;
      roll = Math.sin(tScaled * wZ + phZ) * 0.5;
      program.uniforms.uRot.value = setMat3FromEuler(yaw, pitch, roll, rotBuf);
      if (TS < 1e-6) continueRAF = false;
    } else {
      rotBuf[0] = 1; rotBuf[1] = 0; rotBuf[2] = 0;
      rotBuf[3] = 0; rotBuf[4] = 1; rotBuf[5] = 0;
      rotBuf[6] = 0; rotBuf[7] = 0; rotBuf[8] = 1;
      program.uniforms.uRot.value = rotBuf;
      if (TS < 1e-6) continueRAF = false;
    }

    try {
      renderer.render({ scene: mesh });
    } catch {
      contextLost = true;
      fallback();
      return;
    }
    if (continueRAF) {
      raf = requestAnimationFrame(render);
    } else {
      raf = 0;
    }
  };

  motionButton?.addEventListener('click', () => {
    userPaused = !userPaused;
    if (userPaused) stopRAF();
    else startRAF();
  });
  motionPreference.addEventListener('change', event => {
    prefersReducedMotion = event.matches;
    TS = prefersReducedMotion ? 0 : Math.max(0, config.timeScale || 1);
    program.uniforms.uTimeScale.value = TS;
    stopRAF();
    startRAF();
  });
  gl.canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault();
    contextLost = true;
    fallback();
  });
  window.addEventListener('pagehide', () => { stopRAF(); ro.disconnect(); });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopRAF();
    } else {
      startRAF();
    }
  });

  window.addEventListener('kanan:motion-pause', () => {
    externallyPaused = true;
    stopRAF();
  });
  window.addEventListener('kanan:motion-resume', () => {
    externallyPaused = false;
    startRAF();
  });

  if ('IntersectionObserver' in window) {
    const visibilityObserver = new IntersectionObserver(entries => {
      inViewport = entries.some(entry => entry.isIntersecting);
      if (inViewport) startRAF();
      else stopRAF();
    }, { rootMargin: '100px 0px' });
    visibilityObserver.observe(container);
  }

  startRAF();
  } catch { fallback(); }
})();
