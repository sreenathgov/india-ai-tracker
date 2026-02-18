/**
 * ContactPanel -- Slide-up strategic consultation form
 * Fixed bottom, slides up with backdrop blur overlay
 * Follows same ES6 class pattern as StaggeredMenu, AdvisorySection
 */

class ContactPanel {
  constructor() {
    this.isOpen = false;
    this.savedScrollY = 0;
    this.touchStartY = 0;
    this.touchCurrentY = 0;
    this.isDragging = false;

    // DOM refs
    this.overlayEl = null;
    this.panelEl = null;
    this.handleEl = null;
    this.closeBtn = null;
    this.formEl = null;
    this.scrollEl = null;

    // GSAP timelines
    this.openTimeline = null;
    this.closeTimeline = null;

    // Bound handlers
    this._escHandler = null;
    this._touchStartHandler = null;
    this._touchMoveHandler = null;
    this._touchEndHandler = null;
  }

  init() {
    this.createMarkup();
    this.cacheRefs();
    this.attachEventListeners();
    this.bindExternalTriggers();
  }

  createMarkup() {
    // --- Overlay ---
    const overlay = document.createElement('div');
    overlay.className = 'contact-panel-overlay';
    overlay.setAttribute('aria-hidden', 'true');

    // --- Panel ---
    const panel = document.createElement('div');
    panel.className = 'contact-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-label', 'Schedule a strategic consultation');

    // Drag handle
    const handle = document.createElement('div');
    handle.className = 'contact-panel__handle';
    handle.setAttribute('aria-hidden', 'true');

    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.className = 'contact-panel__close';
    closeBtn.setAttribute('aria-label', 'Close consultation panel');
    closeBtn.type = 'button';
    closeBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;

    // Scrollable content area
    const scroll = document.createElement('div');
    scroll.className = 'contact-panel__scroll';

    // Build form
    const form = this.buildForm();
    scroll.appendChild(form);

    panel.appendChild(handle);
    panel.appendChild(closeBtn);
    panel.appendChild(scroll);

