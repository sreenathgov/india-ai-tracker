/**
 * Scroll Reveal Manifesto — React Island Entry Point
 * Mounts ScrollReveal (GSAP) into #scrollRevealContainer
 * IIFE island pattern — mounts a standalone React component into a DOM container
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import ScrollReveal from './ScrollReveal';
import './ScrollReveal.css';

const MANIFESTO =
  'Regulatory complexity shapes markets, supply chains, and competitive outcomes. ' +
  'Sector Watch converts policy change into clear operational guidance, ' +
  'helping companies reposition strategically when markets evolve.';

(function() {
  try {
    const container = document.getElementById('scrollRevealContainer');
    if (container) {
      ReactDOM.createRoot(container).render(
        React.createElement(
          ScrollReveal,
          {
            baseOpacity: 0.1,
            enableBlur: true,
            baseRotation: 3,
            blurStrength: 4,
          },
          MANIFESTO
        )
      );
    }
  } catch (error) {
    console.error('[ScrollReveal] Mount error:', error);
  }
})();
