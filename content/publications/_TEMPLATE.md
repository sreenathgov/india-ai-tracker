---
# Contract: content/publications/AUTHORING.md v2. This file is ignored by the generator.
# Copy it, rename to <slug>.md, replace everything.

title: "Primary Entity: What This Article Establishes"
slug: "primary-entity-what-this-establishes"
description: "A complete standalone answer in exactly 150 to 160 characters. Declarative and entity-rich. X blocks Y because Z — never 'we explore' or 'a guide to'."
author: "Sreenath Govindarajan"

type: "operational-note"        # operational-note | change-watch | concept-piece | founder-brief | definition
cluster: "igst-customs"         # igst-customs | marine-evidence | ev-lithium | export-realization | trade-architecture
entities: [sb005, icegate, gstr-1-table-6a, annexure-a, leo]

# Renders FIRST, below the title. Read AUTHORING.md §4 before writing this.
# Every point needs a named entity, a date, a number, or a citable procedure.
takeaways:
  summary: >-
    An SB005 error blocks your IGST refund when the invoice number on the Shipping Bill diverges
    from GSTR-1 Table 6A. It is corrected by filing a Concordance Table (Annexure A) with the
    customs officer interface — but it cannot be amended after the Let Export Order, which is why
    it has to be caught pre-shipment.
  points:
    - "SB005 fires when the invoice number diverges by a single formatting character — **EXP/2026/0042 against EXP-2026-0042** is enough to block the refund."
    - "The refund is not rejected — it **silently stalls post-EGM**, with no notification to the exporter."
    - "The fix is a **Concordance Table (Annexure A)** per Public Notice 10/2018, submitted to the AC IGST Refunds."
    - "Your CHA **cannot amend the Shipping Bill after the Let Export Order** — pre-shipment reconciliation is the only reliable prevention."

date: "2026-01-01"
reviewed: "2026-01-01"          # last verified against sources. Renders visibly.

# anchor is mandatory and it is the whole game. Point at the clause, not the document.
sources:
  - id: "cbic-circular-05-2018"
    title: "CBIC Circular 05/2018-Customs — IGST refund alternative mechanism"
    authority: "cbic"
    url: "https://www.cbic.gov.in/..."
    anchor: "para 3(b)"
    retrieved: "2026-01-01"
reviewer: "Sreenath Govindarajan"

boundary: [cha]                 # irdai | cha | classification — see AUTHORING.md §8.2

tags: [sb005, igst refund, icegate]
---

# First Chapter Title

Open with this chapter's conclusion in one declarative paragraph. A skimming reader should leave
informed after these 2–4 paragraphs alone. Name entities explicitly; cite years and numbers.

Continue the overview narrative. One idea per paragraph, 2–4 sentences each.

## First Section Title

THIS FIRST PARAGRAPH IS THE VERDICT for this section and doubles as its card teaser. It must
stand alone as a complete, quotable statement of the finding — assume the reader sees only this.
Restate the subject noun; never open with "this" or "it".

Then develop the full argument: evidence, reasoning, implications. Cite inline with links that
terminate at primary sources — never a competitor glossary or a secondary aggregator.

### A Supporting Note

Methodology, references, extended technical context. Appears as a "More about" box inside the
Analysis panel and opens a stacked panel.

## Second Section Title

Another standalone Verdict paragraph opens this section.

Full analysis continues.

# Second Chapter Title

Each `#` starts a new chapter card in the main column. Repeat: overview narrative, then `##`
sections, each optionally with `###` notes.
