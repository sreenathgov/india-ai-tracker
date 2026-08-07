---
title: "AI and HS Classification: Where the Machine Has to Stop"
slug: "ai-hs-classification-limits"
description: "GRI 1 gives legal force to headings and section notes, not to product descriptions. That is why an AI code suggestion is a hypothesis, not a determination."
author: "Sreenath Govindarajan"

type: "operational-note"
cluster: "igst-customs"
entities: [hs-classification, gri-1, gri-3, harmonized-system, caar, section-28h, binding-tariff-information, carotar-2020, tradewatch, cha]

takeaways:
  summary: >-
    A model can propose an HS code quickly and will usually propose a plausible one. Classification
    is not decided by plausibility: General Rule 1 gives legal force to the headings and the
    section and chapter notes, and only those. The way to make a code binding is an advance
    ruling, not a confidence score.
  points:
    - "**GRI 1** provides that classification **shall be determined according to the terms of the headings and any relative section or chapter notes** — titles of sections and chapters are for ease of reference only and carry no legal force."
    - "**GRI 3** resolves goods classifiable under two or more headings by **specific over general**, then **essential character**, then the **last in numerical order** — a sequence, not a judgement call."
    - "In India, a code becomes binding through an **advance ruling under section 28H** to the **Customs Authority for Advance Rulings**, applied for in **Form CAAR-1**; the ruling binds the applicant and the department **in that applicant's case**, not the market."
    - "**CAROTAR 2020** obliges an importer claiming preferential origin to **possess origin information** — so a code and an origin claim are separate evidentiary burdens that a single model output does not discharge."

date: "2026-08-07"
reviewed: "2026-08-07"

sources:
  - id: "hs-gri"
    title: "General Rules for the Interpretation of the Harmonized System (Harmonized Commodity Description and Coding System, WCO)"
    authority: "other"
    url: "https://www.wcoomd.org/en/topics/nomenclature/instrument-and-tools/hs-nomenclature-2022-edition.aspx"
    anchor: "GRI 1 (titles of sections, chapters and sub-chapters are provided for ease of reference only; for legal purposes classification shall be determined according to the terms of the headings and any relative section or chapter notes); GRI 3(a)–(c) (most specific description; essential character for mixtures and composite goods; last in numerical order among equally meriting headings); GRI 6 (classification in subheadings determined by the terms of those subheadings and any related subheading notes, mutatis mutandis)"
    retrieved: "2026-08-07"
  - id: "customs-act-28h"
    title: "Sections 28E–28M, Customs Act, 1962 — advance rulings and the Customs Authority for Advance Rulings"
    authority: "india-statute"
    url: "https://www.indiacode.nic.in/handle/123456789/1362"
    anchor: "s.28H (application for advance ruling, including on classification of goods under the Customs Tariff Act, in the prescribed form); s.28EA (Customs Authority for Advance Rulings, appointed by notification); s.28J (the advance ruling is binding only on the applicant who sought it and on the concerned officers and Commissionerate in respect of that applicant)"
    retrieved: "2026-08-07"
  - id: "caar-regulations-2021"
    title: "Customs Authority for Advance Rulings Regulations, 2021 (Notification No. 01/2021-Customs (N.T.), 04.01.2021), as amended by Notification No. 63/2022-Customs (N.T.), 20.07.2022"
    authority: "cbic"
    url: "https://taxinformation.cbic.gov.in/view-pdf/1003029/ENG/Notifications"
    anchor: "Application in Form CAAR-1 to the jurisdictional Authority, and the procedural regulations governing filing, hearing and pronouncement"
    retrieved: "2026-08-07"
  - id: "carotar-2020"
    title: "Customs (Administration of Rules of Origin under Trade Agreements) Rules, 2020 (Notification No. 81/2020-Customs (N.T.), 21.08.2020)"
    authority: "cbic"
    url: "https://taxinformation.cbic.gov.in/view-pdf/1004633/ENG/Notifications"
    anchor: "Rule 4 (importer claiming preferential rate to possess information as indicated in Form I, and to exercise reasonable care as to the accuracy and truthfulness of that information) and Rule 5 (obligation to furnish that information on the proper officer's requisition)"
    retrieved: "2026-08-07"
reviewer: "Sreenath Govindarajan"

boundary: [cha, classification]

image: "assets/cover.png"
tags: [hs classification, artificial intelligence, tariff, advance ruling, carotar]
---

# Why the Plausible Code Is the Dangerous One

Ask a capable model for the HS code of a product and it will return one, quickly, with a
confident explanation. The output will frequently be right, which is precisely what makes the
practice hazardous: **a method that is usually right and never signals which cases are the
exceptions transfers all of the risk to the user without any of the warning.**

