---
title: "SB005: Why Your IGST Refund Blocks After EGM and How to Clear It"
slug: "sb005-igst-refund-blocked"
description: "SB005 blocks an IGST refund when the Shipping Bill invoice number diverges from GSTR-1 Table 6A. The fix is a Concordance Table filed with the customs officer."
author: "Sreenath Govindarajan"
image: "assets/sb005-igst-refund-blocked-cover.png"

type: "operational-note"
cluster: "igst-customs"
entities: [sb005, icegate, ices, gstr-1-table-6a, gstr-3b, annexure-a, concordance-table, leo, egm, rule-96, form-9a, cha]

takeaways:
  summary: >-
    An SB005 error blocks an IGST refund when the Shipping Bill invoice number diverges from the
    one filed in GSTR-1 Table 6A. The refund stalls silently after EGM; no rejection is issued.
    The fix is a Concordance Table (Annexure A) verified through the customs officer interface at
    ₹1,000 per Shipping Bill — the Shipping Bill itself cannot be amended.
  points:
    - "SB005 fires on an exact-string mismatch — **EXP/2026/0042 against EXP-2026-0042** is a single-character divergence and is enough to hold the refund."
    - "The refund is not rejected; it **silently stalls after the EGM**. Under the proviso to Rule 96(1)(b) of the CGST Rules, the refund application is deemed filed only on the date the mismatch is rectified."
    - "The fix is a **Concordance Table (Annexure A)** per CBIC Circular 05/2018-Customs para 3, submitted to the AC (IGST Refunds) with a TR-Challan of **₹1,000 per Shipping Bill** — a mechanism made permanent by Circular 05/2021-Customs."
    - "The Shipping Bill's invoice number **cannot be amended once the EGM is filed** — it is not among the fields ADC/JC approval can change under CBIC Circular 11/2025-Customs. Pre-shipment reconciliation is the only reliable prevention."

date: "2026-07-16"
reviewed: "2026-07-16"

