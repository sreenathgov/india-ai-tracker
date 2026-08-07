# Kanan Labs Publications — Authoring Contract

**Version 2.2** · 2026-08-07 · Supersedes v2.1 (2026-07-16), v2.0 (2026-07-15) and v1 (three-layer/`category` model).

This document is the **single source of truth** for what a valid Kanan publication is.
Everything else implements against it: `scripts/generate-publications.js` validates against it and
**fails the build** on violation; `_TEMPLATE.md` demonstrates it; every authoring skill and agent
references it; the hub generator reads its enums.

If this document and any other document disagree, this one wins on the question "is this article
valid." Change it here first, then propagate.

---

## 0. What changed in v2, and why

There were zero real articles at the time of writing (`sample-publication.md` was a template), so
v2 changes the contract freely. **That freedom ends with the first real article.**

| Change | Reason |
|---|---|
| `category` (5 generic values) → **`type` + `cluster`** (two orthogonal enums) | One field was doing two jobs — governing voice *and* subject. That is why four competing taxonomies grew. |
| **`takeaways` added** — required, frontmatter, renders first | The single highest-value extraction target on the page, and the most reusable artefact in the article. |
| **`abstract` retired** | Collided with `takeaways.summary` for the same slot and job. |
| **`sources[]` added** — required on evidence types, `anchor` mandatory | Nothing was citable. This is the whole AEO thesis. |
| **`reviewed` added** — renders visibly | `updated` existed but rendered only inside JSON-LD, invisible to readers. |
| **`reviewer` added** | One editor, one review, before publish. |
| **`entities[]` added** | Drives internal linking and the entity graph. |
| **`boundary[]` added** | The IRDAI/CHA statement becomes a schema rule, not a habit. |
| "Layer 1/2/3" **retired** from content vocabulary | The word was triple-booked. Structure and apparatus are now named separately. |

### 0.1 What changed in v2.1 (2026-07-16, founder-ratified)

| Change | Reason |
|---|---|
| **"No images inside articles" repealed** (§5) | Founder decision: figures, tables and infographics carry payload and are encouraged, with standards (§5.5–5.7). Raw HTML stays banned. |
| **Nested article layout** (§1) | Each article lives in its own folder under its `type`, with a co-located `assets/` folder for cover art and figures. |
| Emphasis conventions codified (§5.7) | Bold = extractable fact; italic = interpretive assessment. |

### 0.2 What changed in v2.2 (2026-08-07, founder-ratified)

| Change | Reason |
|---|---|
| **New cluster `ai-trade-compliance`** (§2.2) | AI's role in cross-border compliance is a distinct subject, not a format — per the §2.2 extension rule. Concentrates topical authority for the query class "what can AI do in trade compliance". Hub page ships with the cluster. |

> **Build note (resolved 2026-07-17):** `scripts/generate-publications.js` walks the nested
> `<type>/<slug>/` layout (`discoverArticleFiles()`) and copies each article's `assets/` into
> `dist/publications/<slug>/assets/` via `fs.cpSync`. A clean `npm run build:publications` is
> proof of publication for the whole site — but only if **every** article in the repo passes
> validation; one failing article blocks the catalog, hubs, manifests, and `llms.txt` from
> regenerating at all, even for unrelated articles that pass (see kanan-publish SKILL.md §6.1).

---

## 1. File basics

- **Format:** Markdown (`.md`) with YAML frontmatter. Nothing else.
- **Filename:** `<slug>.md` — MUST exactly equal the `slug` field.
- **Location:** `content/publications/<type>/<slug>/<slug>.md` — the first folder is the
  article's `type` (§2.1), the second is its `slug`.
- **Assets:** each article folder contains an `assets/` subfolder holding its cover image and any
  in-article figures. Images are referenced by relative path (`assets/<name>.png`).
- Files prefixed `_` (e.g. `_TEMPLATE.md`) and `AUTHORING.md` live at the `content/publications/`
  root and are ignored by the generator.

---

## 2. The two enums

These are orthogonal. `type` answers *what kind of piece is this*. `cluster` answers *what is it
about*. A change-watch note can live in the marine cluster or the EV cluster — one field could
never express that.

### 2.1 `type` — governs voice, apparatus, cadence, byline

| Value | What it is | Voice | Cadence |
|---|---|---|---|
| `operational-note` | A failure-mode fix or readiness checklist. The core engine. | Institutional | Weekly |
| `change-watch` | A dated regulatory change. Short, sourced, fast. **The metronome.** | Institutional | 2–4/month, 48h SLA |
| `concept-piece` | Philosophy or architecture explainer. | Institutional or founder | Monthly |
| `founder-brief` | Personal voice. LinkedIn-native, cross-posted selectively. | **Founder (first person)** | Weekly |
| `definition` | A canonical entity page for a Kanan-coined term. | Institutional | As needed |

