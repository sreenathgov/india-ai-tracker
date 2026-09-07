/**
 * Strategic Insights — Section 2 Orchestrator
 * Reads the research snapshot embedded by generate-research-stats.js.
 * Heading, byline and cards ship together, without a separately cached request.
 * Renders a Magic Bento grid with stat and insight cards
 * Reuses existing magic-bento.js spotlight system (softened for institutional feel)
 */

class StrategicInsights {
  constructor() {
    this.gridEl = document.getElementById('strategicBentoGrid');
    this.sectionEl = document.getElementById('strategicInsightsSection');
    this.data = null;
    this.bentoManager = null;
  }

  async init() {
    if (!this.gridEl || !this.sectionEl) return;

    try {
      this.data = await this.loadData();
      if (!this.data || !this.data.cards || this.data.cards.length === 0) {
        this.sectionEl.style.display = 'none';
        return;
      }

      this.renderBentoGrid(this.data.cards);
      this.initSpotlight();
      this.initEntranceAnimations();
    } catch (err) {
      console.warn('Strategic Insights: Failed to load data', err);
      this.sectionEl.style.display = 'none';
    }
  }

  async loadData() {
    const payload = document.getElementById('researchShowcaseData');
    if (!payload) throw new Error('Missing build-generated research snapshot');
    return JSON.parse(payload.textContent);
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
