---
title: "Does the EU AI Act Reach Your Trade-Compliance System?"
slug: "eu-ai-act-trade-compliance-systems"
description: "The Digital Omnibus moved Annex III high-risk duties from 2 August 2026 to 2 December 2027. Transparency and deployer obligations did not move with them."
author: "Sreenath Govindarajan"

type: "change-watch"
cluster: "ai-trade-compliance"
entities: [eu-ai-act, digital-omnibus, annex-iii, article-6, article-14, article-26, high-risk-ai, tradewatch, cha]

takeaways:
  summary: >-
    The EU AI Act's Annex III high-risk obligations were postponed from 2 August 2026 to 2
    December 2027 by the Digital Omnibus on AI, which entered into force on 27 July 2026. Most
    trade-compliance systems are not Annex III listed. The obligations that reach them arrive
    through customer contracts and deployer duties, not through classification.
  points:
    - "The **Digital Omnibus on AI** — provisional agreement **7 May 2026**, in force **27 July 2026** — deferred **Annex III** high-risk obligations from **2 August 2026 to 2 December 2027**, a sixteen-month extension."
    - "**Annex III does not list customs, trade or export compliance.** A classification or screening tool is high-risk only if it falls within a listed area or within **Article 6(1)** as a safety component of a product covered by Union harmonisation legislation."
    - "Deferral is not repeal: **Article 14** oversight design and **Article 26** deployer duties still apply on the deferred date, and **Article 26(6)** will require deployers to retain system logs for **at least six months**."
    - "The practical trigger arrives earlier through commercial channels — EU customers subject to the Act pass its evidentiary requirements down to suppliers through contract, ahead of any statutory deadline."

date: "2026-08-07"
reviewed: "2026-08-07"

sources:
  - id: "eu-ai-act-2024-1689"
    title: "Regulation (EU) 2024/1689 laying down harmonised rules on artificial intelligence (AI Act)"
    authority: "eu"
    url: "https://eur-lex.europa.eu/eli/reg/2024/1689/oj"
    anchor: "Art. 6(1)–(2) (classification rules: safety component of a product covered by Union harmonisation legislation listed in Annex I, or a system referred to in Annex III); Annex III (the eight listed high-risk areas, which do not include customs, trade or export compliance); Art. 12(1) (automatic event logging); Art. 14(1) and 14(4)(b) (effective oversight by natural persons; automation bias); Art. 26(1)–(2) and 26(6) (deployer duties, assignment of oversight to competent natural persons, and log retention of at least six months)"
    retrieved: "2026-08-07"
  - id: "eu-digital-omnibus-ai-2026"
    title: "Digital Omnibus on AI — amendment to Regulation (EU) 2024/1689 deferring Annex III high-risk obligations"
    authority: "eu"
    url: "https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai"
    anchor: "Deferral of the application date for Annex III (use-case) high-risk obligations from 2 August 2026 to 2 December 2027 — provisional political agreement between Council, Parliament and Commission on 7 May 2026; entry into force 27 July 2026. Prohibitions and general-purpose model obligations already in application are unaffected"
    retrieved: "2026-08-07"
  - id: "ucc-952-2013"
    title: "Regulation (EU) No 952/2013 laying down the Union Customs Code"
    authority: "eu"
    url: "https://eur-lex.europa.eu/eli/reg/2013/952/oj"
    anchor: "Art. 15(2) (the person lodging a declaration is responsible for the accuracy and completeness of the information given) — the obligation that continues to govern trade-compliance output irrespective of AI Act classification"
    retrieved: "2026-08-07"
reviewer: "Sreenath Govindarajan"

boundary: [cha, classification]

image: "assets/cover.png"
tags: [eu ai act, digital omnibus, high risk ai, change watch, compliance]
---

# What Changed on 27 July 2026

The European Union deferred the part of the AI Act most enterprises had been preparing for. By
the **Digital Omnibus on AI** — provisionally agreed between the Council, Parliament and
Commission on **7 May 2026** and in force from **27 July 2026** — the obligations attaching to
**Annex III** high-risk AI systems moved from **2 August 2026** to **2 December 2027**, a
sixteen-month deferral.

