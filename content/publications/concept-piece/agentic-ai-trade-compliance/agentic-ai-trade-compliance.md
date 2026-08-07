---
title: "Agentic AI in Trade Compliance: What the Word Actually Means"
slug: "agentic-ai-trade-compliance"
description: "Agentic means a system that acts, not one that answers. Gartner found just 15% of IT leaders pursuing fully autonomous agents — governance, not capability."
author: "Sreenath Govindarajan"

type: "concept-piece"
cluster: "ai-trade-compliance"
entities: [agentic-ai, autonomy, human-oversight, eu-ai-act, article-14, agent-sprawl, tradewatch, reviewer-of-record, cha]

takeaways:
  summary: >-
    An agentic system is one that pursues a goal by taking actions, not one that answers
    questions. In trade compliance that distinction is legal as well as technical, because an
    action against a customs or regulatory endpoint is attributable to a licensed person.
    Enterprises have noticed: adoption of agents is broad, adoption of autonomy is not.
  points:
    - "Gartner's survey of **360 IT application leaders** (May–June 2025) found **75% piloting or deploying some form of AI agent**, but only **15%** considering, piloting or deploying **fully autonomous agents** — defined as goal-driven tools that do not require human oversight."
    - "The barrier is governance, not capability: only **19%** reported high or complete trust in their vendor's hallucination protection, and only **13%** strongly agreed they had the right governance structures in place."
    - "**Article 14(1) of the EU AI Act** requires high-risk systems to be **effectively overseen by natural persons** while in use — an obligation that constrains how autonomous a compliance agent may lawfully be, independent of how capable it is."
    - "The useful design line is **prepare versus act**: assembling and citing touches no endpoint, while transmitting a declaration is an act **Article 15(2) of the Union Customs Code** attributes to the person lodging it."

date: "2026-08-07"
reviewed: "2026-08-07"

sources:
  - id: "gartner-autonomous-agents-2025"
    title: "Gartner Survey Finds Just 15% of IT Application Leaders Are Considering, Piloting, or Deploying Fully Autonomous AI Agents (30 September 2025)"
    authority: "other"
    url: "https://www.gartner.com/en/newsroom/press-releases/2025-09-30-gartner-survey-finds-just-15-percent-of-it-application-leaders-are-considering-piloting-or-deploying-fully-autonomous-ai-agents"
    anchor: "Survey of 360 IT application leaders at organisations with at least 250 employees across North America, Europe and Asia/Pacific, conducted May–June 2025: 15% pursuing fully autonomous agents ('goal driven AI tools that do not require human oversight') against 75% pursuing agents of some form; 19% high or complete trust in vendor hallucination protection; 74% viewing agents as a new attack vector; 13% strongly agreeing governance structures were in place; Max Goss quoted on governance, maturity and agent sprawl"
    retrieved: "2026-08-07"
  - id: "eu-ai-act-2024-1689"
    title: "Regulation (EU) 2024/1689 laying down harmonised rules on artificial intelligence (AI Act)"
    authority: "eu"
    url: "https://eur-lex.europa.eu/eli/reg/2024/1689/oj"
    anchor: "Art. 14(1) (high-risk AI systems designed so they can be effectively overseen by natural persons during the period in which they are in use); Art. 14(4)(b) (oversight must counter automation bias where the system provides information or recommendations for decisions taken by natural persons)"
    retrieved: "2026-08-07"
  - id: "ucc-952-2013"
    title: "Regulation (EU) No 952/2013 laying down the Union Customs Code"
    authority: "eu"
    url: "https://eur-lex.europa.eu/eli/reg/2013/952/oj"
    anchor: "Art. 15(2) (the person lodging a declaration is responsible for the accuracy and completeness of the information given, the authenticity of supporting documents, and compliance with the obligations of the procedure)"
    retrieved: "2026-08-07"
reviewer: "Sreenath Govindarajan"

boundary: [cha]

image: "assets/cover.png"
tags: [agentic ai, ai agents, trade compliance, autonomy, governance]
---

# The Word Is Doing Two Jobs

"Agentic" has become the word vendors reach for when "AI" stops impressing, and it has drifted
far enough from its technical meaning that buyers should insist on a definition before a
demonstration. Stripped of marketing, **an agentic system is one that pursues a goal by taking a
sequence of actions in the world, choosing those actions itself, rather than producing an answer
and stopping.** The difference from a conversational assistant is not intelligence. It is
*agency* — the system does things, and the things it does have consequences that persist after
the session ends.

In most enterprise contexts that distinction is a matter of engineering risk. In cross-border
trade it is also a matter of law, because the actions available to an agent in this domain —
transmitting a declaration, lodging a notification, submitting a claim document — are acts that
regulation attributes to a specific accountable party. *An agent that merely drafts has produced
a document; an agent that transmits has performed a regulated act in someone's name.*

