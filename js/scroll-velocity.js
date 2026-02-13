/**
 * Scroll Velocity Band
 * Adapted from ReactBits ScrollVelocity component (React + Framer Motion → vanilla JS)
 * Creates parallax text rows that speed up based on scroll velocity
 */

class VelocityRow {
  constructor(containerEl, config) {
    this.container = containerEl;
    this.text = config.text;
    this.baseVelocity = config.baseVelocity || 70;
    this.numCopies = config.numCopies || 6;
    this.damping = config.damping || 0.05;
    this.velocityMapping = config.velocityMapping || { input: [0, 1000], output: [0, 5] };

    this.baseX = 0;
    this.copyWidth = 0;
    this.directionFactor = 1;
    this.smoothVelocity = 0;
    this.lastScrollY = window.scrollY || window.pageYOffset;
    this.lastTime = performance.now();

    this.parallaxEl = null;
    this.scrollerEl = null;

    this.init();
  }

  init() {
    // Create parallax container
    this.parallaxEl = document.createElement('div');
    this.parallaxEl.className = 'velocity-parallax';

    // Create scroller (the moving row)
    this.scrollerEl = document.createElement('div');
    this.scrollerEl.className = 'velocity-scroller';

    // Create text copies for seamless loop
    for (let i = 0; i < this.numCopies; i++) {
      const span = document.createElement('span');
      span.textContent = this.text + '\u00A0\u00A0\u00A0'; // nbsp spacing
      this.scrollerEl.appendChild(span);
    }

    this.parallaxEl.appendChild(this.scrollerEl);
    this.container.appendChild(this.parallaxEl);

    // Measure single copy width after DOM render
    requestAnimationFrame(() => {
      const firstSpan = this.scrollerEl.querySelector('span');
      if (firstSpan) {
        this.copyWidth = firstSpan.offsetWidth;
      }
    });
  }

  /**
   * Map a value from one range to another (replaces Framer Motion useTransform)
   */
  mapRange(value, inMin, inMax, outMin, outMax) {
    const mapped = ((value - inMin) / (inMax - inMin)) * (outMax - outMin) + outMin;
    return mapped; // No clamping, matches React source { clamp: false }
  }

  /**
   * Wrap value within a range (replaces Framer Motion wrap utility)
   */
  wrap(min, max, v) {
    const range = max - min;
    const mod = (((v - min) % range) + range) % range;
    return mod + min;
  }

  /**
   * Linear interpolation (replaces Framer Motion useSpring)
   */
  lerp(current, target, factor) {
    return current + (target - current) * factor;
  }

  /**
   * Update animation frame — mirrors React source useAnimationFrame callback
   */
  update(delta, scrollDelta) {
    if (this.copyWidth === 0) return;

    // Smooth the scroll velocity (replaces useSpring)
    this.smoothVelocity = this.lerp(this.smoothVelocity, scrollDelta, this.damping);

    // Map velocity to factor (replaces useTransform with velocityMapping)
    const velocityFactor = this.mapRange(
      Math.abs(this.smoothVelocity),
      this.velocityMapping.input[0],
      this.velocityMapping.input[1],
      this.velocityMapping.output[0],
      this.velocityMapping.output[1]
    );

    // Base movement per frame
    let moveBy = this.directionFactor * this.baseVelocity * (delta / 1000);

    // Flip direction based on scroll direction (matches React source directionFactor logic)
    if (this.smoothVelocity < 0) {
      this.directionFactor = -1;
    } else if (this.smoothVelocity > 0) {
      this.directionFactor = 1;
    }

    // Add velocity-amplified movement
    moveBy += this.directionFactor * moveBy * velocityFactor;

    // Accumulate position
    this.baseX += moveBy;

    // Wrap position to prevent infinite growth (replaces useTransform wrap)
    const wrappedX = this.wrap(-this.copyWidth, 0, this.baseX);

    // Apply transform (replaces motion.div style={{ x }})
    this.scrollerEl.style.transform = `translateX(${wrappedX}px)`;
  }

  destroy() {
    if (this.parallaxEl && this.parallaxEl.parentNode) {
      this.parallaxEl.parentNode.removeChild(this.parallaxEl);
    }
  }
}

class ScrollVelocityBand {
  constructor(containerEl, config = {}) {
    this.container = containerEl;
    this.config = {
      texts: config.texts || ['STRATEGIC INSIGHTS', 'POWERED BY KANAN LABS'],
      velocity: config.velocity || 70,
      numCopies: config.numCopies || 6,
      damping: config.damping || 0.05,
      velocityMapping: config.velocityMapping || { input: [0, 1000], output: [0, 5] },
      ...config
    };

    this.rows = [];
    this.animationId = null;
    this.lastScrollY = window.scrollY || window.pageYOffset;
    this.lastTime = performance.now();
    this.isTabVisible = true;

    if (this.prefersReducedMotion()) return;

    this.init();
  }

  prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  init() {
    // Create one VelocityRow per text, alternating direction (matches React source)
    this.config.texts.forEach((text, index) => {
      const baseVelocity = index % 2 !== 0
        ? -this.config.velocity  // Even index: positive (left), Odd: negative (right)
        : this.config.velocity;

      const row = new VelocityRow(this.container, {
        text: text,
        baseVelocity: baseVelocity,
        numCopies: this.config.numCopies,
        damping: this.config.damping,
        velocityMapping: this.config.velocityMapping
      });

      this.rows.push(row);
    });

    // Start animation loop
    this.bindEvents();
    this.startAnimation();
  }

  bindEvents() {
    // Track scroll position for velocity calculation
    this.handleScroll = () => {
      // Scroll tracking is done in the animation frame
    };
    window.addEventListener('scroll', this.handleScroll, { passive: true });

    // Pause when tab hidden (performance)
    this.handleVisibility = () => {
      this.isTabVisible = !document.hidden;
      if (this.isTabVisible && !this.animationId) {
        this.lastTime = performance.now();
        this.lastScrollY = window.scrollY || window.pageYOffset;
        this.startAnimation();
      } else if (!this.isTabVisible) {
        this.stopAnimation();
      }
    };
    document.addEventListener('visibilitychange', this.handleVisibility);
  }

  startAnimation() {
    const animate = (now) => {
      if (!this.isTabVisible) return;

      const delta = Math.min(now - this.lastTime, 50); // Cap delta to prevent jumps
      const currentScrollY = window.scrollY || window.pageYOffset;
      const scrollDelta = currentScrollY - this.lastScrollY;

      this.rows.forEach(row => row.update(delta, scrollDelta));

      this.lastTime = now;
      this.lastScrollY = currentScrollY;
      this.animationId = requestAnimationFrame(animate);
    };

    this.animationId = requestAnimationFrame(animate);
  }

  stopAnimation() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  destroy() {
    this.stopAnimation();
    window.removeEventListener('scroll', this.handleScroll);
    document.removeEventListener('visibilitychange', this.handleVisibility);
    this.rows.forEach(row => row.destroy());
    this.rows = [];
  }
}

// Initialize when DOM ready
document.addEventListener('DOMContentLoaded', () => {
  const bandEl = document.getElementById('scrollVelocityBand');
  if (!bandEl) return;

  const band = new ScrollVelocityBand(bandEl, {
    texts: ['STRATEGIC INSIGHTS', 'POWERED BY KANAN LABS'],
    velocity: 70,
    numCopies: 6,
    damping: 0.05,
    velocityMapping: { input: [0, 1000], output: [0, 5] }
  });

  // Expose for debugging
  window.scrollVelocityBand = band;
});
