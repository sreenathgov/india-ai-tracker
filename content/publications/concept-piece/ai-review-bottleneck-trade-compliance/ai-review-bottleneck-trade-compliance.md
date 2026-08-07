---
title: "The Review Bottleneck: Machine Speed, Human Sign-Off"
slug: "ai-review-bottleneck-trade-compliance"
description: "AI generates compliance work faster than people can review it. Banking and medical-device regulators met that problem first, by pre-agreeing the envelope."
author: "Sreenath Govindarajan"

type: "concept-piece"
cluster: "ai-trade-compliance"
entities: [human-oversight, effective-challenge, sr-26-2, predetermined-change-control-plan, eu-ai-act, article-14, automation-bias, tradewatch, reviewer-of-record]

takeaways:
  summary: >-
    Automated preparation raises output faster than it raises review capacity, and review is where
    accountability lives. Financial and medical-device regulators met this problem first and
    answered it the same way: define in advance what may proceed within an agreed envelope, and
    reserve scarce human attention for what falls outside it.
  points:
    - "Banking supervisors call the required scrutiny **effective challenge** — *critical analysis by objective, informed parties who can identify model limitations and assumptions and produce appropriate changes* — a standard of engagement, not of approval throughput."
    - "The Federal Reserve, OCC and FDIC issued revised model-risk guidance as **SR 26-2 in April 2026**, replacing **SR 11-7 (2011)** — guidance citing only SR 11-7 is now out of date."
    - "The FDA's **final guidance of 4 December 2024** on **Predetermined Change Control Plans** lets pre-authorised modifications to AI-enabled device software proceed without a new marketing submission — review moved upstream to the envelope."
    - "**Article 14(4)(b) of the EU AI Act** requires oversight design to counter **automation bias**, which is the failure mode a saturated reviewer exhibits — approval rates rise while scrutiny falls, and the file looks identical either way."

date: "2026-08-07"
reviewed: "2026-08-07"

sources:
  - id: "fed-sr-26-2"
    title: "Interagency Supervisory Guidance on Model Risk Management (SR 26-2, April 2026), replacing SR 11-7 (2011)"
    authority: "us"
    url: "https://www.federalreserve.gov/supervisionreg/srletters/sr1107.htm"
    anchor: "The 'effective challenge' standard — critical analysis by objective, informed parties who can identify model limitations and assumptions and produce appropriate changes — together with the model lifecycle, validation and governance framework; note the April 2026 interagency revision issued as SR 26-2 replacing the 2011 guidance"
    retrieved: "2026-08-07"
  - id: "fda-pccp-2024"
    title: "FDA — Marketing Submission Recommendations for a Predetermined Change Control Plan for Artificial Intelligence-Enabled Device Software Functions (final guidance, 4 December 2024)"
    authority: "us"
    url: "https://www.fda.gov/regulatory-information/search-fda-guidance-documents/marketing-submission-recommendations-predetermined-change-control-plan-artificial-intelligence"
    anchor: "Scope and mechanism of a PCCP — modifications to AI-enabled device software functions pre-authorised in the initial marketing submission may be implemented without a new marketing submission, provided they fall within the described modifications, modification protocol and impact assessment"
    retrieved: "2026-08-07"
  - id: "eu-ai-act-2024-1689"
    title: "Regulation (EU) 2024/1689 laying down harmonised rules on artificial intelligence (AI Act)"
    authority: "eu"
    url: "https://eur-lex.europa.eu/eli/reg/2024/1689/oj"
    anchor: "Art. 14(1) (effective oversight by natural persons during use); Art. 14(4)(b) (oversight must enable awareness of the tendency to automatically rely or over-rely on output — automation bias — particularly where the system provides information or recommendations for decisions taken by natural persons)"
    retrieved: "2026-08-07"
reviewer: "Sreenath Govindarajan"

boundary: [cha]

image: "assets/cover.png"
tags: [human oversight, model risk, automation bias, governance, ai review]
---

# The Constraint Nobody Budgets For

Automation programmes in compliance are costed on the assumption that the expensive resource is
preparation. It is not. **Preparation is what automation makes cheap; review is what it makes
scarce** — and review is where accountability actually lives, because the signature is what a
regulator examines.

The arithmetic is unforgiving and rarely modelled. A system that raises document throughput
several times over does not raise the number of hours a qualified reviewer can spend reading
carefully. Those hours are fixed by human cognition and by headcount, and neither scales with the
model. What changes is the ratio: the same person now sits in front of many more determinations,
each arriving more polished and more plausible than the last. *Polish is the aggravating factor,
not the mitigating one — output that reads confidently is harder to interrogate than output that
reads roughly.*