### 2.2 `cluster` — governs SEO grouping, hub membership, internal linking

| Value | Hub | Primary persona |
|---|---|---|
| `igst-customs` | IGST & Customs Readiness | Export manager · Finance · CHA |
| `marine-evidence` | Marine Cargo Evidence | Broker · Compliance officer |
| `ev-lithium` | EV & Lithium Export | EV founder · Export manager · OEM procurement |
| `export-realization` | Export Realization | Finance |
| `trade-architecture` | Trade Intelligence Architecture | Investor · Hire · Sophisticated buyer |
| `ai-trade-compliance` | AI in Trade Compliance | Compliance lead · Trade operations · Technology buyer |

**Extension rule:** a new subject is a new `cluster`. A new format is a new `type`. If you cannot
tell which you are adding, you are adding neither — write it inside an existing pair. Extending
either enum is a founder decision and requires a matching hub page before first use.

---

## 3. Frontmatter schema

```yaml
---
# --- identity ---
title: ""                # REQUIRED · ≤70 chars · leads with the primary entity
slug: ""                 # REQUIRED · kebab-case [a-z0-9-] · == filename · unique
description: ""          # REQUIRED · 150–160 chars · the complete answer, not a teaser.
                         #   "X blocks Y because Z" — never "We explore…"
author: ""               # REQUIRED · full name

# --- classification ---
type: ""                 # REQUIRED · one of §2.1
cluster: ""              # REQUIRED · one of §2.2
entities: []             # REQUIRED (except founder-brief) · canonical entity ids
                         #   e.g. [sb005, icegate, gstr-1-table-6a, annexure-a, leo, egm]

# --- takeaways · renders first, directly below the title · see §4 ---
takeaways:
  summary: ""            # REQUIRED · 40–60 words · standalone answer
  points: []             # REQUIRED · 3–5 bullets · inline markdown ok (**bold**, links)

# --- dates ---
date: "YYYY-MM-DD"       # REQUIRED · first published
reviewed: "YYYY-MM-DD"   # REQUIRED · last verified against sources · RENDERS VISIBLY
updated: "YYYY-MM-DD"    # optional · last substantive revision → dateModified

# --- evidence · see §6 ---
sources:                 # REQUIRED for operational-note, change-watch
  - id: ""               #   stable id, reusable across articles
    title: ""
    authority: ""        #   one of §6.2
    url: ""
    anchor: ""           #   REQUIRED · clause / para / section. NOT the document name.
    retrieved: "YYYY-MM-DD"
reviewer: ""             # REQUIRED · who checked it before publish

# --- boundary · see §8 ---
boundary: []             # REQUIRED per §8.2 · any of: irdai · cha · classification

# --- lifecycle ---
supersedes: ""           # optional · slug this replaces
superseded_by: ""        # optional · set when retired. Page stays up + banner + canonical.

# --- optional ---
tags: []                 # 3–7 lowercase topic tags
image: ""                # repo path to a 1200×630 OG image
faq: []                  # [{q: "", a: ""}] → emits FAQPage JSON-LD
---
```

### 3.1 Required-by-type matrix

| Field | `operational-note` | `change-watch` | `concept-piece` | `founder-brief` | `definition` |
|---|---|---|---|---|---|
| `takeaways` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `sources[]` | ✅ | ✅ | optional | optional | optional |
| `anchor` on each source | ✅ always, when `sources` present | ✅ | ✅ | ✅ | ✅ |
| `reviewed` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `reviewer` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `entities[]` | ✅ | ✅ | ✅ | optional | ✅ |
| `boundary[]` | per §8.2 | per §8.2 | per §8.2 | per §8.2 | per §8.2 |
| First person allowed | ❌ | ❌ | ❌ | ✅ | ❌ |

---

## 4. Takeaways

Renders **first, directly below the title**, before any chapter. It is not a layer and not part
of the body — it is structured data the page renders and every downstream consumer reads:
the newsletter item, the LinkedIn skeleton, the `llms.txt` entry, the index card, and the primary
answer-engine extraction target.

### 4.1 `summary`

40–60 words. A complete, standalone answer to the article's core question. Assume the reader sees
**only** this. Declarative. No preamble, no "this article examines."

### 4.2 `points`

3–5 bullets. **Every bullet must contain at least one of: a named entity, a date, a number, or a
citable procedure.**

This is the information-gain rule made mechanical. An answer engine cites you when you hold
something it cannot synthesise alone. A bullet that still reads sensibly after every specific is
deleted from it is a bullet that says nothing — and the validator flags it.

