---
title: "UN 38.3, the DG Declaration and 30% State of Charge, by Mode"
slug: "un383-dg-declaration-state-of-charge"
description: "Lithium battery exports run on three proofs: the UN 38.3 test summary, the DG declaration, and state of charge — a 30% legal cap by air, practice by sea."
author: "Sreenath Govindarajan"

type: "operational-note"
cluster: "ev-lithium"
entities: [un-38-3, test-summary, dg-declaration, state-of-charge, un-3480, imdg-code, iata-dgr, class-9a, hs-850760, thermal-runaway]

takeaways:
  summary: >-
    Lithium-ion battery exports stand on three evidentiary legs: the UN 38.3 test summary that
    manufacturers and distributors must make available, the dangerous-goods declaration under
    the modal codes, and state of charge — capped at 30% by law for air shipments, and demanded
    by carriers and insurers as practice at sea, where the IMDG Code sets no general SoC limit.
  points:
    - "**UN Manual of Tests and Criteria, sub-section 38.3.5**: a cell/battery **test summary shall be made available**, with prescribed contents — manufacturer, unique test report ID, tests conducted and results, responsible person."
    - "**By air (IATA DGR, PI 965)**: standalone lithium-ion batteries (UN 3480) 'must be shipped at a **state of charge not exceeding 30%**' — and from **1 January 2026** the 30% cap extends to PI 966 (packed with equipment)."
    - "**By sea, the IMDG Code — including Amendment 42-24 — contains no general SoC limit**: the 30% figure at sea is carrier acceptance policy and insurer warranty practice (CINS/IG guidelines), not code law. Misstating it as IMDG law is a common error."
    - "The insurer linkage is documentary: missing UN 38.3 summaries or unevidenced SoC hand insurers **inherent-vice and thermal-runaway grounds** — the evidence must exist per shipment, not per product line."

date: "2026-07-22"
reviewed: "2026-07-22"

sources:
  - id: "un-manual-38-3-5"
    title: "UN Manual of Tests and Criteria, Rev. 8 (2023), ST/SG/AC.10/11/Rev.8 — sub-section 38.3.5 (test summary)"
    authority: "un-iata-imo"
    url: "https://unece.org/sites/default/files/2024-09/ST_SG_AC.10_11_Rev.8e_WEB.pdf"
    anchor: "sub-section 38.3.5 (test summary shall be made available; prescribed contents including manufacturer identity, unique test report identification number, list of tests conducted and results, name and title of responsible person)"
    retrieved: "2026-07-22"
  - id: "iata-lithium-guidance-2026"
    title: "IATA — Lithium Battery Guidance Document, revised for the 2026 regulations (DGR 67th edition / ICAO TI 2025-2026)"
    authority: "un-iata-imo"
    url: "https://www.iata.org/contentassets/05e6d8742b0047259bf3a700bc9d42b9/lithium-battery-guidance-document.pdf"
    anchor: "PI 965 (UN 3480 standalone lithium-ion: SoC not exceeding 30% of rated capacity; higher SoC only with State approvals under SP A331); 2026 extension of the 30% cap to PI 966; classification (Class 9, UN 3480/3481, no packing group); marks and labels (UN number and proper shipping name, lithium battery mark, Class 9 label, Cargo Aircraft Only); test-summary availability obligation for batteries manufactured after 30.06.2003"
    retrieved: "2026-07-22"
  - id: "imdg-42-24-summary"
    title: "IMDG Code Amendment 42-24 — detailed change summary (Exis Technologies / hazcheck, IMDG-licensed publisher); carrier implementation advisory (Maersk, 06.01.2026)"
    authority: "un-iata-imo"
    url: "https://hazcheck.com/wp-content/uploads/2024/10/A42-IMDG-Code-detailed-summary-for-download.pdf"
    anchor: "Amendment 42-24 battery-related changes (new UN 3556/3557/3558 for battery-powered vehicles; SP 962; SP 188 updates; Class 9A label per SP 384/5.2.2.2.2) — and the absence of any general state-of-charge provision for sea carriage"
    retrieved: "2026-07-22"
  - id: "cins-lithium-guidelines"
    title: "CINS / International Group of P&I Clubs — Lithium-ion Cells: Guidelines for Carriage by Sea (2025 edition)"
    authority: "other"
    url: "https://www.american-club.com/files/files/CINS_Lithium-ion_Cells_Guidelines_2025.pdf"
    anchor: "industry best-practice provisions on state of charge and documentation for sea carriage — the practice layer that operates where the IMDG Code is silent"
    retrieved: "2026-07-22"
  - id: "icc-a-clauses-2009"
    title: "Institute Cargo Clauses (A), CL382, 01/01/2009"
    authority: "icc"
    url: "https://insurance.archgroup.com/wp-content/uploads/sites/2/Institute-Cargo-Clauses-A-1-01-09-CL382.pdf"
    anchor: "clause 4.4 (inherent vice exclusion) — the policy hook engaged where lithium evidence is missing"
    retrieved: "2026-07-22"
reviewer: "Sreenath Govindarajan"

boundary: [irdai]

image: "assets/cover.png"
tags: [un 38.3, state of charge, dangerous goods, lithium batteries, hs 8507.60]
---

# Three Proofs Travel With Every Battery

