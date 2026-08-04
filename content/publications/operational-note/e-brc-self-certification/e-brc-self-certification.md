---
title: "e-BRC Self-Certification: From Bank Realization to Refund Document"
slug: "e-brc-self-certification"
description: "Since 15 November 2023, exporters self-generate e-BRCs on the DGFT portal from bank-uploaded IRMs. Purpose codes gate what qualifies; matching keys decide it."
author: "Sreenath Govindarajan"

type: "operational-note"
cluster: "export-realization"
entities: [e-brc, dgft, irm, purpose-codes, edpms, shipping-bill, gstin, rodtep, ad-bank]

takeaways:
  summary: >-
    The electronic Bank Realization Certificate moved to self-certification on 15 November 2023:
    banks upload inward remittance messages to the DGFT portal, and the exporter generates e-BRCs
    by mapping IRMs to shipping bills. Purpose codes gate eligibility, four matching keys decide
    the linkage, and the resulting certificate feeds GST refunds and incentive returns.
  points:
    - "**DGFT Trade Notice 33/2023-24 (10.11.2023)** made e-BRC self-certified from **15.11.2023** — the exporter, not the bank, generates the certificate from bank-uploaded **IRMs**."
    - "Purpose codes gate the gate: for goods, only **P0102, P0103, P0104 and P0109** qualify; **P0101 and P0108 cannot generate an e-BRC** at all, per the DGFT exporter manual (v1.2)."
    - "Goods e-BRCs match on four keys — **shipping bill number, invoice number, shipping bill date, port code** — the same identity fields whose drift triggers SB005-class failures upstream."
    - "The e-BRC is built for reuse: DGFT envisions digital exchange with **RBI, CBDT, GSTN, STPI and SEZs**, and the goods flow captures **GSTIN, GST invoice number and date** when the exporter claims GST benefit."

date: "2026-07-22"
reviewed: "2026-07-22"

sources:
  - id: "dgft-ebrc-manual"
    title: "DGFT — Self-certification of e-BRC on DGFT e-platform: Exporter Manual (v1.2)"
    authority: "dgft"
    url: "https://content.dgft.gov.in/Website/Exporter_manual_e-BR_%20v1.1.pdf"
    anchor: "Introduction (self-certification initiative; envisioned digital exchange with RBI, CBDT, GSTN, STPI, SEZs); purpose-code rules (no e-BRC for P0101/P0108; goods limited to P0102/P0103/P0104/P0109; P0103 clubbing; services-IT codes P0802/P0803/P0807; P1505 deemed exports); goods matching keys (SB number, invoice number, SB date, port code); GSTIN/GST-invoice capture where GST benefit is claimed; Section 9 (RMS 'Under Review' flagging)"
    retrieved: "2026-07-22"
  - id: "dgft-trade-notice-33-2023"
    title: "DGFT Trade Notice No. 33/2023-24 — Electronic Bank Realisation Certificate (eBRC) based on self-certification, 10.11.2023"
    authority: "dgft"
    url: "https://www.dgft.gov.in/CP/?opt=eBRC"
    anchor: "operative paragraphs launching the revamped self-certification eBRC with effect from 15.11.2023"
    retrieved: "2026-07-22"
  - id: "fema-23r-2026"
    title: "Foreign Exchange Management (Export and Import of Goods and Services) Regulations, 2026 — FEMA 23(R)/2026-RB, 13.01.2026"
    authority: "rbi"
    url: "https://www.rbi.org.in/Scripts/NotificationUser.aspx?Id=13277&Mode=0"
    anchor: "Reg. 4(2) and Reg. 18(1)(g) (AD bank satisfaction and simultaneous EDPMS closure/mark-off on realization — the upstream event the e-BRC documents)"
    retrieved: "2026-07-22"
reviewer: "Sreenath Govindarajan"

boundary: [cha]

image: "assets/cover.png"
tags: [e-brc, dgft, purpose codes, irm, export realization]
---

# The Certificate Moved to Your Side of the Counter

The Bank Realization Certificate — the document that proves an export was actually paid for —
changed hands in November 2023. Under DGFT Trade Notice 33/2023-24, effective **15 November
2023**, banks no longer issue BRCs; they upload **Inward Remittance Messages (IRMs)** to the
DGFT platform, and the **exporter self-generates the e-BRC** by mapping those IRMs to shipping
bills. The move ended a chronic bottleneck — chasing bank branches for certificates — and
replaced it with a different discipline: the certificate is now only as good as the exporter's
own mapping, made under self-certification, with the platform's risk system watching.

