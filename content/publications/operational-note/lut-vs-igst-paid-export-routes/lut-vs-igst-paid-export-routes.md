---
title: "LUT or IGST-Paid: Two Export Routes, Two Failure Chains"
slug: "lut-vs-igst-paid-export-routes"
description: "GST exports run two routes: IGST-paid refunds move through ICEGATE's SB codes; LUT refunds through RFD-01 and deficiency memos. Rule 96B polices both."
author: "Sreenath Govindarajan"

type: "operational-note"
cluster: "igst-customs"
entities: [lut, rule-96, rule-89, rule-96a, rule-96b, rfd-01, rfd-11, gstr-3b, icegate, deficiency-memo, cha]

takeaways:
  summary: >-
    Every GST export runs two routes. The IGST-paid route treats the Shipping Bill as the
    refund application and fails through ICEGATE's SB-series codes; the LUT route refunds
    unutilised input tax credit through RFD-01 and fails through deficiency memos. Rule 96A adds
    an export deadline to the LUT, and Rule 96B claws back either refund if proceeds are not
    realized.
  points:
    - "**Route 1 (Rule 96)**: pay IGST, and the **Shipping Bill is deemed the refund application** once the EGM and GSTR-3B are in — the failure surface is the SB000–SB006 validation chain on ICEGATE."
    - "**Route 2 (Rule 89)**: export under **LUT (FORM GST RFD-11, valid for the financial year** per Circular 8/8/2017-GST) and claim unutilised ITC through **RFD-01** — the failure surface is the RFD-03 deficiency memo, which forces a fresh application (Circular 125/44/2019-GST)."
    - "**Rule 96A** puts a clock inside the LUT: goods not exported within **three months** of the invoice (or the Commissioner's extension) make the tax payable with interest **within fifteen days** of that expiry."
    - "**Rule 96B** polices both routes with FEMA: refunds already received must be **deposited back with interest** where sale proceeds are not realized within the realization period — tying every refund to the EDPMS clock."

date: "2026-07-22"
reviewed: "2026-07-22"

sources:
  - id: "cgst-rule-96"
    title: "Rule 96, CGST Rules, 2017 — Refund of integrated tax paid on goods exported out of India"
    authority: "cbic"
    url: "https://taxinformation.cbic.gov.in/content/html/tax_repository/gst/rules/cgst_rules/active/chapter10/rule96_v1.00.html"
    anchor: "sub-rule (1) (shipping bill deemed refund application on manifest + valid GSTR-3B); proviso to (1)(b) (deemed filing shifts to mismatch rectification date)"
    retrieved: "2026-07-22"
  - id: "cgst-rule-96a"
    title: "Rule 96A, CGST Rules, 2017 — Export under bond or Letter of Undertaking"
    authority: "cbic"
    url: "https://taxinformation.cbic.gov.in/content/html/tax_repository/gst/rules/cgst_rules/active/chapter10/rule96a_v1.00.html"
    anchor: "sub-rule (1)(a) (tax plus s.50(1) interest payable within fifteen days after expiry of three months from the export invoice, or the Commissioner's further period, if goods are not exported); (1)(b) (one-year rule for services payment)"
    retrieved: "2026-07-22"
  - id: "cgst-rule-89"
    title: "Rule 89, CGST Rules, 2017 — refund of unutilised ITC (FORM GST RFD-01)"
    authority: "cbic"
    url: "https://taxinformation.cbic.gov.in/content/html/tax_repository/gst/rules/cgst_rules/active/chapter10/rule89_v1.00.html"
    anchor: "Rule 89(1) (application in FORM GST RFD-01) and 89(4) (refund formula for zero-rated supply without payment of tax)"
    retrieved: "2026-07-22"
  - id: "cgst-rule-96b"
    title: "Rule 96B, CGST Rules, 2017 — recovery of refund where export proceeds are not realized"
    authority: "cbic"
    url: "https://taxinformation.cbic.gov.in/content/html/tax_repository/gst/rules/cgst_rules/active/chapter10/rule96b_v1.00.html"
    anchor: "sub-rule (1) (refund of unutilised ITC or of integrated tax paid deposited back with interest where sale proceeds are not realized within the FEMA period or extension); sub-rule (2) (amount recovered is refunded where realization is evidenced within three months of the date of realization)"
    retrieved: "2026-07-23"
  - id: "cbic-circular-8-2017-gst"
    title: "CBIC Circular No. 8/8/2017-GST — Letter of Undertaking in place of bond (04.10.2017), with Notification No. 37/2017-Central Tax"
    authority: "cbic"
    url: "https://cbic-gst.gov.in/hindi/circulars.html"
    anchor: "LUT eligibility extended to all registered persons except those prosecuted for evasion exceeding ₹2.5 crore (Notif. 37/2017-CT); the LUT 'shall be valid for the whole financial year in which it is tendered'"
    retrieved: "2026-07-22"
  - id: "cbic-circular-125-2019-gst"
    title: "CBIC Circular No. 125/44/2019-GST — Master circular on electronic refund processing (18.11.2019)"
    authority: "cbic"
    url: "https://cbic-gst.gov.in/hindi/circulars.html"
    anchor: "deficiency-memo paragraphs (FORM GST RFD-03 requires a fresh refund application; limitation interplay), governing the Rule 89 route"
    retrieved: "2026-07-22"