sources:
  - id: "cbic-circular-05-2018"
    title: "CBIC Circular No. 05/2018-Customs — Refund of IGST on Export: Invoice mis-match cases, Alternative Mechanism with Officer Interface"
    authority: "cbic"
    url: "https://www.cbic.gov.in/resources/htdocs-cbec/customs/cs-circulars/cs-circulars-2018/circ05-2018cs.pdf"
    anchor: "para 2(ix) (two-invoice cause); para 3(a)–(e) and Annexure A (concordance procedure)"
    retrieved: "2026-07-16"
  - id: "cbic-circular-05-2021"
    title: "CBIC Circular No. 05/2021-Customs — IGST refunds on exports: extension in SB005 alternate mechanism"
    authority: "cbic"
    url: "https://info.eepcindia.org/files/210218165640.pdf"
    anchor: "para 4 (officer interface made permanent; ₹1,000 fee; Levy of Fees (Customs Documents) Regulations amendment via Notification No. 17/2021-Customs (N.T.))"
    retrieved: "2026-07-16"
  - id: "chennai-customs-igst-error-codes"
    title: "Chennai Customs — IGST Refund Response/Error Codes and Rectification Procedure"
    authority: "cbic"
    url: "https://chennaicustoms.gov.in/wp-content/uploads/2025/08/IGST-Refund-Response.pdf"
    anchor: "SB005 row (request letter to AC (IGST Refunds); Annexure A per P.N. 10/2018; TR-Challan ₹1,000 per SB)"
    retrieved: "2026-07-16"
  - id: "dgos-igst-refund-guide"
    title: "Directorate General of Systems, CBIC — Guide on IGST Refunds in ICES"
    authority: "cbic"
    url: "https://jawaharcustoms.gov.in/pdf/GST_REFUND.pdf"
    anchor: "para 4(vi) (SB005 largely cannot be corrected by amendment in GSTR-1 or the Shipping Bill); para 6 (scroll generation)"
    retrieved: "2026-07-16"
  - id: "cgst-rule-96"
    title: "Rule 96, CGST Rules, 2017 — Refund of integrated tax paid on goods exported out of India"
    authority: "cbic"
    url: "https://taxinformation.cbic.gov.in/content/html/tax_repository/gst/rules/cgst_rules/active/chapter10/rule96_v1.00.html"
    anchor: "sub-rule (1)(a)–(b) and the proviso to (1)(b) (deemed filing date shifts to the date the mismatch is rectified)"
    retrieved: "2026-07-16"
  - id: "ices-advisory-16-2025"
    title: "DGoS ICES Advisory No. 16/2025 — Post EGM Amendment Module (circulated as Chennai Customs Facility Circular No. 05/2025 – Exports)"
    authority: "cbic"
    url: "https://chennaicustoms.gov.in/wp-content/uploads/2025/04/Facility-Circular-No.-05-of-2025Exports-dated-16-04-2025.pdf"
    anchor: "para 4 (three-role workflow: POST_AMD, PO_EG_AM with Option 10 integrity check, PEA_AC); para 2 (initial court-order condition, since superseded)"
    retrieved: "2026-07-16"
  - id: "cbic-circular-11-2025"
    title: "CBIC Circular No. 11/2025-Customs — Implementation of the Export Entry (Post export conversion in relation to instrument-based scheme) Regulations, 2025 (as reproduced in Mangaluru Customs Public Notice No. 20/2025)"
    authority: "cbic"
    url: "https://bangalorecustoms.gov.in/wp-content/uploads/2025/08/mcc_pn_20_2025.pdf"
    anchor: "para 3 and Table I (fields amendable with ADC/JC approval: ports, country of final destination, AD Code, invoice value, HS code, description, quantity — the invoice number is not listed); para 4(b) (one-year time limit under Notification No. 21/2025-Customs (N.T.))"
    retrieved: "2026-07-16"
  - id: "cbic-notification-17-2021-nt"
    title: "Notification No. 17/2021-Customs (N.T.) — Levy of Fees (Customs Documents) Amendment Regulations, 2021"
    authority: "cbic"
    url: "https://www.cbic.gov.in/htdocs-cbec/customs/cs-act/notifications/notfns-2021/cs-nt2021/csnt17-2021.pdf"
    anchor: "regulation 3, Table, serial number (x) as inserted — 'Handling of mismatch between Shipping Bill and GST returns in Customs Automated System: Rs. 1000.00'"
    retrieved: "2026-07-16"
  - id: "chennai-pn-10-2018"
    title: "Chennai Customs Public Notice No. 10/2018 — IGST refunds: invoice mis-match cases, alternative mechanism with officer interface"
    authority: "cbic"
    url: "https://chennaicustoms.gov.in/wp-content/uploads/2021/08/1519732154.pdf"
    anchor: "para 5 (dedicated IGST Refund cell at Custom House, Chennai) and the Annexure A concordance format localising CBIC Circular 05/2018"
    retrieved: "2026-07-16"
  - id: "gstn-igst-refund-faq"
    title: "GST Portal — FAQs: Refund on Account of Export of Goods (With Payment of Tax)"
    authority: "gstn"
    url: "https://tutorial.gst.gov.in/userguide/refund/Refund_on_Account_of_Export_of_Goods_(With_Payment_of_Tax).htm"
    anchor: "FAQ 9(ii) (invoice numbers in Table 6A must be the same as in the Shipping Bill); FAQ 12 (five validations before transmission to ICEGATE)"
    retrieved: "2026-07-16"
reviewer: "Sreenath Govindarajan"

boundary: [cha]

tags: [sb005, igst refund, icegate, shipping bill, concordance table]
---

# A Refund That Stalls Silently After the Ship Has Sailed

SB005 is the response code the Indian Customs EDI System (ICES) returns when **the invoice number
declared in the Shipping Bill does not match the invoice number filed in GSTR-1 Table 6A** for the
same supply. The Directorate General of Systems calls it "the most common error faced by the
exporters" in its Guide on IGST Refunds in ICES. It is also the most expensive of the seven
validation codes, because it is the one that, in most configurations, neither the exporter nor the
Customs House Agent can correct by amendment after the Export General Manifest (EGM) is filed.

The failure has a specific shape. The goods ship. The Let Export Order (LEO) was granted without
objection, because the invoice mismatch is not a customs-clearance check — it is a refund-scroll
check that runs only after the EGM and the GST returns meet in ICES. Weeks later, the IGST paid on
the export has not arrived, and no rejection letter explains why. The refund has not been
*denied*. It is *stalled*, invoice by invoice, behind a validation that compared two strings and
found them unequal.

This note explains where SB005 fires in the refund pipeline, why it fires, the officer-interface
procedure that clears it, and the pre-shipment reconciliation that prevents it. It is one of the
seven codes covered in the companion reference,
[SB001–SB006: ICEGATE Shipping Bill Error Codes, Explained](/publications/icegate-sb-error-codes/).

