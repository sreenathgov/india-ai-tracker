---
title: "e-SANCHIT: The Upload Failures That Stall Assessment and LEO"
slug: "e-sanchit-document-gaps"
description: "e-SANCHIT rejects uploads that break its spec — PDF/A, 200 dpi, 75 KB per page, signed with the ICEGATE-registered DSC. A failed IRN stalls assessment and LEO."
author: "Sreenath Govindarajan"

type: "operational-note"
cluster: "igst-customs"
entities: [e-sanchit, irn, icegate, ices, leo, dsc, shipping-bill, cbic-circular-43-2018, cha]

takeaways:
  summary: >-
    e-SANCHIT is the only channel for supporting documents on ICEGATE, and it enforces a precise
    technical specification: PDF/A (ISO 19005-2), at least 200 dpi, 75 KB per A4 page within a
    1 MB file, digitally signed with the DSC registered on ICEGATE. A defective upload yields no
    IRN, and without the IRN the document does not exist for assessment.
  points:
    - "The spec is exact: **PDF/A (ISO 19005-2), minimum 200 dpi black-and-white, 75 KB per A4 page, 1 MB per file (about 13 pages)** — oversized documents must be split and uploaded as separate files."
    - "The upload must be **digitally signed by the same user whose DSC is registered on ICEGATE** — a signature mismatch fails validation before any officer sees the document."
    - "A successful upload returns an **IRN (Image Reference Number)**, which is quoted against the document code in the Shipping Bill; per CBIC Circular 43/2018-Customs, assessment queries are answered by uploading through e-SANCHIT and linking the IRN by amendment."
    - "**Step 1 of the ICEGATE eSANCHIT Process Guide** names physical scanning artefacts as rejection grounds: stapler and punch-hole marks must sit in the margins, no folds, no skew, no dark patches — scanning habits, not regulation knowledge, decide whether the packet clears."

date: "2026-07-17"
reviewed: "2026-07-17"

sources:
  - id: "icegate-esanchit-guide"
    title: "ICEGATE — eSANCHIT: Step-by-Step Procedure for Electronic Document Upload"
    authority: "icegate"
    url: "https://www.icegate.gov.in/sites/default/files/2022-04/eSANCHIT_Process_Guide_updated.pdf"
    anchor: "Step 1 (PDF/A ISO 19005-2; 200 dpi; 75 KB/A4 page; 1 MB ceiling; stapler/punch-hole, fold, skew and dark-patch rules); Step 5 (digital-signature validation); IRN generation on successful upload"
    retrieved: "2026-07-17"
  - id: "cbic-circular-29-2018"
    title: "CBIC Circular No. 29/2018-Customs — e-SANCHIT for exports: pilot at ACC New Delhi and Chennai"
    authority: "cbic"
    url: "https://upload.indiacode.nic.in/showfile?actid=AC_CEN_2_2_00042_196252_1534829466423&type=circular&filename=circular-29-2018-customs.pdf"
    anchor: "paras 2–3 (upload procedure for exports; IRN obtained on ICEGATE and linked to the Shipping Bill)"
    retrieved: "2026-07-17"
  - id: "cbic-circular-43-2018"
    title: "CBIC Circular No. 43/2018-Customs — extension of e-SANCHIT to all ICES locations for exports (08.11.2018)"
    authority: "cbic"
    url: "https://www.cbic.gov.in/entities/view-circular-instruction"
    anchor: "paras 2–4 (pan-India extension for exports from 08.11.2018; voluntary at launch with a 15-day review toward mandatory use); paras 3.2–3.4 (assessment queries answered by e-SANCHIT upload; IRN linked by Service Centre amendment before goods registration and LEO)"
    retrieved: "2026-07-17"
  - id: "cbic-circular-42-2019"
    title: "CBIC Circular No. 42/2019-Customs — Mandatory uploading of specified supporting documents with document code and IRN"
    authority: "cbic"
    url: "https://www.cbic.gov.in/entities/view-circular-instruction"
    anchor: "document-code scheme (invoice 380000; invoice-cum-packing-list 331000; bill of lading 705000; master B/L 704000; house B/L 714000; sea waybill 710000; air waybill 740000), effective 02.12.2019"
    retrieved: "2026-07-17"
  - id: "sb-eid-regulations-2019"
    title: "Shipping Bill (Electronic Integrated Declaration and Paperless Processing) Regulations, 2019 — Notification No. 33/2019-Customs (N.T.)"
    authority: "cbic"
    url: "https://www.cbic.gov.in/entities/view-notification"
    anchor: "regulation 3 (electronic integrated declaration with supporting documents uploaded on ICEGATE, digitally signed); regulation 5 (order under s. 51 only after completion of assessment and examination)"
    retrieved: "2026-07-17"
reviewer: "Sreenath Govindarajan"

boundary: [cha]

image: "assets/cover.png"
tags: [e-sanchit, irn, icegate, supporting documents, leo]
---

# A Document That Fails Upload Does Not Exist

e-SANCHIT is the single electronic channel through which every supporting document — invoice,
packing list, transport contract, certificate, licence — reaches Indian Customs, and it accepts
only files that meet its published specification. A compliant upload returns an **Image Reference
Number (IRN)**; that IRN, quoted against a document code in the Shipping Bill, is what the
assessing officer actually sees. A non-compliant upload returns no IRN, and a document without an
IRN is invisible to assessment: *for ICES, it was never submitted*.

