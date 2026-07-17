---
title: "LC First Presentations: Why Seven in Ten Fail on Documents"
slug: "lc-first-presentation-discrepancies"
description: "ICC surveys found ~70% of LC presentations rejected first time. UCP 600 gives banks five days and one refusal notice; the fixable causes are documentary."
author: "Sreenath Govindarajan"

type: "operational-note"
cluster: "export-realization"
entities: [ucp-600, isbp-821, letter-of-credit, article-14, article-16, article-18, field-45a, commercial-invoice, bill-of-lading, fedai]

takeaways:
  summary: >-
    The ICC's own introduction to UCP 600 records that roughly 70% of letter-of-credit
    presentations were rejected on first presentation. The examination rules are mechanical:
    banks get five banking days, transport documents must be presented within 21 calendar days
    of shipment, the invoice description must correspond with the credit, and refusal comes as a
    single notice listing every discrepancy.
  points:
    - "**UCP 600, Introduction**: global surveys at the start of the revision indicated **approximately 70% of documents presented under letters of credit were rejected on first presentation** — the discrepancy-fee economy grew on that base."
    - "**Art. 14(c)** sets the deadline that fails presentations before anyone reads them: original transport documents must be presented **within 21 calendar days after shipment**, and within credit expiry — a purely operational, 100% preventable failure."
    - "**Art. 18(c)**: the invoice's goods description **must correspond with the credit** (Field 45A); other data, per Art. 14(d), need not be identical but must not conflict — two different standards, applied to different fields."
    - "**Art. 16(c)**: refusal is a **single notice stating every discrepancy** the bank refuses on, within the five-banking-day window of Art. 14(b) — so the exporter learns all defects at once, after the fee, when the vessel has sailed."

date: "2026-07-17"
reviewed: "2026-07-17"

sources:
  - id: "ucp-600"
    title: "ICC Uniform Customs and Practice for Documentary Credits, ICC Publication No. 600 (2007)"
    authority: "icc"
    url: "https://cpeapp.icai.org/downloadBGM/65c1c211b0373.pdf"
    anchor: "Introduction (approximately 70% first-presentation rejection per global surveys); Art. 14(b) (maximum five banking days to determine compliance); Art. 14(c) (21 calendar days after shipment for original transport documents, within expiry); Art. 14(d) (data need not be identical but must not conflict); Art. 16(b)–(d) (waiver approach; single refusal notice stating each discrepancy; notice by close of the fifth banking day); Art. 18(c) (invoice description must correspond with the credit)"
    retrieved: "2026-07-17"
  - id: "isbp-821"
    title: "ICC — International Standard Banking Practice for the Examination of Documents under UCP 600 (ISBP), 2023 revision, ICC Publication No. 821"
    authority: "icc"
    url: "https://academy.iccwbo.org/international-standard-banking-practice/"
    anchor: "General Principles (section A) and per-document sections (drafts B; invoices C; transport documents D–J; insurance K; certificates of origin L) — the practice standard banks examine against"
    retrieved: "2026-07-17"
  - id: "fedai-rules-10th"
    title: "FEDAI Rules, 10th Edition (05.04.2024)"
    authority: "other"
    url: "https://fedai.org.in/UploadPopupPageFiles/FEDAI_Rules_10th_Edition_5Apr2024.pdf"
    anchor: "Rule 2 (export transactions: crystallisation of overdue export bills into rupee liability per the AD bank's policy, at its TT selling rate, with interest recovered for the overdue period)"
    retrieved: "2026-07-17"
reviewer: "Sreenath Govindarajan"

boundary: [irdai]

image: "assets/cover.png"
tags: [letter of credit, ucp 600, isbp 821, discrepancies, trade finance]
---

# The Failure Rate Banks Built a Fee On

Documentary credits fail at the document check far more often than exporters believe, and the
number comes from the rule-maker itself. The ICC's introduction to UCP 600 records that when the
revision work began, global surveys indicated **"approximately 70% of documents presented under
letters of credit were being rejected on first presentation"** — and notes, in the same breath,
that banks' introduction of a **discrepancy fee** had highlighted the issue, "especially when
the underlying discrepancies have been found to be dubious or unsound." Seven in ten
presentations failing a mechanical examination is not a market of careless exporters; it is a
market where the examination standard is stricter, and more literal, than the document
preparation feeding it.