```
✅  SB005 fires when the invoice number diverges by a single formatting character —
    **EXP/2026/0042 against EXP-2026-0042** is enough to block the refund.

✅  The fix is a **Concordance Table (Annexure A)** per Public Notice 10/2018, submitted
    to the AC IGST Refunds.

❌  Document mismatches can cause significant delays and should be avoided.
❌  TradeWatch helps you manage export compliance more effectively.
```

---

## 5. Structure — Overview / Analysis / Detail

Heading levels **are** the reader's progressive-disclosure tiers. The word "Layer" is not used in
content documents; it means one thing, in engineering.

| Markdown | Tier | Reader behaviour | Writing intent |
|---|---|---|---|
| `# Chapter` | **Overview** | Main scrolling column, one card per chapter | The narrative spine. 2–4 paragraphs a busy reader can skim and still leave informed. |
| `## Section` | **Analysis** | Card inside the chapter; opens a slide-in panel | The full argument: evidence, reasoning, implications. |
| `### Note` | **Detail** | "More about" box inside the Analysis panel; opens a stacked panel | Methodology, references, extended technical context. |

**Hard rules (validated):**

1. No content before the first `#`.
2. At least one `#`. Every `##` sits under a `#`. Every `###` under a `##`.
3. **The first paragraph after every `##` is the Verdict for that section** (§7.1) and doubles as
   its card teaser. It must stand alone.
4. `####` and deeper are ordinary sub-headings inside content. They create no tier.
5. Markdown only — **no raw HTML**. Paragraphs, bold/italic, lists, blockquotes, links, tables
   and images are all permitted. Visual apparatus is encouraged, not tolerated: a table that
   carries a section's payload, or a figure that shows what prose can only describe, outranks a
   paragraph doing the same job badly. A decorative visual that adds no information is still
   filler — the information-gain test (§7.4) applies to figures too.
6. **Figures.** Images live in the article's own `assets/` folder and are referenced by relative
   path (`assets/<name>.png`). Every figure carries descriptive alt text (it is the
   AEO/accessibility surface — write it as a one-sentence statement of what the figure shows) and
   an italic caption line directly beneath it. Figures follow brand style: navy `#0a2f52`, cream
   `#F4EBD0`, amber `#B45309`; Cormorant Garamond (display), Inter (body). No stock photography
   inside articles.
7. **Emphasis is deliberate.** **Bold** marks extractable facts — entities, numbers, dates,
   operative quoted phrases, hard rules. *Italics* mark interpretive assessments and
   consequences. Every Analysis (`##`) section should carry at least one of each; emphasis that
   marks everything marks nothing.

---

## 6. Sources

### 6.1 `anchor` is mandatory and it is the whole game

> "Per CBIC Circular 05/2018" is what every competitor writes. It is **not citable** — a model
> cannot verify it, so it will summarise around you.
>
> "CBIC Circular 05/2018-Customs, para 3(b)" **is citable.**

Sub-document granularity is the difference between being summarised and being cited. An `anchor`
that merely repeats the document title fails validation.

- Link **only** to primary sources. Never to a competitor glossary or a secondary aggregator.
- `retrieved` is the date you actually opened it.
- `id` is stable and reusable — the same source cited by six articles carries one id, which is
  what makes staleness propagation possible later.

**UI note:** `anchor` is graded internally (validator + LLM adjudicator) but is **not displayed**
on the rendered page. The published Sources section is a plain numbered list — linked title,
authority, and retrieved date only. Write a precise anchor anyway: it is still what separates a
citable source from a summarised one, it just isn't shown to the reader.

### 6.2 `authority` enum

`cbic` · `dgft` · `irdai` · `rbi` · `gstn` · `icegate` · `india-statute` · `india-court` · `eu` ·
`us` · `un-iata-imo` · `icc` · `bis` · `other`

---

## 7. The writing standard

### 7.1 Verdict — answer first, everywhere

Open every `#` and every `##` with the conclusion, then support it. Answer engines quote
self-contained declarative openings and ignore wind-ups.

### 7.2 Self-contained sections

Every `##` must be quotable in isolation. Restate the subject noun; never open with "this" or
"it." Write "India's DPDP Act…", not "It…".

### 7.3 Name entities explicitly

"MeitY's 2025 advisory", not "the ministry's recent advisory". Organisations, laws, codes, ports,
dates, sections. Entity density is what makes a page resolvable to an answer engine.

### 7.4 Information gain

Before writing, answer: **could a competent model answer this query without this page?** If yes,
do not write it. Skip generic definitions — the model knows what a Commercial Invoice is and will
never cite you for it. Write endpoint mechanics, reconciliation logic, dated changes, workflow
convergence, and Kanan-coined terms.

