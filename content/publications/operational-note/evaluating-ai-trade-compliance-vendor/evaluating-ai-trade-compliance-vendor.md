---
title: "Nine Questions to Ask an AI Trade-Compliance Vendor"
slug: "evaluating-ai-trade-compliance-vendor"
description: "Demos test fluency, not defensibility. Nine questions on citations, abstention, logs and liability that separate an evidence system from a fast drafter."
author: "Sreenath Govindarajan"

type: "operational-note"
cluster: "ai-trade-compliance"
entities: [vendor-evaluation, eu-ai-act, article-12, article-26, abstention, citation, override-log, tradewatch, cha]

takeaways:
  summary: >-
    A demonstration shows whether a system produces plausible output. It does not show whether
    that output survives a query from customs or an audit three years later. Nine questions test
    the second property: whether every determination carries its rule, whether the system can
    decline to answer, and whether the record outlives the vendor.
  points:
    - "Ask for a **citation to a sub-document level** — clause, paragraph or section. *'Per CBIC Circular 05/2018'* is not verifiable; **'Circular 05/2018-Customs, para 3(b)'** is."
    - "Ask what the system does when evidence is missing. A system that always answers cannot signal doubt — **abstention is a feature**, and the **EU AI Act Article 14(4)(b)** treats over-reliance on output as a risk oversight must counter."
    - "Ask whether **logs are exportable in a readable form**. **Article 26(6)** obliges deployers to retain logs for **at least six months**, and customs retention periods run considerably longer."
    - "Ask who is named on the output. If no natural person is identified, **Article 26(2)** — oversight by persons with competence, training and authority — cannot be evidenced from the file."

date: "2026-08-07"
reviewed: "2026-08-07"

sources:
  - id: "eu-ai-act-2024-1689"
    title: "Regulation (EU) 2024/1689 laying down harmonised rules on artificial intelligence (AI Act)"
    authority: "eu"
    url: "https://eur-lex.europa.eu/eli/reg/2024/1689/oj"
    anchor: "Art. 12(1) (automatic recording of events over the system lifetime); Art. 14(4)(b) (oversight must enable awareness of the tendency to over-rely on output — automation bias); Art. 26(2) (deployer to assign human oversight to natural persons with the necessary competence, training and authority); Art. 26(6) (deployer log retention of at least six months unless otherwise provided)"
    retrieved: "2026-08-07"
  - id: "gartner-autonomous-agents-2025"
    title: "Gartner Survey Finds Just 15% of IT Application Leaders Are Considering, Piloting, or Deploying Fully Autonomous AI Agents (30 September 2025)"
    authority: "other"
    url: "https://www.gartner.com/en/newsroom/press-releases/2025-09-30-gartner-survey-finds-just-15-percent-of-it-application-leaders-are-considering-piloting-or-deploying-fully-autonomous-ai-agents"
    anchor: "Survey of 360 IT application leaders, May–June 2025: only 19% reported high or complete trust in their vendor's ability to provide adequate hallucination protection; only 13% strongly agreed they had the right governance structures in place to manage AI agents"
    retrieved: "2026-08-07"
  - id: "ucc-952-2013"
    title: "Regulation (EU) No 952/2013 laying down the Union Customs Code"
    authority: "eu"
    url: "https://eur-lex.europa.eu/eli/reg/2013/952/oj"
    anchor: "Art. 15(2) (the person lodging the declaration is responsible for the accuracy and completeness of the information given) — the provision that determines where vendor error lands"
    retrieved: "2026-08-07"
reviewer: "Sreenath Govindarajan"

boundary: [cha, classification]

image: "assets/cover.png"
tags: [vendor evaluation, procurement, ai governance, due diligence, trade compliance]
---

# Buying for the Query, Not the Demonstration

Most evaluations of trade-compliance software test the wrong property. A demonstration shows how
the system behaves on a clean shipment with complete documents, which is the case that was never
difficult. **The case that matters is the one where a document is missing, a field disagrees with
another field, or a customs officer asks why a determination was made — and the answer has to be
produced from the record months later.**

The gap is measurable in the market's own confidence. In Gartner's survey of 360 IT application
leaders, only **19%** reported high or complete trust in their vendor's ability to provide
adequate hallucination protection, and only **13%** strongly agreed they had the right governance
structures in place. *Buyers are not short of enthusiasm; they are short of evidence that the
systems behave well when they are wrong.*

