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
  'Trade has become fragmented and evidence-intensive. ' +
  'The next era will be defined by a company\'s ability to maintain a defensible, ' +
  'continuously updated evidence position across customs, insurance, finance, ' +
  'regulation, and supply-chain risk. ' +
  'Kanan is building the intelligence layer for that problem.';

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
