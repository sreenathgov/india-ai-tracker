---
title: "What AI Can and Cannot Decide in Trade Compliance"
slug: "ai-trade-compliance-decision-limits"
description: "AI reads and drafts in trade compliance; it cannot hold the licence or the liability. CBLR 2018 and the EU AI Act both put a named human at the decision."
author: "Sreenath Govindarajan"

type: "concept-piece"
cluster: "ai-trade-compliance"
entities: [cblr-2018, customs-act-1962, section-114aa, eu-ai-act, article-14, union-customs-code, article-15, human-oversight, tradewatch, cha]

takeaways:
  summary: >-
    Artificial intelligence can read, extract, reconcile and draft across trade documentation. It
    cannot hold a customs broker's licence, and it cannot carry the statutory liability that
    attaches to a declaration. Both Indian and European law place a named human at the point of
    decision, and neither treats that placement as optional.
  points:
    - "**Regulation 10(e), CBLR 2018** requires the customs broker personally to **exercise due diligence to ascertain the correctness** of information imparted to a client — a duty attaching to a licensed person, not to a tool."
    - "**Article 15(2) of the Union Customs Code** makes the person lodging a declaration responsible for the **accuracy and completeness of the information** in it, with **no mental-state requirement** — liability follows the act of lodging."
    - "**Article 14(1) of the EU AI Act** (Regulation (EU) 2024/1689) requires high-risk systems to be **effectively overseen by natural persons** while in use, and names **automation bias** as a risk oversight must counter."
    - "**Section 114AA, Customs Act 1962** penalises one who **knowingly or intentionally** makes or uses a materially false declaration — a mental state only a person can hold, which is why the machine cannot be the respondent."

date: "2026-08-07"
reviewed: "2026-08-07"

sources:
  - id: "cblr-2018"
    title: "Customs Brokers Licensing Regulations, 2018 (Notification No. 41/2018-Customs (N.T.), 14.05.2018, G.S.R. 451(E))"
    authority: "cbic"
    url: "https://taxinformation.cbic.gov.in/content/html/tax_repository/customs/regulations/customs_brokers_licensing_regulations_2018/active/regulation10_v1.00.html"
    anchor: "Regulation 10 opening words ('A Customs Broker shall —') with clause 10(d) (duty to advise the client to comply, and to report non-compliance to the Deputy or Assistant Commissioner) and clause 10(e) (exercise due diligence to ascertain the correctness of information imparted to a client); Regulation 13 (broker responsible for all acts or omissions of his employees during their employment)"
    retrieved: "2026-08-07"
  - id: "customs-act-114aa"
    title: "Section 114AA, Customs Act, 1962 — penalty for use of false and incorrect material"
    authority: "india-statute"
    url: "https://www.indiacode.nic.in/handle/123456789/1362"
    anchor: "s.114AA operative words ('knowingly or intentionally makes, signs or uses, or causes to be made, signed or used, any declaration … false or incorrect in any material particular'), inserted by the Taxation Laws (Amendment) Act, 2006, s.27, w.e.f. 13.07.2006"
    retrieved: "2026-08-07"
  - id: "eu-ai-act-2024-1689"
    title: "Regulation (EU) 2024/1689 laying down harmonised rules on artificial intelligence (AI Act)"
    authority: "eu"
    url: "https://eur-lex.europa.eu/eli/reg/2024/1689/oj"
    anchor: "Art. 14(1) (high-risk AI systems designed so they can be effectively overseen by natural persons during the period in which they are in use); Art. 14(4)(b) (oversight must enable awareness of the possible tendency of automatically relying or over-relying on output — automation bias — in particular where the system provides information or recommendations for decisions taken by natural persons)"
    retrieved: "2026-08-07"
  - id: "ucc-952-2013"
    title: "Regulation (EU) No 952/2013 laying down the Union Customs Code"
    authority: "eu"
    url: "https://eur-lex.europa.eu/eli/reg/2013/952/oj"
    anchor: "Art. 15(2) (the person lodging a declaration, notification or application is responsible for the accuracy and completeness of the information given, the authenticity and validity of supporting documents, and compliance with obligations relating to the procedure) — responsibility allocated by the act of lodging, without a mental-state condition"
    retrieved: "2026-08-07"
reviewer: "Sreenath Govindarajan"

boundary: [cha, classification]

image: "assets/cover.png"
tags: [artificial intelligence, trade compliance, customs broker, liability, human oversight]
---

# The Question Businesses Are Actually Asking

The question put to vendors is *what can your AI do*. The question that decides whether a
deployment survives its first audit is narrower and better: **what is this system permitted to
decide, and who answers when it is wrong?** Those are not the same question, and the gap between
them is where most trade-compliance AI programmes fail — not because the technology
underperforms, but because the legal architecture around a cross-border declaration was never
built to receive a decision from an unlicensed party.

The honest answer has two halves that must be held together. Artificial intelligence is
genuinely good at the work that consumes most compliance hours: reading documents in inconsistent
formats, extracting fields, reconciling one document against another, tracking amendments across
gazettes, drafting, and flagging divergence. That is a large share of the labour and it is
compressible. What AI cannot do is take on the legal position of the party that signs — because
in both Indian and European law that position is defined by reference to a licensed or lodging
*person*, and it carries consequences that only a person can bear.