The economics of a failed presentation compound quietly. The fee itself is per event —
published Indian bank schedules price discrepancy events at **USD 100 per bill** on the import
side and **₹1,500 per shipping bill** per event on the export side, with foreign banks'
deductions on top (the full stack is priced in
[What One Documentation Failure Costs](/publications/export-documentation-failure-cost-anatomy/)).
The larger cost is positional: a discrepant presentation converts a bank's payment undertaking
into the buyer's option — payment now depends on the applicant's waiver, negotiated after the
goods have sailed. Under FEDAI's rules, an export bill that stays unpaid long enough is
crystallised into rupee liability at the AD bank's selling rate, with interest recovered for the
overdue period: the financing cost of a documentation defect, made explicit.

This note sets out the examination mechanics that produce the 70% — the clocks, the
correspondence standards, and the refusal procedure — and the preparation discipline that
inverts them.

## The Clocks: Five Days for the Bank, Twenty-One for You

Two deadlines in Article 14 decide many presentations before content is even weighed. Under
**Article 14(b)**, the nominated, confirming and issuing banks each have "a maximum of five
banking days following the day of presentation" to determine compliance — a window that is
expressly *not* shortened or extended by the credit's expiry falling within it. Under
**Article 14(c)**, a presentation containing original transport documents "must be made … not
later than **21 calendar days after the date of shipment**, but in any event not later than the
expiry date of the credit."

The 21-day rule is the pure operational failure in the taxonomy: it has nothing to do with
document quality. A complete, internally perfect document set assembled on day 24 is late, and
late is a discrepancy — grounds for refusal on its own. Late presentation is caused by slow
assembly across parties (carrier B/L release, certificate issuance, courier legs), which makes
it **100% preventable by calendar management**: the shipment date starts a countdown, and every
document supplier in the chain owes its output against that countdown, not against habit.

## The Correspondence Standards: One Strict, One Tolerant

UCP 600 applies two different matching standards to different parts of the presentation, and
conflating them produces both failure modes — the mismatch that refuses, and the over-engineered
paranoia that delays. The strict standard belongs to the invoice: under **Article 18(c)**, "the
description of the goods, services or performance in a commercial invoice **must correspond with
that appearing in the credit**" — Field 45A, as the applicant wrote it, abbreviations and all.
The tolerant standard governs everything else: under **Article 14(d)**, data in a document "need
not be identical to, but must not conflict with" data in that document, other documents, or the
credit.

Practice fails on both sides of that line. Invoices are cut from the exporter's ERP master
rather than from Field 45A, importing unit, spelling and specification variances into the one
document where correspondence is mandatory. Meanwhile transport and insurance documents are
nitpicked into delay for non-conflicting differences the rule tolerates. The examination
standard banks actually apply is codified in **ISBP 821** (the ICC's International Standard
Banking Practice, 2023 revision) — general principles plus document-by-document practice for
drafts, invoices, transport and insurance documents and certificates — which is why a
presentation prepared against ISBP, not against instinct, is prepared against the examiner's own
checklist.

### The Refusal Procedure: One Notice, Everything at Once

Article 16 shapes *how* failure arrives. A bank refusing to honour "must give a **single notice**
to that effect to the presenter," stating "**each discrepancy** in respect of which the bank
refuses" and the disposition of the documents (Art. 16(c)), by telecommunication no later than
the close of the fifth banking day (Art. 16(d)). The issuing bank may, in its judgement,
approach the applicant for a **waiver** (Art. 16(b)) — without extending the clock. The
single-notice rule means the exporter discovers every defect simultaneously, after the fee,
with the goods afloat; the waiver route means the remedy is the buyer's goodwill. Both are
arguments for finding the discrepancies while the documents are still drafts.

## Inverting the Statistic: Examination Before Presentation

The preparation discipline that beats a 70% failure rate is to run the bank's examination before
the bank does — against the credit's actual text, not the sales contract. Concretely: the credit
is parsed field by field on receipt (45A description verbatim, 46A document list, dates, ports,
tolerances); the invoice is drafted **from Field 45A**, not from the ERP; every required
document is mapped to its issuer with a due date derived from the 21-day countdown; and the
assembled set is examined against UCP 600 and ISBP 821 as a dry run — the same
document-agreement logic as the customs-side
[pre-LEO reconciliation](/publications/pre-leo-document-reconciliation/), applied to a different
examiner.

TradeWatch performs this dry-run examination as an LC pre-presentation check within its
readiness packets: credit terms parsed, each document validated for correspondence and
consistency under the UCP/ISBP standards, and the 21-day countdown tracked, with each finding
cited to the article it would fail. Kanan Labs prepares evidence and readiness; presentation,
negotiation and banking decisions remain with the exporter and its banks.
