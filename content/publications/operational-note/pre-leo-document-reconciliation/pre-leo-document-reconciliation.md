---
title: "Reconciling Invoice, Packing List, B/L and Shipping Bill Before LEO"
slug: "pre-leo-document-reconciliation"
description: "Invoice, packing list, B/L and Shipping Bill must agree field by field before LEO. Section 149 of the Customs Act bars most amendments once goods are exported."
author: "Sreenath Govindarajan"

type: "operational-note"
cluster: "igst-customs"
entities: [leo, egm, commercial-invoice, packing-list, bill-of-lading, shipping-bill, customs-act-50, customs-act-149, icegate, ices, sb005, sb003, gstr-1-table-6a, hs-code, cha]

takeaways:
  summary: >-
    Four documents describe one shipment — Commercial Invoice, Packing List, Bill of Lading and
    Shipping Bill — and customs, GST and manifest systems check them against each other after
    export, once Section 149 of the Customs Act has frozen the declaration. Pre-LEO reconciliation
    verifies identity, quantity, value and cargo fields for agreement while every record is still
    writable.
  points:
    - "Section 149 of the Customs Act, 1962 bars amendment of a Shipping Bill after export except on **documentary evidence in existence at the time the goods were exported**; post-export changes to specified fields need **Additional/Joint Commissioner approval** under CBIC Circular 11/2025-Customs, within a one-year window."
    - "Identity fields must match as **exact strings**: invoice number (SB005), GSTIN (SB003), and container numbers — EGM error flag **C** fires when the Shipping Bill and manifest containers differ."
    - "Quantity fields reconcile across all four documents: package counts (EGM flags **N** and **P**), net and gross weights, and the declared unit codes."
    - "The Shipping Bill's declaration is subscribed as true at the foot of the document under **Section 50(2)** — every field inherited from an unreconciled invoice or packing list is declared to customs as fact."

date: "2026-07-16"
reviewed: "2026-07-16"

sources:
  - id: "customs-act-1962"
    title: "The Customs Act, 1962 (Act 52 of 1962)"
    authority: "india-statute"
    url: "https://www.indiacode.nic.in/handle/123456789/2475"
    anchor: "s. 50(2) (declaration of truth subscribed on the Shipping Bill); s. 51(1) (order permitting clearance and loading — the Let Export Order); s. 149 proviso (post-export amendment only on documentary evidence in existence at export)"
    retrieved: "2026-07-16"
  - id: "ices-advisory-16-2025"
    title: "DGoS ICES Advisory No. 16/2025 — Post EGM Amendment Module (circulated as Chennai Customs Facility Circular No. 05/2025 – Exports)"
    authority: "cbic"
    url: "https://chennaicustoms.gov.in/wp-content/uploads/2025/04/Facility-Circular-No.-05-of-2025Exports-dated-16-04-2025.pdf"
    anchor: "para 4 (three-role amendment workflow in ICES); para 2 (initial court-order condition, since superseded by Circular 11/2025-Customs)"
    retrieved: "2026-07-16"
  - id: "cbic-circular-11-2025"
    title: "CBIC Circular No. 11/2025-Customs — Implementation of the Export Entry (Post export conversion in relation to instrument-based scheme) Regulations, 2025 (as reproduced in Mangaluru Customs Public Notice No. 20/2025)"
    authority: "cbic"
    url: "https://bangalorecustoms.gov.in/wp-content/uploads/2025/08/mcc_pn_20_2025.pdf"
    anchor: "para 3 and Table I (fields amendable with ADC/JC approval); para 4(b) (one-year time limit from the s. 51 clearance order, per Notification No. 21/2025-Customs (N.T.) dated 03.04.2025)"
    retrieved: "2026-07-16"
  - id: "dgos-igst-refund-guide"
    title: "Directorate General of Systems, CBIC — Guide on IGST Refunds in ICES"
    authority: "cbic"
    url: "https://jawaharcustoms.gov.in/pdf/GST_REFUND.pdf"
    anchor: "Annexure B (EGM error flags C, N, T, P, L and their rectification, including LEO cancellation at gateway ports)"
    retrieved: "2026-07-16"
  - id: "chennai-customs-igst-error-codes"
    title: "Chennai Customs — IGST Refund Response/Error Codes and Rectification Procedure"
    authority: "cbic"
    url: "https://chennaicustoms.gov.in/wp-content/uploads/2025/08/IGST-Refund-Response.pdf"
    anchor: "SB003 and SB005 rows (GSTIN and invoice-number matching; no Shipping Bill amendment once EGM is filed)"
    retrieved: "2026-07-16"
  - id: "cbic-circular-05-2018"
    title: "CBIC Circular No. 05/2018-Customs — Refund of IGST on Export: Invoice mis-match cases, Alternative Mechanism with Officer Interface"
    authority: "cbic"
    url: "https://www.cbic.gov.in/resources/htdocs-cbec/customs/cs-circulars/cs-circulars-2018/circ05-2018cs.pdf"
    anchor: "para 2(ii)–(vii) (prerequisites for refund processing and the major cross-record error categories)"
    retrieved: "2026-07-16"
  - id: "gstn-igst-refund-faq"
    title: "GST Portal — FAQs: Refund on Account of Export of Goods (With Payment of Tax)"
    authority: "gstn"
    url: "https://tutorial.gst.gov.in/userguide/refund/Refund_on_Account_of_Export_of_Goods_(With_Payment_of_Tax).htm"
    anchor: "FAQ 9 (per-invoice data standards for Table 6A); FAQ 12 (validations before transmission to ICEGATE)"
    retrieved: "2026-07-16"
