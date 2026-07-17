# SectorWatch page — content revamp handoff

**For:** Claude Code, working in this repo (`india-ai-tracker`).
**File to edit:** `sector-watch.html` (repo root). A built copy exists at `dist/sector-watch.html` — see §0.
**Nature of task:** a **content/copy swap only.** This is a one-off. **Do not restructure, restyle, or re-layout anything.** Preserve every CSS class, wrapper `div`, grid, icon SVG, and id exactly as-is. Only the text inside elements changes, plus the removal of specific call-to-action anchors as spelled out below.

---

## 0 · Why this change (context)

The current page sells SectorWatch as a **live product taking pilot signups.** That is wrong for where the company is:

- **TradeWatch is the MVP / wedge product.** SectorWatch is the **long-horizon platform** — not yet in development, ~18 months out, and **not seeking pilot customers.**
- So the page must read as **vision**, not a product launch: confident and concrete, but clearly future-facing. Remove every "Request Early Access" call-to-action, and stop calling SectorWatch the "flagship product."
- Positioning of the product itself is being simplified: SectorWatch = **AI-native supply chain risk intelligence** — one system that watches every dimension of supply-chain risk.

**Build note (§0):** confirm how `dist/sector-watch.html` is produced. If there is a build step (check `package.json` / any build script / the `dist/` generation in this repo), edit `sector-watch.html` and re-run the build so `dist/` regenerates. If `dist/` is committed and hand-maintained (no build step), apply the **same** edits to both `sector-watch.html` and `dist/sector-watch.html`. Do not let the two drift.

---

## 1 · HERO (around lines 594–603)

**Find:**

```html
        <div class="sw-hero__content">
            <p class="sw-hero__eyebrow">Kanan&rsquo;s Flagship Product</p>
            <h1 class="sw-hero__title">Sector Watch</h1>
            <p class="sw-hero__subhead">Trade Diagnostic &amp; Decision-Support System.</p>
            <p class="sw-hero__tagline">Built for firms operating in trade-exposed value chains &mdash; reducing decision friction across regulation, market access, evidence posture, and routing.</p>
            <div class="sw-hero__actions">
                <a href="#access" class="sw-btn-primary">Request Early Access</a>
                <a href="#vision" class="sw-btn-secondary">Read the vision &darr;</a>
            </div>
        </div>
```

**Replace with:**

```html
        <div class="sw-hero__content">
            <p class="sw-hero__eyebrow">The Long-Horizon Platform</p>
            <h1 class="sw-hero__title">Sector Watch</h1>
            <p class="sw-hero__subhead">AI-native supply chain risk intelligence.</p>
            <p class="sw-hero__tagline">One system that watches every dimension of your supply-chain risk &mdash; and warns you what is changing before it costs you.</p>
            <div class="sw-hero__actions">
                <a href="#klSectors" class="sw-btn-secondary">Read the vision &darr;</a>
            </div>
        </div>
```

Notes:
- The primary "Request Early Access" button is **removed**; the secondary "Read the vision" link stays as the only action.
- Its `href` is changed from `#vision` (no such id exists on the page) to `#klSectors` so the scroll cue actually lands on the "what it watches" section. If you prefer, `#founderNote` also works.
- **Tagline alternatives** (founder may swap — pick one, keep it one line):
  - B — "Continuous intelligence on the regulatory, geopolitical, and operational risks moving through your supply chain."
  - C (simplest) — "Know what is changing in your supply chain &mdash; before it becomes a problem."

---

## 2 · WHAT IT DOES (around lines 613–621)

**Find:**

```html
                <div class="sw-what__left">
                    <p class="sw-section-label">What it does</p>
                    <h2 class="sw-what__headline">A decision system for firms operating under trade and regulatory pressure.</h2>
                </div>
                <div class="sw-what__divider" aria-hidden="true"></div>
                <div class="sw-what__body">
                    <p>Sector Watch is being built for firms that need to understand how trade policy, regulatory change, and market-access conditions affect specific commercial decisions.</p>
                    <p>The system is designed to answer a practical question with clarity: what is <strong>open, blocked, conditional, or still unclear</strong> for this firm, this product, and this corridor.</p>
                </div>
```

**Replace with:**

```html
                <div class="sw-what__left">
                    <p class="sw-section-label">What it does</p>
                    <h2 class="sw-what__headline">One place to see every risk moving through your supply chain.</h2>
                </div>
                <div class="sw-what__divider" aria-hidden="true"></div>
                <div class="sw-what__body">
                    <p>Sector Watch watches your supply chain across every dimension of risk &mdash; regulatory, geopolitical, jurisdictional, geographic, and shipment-level &mdash; continuously, not episodically.</p>
                    <p>It answers one practical question: for this firm, this product, this corridor &mdash; what is <strong>open, blocked, conditional, or still unclear</strong>.</p>
                </div>
```

(The four-state "open / blocked / conditional / unclear" language is deliberate — keep it.)

---

## 3 · WHO IT IS FOR (around lines 634–650)

Keep the three-card grid and all classes. Swap only the titles/bodies.

**Find:**

