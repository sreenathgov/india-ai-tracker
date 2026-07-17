# Resources Catalog Page — Design Spec

**Date:** 2026-07-16 · **Status:** Approved for planning · **Scope:** Standalone page (design phase); bridging to the publications build pipeline is a later phase.

## 1. Purpose

A single catalog page at `resources.html` where visitors browse everything Kanan Labs publishes, segmented into three visitor-facing buckets:

| Bucket | Contains | Source of truth (bridge phase) |
|---|---|---|
| **Insights** | Articles and blogs — all five markdown `type`s from the authoring contract (`operational-note`, `change-watch`, `concept-piece`, `founder-brief`, `definition`) | `content/publications/` → `index.json` |
| **Whitepapers** | Substantive long-form documents / PDF dossiers (e.g. the AI Regulations Handbook in `dist/dossiers/`) | Hand-curated list (later: `whitepapers.json`) |
| **News & Press** | Company announcements and external press coverage | Hand-curated list (later: `news.json`) |

The bucket is **derived presentation**, not a new authoring field — the validated frontmatter schema (AUTHORING.md v2) is untouched.

## 2. Page architecture

One page, tabbed: **All · Insights · Whitepapers · News & Press**. Tabs filter the catalog client-side and are deep-linkable via `#insights`, `#whitepapers`, `#news` (unknown/absent hash → All). Room is reserved under the tab bar for a future cluster-filter row; no secondary filters at launch.

### Skeleton (top → bottom)

1. **Header** — existing injected staggered menu, transparent.
2. **Masthead** — "Resources" in Cormorant Garamond, brand navy, large; one-sentence sans subline. Left-aligned, generous top padding.
3. **Tab bar** — sans text tabs, navy; active tab gets an orange underline rule.
4. **Featured slot** — one wide featured card, shown only on the All tab.
5. **Card grid** — 3 columns desktop / 2 tablet / 1 mobile, generous gutters.
6. **Footer** — existing `kl-footer`, unchanged markup.

## 3. Visual foundation

- **Background:** brand cream `#F4EBD0` across the full page.
- **Grid backdrop:** the exact `InfrastructureGrid` canvas component from the homepage (`js/infrastructure-grid.js`) — 30px squares, slow upward drift (speed 0.12), reduced-motion respected, full opacity down the page — recolored to low-opacity orange, starting at `rgba(219, 74, 43, 0.07)` and tuned visually.
- **Palette:** navy `#0a2f52`, cream `#F4EBD0`, orange `#db4a2b`. No new tones.
- **Type:** Cormorant Garamond for titles/masthead; Telegraf/Inter sans for meta, descriptions, tabs.
- Content surfaces (cards) are solid so the grid never runs beneath text inside a card.

## 4. Card design

### Standard card

Solid surface slightly lighter than the page (`#FBF5E4`), hairline low-opacity navy border (`rgba(10, 47, 82, 0.18)`), 3px corner radius. Anatomy:

1. **Image** — 16:9, full-bleed, `object-fit: cover`. **Fallback** when `image` is null/broken: navy tile with `KANANLABS-LOGO-SET/ORANGE of KANAN-LABS-WEBSITELOGO.png` centered.
2. **Meta row** — bucket pill (small-caps sans, hairline orange border, orange text, transparent fill) + date right-aligned. Whitepapers add a "PDF · n pages" tag; external news adds source name and ↗.
3. **Title** — Cormorant SemiBold, navy, ~1.375rem, 2-line clamp.
4. **Description** — sans, navy at ~65% opacity, 2-line clamp.

**Hover:** 2–3px lift + soft shadow, title → orange, image scales ~1.03 inside its frame. Whole card is one link. External news links open in a new tab.

### Featured card

Same DNA, horizontal: image left ~55%, right side gets an orange small-caps "Featured" eyebrow, ~2.25rem serif title, unclamped description, explicit orange "Read →" link. Stacks image-over-text on mobile.

## 5. Menu integration

- In `js/staggered-menu.js`, replace `{ label: 'Publications', link: 'publications.html' }` with `{ label: 'Resources', link: 'resources.html' }`.
- Add optional `subItems` support to the menu item schema. Resources gets three always-visible smaller sub-links (Insights / Whitepapers / News & Press → the tab hashes), rendered in the sans face beneath the parent and joining the stagger-in animation just after it. Items without `subItems` render exactly as today (additive, safe on all pages).
- Footer "Publications" → "Resources" link swap happens on `resources.html` itself now; the sitewide footer swap and the fate of `publications.html` (redirect/retire) are bridge-phase tasks.

## 6. Data model (standalone phase)

Embedded in the page as `<script type="application/json" id="resources-data">`:

```json
{
  "items": [{
    "slug": "sb005-invoice-mismatch",
    "bucket": "insight",
    "title": "…",
    "description": "…",
    "date": "2026-07-10",
    "image": "added-assets/example.png",
    "href": "publications/sb005-invoice-mismatch/",
    "featured": true,
    "meta": { "pages": 42 }
  }]
}
```

- `bucket` ∈ `insight | whitepaper | news`. `image: null` → fallback tile. `featured: true` on exactly one item.
- `meta.pages` for whitepapers; `meta.source` (+ external URL in `href`) for press coverage.
- Field names deliberately mirror `index.json` output so the bridge is a transform, not a redesign: at bridge time, `scripts/generate-publications.js` writes this block (or pre-rendered card markup) at build time. No runtime fetch — pre-rendered/inline data keeps the page crawlable per the AEO thesis.

### Sample content at launch

~4 Insights written in the authoring voice (SB005 mismatch, marine evidence, EV export themes), the real AI Regulations Handbook PDF as a Whitepaper, 2–3 plausible News & Press entries. One insight is featured.

## 7. Files

| File | Change |
|---|---|
| `resources.html` | New. Head/SEO meta modeled on existing pages (CollectionPage + BreadcrumbList JSON-LD), canvas, masthead, tabs, featured, grid, footer. |
| `css/resources.css` | New. All page styles. |
| `js/resources.js` | New. Parse embedded JSON, render featured + grid, tab filtering, hash deep links. Small, single-purpose. |
| `js/infrastructure-grid.js` | Additive: auto-init reads optional `data-border-color` / `data-square-size` / `data-direction` from the canvas, defaulting to current hardcoded values. Homepage unchanged. |
| `js/staggered-menu.js` | `subItems` support + Publications→Resources swap. |

`publications.html` is left untouched this phase.

## 8. Error handling

- JSON parse failure → friendly "publications are being prepared" message in the catalog area; never a blank page.
- Broken/missing image → `onerror` swap to branded fallback tile.
- Empty bucket tab → quiet one-line empty state.
- Unknown hash → All tab.

## 9. Verification

Browser-driven, systematic, before completion: desktop/tablet/mobile widths; all four tabs; hash deep-links (fresh load + in-page); reduced-motion (grid static); keyboard tab-through of cards; broken-image fallback; console-clean check. No front-end unit-test scaffold exists in this repo; verification is behavioral via the preview browser.

## 10. Out of scope (bridge phase)

Generator integration, sitewide menu/footer link rollout, `publications.html` redirect, cluster filter row, search, pagination.