## Where SB005 Fires in the Refund Pipeline

SB005 fires inside the automated matching step of Rule 96 of the CGST Rules, 2017 — **after
export, not before it**. Under Rule 96(1), the Shipping Bill itself is deemed to be the refund application
for IGST paid on exported goods, but only once two events complete: the carrier files the EGM, and
the exporter furnishes a valid GSTR-3B. Only then does ICES validate the GSTR-1 Table 6A data
transmitted by GSTN against the Shipping Bill's invoice table, at invoice level.

The consequence of this sequencing is the silence. Nothing in the pre-shipment workflow — document
checks, assessment, LEO — evaluates whether the Shipping Bill invoice number equals the GSTR-1
invoice number. The first system that compares them is the refund validation, which runs after the
vessel has sailed. A mismatch therefore never blocks the *shipment*; it blocks the *money*, and
only the money, at a stage where the underlying declaration is frozen.

The stall is visible only to someone who looks. ICES writes the response code to the GSTN
Integration Status Report, and a registered exporter can see the per-Shipping-Bill code in the
ICEGATE website login. There is no outbound rejection notice tied to SB005 itself. An export or
finance team that does not track response codes discovers the block as unexplained missing working
capital.

### The Proviso That Moves the Filing Date

Since the 2024 amendment of Rule 96 (Notification No. 12/2024-Central Tax, dated 10.07.2024), the
stall has a legal form, not just an operational one. The proviso to Rule 96(1)(b) states that where
the Shipping Bill data and the GSTR-1 data mismatch, the refund application "shall be deemed to
have been filed **on such date when such mismatch in respect of the said shipping bill is
rectified by the exporter**." A mismatched refund claim is not a pending claim — in law, it has
not yet been filed. *Every week the mismatch stands unrectified is a week the refund clock has
not started.*

## Why It Happens: Two Invoices for One Supply

The root cause identified by CBIC in Circular 05/2018-Customs, para 2(ix), is that exporters
maintain **two sets of invoices for the same supply** — one invoice for GST and another for
customs —
"resulting in mismatch of invoice numbers, including mis-match in taxable value and IGST paid."
The GST return carries the tax invoice number issued under the CGST Rules; the Shipping Bill
carries whatever the commercial invoice said, as keyed by the CHA's EDI software.

The two documents usually describe the same transaction with the same value. The divergence is in
the identifier. A Tally-issued GST invoice numbered **EXP/2026/0042** and a commercial invoice
rendered **EXP-2026-0042** differ by one character class, and the ICES match is exact-string:
*that single formatting divergence returns SB005*. The same happens when a prefix is present on one
document and absent on the other, when a financial-year suffix is written 2026-27 on one and 26-27
on the other, or when a typographical slip enters at data entry — the second cause CBIC names.

How accounting-software formats and the Shipping Bill entry drift apart — and the CGST rule that
defines what an invoice number may legally contain — is covered in
[Invoice Number Formatting: How Tally and ICEGATE Disagree](/publications/invoice-number-format-tally-icegate/).

# Clearing an SB005 Block

The clearance route for SB005 is administrative, not judicial, and it is standing machinery: a
Concordance Table verified by a customs officer through an interface built into ICES for exactly
this error. What the route does not include is any amendment of the Shipping Bill itself. The fix
maps the mismatched identifiers to each other; it does not repair them.

## The Concordance Table (Annexure A) Procedure

CBIC Circular 05/2018-Customs, para 3, establishes the alternative mechanism: an officer interface
on ICES through which a customs officer can verify the GSTN data against the Shipping Bill data
and sanction the refund where the GSTR-1 details are correct though the Shipping Bill details were
at variance. The circular is explicit that the mechanism processes "**only those cases where the
error code is mentioned as SB005**."

The exporter's side of the procedure is the Concordance Table, in the format of Annexure A to the
circular: a Shipping-Bill-wise mapping between each GST invoice and the corresponding Shipping
Bill invoice, with taxable value and IGST amount for each, signed with a declaration that all
listed invoices were exported and filed in GSTR-1. Chennai Customs localised the mechanism
through its Public Notice 10/2018, which established a dedicated IGST Refund cell, and its
current published rectification procedure states the submission as three items: a request letter
to the Assistant Commissioner (IGST Refunds) with the invoice, packing list and related
documents; the duly filled Concordance Table in the Annexure A format; and the original
TR-Challan evidencing the fee introduced in 2021.

