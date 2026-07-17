---
title: "What One Documentation Failure Costs: Demurrage, Fees, Blocked Refunds"
slug: "export-documentation-failure-cost-anatomy"
description: "One export document error rarely bills you once: container rent climbs by slab, banks charge USD 100 per discrepant set, and the refund clock stops until fixed."
author: "Sreenath Govindarajan"

type: "concept-piece"
cluster: "igst-customs"
entities: [demurrage, detention, ground-rent, lc-discrepancy-fee, sb005, rule-96, leo, egm, cfs, ucp-600, icegate]

takeaways:
  summary: >-
    A single documentation failure bills an exporter through four independent meters: container
    charges that escalate by slab at the terminal, bank discrepancy fees per presentation, fixed
    rectification fees at customs, and a refund clock that legally stops until the error is
    cured. The instruments are published — the anatomy is simply rarely added up.
  points:
    - "Container time is slab-priced: a published Nhava Sheva CFS tariff steps import ground rent from **₹500/day (days 1–3) through ₹650 and ₹750 to ₹3,000/day (days 91–180)** per 20-foot container, while a carrier's published demurrage/detention tariff climbs to **USD 180/day** for a 40-foot box."
    - "Banks price document errors per event: SBI's published forex schedule charges **USD 100 per discrepant bill** under an import LC and **₹1,500 per shipping bill** per export-bill discrepancy event for non-export-credit customers."
    - "Customs prices the repair: an SB005 invoice-mismatch rectification costs a **₹1,000 TR-Challan per Shipping Bill** under Notification No. 17/2021-Customs (N.T.)."
    - "The refund clock stops in law, not just in practice: under the **proviso to Rule 96(1)(b)**, a mismatched IGST refund application is deemed filed only **when the mismatch is rectified** — unrectified weeks are weeks the claim does not legally exist."

date: "2026-07-17"
reviewed: "2026-07-17"

sources:
  - id: "twt-cfs-tariff-2026"
    title: "Transworld Terminals CFS, Nhava Sheva — Public Tariff (Rev 3, 2026/27)"
    authority: "other"
    url: "https://transworld-terminals.com/images/nhavasheva_tariff.pdf"
    anchor: "storage/ground rent slabs for loaded dry containers per 20' (₹500/day days 1–3; ₹650/day days 4–6; ₹750/day days 7–9; rising by slab to ₹3,000/day days 91–180; 40' at 2x; hazardous/reefer at multipliers); export ground rent by slab"
    retrieved: "2026-07-17"
  - id: "volta-dnd-tariff-nhava-sheva"
    title: "Volta Container Line — Demurrage & Detention Tariff, Nhava Sheva (effective 01.07.2023)"
    authority: "other"
    url: "https://voltacontainerline.com/wp-content/uploads/2023/07/Volta-Demurrage-Detention-tariffs-India-Nhava-Sheva.pdf"
    anchor: "import demurrage slabs: general 20' USD 40/60/90 per day after 7 free days; 40' USD 75/110/180 per day"
    retrieved: "2026-07-17"
  - id: "sbi-forex-service-charges"
    title: "State Bank of India — Schedule of Forex Transactions Related Service Charges (w.e.f. 01.04.2022)"
    authority: "other"
    url: "https://sbi.bank.in/documents/16012/12924450/210222-Forex+Transactions+Related+Service+Charges+w.e.f.+01.04.2022+-+Notice+for+Customers.pdf/bb330c64-337a-b951-6ce4-bfd3b1d3bd6d?t=1645435603197"
    anchor: "Import LC item (b): charges for discrepant documents — USD 100 per bill; Export item Sr. 6: export bill discrepancy/crystallisation/returned-unpaid events — ₹1,500 per shipping bill per event (non-export-credit customers)"
    retrieved: "2026-07-17"
  - id: "cbic-notification-17-2021-nt"
    title: "Notification No. 17/2021-Customs (N.T.) — Levy of Fees (Customs Documents) Amendment Regulations, 2021"
    authority: "cbic"
    url: "https://www.cbic.gov.in/htdocs-cbec/customs/cs-act/notifications/notfns-2021/cs-nt2021/csnt17-2021.pdf"
    anchor: "regulation 3, Table, serial (x): handling of mismatch between Shipping Bill and GST returns — ₹1,000"
    retrieved: "2026-07-17"
  - id: "cgst-rule-96"
    title: "Rule 96, CGST Rules, 2017 — Refund of integrated tax paid on goods exported out of India"
    authority: "cbic"
    url: "https://taxinformation.cbic.gov.in/content/html/tax_repository/gst/rules/cgst_rules/active/chapter10/rule96_v1.00.html"
    anchor: "proviso to sub-rule (1)(b): on mismatch, the refund application is deemed filed on the date the mismatch is rectified"
    retrieved: "2026-07-17"
  - id: "ucp-600-introduction"
    title: "ICC Uniform Customs and Practice for Documentary Credits, Publication No. 600 (2007) — Introduction"
    authority: "icc"
    url: "https://cpeapp.icai.org/downloadBGM/65c1c211b0373.pdf"
    anchor: "Introduction: global surveys at the start of the UCP revision indicated approximately 70% of documents presented under letters of credit were rejected on first presentation; discrepancy fees highlighted the issue"
    retrieved: "2026-07-17"
reviewer: "Sreenath Govindarajan"

boundary: [cha]

image: "assets/cover.png"
tags: [demurrage, detention, discrepancy fees, cost of errors, export documentation]
---

# Four Meters, One Error