A lithium-ion battery shipment (HS 8507.60, transported as **UN 3480** standalone or **UN 3481**
in/with equipment) moves on three evidentiary legs, and each leg answers a different examiner.
The **UN 38.3 test summary** answers the design question — has this cell or battery type passed
the eight transport-safety tests. The **dangerous-goods declaration** answers the shipment
question — what exactly is in this consignment, classified, packed, marked and labelled under
the modal code. And **state of charge (SoC)** answers the energy question — how much stored
energy rides in the box. Carriers examine all three at booking; insurers examine them after a
fire.

The subtlety that catches even careful exporters is that the three legs have **different legal
force by mode**. The test summary is universal. The DG declaration is universal in requirement
but modal in form. And the famous "30% state of charge" rule is **air law and sea practice** —
a distinction this note is precise about because getting it backwards produces both
over-compliance theatre and genuine evidentiary gaps.

## The Test Summary: Made Available, Per 38.3.5

Sub-section 38.3.5 of the UN Manual of Tests and Criteria is the root obligation: a cell and
battery **"test summary shall be made available,"** with prescribed contents — the
manufacturer's identity, a **unique test report identification number**, the cell/battery
description, the **list of tests conducted and results**, the testing laboratory, and the
"name and title of responsible person as an indication of the validity of information
provided." The modal regulations then bind the supply chain: manufacturers **and subsequent
distributors** of cells, batteries and battery-powered equipment manufactured after 30 June
2003 must make the summary available.

Two operational readings follow. First, the summary is a **type document with shipment
consequences**: it certifies a design, but every consignment must be traceable to a summary
matching the cells actually packed — a pack assembled this quarter from a different cell
vendor needs the *new* vendor's summary, not the old PDF in the shared drive. Second, "made
available" means producible on demand — to the carrier's DG desk at booking, to the airline's
acceptance check, and later to a surveyor. The summary's unique report ID is the join key an
examiner uses; a summary whose model designation does not match the invoice's is, for
acceptance purposes, the wrong document.

## State of Charge: Law by Air, Practice by Sea

By **air**, the 30% figure is hard law. Under IATA's Dangerous Goods Regulations, standalone
lithium-ion batteries under **Packing Instruction 965** "must be shipped at a **state of charge
not exceeding 30%** of their rated capacity," with higher SoC only under State-of-Origin and
State-of-Operator approvals (Special Provision A331) — and standalone UN 3480 is **forbidden on
passenger aircraft** outright, flying Cargo Aircraft Only with the CAO label. From **1 January
2026**, the cap widened: batteries **packed with equipment (PI 966)** must also be offered at
≤30% SoC, with 30% "strongly recommended" though not mandatory for batteries *contained in*
equipment (PI 967).

By **sea**, the honest statement is different, and this library corrects its own research
lineage here: the **IMDG Code — including Amendment 42-24**, mandatory from 1 January 2026 —
**contains no general state-of-charge limit** for lithium-ion cargo. Amendment 42-24's battery
changes are real but elsewhere: new UN numbers **3556–3558** for battery-powered vehicles, the
Class 9A lithium label regime, updated special provisions. The ≤30% figure at sea lives in the
**practice layer**: CINS and International Group guidelines, carrier acceptance policies, and —
decisively for exporters — **insurer warranties** written into marine covers for battery cargo.
A sea shipment at 45% SoC may be perfectly lawful under the Code and still be a warranty breach
under the policy or a booking misdeclaration under the carrier's terms. The compliance
question at sea is therefore not "what does IMDG say" but *"what do the cover and the booking
terms require — and is it evidenced?"*

### The DG Declaration: Where the Three Legs Meet

The shipper's dangerous-goods declaration (the IMDG multimodal DG form at sea; the DGD under
IATA by air) is where the classification is asserted under signature: UN number, proper
shipping name, **Class 9** (no packing group), packing instruction, marks and labels — the
lithium battery mark, the Class 9/9A label, CAO where applicable. It is a declaration in the
legal sense: the signer certifies the consignment is classified, packed and labelled per the
code. Against the reconciliation logic running through this library, the DG declaration must
also agree with the commercial documents — the same cells, quantities and configurations as
the [invoice and packing list](/publications/pre-leo-document-reconciliation/) — because a DG
form describing modules while the invoice bills packs is exactly the inconsistency examiners
escalate on.

## Why Insurers Read These Documents After the Fire

The insurance linkage is the expensive one. Lithium fires invite the **inherent vice**
exclusion (ICC (A) clause 4.4) and, in battery-specific covers, express warranties on testing
and SoC. The claims pattern documented in this library's
[denial taxonomy](/publications/marine-cargo-claim-denial-taxonomy/) applies with force: after
a thermal event, the insurer's first requests are the UN 38.3 summary matching the cells, the
DG declaration, and whatever SoC evidence exists — charge records at pack-out, pre-shipment
inspection notes. Where the file is silent, the insurer does not need to prove the batteries
were defective; the missing evidence itself does the work. The preventive posture is a
**per-shipment lithium annex**: the matching test summary, the signed DG declaration, SoC
records where the mode or policy requires them, and packaging photos — assembled before
sailing, per the mode actually used.

TradeWatch builds this annex inside its readiness packets for the EV lane: test-summary-to-
invoice matching, DG-declaration consistency, and mode-correct SoC evidence requirements —
air law and sea warranty distinguished explicitly — each cited to its instrument. Kanan Labs
prepares evidence and readiness. It does not advise on, select, or bind insurance, and DG
classification sign-off remains the shipper's declaration — your IRDAI-licensed broker advises
on cover; your DG-trained signatory signs.
