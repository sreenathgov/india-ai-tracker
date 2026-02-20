/**
 * Strategic Insights — Section 2 Orchestrator
 * Fetches data from data/strategic_insights.json
 * Renders a Magic Bento grid with stat and insight cards
 * Manages standalone Newsletter Hero section
 * Reuses existing magic-bento.js spotlight system (softened for institutional feel)
 */

class StrategicInsights {
  constructor() {
    this.gridEl = document.getElementById('strategicBentoGrid');
    this.sectionEl = document.getElementById('strategicInsightsSection');
    this.newsletterSection = document.getElementById('newsletterHeroSection');
    this.data = null;
    this.bentoManager = null;
  }

  async init() {
    if (!this.gridEl || !this.sectionEl) return;

    try {
      this.data = await this.loadData();
      if (!this.data || !this.data.cards || this.data.cards.length === 0) {
        this.sectionEl.style.display = 'none';
        if (this.newsletterSection) this.newsletterSection.style.display = 'none';
        return;
      }

      this.renderBentoGrid(this.data.cards);
      this.initSpotlight();
      this.initEntranceAnimations();
      this.initNewsletter(this.data.newsletter);
    } catch (err) {
      console.warn('Strategic Insights: Failed to load data', err);
      this.sectionEl.style.display = 'none';
      if (this.newsletterSection) this.newsletterSection.style.display = 'none';
    }
  }

  async loadData() {
    const response = await fetch('data/strategic_insights.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }

  renderBentoGrid(cards) {
    // Sort by order if present, otherwise use array order
    const sorted = [...cards].sort((a, b) => (a.order || 0) - (b.order || 0));

    sorted.forEach(card => {
      switch (card.type) {
        case 'stat':
          this.renderStatCard(card);
          break;
        case 'insight':
          this.renderInsightCard(card);
          break;
        default:
          console.warn(`Strategic Insights: Unknown card type "${card.type}"`);
      }
    });
  }

  renderStatCard(card) {
    const el = document.createElement('div');
    el.className = 'bento-stat-card magic-bento-card magic-bento-card--border-glow bento-card-animate';
    el.style.setProperty('--glow-color', '201, 166, 107');
    el.setAttribute('data-card-id', card.id);

    el.innerHTML = `
      <div class="stat-value">${this.escapeHTML(card.value)}<span class="stat-suffix">${this.escapeHTML(card.suffix || '')}</span></div>
      <div class="stat-text-group">
        <div class="stat-title">${this.escapeHTML(card.title)}</div>
        <div class="stat-description">${this.escapeHTML(card.description)}</div>
      </div>
    `;

    this.gridEl.appendChild(el);
  }

  renderInsightCard(card) {
    const el = document.createElement('div');
    el.className = 'bento-insight-card magic-bento-card magic-bento-card--border-glow bento-card-animate';
    el.style.setProperty('--glow-color', '201, 166, 107');
    el.setAttribute('data-card-id', card.id);

    const metaHTML = card.metadata && card.metadata.region
      ? `<div class="insight-meta">${this.escapeHTML(card.metadata.region)}</div>`
      : '';

    el.innerHTML = `
      <div class="insight-title">${this.escapeHTML(card.title)}</div>
      <div class="insight-body">${this.escapeHTML(card.description)}</div>
      ${metaHTML}
    `;

    this.gridEl.appendChild(el);
  }

  /**
   * Initialize the standalone Newsletter Hero section
   * Populates from JSON data and wires up form submission
   */
  initNewsletter(newsletterData) {
    if (!this.newsletterSection || !newsletterData) return;

    // Populate from JSON
    const titleEl = document.getElementById('newsletterHeroTitle');
    const subtitleEl = document.getElementById('newsletterHeroSubtitle');
    const successEl = document.getElementById('newsletterSuccessMsg');
    const form = document.getElementById('newsletterHeroForm');

    if (titleEl && newsletterData.title) {
      titleEl.textContent = newsletterData.title;
    }
    if (subtitleEl && newsletterData.subtitle) {
      subtitleEl.textContent = newsletterData.subtitle;
    }
    if (successEl && newsletterData.successMessage) {
      successEl.textContent = newsletterData.successMessage;
    }

    // Set placeholder from JSON
    if (form && newsletterData.ctaPlaceholder) {
      const input = form.querySelector('input[type="email"]');
      if (input) input.placeholder = newsletterData.ctaPlaceholder;
    }
    if (form && newsletterData.ctaText) {
      const button = form.querySelector('button');
      if (button) button.textContent = newsletterData.ctaText;
    }

    // Wire up form submission
    if (form) {
      form.addEventListener('submit', (e) => this.handleNewsletterSubmit(e, form));
    }
  }

  handleNewsletterSubmit(e, form) {
    e.preventDefault();
    const input = form.querySelector('input[type="email"]');
    const email = input ? input.value.trim() : '';

    if (!email) return;

    const button = form.querySelector('button');

    // Disable form while submitting
    if (button) { button.disabled = true; button.textContent = 'Subscribing…'; }
    if (input) input.disabled = true;

    // Subscribe via Brevo
    const subscribePromise = typeof window.brevoSubscribe === 'function'
      ? window.brevoSubscribe(email)
      : Promise.reject(new Error('brevoSubscribe not loaded'));

    subscribePromise
      .then(() => {
        // Show success state
        form.classList.add('success');
        if (button) button.textContent = 'Subscribed';
        if (input) { input.value = ''; input.placeholder = 'Thank you!'; }

        const successMsg = document.getElementById('newsletterSuccessMsg');
        if (successMsg) {
          setTimeout(() => { successMsg.classList.add('visible'); }, 200);
        }
      })
      .catch((err) => {
        console.error('Newsletter subscription failed:', err);
        // Re-enable form so user can try again
        if (button) { button.disabled = false; button.textContent = 'Subscribe'; }
        if (input) { input.disabled = false; }
        alert('Something went wrong. Please try again.');
      });
  }

  initSpotlight() {
    // Reuse existing magic-bento.js spotlight system with Data Gold glow
    // Softened opacity for institutional, non-gamified feel
    if (typeof window.initMagicBento === 'function') {
      this.bentoManager = window.initMagicBento(this.gridEl, {
        glowColor: '201, 166, 107', // Data Gold (#c9a66b) in RGB
        enableSpotlight: true,
        enableBorderGlow: false, // We handle border glow via CSS
        clickEffect: true,
        spotlightRadius: 400,
        spotlightOpacity: 0.08 // Softened from 0.12 — professional, not gamified
      });
    }
  }

  initEntranceAnimations() {
    // Use GSAP ScrollTrigger for staggered entrance if available
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
      // Fallback: just remove the animation class to show cards
      this.gridEl.querySelectorAll('.bento-card-animate').forEach(card => {
        card.classList.remove('bento-card-animate');
      });
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    const cards = this.gridEl.querySelectorAll('.bento-card-animate');

    gsap.fromTo(cards,
      {
        opacity: 0,
        y: 30
      },
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: this.gridEl,
          start: 'top 85%',
          toggleActions: 'play none none none'
        },
        onComplete: () => {
          // Clean up animation class after all cards are visible
          cards.forEach(card => card.classList.remove('bento-card-animate'));
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
    if (this.bentoManager) {
      this.bentoManager.destroy();
    }
  }
}

// Initialize when DOM ready
document.addEventListener('DOMContentLoaded', () => {
  const insights = new StrategicInsights();
  insights.init();

  // Expose for debugging
  window.strategicInsights = insights;
});
