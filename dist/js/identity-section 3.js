/**
 * IdentitySection -- Section 4
 * Renders identity content with contained grid background
 * Uses GSAP ScrollTrigger for entrance animations
 * Grid uses InfrastructureGrid as placeholder until RippleGrid code is provided
 */

class IdentitySection {
  constructor() {
    this.sectionEl = document.getElementById('identitySection');
    this.canvasEl = null;
    this.gridInstance = null;
    this._resizeHandler = null;
    this._resizeObserver = null;
  }

  init() {
    if (!this.sectionEl) return;

    this.renderContent();
    this.initGridBackground();
    this.initEntranceAnimations();
  }

  renderContent() {
    const container = this.sectionEl.querySelector('.identity-container');
    if (!container) return;

    // --- LEFT COLUMN ---
    const textCol = document.createElement('div');
    textCol.className = 'identity-text';

    // Statement (visual anchor)
    const statement = document.createElement('p');
    statement.className = 'identity-statement identity-animate';
    statement.innerHTML = 'Policy is not an external constraint.<br>It is a <em>design variable</em>.';

    // Name + Title + Credentials
    const metaBlock = document.createElement('div');
    metaBlock.className = 'identity-meta identity-animate';

    const name = document.createElement('h3');
    name.className = 'identity-name';
    name.textContent = 'Sreenath Govindarajan';

    const title = document.createElement('p');
    title.className = 'identity-title';
    title.textContent = 'AI Policy Strategist';

    const credList = document.createElement('ul');
    credList.className = 'identity-credentials';

    const credentials = [
      'Multi-jurisdictionally trained (5+ jurisdictions)',
      'Advisory across product, policy, and institutional alignment',
      'India-focused, globally literate'
    ];

    credentials.forEach(text => {
      const li = document.createElement('li');
      li.textContent = text;
      credList.appendChild(li);
    });

    metaBlock.appendChild(name);
    metaBlock.appendChild(title);
    metaBlock.appendChild(credList);

    textCol.appendChild(statement);
    textCol.appendChild(metaBlock);

    // --- RIGHT COLUMN ---
    const portraitCol = document.createElement('div');
    portraitCol.className = 'identity-portrait identity-animate';

    const img = document.createElement('img');
    img.className = 'identity-portrait__image';
    img.src = 'added-assets/SG-TRANSPARENT.png';
    img.alt = 'Sreenath Govindarajan';
    img.loading = 'lazy';
    img.draggable = false;

    portraitCol.appendChild(img);

    container.appendChild(textCol);
    container.appendChild(portraitCol);
  }

  /**
   * Initialize background grid contained to this section.
   * Uses InfrastructureGrid as placeholder (same pattern as AdvisorySection.initGrid).
   * Will be replaced with RippleGrid once code is provided.
   */
  initGridBackground() {
    this.canvasEl = document.getElementById('identity-grid');
    if (!this.canvasEl || typeof InfrastructureGrid === 'undefined') return;

    // Check for mobile -- skip grid on small screens
    if (window.innerWidth <= 768) return;

    const config = {
      direction: 'diagonal',
      speed: 0.06,
      borderColor: 'rgba(10, 47, 82, 0.03)',
      squareSize: 40,
      enableFadeOnScroll: false
    };

    this.gridInstance = new InfrastructureGrid(this.canvasEl, config);

    // Size canvas to section, not viewport
    const resizeToSection = () => {
      this.canvasEl.width = this.sectionEl.offsetWidth;
      this.canvasEl.height = this.sectionEl.offsetHeight;
      if (this.gridInstance) {
        this.gridInstance.numSquaresX = Math.ceil(this.canvasEl.width / config.squareSize) + 1;
        this.gridInstance.numSquaresY = Math.ceil(this.canvasEl.height / config.squareSize) + 1;
      }
    };

    resizeToSection();

    this._resizeHandler = resizeToSection;
    window.addEventListener('resize', this._resizeHandler);

    if (typeof ResizeObserver !== 'undefined') {
      this._resizeObserver = new ResizeObserver(resizeToSection);
      this._resizeObserver.observe(this.sectionEl);
    }
  }

  /**
   * Replace placeholder grid with actual RippleGrid when code is provided.
   * @param {Function} RippleGridClass - The RippleGrid constructor
   * @param {Object} config - Configuration for the ripple grid
   */
  replaceWithRippleGrid(RippleGridClass, config) {
    if (this.gridInstance && this.gridInstance.destroy) {
      this.gridInstance.destroy();
      this.gridInstance = null;
    }
    if (this.canvasEl && RippleGridClass) {
      this.gridInstance = new RippleGridClass(this.canvasEl, config);
    }
  }

  initEntranceAnimations() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
      // Fallback: just show elements immediately
      this.sectionEl.querySelectorAll('.identity-animate').forEach(el => {
        el.style.opacity = '1';
        el.style.transform = 'none';
      });
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    const elements = this.sectionEl.querySelectorAll('.identity-animate');

    gsap.fromTo(elements,
      { opacity: 0, y: 30 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: this.sectionEl,
          start: 'top 75%',
          toggleActions: 'play none none none'
        }
      }
    );
  }

  destroy() {
    if (this.gridInstance && this.gridInstance.destroy) {
      this.gridInstance.destroy();
    }
    if (this._resizeHandler) {
      window.removeEventListener('resize', this._resizeHandler);
    }
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
    }
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  const identity = new IdentitySection();
  identity.init();
  window.identitySection = identity;
});
