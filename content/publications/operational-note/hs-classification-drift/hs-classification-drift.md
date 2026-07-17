---
title: "HS Classification Drift Across the Invoice, Shipping Bill and COO"
slug: "hs-classification-drift"
description: "HS codes drift across the invoice, Shipping Bill and Certificate of Origin — one digit shifts duty, RoDTEP rate and origin claims. Shipping Bills need 8 digits."
author: "Sreenath Govindarajan"

type: "operational-note"
cluster: "igst-customs"
entities: [hs-code, itc-hs, customs-tariff-act, gri, carotar-2020, certificate-of-origin, shipping-bill, rodtep, appendix-4r, commercial-invoice, cha]

takeaways:
  summary: >-
    The same goods routinely carry different HS codes on the commercial invoice, the Shipping Bill
    and the Certificate of Origin, because each document is produced from a different master. The
    Shipping Bill demands the full eight-digit ITC(HS) item, RoDTEP rates diverge line by line at
    eight digits, and CAROTAR 2020 makes origin claims turn on classification-linked criteria.
  points:
    - "The Shipping Bill's RITC field carries the **eight-digit import tariff classification code** (CBIC Circular 51/2003-Customs); invoices from accounting masters often stop at 4 or 6 digits — an ancestry check, not an equality check, reconciles them."
    - "Eight digits move money: Appendix 4R (w.e.f. 01.05.2025) lists **HS 85076000 lithium-ion at a higher RoDTEP rate than 87089100 radiators or 87085000 drive-axles** — a drifted code is a mis-set incentive."
    - "Under **CAROTAR 2020 (Rule 4 and Form I)**, preferential origin claims rest on criteria (CTH, CTSH, RVC) defined *relative to the declared classification* — HS drift between the COO and the customs entry undermines the origin claim itself."
    - "Classification is governed by the **General Rules for the Interpretation** of the Customs Tariff Act 1975 schedule (GRI 1, 3(a), 6) — and a final HS determination requires human review; reconciliation only exposes the drift."

date: "2026-07-17"
reviewed: "2026-07-17"

sources:
  - id: "customs-tariff-act-1975"
    title: "The Customs Tariff Act, 1975 — First Schedule, General Rules for the Interpretation"
    authority: "india-statute"
    url: "https://www.indiacode.nic.in/bitstream/123456789/8774/1/a197551.pdf"
    anchor: "First Schedule, GRI 1 (classification by heading terms and Section/Chapter Notes); GRI 3(a) (most specific description preferred); GRI 6 (subheading-level classification; only subheadings at the same level comparable)"
    retrieved: "2026-07-17"
  - id: "cbic-circular-51-2003"
    title: "CBIC Circular No. 51/2003-Customs — RITC code in Shipping Bills"
    authority: "cbic"
    url: "https://www.cbic.gov.in/entities/view-circular-instruction"
    anchor: "para stating the RITC code reflected in Shipping Bills is the 8-digit import tariff classification code"
    retrieved: "2026-07-17"
  - id: "carotar-2020"
    title: "Customs (Administration of Rules of Origin under Trade Agreements) Rules, 2020 — Notification No. 81/2020-Customs (N.T.), in force 21.09.2020"
    authority: "cbic"
    url: "https://bangalorecustoms.gov.in/wp-content/uploads/2024/02/CAROTAR-221023-1.pdf"
    anchor: "rule 4 with Form I (importer to possess origin information before import, retain five years; Section III origin criteria — WO, RVC, CTH/CTSH); rule 5 (officer may requisition Form I information on reason to believe)"
    retrieved: "2026-07-17"
  - id: "dgft-appendix-4r-2025"
    title: "DGFT — Appendix 4R, RoDTEP Schedule for DTA exports w.e.f. 01.05.2025 (Notification No. 10 dated 26.05.2025)"
    authority: "dgft"
    url: "https://content.dgft.gov.in/Website/dgftprod/0f9aa468-8345-4b09-a8d0-9b7c8be5920f/Appendix%204R%20(1).pdf"
    anchor: "entries at 8-digit level: 85076000 (lithium-ion accumulators), 87089100 (radiators and parts), 87084000 (gear boxes), 87085000 (drive-axles) — distinct rates per tariff item"
    retrieved: "2026-07-17"
  - id: "cag-report-11-2025-pr"
    title: "CAG — Press Release on Compliance Audit Report No. 11 of 2025 (Indirect Taxes – Customs), 12.08.2025"
    authority: "other"
    url: "https://cag.gov.in/uploads/PressRelease/PR-Press-Release-Report-no-11-in-English-0689b2518393d55-17827559.pdf"
    anchor: "misclassification of imports chapter (paras 5.6.1–5.6.5), revenue implication ₹46 crore"
    retrieved: "2026-07-18"
  - id: "customs-act-1962"
    title: "The Customs Act, 1962 (Act 52 of 1962)"
    authority: "india-statute"
    url: "https://www.indiacode.nic.in/handle/123456789/2475"
    anchor: "s. 113(i) (export goods not corresponding in material particular with the entry — liable to confiscation); s. 114 (penalty); s. 28DA (procedure regarding claims of preferential rate of duty)"
    retrieved: "2026-07-17"
