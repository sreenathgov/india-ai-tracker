/**
 * Resources gallery — an arched, draggable WebGL ribbon of recent
 * publication covers, ported from the reactbits.dev CircularGallery
 * (React + ogl) to a vanilla module for the Resources page.
 *
 * Items come from the same embedded #resources-data JSON that
 * resources.js renders; only entries with a cover image are shown.
 * All input is scoped to the section so page scrolling is never
 * hijacked: horizontal drag/swipe/wheel moves the ribbon, vertical
 * gestures fall through to the page. A click (as opposed to a drag)
 * opens the publication under the cursor. If ogl fails to load or
 * WebGL is unavailable the section removes itself — the cards below
 * remain the canonical catalog.
 */
(async function () {
  'use strict';

  const section = document.getElementById('resourcesGallery');
  if (!section) return;

  const CONFIG = Object.freeze({
    oglUrl: 'https://cdn.jsdelivr.net/npm/ogl@1.0.11/+esm',
    bend: 0,
    scrollSpeed: 2,
    scrollEase: 0.06,
    cornerRadiusPx: 18,
    textColor: '#F5F3EE',
    font: '600 34px Inter',
    // Card sizing: plane px height = planeHeightFactor * (container height /
    // scaleDivisor); smaller divisor → bigger cards.
    scaleDivisor: 925,
    planeWidthFactor: 700,
    planeHeightFactor: 900,
    // Title sizing: every title renders one text line at this fraction of
    // the card height, so type size is uniform across all cards.
    titleLineFrac: 0.065,
    titleMaxWidthRatio: 0.84,
    titlePadRatio: 0.075,
    maxItems: 8,
    minPlanes: 12,
    dragThresholdPx: 8,
    idleDelayMs: 2500,
    idleDriftPerFrame: 0.005
  });

  // ---------- data ----------

  function isGalleryItem(item) {
    return Boolean(
      item &&
      typeof item.title === 'string' && item.title.trim() &&
      typeof item.href === 'string' && item.href.trim() &&
      typeof item.image === 'string' && item.image.trim()
    );
  }

  // Prefer the part before a colon ("The SB005 Trap: Why…" → "The SB005
  // Trap") so overlays stay short; texture drawing wraps the rest.
  function shortTitle(title) {
    const trimmed = title.trim();
    const colon = trimmed.indexOf(':');
    return colon > 8 && colon <= 44 ? trimmed.slice(0, colon) : trimmed;
  }

  function readGalleryItems() {
    const block = document.getElementById('resources-data');
    if (!block) return [];
    try {
      const parsed = JSON.parse(block.textContent);
      if (!parsed || !Array.isArray(parsed.items)) return [];
      return parsed.items
        .filter(isGalleryItem)
        .slice()
        .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')))
        .slice(0, CONFIG.maxItems)
        .map(item => ({ image: item.image, text: shortTitle(item.title), href: item.href }));
    } catch (err) {
      console.error('rc-gallery: could not parse resources-data:', err);
      return [];
    }
  }

  function isExternal(href) {
    return /^https?:\/\//i.test(href);
  }

  function openItem(item) {
    if (isExternal(item.href)) {
      window.open(item.href, '_blank', 'noopener');
    } else {
      window.location.assign(item.href);
    }
  }

  // ---------- generic helpers ----------

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function debounce(fn, wait) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn.apply(this, args), wait);
    };
  }

  function getFontSize(font) {
    const match = font.match(/(\d+)px/);
    return match ? parseInt(match[1], 10) : 30;
  }

  // ---------- init gate: data, ogl, font ----------

  const items = readGalleryItems();
  if (items.length < 2) {
    section.remove();
    return;
  }

  let OGL;
  try {
    OGL = await import(CONFIG.oglUrl);
  } catch (err) {
    console.error('rc-gallery: failed to load ogl, removing gallery:', err);
    section.remove();
    return;
  }

  if (document.fonts && document.fonts.load) {
    try {
      await document.fonts.load(CONFIG.font);
    } catch (err) {
      // Titles render with the fallback font — acceptable.
    }
  }

  const { Camera, Mesh, Plane, Program, Renderer, Texture, Transform } = OGL;

  // ---------- text textures ----------

  function layoutTitleLines(context, text, maxWidth, maxLines) {
    const words = text.split(/\s+/).filter(Boolean);
    const lines = [];
    let current = '';
    words.forEach(word => {
      const attempt = current ? current + ' ' + word : word;
      if (!current || context.measureText(attempt).width <= maxWidth) {
        current = attempt;
      } else {
        lines.push(current);
        current = word;
      }
    });
    if (current) lines.push(current);
    if (lines.length <= maxLines) return lines;
    const kept = lines.slice(0, maxLines);
    let last = kept[maxLines - 1];
    while (last && context.measureText(last + '…').width > maxWidth) {
      last = last.slice(0, -1).trimEnd();
    }
    return kept.slice(0, maxLines - 1).concat(last + '…');
  }

  function createTextTexture(gl, text, font, color) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    context.font = font;
    const fontSize = getFontSize(font);
    const lineHeight = Math.ceil(fontSize * 1.25);
    // Wrap width in canvas px that maps exactly onto titleMaxWidthRatio of
    // the card width once the fixed titleLineFrac type scale is applied
    // (the card's width:height ratio is constant across screen sizes).
    const planeAspect = CONFIG.planeWidthFactor / CONFIG.planeHeightFactor;
    const maxWidth = (lineHeight * planeAspect * CONFIG.titleMaxWidthRatio) / CONFIG.titleLineFrac;
    const lines = layoutTitleLines(context, text, maxWidth, 2);
    const pad = Math.ceil(fontSize * 0.35);
    const textWidth = Math.ceil(Math.max(...lines.map(l => context.measureText(l).width)));
    canvas.width = textWidth + pad * 2;
    canvas.height = lineHeight * lines.length + pad * 2;
    context.font = font;
    context.fillStyle = color;
    context.textBaseline = 'middle';
    context.textAlign = 'left';
    lines.forEach((line, i) => {
      context.fillText(line, pad, pad + lineHeight * (i + 0.5));
    });
    const texture = new Texture(gl, { generateMipmaps: false });
    texture.image = canvas;
    return { texture, width: canvas.width, height: canvas.height, lineHeight };
  }

  // ---------- shaders ----------

  const MEDIA_VERTEX = `
    precision highp float;
    attribute vec3 position;
    attribute vec2 uv;
    uniform mat4 modelViewMatrix;
    uniform mat4 projectionMatrix;
    uniform float uTime;
    uniform float uSpeed;
    varying vec2 vUv;
    void main() {
      vUv = uv;
      vec3 p = position;
      p.z = (sin(p.x * 4.0 + uTime) * 1.5 + cos(p.y * 2.0 + uTime) * 1.5) * (0.1 + uSpeed * 0.5);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
    }
  `;

  const MEDIA_FRAGMENT = `
    precision highp float;
    uniform vec2 uImageSizes;
    uniform vec2 uPlaneSizes;
    uniform sampler2D tMap;
    uniform float uRadius;
    uniform float uEdge;
    uniform vec3 uScrimColor;
    varying vec2 vUv;

    float roundedBoxSDF(vec2 p, vec2 b, float r) {
      vec2 d = abs(p) - b;
      return length(max(d, vec2(0.0))) + min(max(d.x, d.y), 0.0) - r;
    }

    void main() {
      vec2 ratio = vec2(
        min((uPlaneSizes.x / uPlaneSizes.y) / (uImageSizes.x / uImageSizes.y), 1.0),
        min((uPlaneSizes.y / uPlaneSizes.x) / (uImageSizes.y / uImageSizes.x), 1.0)
      );
      vec2 uv = vec2(
        vUv.x * ratio.x + (1.0 - ratio.x) * 0.5,
        vUv.y * ratio.y + (1.0 - ratio.y) * 0.5
      );
      vec4 color = texture2D(tMap, uv);

      // Navy scrim over the lower edge keeps the overlaid title legible.
      float scrim = (1.0 - smoothstep(0.0, 0.45, vUv.y)) * 0.62;
      color.rgb = mix(color.rgb, uScrimColor, scrim);

      // Rounded corners computed in world units per axis, so they stay
      // circular (not elliptical) and match the 18px card radius below.
      vec2 pos = (vUv - 0.5) * uPlaneSizes;
      float d = roundedBoxSDF(pos, uPlaneSizes * 0.5 - vec2(uRadius), uRadius);
      float alpha = 1.0 - smoothstep(-uEdge, uEdge, d);

      gl_FragColor = vec4(color.rgb, alpha);
    }
  `;

  const TITLE_VERTEX = `
    attribute vec3 position;
    attribute vec2 uv;
    uniform mat4 modelViewMatrix;
    uniform mat4 projectionMatrix;
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const TITLE_FRAGMENT = `
    precision highp float;
    uniform sampler2D tMap;
    varying vec2 vUv;
    void main() {
      vec4 color = texture2D(tMap, vUv);
      if (color.a < 0.1) discard;
      gl_FragColor = color;
    }
  `;

  // ---------- title overlay ----------

  class TitleOverlay {
    constructor({ gl, plane, text }) {
      const { texture, width, height, lineHeight } = createTextTexture(gl, text, CONFIG.font, CONFIG.textColor);
      this.canvasW = width;
      this.canvasH = height;
      this.lineHeight = lineHeight;
      const program = new Program(gl, {
        depthTest: false,
        depthWrite: false,
        vertex: TITLE_VERTEX,
        fragment: TITLE_FRAGMENT,
        uniforms: { tMap: { value: texture } },
        transparent: true
      });
      this.mesh = new Mesh(gl, { geometry: new Plane(gl), program });
      this.mesh.setParent(plane);
    }

    // Child transforms live in plane-normalized space (the parent plane's
    // scale composes on top), so world sizes are divided back out here.
    // One canvas text line always maps to titleLineFrac of the card height,
    // giving every card an identical rendered type size.
    fit(planeW, planeH) {
      const worldPerCanvasPx = (planeH * CONFIG.titleLineFrac) / this.lineHeight;
      const w = this.canvasW * worldPerCanvasPx;
      const h = this.canvasH * worldPerCanvasPx;
      const pad = planeW * CONFIG.titlePadRatio;
      this.mesh.scale.set(w / planeW, h / planeH, 1);
      this.mesh.position.x = -0.5 + (w / 2 + pad) / planeW;
      this.mesh.position.y = -0.5 + (h / 2 + pad) / planeH;
      this.mesh.position.z = 0.02;
    }
  }

  // ---------- media plane ----------

  class Media {
    constructor({ geometry, gl, item, index, length, scene, screen, viewport }) {
      this.gl = gl;
      this.item = item;
      this.index = index;
      this.length = length;
      this.screen = screen;
      this.viewport = viewport;
      this.extra = 0;
      this.createShader(geometry, scene);
      this.title = new TitleOverlay({ gl, plane: this.plane, text: item.text });
      this.onResize({ screen, viewport });
    }

    createShader(geometry, scene) {
      const texture = new Texture(this.gl, { generateMipmaps: true });
      this.program = new Program(this.gl, {
        depthTest: false,
        depthWrite: false,
        vertex: MEDIA_VERTEX,
        fragment: MEDIA_FRAGMENT,
        uniforms: {
          tMap: { value: texture },
          uPlaneSizes: { value: [0, 0] },
          uImageSizes: { value: [0, 0] },
          uSpeed: { value: 0 },
          uTime: { value: 100 * Math.random() },
          uRadius: { value: 0 },
          uEdge: { value: 0.01 },
          uScrimColor: { value: [10 / 255, 47 / 255, 82 / 255] }
        },
        transparent: true
      });
      this.plane = new Mesh(this.gl, { geometry, program: this.program });
      this.plane.setParent(scene);

      const img = new Image();
      img.src = this.item.image;
      img.onload = () => {
        texture.image = img;
        this.program.uniforms.uImageSizes.value = [img.naturalWidth, img.naturalHeight];
      };
      img.onerror = () => {
        // Broken cover: fall back to a solid navy panel instead of black.
        const fallback = document.createElement('canvas');
        fallback.width = fallback.height = 2;
        const ctx = fallback.getContext('2d');
        ctx.fillStyle = '#0a2f52';
        ctx.fillRect(0, 0, 2, 2);
        texture.image = fallback;
        this.program.uniforms.uImageSizes.value = [2, 2];
      };
    }

    update(scroll, direction, timeStep) {
      this.plane.position.x = this.x - scroll.current - this.extra;

      const x = this.plane.position.x;
      if (CONFIG.bend === 0) {
        this.plane.position.y = 0;
        this.plane.rotation.z = 0;
      } else {
        const H = this.viewport.width / 2;
        const bendAbs = Math.abs(CONFIG.bend);
        const R = (H * H + bendAbs * bendAbs) / (2 * bendAbs);
        const effectiveX = Math.min(Math.abs(x), H);
        const arc = R - Math.sqrt(R * R - effectiveX * effectiveX);
        if (CONFIG.bend > 0) {
          this.plane.position.y = -arc;
          this.plane.rotation.z = -Math.sign(x) * Math.asin(effectiveX / R);
        } else {
          this.plane.position.y = arc;
          this.plane.rotation.z = Math.sign(x) * Math.asin(effectiveX / R);
        }
      }

      this.program.uniforms.uTime.value += timeStep;
      this.program.uniforms.uSpeed.value = scroll.current - scroll.last;

      const planeOffset = this.plane.scale.x / 2;
      const viewportOffset = this.viewport.width / 2;
      const isBefore = this.plane.position.x + planeOffset < -viewportOffset;
      const isAfter = this.plane.position.x - planeOffset > viewportOffset;
      if (direction === 'right' && isBefore) this.extra -= this.widthTotal;
      if (direction === 'left' && isAfter) this.extra += this.widthTotal;
    }

    onResize({ screen, viewport } = {}) {
      if (screen) this.screen = screen;
      if (viewport) this.viewport = viewport;
      this.scale = this.screen.height / CONFIG.scaleDivisor;
      this.plane.scale.y = (this.viewport.height * (CONFIG.planeHeightFactor * this.scale)) / this.screen.height;
      this.plane.scale.x = (this.viewport.width * (CONFIG.planeWidthFactor * this.scale)) / this.screen.width;
      this.program.uniforms.uPlaneSizes.value = [this.plane.scale.x, this.plane.scale.y];

      const worldPerPx = this.viewport.height / this.screen.height;
      this.program.uniforms.uRadius.value = CONFIG.cornerRadiusPx * worldPerPx;
      this.program.uniforms.uEdge.value = worldPerPx;

      this.title.fit(this.plane.scale.x, this.plane.scale.y);

      this.padding = 2;
      this.width = this.plane.scale.x + this.padding;
      this.widthTotal = this.width * this.length;
      this.x = this.width * this.index;
    }
  }

  // ---------- app ----------

  class GalleryApp {
    constructor(container, galleryItems) {
      this.container = container;
      this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      this.scroll = { current: 0, target: 0, last: 0, position: 0 };
      this.isDown = false;
      this.dragMoved = false;
      this.dragStart = { x: 0, y: 0 };
      this.touchLock = null;
      this.touchStart = { x: 0, y: 0 };
      this.hovering = false;
      this.lastInteraction = performance.now();
      this.raf = null;

      this.renderer = new Renderer({
        alpha: true,
        antialias: true,
        dpr: Math.min(window.devicePixelRatio || 1, 2)
      });
      this.gl = this.renderer.gl;
      this.gl.clearColor(0, 0, 0, 0);
      this.gl.canvas.setAttribute('aria-hidden', 'true');
      container.appendChild(this.gl.canvas);

      this.camera = new Camera(this.gl);
      this.camera.fov = 45;
      this.camera.position.z = 20;
      this.scene = new Transform();

      this.onResize();
      this.geometry = new Plane(this.gl, { heightSegments: 50, widthSegments: 100 });
      this.createMedias(galleryItems);
      this.snapDebounced = debounce(() => this.snap(), 250);
      this.addListeners();
      this.observeVisibility();
      // Prime two frames synchronously: the infinite-loop wrap only takes
      // effect one update after positions are first computed, so without
      // this the first painted frame shows an empty left half.
      this.update();
      this.update();
      this.start();
    }

    createMedias(galleryItems) {
      // Tile the (few) real items until the loop has enough planes to
      // wrap seamlessly on wide screens.
      const tiled = [];
      while (tiled.length < CONFIG.minPlanes) tiled.push(...galleryItems);
      this.medias = tiled.map((item, index) => new Media({
        geometry: this.geometry,
        gl: this.gl,
        item,
        index,
        length: tiled.length,
        scene: this.scene,
        screen: this.screen,
        viewport: this.viewport
      }));
    }

    onResize() {
      this.screen = { width: this.container.clientWidth, height: this.container.clientHeight };
      if (!this.screen.width || !this.screen.height) return;
      this.renderer.setSize(this.screen.width, this.screen.height);
      this.camera.perspective({ aspect: this.screen.width / this.screen.height });
      const fov = (this.camera.fov * Math.PI) / 180;
      const height = 2 * Math.tan(fov / 2) * this.camera.position.z;
      this.viewport = { width: height * this.camera.aspect, height };
      if (this.medias) {
        this.medias.forEach(m => m.onResize({ screen: this.screen, viewport: this.viewport }));
      }
    }

    markInteraction() {
      this.lastInteraction = performance.now();
    }

    onDown(x, y) {
      this.isDown = true;
      this.dragMoved = false;
      this.dragStart = { x, y };
      this.scroll.position = this.scroll.current;
      this.markInteraction();
    }

    onMove(x) {
      if (!this.isDown) return;
      if (Math.abs(this.dragStart.x - x) > CONFIG.dragThresholdPx) this.dragMoved = true;
      this.scroll.target = this.scroll.position + (this.dragStart.x - x) * (CONFIG.scrollSpeed * 0.025);
      this.markInteraction();
    }

    onUp(x) {
      if (!this.isDown) return;
      this.isDown = false;
      this.markInteraction();
      if (this.dragMoved) {
        this.snap();
      } else {
        this.openAt(x);
      }
    }

    snap() {
      const width = this.medias[0].width;
      this.scroll.target = Math.round(this.scroll.target / width) * width;
    }

    openAt(clientX) {
      const rect = this.container.getBoundingClientRect();
      const worldX = ((clientX - rect.left) / rect.width - 0.5) * this.viewport.width;
      const hit = this.medias.find(m => Math.abs(m.plane.position.x - worldX) <= m.plane.scale.x / 2);
      if (hit) openItem(hit.item);
    }

    openCentered() {
      const centered = this.medias.reduce((best, m) =>
        Math.abs(m.plane.position.x) < Math.abs(best.plane.position.x) ? m : best);
      openItem(centered.item);
    }

    onKey(event) {
      if (event.key === 'ArrowRight') {
        this.scroll.target += this.medias[0].width;
      } else if (event.key === 'ArrowLeft') {
        this.scroll.target -= this.medias[0].width;
      } else if (event.key === 'Home') {
        this.scroll.target = 0;
      } else if (event.key === 'Enter') {
        event.preventDefault();
        this.openCentered();
        return;
      } else {
        return;
      }
      event.preventDefault();
      this.markInteraction();
      this.snapDebounced();
    }

    addListeners() {
      const c = this.container;
      window.addEventListener('resize', () => this.onResize());

      c.addEventListener('mouseenter', () => { this.hovering = true; });
      c.addEventListener('mouseleave', () => { this.hovering = false; });

      c.addEventListener('mousedown', e => this.onDown(e.clientX, e.clientY));
      window.addEventListener('mousemove', e => this.onMove(e.clientX));
      window.addEventListener('mouseup', e => this.onUp(e.clientX));

      c.addEventListener('touchstart', e => {
        this.touchLock = null;
        this.touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        this.onDown(e.touches[0].clientX, e.touches[0].clientY);
      }, { passive: true });

      c.addEventListener('touchmove', e => {
        const touch = e.touches[0];
        if (this.touchLock === null) {
          const dx = Math.abs(touch.clientX - this.touchStart.x);
          const dy = Math.abs(touch.clientY - this.touchStart.y);
          if (dx > 6 || dy > 6) this.touchLock = dx > dy ? 'x' : 'y';
        }
        if (this.touchLock !== 'x') return; // vertical swipe → page scroll
        e.preventDefault();
        this.onMove(touch.clientX);
      }, { passive: false });

      c.addEventListener('touchend', e => {
        if (this.touchLock === 'y') {
          this.isDown = false;
          return;
        }
        this.onUp(e.changedTouches[0].clientX);
      });

      // Only horizontal wheel/trackpad deltas drive the ribbon; vertical
      // scrolling stays with the page.
      c.addEventListener('wheel', e => {
        if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
        e.preventDefault();
        this.markInteraction();
        this.scroll.target += e.deltaX * 0.01 * CONFIG.scrollSpeed;
        this.snapDebounced();
      }, { passive: false });

      c.addEventListener('keydown', e => this.onKey(e));
    }

    observeVisibility() {
      if (!('IntersectionObserver' in window)) return;
      const io = new IntersectionObserver(entries => {
        entries.forEach(entry => (entry.isIntersecting ? this.start() : this.stop()));
      });
      io.observe(this.container);
    }

    start() {
      if (this.raf !== null) return;
      const loop = () => {
        this.raf = window.requestAnimationFrame(loop);
        this.update();
      };
      this.raf = window.requestAnimationFrame(loop);
    }

    stop() {
      if (this.raf === null) return;
      window.cancelAnimationFrame(this.raf);
      this.raf = null;
    }

    update() {
      const idle = performance.now() - this.lastInteraction > CONFIG.idleDelayMs;
      if (!this.reducedMotion && !this.isDown && !this.hovering && idle) {
        this.scroll.target += CONFIG.idleDriftPerFrame;
      }
      this.scroll.current = lerp(this.scroll.current, this.scroll.target, CONFIG.scrollEase);
      const direction = this.scroll.current > this.scroll.last ? 'right' : 'left';
      const timeStep = this.reducedMotion ? 0 : 0.04;
      this.medias.forEach(m => m.update(this.scroll, direction, timeStep));
      this.renderer.render({ scene: this.scene, camera: this.camera });
      this.scroll.last = this.scroll.current;
    }
  }

  try {
    new GalleryApp(section, items);
  } catch (err) {
    console.error('rc-gallery: WebGL init failed, removing gallery:', err);
    section.remove();
  }
})();
