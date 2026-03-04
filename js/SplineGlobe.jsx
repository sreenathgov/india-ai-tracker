/**
 * SplineGlobe — React island for 3D Earth visualization
 *
 * Rendering pipeline (cross-browser):
 *   CSS filter chain on .spline-globe-mount:
 *     contrast(5) → brightness(1.2) → grayscale(0.55) → url(#luma-fade)
 *   The SVG luma-fade filter (luminanceToAlpha) maps dark pixels to transparent
 *   and bright pixels to opaque. This replaces mix-blend-mode:screen which was
 *   unreliable on Safari/WebKit.
 *
 * - Narrow screens (<640px): CSS fallback sphere
 *   Reason: Spline camera is calibrated for a ~530px column; on phones
 *   you only see a zoomed-in crop instead of the full sphere.
 * - All other devices: Spline WebGL globe (works on Chrome, Safari, Firefox)
 */

import React, { useState, Suspense, lazy } from 'react';

const Spline = lazy(() => import('@splinetool/react-spline'));

// Narrow-screen detection — phones get CSS fallback (Spline camera framing is wrong)
const isNarrowScreen = typeof window !== 'undefined' && window.innerWidth < 640;
const FORCE_CSS_FALLBACK = isNarrowScreen;

// Set data-fallback attribute on the mount container before React renders.
// Defer scripts run after DOM is parsed so the element exists at this point.
if (FORCE_CSS_FALLBACK && typeof document !== 'undefined') {
  const mount = document.getElementById('splineGlobeContainer');
  if (mount) {
    mount.setAttribute('data-fallback', 'true');
  }
}

function GlobeFallback() {
  return React.createElement('div', { className: 'spline-globe__fallback' },
    React.createElement('div', { className: 'spline-globe__sphere' })
  );
}

function makeTransparent(app) {
  try {
    // @splinetool/runtime v1.x: renderer is at app._renderer (THREE.WebGLRenderer)
    const renderer = app._renderer;
    if (renderer) {
      // Set WebGL clear to fully transparent
      if (typeof renderer.setClearColor === 'function') renderer.setClearColor(0x000000, 0);
      if (typeof renderer.setClearAlpha === 'function') renderer.setClearAlpha(0);

      // Cap pixel ratio to 2x — on 3x retina displays (most modern phones/iPads)
      // the default 3x renders 9× more pixels than 1x. Capping at 2x cuts GPU load
      // by 56% without a visible quality difference at typical viewing distances.
      if (typeof renderer.setPixelRatio === 'function') {
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      }

      // Spline uses a custom post-processing pipeline with its own clearPass.
      // setBackgroundDisabled(true) makes the pipeline null out scene.background
      // before each render, preventing the opaque scene background from drawing.
      if (renderer.pipeline) {
        if (typeof renderer.pipeline.setBackgroundDisabled === 'function') {
          renderer.pipeline.setBackgroundDisabled(true);
        } else {
          // Direct property fallback for older/newer pipeline versions
          renderer.pipeline.ignoreBackground = true;
        }
      }
    }
    // Zero out the canvas CSS background
    if (app.canvas) app.canvas.style.background = 'transparent';
  } catch (_) { /* silently ignore if API shape differs */ }

  // Slow all animation clips by 20% (timeScale 0.8 = 80% speed)
  try {
    const controls = app._animationControls;
    if (controls) {
      if (controls.mixer && typeof controls.mixer.timeScale !== 'undefined') {
        controls.mixer.timeScale = 0.8;
      }
      if (controls.clipIdToAction) {
        Object.values(controls.clipIdToAction).forEach(action => {
          if (action && typeof action.timeScale === 'number') action.timeScale = 0.8;
        });
      }
    }
  } catch (_) { /* silently ignore if Spline internals differ */ }
}

export default function SplineGlobe() {
  const [hasError, setHasError] = useState(false);

  const wrapperStyle = {
    width: '100%',
    height: '100%',
    position: 'relative',
    pointerEvents: 'none', // never hijack page scroll
    background: 'transparent',
  };

  // Narrow phones get the CSS sphere — clean, fast, correct aspect ratio
  if (FORCE_CSS_FALLBACK || hasError) {
    return React.createElement('div', { style: wrapperStyle, className: 'spline-globe' },
      React.createElement(GlobeFallback)
    );
  }

  // All other devices: Spline WebGL globe
  return React.createElement('div', { style: wrapperStyle, className: 'spline-globe' },
    React.createElement(Suspense, {
      fallback: React.createElement(GlobeFallback)
    },
      React.createElement(Spline, {
        scene: '/added-assets/earth-realistic.splinecode',
        style: { width: '100%', height: '100%', background: 'transparent' },
        onLoad: makeTransparent,
        onError: () => setHasError(true),
      })
    )
  );
}