Two things follow immediately for anyone running or buying trade-compliance software. First,
**a great deal of published guidance is now wrong**: material written before May 2026 states an
August 2026 deadline, and much of it has not been revised. Second, and less comfortably, *the
deferral does not reduce the eventual obligations at all — it moves them, and it moves them into
a period when most procurement cycles will already have committed to an architecture.*

The more useful question, which the deadline noise has obscured, is whether the Annex III regime
was ever the operative one for trade compliance in the first place. For most systems in this
domain, it was not.

## Most Trade-Compliance Systems Are Not Annex III

The classification test is narrower than the market's anxiety suggests. Under **Article 6**, a
system is high-risk on one of two routes: it is a **safety component of a product** covered by
Union harmonisation legislation listed in Annex I, or it is a system **referred to in Annex III**.
Annex III enumerates specific areas — biometrics, critical infrastructure, education, employment,
essential private and public services, law enforcement, migration and border control, and the
administration of justice and democratic processes.

**Customs, trade documentation and export compliance are not among them.** A system that
classifies goods, reconciles shipping documents, screens counterparties against sanctions lists
or prepares declarations does not become high-risk merely because the stakes are commercial and
the domain is regulated.

*The border-control entry deserves care rather than assumption:* it is directed at systems used by
public authorities in migration, asylum and border management, not at commercial software used by
a trader to prepare its own declarations. Firms should nonetheless run the test on their actual
deployment rather than on the category, because a system reused in an authority-facing context is
a different question from the same system used in-house.

## What Applies Regardless of Classification

Three obligations reach trade-compliance systems whether or not Annex III does, and they arrive
by different routes.

**The first is contractual, and it is already here.** European customers subject to the Act are
building its evidentiary expectations into supplier requirements — traceable output, identified
human oversight, retained logs — and they are doing so ahead of statutory deadlines because their
own conformity work runs on a longer horizon. *For an Indian exporter selling into the EU, the AI
Act arrives as a customer questionnaire long before it arrives as law.*

**The second is the deployer duty set, when the deferred date comes.** Under **Article 26**,
deployers must use the system per its instructions and assign human oversight to natural persons
with the necessary competence, training and authority; under **Article 26(6)** they must retain
the logs the system generates for at least six months. Under **Article 12(1)**, high-risk systems
must technically allow that logging in the first place — a design property a buyer cannot retrofit.

**The third is not AI law at all.** **Article 15(2) of the Union Customs Code** makes the person
lodging a declaration responsible for its accuracy and completeness, with no knowledge
requirement and no automation exception. *That provision has been in force throughout, applies to
every declaration regardless of how it was prepared, and is the obligation that actually decides
what happens when an automated determination is wrong.*

### The Dates, for the Record

**1 August 2024** — Regulation (EU) 2024/1689 enters into force. **2 February 2025** —
prohibitions and AI-literacy obligations apply. **2 August 2025** — obligations for
general-purpose AI models apply. **2 August 2026** — the original application date for Annex III
high-risk obligations. **7 May 2026** — provisional agreement on the Digital Omnibus on AI.
**27 July 2026** — the Omnibus enters into force. **2 December 2027** — the deferred application
date for Annex III high-risk obligations. Obligations already in application, including the
prohibitions, were not deferred. *Any compliance calendar still carrying 2 August 2026 as the
high-risk date needs correcting; any that treats the deferral as cancellation needs correcting
more urgently.*

## What to Do With Sixteen Months

The deferral is best used as procurement time rather than as relief, because the properties the
Act will eventually require are the same properties that make a system defensible under customs
law today. A system that logs its events, cites its rule at the version in force, records who
reviewed what, and exports that record in a readable form satisfies **Article 12**, evidences
**Article 26(2)**, and — quite separately — survives a post-clearance audit. *A system lacking
those properties fails both tests, and cannot be brought into compliance by policy after the
fact.*

The practical instruction is therefore to buy against the audit rather than against the deadline.
Ask what the record shows, not when the rule bites. [TradeWatch](/publications/four-state-readiness/)
is built to that standard already — determinations carrying their governing instrument at the
version in force, unresolved evidence surfaced rather than defaulted, and a named
[reviewer-of-record](/publications/reviewer-of-record/) on every packet, which is what
[evaluating any vendor](/publications/evaluating-ai-trade-compliance-vendor/) should test for.
Kanan Labs prepares a readiness packet. It does not file Shipping Bills and holds no customs
credentials — your licensed CHA files. Final HS classification requires human review.