These nine questions test for that. None require technical depth to ask, and each has a wrong
answer that is easy to recognise.

## Questions 1–3: Can the Output Be Traced?

**A determination that cannot be traced to a rule is an opinion, however well formatted.** The
first three questions establish whether the system produces evidence or merely output.

**1. Show me a determination with its citation — how specific does it get?** The test is
sub-document granularity. *"Per CBIC Circular 05/2018"* identifies a document; it does not let
anyone verify the reasoning. **"Circular 05/2018-Customs, para 3(b)"** points at the operative
words. A vendor whose citations stop at document level is asking the buyer to trust a summary.

**2. Which version of the rule was applied, and does the system record that?** Trade rules change
mid-quarter. A system that silently applies today's rule to last year's shipment will produce
determinations that look wrong on audit even where the original decision was correct. *The
version, not just the rule, is the citable fact.*

**3. Can I see the source document the field came from?** Extraction that cannot point back at
the page and position it came from is unverifiable, and unverifiable extraction is where quiet
errors live.

## Questions 4–6: What Happens When the System Does Not Know?

**A compliance system's honesty is measured by what it does with missing evidence, not by what it
does with complete evidence.** This is the cluster of questions vendors are least prepared for.

**4. What does the system output when a required document is absent?** There are only two
possible designs. Either the absence produces an explicit unresolved state, or it produces a
determination anyway — and a determination produced from missing evidence is a guess with
formatting. *The safe default is that missing input can never silently resolve to a pass*, which
is the discipline behind [four-state readiness](/publications/four-state-readiness/).

**5. Can the system decline to answer, and how often does it?** Ask for the actual abstention
rate on real files. A system that answers everything has no mechanism to signal doubt, and
**Article 14(4)(b) of the EU AI Act** identifies exactly this risk — the tendency to over-rely on
output — as something oversight design must counter. A vendor who treats abstention as a defect
has not understood the regulated context.

**6. What is the difference between low confidence and unresolved?** These are not the same
thing. Low confidence is the system's assessment of its own answer; unresolved is the absence of
the evidence needed to have one. *Systems that collapse the two lose the distinction that matters
to an auditor.*

### Question 7: Does the Record Outlive the Relationship?

**Ask whether logs and determinations are exportable, in a readable format, without the vendor.**
This question is about durability, and it has a regulatory floor and a commercial reality that
point the same way.

The floor: **Article 26(6) of the EU AI Act** requires deployers of high-risk systems to retain
the logs the system generates for a period appropriate to the purpose and **at least six months**.
The reality: customs and tax retention obligations run considerably longer than six months, an
audit may arrive years after the shipment, and *a record held only inside a vendor platform is a
record contingent on that vendor's continued existence and the buyer's continued subscription.*
Export capability is not a convenience feature; it is what makes the file survivable.

## Questions 8–9: Where Does the Liability Actually Land?

**8. Who is named on the output?** If the determination carries no identified reviewer, the file
cannot evidence what **Article 26(2)** requires — oversight assigned to natural persons with the
necessary competence, training and authority. "The system checked it" answers nothing; "the
platform is certified" answers nothing either. *A named person, with a timestamp, is the only
artefact that satisfies the question.*

**9. What does the contract say happens when the system is wrong?** Read this against the law
rather than against the warranty. **Article 15(2) of the Union Customs Code** makes the person
lodging responsible for the accuracy and completeness of the declaration, with no knowledge
requirement. Whatever indemnity a vendor offers is a private commercial matter between two
parties; *it does not travel to the customs authority, and it does not answer the demand.* A
vendor whose answer to question 9 is expansive and whose answer to questions 1 through 8 is thin
has inverted the priorities — indemnities compensate after a failure, evidence prevents one.

## The Pattern in the Answers

Taken together the nine questions separate two architectures that look identical in a
demonstration. **One produces plausible documents quickly. The other produces determinations that
carry their rule, name their gaps, identify their reviewer, and survive being examined by someone
adversarial.** Only the second is worth deploying into a workflow where a regulator can ask
questions.

[TradeWatch](/publications/validated-at-source-vs-inferred/) is built to answer all nine
affirmatively — citations to clause level at the version in force, unresolved states that never
default to a pass, exportable records, and a named
[reviewer-of-record](/publications/reviewer-of-record/) on every packet. Kanan Labs prepares a
readiness packet. It does not file Shipping Bills and holds no customs credentials — your licensed
CHA files. Final HS classification requires human review.