The market has already discovered this, quietly. Enterprises are adopting agents broadly and
autonomy narrowly, and the gap between those two numbers is the most informative datum available
about where this technology actually stands.

## What the Adoption Data Shows

Enterprise appetite for agents is high; enterprise appetite for unsupervised agents is not.
Gartner's survey of **360 IT application leaders** at organisations of at least 250 employees
across North America, Europe and Asia/Pacific, conducted in **May and June 2025**, found that
**75%** were piloting, deploying, or had deployed some form of AI agent — while only **15%** were
considering, piloting or deploying **fully autonomous** agents, which Gartner defines precisely as
*"goal driven AI tools that do not require human oversight."*

The reasons given are not about model quality. Only **19%** of respondents reported high or
complete trust in their vendor's ability to provide adequate hallucination protection; **74%**
considered AI agents a new attack vector into the organisation; and only **13%** strongly agreed
that they had the right governance structures in place to manage them. Gartner's own summary
attributes the gap to *"concerns around governance, maturity and agent sprawl."*

*Read against a regulated workflow, that 60-point gap between agents and autonomous agents is not
timidity — it is an accurate assessment of where liability sits.* An organisation deploying an
agent into customer service is risking a bad interaction. An organisation deploying an agent into
customs filing is risking a penalty proceeding against a named person.

## The Legal Ceiling on Autonomy

Autonomy in trade compliance is capped by law before it is capped by capability, and the cap is
explicit in the European framework. **Article 14(1) of the EU AI Act** requires that high-risk AI
systems be designed and developed so that they can be *"effectively overseen by natural persons"*
during the period in which they are in use. This is a design obligation, not a deployment
preference: a system architecture that makes meaningful human oversight impractical is
non-conforming irrespective of how well it performs.

The Act then anticipates the specific way oversight degrades in practice. **Article 14(4)(b)**
requires that oversight enable the responsible person to remain aware of the tendency to rely or
over-rely on system output — **automation bias** — and it flags this risk *particularly* where
the system produces information or recommendations for decisions taken by people. *That is a
regulator describing the exact failure mode of an approval queue that has become a formality,
and requiring the design to work against it.*

Underneath sits the older allocation. **Article 15(2) of the Union Customs Code** makes the
person lodging a declaration responsible for its accuracy and completeness, without any
knowledge requirement. Combine the two and the ceiling is clear: an agent may prepare the
declaration to any level of sophistication, but the lodging remains an act with a named owner,
and that owner must have been in a position to actually exercise judgement.

### Prepare Versus Act: The Line Worth Designing Around

The workable distinction for a trade-compliance deployment is not autonomous versus supervised —
too coarse to build with — but **prepare versus act**. A preparing agent may read every document
in a shipment file, reconcile them against each other, locate the governing rule, compute
deadlines, draft the declaration, and present a complete determination with its evidence and its
open questions. None of that touches a regulated endpoint, and none of it is attributable to
anyone but the firm running it.

An acting agent transmits. It lodges, files, submits, or binds — and at that moment the output
stops being a document and becomes a legal act performed in the name of a licensed party.
*Everything upstream of transmission is a design choice; transmission itself is a jurisdictional
question.* Systems built with that boundary explicit tend to survive audits and vendor
due-diligence reviews. Systems that blur it tend to discover the boundary during an
investigation, which is the expensive way to learn it.

## What to Ask Before Buying "Agentic"

Three questions separate a considered architecture from a repositioned chatbot, and none require
technical depth to ask. **First: what actions can this system take without a human, and against
which endpoints?** A vendor unable to enumerate the action set has not bounded it. **Second: when
the agent is uncertain, what does it do?** Systems that always produce an answer are systems that
cannot signal doubt, and *a compliance system that never says "unresolved" is not confident, it is
uninstrumented* — the discipline behind
[four-state readiness](/publications/four-state-readiness/), where missing evidence resolves to
UNCLEAR rather than silently to a pass. **Third: what does the record show afterwards?** If the
agent's reasoning, sources and human interventions are not reconstructable months later, the
oversight the EU AI Act requires cannot be evidenced even where it occurred.

The honest position on agentic AI in trade compliance is neither dismissal nor enthusiasm. The
preparation layer is genuinely transformable and the gains there are large and immediate. The
action layer is bounded by statutes that were not written with software in mind and will not
bend to accommodate it. [TradeWatch](/publications/validated-at-source-vs-inferred/) is built on
that division: machine preparation at full depth, a
[reviewer-of-record](/publications/reviewer-of-record/) at the decision, and a record that shows
which was which. Kanan Labs prepares a readiness packet. It does not file Shipping Bills and
holds no customs credentials — your licensed CHA files.
