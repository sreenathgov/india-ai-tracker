/**
 * SplineGlobe — React island for 3D Earth visualization
 *
 * - iOS/iPadOS (all browsers): CSS fallback sphere
 *   Reason: iOS forces WebKit on all browsers; mix-blend-mode+WebGL is broken
 *   because the GPU-composited canvas is composited outside the DOM blend stack.
 * - Narrow screens (<640px, phones): CSS fallback sphere
 *   Reason: Spline camera is calibrated for a ~530px column; on narrow phones
 *   you only see a zoomed-in crop of the globe instead of the full sphere.
 * - All other devices (Android tablet, desktop): Spline WebGL globe
 */

import React, { useState, Suspense, lazy } from 'react';

const Spline = lazy(() => import('@splinetool/react-spline'));

// iOS detection — covers iPhone, iPad (legacy UA), and modern iPads that
// report themselves as MacIntel but expose multiple touch points
const isIOS = typeof navigator !== 'undefined' && (
  /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
);

// Narrow-screen detection — phones regardless of OS
const isNarrowScreen = typeof window !== 'undefined' && window.innerWidth < 640;

// CSS fallback is needed when mix-blend-mode+WebGL won't work
const FORCE_CSS_FALLBACK = isIOS || isNarrowScreen;

// Set data-fallback attribute immediately at module load — defer scripts run
// after the DOM is parsed so the elements already exist at this point.
// This ensures the CSS fallback rules apply BEFORE React's first paint.
if (FORCE_CSS_FALLBACK && typeof document !== 'undefined') {
  const mount = document.getElementById('splineGlobeContainer');
  if (mount) {
    mount.setAttribute('data-fallback', 'true');
    const right = mount.closest('.platform-split__right');
    if (right) right.setAttribute('data-fallback', 'true');
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

  // iOS and narrow phones get the CSS sphere — clean, fast, works everywhere
  if (FORCE_CSS_FALLBACK || hasError) {
    return React.createElement('div', { style: wrapperStyle, className: 'spline-globe' },
      React.createElement(GlobeFallback)
    );
  }

  // Desktop + Android tablet: Spline WebGL globe with mix-blend-mode:screen
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
