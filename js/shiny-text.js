/**
 * ShinyText Component
 * Adapted from ReactBits ShinyText component (React + Framer Motion → vanilla JS)
 * Creates animated gradient text effect with moving shine
 */

class ShinyText {
  constructor(element, config = {}) {
    this.element = element;
    // Fall back to whatever the markup already says, so the heading can be
    // changed in HTML alone. Hardcoding it here silently overwrites the page.
    this.text = config.text || (element ? element.textContent.trim() : '');
    this.speed = config.speed || 4; // seconds
    this.color = config.color || 'rgba(244, 235, 208, 1)';
    this.shineColor = config.shineColor || '#ffffff';
    this.spread = config.spread || 120; // gradient angle in degrees
    this.direction = config.direction || 'left'; // 'left' or 'right'
    this.disabled = config.disabled || false;
    this.yoyo = config.yoyo || false;
    this.pauseOnHover = config.pauseOnHover || false;
    this.delay = config.delay || 0; // seconds

    this.progress = 0;
    this.elapsed = 0;
    this.lastTime = null;
    this.animationId = null;
    this.isPaused = false;
    this.isTabVisible = true;

    this.animationDuration = this.speed * 1000; // convert to milliseconds
    this.delayDuration = this.delay * 1000;
    this.directionFactor = this.direction === 'left' ? 1 : -1;

    if (this.prefersReducedMotion()) {
      this.disabled = true;
    }

    this.init();
  }

  prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  init() {
    // Set text content
    this.element.textContent = this.text;

    // Apply gradient styles
    this.updateGradientStyle();

    // Bind events
    this.bindEvents();

    // Start animation
    if (!this.disabled) {
      this.startAnimation();
    }
  }

  updateGradientStyle() {
    const gradient = `linear-gradient(${this.spread}deg, ${this.color} 0%, ${this.color} 35%, ${this.shineColor} 50%, ${this.color} 65%, ${this.color} 100%)`;

    this.element.style.backgroundImage = gradient;
    this.element.style.backgroundSize = '200% auto';
    this.element.style.webkitBackgroundClip = 'text';
    this.element.style.backgroundClip = 'text';
    this.element.style.webkitTextFillColor = 'transparent';
  }

  /**
   * Transform progress (0-100) to background position
   * progress 0 → 150% (shine off to the right)
   * progress 100 → -50% (shine off to the left)
   */
  getBackgroundPosition(progress) {
    const position = 150 - (progress * 2);
    return `${position}% center`;
  }

  /**
   * Update animation frame - mirrors React source useAnimationFrame callback
   */
  animate(time) {
    if (this.disabled || this.isPaused || !this.isTabVisible) {
      this.lastTime = null;
      return;
    }

    if (this.lastTime === null) {
      this.lastTime = time;
      this.animationId = requestAnimationFrame((t) => this.animate(t));
      return;
    }

    const deltaTime = time - this.lastTime;
    this.lastTime = time;
    this.elapsed += deltaTime;

    if (this.yoyo) {
      // Yoyo mode: forward → delay → reverse → delay → repeat
      const cycleDuration = this.animationDuration + this.delayDuration;
      const fullCycle = cycleDuration * 2;
      const cycleTime = this.elapsed % fullCycle;

      if (cycleTime < this.animationDuration) {
        // Forward animation: 0 → 100
        const p = (cycleTime / this.animationDuration) * 100;
        this.progress = this.directionFactor === 1 ? p : 100 - p;
      } else if (cycleTime < cycleDuration) {
        // Delay at end
        this.progress = this.directionFactor === 1 ? 100 : 0;
      } else if (cycleTime < cycleDuration + this.animationDuration) {
        // Reverse animation: 100 → 0
        const reverseTime = cycleTime - cycleDuration;
        const p = 100 - (reverseTime / this.animationDuration) * 100;
        this.progress = this.directionFactor === 1 ? p : 100 - p;
      } else {
        // Delay at start
        this.progress = this.directionFactor === 1 ? 0 : 100;
      }
    } else {
      // Normal mode: animation → delay → repeat
      const cycleDuration = this.animationDuration + this.delayDuration;
      const cycleTime = this.elapsed % cycleDuration;

      if (cycleTime < this.animationDuration) {
        // Animation phase: 0 → 100
        const p = (cycleTime / this.animationDuration) * 100;
        this.progress = this.directionFactor === 1 ? p : 100 - p;
      } else {
        // Delay phase - hold at end (shine off-screen)
        this.progress = this.directionFactor === 1 ? 100 : 0;
      }
    }

    // Apply background position
    this.element.style.backgroundPosition = this.getBackgroundPosition(this.progress);

    this.animationId = requestAnimationFrame((t) => this.animate(t));
  }

  bindEvents() {
    // Pause on hover if enabled
    if (this.pauseOnHover) {
      this.element.addEventListener('mouseenter', () => {
        this.isPaused = true;
      });

      this.element.addEventListener('mouseleave', () => {
        this.isPaused = false;
      });
    }

    // Pause when tab hidden (performance optimization)
    this.handleVisibility = () => {
      this.isTabVisible = !document.hidden;
      if (this.isTabVisible && !this.animationId && !this.disabled) {
        this.lastTime = null;
        this.startAnimation();
      } else if (!this.isTabVisible) {
        this.stopAnimation();
      }
    };
    document.addEventListener('visibilitychange', this.handleVisibility);
  }

  startAnimation() {
    if (this.animationId) return; // Already running
    this.lastTime = null;
    this.animationId = requestAnimationFrame((t) => this.animate(t));
  }

  stopAnimation() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  destroy() {
    this.stopAnimation();
    document.removeEventListener('visibilitychange', this.handleVisibility);
  }
}

// Initialize when DOM ready
document.addEventListener('DOMContentLoaded', () => {
  const element = document.getElementById('shinyText');
  if (element) {
    const shinyText = new ShinyText(element, {
      speed: 4,
      // Page themes can recolour the moving shine without changing its animation.
      color: 'var(--shiny-text-color, rgba(244, 235, 208, 1))',
      shineColor: 'var(--shiny-text-highlight, #ffffff)',
      spread: 120,
      direction: 'left',
      yoyo: false,
      pauseOnHover: false,
      delay: 0
    });
    window.shinyText = shinyText;
  }

  // Platform section title — same effect, preserves existing text content
  const platformTitle = document.getElementById('platformTitle');
  if (platformTitle) {
    const platformShiny = new ShinyText(platformTitle, {
      text: platformTitle.textContent.trim(),
      speed: 5,
      color: 'rgba(244, 235, 208, 1)',
      shineColor: '#ffffff',
      spread: 120,
      direction: 'left',
      yoyo: false,
      pauseOnHover: false,
      delay: 0
    });
    window.platformShiny = platformShiny;
  }
});
