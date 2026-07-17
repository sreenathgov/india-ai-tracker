# First 10 Articles — Slate & Publishing Runbook

**Date:** 2026-07-15 · **Contract:** `AUTHORING.md` v2 · Ignored by the generator (`_` prefix).

---

## PART A — The slate

**Shape:** 7 × `igst-customs` (builds H1 to real density) + 3 × `marine-evidence` (starts H2).
Deliberately *not* spread across five clusters — a hub with three spokes reads as thin to both
Google and an answer engine. One hub to density, then the next.

**★ = maps to one of the four TradeWatch anchor demos** (Dossier §3). Three of the ten do. The
article explains the failure; the demo shows the fix. They reinforce each other, and a design
partner who reads the piece and then sees the demo has already been pre-sold.

| # | Slug | Title | type | cluster | Persona |
|---|---|---|---|---|---|
| 1 ★ | `sb005-igst-refund-blocked` | SB005: Why Your IGST Refund Blocks After EGM and How to Clear It | operational-note | igst-customs | Export mgr · Finance · CHA |
| 2 | `icegate-sb-error-codes` | SB001–SB006: The ICEGATE Shipping Bill Error Codes, Explained | operational-note | igst-customs | Export mgr · Finance |
| 3 | `invoice-number-format-tally-icegate` | Invoice Number Formatting: How Tally and ICEGATE Disagree | operational-note | igst-customs | Finance · Export mgr |
| 4 | `pre-leo-document-reconciliation` | Reconciling the Invoice, Packing List, B/L and Shipping Bill Before LEO | operational-note | igst-customs | Export mgr · CHA |
| 5 | `e-sanchit-document-gaps` | e-SANCHIT Document Gaps That Delay Let Export Order | operational-note | igst-customs | CHA · Export mgr |
| 6 | `hs-classification-drift` | HS Classification Drift Across the Invoice, Shipping Bill and COI | operational-note | igst-customs | Export mgr · Compliance |
| 7 ★ | `rodtep-2026-rate-volatility` | RoDTEP 2026: The February Cut, the March Restoration, and What Exporters Reconcile | change-watch | igst-customs | Finance · Founder |
| 8 ★ | `subrogation-time-bars-cogsa-mtga` | Subrogation Time-Bars: COGSA 1925 and MTGA 1993 Extinguishment | operational-note | marine-evidence | Broker · Finance |
| 9 | `open-cover-coi-cif-plus-10` | Open Cover vs Certificate of Insurance: Reconciling CIF+10% | operational-note | marine-evidence | Broker · Export mgr |
| 10 | `marine-cargo-claim-denial-taxonomy` | Marine Cargo Claim Denial in India: A Taxonomy of Evidence Gaps | operational-note | marine-evidence | Broker · Compliance |

### Write in this order (not the numbering — the dependency)

1. **#1 SB005** — highest intent, the Tuesday-morning problem, direct route to "request a
   readiness check." It's also anchor demo (c). If only one article ever ships, this is it.
2. **#2 error-code matrix** — **this is the H1 hub page.** Write it second so #3–#7 have a parent
   to link up to. Every SB code is its own query; the matrix catches all of them and distributes
   authority down to the spokes.
3. **#3–#6** — the spokes. Each links up to #2 and across to #1.
4. **#10 claim denial taxonomy** — **this is the H2 hub page.** Write it before #8 and #9 for the
   same reason.
5. **#8, #9** — marine spokes.
6. **#7 RoDTEP** — anytime. It documents a change that already happened, so it isn't time-pressured.

### Why each wins

