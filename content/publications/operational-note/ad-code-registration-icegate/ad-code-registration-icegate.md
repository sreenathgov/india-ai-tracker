---
title: "AD Code Registration on ICEGATE: The Gate Before the Scroll"
slug: "ad-code-registration-icegate"
description: "AD Code registration went port-agnostic in June 2022, but bank accounts still register per port for refunds — and PFMS validates before any money moves."
author: "Sreenath Govindarajan"

type: "operational-note"
cluster: "igst-customs"
entities: [ad-code, icegate, pfms, iec, edpms, shipping-bill, cbic-instruction-25-2023, dg-systems-advisory-10-2022, cha]

takeaways:
  summary: >-
    The Authorised Dealer Code links every Shipping Bill to the exporter's bank, and its
    registration mechanics changed materially: since June 2022, an AD Code registered at one port
    applies at all customs locations, while bank-account registration for refunds remains
    per-port. CBIC standardised the paperwork to two documents in 2023 — and PFMS validates the
    account before any disbursal.
  points:
    - "**DG Systems Advisory 10/2022 (14.06.2022)** made AD Code registration **port-agnostic** — registered once, 'automatically applicable at all customs locations' (recited in CBIC Instruction 25/2023-Customs)."
    - "**Bank-account registration stays per-port**: the ICEGATE option registers the refund/drawback account 'for every port where exporter intends to transact' — the asymmetry exporters routinely miss."
    - "**Instruction 25/2023-Customs (28.07.2023)** standardised the file to two documents — the bank's authorisation letter (name, address, IEC, PAN, account, AD/IFSC) and a **cancelled cheque or endorsed statement** — with same-day processing for applications before 2 PM."
    - "The money gate is explicit: **'the bank account for IFSC is validated by PFMS before the disbursal of an amount'** — an invalidated account holds IGST, drawback and RoDTEP scrolls even when every code validates."

date: "2026-07-22"
reviewed: "2026-07-22"

sources:
  - id: "cbic-instruction-25-2023"
    title: "CBIC Instruction No. 25/2023-Customs — Standardisation of AD Code and bank account registration (F. No. 450/145/2023-CUS-IV), 28.07.2023"
    authority: "cbic"
    url: "https://chennaicustoms.gov.in/wp-content/uploads/2024/12/cs-ins-25-2023-1.pdf"
    anchor: "para 1 (recital of Circular 32/2020-Customs online registration and DG Systems Advisory 10/2022 making one-port AD registration applicable at all locations; per-port bank-account registration for IGST refund/drawback); para 2 (PFMS validates the account before disbursal); para 3 (two-document standard: bank authorisation letter with IEC/PAN/account/AD-IFSC particulars, plus cancelled cheque or bank-endorsed statement); para 4 (same-day disposal for applications before 2 PM)"
    retrieved: "2026-07-22"
  - id: "cbic-circular-32-2020"
    title: "CBIC Circular No. 32/2020-Customs — Turant Customs: online registration of AD Code and bank accounts on ICEGATE, 06.07.2020"
    authority: "cbic"
    url: "https://www.cbic.gov.in/entities/view-circular-instruction"
    anchor: "paras establishing online AD Code and bank-account registration through ICEGATE in place of physical submission at each customs station"
    retrieved: "2026-07-22"
  - id: "icegate-bank-account-advisory"
    title: "ICEGATE — Advisory: Export Promotion Bank Account Management (AD Code and account registration module)"
    authority: "icegate"
    url: "https://www.icegate.gov.in/guidelines/ad-code-bank-account-registration-advisory"
    anchor: "module scope (IEC holders register/modify bank accounts for AD Code and incentive registration); PFMS-invalidated accounts surfaced via the IEC-wise PFMS Invalidated Accounts report"
    retrieved: "2026-07-22"
  - id: "cbic-circular-24-2025"
    title: "CBIC Circular No. 24/2025-Customs — Auto-approval of incentive bank account and IFSC registration requests across customs locations (07.10.2025)"
    authority: "cbic"
    url: "https://info.eepcindia.org/files/1759902487.pdf"
    anchor: "operative paragraphs (ICEGATE auto-approves a bank-account/IFSC registration request at a port where the same combination was previously approved at another location, removing manual port-officer intervention)"
    retrieved: "2026-07-23"
  - id: "dgos-igst-refund-guide"
    title: "Directorate General of Systems, CBIC — Guide on IGST Refunds in ICES"
    authority: "cbic"
    url: "https://jawaharcustoms.gov.in/pdf/GST_REFUND.pdf"
    anchor: "para 6 and Annexure A (temporary-scroll '#' tag for PFMS-unvalidated accounts; TBE error codes and exporter-side rectification)"
    retrieved: "2026-07-22"
reviewer: "Sreenath Govindarajan"

boundary: [cha]

image: "assets/cover.png"
tags: [ad code, icegate, pfms, bank account registration, refunds]
---

# The Oldest Prerequisite in the Pipeline