Why the document matters is unchanged and understated. The e-BRC is the connective tissue
between realization and every downstream benefit: it evidences payment for GST refund purposes,
feeds incentive-scheme returns including RoDTEP's annual reporting, and closes the loop that
[EDPMS opened at shipment](/publications/export-realization-fema-2026/). DGFT's own manual
states the design intent: "digital exchange of e-BRC generated with other regulatory agencies
such as **RBI, CBDT, GSTN, STPI, SEZs** etc. for utilisation and post issue
verification/audit." A mis-mapped e-BRC is therefore not a filing typo; it is a
self-certified statement propagating into multiple regulators' records.

## Purpose Codes: The Gate Before the Mapping

Not every inward remittance can become an e-BRC, and the gate is the RBI **purpose code** the
bank attached to the IRM. The DGFT exporter manual is specific: an e-BRC "cannot" be generated
for **P0101 and P0108**; for **goods**, only **P0102, P0103, P0104 and P0109** are allowed;
**P0103** (advance receipt against exports) "can be used standalone" and "can be clubbed with
any other purpose codes for inward remittance"; services-IT e-BRCs run on **P0802, P0803,
P0807** (plus P0103); and **P1505** is reserved for deemed exports.

The operational meaning sits at the bank counter, months before anyone thinks about
certificates: the purpose code is declared **when the remittance is received**, usually by
whoever answers the bank's disposal query. A receipt coded outside the permitted set leaves the
exporter with realized money that the platform will not certify against a shipping bill — a
defect discoverable only at e-BRC time and correctable only through the bank's re-coding
process. The prevention is a standing instruction: every export receipt's purpose code is
checked against the permitted set on the credit advice, the day it lands.

## The Mapping: Four Keys and a Familiar Failure Mode

A goods e-BRC is a linkage record, and the manual names its matching keys: **shipping bill
number, invoice number, shipping bill date, and port code**. Anyone who has read this library's
customs cluster will recognise the list — these are the same identity fields whose exact-string
mismatches produce the [SB001/SB005 refund blocks](/publications/icegate-sb-error-codes/) on
the IGST side. The realization pipeline re-runs the identity test: an invoice number that
diverged between the accounting system and the Shipping Bill at filing time resurfaces here as
an IRM that will not sit cleanly against its bill.

Three mapping situations cover most real cases. **One IRM, one bill** is trivial. **One IRM,
many bills** (a consolidated buyer payment) is split across bills, with the exporter certifying
the allocation. **Advance receipts** ride P0103 and are clubbed with the final-payment codes
when the shipment follows. In each case the platform's Risk Management System can flag the
generated e-BRC "**Under Review**" (manual, Section 9) — self-certification is post-audited,
not unexamined, and the GSTIN fields the goods flow captures ("GSTIN of Branch, GST Invoice No.
and GST Invoice Date" become mandatory when GST benefit is claimed) are exactly the fields a
cross-regulator verification would test.

### What the e-BRC Is Not

Two boundary clarifications save real confusion. The e-BRC does not itself close the EDPMS
entry — closure is the **AD bank's act** under the regulations (satisfaction as to genuineness,
simultaneous mark-off), and the e-BRC is the exporter-side certificate built on the same
realization event. And the e-BRC does not cure a realization that never happened: a value
shortfall against the bill is handled through the reduction/write-off machinery on
[the hub page](/publications/export-realization-fema-2026/), not by certifying creatively. The
self-certification declaration is the exporter's own signature on a record five agencies may
read.

## Running e-BRC as a Monthly Discipline

The workable cadence is monthly, in three passes: reconcile new IRMs against open shipping
bills (flagging purpose-code defects for bank correction while they are fresh); generate e-BRCs
for cleanly matched pairs, with the GST fields completed wherever refund linkage is claimed;
and review anything the RMS has flagged, with the underlying bank advice and invoice at hand.
Exporters who batch this annually — typically when an incentive return forces it — inherit a
year of coding defects and drifted identifiers at the worst possible time.

TradeWatch carries the e-BRC layer inside its readiness intelligence: purpose-code checks on
receipt, IRM-to-bill matching proposals keyed on the same four identity fields it reconciles
pre-shipment, and RMS-flag tracking, each anchored to the DGFT manual's rules. Kanan Labs
prepares evidence and readiness; the self-certification itself is the exporter's declaration,
and the underlying realization records remain the AD bank's. It does not file Shipping Bills
and holds no customs credentials — your licensed CHA files.