The officer verifies the mapping, can edit the IGST-paid figure for short shipment or
miscalculation, and accepts, rejects or amends each invoice pair. Once every invoice under the
Shipping Bill is verified, ICES computes the scroll amount and the refund proceeds through the
normal scroll — electronically through PFMS, never by cheque. Para 3(e) adds a permanent side
effect: GSTR-1 invoices against which a refund is sanctioned are disabled in the system, so the
same invoice can never support a second claim.

## A Permanent Mechanism With a Fixed Fee

CBIC Circular 05/2021-Customs, para 4, converted what began as a time-boxed concession into
standing machinery. The original mechanism applied only to Shipping Bills filed until 31.12.2017
and was extended six times — Circulars 08/2018, 15/2018, 22/2018, 40/2018, 26/2019 and 22/2020 —
each extension chasing a backlog that kept regenerating. The 2021 circular ended the cycle: the
officer interface is available "**on permanent basis**," for all past Shipping Bills
"irrespective of its date of filling," on payment of **₹1,000 per Shipping Bill**. The statutory
authority for the fee is Notification No. 17/2021-Customs (N.T.) dated 17.02.2021, which amended
the Levy of Fees (Customs Documents) Regulations, 1970 by inserting serial (x): "Handling of
mismatch between Shipping Bill and GST returns in Customs Automated System — Rs. 1000.00."

The permanence cuts both ways. An SB005 block is recoverable — at ₹1,000 per Shipping Bill, plus
the documentation effort, plus the weeks of working capital the deemed-filing proviso adds. Six
extension circulars in three years are also the record of how routinely the error recurs.

## What Cannot Be Fixed After EGM

The Shipping Bill's own invoice entry is not correctable once the EGM is filed. The DG Systems
guide states the position twice: "**any mistake in the SB cannot be amended once EGM is filed**,"
and, summarising, the SB005 error "largely, cannot be corrected by any amendment either in GSTR 1
or in the Shipping Bill." Where the error originated in GSTR-1 — a data-entry slip in Table 6A — the
exporter can amend through Table 9A (Form 9A) in a subsequent period's GSTR-1. Where the error is
in the Shipping Bill, the concordance route is the only administrative path.

A post-EGM amendment module does exist in ICES — a three-role workflow through JC/ADC
activation, Appraiser data entry with a mandatory integrity check, and AC/DC approval (ICES
Advisory No. 16/2025) — and since April 2025 it operates under CBIC Circular No. 11/2025-Customs
and the Export Entry (Post export conversion in relation to instrument-based scheme) Regulations,
2025. But its field list is the tell: the fields amendable with Additional/Joint Commissioner
approval are the ports, country of final destination, AD Code, invoice **value**, HS code,
description and quantity — **the invoice number is not among them**. For an invoice-number
mismatch, the practical meaning is unchanged: *the CHA who filed the Shipping Bill is locked out
of correcting it the moment the manifest is filed*, and the concordance route remains the only
administrative repair.

# Preventing SB005 Before the Let Export Order

Prevention is a one-field reconciliation performed before filing: the invoice number that will be
keyed into the Shipping Bill must equal, **character for character**, the invoice number that
will be filed in GSTR-1 Table 6A. The GST Portal's own filing guidance states the requirement plainly —
"Invoice numbers provided in Table-6A of FORM GSTR-1 are same as that given in Shipping Bill" —
and CBIC's advisories since 2018 have carried the same instruction: *one GST-compliant export
invoice, declared identically at both ends*.

Operationally the check belongs at the draft-Shipping-Bill stage, when the CHA's checklist comes
back for approval and every field is still amendable. The comparison is between the tax invoice as
issued in the accounting system and the invoice number as keyed in the draft — not between two
documents that both look plausible. The wider pre-LEO discipline, across all four documents of the
shipment spine, is set out in
[Reconciling the Invoice, Packing List, B/L and Shipping Bill Before LEO](/publications/pre-leo-document-reconciliation/).

This is the check TradeWatch performs as part of its Shipping Bill Readiness Packet: the draft
Shipping Bill's invoice fields are reconciled against the GST invoice at source, with each
verdict cited to the rule it rests on, before the packet reaches the filing stage. Kanan Labs
prepares a readiness packet. It does not file Shipping Bills and holds no customs credentials —
your licensed CHA files.