Classification is not a lookup and it is not a similarity judgement. It is the application of a
legal instrument with an ordered set of interpretive rules, to a specific good, with specific
facts about composition, function and presentation. A model trained on how products are usually
described is optimising for the wrong target — *it predicts the code most associated with the
words, while the law requires the code determined by the headings and the notes.* Those coincide
often enough to be useful and diverge exactly where the money is.

What follows is where the divergence lives, and what has to happen before a code is safe to file
against.

## GRI 1: The Headings and the Notes, and Nothing Else

The Harmonized System settles its own interpretive hierarchy in its first rule, and the rule is
narrower than most users assume. **GRI 1** provides that the titles of sections, chapters and
sub-chapters are **for ease of reference only**, and that for legal purposes classification
**shall be determined according to the terms of the headings and any relative section or chapter
notes**.

Two consequences follow that models systematically miss. First, **the chapter title is not
evidence.** A product that obviously belongs to the subject matter of a chapter may be excluded
from it by a chapter note, and the note governs. Second, **the operative text is often exclusionary
and located elsewhere in the schedule** — a note in one section removing goods to another. A
reasoning process built on resemblance between a product description and a heading description
will not go looking for the note that defeats the resemblance, because nothing in the description
points at it.

**GRI 3** then handles the genuinely contested case, where goods are prima facie classifiable
under two or more headings, and it does so as an ordered sequence: **3(a)** the heading providing
the **most specific description**; failing that, **3(b)** the material or component giving the
goods their **essential character**; failing that, **3(c)** the heading **last in numerical
order** among those equally meriting consideration. *This is a decision procedure, not a
weighing of considerations — and a determination that does not state which limb it rests on has
not shown its reasoning.*

## Where Machine Assistance Is Genuinely Strong

The limits are real, and dismissing the tooling on account of them would be an expensive mistake.
Classification work contains a large volume of tractable labour that machines handle well.

**Retrieval.** Finding every note, ruling and explanatory text that bears on a candidate heading
is a search problem across a large corpus, and it is the step humans skip when busy. A system that
surfaces the exclusionary note is doing the highest-value part of the job.

**Consistency.** Firms misclassify most often by drift — the same product coded differently across
shipments, sites or years, usually because different people classified it. *Detecting that a
consignment has been coded differently from the last thirty identical consignments is mechanical,
and it is one of the strongest audit-defence signals a firm can hold.*

**Change tracking.** Tariff schedules, notes and rates move. Knowing that a heading relevant to a
firm's catalogue was amended is monitoring work, and monitoring is exactly what does not survive
being someone's Tuesday afternoon task.

**Assembling the file.** A candidate heading, the notes considered, the GRI limb relied on, the
competing heading rejected and why — presented for a human to accept or reject — converts hours of
research into minutes of judgement.

### What Makes a Code Actually Binding

No confidence score binds anyone. In India the mechanism is statutory: an application for an
**advance ruling under section 28H** of the Customs Act, 1962, made in **Form CAAR-1** to the
**Customs Authority for Advance Rulings** under the CAAR Regulations, 2021. Under **section 28J**
the ruling is binding **only on the applicant who sought it** and on the concerned officers in
respect of that applicant — *it is not a market-wide precedent, and a ruling obtained by another
importer for a similar product does not protect you.*

The European analogue is **Binding Tariff Information**, which binds the customs authorities
against the holder and the holder against the authorities, for the goods and the period
specified. Both instruments share the property that matters: **they convert a classification
opinion into a position with legal effect, and neither can be produced by any system.**

The practical rule for a trade function is therefore to triage by exposure. High-volume, high-duty
or genuinely contestable classifications justify an advance ruling. Routine repeats of an
established position are managed by consistency checking. *What should never happen is a novel,
material classification going out on a model's suggestion because it sounded well-reasoned.*

## The Origin Claim Is a Separate Burden

Classification is often confused with origin, and a single output claiming to resolve both is
resolving neither. Under **CAROTAR 2020**, an importer claiming a preferential rate must
**possess origin information** as indicated in the prescribed form and **exercise reasonable care
as to its accuracy and truthfulness**, and must furnish it on the proper officer's requisition. A
certificate of origin is not, by itself, discharge of that obligation.

*Two separate evidentiary burdens therefore sit on the same consignment* — the code, determined
under the GRI; and the origin claim, supported by information the importer must actually hold.
Systems that present a single confident answer covering both are compressing away the distinction
the law draws.

[TradeWatch](/publications/hs-classification-drift/) treats classification as a prepared
determination rather than an answer: candidate headings with the notes and GRI limb that produced
them, drift flagged against the firm's own history, origin information tracked as a separate
requirement, and anything unresolved
[surfaced as unresolved](/publications/four-state-readiness/) rather than defaulted. Kanan Labs
prepares a readiness packet. It does not file Shipping Bills and holds no customs credentials —
your licensed CHA files. Final HS classification requires human review.
