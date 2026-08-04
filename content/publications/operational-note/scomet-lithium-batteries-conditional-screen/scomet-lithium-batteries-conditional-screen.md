---
title: "SCOMET and Lithium Batteries: A Conditional Screen, Not a Ban"
slug: "scomet-lithium-batteries-conditional-screen"
description: "Ordinary lithium-ion batteries are not SCOMET-controlled: 8A301.e catches bare cells above 350 Wh/kg and exempts batteries. The catch-all is what remains."
author: "Sreenath Govindarajan"

type: "operational-note"
cluster: "ev-lithium"
entities: [scomet, 8a301e, dgft, hs-850760, energy-density, catch-all, hbp-10-05, wmd-act, export-policy, itc-hs]

takeaways:
  summary: >-
    HS 8507.60 lithium-ion batteries are freely exportable and not SCOMET-controlled by default:
    entry 8A301.e controls bare secondary cells whose energy density exceeds 350 Wh/kg, and its
    note expressly excludes batteries, including single-cell batteries. What survives for
    ordinary exporters is the conditional layer — the catch-all obligation of HBP para 10.05
    where end-use raises WMD or military-diversion concerns.
  points:
    - "**SCOMET 8A301.e** (Updated SCOMET List 2025, Notification 31/2025-26 of 23.09.2025): controls **secondary cells with energy density exceeding 350 Wh/kg** at 20°C — computed as nominal voltage × capacity (Ah) ÷ mass (kg)."
    - "The exemption is explicit: **'Note 8A301.e does not apply to batteries, including single-cell batteries'** — assembled packs and modules sit outside the entry regardless of chemistry."
    - "Export policy for the line is **Free**: 8507 does not appear in the export licensing schedule, and DGFT's General Notes deem unlisted goods 'freely exportable without conditions'."
    - "**HBP 2023, para 10.05 (catch-all)**: where the exporter is notified by DGFT, **or knows or has reason to believe**, that a non-SCOMET item risks diversion to WMD, missile or military use, a SCOMET authorisation must be sought — an end-use screen, not an HS gate."

date: "2026-07-22"
reviewed: "2026-07-22"

sources:
  - id: "scomet-list-2025"
    title: "DGFT — Updated SCOMET List 2025 (Appendix 3 to Schedule 2, ITC(HS)), notified by Notification No. 31/2025-26 dated 23.09.2025 (effective 23.10.2025)"
    authority: "dgft"
    url: "https://content.dgft.gov.in/Website/dgftprod/82cccea3-646e-435c-876f-88476c4ed5ca/Updated%20SCOMET%20List%202025%20(as%20on%2023.09.2025).docx.pdf"
    anchor: "entry 8A301.e (primary cells above stated energy/power densities; secondary cells with energy density exceeding 350 Wh/kg at 20°C); Note to 8A301.e (does not apply to batteries, including single-cell batteries); technical notes (energy density = nominal voltage × nominal capacity in Ah ÷ mass in kg; 'cell' defined as the basic electrochemical building block)"
    retrieved: "2026-07-22"
  - id: "dgft-export-policy-general-notes"
    title: "DGFT — General Notes to Export Policy (Schedule 2, ITC(HS)) and chapter-wise Export Policy"
    authority: "dgft"
    url: "https://content.dgft.gov.in/Website/gennote_0.pdf"
    anchor: "General Note (goods not listed in the export licensing schedule are deemed freely exportable without conditions under the FTDR Act, 1992); Chapter 85 of the Export Policy schedule (8507 absent from restricted entries)"
    retrieved: "2026-07-22"
  - id: "hbp-2023-chapter-10"
    title: "DGFT — Handbook of Procedures 2023, Chapter 10 (SCOMET procedures)"
    authority: "dgft"
    url: "https://content.dgft.gov.in/Website/HBP2023_Chapter10.pdf"
    anchor: "para 10.05 (catch-all controls on non-SCOMET items: authorisation required where DGFT notifies in writing or the exporter knows or has reason to believe of WMD/missile/military diversion risk, with 'military use' defined against Category 6); paras 10.14–10.15 (GAER and GAICT general authorisations for controlled items)"
    retrieved: "2026-07-22"
reviewer: "Sreenath Govindarajan"

boundary: [classification]

image: "assets/cover.png"
tags: [scomet, export controls, lithium batteries, hs 8507.60, dgft]
---

# The Control Everyone Fears and Almost Nobody Triggers

SCOMET — India's dual-use export-control list — hangs over lithium-battery exporters as a vague
dread: batteries are "strategic," lithium is "sensitive," so surely a licence lurks somewhere.
The list itself is more precise and far narrower. **Ordinary commercial lithium-ion batteries,
packs, modules and cells under HS 8507.60 are not SCOMET-controlled by default.** The relevant
entry, **8A301.e**, controls *high energy devices* defined by measured thresholds — and its own
note expressly walks assembled batteries out of scope. What genuinely remains for an EV-lane
exporter is a **conditional screen**: a set of specific triggers, checkable per shipment,
centred on the cell-level energy-density threshold and the end-use catch-all.