A documentation failure on an export shipment is never billed once. The same defective invoice
number, missing certificate or mismatched weight starts **four independent meters**: the
terminal's, which charges the container by the day on an escalating slab; the bank's, which
charges the document set by the event; customs', which prices the administrative repair; and the
refund clock's, which under GST law stops counting until the error is cured. Each meter is
published — a tariff card, a fee schedule, a gazetted regulation, a rule proviso. What is rarely
done is reading them together, as the composite price of one mistake.

Reading them together changes how the mistake is classified. Priced separately, each charge is a
nuisance line item absorbed into "logistics costs." Priced as an anatomy, a routine error on a
routine shipment is a four-figure-to-six-figure event whose components compound with time — which
is the honest financial argument for pre-shipment validation, and the reason the checks
catalogued across this library (the [error-code matrix](/publications/icegate-sb-error-codes/),
the [pre-LEO reconciliation](/publications/pre-leo-document-reconciliation/)) are economic
instruments, not clerical hygiene.

## Meter One: The Container, by the Day, by the Slab

Container charges are the fastest-compounding meter because they are time-priced and
slab-escalated, and a documentation hold burns exactly the commodity they price — days. The
published tariffs make the arithmetic concrete. A Nhava Sheva CFS tariff card (Transworld
Terminals, Rev 3, 2026/27) prices loaded-container ground rent per 20-foot box from **₹500 per
day in days 1–3**, stepping to **₹650 (days 4–6)** and **₹750 (days 7–9)**, and escalating by
slab to **₹3,000 per day for boxes dwelling 91–180 days** — with 40-foot boxes at roughly twice,
and hazardous or reefer boxes at further multiples of, those rates. On the carrier side, a published Nhava Sheva demurrage-and-detention tariff (Volta
Container Line) runs a general-purpose 40-foot container from **USD 75 per day** in the first
chargeable slab to **USD 180 per day** in the third, after seven free days.

Two structural features make this meter worse than it looks. The charges **stack** — line
demurrage or detention and CFS ground rent are separate invoices for the same idle box — and
they **escalate precisely when things are already going wrong**, because the slab design prices
week three higher than week one. A five-day documentation hold on one hazardous 40-foot export
box is therefore not a rounding error; it is several hundred dollars of carrier charges plus
several thousand rupees of yard rent, per box, invoiced regardless of how the underlying
paperwork dispute resolves.

## Meter Two: The Bank, by the Event

Banks price documentation failure per presentation event, and the prices are published in fee
schedules most exporters have never opened. State Bank of India's forex service-charge schedule
prices "discrepant documents" under an import letter of credit at **USD 100 per bill** — charged
to the party whose documents failed — and, on the export side, prices each "export bill
discrepancy / crystallisation / returned unpaid" event at **₹1,500 per shipping bill** for
non-export-credit customers. Foreign banks in the chain charge their own discrepancy fees on
top, deducted from proceeds before the exporter sees them.

The volume behind the per-event price is the striking part. The ICC's own introduction to UCP
600 records that, when the revision began, global surveys indicated **approximately 70% of
documents presented under letters of credit were rejected on first presentation** — a failure
rate that turned discrepancy fees into a standing revenue line. Why presentations fail, and the
examination rules they fail against, is the subject of the companion note on
[LC first presentations](/publications/lc-first-presentation-discrepancies/); the point here is
narrower: *the bank meter runs per attempt, so every failed cycle re-bills*.

## Meter Three: Customs, by the Repair

The customs meter is the most modest and the most instructive, because it is a gazetted price
for undoing one specific documentation error. Since Notification No. 17/2021-Customs (N.T.)
amended the Levy of Fees (Customs Documents) Regulations, 1970, the "handling of mismatch
between Shipping Bill and GST returns in Customs Automated System" costs a **₹1,000 TR-Challan
per Shipping Bill** — the fee for the officer-interface concordance procedure that clears an
[SB005 invoice mismatch](/publications/sb005-igst-refund-blocked/). The fee is small; its
meaning is not. The state has standardised the repair of this error at scale, which is as clear
a statement as a regulator makes that the error is endemic — and every ₹1,000 challan sits on
top of the documentation effort, the professional time, and the meter that matters most.

## Meter Four: The Clock That Stops in Law

The largest cost is usually not a fee but a suspension. Under the proviso to Rule 96(1)(b) of
the CGST Rules, where Shipping Bill data and GSTR-1 data mismatch, the IGST refund application
"shall be deemed to have been filed on such date when such mismatch … is rectified by the
exporter." The working capital consequence is categorical: an unrectified mismatch is not a
delayed refund but a refund whose claim **does not yet legally exist** — for however many weeks
or months nobody notices the response code. On a shipment carrying lakhs of rupees of IGST, the
financing cost of that suspension dwarfs every fee above it; multiplied across a year of
shipments for a mid-tier exporter, it is the difference between refunds as working capital and
refunds as a write-off aging in a ledger.

### What the Anatomy Argues

Summed, the four meters convert "a typo" into a priced event: slab-escalating container rent in
two currencies, per-event bank fees on a ~70% base rate of first-presentation failure, a
gazetted repair fee, and a legally stopped refund clock. Every meter shares one property — **none
of them runs if the documents agree before filing**. That is the economic case for pre-shipment
reconciliation stated in the vendors' and regulators' own published prices, and it is the check
TradeWatch performs as a readiness packet before the CHA files. Kanan Labs prepares a readiness
packet; it does not file Shipping Bills and holds no customs credentials — your licensed CHA
files.