```html
                <div class="sw-who__card">
                    <p class="sw-who__card-num">01</p>
                    <h3 class="sw-who__card-title">Cross-border manufacturers and exporters</h3>
                    <p class="sw-who__card-body">Firms navigating shifting trade rules, tariff exposure, and market-access conditions across multiple jurisdictions simultaneously.</p>
                </div>

                <div class="sw-who__card">
                    <p class="sw-who__card-num">02</p>
                    <h3 class="sw-who__card-title">Firms evaluating market entry or compliance exposure</h3>
                    <p class="sw-who__card-body">Companies assessing what evidence, certifications, or regulatory alignment is required before entering or expanding in a regulated market.</p>
                </div>

                <div class="sw-who__card">
                    <p class="sw-who__card-num">03</p>
                    <h3 class="sw-who__card-title">Firms in trade-exposed value chains</h3>
                    <p class="sw-who__card-body">Organisations whose supply chains, inputs, or outputs are directly affected by trade policy, industrial incentives, or geopolitical pressure.</p>
                </div>
```

**Replace with:**

```html
                <div class="sw-who__card">
                    <p class="sw-who__card-num">01</p>
                    <h3 class="sw-who__card-title">Cross-border manufacturers and exporters</h3>
                    <p class="sw-who__card-body">Firms moving goods across borders under shifting tariffs, trade rules, and market-access conditions in several jurisdictions at once.</p>
                </div>

                <div class="sw-who__card">
                    <p class="sw-who__card-num">02</p>
                    <h3 class="sw-who__card-title">Firms entering or expanding in regulated markets</h3>
                    <p class="sw-who__card-body">Companies weighing the evidence, certifications, and regulatory alignment a market demands &mdash; before they commit capital to it.</p>
                </div>

                <div class="sw-who__card">
                    <p class="sw-who__card-num">03</p>
                    <h3 class="sw-who__card-title">Firms in trade-exposed value chains</h3>
                    <p class="sw-who__card-body">Organisations whose suppliers, inputs, or outputs sit directly in the path of trade policy, industrial incentives, or geopolitical pressure.</p>
                </div>
```

---

## 4 · THE SIX TILES — capabilities → six risk lenses (around lines 665–762)

This is the core change. The bento currently lists six **capabilities** (Track, Contextualise, Identify exposure, Surface pathways, Preserve provenance, Enable response). Replace them with the six **risk lenses** SectorWatch watches. **Keep the grid, the six `<article>` tiles, the tile numbers, and every `<svg>` icon exactly where they are** — only the header copy and each tile's `name` + `desc` change.

### 4a · Section header (lines 667–672)

**Find:**

```html
                    <span class="kl-sectors__eyebrow">What it is built to do</span>
                    <h2 class="kl-sectors__title">Six capabilities. <em>One layer.</em></h2>
                </div>
                <p class="kl-sectors__sub">
                    Sector Watch is being built to operate continuously across export corridors &mdash; reading the regulatory environment, mapping it against firm-level positions, and surfacing what materially changes.
                </p>
```

**Replace with:**

```html
                    <span class="kl-sectors__eyebrow">What it watches</span>
                    <h2 class="kl-sectors__title">Six dimensions of risk. <em>One layer.</em></h2>
                </div>
                <p class="kl-sectors__sub">
                    Sector Watch is being built to watch your supply chain across six dimensions of risk at once &mdash; reading each against your firm&rsquo;s positions and surfacing what materially changes.
                </p>
```

### 4b · The six tile name/desc pairs

Change only the `<h3 class="kl-sectors__tile-name">` and the following `<p class="kl-sectors__tile-desc">` inside each tile. Leave `tile-num` and `tile-icon` untouched.

| Tile | New `tile-name` | New `tile-desc` |
|---|---|---|
| 01 | **Shipment exposure** | Risk read at the level of the individual shipment and lane &mdash; where every broader risk resolves into a single go or no-go. |
| 02 | **Regulatory foresight** | Coming rule changes and technical and non-technical trade barriers, seen before they bind. |
| 03 | **Jurisdictional exposure** | Risk across the countries of your manufacturers, your suppliers, and your target markets. |
| 04 | **Geospatial concentration** | Where your supply base clusters &mdash; and where that concentration becomes a single point of failure. |
| 05 | **Geopolitical risk** | Wars, tariffs, sanctions, and shifting alignments that move whole corridors at once. |
| 06 | **Evidence &amp; defensibility** | Whether each position can be defended on the record &mdash; source-aware, reviewable, audit-ready. |

Concretely, e.g. tile 01:

**Find:**
```html
                    <h3 class="kl-sectors__tile-name">Track</h3>
                    <p class="kl-sectors__tile-desc">Regulatory and institutional developments across major export corridors, monitored continuously rather than episodically.</p>
```
**Replace with:**
```html
                    <h3 class="kl-sectors__tile-name">Shipment exposure</h3>
                    <p class="kl-sectors__tile-desc">Risk read at the level of the individual shipment and lane &mdash; where every broader risk resolves into a single go or no-go.</p>
```
…and the same pattern for tiles 02–06 using the table above (02 Contextualise→Regulatory foresight, 03 Identify exposure→Jurisdictional exposure, 04 Surface pathways→Geospatial concentration, 05 Preserve provenance→Geopolitical risk, 06 Enable response→Evidence &amp; defensibility).