Before a Shipping Bill can carry a refund, an incentive claim or even the exporter's identity
convincingly, customs needs to know which bank stands behind the exporter — and that linkage is
the **Authorised Dealer (AD) Code**, a code identifying the exporter's AD bank branch,
registered against the IEC on ICEGATE. It is the least glamorous item in the export stack and
one of the most consequential: an unregistered or mis-registered AD Code surfaces as a filing
that will not proceed, and an unvalidated bank account surfaces later and worse — as **scrolls
that generate but money that never lands**.

The mechanics changed substantially between 2020 and 2023, and much circulating guidance
describes the old world. Physical registration at each customs house gave way to online
registration through ICEGATE (Circular 32/2020-Customs, the Turant Customs reform); the
port-by-port AD Code ritual ended in June 2022; and the paperwork was standardised nationally
in July 2023 after CBIC found customs houses demanding wildly divergent document sets. What
remains — deliberately — is a two-layer structure that this note untangles: the **AD Code**
registers once; the **bank account** registers per purpose and per port.

## Once for the Code, Per-Port for the Account

The asymmetry is the single fact to internalise. Since **DG Systems Advisory 10/2022 dated
14.06.2022**, as CBIC Instruction 25/2023 records, "AD code registered at one port [is]
automatically applicable at all customs locations" — the code that took a fresh application at
every new port now propagates from the first registration. But the same instruction continues:
"with respect to **bank account registration** for IGST refund/Drawback purpose, option is
available in ICEGATE portal for applying registration of bank account **for every port where
exporter intends to transact**."

The practical trap follows directly. An exporter opening a new lane through a new port checks
ICEGATE, sees the AD Code already recognised, files, and clears — and then waits for a refund
that cannot disburse, because the *account* was never registered for that port's scrolls. The
friction has since been reduced but not removed: under **CBIC Circular 24/2025-Customs
(07.10.2025)**, ICEGATE **auto-approves** a bank-account/IFSC registration request at a new
port where the same combination was already approved elsewhere — the request must still be
made, but no officer touches it. The onboarding checklist for any new customs location is
therefore one line long and specific: **submit the refund-account registration for that
port**, even though the AD Code needs nothing.

## The Standardised File: Two Documents, Same-Day Disposal

Instruction 25/2023-Customs ended the document-list lottery. The complete application is: **(a)
the bank's authorisation letter** on its letterhead, carrying the exporter's name and address,
IEC, PAN, bank account number, and the bank's AD Code and IFSC; and **(b) a cancelled cheque**
— or, where cheque-books are not issued, the latest bank statement endorsed by the bank.
Nothing else is prescribed; GST certificates, rent agreements and the rest of the folklore
demanded by individual counters are outside the standard. The instruction also sets the tempo:
applications made **before 2 PM are dealt with the same day**, later ones by 2 PM the next
working day.

For the CHA-exporter relationship this is a small constitution: it defines exactly what the
exporter owes the process and when the process owes an answer. A registration pending beyond
the instruction's timeline, or a demand outside its two-document standard, is now a deviation
from a written national norm — worth flagging as such, politely, with the instruction number.

### PFMS: The Validation That Outranks Every Code

The sentence in Instruction 25/2023 that explains most "refund approved but not received" cases
is nine words long: "the bank account for IFSC is **validated by PFMS** before the disbursal of
an amount." The Public Financial Management System independently verifies the registered
account — name match, account status, IFSC — and its verdict gates every disbursal: IGST
scrolls, drawback, RoDTEP. The DG Systems refund guide shows the operational signature: bills
whose accounts fail validation ride the temporary scroll carrying a **"#" tag** and drop from
the final scroll, with the failure reasons (the TBE error series — invalid account, closed
account, IFSC mismatch, name variance) surfaced in the **IEC-wise PFMS Invalidated Accounts
report**. This is the terminal gate of the refund pipeline mapped in
[the error-code reference](/publications/icegate-sb-error-codes/): a shipment can clear SB000
on every invoice and still pay nothing into a PFMS-invalid account.

The failure is silent in the usual way — no notice arrives; the report must be pulled — and
the fixes are mundane: resubmit correct account or IFSC particulars, or register a live account
in place of one closed during a banking reorganisation. Bank mergers are the classic mass
casualty here: IFSC codes retired in a merger invalidate registrations wholesale, and the
exporters who notice are the ones reconciling scroll-to-credit monthly.

## The Checklist That Keeps the Gate Open

Steady-state hygiene is four checks, quarterly: the AD Code registration matches the bank
branch actually handling the export account (the [EDPMS and realization machinery
](/publications/export-realization-fema-2026/) runs through the same AD relationship); the
refund account is registered **at every port in use**, verified against the ICEGATE account
management module; the PFMS Invalidated Accounts report is empty for the IEC; and any banking
change — branch shift, merger, account migration — triggers re-registration *before* the next
filing, not after the first missing scroll.

TradeWatch runs these as standing readiness checks: port-wise account-registration coverage,
PFMS validation status, and change-event triggers, each anchored to Instruction 25/2023 and the
ICEGATE advisory. Kanan Labs prepares a readiness packet. It does not file Shipping Bills,
holds no customs credentials, and does not operate the exporter's ICEGATE account — your
licensed CHA files, and registrations are made by the exporter or its authorised agent.