reviewer: "Sreenath Govindarajan"

boundary: [cha, classification]

image: "assets/cover.png"
tags: [hs classification, itc-hs, carotar, rodtep, certificate of origin]
---

# One Product, Three Documents, Three Codes

HS classification drift is the condition in which the same goods carry different tariff codes
across the documents of one shipment — a four-digit heading on the commercial invoice, an
eight-digit ITC(HS) item on the Shipping Bill, and a six-digit subheading on the Certificate of
Origin. The drift is rarely a considered disagreement about classification; it is an artefact of
*where each document is generated*. The invoice inherits whatever the accounting master was
seeded with years ago, the Shipping Bill inherits what the Customs House Agent's software
resolves at filing, and the COO inherits what was typed into the issuing body's portal.

The reason drift matters is that classification is not a label — it is the variable on which
duty, export incentive, origin preference and licensing all resolve. India's export declaration
demands the **full eight-digit tariff item**; RoDTEP rates differ line by line at exactly that
depth; and preferential origin criteria under trade agreements are defined *relative to* the
classification. A shipment whose documents disagree at the sixth or eighth digit is a shipment
whose duty, incentive and origin outcomes have been set by whichever document each system
happened to read.

This note maps where the codes live, what each digit of divergence costs, and the reconciliation
standard that catches drift before the Let Export Order — the same pre-LEO discipline set out in
[Reconciling Invoice, Packing List, B/L and Shipping Bill Before LEO](/publications/pre-leo-document-reconciliation/).

## Where Each Document Gets Its Code

Each of the three documents resolves its HS code from a different master, at a different
granularity, under different constraints — which is why agreement never happens by default. The
Shipping Bill is the strictest: its RITC field carries the **eight-digit import tariff
classification code** (CBIC Circular 51/2003-Customs), resolved in the CHA's EDI software at
filing time, and it is the code on which assessment, incentive scrolls and export-control
screening run. The commercial invoice is the loosest: Indian accounting software carries HSN
masters seeded for GST purposes, frequently at **four or six digits**, and the printed invoice
reproduces that master unexamined. The Certificate of Origin sits in between: issued at six or
eight digits depending on the agreement and the issuing body, and — decisively — bound to the
origin criterion declared alongside it.

The legal frame over all three is the **Customs Tariff Act, 1975** and the General Rules for the
Interpretation of its First Schedule: classification is determined by the terms of the headings
and the Section and Chapter Notes (GRI 1), the most specific description prevails (GRI 3(a)),
and subheadings compare only at the same level (GRI 6). The GRI answer for a product is single
and determinate in principle — *the documents drift because nobody runs the rules three times*.

