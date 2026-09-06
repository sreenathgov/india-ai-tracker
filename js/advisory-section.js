/**
 * Advisory Section — Section 3 Orchestrator
 * Fetches data from data/advisory_services.json
 * Renders two-column hero (text + CardSwap animated stack) and services grid
 * CardSwap converted from ReactBits React component to vanilla JS
 * Uses GSAP for 3D card swap animations with elastic easing
 */

/* ============================================
   CardSwap — Vanilla JS conversion of ReactBits CardSwap
   Original: React + Framer Motion → Vanilla JS + GSAP
   ============================================ */

class CardSwap {
  constructor(containerEl, cards, options = {}) {
    this.container = containerEl;
    this.cards = cards; // Array of card data objects
    this.cardEls = [];  // DOM elements for each card

    // Config with defaults matching ReactBits
    this.width = options.width || 480;
    this.height = options.height || 340;
    this.cardDistance = options.cardDistance || 55;
    this.verticalDistance = options.verticalDistance || 60;
    this.delay = options.delay || 5000;
    this.pauseOnHover = options.pauseOnHover !== false;
    this.skewAmount = options.skewAmount || 6;
    this.easing = options.easing || 'elastic';
    this.dropDistance = options.dropDistance ?? 250;

    // State
    this.order = [];
    this.timeline = null;
    this.intervalId = null;

    // Easing config
    this.config = this.easing === 'elastic'
      ? {
          ease: 'elastic.out(0.6, 0.9)',
          durDrop: 1.2,
          durMove: 1.2,
          durReturn: 1.2,
          promoteOverlap: 0.9,
          returnDelay: 0.05
        }
      : {
          ease: 'power1.inOut',
          durDrop: 0.5,
          durMove: 0.5,
          durReturn: 0.5,
          promoteOverlap: 0.45,
          returnDelay: 0.2
        };

    this.init();
  }

  /**
   * Calculate stacking slot position for card at index i
   */
  makeSlot(i) {
    const total = this.cards.length;
    return {
      x: i * this.cardDistance,
      y: i * this.verticalDistance,       // Positive: back cards stack DOWNWARD (away from heading)
      z: -i * this.cardDistance * 1.5,
      zIndex: total - i
    };
  }

  /**
   * Immediately place element at slot position (no animation)
   */
  placeNow(el, slot) {
    gsap.set(el, {
      x: slot.x,
      y: slot.y,
      z: slot.z,
      xPercent: -50,
      yPercent: -50,
      skewY: this.skewAmount,
      transformOrigin: 'center center',
      zIndex: slot.zIndex,
      force3D: true
    });
  }

  init() {
    if (typeof gsap === 'undefined') {
      console.warn('CardSwap: GSAP required');
      return;
    }

    // Set container dimensions
    this.container.style.width = this.width + 'px';
    this.container.style.height = this.height + 'px';

    // Build card DOM elements
    this.buildCards();

    // Initialize order: [0, 1, 2, ...]
    this.order = Array.from({ length: this.cards.length }, (_, i) => i);

    // Place all cards at initial positions
    this.cardEls.forEach((el, i) => {
      this.placeNow(el, this.makeSlot(i));
    });

    // Run first swap + start auto interval
    this.swap();
    this.intervalId = window.setInterval(() => this.swap(), this.delay);

    // Pause on hover
    if (this.pauseOnHover) {
      this.container.addEventListener('mouseenter', () => {
        if (this.timeline) this.timeline.pause();
        clearInterval(this.intervalId);
      });
      this.container.addEventListener('mouseleave', () => {
        if (this.timeline) this.timeline.play();
        this.intervalId = window.setInterval(() => this.swap(), this.delay);
      });
    }

    // Click to swap; published download links keep their native behavior.
    this.container.addEventListener('click', (e) => {
      if (e.target.closest('.card-swap-card__download')) return;
      this.swap();
    });
  }

