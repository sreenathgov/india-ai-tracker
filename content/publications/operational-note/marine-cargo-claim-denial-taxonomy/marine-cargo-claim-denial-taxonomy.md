---
title: "Marine Cargo Claim Denial in India: A Taxonomy of Evidence Gaps"
slug: "marine-cargo-claim-denial-taxonomy"
description: "Marine cargo claims in India fail on evidence, not perils: Section 64VB premium timing, packing exclusions, notice windows and expired time-bars decide them."
author: "Sreenath Govindarajan"

type: "operational-note"
cluster: "marine-evidence"
entities: [section-64vb, insurance-act-1938, icc-clauses, institute-cargo-clauses, irdai-master-circular-2024, cgsa-2025, mtga-1993, marine-insurance-act-1963, coi, open-cover, bill-of-lading, packing-list]

takeaways:
  summary: >-
    Marine cargo claim denials in India cluster into four evidence families, not exotic perils:
    premium timing under Section 64VB of the Insurance Act 1938, policy exclusions such as ICC
    clause 4.3 on packing, procedural windows for notice and suit, and cross-document
    inconsistency across the invoice, packing list, B/L and Certificate of Insurance. Every family
    is checkable before sailing.
  points:
    - "**Section 64VB, Insurance Act 1938**: no insurer assumes risk before the premium is received — risk attaches from the date premium is paid (s. 64VB(2)). Cover bound after sailing is a denial at the threshold."
    - "**ICC (A) clause 4.3** excludes loss from insufficiency or unsuitability of packing 'to withstand the ordinary incidents of the insured transit' — including stowage in a container carried out by the assured or before attachment."
    - "The clocks are short and stacked: written notice at delivery (or **3 days** for non-apparent loss under sea carriage; **6 days** under MTGA 1993 s. 20(2)), suit within **one year** (CGSA 2025) or **nine months** (MTGA 1993 s. 24) — after which the insurer's subrogation target is gone."
    - "IRDAI's Master Circular of 05.09.2024 tightened the clock on insurers too: surveyor allocated within **24 hours**, survey report in **15 days**, decision within **7 days** of the report, with interest at **bank rate + 2%** for delay."

date: "2026-07-17"
reviewed: "2026-07-17"

sources:
  - id: "insurance-act-64vb"
    title: "Insurance Act, 1938 — Section 64VB (no risk to be assumed unless premium is received in advance)"
    authority: "india-statute"
    url: "https://www.indiacode.nic.in/show-data?actid=AC_CEN_2_33_00044_193804_1523351752525&orderno=165"
    anchor: "s. 64VB(1) (no insurer shall assume any risk unless premium is received or guaranteed); s. 64VB(2) (risk may be assumed not earlier than the date premium is paid); s. 64VB(5) (Central Government may relax by rules)"
    retrieved: "2026-07-17"
  - id: "icc-a-clauses-2009"
    title: "Institute Cargo Clauses (A), CL382, 01/01/2009 (Lloyd's Market Association / IUA)"
    authority: "icc"
    url: "https://insurance.archgroup.com/wp-content/uploads/sites/2/Institute-Cargo-Clauses-A-1-01-09-CL382.pdf"
    anchor: "clause 4.3 (insufficiency or unsuitability of packing or preparation, including stowage in a container, where carried out by the assured or prior to attachment); clause 4.4 (inherent vice); clause 8 (transit clause, 60-day post-discharge terminus); clause 16 (duty of assured to preserve rights against carriers)"
    retrieved: "2026-07-17"
  - id: "irdai-master-circular-pphi-2024"
    title: "IRDAI Master Circular on Protection of Policyholders' Interests 2024 (IRDAI/PP&GR/CIR/MISC/117/9/2024, 05.09.2024)"
    authority: "irdai"
    url: "https://irdai.gov.in/document-detail?documentId=5625747"
    anchor: "Section 1, claims-settlement items 2–5 (surveyor allocation within 24 hours; survey report within 15 days with ₹500/day to the claimant for surveyor delay; insurer decision within 7 days of the report) and processing item (ii) (interest at bank rate plus 2% for delayed settlement, paid suo motu)"
    retrieved: "2026-07-17"
  - id: "cgsa-2025"
    title: "The Carriage of Goods by Sea Act, 2025 (Act No. 19 of 2025), in force 10.09.2025"
    authority: "india-statute"
    url: "https://www.indiacode.nic.in/bitstream/123456789/21917/1/A2025-19.pdf"
    anchor: "Schedule, Art III(6)(a) (notice of loss in writing at removal, or within three days where loss is not apparent); Art III(6)(c) (carrier and ship discharged from all liability unless suit is brought within one year, extensible by agreement or by court up to three further months); s. 12 (repeal of the 1925 Act, with savings)"
    retrieved: "2026-07-17"
  - id: "mtga-1993"
    title: "The Multimodal Transportation of Goods Act, 1993 (as on 15.05.2026)"
    authority: "india-statute"
    url: "https://upload.indiacode.nic.in/view-casepdf?type=act&id=AC_CEN_7_7_00004_199328_1517807323277"
    anchor: "s. 20(2) (notice of non-apparent loss within six consecutive days of handover); s. 24 (multimodal transport operator not liable unless action is brought within nine months)"
    retrieved: "2026-07-17"
  - id: "mia-1963"
    title: "The Marine Insurance Act, 1963"
    authority: "india-statute"
    url: "https://www.indiacode.nic.in/bitstream/123456789/1520/5/A1963-11.pdf"
    anchor: "s. 79 (right of subrogation on payment); s. 81 (under-insurance — assured deemed his own insurer for the uninsured balance)"
    retrieved: "2026-07-17"
  - id: "gic-yearbook-2023-24"
    title: "General Insurance Council — Indian Non-Life Insurance Industry Yearbook 2023-24"
    authority: "other"
    url: "https://www.gicouncil.in/yearbook/2023-24/?page_id=652"
    anchor: "Annexure Table 12 (net incurred claims ratios): Marine Cargo 78.7% in 2023-24 (76.9% in 2022-23)"
    retrieved: "2026-07-17"
