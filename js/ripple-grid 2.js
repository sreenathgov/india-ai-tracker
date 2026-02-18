/**
 * RippleGrid -- Vanilla WebGL port of ReactBits RippleGrid component
 * Zero dependencies. GLSL shaders ported verbatim from the React source.
 * Uses native WebGL API instead of the OGL library.
 *
 * Usage:
 *   const grid = new RippleGrid(containerElement, { gridColor: '#0a2f52', ... });
 *   grid.destroy(); // cleanup
 */

class RippleGrid {
  constructor(container, config = {}) {
    this.container = container;

    // Config with defaults matching the ReactBits component
    this.config = {
      enableRainbow: false,
      gridColor: '#ffffff',
      rippleIntensity: 0.05,
      gridSize: 10.0,
      gridThickness: 15.0,
      fadeDistance: 1.5,
      vignetteStrength: 2.0,
      glowIntensity: 0.1,
      opacity: 1.0,
      gridRotation: 0,
      mouseInteraction: true,
      mouseInteractionRadius: 1.0,
      ...config
    };

    // Internal state
    this.canvas = null;
    this.gl = null;
    this.program = null;
    this.uniforms = {};
    this.animId = null;
    this.startTime = performance.now();

    this.mousePos = { x: 0.5, y: 0.5 };
    this.targetMouse = { x: 0.5, y: 0.5 };
    this.mouseInfluence = 0;
    this.targetInfluence = 0;

    // Bound handlers for cleanup
    this._handleResize = this._handleResize.bind(this);
    this._handleMouseMove = this._handleMouseMove.bind(this);
    this._handleMouseEnter = this._handleMouseEnter.bind(this);
    this._handleMouseLeave = this._handleMouseLeave.bind(this);

    this._init();
  }

