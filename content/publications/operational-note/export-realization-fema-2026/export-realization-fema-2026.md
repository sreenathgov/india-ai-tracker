---
title: "Export Realization in 2026: EDPMS, e-BRC and a Clock That Moved Twice"
slug: "export-realization-fema-2026"
description: "India's export-realization period moved twice in seven months — 9 to 15 and back to 9 — and new FEMA regulations take force 1 October 2026. The date decides."
author: "Sreenath Govindarajan"

type: "operational-note"
cluster: "export-realization"
entities: [fema, edpms, e-brc, rbi, realization-period, fema-23r-2026, ad-bank, shipping-bill, irm, edf]

takeaways:
  summary: >-
    An Indian exporter's realization deadline now depends on the shipment date: nine months for
    exports before 14 November 2025, fifteen months for shipments up to 4 June 2026, nine
    months again since, and fifteen or eighteen months once the 2026 FEMA export regulations
    take force on 1 October 2026. EDPMS tracks every bill against that clock.
  points:
    - "**05.06.2026** — Notification FEMA 23(R)/(8)/2026-RB substituted 'nine months' back for 'fifteen months' in Regulation 9, reversing the 13.11.2025 extension: the clock is **9 months today**."
    - "**01.10.2026** — the FEM (Export and Import of Goods and Services) Regulations, 2026 (FEMA 23(R)/2026-RB, 13.01.2026) take force: **15 months** (18 for INR-settled trade), extension powers with the AD bank."
    - "**EDPMS entries up to ₹10 lakh** close on the exporter's self-declaration — quarterly, in bulk — per RBI A.P. (DIR Series) Circular 12 of 01.10.2025, which also bars penal charges for delay."
    - "The 2026 Regulations replace caution-listing's edge with a bright line: proceeds unrealised **beyond one year past the due date** put the exporter on advance-payment-or-LC terms for further exports (Reg. 13)."

date: "2026-07-22"
reviewed: "2026-07-22"

sources:
  - id: "fema-23r-2026"
    title: "Foreign Exchange Management (Export and Import of Goods and Services) Regulations, 2026 — Notification No. FEMA 23(R)/2026-RB, 13.01.2026 (in force 01.10.2026)"
    authority: "rbi"
    url: "https://www.rbi.org.in/Scripts/NotificationUser.aspx?Id=13277&Mode=0"
    anchor: "Reg. 3(1) (EDF deemed part of the EDI shipping bill); Reg. 4(2) (AD closes/updates EDPMS entries; ₹10-lakh declaration proviso); Reg. 5(1) (realization within fifteen months; eighteen for INR-invoiced/settled trade; AD may extend); Reg. 13 (advance or irrevocable LC where proceeds unrealised beyond one year past due); Reg. 18(1)(g) (AD marks off EDPMS on realization)"
    retrieved: "2026-07-22"
  - id: "fema-23r-first-amendment-2026"
    title: "FEM (Export of Goods and Services) (First Amendment) Regulations, 2026 — Notification No. FEMA 23(R)/(8)/2026-RB, 05.06.2026"
    authority: "rbi"
    url: "https://www.rbi.org.in/Scripts/NotificationUser.aspx?Id=13467&Mode=0"
    anchor: "regulation 2 (in Regulation 9 of the 2015 Regulations, 'fifteen months' substituted by 'nine months' in sub-regulations (1) and (2)(a)), reversing FEMA 23(R)/(7)/2025-RB of 13.11.2025"
    retrieved: "2026-07-22"
  - id: "rbi-apdir-12-2025-26"
    title: "RBI A.P. (DIR Series) Circular No. 12 (RBI/2025-26/89) — closure of small-value EDPMS/IDPMS entries, 01.10.2025"
    authority: "rbi"
    url: "https://www.rbi.org.in/Scripts/NotificationUser.aspx?Id=12908&Mode=0"
    anchor: "para 3 (entries of ₹10 lakh or less per bill closed on exporter's declaration of realization, including value reductions; quarterly consolidated declarations for bulk closure); para 4 (no penal charges for delays); para 5 (immediate effect)"
    retrieved: "2026-07-22"
  - id: "rbi-md-16-export"
    title: "RBI Master Direction No. 16/2015-16 — Export of Goods and Services (updated; operative until superseded)"
    authority: "rbi"
    url: "https://www.rbi.org.in/Scripts/BS_ViewMasDirections.aspx?id=10395"
    anchor: "EDPMS operational provisions: shipping-bill data flow, AD matching of inward remittances, extension of time and write-off limits (self-write-off 5%; status holder 10%; AD write-off 10% of preceding calendar year's realized proceeds)"
    retrieved: "2026-07-22"
reviewer: "Sreenath Govindarajan"

boundary: [cha]

image: "assets/cover.png"
tags: [export realization, edpms, fema, e-brc, rbi]
---

# One Shipment, One Clock — But Which Clock

Every Indian export shipment starts a statutory countdown: the full export value must be realized
and repatriated within a prescribed period, and the Export Data Processing and Monitoring System
(EDPMS) holds the shipping bill open until an Authorised Dealer bank matches the money against it.
What changed in 2025-26 is the countdown itself. The period was **nine months** for years; RBI
extended it to **fifteen months** by amendment on 13 November 2025; and on **5 June 2026**,
Notification FEMA 23(R)/(8)/2026-RB substituted nine months back. On **1 October 2026**, the new
Foreign Exchange Management (Export and Import of Goods and Services) Regulations, 2026 take
force and set the period at **fifteen months — eighteen where the trade is invoiced or settled in
rupees**.

