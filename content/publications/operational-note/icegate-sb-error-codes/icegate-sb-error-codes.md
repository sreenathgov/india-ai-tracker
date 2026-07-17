---
title: "SB001–SB006: The ICEGATE Shipping Bill Error Codes, Explained"
slug: "icegate-sb-error-codes"
description: "SB001–SB006 are ICES validation codes for IGST export refunds. Each code names one mismatch between GSTR-1, the Shipping Bill and the EGM — each with one fix."
author: "Sreenath Govindarajan"

type: "operational-note"
cluster: "igst-customs"
entities: [sb000, sb001, sb002, sb003, sb004, sb005, sb006, icegate, ices, gstr-1-table-6a, gstr-3b, egm, leo, rule-96, form-9a, pfms, cha]

takeaways:
  summary: >-
    ICES validates every IGST export refund at invoice level against GSTR-1 data and returns one
    of seven codes, SB000 through SB006. Each error code names a specific mismatch — Shipping Bill
    details, EGM status, GSTIN or invoice number — and each has a fixing actor and procedure. Even
    SB000 does not always pay: four conditions gate the refund scroll.
  points:
    - "**SB001 and SB003** are fixed by the exporter amending GSTR-1 through **Form 9A (Table 9A)** in a subsequent period — the Shipping Bill cannot be amended once the EGM is filed."
    - "**SB002 and SB006** are carrier-side: the shipping line must file the EGM (or the gateway EGM for ICD shipments, with the train/truck summary and transference copy)."
    - "**SB005** requires the officer-interface route — a Concordance Table (Annexure A) to the AC (IGST Refunds) at **₹1,000 per Shipping Bill** under CBIC Circulars 05/2018 and 05/2021."
    - "**SB000 is validation, not payment**: exports under LUT, higher-rate drawback claims, IGST claims under ₹1,000, a stuck invoice on a multi-invoice Shipping Bill, a PFMS-unvalidated bank account or an IEC alert can all still zero or hold the scroll."

date: "2026-07-16"
reviewed: "2026-07-16"

sources:
  - id: "chennai-customs-igst-error-codes"
    title: "Chennai Customs — IGST Refund Response/Error Codes and Rectification Procedure"
    authority: "cbic"
    url: "https://chennaicustoms.gov.in/wp-content/uploads/2025/08/IGST-Refund-Response.pdf"
    anchor: "rows SB000–SB006 (per-code meaning and rectification procedure)"
    retrieved: "2026-07-16"
  - id: "dgos-igst-refund-guide"
    title: "Directorate General of Systems, CBIC — Guide on IGST Refunds in ICES"
    authority: "cbic"
    url: "https://jawaharcustoms.gov.in/pdf/GST_REFUND.pdf"
    anchor: "para 2 (code table); para 4(i)–(vii) (discussion of each code); para 6 (scroll generation); Annexure B (EGM error codes C, N, L, T, P)"
    retrieved: "2026-07-16"
  - id: "cgst-rule-96"
    title: "Rule 96, CGST Rules, 2017 — Refund of integrated tax paid on goods exported out of India"
    authority: "cbic"
    url: "https://taxinformation.cbic.gov.in/content/html/tax_repository/gst/rules/cgst_rules/active/chapter10/rule96_v1.00.html"
    anchor: "sub-rule (1)(a)–(b) (EGM and GSTR-3B as preconditions); sub-rule (2) (transmission by the common portal)"
    retrieved: "2026-07-16"
  - id: "cbic-circular-05-2018"
    title: "CBIC Circular No. 05/2018-Customs — Refund of IGST on Export: Invoice mis-match cases, Alternative Mechanism with Officer Interface"
    authority: "cbic"
    url: "https://www.cbic.gov.in/resources/htdocs-cbec/customs/cs-circulars/cs-circulars-2018/circ05-2018cs.pdf"
    anchor: "para 2(vii) (the major error categories); para 3 (SB005-only officer interface)"
    retrieved: "2026-07-16"
  - id: "cbic-circular-05-2021"
    title: "CBIC Circular No. 05/2021-Customs — IGST refunds on exports: extension in SB005 alternate mechanism"
    authority: "cbic"
    url: "https://info.eepcindia.org/files/210218165640.pdf"
    anchor: "para 4 (permanent officer interface; ₹1,000 fee per Shipping Bill)"
    retrieved: "2026-07-16"
  - id: "gstn-igst-refund-faq"
    title: "GST Portal — FAQs: Refund on Account of Export of Goods (With Payment of Tax)"
    authority: "gstn"
    url: "https://tutorial.gst.gov.in/userguide/refund/Refund_on_Account_of_Export_of_Goods_(With_Payment_of_Tax).htm"
    anchor: "FAQ 10 (Table 9A amendment of prior-period export invoices); FAQ 12 (five validations before GSTN transmits data to ICEGATE)"
    retrieved: "2026-07-16"
  - id: "cbic-circular-06-2018"
    title: "CBIC Circular No. 06/2018-Customs — Refund of IGST on export: EGM error related cases"
    authority: "cbic"
    url: "https://upload.indiacode.nic.in/showfile?actid=AC_CEN_2_2_00042_196252_1534829466423&type=circular&filename=circ06-2018cs.pdf"
    anchor: "para 6 (gateway EGM mismatch errors: M — incorrect gateway port code; C — container number; N — container count; T — nature of cargo; L — LEO after sailing date)"
    retrieved: "2026-07-16"
