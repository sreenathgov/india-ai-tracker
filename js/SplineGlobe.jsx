/**
 * SplineGlobe — React island for 3D Earth visualization
 *
 * - Mobile (≤768px): CSS fallback sphere only
 * - Desktop: React.lazy + Suspense, transparent WebGL background
 * - No interact button
 */

import React, { useState, Suspense, lazy } from 'react';

const Spline = lazy(() => import('@splinetool/react-spline'));

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
      // Global AnimationMixer timeScale — affects every clip uniformly
      if (controls.mixer && typeof controls.mixer.timeScale !== 'undefined') {
        controls.mixer.timeScale = 0.8;
      }
      // Belt-and-braces: also set on each individual AnimationAction
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

  // Load Spline on all devices — CSS sphere fallback covers WebGL failures
  return React.createElement('div', { style: wrapperStyle, className: 'spline-globe' },
    hasError
      ? React.createElement(GlobeFallback)
      : React.createElement(Suspense, {
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