The operational consequence is that "when is this bill overdue?" is now a function of the
shipment date, across four buckets: exports before 14.11.2025 (nine months), 14.11.2025 to
04.06.2026 (fifteen), 05.06.2026 to 30.09.2026 (nine), and from 01.10.2026 (fifteen/eighteen).
A receivables ledger that applies one uniform tenor to all open bills is mis-ageing some of them
in *both* directions — flagging compliant bills as overdue and missing genuinely overdue ones.
This page is the hub for the realization cluster; the enforcement edge lives in
[EDPMS Open Entries and Caution-Listing](/publications/edpms-open-entries-caution-list/), and
the paper trail's endpoint in [e-BRC Self-Certification](/publications/e-brc-self-certification/).

## The Clock, Precisely: Four Buckets and Two Instruments

The realization period is set by Regulation 9 of the 2015 export regulations until 30 September
2026, and by Regulation 5(1) of the 2026 Regulations after. The amendment of 5 June 2026 is one
sentence with a ledger-wide effect: in Regulation 9, "for the words 'fifteen months', the words
'nine months' shall be substituted" — reversing the extension made on 13 November 2025. The 2026
Regulations then re-lengthen it: realization "within … **fifteen months** from the date of
shipment in case of goods," with a proviso that INR-invoiced-or-settled exports get **eighteen
months**, and a further proviso that the AD bank "may, on request by an exporter citing reasons
for the delay, allow extension of time."

Two details in the 2026 text deserve a finance team's attention now, before commencement. First,
the **Export Declaration Form is absorbed into the filing**: for EDI ports, "the EDF will be
deemed to be submitted as part of shipping bill" (Reg. 3(1)) — the declaration that opens the
EDPMS entry is the Shipping Bill itself, which ties realization compliance directly to the
accuracy of the customs filing. Second, the regulations are explicit that the AD bank credits an
exporter's account "only after having satisfied itself of the genuineness of the transaction,
and shall, **simultaneously** close or update the respective entry" in EDPMS (Reg. 4(2)) —
matching is not a back-office courtesy; it is the bank's condition for handling the money.

## What EDPMS Actually Tracks, and How Entries Close

EDPMS is a reconciliation ledger, not a report: customs transmits every EDI shipping bill into
it, AD banks report inward remittances against it, and an entry closes only when the bank marks
the export value realized (Reg. 18(1)(g)). Three closure routes exist. The ordinary route is
**matching** — the bank pairs inward remittance messages against the shipping bill and marks
off. The small-value route is **declaration**: since RBI's A.P. (DIR Series) Circular 12 of
1 October 2025, entries of **₹10 lakh or less per bill** are "reconciled and closed based on a
declaration provided by the concerned exporter that the amount has been realised," value
reductions included, and the declarations "may also be received on a quarterly basis … in a
consolidated manner" — bulk closure, formalised. The residual route is **write-off** under the
Master Direction's limits: self-write-off of 5% (10% for Status Holders) and AD-bank write-off
of 10%, each computed on the preceding calendar year's realized proceeds.

The same October 2025 circular removed a chronic irritant with one line: "AD banks shall not
levy any penal charges (penalty) for delays in adherence to any regulatory guidelines." The
compliance cost of an open entry is therefore no longer a bank fee — it is the consequence
chain: an ageing entry, an extension request, and eventually the enforcement posture described
in [the caution-list companion note](/publications/edpms-open-entries-caution-list/), which the
2026 Regulations sharpen into Regulation 13's bright line — proceeds unrealised **beyond one
year past the due date** and further exports move to full advance or irrevocable LC terms.

### Why the Whipsaw Happened Matters Less Than Its Record

The clock's two moves in seven months are unexplained in the instruments themselves — the
notifications substitute words, not reasons. What the sequence establishes operationally is the
same lesson RoDTEP's 2026 cut-and-restore taught on the incentive side: *realization policy is
an administrative variable, revisable mid-year, and the instrument in force on the shipment
date — not the policy assumed at contract — governs the obligation.* A shipment file that
records its own realization due date at creation, from the regulation then in force, is immune
to the whipsaw; a ledger that recomputes from "the current rule" is wrong for three of the four
buckets.

## Running the Ledger Against the Right Clock

The discipline that follows is mechanical. Each open shipping bill carries: its shipment date;
its bucket and computed due date; its EDPMS status (open, matched-partial, closed); its route to
closure (matching expected, ₹10-lakh declaration eligible, extension applied, write-off
candidate); and — once closed — its [e-BRC](/publications/e-brc-self-certification/), which is
what converts the realization into a document that GST refunds and incentive returns can
consume. The quarterly declaration window makes small-bill hygiene a calendar event; the
extension proviso makes early AD-bank engagement, with reasons, the difference between a
managed delay and an ageing statistic.

TradeWatch tracks this as part of its readiness intelligence: per-shipment realization due
dates computed from the instrument in force on the shipment date, EDPMS-status watch, and the
closure-route determination, each cited to the regulation it derives from. Kanan Labs prepares
evidence and readiness; realization, extension requests and write-offs are transacted by the
exporter with its AD bank, whose regulatory decisions remain its own. It does not file Shipping
Bills and holds no customs credentials — your licensed CHA files.