  // --- Hex color to [r, g, b] floats 0-1 ---
  _hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? [
          parseInt(result[1], 16) / 255,
          parseInt(result[2], 16) / 255,
          parseInt(result[3], 16) / 255
        ]
      : [1, 1, 1];
  }

  _init() {
    // Create canvas
    this.canvas = document.createElement('canvas');
    this.canvas.style.cssText = [
      'position: absolute',
      'inset: 0',
      'width: 100%',
      'height: 100%',
      'pointer-events: none',
      'z-index: 0'
    ].join(';');
    this.container.appendChild(this.canvas);

    // WebGL context with alpha for transparency
    const contextAttribs = { alpha: true, premultipliedAlpha: false, antialias: false };
    this.gl = this.canvas.getContext('webgl', contextAttribs)
           || this.canvas.getContext('experimental-webgl', contextAttribs);

    if (!this.gl) {
      console.warn('RippleGrid: WebGL not supported, skipping background.');
      this.canvas.remove();
      return;
    }

    const gl = this.gl;

    // Enable alpha blending
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // Compile shaders
    this._compileProgram();
    if (!this.program) return;

    // Full-screen triangle (OGL's Triangle: 3 vertices covering [-1, -1] to [1, 1])
    const positions = new Float32Array([-1, -1, 3, -1, -1, 3]);
    const posBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const posLoc = gl.getAttribLocation(this.program, 'position');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    // Cache uniform locations
    this._cacheUniforms();

    // Initial resize
    this._handleResize();

    // Event listeners
    window.addEventListener('resize', this._handleResize);
    if (typeof ResizeObserver !== 'undefined') {
      this._resizeObserver = new ResizeObserver(this._handleResize);
      this._resizeObserver.observe(this.container);
    }
    if (this.config.mouseInteraction) {
      this.container.style.pointerEvents = 'auto';
      this.canvas.style.pointerEvents = 'none';
      this.container.addEventListener('mousemove', this._handleMouseMove);
      this.container.addEventListener('mouseenter', this._handleMouseEnter);
      this.container.addEventListener('mouseleave', this._handleMouseLeave);
    }

    // Start render loop
    this._render(performance.now());
  }

  _compileProgram() {
    const gl = this.gl;

    // Vertex shader -- identical to the React component's vert string
    const vertSrc = `
attribute vec2 position;
varying vec2 vUv;
void main() {
    vUv = position * 0.5 + 0.5;
    gl_Position = vec4(position, 0.0, 1.0);
}`;

    // Fragment shader -- identical to the React component's frag string
    const fragSrc = `precision highp float;
uniform float iTime;
uniform vec2 iResolution;
uniform bool enableRainbow;
uniform vec3 gridColor;
uniform float rippleIntensity;
uniform float gridSize;
uniform float gridThickness;
uniform float fadeDistance;
uniform float vignetteStrength;
uniform float glowIntensity;
uniform float opacity;
uniform float gridRotation;
uniform bool mouseInteraction;
uniform vec2 mousePosition;
uniform float mouseInfluence;
uniform float mouseInteractionRadius;
varying vec2 vUv;
float pi = 3.141592;
mat2 rotate(float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return mat2(c, -s, s, c);
}
void main() {
    vec2 uv = vUv * 2.0 - 1.0;
    uv.x *= iResolution.x / iResolution.y;
    if (gridRotation != 0.0) {
        uv = rotate(gridRotation * pi / 180.0) * uv;
    }
    float dist = length(uv);
    float func = sin(pi * (iTime - dist));
    vec2 rippleUv = uv + uv * func * rippleIntensity;
    if (mouseInteraction && mouseInfluence > 0.0) {
        vec2 mouseUv = (mousePosition * 2.0 - 1.0);
        mouseUv.x *= iResolution.x / iResolution.y;
        float mouseDist = length(uv - mouseUv);
        float influence = mouseInfluence * exp(-mouseDist * mouseDist / (mouseInteractionRadius * mouseInteractionRadius));
        float mouseWave = sin(pi * (iTime * 2.0 - mouseDist * 3.0)) * influence;
        rippleUv += normalize(uv - mouseUv) * mouseWave * rippleIntensity * 0.3;
    }
    vec2 a = sin(gridSize * 0.5 * pi * rippleUv - pi / 2.0);
    vec2 b = abs(a);
    float aaWidth = 0.5;
    vec2 smoothB = vec2(
        smoothstep(0.0, aaWidth, b.x),
        smoothstep(0.0, aaWidth, b.y)
    );
    vec3 color = vec3(0.0);
    color += exp(-gridThickness * smoothB.x * (0.8 + 0.5 * sin(pi * iTime)));
    color += exp(-gridThickness * smoothB.y);
    color += 0.5 * exp(-(gridThickness / 4.0) * sin(smoothB.x));
    color += 0.5 * exp(-(gridThickness / 3.0) * smoothB.y);
    if (glowIntensity > 0.0) {
        color += glowIntensity * exp(-gridThickness * 0.5 * smoothB.x);
        color += glowIntensity * exp(-gridThickness * 0.5 * smoothB.y);
    }
    float ddd = exp(-2.0 * clamp(pow(dist, fadeDistance), 0.0, 1.0));
    vec2 vignetteCoords = vUv - 0.5;
    float vignetteDistance = length(vignetteCoords);
    float vignette = 1.0 - pow(vignetteDistance * 2.0, vignetteStrength);
    vignette = clamp(vignette, 0.0, 1.0);
    vec3 t;
    if (enableRainbow) {
        t = vec3(
            uv.x * 0.5 + 0.5 * sin(iTime),
            uv.y * 0.5 + 0.5 * cos(iTime),
            pow(cos(iTime), 4.0)
        ) + 0.5;
    } else {
        t = gridColor;
    }
    float finalFade = ddd * vignette;
    float alpha = length(color) * finalFade * opacity;
    gl_FragColor = vec4(color * t * finalFade * opacity, alpha);
}`;

    const vert = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vert, vertSrc);
    gl.compileShader(vert);
    if (!gl.getShaderParameter(vert, gl.COMPILE_STATUS)) {
      console.warn('RippleGrid: vertex shader error:', gl.getShaderInfoLog(vert));
      return;
    }

    const frag = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(frag, fragSrc);
    gl.compileShader(frag);
    if (!gl.getShaderParameter(frag, gl.COMPILE_STATUS)) {
      console.warn('RippleGrid: fragment shader error:', gl.getShaderInfoLog(frag));
      return;
    }

    this.program = gl.createProgram();
    gl.attachShader(this.program, vert);
    gl.attachShader(this.program, frag);
    gl.linkProgram(this.program);
    if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
      console.warn('RippleGrid: program link error:', gl.getProgramInfoLog(this.program));
      this.program = null;
      return;
    }

    gl.useProgram(this.program);
  }

  _cacheUniforms() {
    const gl = this.gl;
    const p = this.program;
    this.uniforms = {
      iTime:                 gl.getUniformLocation(p, 'iTime'),
      iResolution:           gl.getUniformLocation(p, 'iResolution'),
      enableRainbow:         gl.getUniformLocation(p, 'enableRainbow'),
      gridColor:             gl.getUniformLocation(p, 'gridColor'),
      rippleIntensity:       gl.getUniformLocation(p, 'rippleIntensity'),
      gridSize:              gl.getUniformLocation(p, 'gridSize'),
      gridThickness:         gl.getUniformLocation(p, 'gridThickness'),
      fadeDistance:          gl.getUniformLocation(p, 'fadeDistance'),
      vignetteStrength:      gl.getUniformLocation(p, 'vignetteStrength'),
      glowIntensity:         gl.getUniformLocation(p, 'glowIntensity'),
      opacity:               gl.getUniformLocation(p, 'opacity'),
      gridRotation:          gl.getUniformLocation(p, 'gridRotation'),
      mouseInteraction:      gl.getUniformLocation(p, 'mouseInteraction'),
      mousePosition:         gl.getUniformLocation(p, 'mousePosition'),
      mouseInfluence:        gl.getUniformLocation(p, 'mouseInfluence'),
      mouseInteractionRadius: gl.getUniformLocation(p, 'mouseInteractionRadius')
    };

    // Set static uniforms (values that don't change per frame)
    const c = this.config;
    const rgb = this._hexToRgb(c.gridColor);
    gl.uniform1i(this.uniforms.enableRainbow,          c.enableRainbow ? 1 : 0);
    gl.uniform3f(this.uniforms.gridColor,              rgb[0], rgb[1], rgb[2]);
    gl.uniform1f(this.uniforms.rippleIntensity,        c.rippleIntensity);
    gl.uniform1f(this.uniforms.gridSize,               c.gridSize);
    gl.uniform1f(this.uniforms.gridThickness,          c.gridThickness);
    gl.uniform1f(this.uniforms.fadeDistance,           c.fadeDistance);
    gl.uniform1f(this.uniforms.vignetteStrength,       c.vignetteStrength);
    gl.uniform1f(this.uniforms.glowIntensity,          c.glowIntensity);
    gl.uniform1f(this.uniforms.opacity,                c.opacity);
    gl.uniform1f(this.uniforms.gridRotation,           c.gridRotation);
    gl.uniform1i(this.uniforms.mouseInteraction,       c.mouseInteraction ? 1 : 0);
    gl.uniform1f(this.uniforms.mouseInteractionRadius, c.mouseInteractionRadius);
  }

  _handleResize() {
    if (!this.gl || !this.canvas || !this.container) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = this.container.offsetWidth;
    const h = this.container.offsetHeight;
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    this.gl.uniform2f(this.uniforms.iResolution, this.canvas.width, this.canvas.height);
  }

  _handleMouseMove(e) {
    if (!this.container) return;
    const rect = this.container.getBoundingClientRect();
    this.targetMouse.x = (e.clientX - rect.left) / rect.width;
    this.targetMouse.y = 1.0 - (e.clientY - rect.top) / rect.height; // flip Y
  }

  _handleMouseEnter() {
    this.targetInfluence = 1.0;
  }

  _handleMouseLeave() {
    this.targetInfluence = 0.0;
  }

  _render(now) {
    if (!this.gl || !this.program) return;
    this.animId = requestAnimationFrame((t) => this._render(t));

    const gl = this.gl;
    const elapsed = (now - this.startTime) * 0.001;

    // Lerp mouse position (matches React component's lerpFactor: 0.1)
    this.mousePos.x += (this.targetMouse.x - this.mousePos.x) * 0.1;
    this.mousePos.y += (this.targetMouse.y - this.mousePos.y) * 0.1;

    // Lerp mouse influence (matches React component's 0.05)
    this.mouseInfluence += (this.targetInfluence - this.mouseInfluence) * 0.05;

    // Update per-frame uniforms
    gl.uniform1f(this.uniforms.iTime, elapsed);
    gl.uniform2f(this.uniforms.mousePosition, this.mousePos.x, this.mousePos.y);
    gl.uniform1f(this.uniforms.mouseInfluence, this.mouseInfluence);

    // Draw full-screen triangle
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  destroy() {
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
    window.removeEventListener('resize', this._handleResize);
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
    }
    if (this.config.mouseInteraction && this.container) {
      this.container.removeEventListener('mousemove', this._handleMouseMove);
      this.container.removeEventListener('mouseenter', this._handleMouseEnter);
      this.container.removeEventListener('mouseleave', this._handleMouseLeave);
    }
    if (this.gl) {
      const ext = this.gl.getExtension('WEBGL_lose_context');
      if (ext) ext.loseContext();
    }
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
    this.canvas = null;
    this.gl = null;
    this.program = null;
  }
}