Getting this right matters in both directions. Overreading the control — treating every 8507.60
line as licence-bound — adds weeks and paperwork to shipments the law calls Free. Underreading
it — assuming "batteries are exempt" covers bare high-density cells or a customer with a
missile-programme address — walks into the FTDR Act's penal machinery. The screen below is the
verified middle.

## What 8A301.e Actually Controls

The Updated SCOMET List 2025 (notified 23.09.2025, effective 23.10.2025) states the entry in
measurable terms. Under **8A301.e "High energy devices"**, the controlled items are **cells**:
primary cells above stated energy/power-density pairs, and — the clause relevant to the
lithium-ion lane — **"'Secondary cells' having an 'energy density' exceeding 350 Wh/kg at
20°C."** The technical notes make the arithmetic auditable: energy density is "calculated from
the nominal voltage multiplied by the nominal capacity in ampere-hours (Ah) divided by the mass
in kilograms," and a *cell* is "the basic building block of a battery" — positive and negative
electrodes, electrolyte, a source of electrical energy.

Then the exemption, verbatim and unambiguous: **"Note: 8A301.e does not apply to batteries,
including single-cell batteries."** An assembled pack, a module, even a single cell built out
as a battery — outside the entry, whatever its chemistry. The controlled article is the **bare
cell above 350 Wh/kg**, a threshold that today sits above mainstream EV chemistries (typical
commercial NMC/LFP cells run well below it) but within reach of frontier silicon-anode and
lithium-metal cell programmes. The screen is therefore a datasheet check, not a vibe: nominal
voltage × Ah ÷ kg, per cell model, documented — the same specification discipline the
[classification-drift note](/publications/hs-classification-drift/) argues for at the HS layer.

## The Baseline: Free, By the Schedule's Own Logic

Export policy for the line is **Free**, and provably so. DGFT's General Notes to the Export
Policy state the rule of construction: "goods not listed in the Schedule are deemed to be
freely exportable without conditions" under the FTDR Act — and heading 8507 does not appear in
the export licensing schedule's Chapter 85 entries. Free is the default the SCOMET screen sits
on top of, not a status the exporter must earn; the burden arises only where a trigger fires.

### The Triggers That Survive the Exemption

Four survive, and they define the per-shipment screen. **(1) Bare cells above threshold** —
the 8A301.e control itself, engaged by shipping cells (not packs) exceeding 350 Wh/kg.
**(2) Adjacent controlled content** — items elsewhere in Category 8 travelling with the
battery (controlled BMS cryptography, controlled software/technology transfers accompanying a
cell-manufacturing deal). **(3) Military-design lineage** — cells or batteries designed for
listed military platforms, controlled through the military-category entries rather than
8A301.e. **(4) The catch-all** — end-use, next section. A screen that checks these four and
records the answers is a complete SCOMET position for a commercial battery exporter.

## The Catch-All: An End-Use Duty, Not an HS Gate

Handbook of Procedures 2023, **para 10.05**, is the clause that makes export control everyone's
job: "If the exporter **has been notified in writing by DGFT** or he **knows or has reason to
believe** that an item not covered in the SCOMET list has a potential risk of use in or
diversion to Weapons of Mass Destruction (WMD) or in missile system or military use (including
by terrorists and non-state actors), he **shall apply for a SCOMET authorisation**." The note
pins "military use" to incorporation into Category-6 items. This is a knowledge-based duty: it
attaches to what the exporter knows or should reasonably infer from the order — the customer's
identity, the stated application, the destination, the anomalies (a "consumer electronics"
buyer ordering aerospace-format cells to a defence-cluster address).

Operationally, the catch-all converts into a light, documented end-use screen per new customer
and per unusual order: who is the buyer, what is the declared application, does anything known
contradict it — with the answers recorded. The general authorisations in the same chapter
(GAER for repaired-item re-export, GAICT for certain intra-company Category-8 transfers to
listed countries) matter only once an item is actually controlled; for the ordinary commercial
battery trade they are not in play, and saying so precisely is part of the screen's value.

## The Screen, As a Checklist

Per shipment: confirm the article is a **battery/pack/module** (exemption applies) or a **bare
cell** (compute Wh/kg against 350); confirm no controlled companions travel in the deal
(software, technology, controlled components); run the **end-use screen** and file its record;
and note the conclusion, with the list edition cited — because SCOMET is amended annually and
the 2025 edition's thresholds are the current law, not folklore from an older list. Final
classification of any borderline article — a novel cell chemistry, an integrated
battery-management export — requires human review against the list's technical notes.

TradeWatch runs this as a conditional SCOMET screen inside its EV-lane readiness packets:
exemption/threshold determination per article, end-use screen prompts, and the documented
conclusion with its citation. Kanan Labs prepares evidence and readiness; SCOMET
classification decisions and authorisation applications remain the exporter's, made with human
review — and where a trigger fires, the application is the exporter's own act before DGFT.