### 7.5 Mechanics

- One idea per paragraph. 2–4 sentences.
- Cite numbers with units and years.
- Question-phrased headings where natural — they map onto query intent.
- `description` is the complete 25-word answer that appears in search results and AI answers.

### 7.6 Voice

Institutional register: assessment first, then reasoning. Restrained authority. Separate fact
from assessment. No rhetorical flourish, no vague thought-leadership, not a legal-advice
register.

First person is permitted **only** in `founder-brief`. The geopolitics / game-theory /
civilisational-systems lens belongs to `founder-brief`; institutional content stays literal.

---

## 8. Lexicon and boundary

### 8.1 Lexicon (ratified 2026-07-15)

**Preferred verbs:** check · validate · reconcile · flag · surface · cite · sign · prepare ·
assess · prevent · trace · verify

**Approved vocabulary:** evidence · readiness · defensible · provenance · source-attributed ·
reviewer-of-record · four-state readiness · assurance · audit-ready · validated-at-source

**Banned — validator-blocking:** revolutionary · disrupt · game-changing · seamless magic ·
AI-powered · one-click · guarantee compliance · ensure compliance · get your money back ·
replace your CHA · replace your broker · AGI for trade · end-to-end automation

**Banned constructions — validator-blocking:** "we file" · "we bind" · "recommended insurer" ·
"guaranteed refund" · "fully automated compliance"

**Entity naming — validator-checked for consistency:** `Kanan Labs` · `TradeWatch` · `DRONA` ·
`SectorWatch` · `reviewer-of-record` (lowercase, hyphenated) · `four-state readiness` ·
`validated-at-source` · `evidence packet`

### 8.2 Boundary — when `boundary[]` is required

This is not a style preference. It is Indian regulation, and the IRDAI's April 2025 ₹1.06 Cr
Flipkart penalty for unauthorised insurance solicitation is why it is operational rather than
cosmetic.

| Value | Required when | Statement rendered |
|---|---|---|
| `irdai` | `cluster: marine-evidence`, or the body discusses insurance | "Kanan Labs prepares claim-admissible evidence. It does not advise on, select, or bind insurance — your IRDAI-licensed broker does." |
| `cha` | `cluster: igst-customs`, or the body discusses filing | "Kanan Labs prepares a readiness packet. It does not file Shipping Bills and holds no customs credentials — your licensed CHA files." |
| `classification` | The body makes an HS determination | "Final HS classification requires human review." |

Never write: "we file your Shipping Bill" · "we get you insured" · "recommended insurer" ·
"compliance guaranteed" · anything constituting legal or tax advice.

CTAs invite a readiness check, a pilot, or a conversation. Never "file with us," "insure with
us," or "get advice."

---

## 9. What the validator enforces

**Blocking — the build fails:**

- [ ] Filename == `slug`; slug is kebab-case and unique
- [ ] All required fields present per §3.1, non-empty
- [ ] `type` ∈ §2.1 · `cluster` ∈ §2.2 · `authority` ∈ §6.2 · `boundary` values valid
- [ ] `title` ≤70 chars · `description` 150–160 chars
- [ ] `date` / `reviewed` / `updated` / `retrieved` valid ISO dates; `reviewed` ≥ `date`
- [ ] `takeaways.summary` present, 40–60 words
- [ ] `takeaways.points` 3–5 items; **each contains an entity, date, number, or procedure**
- [ ] Every `sources[]` entry has a non-empty `anchor` that is not merely the document title
- [ ] `boundary[]` present per §8.2
- [ ] No content before first `#`; heading hierarchy well-nested
- [ ] Every `##` opens with a standalone paragraph
- [ ] No banned phrase or construction (§8.1)
- [ ] Entity names match the canonical register (§8.1)
- [ ] No raw HTML in the body
- [ ] `image`, if given, exists
- [ ] First person absent unless `type: founder-brief`

**Advisory — warns, does not block:**

- [ ] `reviewed` older than the staleness threshold: `change-watch` 90d · `operational-note` 180d ·
      others 365d
- [ ] Information-gain check (§7.4)
- [ ] Verdict quality — does the opening actually answer, standalone?
- [ ] Persona drift — one piece, one reader

---

## 10. Pipeline

`content/publications/<slug>.md` → `npm run build` → static page at
`https://kananlabs.in/publications/<slug>/`, all tiers pre-rendered as semantic HTML, Article +
BreadcrumbList (+ FAQPage where `faq` is present) JSON-LD, canonical/OG meta, plus sitemap,
`llms.txt`, hub pages, and `index.json` entries.

**Every publication PR runs this validator in CI. A malformed article cannot merge.**