| # | Information gain (why a model can't answer without you) |
|---|---|
| 1 | Endpoint mechanics. Models know SB005 exists; they don't know it stalls **silently** post-EGM, or that the fix is Annexure A via the customs officer interface, or that the CHA is locked out post-LEO. |
| 2 | Convergence. Each code is documented in scattered CBIC PDFs. **No single authoritative matrix exists.** Pure assembly gain — and it's the highest-yield hub in the slate. |
| 3 | Nobody has written down that `EXP/2026/0042` vs `EXP-2026-0042` is a refund-blocking event. Maximum specificity, near-zero competition, deeply relatable to any MSME on Tally. |
| 4 | Reconciliation logic — **your actual product IP as prose.** Field-by-field agreement across four documents. Nobody covers this because nobody else has had to build it. |
| 5 | Endpoint mechanics. Which specific e-SANCHIT gaps stall LEO, at which port. |
| 6 | Cross-document logic + bridges into `ev-lithium` later (HS 8507.60). Sets up H3. |
| 7 | **Dated change — structurally impossible for a model to know.** Notif. 60/2025-26 → 66/2025-26. Also anchor demo (b), retroactive recompilation. |
| 8 | Your own competitor audit: *"virtually absent from B2B trade content."* Emptiest space in the entire plan. Anchor demo (a). |
| 9 | The CIF+10% reconciliation against the canonical invoice — the under-insurance failure nobody documents. |
| 10 | The H2 pillar. Deep, structural, and **already researched — see below.** |

### Four of these already have deep research sitting in the repo

`Clippings/Kanan Strategy v2/_TradeWatch_Evidence_Graph/8_Strategy_Outputs/Gemini_Deep_Research_Pack/`

| Pack | Feeds |
|---|---|
| **DR08 — India Marine Cargo Claim Denial Taxonomy** | **#10 directly.** The H2 pillar is largely a research-to-draft job, not an original research job. |
| **DR09 — IRDAI Broker Conduct Boundary Research** | The `irdai` boundary statement + #8, #9 |
| **DR10 — RoDTEP EV Incentives Research** | **#7** |
| **DR11 — Indian MSME Export Document Patterns** | **#4**, and the Tally reality in #3 |

This materially changes the effort estimate. Start #10 from DR08 rather than from scratch.

### Boundary + sources per article

| # | `boundary[]` | Primary sources to capture (with sub-document anchors) |
|---|---|---|
| 1 | `[cha]` | CBIC Circular 05/2018-Customs · Public Notice 10/2018 · Chennai Customs IGST Refund Response codes PDF |
| 2 | `[cha]` | CBIC IGST refund error-code circulars · ICEGATE advisories |
| 3 | `[cha]` | CBIC Circular 05/2018 · GSTR-1 Table 6A spec |
| 4 | `[cha]` | CBIC Shipping Bill regs · Customs Act §50 · DR11 |
| 5 | `[cha]` | CBIC e-SANCHIT circulars |
| 6 | `[cha, classification]` | Customs Tariff Act · WCO HS explanatory notes |
| 7 | `[]` | DGFT Notif. 60/2025-26 · DGFT Notif. 66/2025-26 · PIB release · DR10 |
| 8 | `[irdai]` | COGSA 1925 §6 · MTGA 1993 §24 · DR09 |
| 9 | `[irdai]` | IRDAI Master Circular 2024 · UCP 600 Art. 28 · DR09 |
| 10 | `[irdai]` | IRDAI Brokers Regs 2018 · Insurance Act §42D · DR08 |

**Note on #7:** `change-watch` with `boundary: []` — it's a factual rate change, no advice
surface. Keep it that way: state what changed, cite it, date it. No "what you should do."

---

## PART B — The publishing runbook

### B.0 Current state — verified 2026-07-15, not assumed

| Step | Status |
|---|---|
| Article page generation → `dist/publications/<slug>/index.html` | ✅ **Works.** Pre-rendered, semantic, JSON-LD. |
| **Validator** | ❌ **Enforces v1.** A v2 article fails the build (`category` missing/unknown fields). **Hard blocker.** |
| **Catalog page** | ❌ **Does not exist.** `publications.html` contains no fetch, no `index.json` reference, no article markup. It's a shell. |
| **Manifest** | ⚠️ **Orphaned.** Written to `content/publications/index.json` — but `content/` is **not** in `ASSETS_TO_COPY`, so it never reaches `dist/`. Nothing consumes it. |
| **Build trigger** | ⚠️ **Manual.** `vercel.json` has no `buildCommand`. `dist/` is tracked (735 files) and commit `dde5ab7` changed `content/publications/*` **and** `dist/publications/sample-publication/index.html` together — i.e. someone built locally and committed the output. |
| **CI** | ❌ None for content. The only workflow is the daily scraper. |

