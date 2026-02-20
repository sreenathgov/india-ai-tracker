/**
 * IdentitySection -- Section 4
 * Renders identity content with RippleGrid WebGL background
 * Uses GSAP ScrollTrigger for entrance animations
 */

class IdentitySection {
  constructor() {
    this.sectionEl = document.getElementById('identitySection');
    this.gridInstance = null;
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

    // --- LEFT COLUMN: Portrait ---
    const portraitCol = document.createElement('div');
    portraitCol.className = 'identity-portrait identity-animate';

    const img = document.createElement('img');
    img.className = 'identity-portrait__image';
    img.src = 'added-assets/SG-TRANSPARENT.png';
    img.alt = 'Sreenath Govindarajan';
    img.loading = 'lazy';
    img.draggable = false;

    portraitCol.appendChild(img);

    // --- RIGHT COLUMN: Text ---
    const textCol = document.createElement('div');
    textCol.className = 'identity-text';

    // Statement (visual anchor)
    const statement = document.createElement('p');
    statement.className = 'identity-statement identity-animate';
    statement.innerHTML = 'Policy is not an external constraint.<br>It is a <em>design variable</em>.';

    // CTA button
    const ctaBtn = document.createElement('button');
    ctaBtn.className = 'identity-cta identity-animate';
    ctaBtn.type = 'button';
    ctaBtn.textContent = 'GET IN TOUCH';
    ctaBtn.addEventListener('click', () => {
      if (window.contactPanel) window.contactPanel.open();
    });

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
    textCol.appendChild(ctaBtn);
    textCol.appendChild(metaBlock);

    // Portrait LEFT, text RIGHT
    container.appendChild(portraitCol);
    container.appendChild(textCol);
  }

  initGridBackground() {
    if (typeof RippleGrid === 'undefined') return;

    this.gridInstance = new RippleGrid(this.sectionEl, {
      gridColor: '#db4a2b',
      gridSize: 30.0,
      gridThickness: 60.0,
      rippleIntensity: 0.04,
      opacity: 0.144,
      mouseInteraction: true,
      mouseInteractionRadius: 1.2,
      enableRainbow: false,
      fadeDistance: 10.0,
      vignetteStrength: 10.0,
      glowIntensity: 0.0
    });
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
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  const identity = new IdentitySection();
  identity.init();
  window.identitySection = identity;

  // Footer newsletter form handler
  const footerForm = document.getElementById('footerNewsletterForm');
  if (footerForm) {
    footerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = footerForm.querySelector('input[type="email"]');
      const email = input ? input.value.trim() : '';
      if (!email) return;

      const btn = footerForm.querySelector('.kl-footer__nl-submit');
      if (btn) { btn.disabled = true; btn.textContent = 'Subscribing…'; }
      if (input) input.disabled = true;

      const subscribePromise = typeof window.brevoSubscribe === 'function'
        ? window.brevoSubscribe(email)
        : Promise.reject(new Error('brevoSubscribe not loaded'));

      subscribePromise
        .then(() => {
          if (input) { input.value = ''; input.disabled = false; }
          if (btn) {
            btn.disabled = false;
            btn.textContent = 'Subscribed ✓';
            btn.style.color = 'rgba(255,255,255,0.85)';
            btn.style.borderColor = 'rgba(255,255,255,0.35)';
            setTimeout(() => {
              btn.textContent = 'Subscribe';
              btn.style.color = '';
              btn.style.borderColor = '';
            }, 3000);
          }
        })
        .catch((err) => {
          console.error('Newsletter subscription failed:', err);
          if (input) input.disabled = false;
          if (btn) { btn.disabled = false; btn.textContent = 'Subscribe'; }
          alert('Something went wrong. Please try again.');
        });
    });
  }
});