reviewer: "Sreenath Govindarajan"

boundary: [irdai]

image: "assets/cover.png"
tags: [marine cargo insurance, claim denial, section 64vb, icc clauses, subrogation]
---

# Claims Fail on Evidence, Not on Perils

Marine cargo claim denial in India is overwhelmingly a documentation and procedure story, not a
perils story. The exporter typically holds an all-risks Institute Cargo Clauses (A) cover; the
loss — wetting, theft, handling damage — is squarely a covered peril; and the claim still fails,
because the premium cleared after sailing, the packing was the assured's own, the notice window
lapsed, or the suit-clock against the carrier ran out and took the insurer's recovery with it.
The denial grounds live in statute and policy wording that existed, checkable, before the vessel
left the berth.

The claims environment sharpens the point. The marine cargo line ran a **net incurred claims
ratio of 78.7% in FY2023-24** (General Insurance Council Yearbook, Table 12) — a line under
sustained claims pressure, which translates operationally into strict scrutiny of survey
evidence, premium timing and procedural compliance at adjustment. Against that posture, the
exporter's protection is not argument after loss; it is an evidence file assembled before
shipment.

This page is the reference taxonomy: four denial families, each anchored to its instrument, each
with the pre-shipment check that defuses it. Two companion notes go deeper on the sharpest
edges — [the one-year and nine-month time-bars](/publications/subrogation-time-bars-cogsa-mtga/)
and [the CIF+10% insured-value reconciliation](/publications/open-cover-coi-cif-plus-10/).

## Family 1 — Attachment Failures: Premium and Declaration Timing

The first family of denials happens before any peril operates: the cover never attached.
**Section 64VB of the Insurance Act, 1938** provides that no insurer shall assume any risk
unless and until the premium is received or guaranteed, and that risk may be assumed **not
earlier than the date the premium is paid** (s. 64VB(2)). Indian adjudication treats the rule as
absolute rather than commercial: a certificate issued against a cheque that cleared after the
loss, or a shipment bound informally with premium to follow, is exposed at the threshold —
whatever the policy schedule says. Sub-section (5) permits relaxations by rules for prescribed
categories, which is exactly why premium mechanics under open covers must be checked against the
cover's own terms rather than assumed.

The open-cover variant of the same family is the undeclared shipment. A floating arrangement
insures only what is declared into it in the manner the cover prescribes; the Marine Insurance
Act, 1963 frames the discipline for floating policies — declarations in order of dispatch,
comprising **all consignments** within the policy's terms, honestly valued (s. 31). A shipment
that sails undeclared is a shipment the insurer can treat as never presented to the cover. The
declaration timestamp against the B/L's shipped-on-board date is therefore a claims document,
produced months before any claim.

## Family 2 — Exclusion Triggers Built at the Warehouse