reviewer: "Sreenath Govindarajan"

boundary: [cha]

image: "assets/cover.png"
tags: [icegate, sb error codes, igst refund, shipping bill, gstr-1]
---

# One Validation, Seven Outcomes

Every IGST refund on export of goods passes through a single automated validation inside the
Indian Customs EDI System (ICES), and that validation returns **exactly one of seven response
codes per invoice**: SB000 (successfully validated), SB001 (invalid Shipping Bill details), SB002 (EGM not
filed), SB003 (GSTIN mismatch), SB004 (record already received), SB005 (invalid invoice number),
or SB006 (gateway EGM not available). The codes are documented across the Directorate General of
Systems' Guide on IGST Refunds in ICES, individual customs-zone rectification notices, and CBIC's
circular chain — this page assembles them into a single reference: what each code checks, who can
fix it, and by what procedure.

The mechanism the codes belong to is Rule 96 of the CGST Rules, 2017. The Shipping Bill is deemed
to be the refund application, but only once the carrier files the Export General Manifest (EGM)
and the exporter furnishes a valid GSTR-3B. GSTN then transmits the GSTR-1 Table 6A export data to
ICES, which matches it against the Shipping Bill invoice table — *at invoice level, as exact
strings*. Every code except SB000 names one way the two records disagree.

One structural fact drives every rectification procedure below: **the fix is almost never on the
customs side**. The Shipping Bill cannot be amended once the EGM is filed, so each error routes
to whichever record is *still writable* — the GST return (amendable via Form 9A), the manifest (filed
by the carrier), or, for SB005 alone, an officer-verified mapping between the two records.

| Code | Meaning | Fixing actor | Route |
|---|---|---|---|
| SB000 | Successfully validated | — | Scroll (four conditions still gate payment) |
| SB001 | Invalid SB details | Exporter | GSTR-1 amendment, Form 9A |
| SB002 | EGM not filed | Shipping line | File EGM |
| SB003 | GSTIN mismatch | Exporter | GSTR-1 amendment, Form 9A |
| SB004 | Record already received | Nobody | Duplicate; earlier record already validated |
| SB005 | Invalid invoice number | Exporter + customs officer | Concordance Table, ₹1,000/SB |
| SB006 | Gateway EGM not available | Shipping line / ICD | Gateway EGM, train/truck summary |

## What ICES Checks Before a Refund Scrolls

The validation compares a fixed set of identity parameters between the GSTN transmission and the
customs record: GSTIN, Shipping Bill number, and invoice number, with taxable value and IGST paid
carried alongside. Before any of that runs, GSTN applies its own five gate conditions — GSTR-1 and
GSTR-3B filed; export invoices present in Table 6A; complete Shipping Bill number, date and port
code against each invoice; IGST reported in Table 3.1(b) of GSTR-3B and not 3.1(a) or 3.1(c); and
Table 3.1(b) equal to or greater than the total IGST in Tables 6A and 6B of GSTR-1.

