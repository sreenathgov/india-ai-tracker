/**
 * About Hero — React Island Entry Point
 * Mounts the FluidGlass lens canvas into #fluid-glass-root on about.html.
 * IIFE island pattern, mirrors js/scroll-reveal-entry.jsx shape.
 */

import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import AboutFluidGlass from './about-fluid-glass.jsx';

(function mountAboutHero() {
  try {
    const container = document.getElementById('fluid-glass-root');
    if (!container) return;

    // Silent bail if WebGL is unavailable
    try {
      const probe = document.createElement('canvas');
      const ctx = probe.getContext('webgl2') || probe.getContext('webgl');
      if (!ctx) return;
    } catch (_) {
      return;
    }

    ReactDOM.createRoot(container).render(
      React.createElement(
        Suspense,
        { fallback: null },
        React.createElement(AboutFluidGlass, null)
      )
    );
  } catch (error) {
    // Hero degrades gracefully to the static editorial layout.
    console.error('[AboutHero] Mount error:', error);
  }
})();
