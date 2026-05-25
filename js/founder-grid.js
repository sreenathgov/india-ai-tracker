/**
 * Founder Grid Background
 * Scoped canvas grid for the navy doctrine container in the founder section.
 * Adapted from infrastructure-grid.js — sizes to its parent (not viewport),
 * uses low-alpha cream lines, container-bounded via ResizeObserver.
 */

class FounderGrid {
  constructor(canvas, config) {
    this.canvas = canvas;
    this.parent = canvas.parentElement;
    this.ctx = canvas.getContext('2d', { alpha: true });
    this.config = config;
    this.dpr = window.devicePixelRatio || 1;
    this.width = 0;
    this.height = 0;
    this.gridOffset = { x: 0, y: 0 };
    this.animationId = null;
    this.isTabVisible = true;
    this.resizeObserver = null;

    this.init();
  }

  init() {
    this.resizeCanvas();
    this.setupEventListeners();

    if (this.prefersReducedMotion()) {
      // Render a single static frame
      this.drawGrid();
    } else {
      this.startAnimation();
    }
  }

  resizeCanvas() {
    if (!this.parent) return;
    const rect = this.parent.getBoundingClientRect();
    this.dpr = window.devicePixelRatio || 1;
    this.width = rect.width;
    this.height = rect.height;
    this.canvas.width = Math.max(1, Math.floor(this.width * this.dpr));
    this.canvas.height = Math.max(1, Math.floor(this.height * this.dpr));
    this.canvas.style.width = this.width + 'px';
    this.canvas.style.height = this.height + 'px';
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  drawGrid() {
    const { width, height, ctx, config } = this;
    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = config.borderColor;
    ctx.lineWidth = 1;

    const s = config.squareSize;
    const offsetX = this.gridOffset.x % s;
    const offsetY = this.gridOffset.y % s;

    for (let x = -s + offsetX; x < width + s; x += s) {
      for (let y = -s + offsetY; y < height + s; y += s) {
        // 0.5 alignment keeps lines crisp on integer pixel grid
        ctx.strokeRect(Math.floor(x) + 0.5, Math.floor(y) + 0.5, s, s);
      }
    }
  }

  updateAnimation() {
    if (!this.isTabVisible) return;
    const speed = this.config.speed;
    const s = this.config.squareSize;

    switch (this.config.direction) {
      case 'up':
        this.gridOffset.y = (this.gridOffset.y + speed + s) % s;
        break;
      case 'down':
        this.gridOffset.y = (this.gridOffset.y - speed + s) % s;
        break;
      case 'left':
        this.gridOffset.x = (this.gridOffset.x + speed + s) % s;
        break;
      case 'right':
        this.gridOffset.x = (this.gridOffset.x - speed + s) % s;
        break;
      default:
        break;
    }

    this.drawGrid();
    this.animationId = requestAnimationFrame(() => this.updateAnimation());
  }

  startAnimation() {
    if (!this.animationId) {
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
    // Resize via ResizeObserver on the parent (more accurate than window resize)
    if (typeof ResizeObserver !== 'undefined' && this.parent) {
      this.resizeObserver = new ResizeObserver(() => {
        this.resizeCanvas();
        if (this.prefersReducedMotion()) {
          this.drawGrid();
        }
      });
      this.resizeObserver.observe(this.parent);
    } else {
      window.addEventListener('resize', () => this.resizeCanvas());
    }

    // Pause when tab hidden (performance)
    document.addEventListener('visibilitychange', () => {
      this.isTabVisible = !document.hidden;
      if (this.isTabVisible && !this.animationId && !this.prefersReducedMotion()) {
        this.startAnimation();
      } else if (!this.isTabVisible) {
        this.stopAnimation();
      }
    });
  }

  destroy() {
    this.stopAnimation();
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }
}

// Initialize when DOM ready
document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('founder-grid');
  if (canvas) {
    const config = {
      direction: 'up',                                // Match page-wide grid drift
      speed: 0.10,                                    // Slightly slower than hero grid
      borderColor: 'rgba(255, 255, 255, 0.15)',        // White, subtle on orange
      squareSize: 28,                                 // Slightly tighter than hero grid
    };

    const grid = new FounderGrid(canvas, config);

    // Expose for debugging
    window.founderGrid = grid;
  }
});