The failure this produces is not visible in the file. A reviewer who is genuinely examining and a
reviewer who has become a click-through produce the same artefact: an approved determination with
a name on it. **The signature does not record how long the eyes stayed on the page.** Which means
an organisation can lose its oversight function entirely while every metric on the dashboard
improves.

## Regulators Have Named This Problem Precisely

Trade is not the first domain to hit this wall, and the sectors that hit it earlier described it
in language worth borrowing. Banking supervision has required, since the 2011 model-risk guidance
and continuing under its successor, a standard called **effective challenge** — defined as
*"critical analysis by objective, informed parties who can identify model limitations and
assumptions and produce appropriate changes."*

The definition repays close reading, because every element of it is a constraint on volume.
*Critical analysis* is not confirmation. *Objective* excludes the person who built or depends on
the model. *Informed* requires the reviewer to understand the model well enough to find its
limits. *Produce appropriate changes* means the challenge has to actually alter outcomes
sometimes, or it was not challenge. **A review function that approves everything fails this
standard by definition, regardless of whether the approvals were correct.**

Currency matters here for anyone citing the framework: the Federal Reserve, OCC and FDIC issued
**revised interagency model-risk guidance as SR 26-2 in April 2026**, replacing the 2011 guidance
after more than a decade of change in modelling practice. *Governance documents and vendor
materials still referencing only SR 11-7 are describing a superseded instrument.*

The European Union codifies the same concern for AI systems specifically. **Article 14(4)(b) of
the AI Act** requires oversight to enable the responsible person to remain aware of the tendency
to over-rely on system output — **automation bias** — and flags the risk *particularly* where the
system produces information or recommendations for human decisions. That is a regulator
describing the saturated reviewer, and requiring the system's design to work against the
condition rather than assume it away.

## The Answer Other Sectors Reached: Move Review Upstream

The solution that has emerged across regulated industries is not more reviewers. It is a change
in **what** gets reviewed: instead of examining every output, the regulator and the operator
agree in advance on an **envelope** of behaviour that may proceed without individual review, and
reserve human attention for what falls outside it.

The clearest expression is the FDA's **final guidance of 4 December 2024** on **Predetermined
Change Control Plans** for AI-enabled device software functions. A manufacturer specifies, in the
original marketing submission, which modifications it anticipates, the protocol by which they
will be made and validated, and an assessment of their impact. Modifications falling within that
pre-authorised plan may then be implemented **without a new marketing submission**. *The review
did not disappear; it moved to the boundary and happened once, at high intensity, instead of
repeatedly at low intensity.*

That inversion is the transferable idea. Reviewing each output is the intuitive design and it
scales worst. Reviewing the *envelope* — what the system may conclude on its own, on what
evidence, and what it must escalate — scales, and it concentrates scarce expert attention where
judgement is genuinely required.

### What an Envelope Looks Like in Trade Documentation

Translated to shipment work, the envelope is a set of standing decisions taken deliberately
rather than by drift. **Which determinations may stand on machine preparation alone?** Typically
the mechanical ones: a field-level reconciliation where two documents agree exactly, a deadline
computed from a date on the face of a transport document, a rate lookup where one instrument is
unambiguously in force.

**Which must always escalate?** The ones where the law itself allocates judgement — a
classification that is not a repeat of an established position, a first shipment on a new lane, a
determination resting on a document that is absent or internally inconsistent, anything where the
governing instrument changed inside the shipment window.

**And what must the escalation carry?** This is where preparation quality converts directly into
review capacity. *A reviewer given a determination plus its rule, its source documents, its
reconciliation and an explicit list of what could not be resolved can exercise real judgement in
minutes. The same reviewer given a confident answer and a folder of PDFs cannot exercise judgement
at all, only trust.* Escalation volume is a design variable; escalation quality is what decides
whether the human hours spent are worth anything.

## The Honest Position

An organisation deploying automated preparation into trade compliance should size its review
capacity before its throughput, and should treat a falling override rate as a warning rather than
a success metric. **The question to put to any programme is not how much it produced, but what
proportion of its output received genuine effective challenge — and whether the answer is
knowable from the record at all.**

[TradeWatch](/publications/four-state-readiness/) is built for that arithmetic: preparation runs
at machine depth, unresolved evidence is surfaced explicitly rather than resolved away, and what
reaches the [reviewer-of-record](/publications/reviewer-of-record/) arrives already cited and
already reconciled, so the scarce resource is spent on judgement rather than on assembly. Kanan
Labs prepares a readiness packet. It does not file Shipping Bills and holds no customs credentials
— your licensed CHA files.