**Icons:** leave all six `<svg>` icons exactly as they are. They are abstract line icons and read fine against the new names. (Optional, only if the founder later asks: the shield-with-check icon currently on tile 05 would suit tile 06 "Evidence & defensibility" better — but do **not** swap icons in this pass; keep design changes to copy only.)

### 4c · Closing line (line 761) — leave unchanged

`The system does not replace executive judgment &mdash; it operationalises it.` — keep as-is.

---

## 5 · CASCADE: remove the remaining "Request Early Access" surfaces + "flagship" language

**Recommended and consistent with the reframe — but confirm with the founder before applying, as these touch sections beyond the four screenshots.** Leaving these while removing the hero CTA would make the page contradict itself (still soliciting pilot signups).

**5a · Founder-rail CTA (lines 948–958).** Replace the "Request Early Access" primary CTA. Keep the "Connect with Founder" secondary link. Suggested:

```html
                    <div class="kl-founder__cta-block">
                        <span class="kl-founder__cta-eyebrow">Get in touch</span>
                        <a href="mailto:sreenath@kananlabs.com?subject=Connect%20with%20Founder%20%E2%80%94%20Sector%20Watch"
                           class="kl-founder__cta-primary">
                            Connect with Founder
                            <span aria-hidden="true">&rarr;</span>
                        </a>
                        <a href="tradewatch.html" class="kl-founder__cta-secondary">
                            See what we shipped first: TradeWatch
                            <span aria-hidden="true">&rarr;</span>
                        </a>
                    </div>
```

**5b · "flagship product" in the doctrine note (line 994).** Change "Sector Watch is the flagship product through which Kanan Labs is building that infrastructure." → "Sector Watch is the long-horizon platform through which Kanan Labs is building that infrastructure."

**5c · The ACCESS form section (lines 1044–1061, `<section class="sw-access" id="access">`).** This is a pilot-signup form — it should not exist on a vision page. Two options, founder's choice:
- **Preferred — replace the form with a non-transactional closing** (keeps page rhythm, no signup):
```html
    <section class="sw-access" id="access">
        <div class="sw-access__inner">
            <div class="sw-access__text">
                <h2>Where Kanan is heading.</h2>
                <p>Sector Watch is the long-horizon platform Kanan Labs is building toward. Today we are shipping TradeWatch &mdash; the first, focused expression of the same engine. Sector Watch is the direction, not yet the product.</p>
                <a href="tradewatch.html" class="sw-btn-secondary">See TradeWatch &rarr;</a>
            </div>
        </div>
    </section>
```
  (Note: the inner `<div>` that held the form is removed; if `.sw-access__inner` is a 2-column grid, this single-column child is fine, but check it centres acceptably — if not, the founder is OK with a minor CSS tweak here only.)
- **Simpler — delete the `sw-access` section entirely.** If you do, also remove any now-dead `#access` anchors and the JS handler `sectorWatchAccessForm` (search the file's `<script>` for it) so nothing references a missing element.

**5d · Footer CTA (line 1082).** Replace:
```html
                    <a href="#access" class="kl-footer__consult">Request Early Access &#8594;</a>
```
with:
```html
                    <a href="tradewatch.html" class="kl-footer__consult">Explore TradeWatch &#8594;</a>
```

**5e · Founder headline / doctrine tenets (lines 938–1033).** Leave as-is — they already read as vision/doctrine and are on-message. Only the single "flagship" word in 5b changes.

---

## 6 · Do NOT touch

- Any CSS file, any class name, any `<svg>` icon, any layout/grid/wrapper.
- The hero background image/video, the `kl-flow` "how it works" section, the founder doctrine tenets, the footer sitemap/newsletter.
- Spacing, fonts, colours. This pass is **copy + CTA removal only.** The one permitted CSS exception is a minor centring tweak in 5c if the founder chooses the "replace the form" option and it looks off.

---

## 7 · Verification checklist (before you finish)

1. The word "flagship" appears **nowhere** in `sector-watch.html` (and `dist/` copy). `grep -i flagship sector-watch.html` → no results.
2. "Request Early Access" / "Request Access" appears **nowhere**. `grep -i "early access" sector-watch.html` → no results (unless the founder kept 5c option A wording, which has none).
3. No anchor points to `#access` if the section was deleted (5c simple option); no JS references a removed form id.
4. Hero shows: eyebrow "The Long-Horizon Platform", subhead "AI-native supply chain risk intelligence.", one action link only.
5. The six tiles read: Shipment exposure · Regulatory foresight · Jurisdictional exposure · Geospatial concentration · Geopolitical risk · Evidence & defensibility — with all original numbers and icons still in place.
6. Page still builds / renders with no console errors; `sector-watch.html` and `dist/sector-watch.html` match.
7. Diff is copy-only (plus the CTA/section removals in §5). No unintended CSS or structural changes.
