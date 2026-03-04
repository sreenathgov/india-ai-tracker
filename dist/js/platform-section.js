/**
 * Platform Section — Section 2.5 Orchestrator
 * Handles waitlist form submission and GSAP entrance animations.
 *
 * NOTE: The CTA form now lives in a standalone orange strip section
 * (.waitlist-hero-section) and is always visible — no toggle button needed.
 */

(function () {
  'use strict';

  const form = document.getElementById('platformWaitlistForm');
  const successMsg = document.getElementById('platformWaitlistSuccess');

  if (!form) return;

  /* ---- Form submission ---- */
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const data = {
      name: form.elements.name.value.trim(),
      company: form.elements.company.value.trim(),
      email: form.elements.email.value.trim(),
      timestamp: new Date().toISOString()
    };

    // Store in localStorage until a real API endpoint is wired up
    // TODO: Replace with POST to /api/waitlist (Brevo or custom serverless function)
    try {
      const existing = JSON.parse(localStorage.getItem('kl_waitlist') || '[]');
      existing.push(data);
      localStorage.setItem('kl_waitlist', JSON.stringify(existing));
    } catch (_) {
      // Silent fail — localStorage unavailable
    }

    // Hide form, show success message
    form.style.display = 'none';
    if (successMsg) successMsg.classList.add('visible');
  });

  /* ---- GSAP ScrollTrigger entrance animations ---- */
  function initAnimations() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
      // Fallback: show elements immediately
      document.querySelectorAll('.platform-animate').forEach(el => {
        el.style.opacity = '1';
        el.style.transform = 'none';
      });
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    const section = document.getElementById('platformSection');
    if (!section) return;

    const elements = section.querySelectorAll('.platform-animate');

    gsap.fromTo(elements,
      { opacity: 0, y: 30 },
      {
        opacity: 1,
        y: 0,
        duration: 0.7,
        stagger: 0.12,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: section,
          start: 'top 80%',
          toggleActions: 'play none none none'
        },
        onComplete: () => {
          elements.forEach(el => el.classList.remove('platform-animate'));
        }
      }
    );
  }

  // Run animations after DOM is settled
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAnimations);
  } else {
    initAnimations();
  }
})();