reviewer: "Sreenath Govindarajan"

boundary: [cha]

image: "assets/cover.png"
tags: [lut, igst refund, rule 96, rule 89, gst exports]
---

# One Decision at Registration, Two Different Machines

Before the first export invoice is cut, every GST-registered exporter makes a routing decision
that determines which failure machine will process its refunds for the year: **pay IGST on the
export and reclaim it** (the Rule 96 route), or **export without payment under a Letter of
Undertaking and reclaim unutilised input tax credit** (the Rule 89 route). The two routes refund
different money, through different systems, examined by different officers, failing in different
ways — and much exporter frustration traces to diagnosing a Route-1 failure with Route-2
assumptions or vice versa.

The structural difference is where the application lives. On the IGST-paid route, **the Shipping
Bill itself is the refund application** — Rule 96 deems it filed once the export manifest and a
valid GSTR-3B exist, and the claim is processed automatically by ICEGATE. On the LUT route,
there is no automatic anything: the exporter files **FORM GST RFD-01** on the GST portal for the
accumulated ITC, computed under Rule 89(4)'s formula, and a tax officer examines it. Same
shipment, two different bureaucracies.

## Route 1: IGST-Paid — the Customs Machine and Its Codes

The IGST-paid route's virtue is automaticity and its vice is brittleness. Because the refund
runs on data matching between GSTN and ICEGATE, its entire failure surface is the validation
chain this library documents exhaustively: the
[SB000–SB006 response codes](/publications/icegate-sb-error-codes/), the
[SB005 invoice-number mismatch](/publications/sb005-igst-refund-blocked/) with its
officer-interface fix, and the proviso that deems a mismatched application **unfiled until
rectified**. Cash-flow-wise, the route front-loads an outflow (IGST paid on export value) to
buy a fast, officer-free inflow — *when the strings match*.

Who should ride it: exporters with clean, reconciled document pipelines and the working capital
to fund the IGST cycle — the refund of tax paid is typically larger and faster than an ITC
refund, and requires no application, no deficiency correspondence, no formula. Who should not:
exporters whose invoice identifiers, GSTINs or manifest data drift, for whom this route converts
every formatting inconsistency into blocked cash.

## Route 2: LUT — the Application Machine and Its Memos

The LUT route starts with a form and a clock. **FORM GST RFD-11** — available to every
registered person except those prosecuted for evasion above ₹2.5 crore (Notification
37/2017-Central Tax) — is furnished online and "shall be valid for the whole financial year in
which it is tendered" (Circular 8/8/2017-GST): a renewal ritual every April that, missed, puts
exports technically outside the LUT's cover. **Rule 96A** then embeds the deadline: if goods
are not exported **within three months of the export invoice** (or the Commissioner's extended
period), the exporter is "bound … to pay the tax due along with the interest" under s.50(1)
**within fifteen days** of that expiry — the without-payment route retroactively becomes a
with-payment event for the shipment that slipped.

The refund itself moves through **RFD-01**, and its characteristic failure is the **deficiency
memo (FORM GST RFD-03)** under the master refund circular (125/44/2019-GST): a memo does not
pause the application, it **ends it** — the exporter files afresh, with the limitation clock
still running. The route's discipline is therefore documentary completeness at first filing:
statements, invoices and the realization evidence that
[the e-BRC now supplies](/publications/e-brc-self-certification/), assembled before submission
rather than in response to a memo.

### Rule 96B: The Clause That Chains Both Routes to Realization

One rule reaches across both routes and is routinely discovered too late. **Rule 96B** provides
that where refund has been paid — either route, goods exports — and the **sale proceeds are not
realized within the FEMA realization period** (or its extension), the refunded amount must be
**deposited back with interest** — with restoration under sub-rule (2) where realization is
later evidenced **within three months of the date of realization**. Every GST export refund is therefore provisional against the
[realization clock](/publications/export-realization-fema-2026/) — and 2026's twice-moved clock
means the Rule 96B exposure date differs by shipment bucket. A refund ledger that does not
carry each shipment's realization due date is carrying an unquantified repayment liability.

## Choosing, and Switching, With Eyes Open

The route decision is a risk-profile decision, restated: Route 1 trades working capital for
speed and exposes you to string-matching; Route 2 trades officer examination and formula limits
for zero tax outflow and exposes you to deadlines (LUT renewal, the 96A three-month clock) and
memos. Mixed strategies are lawful — route selection is per-supply in principle — but each
route's paperwork must then be internally complete, and the GSTR-3B tables must reflect the
split correctly (3.1(b) for with-payment zero-rated supplies), since misplaced reporting stalls
the Route-1 transmission entirely.

TradeWatch treats route integrity as a readiness check: LUT validity for the financial year,
Rule 96A clocks per invoice, GSTR-3B table placement, and the realization due date behind Rule
96B, each flagged with a four-state verdict and its rule citation before filing. Kanan Labs
prepares a readiness packet. It does not file Shipping Bills or GST returns, holds no customs
credentials, and offers no tax advice — your licensed CHA files, and your tax decisions rest
with you and your advisors.
