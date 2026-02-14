/**
 * Advisory Section — Section 3 Orchestrator
 * Fetches data from data/advisory_services.json
 * Renders two-column hero (text + card stack) and services bento grid
 * Reuses existing magic-bento.js spotlight system (adapted for light background)
 * Follows same architecture as strategic-insights.js
 */

class AdvisorySection {
  constructor() {
    this.sectionEl = document.getElementById('advisorySection');
    this.containerEl = null;
    this.data = null;
    this.advisoryGrid = null;
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
      this.initCardStack();
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
   * Render the two-column hero: left text + right card stack with outcomes below
   */
  renderHero(hero, cardStackData) {
    if (!hero) return;

    const heroEl = document.createElement('div');
    heroEl.className = 'advisory-hero';

    // LEFT column — heading + body paragraphs
    const textCol = document.createElement('div');
    textCol.className = 'advisory-hero__text advisory-animate';

    const bodyHTML = Array.isArray(hero.body)
      ? hero.body.map(p => `<p class="advisory-hero__body">${this.escapeHTML(p)}</p>`).join('')
      : `<p class="advisory-hero__body">${this.escapeHTML(hero.body)}</p>`;

    textCol.innerHTML = `
      <h2 class="advisory-hero__heading">${this.escapeHTML(hero.heading)}</h2>
      ${bodyHTML}
    `;

    // RIGHT column — card stack + outcomes below
    const cardsCol = document.createElement('div');
    cardsCol.className = 'advisory-hero__cards advisory-animate';

    const stackEl = document.createElement('div');
    stackEl.className = 'card-stack';
    stackEl.id = 'advisoryCardStack';

    // Render stacked document cards
    const downloadIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>`;

    (cardStackData || []).forEach((card, index) => {
      const cardEl = document.createElement('a');
      cardEl.className = 'card-stack__item';
      cardEl.href = card.pdfUrl || '#';
      cardEl.target = '_blank';
      cardEl.rel = 'noopener';
      cardEl.setAttribute('data-index', index);
      cardEl.setAttribute('data-card-id', card.id);

      cardEl.innerHTML = `
        <div class="card-stack__title">${this.escapeHTML(card.title)}</div>
        <div class="card-stack__descriptor">${this.escapeHTML(card.descriptor)}</div>
        <div class="card-stack__meta">${downloadIcon} ${this.escapeHTML(card.meta)}</div>
      `;

      stackEl.appendChild(cardEl);
    });

    cardsCol.appendChild(stackEl);

    heroEl.appendChild(textCol);
    heroEl.appendChild(cardsCol);
    this.containerEl.appendChild(heroEl);
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
   * Card Stack interaction — placeholder click-to-cycle
   * Will be replaced with full ReactBits CardSwap conversion
   * when user provides the React component code
   */
  initCardStack() {
    const stackEl = document.getElementById('advisoryCardStack');
    if (!stackEl) return;

    const cards = stackEl.querySelectorAll('.card-stack__item');
    if (cards.length === 0) return;

    stackEl.addEventListener('click', (e) => {
      // Find the clicked card
      const clickedCard = e.target.closest('.card-stack__item');
      if (!clickedCard) return;

      // Only cycle if clicking the front card (index 0)
      if (clickedCard.getAttribute('data-index') !== '0') return;

      e.preventDefault();
      this.cycleCards(stackEl);
    });
  }

  /**
   * Cycle card stack: front card goes to back, others shift forward
   */
  cycleCards(stackEl) {
    const cards = Array.from(stackEl.querySelectorAll('.card-stack__item'));
    const total = cards.length;
    if (total === 0) return;

    // Rotate: current index N becomes (N - 1 + total) % total
    // So index 0 → last, index 1 → 0, index 2 → 1
    cards.forEach(card => {
      const current = parseInt(card.getAttribute('data-index'), 10);
      const next = (current - 1 + total) % total;
      card.setAttribute('data-index', next);
    });
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
  }
}

// Initialize when DOM ready
document.addEventListener('DOMContentLoaded', () => {
  const advisory = new AdvisorySection();
  advisory.init();

  // Expose for debugging
  window.advisorySection = advisory;
});