The two-stage design means a refund can fail **before ICES ever sees it**. Records that fail
GSTN's validations are not transmitted to customs at all, produce no SB-series code, and are
invisible in ICEGATE — CBIC's 2018 analysis found only about **32%** of GSTR-1/Table 6A records
were being transmitted. *An exporter whose Shipping Bill appears in no ICEGATE status report
should check the GSTN side first.*

## Why SB000 Still Does Not Always Pay

SB000 means the invoice validated — **not that money moves**. The DG Systems guide lists four
conditions under which a successfully validated Shipping Bill still produces a scroll amount of
zero: the export was made under bond or LUT (no IGST was paid, so nothing refunds); the Shipping
Bill covers multiple invoices and at least one is stuck in another error; drawback was claimed at
the higher rate, making the Shipping Bill ineligible; or the IGST claim is below ₹1,000.

Two further gates sit between the temporary and final scroll. A Shipping Bill enters the
temporary scroll but drops from the final scroll if the exporter's bank account has **not been
validated by PFMS**, or if there is an **alert or suspension on the IEC** in ICES — for arrears, pending e-BRC, or
similar. Both are visible in ICES reports and both are fixable (furnish correct account details;
clear the suspension), but neither announces itself to the exporter.

### The Scroll Mechanics Behind the Codes

The scroll is a two-officer, two-stage disbursal instrument, and its mechanics explain why a
validated invoice can still sit unpaid. Per the DG Systems guide (para 6), the **temporary IGST
refund scroll** is generated by the authorised officer in the **CLK role** in ICES; the
**permanent scroll** follows from the **AC_DBK role**, and only Shipping Bills that made the
temporary scroll are considered for it. Once the final scroll is generated, no further officer
action is needed — it transmits automatically to PFMS, which credits the bank account registered
with customs. Shipping Bills whose account details PFMS has not validated appear in the
temporary scroll carrying a "#" tag and are excluded from the final scroll; the guide's Annexure
A catalogues the PFMS error codes (TBE0001–TBE0025) and, for each, whether the exporter can cure
it by resubmitting correct account or IFSC details.

# The Codes, One by One

Each code below follows the same grammar: what mismatched, who holds the writable record, and the
procedure that clears it. The per-code meanings and rectification procedures are as published by
Chennai Customs and the DG Systems guide.

## SB001 — Invalid Shipping Bill Details

