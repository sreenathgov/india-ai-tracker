/**
 * Magic Bento - Premium Card Component (Vanilla JS)
 * Converted from React Bits MagicBento component
 * Brand adapted for India AI Tracker
 */

// Brand colors - Orange glow theme
const BRAND_ORANGE_RGB = '219, 74, 43'; // #db4a2b
const BRAND_ORANGE_ALT_RGB = '180, 83, 9'; // #B45309
const BRAND_NAVY = '#0a2f52';
const BRAND_CREAM = '#F4EBD0';

// Animation constants
const DEFAULT_SPOTLIGHT_RADIUS = 400;
const MOBILE_BREAKPOINT = 768;

// Configuration
const BENTO_CONFIG = {
  enableSpotlight: true,  // ✅ Enabled for hover spotlight effect
  enableBorderGlow: false,
  clickEffect: true,
  spotlightRadius: 350,  // Tuned for card size
  spotlightOpacity: 0.15,  // Subtle glow intensity
  glowColor: BRAND_ORANGE_RGB,
  disableAnimations: false // Auto-detect mobile
};

/**
 * Calculate spotlight proximity and fade distance
 */
const calculateSpotlightValues = (radius) => ({
  proximity: radius * 0.5,
  fadeDistance: radius * 0.75
});

/**
 * Update card glow CSS properties based on mouse position
 */
const updateCardGlowProperties = (card, mouseX, mouseY, glow, radius) => {
  const rect = card.getBoundingClientRect();
  const relativeX = ((mouseX - rect.left) / rect.width) * 100;
  const relativeY = ((mouseY - rect.top) / rect.height) * 100;

  card.style.setProperty('--glow-x', `${relativeX}%`);
  card.style.setProperty('--glow-y', `${relativeY}%`);
  card.style.setProperty('--glow-intensity', glow.toString());
  card.style.setProperty('--glow-radius', `${radius}px`);
};

/**
 * Global Spotlight Manager
 * Creates a spotlight effect that follows the cursor
 */
class GlobalSpotlight {
  constructor(containerEl, config = {}) {
    this.container = containerEl;
    this.config = { ...BENTO_CONFIG, ...config };
    this.spotlightEl = null;
    this.isInsideSection = false;

    if (this.config.disableAnimations || this.isMobile()) {
      return;
    }

    this.init();
  }

  isMobile() {
    return window.innerWidth <= MOBILE_BREAKPOINT;
  }

  init() {
    // Create spotlight element
    this.spotlightEl = document.createElement('div');
    this.spotlightEl.className = 'global-spotlight';

    // Use config-driven opacity for subtle control
    const baseOpacity = this.config.spotlightOpacity || 0.15;

    this.spotlightEl.style.cssText = `
      position: fixed;
      width: 800px;
      height: 800px;
      border-radius: 50%;
      pointer-events: none;
      background: radial-gradient(circle,
        rgba(${this.config.glowColor}, ${baseOpacity}) 0%,
        rgba(${this.config.glowColor}, ${baseOpacity * 0.5}) 15%,
        rgba(${this.config.glowColor}, ${baseOpacity * 0.3}) 25%,
        rgba(${this.config.glowColor}, ${baseOpacity * 0.15}) 40%,
        rgba(${this.config.glowColor}, ${baseOpacity * 0.05}) 65%,
        transparent 70%
      );
      z-index: 200;
      opacity: 0;
      transform: translate(-50%, -50%);
      mix-blend-mode: screen;
      will-change: transform, opacity;
    `;
    document.body.appendChild(this.spotlightEl);

    // Bind event handlers
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseLeave = this.handleMouseLeave.bind(this);

    document.addEventListener('mousemove', this.handleMouseMove);
    document.addEventListener('mouseleave', this.handleMouseLeave);
  }

  handleMouseMove(e) {
    if (!this.spotlightEl || !this.container) return;

    const section = this.container.closest('.bento-section');
    const rect = section?.getBoundingClientRect();
    const mouseInside = rect &&
      e.clientX >= rect.left &&
      e.clientX <= rect.right &&
      e.clientY >= rect.top &&
      e.clientY <= rect.bottom;

    this.isInsideSection = mouseInside || false;
    const cards = this.container.querySelectorAll('.magic-bento-card');

    if (!mouseInside) {
      gsap.to(this.spotlightEl, {
        opacity: 0,
        duration: 0.3,
        ease: 'power2.out'
      });
      cards.forEach(card => {
        card.style.setProperty('--glow-intensity', '0');
      });
      return;
    }

    const { proximity, fadeDistance } = calculateSpotlightValues(this.config.spotlightRadius);
    let minDistance = Infinity;

    cards.forEach(card => {
      const cardRect = card.getBoundingClientRect();
      const centerX = cardRect.left + cardRect.width / 2;
      const centerY = cardRect.top + cardRect.height / 2;
      const distance = Math.hypot(e.clientX - centerX, e.clientY - centerY) -
                      Math.max(cardRect.width, cardRect.height) / 2;
      const effectiveDistance = Math.max(0, distance);

      minDistance = Math.min(minDistance, effectiveDistance);

      let glowIntensity = 0;
      if (effectiveDistance <= proximity) {
        glowIntensity = 1;
      } else if (effectiveDistance <= fadeDistance) {
        glowIntensity = (fadeDistance - effectiveDistance) / (fadeDistance - proximity);
      }

      updateCardGlowProperties(card, e.clientX, e.clientY, glowIntensity, this.config.spotlightRadius);
    });

    gsap.to(this.spotlightEl, {
      left: e.clientX,
      top: e.clientY,
      duration: 0.1,
      ease: 'power2.out'
    });

    const targetOpacity = minDistance <= proximity ? 0.8 :
                         minDistance <= fadeDistance ? ((fadeDistance - minDistance) / (fadeDistance - proximity)) * 0.8 :
                         0;

    gsap.to(this.spotlightEl, {
      opacity: targetOpacity,
      duration: targetOpacity > 0 ? 0.2 : 0.5,
      ease: 'power2.out'
    });
  }

