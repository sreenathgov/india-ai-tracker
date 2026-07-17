# Resources Catalog Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the standalone `resources.html` catalog page — tabbed Insights / Whitepapers / News & Press on a cream + orange-grid canvas — per the approved spec `docs/superpowers/specs/2026-07-16-resources-catalog-page-design.md`.

**Architecture:** Static HTML page with an embedded JSON data block rendered client-side by a small vanilla JS module. The homepage's `InfrastructureGrid` canvas class is reused via new data-attribute configuration. The shared staggered menu gains additive `subItems` support.

**Tech Stack:** Vanilla HTML/CSS/JS, GSAP (already loaded for the menu), no new dependencies, no build step for this phase.

## Global Constraints

- Palette only: navy `#0a2f52`, cream `#F4EBD0`, orange `#db4a2b`, card surface `#FBF5E4`, card border `rgba(10, 47, 82, 0.18)`, grid lines `rgba(219, 74, 43, 0.07)`.
- Type: Cormorant Garamond (titles, via `styles-v2.css` @font-face) and Inter (sans, via Google Fonts link).
- `bucket` enum: `insight | whitepaper | news`. Exactly one item has `featured: true`.
- All dynamic text rendered via `textContent` / DOM creation — never `innerHTML` with data values (repo has an XSS-hardening history).
- No mutation of shared state; build new DOM nodes per render.
- Existing pages must be pixel-identical after the shared-file changes (`infrastructure-grid.js`, `staggered-menu.js`) except the menu's Publications→Resources swap.
- Card corner radius 3px; hover lift 2–3px; image scale 1.03.
- Verification is browser-behavioral (no JS unit-test scaffold exists in this repo): each task ends with explicit browser checks via the preview server.
- Commits: conventional format, `--no-gpg-sign`, message via `-F <tempfile>` (repo gotcha: GPG signing hangs headless).

---

### Task 1: Parameterize the infrastructure grid via data attributes

**Files:**
- Modify: `js/infrastructure-grid.js:161-183` (the `DOMContentLoaded` init only; the class is untouched)

**Interfaces:**
- Consumes: existing global `InfrastructureGrid` class.
- Produces: canvas `#infrastructure-grid` now honors optional `data-border-color`, `data-square-size`, `data-direction`, `data-speed` attributes; absent attributes fall back to today's exact values. Task 2's page relies on this.

- [ ] **Step 1: Replace the hardcoded init config with attribute-aware config**

Replace the `document.addEventListener('DOMContentLoaded', …)` block at the bottom of `js/infrastructure-grid.js` with:

```js
// Initialize when DOM ready
document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('infrastructure-grid');
  if (!canvas) {
    console.warn('Infrastructure grid canvas element not found');
    return;
  }

  // Optional per-page overrides via data attributes; defaults preserve the
  // original homepage configuration exactly.
  const data = canvas.dataset;
  const parsedSpeed = parseFloat(data.speed);
  const parsedSquareSize = parseInt(data.squareSize, 10);
  const validDirections = ['up', 'down', 'left', 'right', 'diagonal'];

  const config = {
    direction: validDirections.includes(data.direction) ? data.direction : 'up',
    speed: Number.isFinite(parsedSpeed) ? parsedSpeed : 0.12,
    borderColor: data.borderColor || 'rgba(255, 255, 255, 0.025)',
    squareSize: Number.isFinite(parsedSquareSize) && parsedSquareSize > 0 ? parsedSquareSize : 30,
    enableFadeOnScroll: false,
    fadeStartScroll: 0,
    fadeCompleteScroll: 300
  };

  const grid = new InfrastructureGrid(canvas, config);

  // Expose for debugging
  window.infrastructureGrid = grid;
});
```

- [ ] **Step 2: Verify homepage is unchanged**

Start the static server (see Task 2 Step 1 if not yet created — for this step `python3 -m http.server 8000` from repo root is fine) and load `http://localhost:8000/index.html`. Expected: faint white grid drifting upward behind the hero exactly as before; `window.infrastructureGrid.config.borderColor === 'rgba(255, 255, 255, 0.025)'` in the console.

- [ ] **Step 3: Commit**

```bash
git add js/infrastructure-grid.js
printf 'feat(grid): read optional data-attribute config on grid canvas\n' > "$TMPDIR/cm.txt"
git commit --no-gpg-sign -F "$TMPDIR/cm.txt"
```

---

### Task 2: `resources.html` skeleton + `css/resources.css` foundation

**Files:**
- Create: `resources.html`
- Create: `css/resources.css`
- Create: `.claude/launch.json` (static preview server, if absent)

**Interfaces:**
- Consumes: Task 1's data-attribute grid config.
- Produces: page skeleton with mount points `#resourcesFeatured`, `#resourcesGrid`, `#resourcesStatus`, tab buttons `.rc-tab[data-bucket]`, and JSON block `#resources-data` — Task 3/4 render into these. CSS class prefix `rc-`.

- [ ] **Step 1: Create `.claude/launch.json`**