reviewer: "Sreenath Govindarajan"

boundary: [cha, irdai, classification]

image: "assets/cover.png"
tags: [pre-leo, document reconciliation, shipping bill, packing list, bill of lading, commercial invoice]
---

# Four Documents, One Truth, and a Deadline

An export shipment is described four times before it leaves India: by the Commercial Invoice
(value and transaction identity), the Packing List (physical quantities), the Bill of Lading
(carriage and custody), and the Shipping Bill (the statutory declaration to customs under Section
50 of the Customs Act, 1962). The systems that process the shipment — ICES, GSTN, the carrier's
manifest — assume these four records agree, and they test that assumption at specific points,
**almost all of which fall after the Let Export Order (LEO)**, when disagreement can no longer be
edited away.

The deadline structure is what makes reconciliation a pre-shipment discipline rather than a
post-hoc repair. LEO is the order under Section 51 permitting clearance and loading. After export,
Section 149's proviso permits amendment of the Shipping Bill only on the basis of documentary
evidence that existed at the time of export — and once the Export General Manifest (EGM) is filed,
the practical routes narrow further: the refund-validation codes SB001–SB006 each route around the
frozen Shipping Bill rather than through it, and post-EGM amendment in ICES is a formal,
approval-gated procedure limited to specified fields and a one-year window. *What was a free correction at the draft stage becomes, after sailing, a fee,
a procedure, or litigation.*

This note sets out the field-by-field reconciliation across the four documents: which fields must
match exactly, which must be consistent, which system checks each pair, and what fires when the
check fails. The per-code fixes live in the companion reference,
[SB001–SB006: The ICEGATE Shipping Bill Error Codes, Explained](/publications/icegate-sb-error-codes/).

## Why LEO Is the Reconciliation Deadline

The Let Export Order converts working documents into a **sworn record**. Under Section 50(2) of
the Customs Act, the exporter presenting a Shipping Bill "shall at the foot thereof make and
subscribe to **a declaration as to the truth of its contents**" — every value, weight, count and
identifier on the Shipping Bill is declared to customs as fact, *including every field that was
copied from an invoice or packing list nobody cross-checked*. Under Section 51, the proper officer's clearance
order rests on that declaration.

After export, the correction window is narrow in law and gated in practice. Section 149 permits
amendment only at the proper officer's discretion and, post-export, only on documentary evidence
in existence at the time of export. The machinery under it — the Export Entry (Post export
conversion in relation to instrument-based scheme) Regulations, 2025, implemented by CBIC
Circular No. 11/2025-Customs of 03.04.2025 — allows amendment of a **specified field list only**
(ports, country of final destination, AD Code, invoice value, HS code, description, quantity),
each change requiring **Additional/Joint Commissioner approval**, within **one year** of the
Section 51 clearance order, extensible by six months by the jurisdictional Commissioner and a
further six by the Chief Commissioner, on recorded reasons. The refund pipeline is stricter
still — Chennai Customs' rectification procedures state flatly that no amendment can be made to
the Shipping Bill once the EGM has been filed, and the invoice number is not on the amendable
list at all. Correction migrates to whichever record is still writable: the GST return, the
manifest, or an officer-verified mapping.