  handleMouseLeave() {
    this.isInsideSection = false;
    this.container?.querySelectorAll('.magic-bento-card').forEach(card => {
      card.style.setProperty('--glow-intensity', '0');
    });
    if (this.spotlightEl) {
      gsap.to(this.spotlightEl, {
        opacity: 0,
        duration: 0.3,
        ease: 'power2.out'
      });
    }
  }

  destroy() {
    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('mouseleave', this.handleMouseLeave);
    this.spotlightEl?.parentNode?.removeChild(this.spotlightEl);
  }
}

/**
 * Enhanced Card with Click Ripple Effect
 */
class BentoCard {
  constructor(cardEl, config = {}) {
    this.card = cardEl;
    this.config = { ...BENTO_CONFIG, ...config };

    if (this.config.disableAnimations || this.isMobile()) {
      return;
    }

    this.init();
  }

  isMobile() {
    return window.innerWidth <= MOBILE_BREAKPOINT;
  }

  init() {
    if (this.config.clickEffect) {
      this.handleClick = this.handleClick.bind(this);
      this.card.addEventListener('click', this.handleClick);
    }
  }

  handleClick(e) {
    const rect = this.card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const maxDistance = Math.max(
      Math.hypot(x, y),
      Math.hypot(x - rect.width, y),
      Math.hypot(x, y - rect.height),
      Math.hypot(x - rect.width, y - rect.height)
    );

    const ripple = document.createElement('div');
    ripple.style.cssText = `
      position: absolute;
      width: ${maxDistance * 2}px;
      height: ${maxDistance * 2}px;
      border-radius: 50%;
      background: radial-gradient(circle,
        rgba(${this.config.glowColor}, 0.4) 0%,
        rgba(${this.config.glowColor}, 0.2) 30%,
        transparent 70%
      );
      left: ${x - maxDistance}px;
      top: ${y - maxDistance}px;
      pointer-events: none;
      z-index: 1000;
    `;

    this.card.appendChild(ripple);

    gsap.fromTo(
      ripple,
      { scale: 0, opacity: 1 },
      {
        scale: 1,
        opacity: 0,
        duration: 0.8,
        ease: 'power2.out',
        onComplete: () => ripple.remove()
      }
    );
  }

  destroy() {
    if (this.handleClick) {
      this.card.removeEventListener('click', this.handleClick);
    }
  }
}

/**
 * Initialize Magic Bento on a container
 * @param {HTMLElement} containerEl - Container element with .bento-section class
 * @param {Object} config - Configuration options
 * @returns {Object} - Manager object with destroy method
 */
function initMagicBento(containerEl, config = {}) {
  if (!containerEl) {
    console.warn('MagicBento: Container element not found');
    return null;
  }

  const mergedConfig = { ...BENTO_CONFIG, ...config };
  const isMobile = window.innerWidth <= MOBILE_BREAKPOINT;

  // Disable animations on mobile for performance
  if (isMobile) {
    mergedConfig.disableAnimations = true;
  }

  // Initialize spotlight
  const spotlight = mergedConfig.enableSpotlight && !mergedConfig.disableAnimations
    ? new GlobalSpotlight(containerEl, mergedConfig)
    : null;

  // Initialize cards
  const cards = [];
  const cardElements = containerEl.querySelectorAll('.magic-bento-card');

  cardElements.forEach(cardEl => {
    // Set CSS variables for glow color
    cardEl.style.setProperty('--glow-color', mergedConfig.glowColor);
    cardEl.style.setProperty('--glow-intensity', '0');

    // Initialize card with click effect
    const card = new BentoCard(cardEl, mergedConfig);
    cards.push(card);
  });

  // Return manager with cleanup method
  return {
    destroy: () => {
      spotlight?.destroy();
      cards.forEach(card => card.destroy());
    }
  };
}

// Export for use in app-final.js
window.initMagicBento = initMagicBento;