## What a Digit of Drift Costs

A divergent code is not a cosmetic inconsistency; each digit of divergence re-prices the
shipment somewhere downstream. Three regimes make the point concrete.

**Incentives.** RoDTEP resolves at the eight-digit line. In Appendix 4R as notified w.e.f.
01.05.2025, **85076000** (lithium-ion accumulators), **87084000** (gear boxes), **87085000**
(drive-axles) and **87089100** (radiators and parts) each carry a different rate — for an EV
supply chain whose components genuinely straddle Chapters 85 and 87, the classification decision
*is* the incentive decision. A Shipping Bill code drifted one line from the correct item claims
the wrong rate in whichever direction, and over-claim invites recovery while under-claim is
money not collected.

**Origin.** Under CAROTAR 2020, an importer claiming preferential duty must **possess Form I
origin information before import** and retain it for five years (Rule 4); the officer may
requisition it on reason to believe the criterion is unmet (Rule 5). The criteria themselves —
change of tariff heading (CTH), change of tariff subheading (CTSH), regional value content —
are defined relative to classifications. An Indian exporter's COO that declares CTSH against
one subheading, sitting beside a Shipping Bill that declares another, hands the destination
customs authority a documented reason to doubt the origin claim — and the exporter's buyer bears
the duty consequence.

**Declaration integrity.** Section 113(i) of the Customs Act, 1962 renders export goods liable
to confiscation where they "do not correspond in respect of value or in any material particular"
with the entry made — and the tariff item is a material particular of the entry, with penalty
exposure following under Section 114.

### Why the CAG Keeps Finding It

Misclassification is a standing chapter of the Comptroller and Auditor General's indirect-tax
compliance audits — CAG Report No. 11 of 2025 (Union Government, Indirect Taxes – Customs)
devotes a chapter to misclassification of imports (paras 5.6.1–5.6.5) with a revenue effect of
**₹46 crore**, and earlier cycles targeted heading 8708 specifically, with transmission shafts
and gears assessed short by ₹73.99 lakh in Report No. 8 of 2015. The audit mechanics matter for exporters:
CAG test-checks compare declared classifications against product literature and tariff notes
years after clearance, and a drifted code that cleared unchallenged at LEO resurfaces as a
recovery proceeding with interest. *Audit memory is longer than shipment memory.*

## The Reconciliation Standard: Ancestry, Then Authority

HS reconciliation across documents is not an equality check, because the documents legitimately
carry different granularities. The workable standard has two steps. **Ancestry:** every code on
every document must be an ancestor or descendant of one eight-digit item — the invoice's 8507
must contain the Shipping Bill's 85076000; a COO at 850760 must sit on the same lineage. A
four-digit invoice heading is acceptable; a *different* four-digit heading is drift. **Authority:**
exactly one document owns the resolved eight-digit item — the draft Shipping Bill — and every
other document is either aligned to it or corrected upstream in its own issuing system before
filing.

What reconciliation deliberately does not do is decide the classification. Where the ancestry
check exposes genuine ambiguity — a battery management system arguable between 8507 and 8537, a
motor assembly between 8501 and 8708 — the resolution is a classification determination made
with human review against the GRI and chapter notes, documented so the same answer is given on
every subsequent shipment. Final HS classification requires human review; the reconciliation's
job is to make sure the question is asked once, before LEO, rather than answered differently by
three systems.

TradeWatch runs the ancestry check across the invoice, packing list, Certificate of Origin and
draft Shipping Bill as part of its readiness packet, flagging any code off-lineage with a
four-state verdict and the tariff-schedule line it would need to be true. Kanan Labs prepares a
readiness packet. It does not file Shipping Bills, holds no customs credentials, and does not
make final HS determinations — your licensed CHA files, and classification decisions remain
subject to human review.