SB001 means **the Shipping Bill number or date furnished in GSTR-1 Table 6A does not match any
customs record** — almost always a clerical error made while filing the GST return, and fixable
*entirely on the GST side*. The exporter amends the export invoice through Form 9A (Table 9A of a
subsequent period's GSTR-1, available since 15.12.2017) with the correct Shipping Bill number,
date and port code. Once GSTN retransmits, the validation reruns. No customs procedure is
involved, and the CHA has nothing to correct: the filed Shipping Bill was never wrong.

## SB002 — EGM Not Filed

SB002 means the Export General Manifest that would prove the goods left India **has not been
filed electronically by the carrier**, so the Rule 96 precondition for treating the Shipping Bill
as a refund application is unmet. The rectification is to press the shipping line to file the EGM in
ICES. Where an EGM is filed but errors out, CBIC Circular 06/2018-Customs (para 6) and the DG
Systems guide's Annexure B catalogue the mismatch flags — M (incorrect gateway port code), C
(container number mismatch between Shipping Bill and EGM), N (number of containers), T (nature of
cargo), P (number of packets), L (LEO date later than sailing date) — each with its amendment
route through the service centre and proper officer. Several of these
flags are themselves downstream document-reconciliation failures, which is why they recur in
[the pre-LEO reconciliation note](/publications/pre-leo-document-reconciliation/).

## SB003 — GSTIN Mismatch

SB003 means **the GSTIN declared on the Shipping Bill is not the GSTIN that filed the
corresponding GST returns** — a common outcome for exporters with multiple state registrations,
where the factory files the return and the head office's GSTIN reached the Shipping Bill. The published fix is a
GSTR-1 amendment through Form 9A, with the caveat the Chennai Customs procedure states directly:
no amendment can be made to the Shipping Bill once the EGM has been filed. Where the return-side
GSTIN is the correct one, the amendment route resolves it; where the Shipping Bill's GSTIN is
simply wrong, the case converges on the same post-EGM rigidity that governs SB005.

## SB004 — Record Already Received

SB004 is the *one benign code*: GSTN transmitted the same Shipping-Bill-invoice record twice, and
ICES had already validated the earlier transmission for refund. **No action is required from
anyone**; the duplicate is ignored. Its only operational significance is diagnostic — an SB004 against an
unpaid refund means the payment blocker is elsewhere (typically a scroll-stage gate such as PFMS
validation), not in the invoice matching.

## SB005 — Invalid Invoice Number

SB005 means **the invoice number in the Shipping Bill's invoice table does not exactly match the
invoice number in GSTR-1** for the same supply — *the most common and the most consequential
code*, because neither record can simply be amended into agreement after EGM. Its two causes, per CBIC:
a typographical error at data entry, or the exporter's use of two invoice sets, one for GST and
one for customs. Its fix is unique among the codes: a Concordance Table (Annexure A) submitted to
the Assistant Commissioner (IGST Refunds) and verified through a permanent officer interface, at
**₹1,000 per Shipping Bill** under Circular 05/2021-Customs. The full mechanics — including the Rule
96 proviso that shifts the refund's deemed filing date until the mismatch is rectified — are in
[SB005: Why Your IGST Refund Blocks After EGM and How to Clear It](/publications/sb005-igst-refund-blocked/),
and the formatting divergence that typically causes it is dissected in
[Invoice Number Formatting: How Tally and ICEGATE Disagree](/publications/invoice-number-format-tally-icegate/).

## SB006 — Gateway EGM Not Available

SB006 is the inland container depot (ICD) variant of the manifest failure: the local EGM exists,
but the gateway port's electronic EGM is missing or stuck in error, so ICES cannot confirm the
goods left India. **A manually filed gateway EGM does not suffice** — the EGM must be filed in
ICES at the gateway port. The published rectification has three parts: file the train/truck summary
immediately after cargo leaves the ICD; have the shipping line include the ICD Shipping Bill in
its gateway-port EGM along with the transference copy; and clear residual errors through service-
centre amendment approved by the proper officer. Exporters shipping through ICDs see SB006
chronically, because it depends on two handoffs neither the exporter nor the CHA controls.

# Reading the Codes as a Routing Table

The seven codes reduce to a routing rule: identify which record disagrees with which, and **the
code tells you who can still write to it**. GST-return errors (SB001, SB003, and GSTR-1-side SB005 cases)
route to the exporter's finance team through Form 9A. Manifest errors (SB002, SB006) route to the
carrier and the gateway port. Shipping-Bill-side SB005 routes to the officer interface, because the
declaration itself is frozen. Nothing routes to the CHA post-EGM — *the party that filed the
Shipping Bill is precisely the one with no remaining write access*.

That asymmetry is the argument for catching all of these before the Let Export Order rather than
after the EGM. Every code in this reference is an exact-match failure between documents that
existed, side by side, at the draft-Shipping-Bill stage — including the RoDTEP declaration flags
whose omission becomes irreversible at the same moment (see
[RoDTEP 2026: The February Cut and the March Restoration](/publications/rodtep-2026-rate-volatility/)
for how rate volatility compounds that risk). Reconciled then, none of them occurs; discovered
after sailing, each costs weeks and some cost ₹1,000 per Shipping Bill plus a stalled refund clock.

TradeWatch runs this reconciliation as a pre-shipment readiness check: draft Shipping Bill fields
validated against the GST invoice, the packing list and the manifest inputs, each verdict cited to
the governing rule, before filing. Kanan Labs prepares a readiness packet. It does not file
Shipping Bills and holds no customs credentials — your licensed CHA files.
