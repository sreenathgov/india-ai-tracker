/**
 * Spline Globe — React Island Entry Point
 * Mounts the SplineGlobe component into #splineGlobeContainer
 * Follows the same IIFE island pattern as text-pressure-entry.jsx
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import SplineGlobe from './SplineGlobe';

(function() {
  try {
    const container = document.getElementById('splineGlobeContainer');
    if (container) {
      const root = ReactDOM.createRoot(container);
      root.render(React.createElement(SplineGlobe));
    }
  } catch (error) {
    console.error('[SplineGlobe] Mount error:', error);
  }
})();
