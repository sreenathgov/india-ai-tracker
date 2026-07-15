# Kanan Labs Publications — Authoring Contract

This document is the **single source of truth** for how publication articles are written
and structured. Every article submitted to `content/publications/` MUST conform to this
contract. The static generator (`scripts/generate-publications.js`) validates against it
and **fails the build** on violations. Agent writers: follow it exactly.

---

## 1. File basics

- **Format:** Markdown (`.md`) with YAML frontmatter. Nothing else is accepted.
- **Filename:** `<slug>.md` — MUST exactly equal the `slug` frontmatter field.
- **Location:** `content/publications/`
- Files prefixed with `_` (e.g. `_TEMPLATE.md`) are ignored by the generator.

## 2. Frontmatter schema

```yaml
---
title: ""              # REQUIRED · ≤ 70 chars · leads with the primary keyword/entity
slug: ""               # REQUIRED · kebab-case [a-z0-9-] · must equal the filename
description: ""        # REQUIRED · 150–160 chars · the meta description AND the
                       #   answer-engine summary: a complete, standalone answer to
                       #   "what does this article establish?"
abstract: ""           # REQUIRED · 1–3 sentences · shown as the lede under the title;
                       #   may be longer/richer than description
author: ""             # REQUIRED · full name
date: "YYYY-MM-DD"     # REQUIRED · publish date (ISO 8601)
updated: "YYYY-MM-DD"  # optional · last substantive revision (becomes dateModified)
category: ""           # REQUIRED · exactly one of the controlled list below
tags: []               # optional · 3–7 lowercase topic tags, e.g. [ai act, dpdp, mea]
image: ""              # optional · repo path to a 1200×630 OG image;
                       #   defaults to the site link-preview if omitted
---
```

**Controlled category list** (extend deliberately, never ad-hoc):
`AI Governance` · `Policy Analysis` · `Trade & Technology` · `Regulatory Intelligence` · `Research Dossier`

## 3. Structure = the three layers

The heading levels of the markdown ARE the reader's progressive-disclosure layers:

| Markdown | Layer | Reader behavior | Writing intent |
|---|---|---|---|
| `# Chapter Title` | **Layer 1 — Overview** | Main scrolling column, one white card per chapter | The narrative spine. 2–4 paragraphs a busy reader can skim and still leave informed. |
| `## Section Title` | **Layer 2 — Analysis** | Card inside the chapter; opens a slide-in panel | The full argument: evidence, reasoning, implications. |
| `### Note Title` | **Layer 3 — In-Depth** | "More about" box inside the Analysis panel; opens a stacked panel | Methodology, references, extended context, technical detail. |

**Hard rules (validated):**
1. No content before the first `#` heading.
2. At least one `#` chapter; every `##` must sit under a `#`; every `###` under a `##`.
3. **The first paragraph after every `##` doubles as that section's card teaser** in
   Layer 1. It must stand alone: assume the reader sees ONLY that paragraph.
4. `####` and deeper are allowed *within* content as ordinary sub-headings; they do
   not create layers.
5. Plain markdown only: paragraphs, bold/italic, lists, blockquotes, links. No raw
   HTML, no images inside articles (for now), no tables unless essential.

## 4. Writing for SEO / AEO (answer engines)

The generator makes every layer visible to crawlers — but ranking and citation depend
on how you write:

- **Answer first.** Open every chapter and section with the conclusion, then support
  it. Answer engines quote self-contained, declarative openings.
- **Self-contained sections.** Each `##` section should be quotable in isolation —
  restate the subject noun instead of "this" / "it" ("India's DPDP Act…", not "It…").
- **Name entities explicitly** — organizations, laws, places, dates ("MeitY's 2025
  advisory", not "the ministry's recent advisory").
- **Question-phrased headings where natural** ("What the DPDP Act means for AI
  startups") — they map directly onto query intent.
- **Cite data with sources** inline as links; numbers with units and years.
- **One idea per paragraph;** 2–4 sentences each.
- The `description` is what appears in search results and AI answers — write it as
  the complete 25-word answer, not a teaser ("X establishes Y because Z", never
  "We explore…").

## 5. Pre-submission checklist (what the validator enforces)

- [ ] Filename equals `slug`; slug is kebab-case and unique across `content/publications/`
- [ ] All REQUIRED frontmatter fields present and non-empty
- [ ] `title` ≤ 70 chars · `description` 150–160 chars · `date`/`updated` valid ISO dates
- [ ] `category` is one of the controlled list
- [ ] No content before the first `#`; heading hierarchy is well-nested
- [ ] Every `##` section opens with a standalone teaser paragraph
- [ ] No raw HTML in the body
- [ ] `image` (if given) exists in the repo

## 6. Publishing pipeline (for reference)

`content/publications/<slug>.md` → `npm run build` → static page at
`https://kananlabs.in/publications/<slug>/` with all three layers pre-rendered as
semantic HTML (h1 → h2 chapters → h3 sections → h4 notes), Article JSON-LD,
canonical/OG meta, sitemap + `llms.txt` + `content/publications/index.json` entries.
Drafts can be previewed before building via
`publications-old.html?pub=<slug>` on a local server.