### The Post-Export Amendment Machinery, Precisely

The current post-export amendment machinery dates from 3 April 2025, when Notification No.
21/2025-Customs (N.T.) issued the Export Entry (Post export conversion in relation to
instrument-based scheme) Regulations, 2025, superseding the 2022 Shipping Bill conversion
regulations, and CBIC Circular No. 11/2025-Customs implemented them in ICES. The amendable field
list (Table I of the circular) is closed: Port of Loading, Country of Final Destination, Port of
Discharge, AD Code, Invoice Value, HS Code, Description of Goods, and Quantity — each requiring
Additional/Joint Commissioner approval, with conversions of Shipping Bills between schemes
requiring the Principal Commissioner/Commissioner. The clock runs one year from the Section 51
clearance order; the jurisdictional Commissioner may extend it by up to six months on recorded
reasons, and the Chief Commissioner by a further six. Applications are scrutinised once, with a
single deficiency memo issued within 15 working days where the file is incomplete — and the
application date is the date the *complete* application is received, which makes late, sloppy
filings self-penalising.

# The Reconciliation Matrix

The reconciliation is a finite set of field families, each with its own matching standard and its
own failure mode. **Identity fields must be equal as strings. Quantity fields must be equal as
numbers, in the same units. Value fields must be arithmetically consistent. Cargo-identity fields
must be consistent at the right level of specificity.** Treating all four families as "the
documents should match" is how teams check *everything loosely and nothing exactly*.

| Field family | Matching standard | Checked by | Failure signal |
|---|---|---|---|
| Identity — invoice no., GSTIN, container nos. | Exact string equality | ICES↔GSTN refund validation; EGM validation | SB005, SB003; EGM flag C |
| Quantity — packages, weights, units | Same numbers, same units | EGM validation; Risk Management System | EGM flags N, P, T; examination |
| Value — totals, currency, Incoterm | One consistent arithmetic | Assessment; refund validation | Value/IGST mismatch within SB005; queries |
| Cargo identity — HS code, description | Consistency at required granularity | Assessment; incentive schemes | Queries; misapplied duty or incentive rates |

## Identity Fields: Exact-String Matches

The identifiers that link the four documents — invoice number, GSTIN, IEC, container numbers,
Shipping Bill number in the GST return — are matched by machine as **exact strings**, and each
has a named failure code. The invoice number on the Shipping Bill against GSTR-1 Table 6A is the SB005
check, where a one-character formatting divergence (EXP/2026/0042 against EXP-2026-0042) blocks
the IGST refund; its formatting mechanics are dissected in
[Invoice Number Formatting: How Tally and ICEGATE Disagree](/publications/invoice-number-format-tally-icegate/).
The GSTIN on the Shipping Bill against the GSTIN filing the returns is the SB003 check — a live
risk for multi-registration exporters. The container numbers on the Shipping Bill against the
EGM is error flag C in the manifest validation.

The pre-LEO verification standard for this family is **character equality against the issuing
system, not visual similarity between PDFs**. The invoice number is verified against the accounting
system's tax invoice; the GSTIN against the registration that will file GSTR-1 for the supply;
container and seal numbers against the final stuffing report rather than the booking. Consignee
name and address should also be verbatim-consistent across invoice, packing list and B/L draft —
they are not machine-matched by ICES, but they are read side by side by banks and, later, by
insurers and surveyors.

## Quantity Fields: Counts, Weights and Units

Package counts and weights reconcile across all four documents, and the manifest validation names
their failure flags: N (number of containers mismatched between Shipping Bill and EGM), P (number
of packets), T (nature of cargo). The DG Systems guide's Annexure B sets out the repair
choreography when these fire at a gateway port — EGM amendment where the manifest is wrong, and
where the Shipping Bill is wrong, a sequence that runs through LEO cancellation, amendment,
re-registration and fresh LEO. Every step of that sequence is avoidable at the draft stage by
*counting once, carefully, in one place*.