  buildCards() {
    const downloadIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>`;

    this.cards.forEach((card, i) => {
      const el = document.createElement('div');
      el.className = `card-swap-card card-swap-card--${card.colorTheme || 'navy'}`;
      el.style.width = this.width + 'px';
      el.style.height = this.height + 'px';
      el.setAttribute('data-card-index', i);

      el.innerHTML = `
        <div>
          <div class="card-swap-card__title">${this.escapeHTML(card.title)}</div>
          <div class="card-swap-card__subline">${this.escapeHTML(card.descriptor)}</div>
        </div>
        <div class="card-swap-card__footer">
          <span class="card-swap-card__meta">${this.escapeHTML(card.meta)}</span>
          ${card.pdfUrl ? `<a href="${this.escapeHTML(card.pdfUrl)}" download="${this.escapeHTML(card.pdfUrl.split('/').pop())}" rel="noopener" class="card-swap-card__download">
            ${downloadIcon} Download PDF
          </a>` : ''}
        </div>
      `;

      this.container.appendChild(el);
      this.cardEls.push(el);
    });
  }

  /**
   * Animated swap: front card drops out, others shift forward, front returns to back
   * Order updates IMMEDIATELY so rapid clicks always target the correct front card
   */
  swap() {
    if (this.order.length < 2) return;

    // Kill any running animation and snap all cards to their current target positions
    if (this.timeline) {
      this.timeline.progress(1, false);
      this.timeline.kill();
    }

    const [front, ...rest] = this.order;
    const elFront = this.cardEls[front];
    const total = this.cardEls.length;

    // Update order IMMEDIATELY so next click targets the correct card
    this.order = [...rest, front];

    const tl = gsap.timeline();
    this.timeline = tl;

    // 1. Drop the front card down and out (further below the downward stack)
    tl.to(elFront, {
      y: '+=' + this.dropDistance,
      duration: this.config.durDrop,
      ease: this.config.ease
    });

    // 2. Promote remaining cards forward (overlapping with drop)
    tl.addLabel('promote', `-=${this.config.durDrop * this.config.promoteOverlap}`);
    rest.forEach((idx, i) => {
      const el = this.cardEls[idx];
      const slot = this.makeSlot(i);
      tl.set(el, { zIndex: slot.zIndex }, 'promote');
      tl.to(
        el,
        {
          x: slot.x,
          y: slot.y,
          z: slot.z,
          duration: this.config.durMove,
          ease: this.config.ease
        },
        `promote+=${i * 0.15}`
      );
    });

    // 3. Return front card to back position
    const backSlot = this.makeSlot(total - 1);
    tl.addLabel('return', `promote+=${this.config.durMove * this.config.returnDelay}`);
    tl.call(
      () => { gsap.set(elFront, { zIndex: backSlot.zIndex }); },
      undefined,
      'return'
    );
    tl.to(
      elFront,
      {
        x: backSlot.x,
        y: backSlot.y,
        z: backSlot.z,
        duration: this.config.durReturn,
        ease: this.config.ease
      },
      'return'
    );
  }

  escapeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  destroy() {
    if (this.intervalId) clearInterval(this.intervalId);
    if (this.timeline) this.timeline.kill();
  }
}


/* ============================================
   AdvisorySection — Section 3 Orchestrator
   ============================================ */

// Toggle: set to true to re-enable the entire advisory section
const SHOW_ADVISORY_SECTION = true;
// Toggle: set to true to re-enable the Services Offered sub-section (only applies when SHOW_ADVISORY_SECTION is true)
const SHOW_SERVICES = false;

class AdvisorySection {
  constructor() {
    this.sectionEl = document.getElementById('advisorySection');
    this.containerEl = null;
    this.data = null;
    this.advisoryGrid = null;
    this.cardSwap = null;
  }

  async init() {
    if (!this.sectionEl) return;
    if (!SHOW_ADVISORY_SECTION) {
      this.sectionEl.style.display = 'none';
      window.dispatchEvent(new Event('resize'));
      return;
    }

    this.containerEl = this.sectionEl.querySelector('.advisory-container');
    if (!this.containerEl) return;

    try {
      this.data = await this.loadData();
      if (!this.data) {
        this.sectionEl.style.display = 'none';
        return;
      }

      this.renderHero(this.data.hero, this.data.cardStack);
      if (SHOW_SERVICES) this.renderServices(this.data.services);
      this.initGrid();
      this.initCardSwap(this.data.cardStack);
      this.initEntranceAnimations();
    } catch (err) {
      console.warn('Advisory Section: Failed to initialize', err);
      this.sectionEl.style.display = 'none';
    }
  }

  async loadData() {
    const response = await fetch('data/advisory_services.json', { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }

  /**
   * Initialize animated canvas grid for Section 3
   * Reuses the same InfrastructureGrid class from Sections 1-2
   * but with light-theme colors (#224d78 at 4% on white)
   * Canvas is position:absolute within the section, not fixed fullscreen
   */
  initGrid() {
    const canvas = document.getElementById('advisory-grid');
    if (!canvas || typeof InfrastructureGrid === 'undefined') return;

    const config = {
      direction: 'up',
      speed: 0.12,
      borderColor: 'rgba(34, 77, 120, 0.04)',  // #224d78 at 4% opacity
      squareSize: 30,
      enableFadeOnScroll: false  // No fade — stays visible throughout Section 3
    };

    // Create grid instance (this calls init() → resizeCanvas() with window dimensions)
    this.advisoryGrid = new InfrastructureGrid(canvas, config);

    // Override: size canvas to the section, not the viewport
    const resizeToSection = () => {
      canvas.width = this.sectionEl.offsetWidth;
      canvas.height = this.sectionEl.offsetHeight;
      this.advisoryGrid.numSquaresX = Math.ceil(canvas.width / config.squareSize) + 1;
      this.advisoryGrid.numSquaresY = Math.ceil(canvas.height / config.squareSize) + 1;
    };

    // Initial sizing (content has been rendered so section has full height)
    resizeToSection();

    // Re-size on window resize
    window.addEventListener('resize', resizeToSection);

    // Also observe section height changes (e.g. dynamic content load)
    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(resizeToSection);
      observer.observe(this.sectionEl);
    }
  }

  /**
   * Render the two-column hero: left text content + right heading & card swap area
   */
  renderHero(hero, cardStackData) {
    if (!hero) return;

    const heroEl = document.createElement('div');
    heroEl.className = 'advisory-hero';

    // LEFT column — body paragraphs (with bold support)
    const textCol = document.createElement('div');
    textCol.className = 'advisory-hero__text advisory-animate';

    if (Array.isArray(hero.bodyParagraphs)) {
      hero.bodyParagraphs.forEach(p => {
        const pEl = document.createElement('p');
        pEl.className = p.bold ? 'advisory-hero__body advisory-hero__body--bold' : 'advisory-hero__body';
        pEl.textContent = p.text || '';

        textCol.appendChild(pEl);
      });
    }

    // An explicit link keeps programme navigation independent of paragraph wording.
    if (hero.cta?.href && hero.cta?.text) {
      const paragraph = document.createElement('p');
      paragraph.className = 'advisory-hero__body advisory-hero__body--bold';
      const link = document.createElement('a');
      link.className = 'advisory-hero__link';
      link.href = hero.cta.href;
      link.textContent = hero.cta.text;
      paragraph.appendChild(link);
      textCol.appendChild(paragraph);
    }

    // RIGHT column — heading + CardSwap container
    const cardsCol = document.createElement('div');
    cardsCol.className = 'advisory-hero__cards advisory-animate';

    // Add heading to right column (data-driven: set showHeading: false in
    // advisory_services.json to hide it without losing the copy)
    if (hero.heading && hero.showHeading !== false) {
      const heading = document.createElement('h2');
      heading.className = 'advisory-hero__heading';
      heading.textContent = hero.heading;
      cardsCol.appendChild(heading);
    }

    // Create CardSwap container (cards rendered by initCardSwap)
    const swapContainer = document.createElement('div');
    swapContainer.className = 'card-swap-container';
    swapContainer.id = 'advisoryCardSwap';
    cardsCol.appendChild(swapContainer);

    heroEl.appendChild(textCol);
    heroEl.appendChild(cardsCol);
    this.containerEl.appendChild(heroEl);
  }

  /**
   * Initialize CardSwap with GSAP 3D animated card stack
   */
  initCardSwap(cardStackData) {
    const swapEl = document.getElementById('advisoryCardSwap');
    if (!swapEl || !cardStackData || cardStackData.length === 0) return;
    if (typeof gsap === 'undefined') return;

    const editorial = document.body.classList.contains('resources-page');
    const dimensions = () => {
      const width = Math.max(200, Math.min(480, swapEl.parentElement.offsetWidth - 80));
      // The narrow cards need enough height for their titles and download links.
      const height = Math.max(editorial ? 300 : 0, Math.round(width * 0.7));
      return { width, height };
    };
    const { width: cardW, height: cardH } = dimensions();

    this.cardSwap = new CardSwap(swapEl, cardStackData, {
      width: cardW,
      height: cardH,
      cardDistance: Math.round(cardW * 0.11),
      verticalDistance: Math.round(cardH * 0.17),
      delay: 5000,
      pauseOnHover: true,
      dropDistance: editorial ? 100 : 250,
      skewAmount: 6,
      easing: 'elastic'
    });

    // A resized Resources column must not retain the desktop-sized card stack.
    // Reposition the existing cards so their links and event handlers survive.
    if (editorial && typeof ResizeObserver !== 'undefined') {
      this.cardResizeObserver = new ResizeObserver(() => {
        const { width, height } = dimensions();
        const stack = this.cardSwap;
        if (width === stack.width && height === stack.height) return;
        if (stack.timeline) { stack.timeline.progress(1); stack.timeline.kill(); }
        stack.width = width;
        stack.height = height;
        stack.cardDistance = Math.round(width * .11);
        stack.verticalDistance = Math.round(height * .17);
        swapEl.style.width = width + 'px';
        swapEl.style.height = height + 'px';
        stack.order.forEach((index, slot) => {
          const card = stack.cardEls[index];
          card.style.width = width + 'px';
          card.style.height = height + 'px';
          stack.placeNow(card, stack.makeSlot(slot));
        });
      });
      this.cardResizeObserver.observe(swapEl.parentElement);
    }
  }

  /**
   * Render the Core Advisory Services with grouped cards
   */
  renderServices(services) {
    if (!services || services.length === 0) return;

    const block = document.createElement('div');
    block.className = 'advisory-services';

    const heading = document.createElement('h3');
    heading.className = 'advisory-services__heading advisory-animate';
    heading.textContent = 'SERVICES OFFERED';
    block.appendChild(heading);

    const container = document.createElement('div');
    container.className = 'advisory-services-container';

    services.forEach(group => {
      const groupEl = document.createElement('div');
      groupEl.className = 'advisory-service-group advisory-animate';
      groupEl.setAttribute('data-group-id', group.id);

      // Group title
      const titleEl = document.createElement('h4');
      titleEl.className = 'advisory-service-group__title';
      titleEl.textContent = group.title;
      groupEl.appendChild(titleEl);

      // Group subline
      const sublineEl = document.createElement('p');
      sublineEl.className = 'advisory-service-group__subline';
      sublineEl.textContent = group.subline;
      groupEl.appendChild(sublineEl);

      // Items grid
      const itemsGrid = document.createElement('div');
      itemsGrid.className = 'advisory-service-items';

      (group.items || []).forEach((item, index) => {
        const itemEl = document.createElement('div');
        itemEl.className = 'advisory-service-item advisory-animate';
        itemEl.setAttribute('data-item-index', index);

        // Create back layer (colored background with rotation)
        const backEl = document.createElement('span');
        backEl.className = 'advisory-service-item__back';
        itemEl.appendChild(backEl);

        // Create front layer (glass morphism effect)
        const frontEl = document.createElement('span');
        frontEl.className = 'advisory-service-item__front';

        const textEl = document.createElement('p');
        textEl.className = 'advisory-service-item__text';
        textEl.textContent = item;
        frontEl.appendChild(textEl);

        itemEl.appendChild(frontEl);
        itemsGrid.appendChild(itemEl);
      });

      groupEl.appendChild(itemsGrid);
      container.appendChild(groupEl);
    });

    block.appendChild(container);
    this.containerEl.appendChild(block);
  }

  /**
   * GSAP ScrollTrigger entrance animations
   */
  initEntranceAnimations() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
      // Fallback: remove animation class to show elements immediately
      this.sectionEl.querySelectorAll('.advisory-animate').forEach(el => {
        el.classList.remove('advisory-animate');
      });
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    const elements = this.sectionEl.querySelectorAll('.advisory-animate');

    gsap.fromTo(elements,
      { opacity: 0, y: 30 },
      {
        opacity: 1,
        y: 0,
        duration: 0.7,
        stagger: 0.12,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: this.sectionEl,
          start: 'top 80%',
          toggleActions: 'play none none none'
        },
        onComplete: () => {
          elements.forEach(el => el.classList.remove('advisory-animate'));
        }
      }
    );
  }

  /**
   * Escape HTML to prevent XSS from JSON content
   */
  escapeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  destroy() {
    if (this.advisoryGrid) {
      this.advisoryGrid.destroy();
    }
    if (this.cardSwap) {
      this.cardSwap.destroy();
    }
  }
}

// Initialize when DOM ready
document.addEventListener('DOMContentLoaded', () => {
  const advisory = new AdvisorySection();
  advisory.init();

  // Expose for debugging
  window.advisorySection = advisory;
});