The second family is written into the Institute Cargo Clauses themselves and is triggered by the
exporter's own pre-shipment choices. **ICC (A) clause 4.3** excludes loss, damage or expense
"caused by insufficiency or unsuitability of packing or preparation of the subject-matter
insured to withstand the ordinary incidents of the insured transit" — and the clause reaches
container stuffing: packing "shall be deemed to include stowage in a container" where carried
out by the assured or before attachment. Clause 4.4 excludes inherent vice; clause 8 ends the
insured transit **60 days after discharge** at the final port whatever the certificate's
destination line says.

The operational meaning is that the surveyor's first questions after a loss are about evidence
created at the warehouse: packing specification, stuffing photographs, container condition,
seal numbers. Where that record is thin, "inadequate packing" is the exclusion of first resort
— it attributes the loss to the assured and requires no dispute about the peril at all. The
counter is not eloquence at adjustment; it is a **packing and stuffing evidence set generated
per shipment**, referenced to the packing list the other three documents already agree with.

## Family 3 — The Procedural Clocks

The third family is pure calendar. Indian cargo claims run on short, stacked windows, and every
one of them is capable of ending the claim by itself. At delivery, visible loss must be noticed
in writing at removal; **non-apparent loss within three days** under the sea-carriage regime
(CGSA 2025, Schedule Art III(6)(a)) and **within six consecutive days** where the contract is a
multimodal document (MTGA 1993, s. 20(2)). A clean delivery receipt signed by the consignee over
damaged cargo surrenders the presumption against the carrier — and with it, much of the
insurer's recovery position.

Then come the suit clocks: **one year** against the sea carrier — under the Carriage of Goods by
Sea Act, 2025, which replaced the 1925 Act on 10.09.2025 with the discharge rule intact — and
**nine months** against a multimodal transport operator (MTGA s. 24). These are extinguishment
provisions, not mere limitation, and because the insurer's subrogated recovery under s. 79 of
the Marine Insurance Act depends on the assured having preserved those rights (ICC clause 16
makes it a duty), an expired clock converts directly into a repudiated claim. The full mechanics
are in the [time-bars note](/publications/subrogation-time-bars-cogsa-mtga/).

### The Insurer's Own Clock Since September 2024

IRDAI's Master Circular on Protection of Policyholders' Interests (05.09.2024) imposed a
mirror-image discipline on insurers: a surveyor must be **allocated within 24 hours** of claim
report; the survey report is due **within 15 days** of allocation, with ₹500 per day payable to
the claimant for surveyor delay; the insurer must **decide within 7 days** of the report; and
delayed settlement carries interest at **bank rate plus 2%**, payable suo motu. The circular's
claims chapter is framed for retail general insurance — a class IRDAI's 2024 framework describes
as covering individuals, farmers and **MSMEs**, which places mid-market exporters closer to its
protection than large corporate covers, whose terms should be read against the underlying 2024
Regulations — but its
direction is unambiguous: adjudication is being forced faster, which rewards the claimant whose
evidence file is complete on day one and penalises the one assembling documents after loss.

## Family 4 — The Cross-Document File

The fourth family is the administrative one: the claim file itself does not reconcile. The four
core claim documents — Commercial Invoice, Packing List, Bill of Lading and Certificate of
Insurance — must tell one story of quantity, weight, value, voyage and insured amount.
Divergences that were cosmetic at shipment become grounds at adjustment: an insured value below
the credit-required **110% of CIF** invites proportionate reduction, because under s. 81 of the
Marine Insurance Act an under-insured assured is "deemed to be his own insurer in respect of the
uninsured balance"; a COI voyage line that differs from the B/L routing raises attachment
questions; a packing-list weight that contradicts the B/L invites the packing exclusion.

The reconciliation logic is identical to the customs-side discipline in
[the pre-LEO reconciliation note](/publications/pre-leo-document-reconciliation/) — identity
fields as exact strings, quantities in one unit system, one arithmetic across values — extended
by one document, the COI, and one derived figure, CIF+10%, whose calculation is dissected in
[the Open Cover vs COI note](/publications/open-cover-coi-cif-plus-10/).

TradeWatch assembles this as the Marine Cargo Insurance Broker Packet: attachment evidence
(declaration and premium timing), the packing evidence set, the calendar of notice and suit
dates, and the four-document reconciliation, each item carrying a four-state verdict and its
citation. Kanan Labs prepares claim-admissible evidence. It does not advise on, select, or bind
insurance — your IRDAI-licensed broker does.