    document.body.appendChild(overlay);
    document.body.appendChild(panel);
  }

  buildForm() {
    const form = document.createElement('form');
    form.className = 'contact-panel__form';
    form.noValidate = true;

    // Header
    const header = document.createElement('div');
    header.className = 'contact-panel__section';
    header.innerHTML = `
      <h2 class="contact-panel__title">Schedule a Strategic Consultation</h2>
      <p class="contact-panel__subtitle">Structured advisory for organisations navigating AI regulation, policy alignment, and governance readiness in India.</p>
    `;
    form.appendChild(header);

    // Engagement Type
    const engSection = document.createElement('div');
    engSection.className = 'contact-panel__section';

    const engLegend = document.createElement('p');
    engLegend.className = 'contact-panel__legend';
    engLegend.textContent = 'Engagement Type';
    engSection.appendChild(engLegend);

    const radioGroup = document.createElement('div');
    radioGroup.className = 'contact-panel__radio-group';

    const types = [
      'Regulatory & Product Advisory',
      'Incentive & Scheme Structuring',
      'Governance Assessment',
      'Cross-Border Readiness',
      'General Inquiry'
    ];

    types.forEach((type, idx) => {
      const label = document.createElement('label');
      label.className = 'contact-panel__radio-option';

      const input = document.createElement('input');
      input.type = 'radio';
      input.name = 'engagementType';
      input.value = type;
      if (idx === 0) input.required = true;

      const span = document.createElement('span');
      span.textContent = type;

      label.appendChild(input);
      label.appendChild(span);

      label.addEventListener('click', () => {
        radioGroup.querySelectorAll('.contact-panel__radio-option')
          .forEach(opt => opt.classList.remove('selected'));
        label.classList.add('selected');
        radioGroup.classList.remove('error');
      });

      radioGroup.appendChild(label);
    });

    engSection.appendChild(radioGroup);
    form.appendChild(engSection);

    // Company Context
    const compSection = document.createElement('div');
    compSection.className = 'contact-panel__section';
    compSection.innerHTML = `
      <p class="contact-panel__legend">Company Context</p>
      <div class="contact-panel__row">
        <div class="contact-panel__field">
          <label class="contact-panel__label" for="cp-company">Company Name</label>
          <input class="contact-panel__input" type="text" id="cp-company" name="companyName" autocomplete="organization">
        </div>
        <div class="contact-panel__field">
          <label class="contact-panel__label" for="cp-website">Website</label>
          <input class="contact-panel__input" type="url" id="cp-website" name="website" placeholder="https://" autocomplete="url">
        </div>
      </div>
      <div class="contact-panel__row">
        <div class="contact-panel__field">
          <label class="contact-panel__label" for="cp-sector">Sector</label>
          <input class="contact-panel__input" type="text" id="cp-sector" name="sector">
        </div>
        <div class="contact-panel__field">
          <label class="contact-panel__label" for="cp-stage">Stage</label>
          <select class="contact-panel__select" id="cp-stage" name="stage">
            <option value="" disabled selected>Select stage</option>
            <option value="Pre-Revenue">Pre-Revenue</option>
            <option value="Growth">Growth</option>
            <option value="Enterprise">Enterprise</option>
            <option value="Public Sector / Institution">Public Sector / Institution</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>
    `;
    form.appendChild(compSection);

    // Strategic Context
    const stratSection = document.createElement('div');
    stratSection.className = 'contact-panel__section';
    stratSection.innerHTML = `
      <p class="contact-panel__legend">Strategic Context</p>
      <div class="contact-panel__field">
        <textarea class="contact-panel__textarea" name="strategicContext" rows="5" placeholder="Briefly describe your AI deployment or regulatory concern."></textarea>
      </div>
    `;
    form.appendChild(stratSection);

    // Contact Details
    const contactSection = document.createElement('div');
    contactSection.className = 'contact-panel__section';
    contactSection.innerHTML = `
      <p class="contact-panel__legend">Contact Details</p>
      <div class="contact-panel__row">
        <div class="contact-panel__field">
          <label class="contact-panel__label" for="cp-name">Full Name *</label>
          <input class="contact-panel__input" type="text" id="cp-name" name="contactName" required autocomplete="name">
        </div>
        <div class="contact-panel__field">
          <label class="contact-panel__label" for="cp-email">Email *</label>
          <input class="contact-panel__input" type="email" id="cp-email" name="email" required autocomplete="email">
        </div>
      </div>
      <div class="contact-panel__field" style="max-width: 50%;">
        <label class="contact-panel__label" for="cp-role">Role / Title</label>
        <input class="contact-panel__input" type="text" id="cp-role" name="role" autocomplete="organization-title">
      </div>
    `;
    form.appendChild(contactSection);

    // Submit
    const submitSection = document.createElement('div');
    submitSection.className = 'contact-panel__section';

    const submitBtn = document.createElement('button');
    submitBtn.className = 'contact-panel__submit';
    submitBtn.type = 'submit';
    submitBtn.textContent = 'Request Consultation';
    submitSection.appendChild(submitBtn);

    const footerNote = document.createElement('p');
    footerNote.className = 'contact-panel__footer-note';
    footerNote.textContent = 'Consultations are structured and confidential.';
    submitSection.appendChild(footerNote);

    form.appendChild(submitSection);
    return form;
  }

  cacheRefs() {
    this.overlayEl = document.querySelector('.contact-panel-overlay');
    this.panelEl = document.querySelector('.contact-panel');
    this.handleEl = this.panelEl.querySelector('.contact-panel__handle');
    this.closeBtn = this.panelEl.querySelector('.contact-panel__close');
    this.scrollEl = this.panelEl.querySelector('.contact-panel__scroll');
    this.formEl = this.panelEl.querySelector('.contact-panel__form');
  }

  attachEventListeners() {
    // Close button
    this.closeBtn.addEventListener('click', () => this.close());

    // Overlay click
    this.overlayEl.addEventListener('click', (e) => {
      if (e.target === this.overlayEl) this.close();
    });

    // ESC key
    this._escHandler = (e) => {
      if (e.key === 'Escape' && this.isOpen) this.close();
    };
    document.addEventListener('keydown', this._escHandler);

    // Mobile swipe-down
    this._touchStartHandler = (e) => this.onTouchStart(e);
    this._touchMoveHandler = (e) => this.onTouchMove(e);
    this._touchEndHandler = (e) => this.onTouchEnd(e);

    this.handleEl.addEventListener('touchstart', this._touchStartHandler, { passive: true });
    this.panelEl.addEventListener('touchmove', this._touchMoveHandler, { passive: false });
    this.panelEl.addEventListener('touchend', this._touchEndHandler);

    // Form submission
    this.formEl.addEventListener('submit', (e) => this.handleSubmit(e));
  }

  bindExternalTriggers() {
    // Footer "Schedule Consultation" link (legacy)
    const footerTrigger = document.getElementById('footer-consultation-trigger');
    if (footerTrigger) {
      footerTrigger.addEventListener('click', (e) => {
        e.preventDefault();
        this.open();
      });
    }

    // Advisory footer links — open panel with engagement type pre-selected
    document.addEventListener('click', (e) => {
      const link = e.target.closest('[data-engagement]');
      if (link) {
        e.preventDefault();
        this.open(link.dataset.engagement);
      }
    });
  }

  // --- Open (optionally pre-select an engagement type) ---
  open(engagementType = null) {
    if (this.isOpen) return;
    this.isOpen = true;
    this.resetForm();
    if (engagementType) this.preselectEngagement(engagementType);
    this.lockBodyScroll();

    this.overlayEl.classList.add('active');
    this.overlayEl.setAttribute('aria-hidden', 'false');

    if (this.openTimeline) this.openTimeline.kill();

    this.openTimeline = gsap.timeline();
    this.openTimeline
      .fromTo(this.panelEl,
        { y: '100%' },
        { y: '0%', duration: 0.6, ease: 'power4.out' }
      )
      .fromTo(
        this.panelEl.querySelectorAll('.contact-panel__section'),
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.4, stagger: 0.08, ease: 'power2.out' },
        '-=0.3'
      );

    // Focus trap: focus the first input after animation
    this.openTimeline.eventCallback('onComplete', () => {
      const firstInput = this.panelEl.querySelector('input, textarea, select');
      if (firstInput) firstInput.focus();
    });
  }

  // --- Close ---
  close() {
    if (!this.isOpen) return;
    this.isOpen = false;

    if (this.openTimeline) this.openTimeline.kill();
    if (this.closeTimeline) this.closeTimeline.kill();

    this.closeTimeline = gsap.timeline({
      onComplete: () => {
        this.overlayEl.classList.remove('active');
        this.overlayEl.setAttribute('aria-hidden', 'true');
        this.unlockBodyScroll();
        gsap.set(this.panelEl, { y: '100%' });
        // Reset overlay opacity (may have been modified by swipe gesture)
        this.overlayEl.style.opacity = '';
      }
    });

    this.closeTimeline.to(this.panelEl, {
      y: '100%',
      duration: 0.4,
      ease: 'power3.in'
    });
  }

  // --- Body Scroll Lock ---
  lockBodyScroll() {
    this.savedScrollY = window.scrollY;
    document.body.classList.add('contact-panel-open');
    document.body.style.top = `-${this.savedScrollY}px`;
  }

  unlockBodyScroll() {
    document.body.classList.remove('contact-panel-open');
    document.body.style.top = '';
    window.scrollTo(0, this.savedScrollY);
  }

  // --- Mobile Swipe-Down ---
  onTouchStart(e) {
    this.touchStartY = e.touches[0].clientY;
    this.touchCurrentY = e.touches[0].clientY;
    this.isDragging = true;
  }

  onTouchMove(e) {
    if (!this.isDragging) return;
    this.touchCurrentY = e.touches[0].clientY;
    const deltaY = this.touchCurrentY - this.touchStartY;

    // Only allow downward drag when content is scrolled to top
    if (deltaY > 0 && this.scrollEl.scrollTop <= 0) {
      e.preventDefault();
      const resistance = 0.6;
      const translateY = deltaY * resistance;
      gsap.set(this.panelEl, { y: translateY });
      const progress = Math.min(translateY / (window.innerHeight * 0.3), 1);
      this.overlayEl.style.opacity = 1 - (progress * 0.5);
    }
  }

  onTouchEnd() {
    if (!this.isDragging) return;
    this.isDragging = false;

    const deltaY = this.touchCurrentY - this.touchStartY;
    const threshold = 100;

    if (deltaY > threshold && this.scrollEl.scrollTop <= 0) {
      this.close();
    } else {
      gsap.to(this.panelEl, { y: 0, duration: 0.3, ease: 'power2.out' });
      this.overlayEl.style.opacity = '';
    }

    this.touchStartY = 0;
    this.touchCurrentY = 0;
  }

  // --- Form Submission ---
  handleSubmit(e) {
    e.preventDefault();

    // Clear previous error states
    this.formEl.querySelectorAll('.error').forEach(el => el.classList.remove('error'));

    const formData = {
      engagementType: this.getSelectedRadio(),
      companyName: this.formEl.querySelector('[name="companyName"]')?.value.trim() || '',
      website: this.formEl.querySelector('[name="website"]')?.value.trim() || '',
      sector: this.formEl.querySelector('[name="sector"]')?.value.trim() || '',
      stage: this.formEl.querySelector('[name="stage"]')?.value || '',
      strategicContext: this.formEl.querySelector('[name="strategicContext"]')?.value.trim() || '',
      contactName: this.formEl.querySelector('[name="contactName"]')?.value.trim() || '',
      email: this.formEl.querySelector('[name="email"]')?.value.trim() || '',
      role: this.formEl.querySelector('[name="role"]')?.value.trim() || '',
      submittedAt: new Date().toISOString()
    };

    // Validate required fields
    let hasError = false;

    if (!formData.engagementType) {
      this.formEl.querySelector('.contact-panel__radio-group')?.classList.add('error');
      hasError = true;
    }
    if (!formData.contactName) {
      this.formEl.querySelector('[name="contactName"]')?.classList.add('error');
      hasError = true;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email || !emailRegex.test(formData.email)) {
      this.formEl.querySelector('[name="email"]')?.classList.add('error');
      hasError = true;
    }

    if (hasError) return;

    // Store in localStorage (matches newsletter pattern)
    try {
      const existing = JSON.parse(localStorage.getItem('consultation_requests') || '[]');
      existing.push(formData);
      localStorage.setItem('consultation_requests', JSON.stringify(existing));
    } catch (err) {
      // silently fail
    }

    this.showSuccessState();
  }

  preselectEngagement(typeName) {
    const inputs = this.formEl.querySelectorAll('input[name="engagementType"]');
    inputs.forEach(input => {
      if (input.value === typeName) {
        input.checked = true;
        const label = input.closest('.contact-panel__radio-option');
        if (label) {
          label.classList.add('selected');
          label.closest('.contact-panel__radio-group')?.classList.remove('error');
        }
      }
    });
  }

  getSelectedRadio() {
    const selected = this.formEl.querySelector('input[name="engagementType"]:checked');
    return selected ? selected.value : null;
  }

  showSuccessState() {
    gsap.to(this.formEl, {
      opacity: 0,
      y: -10,
      duration: 0.3,
      onComplete: () => {
        this.formEl.style.display = 'none';

        const successEl = document.createElement('div');
        successEl.className = 'contact-panel__success';
        successEl.innerHTML = `
          <h3>Request Received</h3>
          <p>Your consultation request has been recorded. We will respond within two business days.</p>
          <p class="contact-panel__footer-note">All consultations are structured and confidential.</p>
        `;
        this.scrollEl.appendChild(successEl);

        gsap.fromTo(successEl,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }
        );
      }
    });
  }

  // --- Reset form for next open ---
  resetForm() {
    // Remove success state if present
    const successEl = this.scrollEl.querySelector('.contact-panel__success');
    if (successEl) successEl.remove();

    // Show and reset form
    this.formEl.style.display = '';
    this.formEl.style.opacity = '';
    this.formEl.style.transform = '';
    gsap.set(this.formEl, { opacity: 1, y: 0 });
    this.formEl.reset();

    // Clear visual states
    this.formEl.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));
    this.formEl.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
  }

  // Public API
  toggle() {
    this.isOpen ? this.close() : this.open();
  }

  destroy() {
    if (this.openTimeline) this.openTimeline.kill();
    if (this.closeTimeline) this.closeTimeline.kill();
    document.removeEventListener('keydown', this._escHandler);
    this.overlayEl?.remove();
    this.panelEl?.remove();
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  const contactPanel = new ContactPanel();
  contactPanel.init();
  window.contactPanel = contactPanel;
});
