/**
 * Load-on-consent cookie banner for Google Analytics.
 *
 * DPDP 2023 / GDPR posture: NO analytics cookies or network calls happen until
 * the user explicitly opts in. Google Analytics (gtag.js) is loaded dynamically
 * only after the visitor clicks "Accept". A decision (granted/denied) is
 * remembered in localStorage; declining means GA never loads.
 *
 * Re-open the banner from anywhere (e.g. a "Cookie settings" link in the privacy
 * policy) by calling window.openCookieSettings().
 *
 * No dependencies. Loaded as <script src="js/consent.js" defer></script>.
 */
(function () {
  'use strict';

  var GA_MEASUREMENT_ID = 'G-EF8EXSDV07';
  var STORAGE_KEY = 'iat_cookie_consent'; // values: 'granted' | 'denied'
  var PRIVACY_URL = '/privacy-policy.html';

  function readDecision() {
    try {
      return window.localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      return null; // localStorage blocked (private mode) -> treat as undecided
    }
  }

  function storeDecision(value) {
    try {
      window.localStorage.setItem(STORAGE_KEY, value);
    } catch (e) {
      /* best-effort; if storage is blocked the choice simply isn't persisted */
    }
  }

  var gaLoaded = false;

  function loadGoogleAnalytics() {
    if (location.hostname === '127.0.0.1' || location.hostname === 'localhost' || location.hostname === '::1') {
      return;
    }
    if (gaLoaded || !GA_MEASUREMENT_ID) return;
    gaLoaded = true;

    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_MEASUREMENT_ID;
    document.head.appendChild(s);

    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', GA_MEASUREMENT_ID);
  }

  function injectStyles() {
    if (document.getElementById('cookie-consent-styles')) return;
    var css =
      '.cookie-consent{position:fixed;left:0;right:0;bottom:0;z-index:2147483647;' +
      'background:#0f172a;color:#e2e8f0;padding:16px 20px;font-size:14px;line-height:1.5;' +
      'box-shadow:0 -2px 16px rgba(0,0,0,.35);display:flex;flex-wrap:wrap;gap:12px;' +
      'align-items:center;justify-content:center}' +
      '.cookie-consent__text{max-width:780px;flex:1 1 320px}' +
      '.cookie-consent__text a{color:#7dd3fc;text-decoration:underline}' +
      '.cookie-consent__actions{display:flex;gap:8px;flex:0 0 auto}' +
      '.cookie-consent__btn{border:0;border-radius:6px;padding:8px 16px;font-size:14px;' +
      'font-weight:600;cursor:pointer;font-family:inherit}' +
      '.cookie-consent__btn--accept{background:#38bdf8;color:#0f172a}' +
      '.cookie-consent__btn--decline{background:transparent;color:#cbd5e1;' +
      'border:1px solid #475569}' +
      '@media (max-width:520px){.cookie-consent{flex-direction:column;align-items:stretch}' +
      '.cookie-consent__actions{justify-content:flex-end}}';
    var style = document.createElement('style');
    style.id = 'cookie-consent-styles';
    style.textContent = css;
    document.head.appendChild(style);
  }

  var bannerEl = null;

  function removeBanner() {
    if (bannerEl && bannerEl.parentNode) {
      bannerEl.parentNode.removeChild(bannerEl);
    }
    bannerEl = null;
  }

  function showBanner() {
    if (bannerEl) return;
    injectStyles();

    bannerEl = document.createElement('div');
    bannerEl.className = 'cookie-consent';
    bannerEl.setAttribute('role', 'dialog');
    bannerEl.setAttribute('aria-live', 'polite');
    bannerEl.setAttribute('aria-label', 'Cookie consent');

    var text = document.createElement('div');
    text.className = 'cookie-consent__text';
    // textContent + a real anchor: no untrusted data, but keep it injection-free.
    text.appendChild(document.createTextNode(
      'We use Google Analytics to understand how the site is used. ' +
      'Analytics cookies load only if you accept. See our '
    ));
    var link = document.createElement('a');
    link.href = PRIVACY_URL;
    link.textContent = 'Privacy Policy';
    text.appendChild(link);
    text.appendChild(document.createTextNode('.'));

    var actions = document.createElement('div');
    actions.className = 'cookie-consent__actions';

    var decline = document.createElement('button');
    decline.type = 'button';
    decline.className = 'cookie-consent__btn cookie-consent__btn--decline';
    decline.textContent = 'Decline';
    decline.addEventListener('click', function () {
      storeDecision('denied');
      removeBanner();
    });

    var accept = document.createElement('button');
    accept.type = 'button';
    accept.className = 'cookie-consent__btn cookie-consent__btn--accept';
    accept.textContent = 'Accept';
    accept.addEventListener('click', function () {
      storeDecision('granted');
      removeBanner();
      loadGoogleAnalytics();
    });

    actions.appendChild(decline);
    actions.appendChild(accept);
    bannerEl.appendChild(text);
    bannerEl.appendChild(actions);
    document.body.appendChild(bannerEl);
  }

  // Allow re-opening the banner to change a prior choice.
  window.openCookieSettings = showBanner;

  function init() {
    var decision = readDecision();
    if (decision === 'granted') {
      loadGoogleAnalytics();
    } else if (decision !== 'denied') {
      showBanner();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