Three consistency rules cover most quantity failures. First, the package count in the Packing
List's detail must equal its own header total — internally inconsistent packing lists (**a header
declaring 10 packages over a table listing 9**) are a documented pattern in MSME documentation.
Second, net and gross weights must be the same figures, in the same unit, on the Packing List, the
B/L draft and the Shipping Bill, with rounding applied once rather than at each transcription.
Third, the unit of measurement declared on the Shipping Bill must be the statutory unit for the
tariff item, not the commercial unit the invoice happens to use — pieces against kilograms is a
units mismatch even when both figures are individually right.

## Value Fields: One Arithmetic, Three Statements

The Commercial Invoice's value, the Shipping Bill's declared value and the GST return's taxable
value must tell **one arithmetic story**: line totals summing to the invoice total, the invoice total
reconciling to the Shipping Bill's FOB and invoice-value declarations under the stated currency
and Incoterm, and the taxable value and IGST in GSTR-1 Table 6A matching what the Shipping Bill
claims. CBIC's Circular 05/2018 lists value-and-tax consistency between GSTR-1, GSTR-3B and the
Shipping Bill among the prerequisites for refund processing — the invoice-mismatch code SB005
covers "mis-match in taxable value and IGST paid," not only the invoice number.

Two structural traps sit in this family. The delivery term governs what the invoice total
contains: **an invoice issued CIF whose total is declared as FOB** on the Shipping Bill misstates
the FOB value and *every FOB-derived figure downstream*, including drawback and RoDTEP bases. And the
currency must be declared as an ISO code consistently — an invoice totalled in one currency with
the Shipping Bill assessed in another is a value mismatch regardless of the numbers. MSME invoice
templates that embed the delivery term inside a price line ("CIF Jebel Ali" against the total)
rather than a labelled field make this reconciliation a reading exercise; it should be a field
comparison.

## Cargo Identity: Descriptions and Tariff Granularity

Goods descriptions and tariff classifications must be consistent at the level each document
requires, which is not the same level on all four. The Shipping Bill requires the full **eight-digit
ITC(HS) tariff item**; commercial invoices frequently carry four- or six-digit headings from the
accounting master. A six-digit invoice heading and an eight-digit Shipping Bill item are not
automatically a contradiction — the reconciliation question is whether the invoice's heading is
the ancestor of the Shipping Bill's item, and whether one consistent classification underlies
duty, incentive and any licensing determination. Divergent classifications across documents invite
assessment queries and misapplied incentive rates; classification itself is a determination that
requires human review and is not settled by reconciliation.

Descriptions differ by design and must be reconciled by **containment rather than equality**. A B/L
describing "auto components" over an invoice specifying lithium-ion battery modules is
conventional manifest abbreviation; the check is that the generic description truthfully contains
the specific one, that any dangerous-goods character visible in the specific description is not
laundered out of the generic one, and that marks and numbers on the Packing List match what is
actually stencilled on the cargo the B/L will carry.

# Running the Reconciliation Before Filing

The reconciliation has a natural venue: the CHA's draft-Shipping-Bill checklist, which arrives for
the exporter's approval when every field in every record is still correctable for free. The
sequence that works treats the checklist as **a comparison event, not a signature event** — each field
family above is verified against its issuing system (accounting software for invoice data, the
packing floor's final tally for quantities, the stuffing report for containers, the GST portal's
registration for GSTIN) before approval goes back.

Two disciplines keep the exercise honest. Corrections are made **upstream, in the system that owns
the field**, and corrected documents are reissued — *editing the draft Shipping Bill to match a
wrong packing list reconciles the paperwork and misdeclares the cargo*. And versions are pinned: the
manifest data the carrier files should derive from the same document versions the Shipping Bill
was filed from, because a B/L draft cut from invoice version 1 while customs holds version 2 is
how container and weight mismatches surface at the gateway port with an L, N or C flag.

TradeWatch performs this reconciliation as a single pre-shipment readiness check across the
document spine: identity, quantity, value and cargo fields compared field-by-field between the
Commercial Invoice, Packing List, B/L draft and draft Shipping Bill, each disagreement flagged
with a four-state readiness verdict and a citation to the rule it would breach. Kanan Labs
prepares a readiness packet. It does not file Shipping Bills and holds no customs credentials —
your licensed CHA files.
