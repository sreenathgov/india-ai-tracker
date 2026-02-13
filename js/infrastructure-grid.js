/**
 * Infrastructure Grid Background
 * Subtle animated grid for institutional aesthetic
 * Converted from React Bits Squares component to vanilla JS
 */

class InfrastructureGrid {
  constructor(canvas, config) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.config = config;
    this.gridOffset = { x: 0, y: 0 };
    this.animationId = null;
    this.isTabVisible = true;
    this.numSquaresX = 0;
    this.numSquaresY = 0;

    this.init();
  }

  init() {
    this.resizeCanvas();
    this.setupEventListeners();
    this.startAnimation();
  }

  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.numSquaresX = Math.ceil(this.canvas.width / this.config.squareSize) + 1;
    this.numSquaresY = Math.ceil(this.canvas.height / this.config.squareSize) + 1;
  }

  drawGrid() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const startX = Math.floor(this.gridOffset.x / this.config.squareSize) * this.config.squareSize;
    const startY = Math.floor(this.gridOffset.y / this.config.squareSize) * this.config.squareSize;

    // Draw grid squares
    for (let x = startX; x < this.canvas.width + this.config.squareSize; x += this.config.squareSize) {
      for (let y = startY; y < this.canvas.height + this.config.squareSize; y += this.config.squareSize) {
        const squareX = x - (this.gridOffset.x % this.config.squareSize);
        const squareY = y - (this.gridOffset.y % this.config.squareSize);

        this.ctx.strokeStyle = this.config.borderColor;
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(squareX, squareY, this.config.squareSize, this.config.squareSize);
      }
    }
  }

  updateAnimation() {
    if (!this.isTabVisible) return;

    const speed = this.config.speed;

    switch (this.config.direction) {
      case 'right':
        this.gridOffset.x = (this.gridOffset.x - speed + this.config.squareSize) % this.config.squareSize;
        break;
      case 'left':
        this.gridOffset.x = (this.gridOffset.x + speed + this.config.squareSize) % this.config.squareSize;
        break;
      case 'up':
        this.gridOffset.y = (this.gridOffset.y + speed + this.config.squareSize) % this.config.squareSize;
        break;
      case 'down':
        this.gridOffset.y = (this.gridOffset.y - speed + this.config.squareSize) % this.config.squareSize;
        break;
      case 'diagonal':
        this.gridOffset.x = (this.gridOffset.x - speed + this.config.squareSize) % this.config.squareSize;
        this.gridOffset.y = (this.gridOffset.y - speed + this.config.squareSize) % this.config.squareSize;
        break;
      default:
        break;
    }

    this.drawGrid();
    this.animationId = requestAnimationFrame(() => this.updateAnimation());
  }

  startAnimation() {
    // Only animate on desktop/tablet (not mobile)
    if (window.innerWidth > 768 && !this.prefersReducedMotion()) {
      this.animationId = requestAnimationFrame(() => this.updateAnimation());
    }
  }

  stopAnimation() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  setupEventListeners() {
    // Resize handler
    const handleResize = () => {
      this.resizeCanvas();
      this.stopAnimation();
      this.startAnimation();
    };

    window.addEventListener('resize', handleResize);

    // Scroll-based fade: grid persists through Section 1 + velocity band + bento grid,
    // disappears where the newsletter orange strip begins
    if (this.config.enableFadeOnScroll) {
      const handleScroll = () => {
        const newsletterStrip = document.getElementById('newsletterHeroSection');
        if (newsletterStrip) {
          const stripRect = newsletterStrip.getBoundingClientRect();
          const viewportH = window.innerHeight;
          // Grid at full opacity until the orange strip top reaches viewport bottom
          // Fade completes when strip top reaches 60% of viewport height
          const fadeStart = viewportH;  // strip top at viewport bottom
          const fadeEnd = viewportH * 0.6; // strip top at 60% from top
          if (stripRect.top >= fadeStart) {
            this.canvas.style.opacity = 1;
          } else if (stripRect.top <= fadeEnd) {
            this.canvas.style.opacity = 0;
          } else {
            const progress = (fadeStart - stripRect.top) / (fadeStart - fadeEnd);
            this.canvas.style.opacity = 1 - progress;
          }
        } else {
          // Fallback to config-based scroll fade
          const scrollY = window.scrollY || window.pageYOffset;
          const fadeRange = this.config.fadeCompleteScroll - this.config.fadeStartScroll;
          const scrollProgress = Math.min(1, Math.max(0, (scrollY - this.config.fadeStartScroll) / fadeRange));
          this.canvas.style.opacity = 1 - scrollProgress;
        }
      };

      window.addEventListener('scroll', handleScroll, { passive: true });
    }

    // Pause when tab hidden (performance)
    const handleVisibilityChange = () => {
      this.isTabVisible = !document.hidden;
      if (this.isTabVisible && !this.animationId) {
        this.startAnimation();
      } else if (!this.isTabVisible) {
        this.stopAnimation();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
  }

  destroy() {
    this.stopAnimation();
  }
}

// Initialize when DOM ready
document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('infrastructure-grid');
  if (!canvas) {
    console.warn('Infrastructure grid canvas element not found');
    return;
  }

  const config = {
    direction: 'up',                          // Slow vertical upward drift (infrastructural)
    speed: 0.12,                              // Very slow, systematic movement
    borderColor: 'rgba(255, 255, 255, 0.08)', // Subtle white lines
    squareSize: 30,                           // Dense blueprint grid (40% reduction)
    enableFadeOnScroll: true,                 // Fade on scroll
    fadeStartScroll: 0,                       // Start fading immediately
    fadeCompleteScroll: 300                   // Fully transparent at 300px
  };

  const grid = new InfrastructureGrid(canvas, config);

  // Expose for debugging
  window.infrastructureGrid = grid;
});