The failure mode this creates is quiet and mechanical. The goods are ready, the Shipping Bill is
filed, and clearance stalls on an assessment query for a document the exporter believes was sent
— because a PDF exceeded the size ceiling, carried the wrong signature, or was scanned with a
fold across the total line. Under the Shipping Bill (Electronic Integrated Declaration and
Paperless Processing) Regulations, 2019, the Let Export Order issues only **after completion of
assessment and examination** (regulation 5), so every rejected upload sits directly on the
critical path to LEO — and every day of delay is a day of ground rent and schedule risk.

This note sets out the specification as published, the named rejection grounds, and where the
upload sits in the assessment-to-LEO chain. It belongs to the same failure family as the
[ICEGATE Shipping Bill error codes](/publications/icegate-sb-error-codes/): exact machine rules
applied to documents prepared by humans under deadline.

## The Specification, Verbatim and Unforgiving

The ICEGATE e-SANCHIT procedure prescribes the file format precisely: the document must be
rendered into **PDF/A (ISO 19005-2)**, at a resolution of **not less than 200 dpi in black and
white**, at a file size of **not more than 75 KB per A4 page**, within a **maximum file size of
1 MB** — which, as the guide itself computes, allows a supporting document of about **13 pages**.
A longer document is not ground for exemption; it "should be split and uploaded as two or more
documents," each earning its own IRN.

Two properties of this spec catch exporters. First, it is a *rendering* spec, not a content spec
— a perfectly accurate invoice fails on resolution or size alone, and accounting-software PDF
exports that embed colour scans or high-resolution letterheads routinely blow the 75 KB/page
budget. Second, the black-and-white, 200-dpi floor exists for officer legibility: the guide
requires the submitter to acknowledge, by signing, that the document is "legible and authentic."
Compression tricks that shrink the file below 1 MB by degrading legibility replace a size
rejection with a legibility query later — *the slower of the two failures*.

### The Physical-Artefact Rules

The guide names the scanning defects that make a document unacceptable, and they read like a
description of real MSME paperwork: **no stapler marks or punch-hole marks** visible over
content (if unavoidable, they must sit in the margins "at a clear distance away from the
content"); no document placed in the scanner **with a fold**; content **not skewed** in any
direction; **no dark patches** in source or image; letters neither elongated nor compressed.
Each of these is a named ground on which the packet's weakest scan — typically a stamped,
signed, re-scanned copy — fails a check the exporter has usually never read.

## The Signature Gate and the Document Code

An e-SANCHIT upload is validated against identity before content: the PDF must be **digitally
signed using the digital signature certificate registered on ICEGATE**, and the guide's
validation step exists precisely to reject files "not digitally signed by the same user." In
practice the registered signatory is the exporter's ICEGATE account holder or the Customs House
Agent's — and a packet assembled across two offices acquires signatures from the wrong one. The
signature also carries legal weight: signing is the act by which the submitter vouches that the
document is legible and authentic, which is why a defective scan signed and uploaded is not a
technicality but a declaration.

The second selection the submitter makes is the **document code**, drawn from the Single Window
code-map directory, and CBIC Circular 42/2019-Customs made specified uploads mandatory with code
and IRN from 02.12.2019: an invoice is **380000**, an invoice-cum-packing-list **331000**, a bill
of lading **705000**, with distinct codes for master (704000) and house (714000) bills, sea
waybills (710000) and air waybills (740000). A document uploaded under the wrong code is a
document the assessing officer cannot find where the declaration says it should be — the
practical equivalent of a missing document, discovered only as a query.

## Where the Upload Sits in the Path to LEO

CBIC Circular 43/2018-Customs, which extended e-SANCHIT to all ICES locations for exports from
08.11.2018, also fixed the procedural geometry that still governs: during assessment, "ICES
provides for a query to be raised in order to call for additional documents," and the response
route is to **upload the document on e-SANCHIT, obtain the IRN, and link it to the Shipping Bill
by amendment at the Service Centre** — after which the exporter proceeds to goods registration,
document verification and LEO. The circular launched the facility as voluntary with a 15-day
review toward mandatory use; the codified legal basis arrived with the Shipping Bill (Electronic
Integrated Declaration and Paperless Processing) Regulations, 2019, whose regulation 3 requires
the authorised person to "upload the supporting documents on the ICEGATE" with digital
signature, enforced in practice through Circular 42/2019's document-code mandate and
customs-house public notices.

Read as a dependency chain, the geometry is strict: *specification → upload → IRN → declaration
linkage → assessment → LEO*. A break at any link surfaces at the next one, and the earlier the
break, the later it is usually noticed. The costly version is the query raised after goods have
reached the terminal, where the response cycle — re-scan, re-sign, re-upload, amend, re-assess —
runs against accruing ground rent and a closing vessel cutoff; the arithmetic of those stacked
charges is set out in
[What One Documentation Failure Costs](/publications/export-documentation-failure-cost-anatomy/).

## Preventing the Stall: Treat the Packet as a Render Target

The preventive discipline is to treat e-SANCHIT compliance as a property of the document packet,
verified before filing, not a property of the upload attempt. Concretely, every supporting
document headed for the Shipping Bill has four checkable attributes in advance: **format**
(PDF/A, 200 dpi, within the per-page and 1 MB budgets), **physical cleanliness** (no marks over
content, no folds, no skew), **signature identity** (the ICEGATE-registered DSC of the actual
submitter), and **code assignment** (the correct directory code per document type). Each
attribute is binary, and each maps to a named rejection ground in the published guide — which
makes the pre-check mechanical rather than judgmental.

TradeWatch performs this render-and-linkage check as part of its Shipping Bill Readiness Packet:
each supporting document is validated against the e-SANCHIT specification and its declared
document code before the CHA files, with defects flagged against the guide's own rules. Kanan
Labs prepares a readiness packet. It does not file Shipping Bills and holds no customs
credentials — your licensed CHA files.