This distinction is often presented as caution. It is better understood as **jurisdiction**:
the boundary is drawn by statute, not by product philosophy, and it does not move when the model
improves.

## The Indian Position: A Licence Held by a Person

India assigns the customs broker's obligations to a natural or juridical person holding a
licence, and states them as personal duties rather than outcomes. Under **Regulation 10 of the
Customs Brokers Licensing Regulations, 2018**, notified by Notification 41/2018-Customs (N.T.),
the operative stem is unambiguous — *"A Customs Broker shall —"* — and among the seventeen
clauses that follow, two carry directly onto any question of machine assistance.

**Regulation 10(e)** requires the broker to *"exercise due diligence to ascertain the correctness
of any information which he imparts to a client"*. Diligence is a standard of conduct owed by the
person who owes it; software can supply the evidence on which diligence is exercised, but it
cannot be the party exercising it. **Regulation 10(d)** creates a duty to *advise* the client to
comply and, where the client does not, to report the matter to the Deputy or Assistant
Commissioner — a duty of judgement and escalation, not of output. *Notably, neither clause is a
duty to achieve compliance; both are duties to conduct oneself in a particular way,* which is
precisely the kind of obligation that cannot be discharged by a system that has no standing
before the authority.

The penalty provisions complete the picture. **Section 114AA of the Customs Act, 1962** reaches
a person who *"knowingly or intentionally makes, signs or uses, or causes to be made, signed or
used, any declaration … false or incorrect in any material particular."* The section is built on
a mental state. A model has no mental state to interrogate, which means it can never be the
respondent in a section 114AA proceeding — the proceeding will find the person who signed.

## The European Position: Liability Follows the Act of Lodging

The European Union reaches the same destination by a different route, and its route is stricter.
**Article 15(2) of the Union Customs Code** provides that the person lodging a customs
declaration, notification or application is responsible for the accuracy and completeness of the
information given in it, for the authenticity and validity of the supporting documents, and for
compliance with the obligations of the procedure. There is **no knowledge requirement and no
diligence defence on the face of the provision**: responsibility is allocated by the act of
lodging itself.

Read against a system that prepares declarations, the implication is direct. *An error introduced
by an automated step does not become a lesser error because it was automated* — it arrives at the
authority as the lodging party's error, in the lodging party's name. Whatever internal recourse
exists against a vendor is a commercial matter between two private parties; it does not travel to
the customs authority, and it does not answer the demand.

Europe then adds a second layer aimed at the system rather than the declaration. Under
**Article 14(1) of the AI Act**, Regulation (EU) 2024/1689, high-risk AI systems must be designed
so they can be *"effectively overseen by natural persons"* while in use. The Act goes further than
requiring a human in the room: **Article 14(4)(b)** requires that oversight enable the person to
remain aware of the tendency to over-rely on system output — **automation bias** — *specifically*
where the system produces information or recommendations for decisions taken by people. That is a
regulator naming the exact failure mode of rubber-stamped review, and requiring the design to
work against it.

### Where the Two Regimes Converge

Indian and European law arrive at a common structure from opposite starting points. India
attaches duties to a **licensed person** and conditions its heaviest penalty on a **mental
state**; the EU attaches strict responsibility to the **act of lodging** and separately regulates
the **oversight design** of the system itself. Neither framework contains a mechanism for
transferring the position to a non-person, and neither contemplates one. For a business operating
both lanes, the practical consequence is a single design rule that satisfies both: *the machine's
output must arrive at a named human in a form that makes real review possible, and the record must
show that review happened.* A system that cannot evidence its own oversight fails the European
test on design and leaves the Indian broker with nothing to show for diligence.

## What This Leaves for AI to Do — Which Is Most of the Work

Reading the limit as a ceiling on usefulness misreads where the cost sits. The expensive part of
trade compliance is rarely the final determination; it is the assembly, comparison and
maintenance work underneath it — checking that an invoice, packing list, transport document and
declaration agree; noticing that a rate changed last Tuesday; finding the clause that governs;
reconstructing a file months later for an auditor. That work is voluminous, repetitive, and
exactly what machines are good at.

The productive framing is therefore not *how much can be automated* but **how completely the
decision can be prepared**. A determination that arrives with the governing rule cited, the
supporting documents attached, the divergences flagged and the unresolved questions stated as
unresolved is a determination a licensed professional can make in minutes rather than hours — and
can defend three years later. A determination that arrives as a confident output with no
underlying record is faster to accept and impossible to defend, which is the worse trade in every
respect that matters.

This is the architecture [TradeWatch](/publications/four-state-readiness/) is built on: machines
prepare and cite, evidence is [validated-at-source rather than
inferred](/publications/validated-at-source-vs-inferred/), and a named
[reviewer-of-record](/publications/reviewer-of-record/) signs before anything is relied upon.
Kanan Labs prepares a readiness packet. It does not file Shipping Bills and holds no customs
credentials — your licensed CHA files. Final HS classification requires human review.