> **Two hard blockers before article #1 can ship: the validator (v1 vs v2) and the catalog (absent).**

### B.1 Where files go

```
content/publications/<slug>.md              ← the article. Filename MUST equal `slug`.
assets/images/publications/<slug>.png       ← the OG image, 1200×630
```

**The image trap — read this.** `assets/` **is** copied to `dist/` (`ASSETS_TO_COPY` in
`build-full-site.js`). `content/` is **not**. The validator only checks that the `image` path
exists *in the repo* — so an image placed in `content/publications/` **passes validation and
404s in production.** Green build, broken page, no warning.

Frontmatter:
```yaml
image: "assets/images/publications/sb005-igst-refund-blocked.png"
```

### B.2 The command

```bash
npm run build:publications     # generate-publications.js + generate-sitemap.js
# or
npm run build                  # full site
```

Emits: `dist/publications/<slug>/index.html` · `dist/llms.txt` · `dist/sitemap.xml` ·
`content/publications/index.json`.

### B.3 The flow, as it actually works today

```
write content/publications/<slug>.md
   + assets/images/publications/<slug>.png
        ↓
npm run build:publications          ← MANUAL. Forget this and the article never appears.
        ↓
git add content/ assets/ dist/      ← dist/ MUST be committed. It is tracked.
git commit && git push
        ↓
Vercel auto-deploys on push to main
```

**Verify once, in the Vercel dashboard → Settings → Build & Output:** whether a Build Command is
set there (dashboard settings override the absence in `vercel.json`). If Vercel *does* run
`npm run build`, committing `dist/` is redundant churn and step 3 can drop it. If it doesn't,
committing `dist/` is load-bearing and forgetting it silently ships nothing. **I cannot see the
dashboard — this is the one thing in this runbook I could not verify from the repo.**

### B.4 What to fix, in order

| # | Fix | Why | Est. |
|---|---|---|---|
| **1** | **Rewrite `validate()` to AUTHORING.md §9** — enums, takeaways, sources/anchor, boundary, lexicon regex, entity consistency | Hard blocker. Nothing ships until the code and the contract agree. | ½ day |
| **2** | **Render the apparatus** — takeaways block below the title (per the approved design), visible `Last reviewed`, Sources section, boundary statement | The apparatus is the whole AEO thesis. Currently no field renders. | 1 day |
| **3** | **Build the catalog** — `publications.html` reads the manifest and renders cards, filtered by `cluster` | Your literal question: "added seamlessly into the resources catalog." Today: it isn't, because there's no catalog. | ½ day |
| **4** | **Fix the manifest path** — write `index.json` into `dist/` (or add `content` to `ASSETS_TO_COPY`) | Otherwise the catalog 404s in production even once it exists. | 15 min |
| **5** | **Wire CI** — run the build + validator on every PR touching `content/**` | Turns an unenforced contract into an enforced one. | 1 hr |
| **6** | **Automate the build** — GitHub Action runs `npm run build` and commits `dist/`, *or* set the Vercel build command and untrack `dist/` | Kills the "forgot to build" failure mode permanently. | 2 hrs |
| **7** | Hub pages for `igst-customs` and `marine-evidence`, generated from `cluster` | Authority doesn't flow without them. Needed by ~article 4. | ½ day |

**1–4 are required before article #1 renders correctly. 5–6 before article #3, or the manual
steps will be skipped under deadline and you'll ship a broken page.**

### B.5 The end state

```
write content/publications/<slug>.md + assets/images/publications/<slug>.png
        ↓
git push                            ← the only manual step
        ↓
CI: validate against AUTHORING.md   ← blocks the merge if malformed
        ↓
CI: npm run build                   ← article page + catalog entry + hub + sitemap + llms.txt
        ↓
Vercel deploys
```

One command. The catalog, the hub, the sitemap and `llms.txt` all update themselves, because they
are all derived from frontmatter.