```json
{
  "version": "0.0.1",
  "configurations": [
    {
      "name": "static-site",
      "runtimeExecutable": "python3",
      "runtimeArgs": ["-m", "http.server", "8000"],
      "port": 8000
    }
  ]
}
```

- [ ] **Step 2: Create `resources.html`**

Full file (footer markup is copied from `publications.html` with the Company column's Publications link swapped to Resources):

```html
<!DOCTYPE html>
<html lang="en">

<head>
    <!-- Analytics load only after cookie consent (DPDP/GDPR) -->
    <script src="js/consent.js" defer></script>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Resources — Insights, Whitepapers & News | Kanan Labs</title>

    <meta name="description" content="Insights, whitepapers, and news from Kanan Labs on trade evidence, customs readiness, marine cargo claims, and India's regulatory landscape.">
    <link rel="canonical" href="https://kananlabs.in/resources.html">
    <meta name="robots" content="index,follow,max-image-preview:large">

    <meta property="og:type" content="website">
    <meta property="og:site_name" content="Kanan Labs">
    <meta property="og:url" content="https://kananlabs.in/resources.html">
    <meta property="og:title" content="Resources — Insights, Whitepapers & News | Kanan Labs">
    <meta property="og:description" content="Insights, whitepapers, and news from Kanan Labs on trade evidence, customs readiness, marine cargo claims, and India's regulatory landscape.">
    <meta property="og:image" content="https://kananlabs.in/KANANLABS-LOGO-SET/Link-Previews/01-KANANLABS.png">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:alt" content="Kanan Labs Resources">

    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="Resources — Insights, Whitepapers & News | Kanan Labs">
    <meta name="twitter:description" content="Insights, whitepapers, and news from Kanan Labs on trade evidence, customs readiness, and India's regulatory landscape.">
    <meta name="twitter:image" content="https://kananlabs.in/KANANLABS-LOGO-SET/Link-Previews/01-KANANLABS.png">

    <link rel="icon" type="image/png" href="assets/images/KANAN-LABS-WEBSITELOGO.png">

    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "CollectionPage",
          "@id": "https://kananlabs.in/resources.html#collection",
          "url": "https://kananlabs.in/resources.html",
          "name": "Resources — Kanan Labs",
          "description": "Insights, whitepapers, and news from Kanan Labs.",
          "isPartOf": { "@id": "https://kananlabs.in/#website" },
          "publisher": { "@id": "https://kananlabs.in/#organization" }
        },
        {
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://kananlabs.in/" },
            { "@type": "ListItem", "position": 2, "name": "Resources", "item": "https://kananlabs.in/resources.html" }
          ]
        }
      ]
    }
    </script>

    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="css/styles-v2.css?v=21">
    <link rel="stylesheet" href="css/staggered-menu.css">
    <link rel="stylesheet" href="css/footer.css?v=3">
    <link rel="stylesheet" href="css/contact-panel.css?v=1">
    <link rel="stylesheet" href="css/resources.css?v=1">
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js"></script>
</head>

<body class="resources-page">
    <!-- Staggered menu injected by staggered-menu.js -->

    <!-- Orange infrastructure grid on cream -->
    <canvas id="infrastructure-grid" data-border-color="rgba(219, 74, 43, 0.07)" aria-hidden="true"></canvas>

    <main class="rc-main">

        <header class="rc-masthead">
            <h1 class="rc-masthead__title">Resources</h1>
            <p class="rc-masthead__subline">Operational insights, substantive whitepapers, and news from the team
                building the evidence layer for Indian trade.</p>
        </header>

        <nav class="rc-tabs" aria-label="Resource categories">
            <button class="rc-tab is-active" type="button" data-bucket="all" aria-pressed="true">All</button>
            <button class="rc-tab" type="button" data-bucket="insight" aria-pressed="false">Insights</button>
            <button class="rc-tab" type="button" data-bucket="whitepaper" aria-pressed="false">Whitepapers</button>
            <button class="rc-tab" type="button" data-bucket="news" aria-pressed="false">News &amp; Press</button>
        </nav>

        <p class="rc-status" id="resourcesStatus" role="status" hidden></p>

        <section class="rc-featured" id="resourcesFeatured" aria-label="Featured publication"></section>

        <section class="rc-grid" id="resourcesGrid" aria-label="Publications"></section>

    </main>

    <script type="application/json" id="resources-data">
    {
      "items": []
    }
    </script>

    <footer class="kl-footer">
        <div class="kl-footer__inner">
            <div class="kl-footer__content">
                <div class="kl-footer__brand">
                    <img src="KANANLABS-LOGO-SET/KANANLABS-LETTERLOGO-BLUEBG.png" alt="Kanan Labs"
                        class="kl-footer__logo" width="500" height="500" loading="lazy" decoding="async" draggable="false">
                    <p class="kl-footer__tagline">India's AI Governance Intelligence</p>
                    <div>
                        <p class="kl-footer__nl-label">Weekly Brief</p>
                        <form class="kl-footer__nl-form" id="footerNewsletterForm">
                            <input type="email" class="kl-footer__nl-input" placeholder="Your email address"
                                autocomplete="email" required>
                            <button type="submit" class="kl-footer__nl-submit">Subscribe</button>
                        </form>
                    </div>
                    <button class="kl-footer__consult" type="button"
                        onclick="if(window.contactPanel) window.contactPanel.open()">
                        Schedule Consultation →
                    </button>
                </div>
                <div class="kl-footer__sitemap">
                    <div class="kl-footer__col">
                        <h4 class="kl-footer__col-heading">Advisory</h4>
                        <ul class="kl-footer__col-links">
                            <li><a href="index.html#advisory">Regulatory Trajectory</a></li>
                            <li><a href="index.html#advisory">Incentive Structuring</a></li>
                            <li><a href="index.html#advisory">Governance Readiness</a></li>
                            <li><a href="index.html#advisory">Cross-Border Advisory</a></li>
                        </ul>
                    </div>
                    <div class="kl-footer__col">
                        <h4 class="kl-footer__col-heading">Company</h4>
                        <ul class="kl-footer__col-links">
                            <li><a href="about.html">About Us</a></li>
                            <li><a href="sector-watch.html">Sector Watch</a></li>
                            <li><a href="resources.html">Resources</a></li>
                            <li><a href="mailto:sreenath@kananlabs.in">Contact</a></li>
                        </ul>
                    </div>
                    <div class="kl-footer__col">
                        <h4 class="kl-footer__col-heading">Follow</h4>
                        <ul class="kl-footer__col-links">
                            <li><a href="https://www.linkedin.com/in/sreenathgovindarajan" target="_blank"
                                    rel="noopener">LinkedIn</a></li>
                            <li><a href="https://x.com/indiaAItracker" target="_blank" rel="noopener">Twitter</a></li>
                            <li><a href="https://github.com/sreenathgov" target="_blank" rel="noopener">GitHub</a></li>
                        </ul>
                    </div>
                    <div class="kl-footer__col">
                        <h4 class="kl-footer__col-heading">Legal</h4>
                        <ul class="kl-footer__col-links">
                            <li><a href="privacy-policy.html">Privacy Policy</a></li>
                            <li><a href="disclaimers.html">Disclaimers</a></li>
                        </ul>
                    </div>
                </div>
            </div>
            <div class="kl-footer__watermark">
                <img src="KANANLABS-LOGO-SET/TRANSPARENT-of-KANAN-LABS-WEBSITELOGO.png" alt=""
                    class="kl-footer__watermark-img" width="1584" height="396" loading="lazy" decoding="async"
                    aria-hidden="true" draggable="false">
            </div>
        </div>
    </footer>

    <script src="js/infrastructure-grid.js"></script>
    <script src="js/resources.js"></script>
    <script src="js/contact-panel.js"></script>
    <script src="js/staggered-menu.js"></script>
</body>

</html>
```

- [ ] **Step 3: Create `css/resources.css`**

```css
/* ============================================================
   Resources catalog page — cream canvas, orange grid, editorial cards
   Class prefix: rc-
   ============================================================ */

html {
    height: auto !important;
    overflow: auto !important;
}

body.resources-page {
    height: auto !important;
    overflow: auto !important;
    min-height: 100vh;
    background: var(--brand-cream);
    color: var(--brand-navy);
}

/* Grid canvas sits behind everything, above the cream body */
body.resources-page #infrastructure-grid {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 0;
    pointer-events: none;
}

.rc-main {
    position: relative;
    z-index: 1;
    max-width: 1180px;
    margin: 0 auto;
    padding: 9.5rem 2rem 6rem;
}

/* --- Masthead --- */

.rc-masthead {
    margin-bottom: 3rem;
}

.rc-masthead__title {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-weight: 600;
    font-size: clamp(3rem, 7vw, 4.75rem);
    line-height: 1.05;
    color: var(--brand-navy);
    margin: 0 0 1rem;
}

.rc-masthead__subline {
    font-family: 'Inter', sans-serif;
    font-size: 1rem;
    font-weight: 400;
    line-height: 1.65;
    color: rgba(10, 47, 82, 0.65);
    max-width: 560px;
    margin: 0;
}

/* --- Tabs --- */

.rc-tabs {
    display: flex;
    gap: 2rem;
    border-bottom: 1px solid rgba(10, 47, 82, 0.18);
    margin-bottom: 3rem;
    flex-wrap: wrap;
}

.rc-tab {
    appearance: none;
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
    padding: 0.75rem 0.125rem;
    font-family: 'Inter', sans-serif;
    font-size: 0.9375rem;
    font-weight: 500;
    color: rgba(10, 47, 82, 0.55);
    cursor: pointer;
    transition: color 0.15s ease, border-color 0.15s ease;
}

.rc-tab:hover {
    color: var(--brand-navy);
}

.rc-tab.is-active {
    color: var(--brand-navy);
    border-bottom-color: #db4a2b;
}

.rc-tab:focus-visible {
    outline: 2px solid #db4a2b;
    outline-offset: 3px;
}

/* --- Status / empty state --- */

.rc-status {
    font-family: 'Inter', sans-serif;
    font-size: 0.9375rem;
    color: rgba(10, 47, 82, 0.6);
    padding: 2rem 0 4rem;
    margin: 0;
}

/* --- Featured card --- */

.rc-featured {
    margin-bottom: 3.5rem;
}

.rc-featured__card {
    display: grid;
    grid-template-columns: 55% 1fr;
    background: #FBF5E4;
    border: 1px solid rgba(10, 47, 82, 0.18);
    border-radius: 3px;
    overflow: hidden;
    text-decoration: none;
    color: inherit;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.rc-featured__card:hover {
    transform: translateY(-3px);
    box-shadow: 0 14px 34px rgba(10, 47, 82, 0.12);
}

.rc-featured__media {
    position: relative;
    overflow: hidden;
    min-height: 320px;
}

.rc-featured__body {
    padding: 2.25rem 2.5rem;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 0.875rem;
}

.rc-featured__eyebrow {
    font-family: 'Inter', sans-serif;
    font-size: 0.6875rem;
    font-weight: 600;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: #db4a2b;
}

.rc-featured__title {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-weight: 600;
    font-size: clamp(1.625rem, 3vw, 2.25rem);
    line-height: 1.15;
    color: var(--brand-navy);
    margin: 0;
    transition: color 0.15s ease;
}

.rc-featured__card:hover .rc-featured__title {
    color: #db4a2b;
}

.rc-featured__desc {
    font-family: 'Inter', sans-serif;
    font-size: 0.9375rem;
    line-height: 1.65;
    color: rgba(10, 47, 82, 0.65);
    margin: 0;
}

.rc-featured__cta {
    font-family: 'Inter', sans-serif;
    font-size: 0.875rem;
    font-weight: 600;
    color: #db4a2b;
}

/* --- Card grid --- */

.rc-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 2rem;
}

/* --- Standard card --- */

.rc-card {
    display: flex;
    flex-direction: column;
    background: #FBF5E4;
    border: 1px solid rgba(10, 47, 82, 0.18);
    border-radius: 3px;
    overflow: hidden;
    text-decoration: none;
    color: inherit;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.rc-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 28px rgba(10, 47, 82, 0.12);
}

.rc-card:focus-visible,
.rc-featured__card:focus-visible {
    outline: 2px solid #db4a2b;
    outline-offset: 3px;
}

.rc-card__media {
    position: relative;
    aspect-ratio: 16 / 9;
    overflow: hidden;
}

.rc-card__media img,
.rc-featured__media img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: transform 0.35s ease;
}

.rc-card:hover .rc-card__media img,
.rc-featured__card:hover .rc-featured__media img {
    transform: scale(1.03);
}

/* Branded fallback tile: navy field, centered orange mark */
.rc-media--fallback {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    background: var(--brand-navy);
}

.rc-media--fallback img {
    width: 38% !important;
    height: auto !important;
    object-fit: contain !important;
    transform: none !important;
}

.rc-card__body {
    display: flex;
    flex-direction: column;
    gap: 0.625rem;
    padding: 1.25rem 1.375rem 1.5rem;
    flex: 1;
}

.rc-card__meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    flex-wrap: wrap;
}

.rc-pill {
    font-family: 'Inter', sans-serif;
    font-size: 0.625rem;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #db4a2b;
    border: 1px solid rgba(219, 74, 43, 0.55);
    border-radius: 2px;
    padding: 0.25rem 0.5rem;
    background: transparent;
    white-space: nowrap;
}

.rc-card__date {
    font-family: 'Inter', sans-serif;
    font-size: 0.75rem;
    color: rgba(10, 47, 82, 0.5);
    white-space: nowrap;
}

.rc-card__doctag {
    font-family: 'Inter', sans-serif;
    font-size: 0.6875rem;
    font-weight: 500;
    color: rgba(10, 47, 82, 0.55);
}

.rc-card__title {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-weight: 600;
    font-size: 1.375rem;
    line-height: 1.2;
    color: var(--brand-navy);
    margin: 0;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    transition: color 0.15s ease;
}

.rc-card:hover .rc-card__title {
    color: #db4a2b;
}

.rc-card__desc {
    font-family: 'Inter', sans-serif;
    font-size: 0.84375rem;
    line-height: 1.6;
    color: rgba(10, 47, 82, 0.65);
    margin: 0;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

/* --- Responsive --- */

@media (max-width: 980px) {
    .rc-grid {
        grid-template-columns: repeat(2, 1fr);
    }

    .rc-featured__card {
        grid-template-columns: 1fr;
    }

    .rc-featured__media {
        aspect-ratio: 16 / 9;
        min-height: 0;
    }
}

@media (max-width: 620px) {
    .rc-main {
        padding: 7.5rem 1.25rem 4rem;
    }

    .rc-grid {
        grid-template-columns: 1fr;
    }

    .rc-tabs {
        gap: 1.25rem;
    }
}
```

- [ ] **Step 4: Verify skeleton in browser**

Start preview server (`static-site`), open `http://localhost:8000/resources.html`. Expected: cream page, faint orange grid drifting upward, "Resources" serif masthead, styled tab row with All active (orange underline), footer intact, staggered menu opens/closes. Empty featured/grid areas (no JS yet beyond empty data). Console: no errors (a `resources.js` 404 is expected until Task 3 — acceptable interim, or create an empty file).

- [ ] **Step 5: Commit**

```bash
git add resources.html css/resources.css .claude/launch.json
printf 'feat(resources): page skeleton with cream + orange grid foundation\n' > "$TMPDIR/cm.txt"
git commit --no-gpg-sign -F "$TMPDIR/cm.txt"
```

---

### Task 3: Sample data + card rendering (`js/resources.js`)

**Files:**
- Create: `js/resources.js`
- Modify: `resources.html` (fill the `#resources-data` JSON block)

**Interfaces:**
- Consumes: mount points and JSON block from Task 2.
- Produces: `renderCatalog(bucket)` internal function used by Task 4's tab logic; card DOM structure `.rc-card` / `.rc-featured__card`.

- [ ] **Step 1: Fill the `#resources-data` block in `resources.html`**

Replace `{ "items": [] }` with:

```json
    {
      "items": [
        {
          "slug": "sb005-invoice-mismatch",
          "bucket": "insight",
          "title": "The SB005 Trap: Why One Formatting Character Freezes an IGST Refund",
          "description": "SB005 fires when the invoice number on the Shipping Bill diverges from GSTR-1 Table 6A by a single character. The fix is a Concordance Table under Public Notice 10/2018.",
          "date": "2026-07-10",
          "image": "added-assets/tw-hero-1280.avif",
          "href": "publications/sb005-invoice-mismatch/",
          "featured": true,
          "meta": {}
        },
        {
          "slug": "marine-claims-evidence",
          "bucket": "insight",
          "title": "Marine Cargo Claims Fail on Evidence, Not Coverage",
          "description": "Insurers rarely reject marine claims for lack of cover — they reject them for evidentiary gaps at the point of loss. A survey-ready evidence position is built before loading, not after damage.",
          "date": "2026-07-03",
          "image": null,
          "href": "publications/marine-claims-evidence/",
          "featured": false,
          "meta": {}
        },
        {
          "slug": "ev-battery-un383-paper-trail",
          "bucket": "insight",
          "title": "EV Battery Exports: The UN 38.3 Paper Trail Nobody Owns",
          "description": "Lithium cell exports require a UN 38.3 test summary that neither the freight forwarder nor the CHA is contractually responsible for producing. The gap sits with the exporter.",
          "date": "2026-06-24",
          "image": "added-assets/sectorwatchNEWBG-bg-1920.webp",
          "href": "publications/ev-battery-un383-paper-trail/",
          "featured": false,
          "meta": {}
        },
        {
          "slug": "evidence-layer-before-filing-layer",
          "bucket": "insight",
          "title": "Why We Built an Evidence Layer Before a Filing Layer",
          "description": "Filing is a licensed activity; evidence is not. Kanan Labs prepares the readiness packet your licensed CHA files — the architecture follows the regulatory boundary.",
          "date": "2026-06-12",
          "image": null,
          "href": "publications/evidence-layer-before-filing-layer/",
          "featured": false,
          "meta": {}
        },
        {
          "slug": "kl-handbook-india-ai-regulations",
          "bucket": "whitepaper",
          "title": "Handbook on India's AI Regulations",
          "description": "A consolidated reference on India's AI regulatory landscape — statutes, advisories, sectoral guidance, and the compliance posture they demand from operating companies.",
          "date": "2026-05-30",
          "image": "added-assets/kanan-hero-poster.jpg",
          "href": "dossiers/kl-handbook-india-ai-regulations.pdf",
          "featured": false,
          "meta": { "pages": 48 }
        },
        {
          "slug": "four-state-readiness-model",
          "bucket": "whitepaper",
          "title": "The Four-State Readiness Model for Export Evidence",
          "description": "A framework for scoring every export document set as ready, ready-with-gaps, blocked, or unverifiable — and the operational triggers each state demands.",
          "date": "2026-05-14",
          "image": null,
          "href": "dossiers/kl-handbook-india-ai-regulations.pdf",
          "featured": false,
          "meta": { "pages": 32 }
        },
        {
          "slug": "tradewatch-early-access",
          "bucket": "news",
          "title": "Kanan Labs Opens TradeWatch Early Access",
          "description": "TradeWatch early access is now open to export managers and finance teams. The readiness check covers IGST refund exposure across live Shipping Bills.",
          "date": "2026-07-01",
          "image": "added-assets/TW - Page underbanner PNG.png",
          "href": "tradewatch.html",
          "featured": false,
          "meta": { "source": "Kanan Labs" }
        },
        {
          "slug": "founder-interview-trade-evidence",
          "bucket": "news",
          "title": "Founder Interview: The Case for a Trade Evidence Layer",
          "description": "Sreenath Govindarajan on why fragmented, evidence-intensive trade needs a defensible and continuously updated evidence position — and where Kanan Labs fits.",
          "date": "2026-06-18",
          "image": null,
          "href": "https://www.linkedin.com/in/sreenathgovindarajan",
          "featured": false,
          "meta": { "source": "LinkedIn" }
        }
      ]
    }
```

- [ ] **Step 2: Create `js/resources.js`**

```js
/**
 * Resources catalog — renders the embedded #resources-data JSON into
 * the featured slot and card grid, with tab filtering + hash deep links.
 * All dynamic text goes through textContent (never innerHTML).
 */
(function () {
  'use strict';

  const BUCKET_LABELS = Object.freeze({
    insight: 'Insight',
    whitepaper: 'Whitepaper',
    news: 'News & Press'
  });

  const VALID_BUCKETS = Object.freeze(['insight', 'whitepaper', 'news']);
  const FALLBACK_TILE_SRC = 'KANANLABS-LOGO-SET/ORANGE of KANAN-LABS-WEBSITELOGO.png';

  const els = {
    featured: document.getElementById('resourcesFeatured'),
    grid: document.getElementById('resourcesGrid'),
    status: document.getElementById('resourcesStatus'),
    tabs: Array.from(document.querySelectorAll('.rc-tab'))
  };

  // ---------- data ----------

  function readItems() {
    const block = document.getElementById('resources-data');
    if (!block) return null;
    try {
      const parsed = JSON.parse(block.textContent);
      if (!parsed || !Array.isArray(parsed.items)) return null;
      return parsed.items.filter(isValidItem);
    } catch (err) {
      console.error('resources-data JSON is malformed:', err);
      return null;
    }
  }

  function isValidItem(item) {
    return Boolean(
      item &&
      typeof item.title === 'string' && item.title.trim() &&
      typeof item.href === 'string' && item.href.trim() &&
      VALID_BUCKETS.includes(item.bucket)
    );
  }

  function isExternal(href) {
    return /^https?:\/\//i.test(href);
  }

  function formatDate(iso) {
    if (typeof iso !== 'string') return '';
    const date = new Date(iso + 'T00:00:00');
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  // ---------- DOM builders ----------

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function buildMedia(item, mediaClass) {
    const media = el('div', mediaClass);
    if (item.image) {
      const img = document.createElement('img');
      img.src = item.image;
      img.alt = '';
      img.loading = 'lazy';
      img.decoding = 'async';
      img.addEventListener('error', () => {
        media.replaceChildren(buildFallbackMark());
        media.classList.add('rc-media--fallback');
      }, { once: true });
      media.appendChild(img);
    } else {
      media.classList.add('rc-media--fallback');
      media.appendChild(buildFallbackMark());
    }
    return media;
  }

  function buildFallbackMark() {
    const img = document.createElement('img');
    img.src = FALLBACK_TILE_SRC;
    img.alt = '';
    img.loading = 'lazy';
    img.decoding = 'async';
    return img;
  }

  function buildMetaRow(item) {
    const row = el('div', 'rc-card__meta');
    row.appendChild(el('span', 'rc-pill', BUCKET_LABELS[item.bucket]));

    const right = el('span', 'rc-card__date');
    const parts = [];
    if (item.bucket === 'whitepaper' && item.meta && Number.isFinite(item.meta.pages)) {
      parts.push('PDF · ' + item.meta.pages + ' pages');
    }
    if (item.bucket === 'news' && item.meta && item.meta.source) {
      parts.push(String(item.meta.source) + (isExternal(item.href) ? ' ↗' : ''));
    }
    const dateText = formatDate(item.date);
    if (dateText) parts.push(dateText);
    right.textContent = parts.join('  ·  ');
    row.appendChild(right);
    return row;
  }

  function linkAttrs(anchor, item) {
    anchor.href = item.href;
    if (isExternal(item.href)) {
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
    }
  }

  function buildCard(item) {
    const card = el('a', 'rc-card');
    linkAttrs(card, item);
    card.appendChild(buildMedia(item, 'rc-card__media'));

    const body = el('div', 'rc-card__body');
    body.appendChild(buildMetaRow(item));
    body.appendChild(el('h3', 'rc-card__title', item.title));
    if (item.description) {
      body.appendChild(el('p', 'rc-card__desc', item.description));
    }
    card.appendChild(body);
    return card;
  }

  function buildFeatured(item) {
    const card = el('a', 'rc-featured__card');
    linkAttrs(card, item);
    card.appendChild(buildMedia(item, 'rc-featured__media'));

    const body = el('div', 'rc-featured__body');
    body.appendChild(el('span', 'rc-featured__eyebrow', 'Featured'));
    body.appendChild(el('h2', 'rc-featured__title', item.title));
    if (item.description) {
      body.appendChild(el('p', 'rc-featured__desc', item.description));
    }
    const dateText = formatDate(item.date);
    if (dateText) body.appendChild(el('span', 'rc-card__date', dateText));
    body.appendChild(el('span', 'rc-featured__cta', 'Read →'));
    card.appendChild(body);
    return card;
  }

  // ---------- rendering ----------

  function showStatus(message) {
    if (!els.status) return;
    els.status.textContent = message;
    els.status.hidden = !message;
  }

  function renderCatalog(items, bucket) {
    if (!els.featured || !els.grid) return;

    const featuredItem = bucket === 'all' ? items.find(i => i.featured === true) : undefined;
    const gridItems = items
      .filter(i => bucket === 'all' ? i !== featuredItem : i.bucket === bucket)
      .slice()
      .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));

    els.featured.replaceChildren(...(featuredItem ? [buildFeatured(featuredItem)] : []));
    els.grid.replaceChildren(...gridItems.map(buildCard));

    showStatus(gridItems.length || featuredItem ? '' : 'Nothing published here yet — check back soon.');
  }

  // ---------- init (tabs wired in Task 4) ----------

  const items = readItems();
  if (items === null) {
    showStatus('Our publications are being prepared. Please check back shortly.');
  } else {
    window.__resourcesRender = (bucket) => renderCatalog(items, bucket);
    window.__resourcesRender('all');
  }
})();
```

- [ ] **Step 3: Verify rendering in browser**

Reload `http://localhost:8000/resources.html`. Expected: featured SB005 card (image left, Featured eyebrow, serif title, Read →); grid of 7 cards sorted newest-first; imageless cards (marine, evidence-layer, four-state, founder-interview) show navy tiles with the orange Kanan mark; whitepaper cards show "PDF · n pages"; LinkedIn news card shows "LinkedIn ↗" and opens in a new tab. Hover: lift, orange title, image zoom. Console clean.

- [ ] **Step 4: Commit**

```bash
git add resources.html js/resources.js
printf 'feat(resources): sample data + featured and card grid rendering\n' > "$TMPDIR/cm.txt"
git commit --no-gpg-sign -F "$TMPDIR/cm.txt"
```

---

### Task 4: Tab filtering, hash deep links, states

**Files:**
- Modify: `js/resources.js` (replace the init block)

**Interfaces:**
- Consumes: `renderCatalog(items, bucket)` and `els.tabs` from Task 3.
- Produces: hash contract `#insights` / `#whitepapers` / `#news` (plural, per menu sub-links) ↔ buckets `insight`/`whitepaper`/`news`; unknown/absent hash → `all`. Task 5's menu sub-links rely on this contract.

- [ ] **Step 1: Replace the init block at the bottom of `js/resources.js`**

Replace everything from `// ---------- init (tabs wired in Task 4) ----------` downward (inside the IIFE) with:

```js
  // ---------- tabs + hash ----------

  const HASH_TO_BUCKET = Object.freeze({
    '#insights': 'insight',
    '#whitepapers': 'whitepaper',
    '#news': 'news'
  });
  const BUCKET_TO_HASH = Object.freeze({
    insight: '#insights',
    whitepaper: '#whitepapers',
    news: '#news'
  });

  function bucketFromHash() {
    return HASH_TO_BUCKET[window.location.hash] || 'all';
  }

  function setActiveTab(bucket) {
    els.tabs.forEach(tab => {
      const active = tab.dataset.bucket === bucket;
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-pressed', String(active));
    });
  }

  function activate(items, bucket, updateHash) {
    setActiveTab(bucket);
    renderCatalog(items, bucket);
    if (updateHash) {
      const hash = BUCKET_TO_HASH[bucket] || '';
      history.replaceState(null, '', hash || window.location.pathname);
    }
  }

  // ---------- init ----------

  const items = readItems();
  if (items === null) {
    showStatus('Our publications are being prepared. Please check back shortly.');
  } else {
    els.tabs.forEach(tab => {
      tab.addEventListener('click', () => activate(items, tab.dataset.bucket, true));
    });
    window.addEventListener('hashchange', () => activate(items, bucketFromHash(), false));
    activate(items, bucketFromHash(), false);
  }
})();
```

(The temporary `window.__resourcesRender` hook from Task 3 is removed.)

- [ ] **Step 2: Verify behaviors in browser**

- Click each tab: grid filters, featured only on All, active underline moves, URL hash updates (`#insights` etc., All clears it).
- Load `http://localhost:8000/resources.html#whitepapers` fresh: Whitepapers tab active, 2 cards.
- Load with `#garbage`: All tab active.
- Temporarily break the JSON (add a trailing comma) → friendly status message, no blank page; revert.
- Empty-bucket check: not reachable with sample data — temporarily change one bucket filter in DevTools or trust the code path; skip destructive edits.

- [ ] **Step 3: Commit**

```bash
git add js/resources.js
printf 'feat(resources): tab filtering with hash deep links and states\n' > "$TMPDIR/cm.txt"
git commit --no-gpg-sign -F "$TMPDIR/cm.txt"
```

---

### Task 5: Staggered menu — Resources item with sub-links

**Files:**
- Modify: `js/staggered-menu.js` (items array ~line 875–882; `buildPanel` ~line 237–267; open animation ~line 390–470)
- Modify: `css/staggered-menu.css` (append sub-item styles)

**Interfaces:**
- Consumes: hash contract from Task 4 (`resources.html#insights|#whitepapers|#news`).
- Produces: optional `subItems: [{label, link}]` on menu items; DOM `ul.sm-panel-subList > li > a.sm-panel-subItem`.

- [ ] **Step 1: Swap the Publications menu item**

In the default options items array (~line 875), replace

```js
      { label: 'Publications', ariaLabel: 'View publications', link: 'publications.html' },
```

with

```js
      {
        label: 'Resources', ariaLabel: 'Browse resources', link: 'resources.html',
        subItems: [
          { label: 'Insights', link: 'resources.html#insights' },
          { label: 'Whitepapers', link: 'resources.html#whitepapers' },
          { label: 'News & Press', link: 'resources.html#news' }
        ]
      },
```

- [ ] **Step 2: Render sub-items in `buildPanel`**

In the `this.options.items.forEach((item, idx) => { … })` loop, after `li.appendChild(link);` and before `menuList.appendChild(li);`, insert:

```js
        // Optional smaller sub-links beneath a parent item
        if (Array.isArray(item.subItems) && item.subItems.length) {
          const subList = document.createElement('ul');
          subList.className = 'sm-panel-subList';
          subList.setAttribute('role', 'list');

          item.subItems.forEach(sub => {
            const subLi = document.createElement('li');
            const subLink = document.createElement('a');
            subLink.className = 'sm-panel-subItem';
            subLink.href = sub.link;
            subLink.textContent = sub.label;
            subLi.appendChild(subLink);
            subList.appendChild(subLi);
          });

          li.appendChild(subList);
        }
```

- [ ] **Step 3: Animate sub-items on open**

In the open animation, after `const socialLinks = Array.from(panel.querySelectorAll('.sm-socials-link'));` (~line 393) add:

```js
    const subItemEls = Array.from(panel.querySelectorAll('.sm-panel-subItem'));
```

After the `if (socialLinks.length) { gsap.set(…) }` initial-state block (~line 411–413) add:

```js
    if (subItemEls.length) {
      gsap.set(subItemEls, { y: 20, opacity: 0 });
    }
```

After the items tween block (immediately after the `numberEls` tween's closing brace, ~line 468, still inside `if (itemEls.length)`) — or as its own block right after it — add:

```js
    if (subItemEls.length) {
      const subStart = panelInsertTime + panelDuration * 0.35;
      tl.to(
        subItemEls,
        {
          y: 0,
          opacity: 1,
          duration: 0.5,
          ease: 'power3.out',
          stagger: { each: 0.06, from: 'start' }
        },
        subStart
      );
    }
```

- [ ] **Step 4: Append sub-item styles to `css/staggered-menu.css`**

```css
/* --- Sub-links beneath a parent menu item (e.g. Resources) --- */

.sm-panel-subList {
  list-style: none;
  margin: 0.375rem 0 0.75rem;
  padding: 0 0 0 0.25rem;
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.sm-panel-subItem {
  font-family: 'Inter', sans-serif;
  font-size: 0.9375rem;
  font-weight: 500;
  color: rgba(244, 235, 208, 0.65);
  text-decoration: none;
  transition: color 0.15s ease;
}

.sm-panel-subItem:hover {
  color: #db4a2b;
}

.sm-panel-subItem:focus-visible {
  outline: 2px solid #db4a2b;
  outline-offset: 3px;
}

@media (max-width: 640px) {
  .sm-panel-subList {
    gap: 1rem;
  }
}
```

- [ ] **Step 5: Verify menu on multiple pages**

- `resources.html`: open menu → "Resources" big item with Insights / Whitepapers / News & Press fading in beneath it; clicking "Whitepapers" navigates to the Whitepapers tab (same-page hash: menu closes? clicking a link closes the overlay via navigation — same-page hash links may leave the panel open; verify and, if the panel stays open, add a click handler on `.sm-panel-subItem` that calls `this.closeMenu()`).
- `index.html`: menu items otherwise unchanged; no console errors; Resources appears in place of Publications.

- [ ] **Step 6: Commit**

```bash
git add js/staggered-menu.js css/staggered-menu.css
printf 'feat(menu): Resources item with Insights/Whitepapers/News sub-links\n' > "$TMPDIR/cm.txt"
git commit --no-gpg-sign -F "$TMPDIR/cm.txt"
```

---

### Task 6: Full verification pass

**Files:** none (fix-forward: any defect found is fixed and amended into a `fix(resources):` commit)

- [ ] **Step 1: Responsive** — 1280px (3-col grid, horizontal featured), 768px (2-col, stacked featured), 375px (1-col). No horizontal scroll at any width.
- [ ] **Step 2: Reduced motion** — emulate `prefers-reduced-motion: reduce` (DevTools rendering panel): grid canvas static (class already guards), page still fully usable.
- [ ] **Step 3: Keyboard** — Tab reaches tabs (orange focus ring), featured card, every grid card, footer links; Enter activates.
- [ ] **Step 4: Console + network** — no JS errors; no 404s (images, fonts, scripts).
- [ ] **Step 5: Cross-page regression** — `index.html` grid still white-on-navy; menu works on `index.html`, `about.html`, `tradewatch.html`.
- [ ] **Step 6: Commit any fixes**

```bash
git add -A resources.html css/resources.css js/resources.js js/staggered-menu.js css/staggered-menu.css
printf 'fix(resources): verification pass fixes\n' > "$TMPDIR/cm.txt"
git commit --no-gpg-sign -F "$TMPDIR/cm.txt"
```

(Skip the commit if nothing changed.)
