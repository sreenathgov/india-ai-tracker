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

    // Click to swap (download links handle themselves via direct listeners)
    this.container.addEventListener('click', (e) => {
      if (e.target.closest('.card-swap-card__download')) return;
      this.swap();
    });
  }

  static showComingSoonToast() {
    const existing = document.getElementById('card-swap-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'card-swap-toast';
    toast.textContent = 'Coming soon — please check back in a few days.';
    toast.style.cssText = [
      'position:fixed',
      'bottom:32px',
      'left:50%',
      'transform:translateX(-50%) translateY(20px)',
      'background:#0a2f52',
      'color:#fff',
      'padding:12px 28px',
      'border-radius:8px',
      'font-size:13px',
      'letter-spacing:0.06em',
      'text-transform:uppercase',
      'z-index:9999',
      'opacity:0',
      'transition:opacity 0.3s ease,transform 0.3s ease',
      'pointer-events:none',
      'white-space:nowrap',
      'box-shadow:0 4px 20px rgba(0,0,0,0.25)'
    ].join(';');
    document.body.appendChild(toast);

    requestAnimationFrame(() => requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(-50%) translateY(0)';
    }));

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(-50%) translateY(20px)';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
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
          <a href="${card.pdfUrl ? this.escapeHTML(card.pdfUrl) : 'javascript:void(0)'}" ${card.pdfUrl ? 'download' : ''} rel="noopener" class="card-swap-card__download" onclick="event.stopPropagation()">
            ${downloadIcon} Download PDF
          </a>
        </div>
      `;

      // Coming-soon cards: intercept download click directly
      if (!card.pdfUrl) {
        el.querySelector('.card-swap-card__download').addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          CardSwap.showComingSoonToast();
        });
      }

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
      y: '+=250',
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

    this.containerEl = this.sectionEl.querySelector('.advisory-container');
    if (!this.containerEl) return;

    try {
      this.data = await this.loadData();
      if (!this.data) {
        this.sectionEl.style.display = 'none';
        return;
      }

      this.renderHero(this.data.hero, this.data.cardStack);
      this.renderServices(this.data.services);
      this.initGrid();
      this.initCardSwap(this.data.cardStack);
      this.initEntranceAnimations();
    } catch (err) {
      console.warn('Advisory Section: Failed to initialize', err);
      this.sectionEl.style.display = 'none';
    }
  }

  async loadData() {
    const response = await fetch('data/advisory_services.json');
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

        // Make "Schedule a consultation" text clickable to open contact panel
        if (p.bold && p.text && p.text.toLowerCase().includes('schedule')) {
          pEl.setAttribute('role', 'button');
          pEl.setAttribute('tabindex', '0');
          pEl.style.cursor = 'pointer';
          pEl.style.textDecoration = 'underline';
          pEl.style.textDecorationColor = 'rgba(10, 47, 82, 0.3)';
          pEl.style.textUnderlineOffset = '3px';
          pEl.addEventListener('click', () => {
            if (window.contactPanel) window.contactPanel.open();
          });
          pEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              if (window.contactPanel) window.contactPanel.open();
            }
          });
        }

        textCol.appendChild(pEl);
      });
    }

    // RIGHT column — heading + CardSwap container
    const cardsCol = document.createElement('div');
    cardsCol.className = 'advisory-hero__cards advisory-animate';

    // Add heading to right column
    const heading = document.createElement('h2');
    heading.className = 'advisory-hero__heading';
    heading.textContent = hero.heading;
    cardsCol.appendChild(heading);

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

    // Responsive sizing based on container width
    const containerWidth = swapEl.parentElement.offsetWidth;
    const cardW = Math.min(480, containerWidth - 80);
    const cardH = Math.round(cardW * 0.7);

    this.cardSwap = new CardSwap(swapEl, cardStackData, {
      width: cardW,
      height: cardH,
      cardDistance: Math.round(cardW * 0.11),
      verticalDistance: Math.round(cardH * 0.17),
      delay: 5000,
      pauseOnHover: true,
      skewAmount: 6,
      easing: 'elastic'
    });
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
    heading.textContent = 'ADVISORY SERVICES';
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
