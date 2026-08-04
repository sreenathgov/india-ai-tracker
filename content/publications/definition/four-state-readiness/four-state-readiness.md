---
title: "Four-state readiness"
slug: "four-state-readiness"
description: "Four-state readiness grades every checked field OPEN, BLOCKED, CONDITIONAL or UNCLEAR — a verdict system where missing evidence can never silently pass."
author: "Sreenath Govindarajan"

type: "definition"
cluster: "trade-architecture"
entities: [four-state-readiness, open, blocked, conditional, unclear, evidence-packet, tradewatch, reviewer-of-record]

takeaways:
  summary: >-
    Four-state readiness is TradeWatch's verdict system: every checked field on a shipment
    resolves to exactly one of OPEN, BLOCKED, CONDITIONAL or UNCLEAR. The fourth state is the
    architectural point — missing or ambiguous evidence is surfaced as UNCLEAR rather than
    defaulted to a pass, so silence can never impersonate compliance.
  points:
    - "Exactly one of four verdicts per checked field: **OPEN** (evidenced and unobstructed), **BLOCKED** (a rule or fact prevents proceeding), **CONDITIONAL** (open if a named condition is satisfied), **UNCLEAR** (the evidence to decide is missing or ambiguous)."
    - "**UNCLEAR is the safety state**: absent or unreadable inputs never default to OPEN — the system reports that it cannot know, which is a finding, not a failure."
    - "Every verdict carries its **citation** — the rule or document it rests on — and enters the evidence packet under a reviewer's signature, making each verdict traceable and contestable."
    - "The vocabulary is binary-free by design: real shipment questions rarely reduce to pass/fail, and **CONDITIONAL** captures the honest middle — permitted *if* — that binary systems flatten."

date: "2026-07-22"
reviewed: "2026-07-22"

reviewer: "Sreenath Govindarajan"

boundary: []

image: "assets/cover.png"
tags: [four-state readiness, definitions, verdicts, evidence]
---

# What Four-state readiness Means

Four-state readiness is the verdict system at the centre of TradeWatch's evidence packets:
every field the system checks on a shipment — an invoice number's agreement with a return, a
declaration's presence, a value's arithmetic, a deadline's status — resolves to **exactly one**
of four states: **OPEN**, **BLOCKED**, **CONDITIONAL** or **UNCLEAR**. The vocabulary is small
on purpose. A verdict a Customs House Agent, a broker, a finance controller and an auditor all
read the same way has to be smaller than the regulations it summarises — and honest about the
one thing summaries usually hide, which is what the checker *could not determine*.

## The Four States, Precisely

**OPEN** means the check passed on evidence: the field agrees with what the governing rule
requires, and the packet holds the documents proving it. **BLOCKED** means a rule or
established fact prevents proceeding as filed — the mismatch exists, the deadline has passed,
the required document is affirmatively absent — and the verdict names the obstruction.
**CONDITIONAL** means the field is open *if* a stated condition holds: the declaration is valid
if filed before the deadline still running; the value is correct if the stated Incoterm is the
contractual one. The condition is named, not implied. **UNCLEAR** means the evidence needed to
decide is missing, contradictory or unreadable — and this is the state that defines the system.

## Why UNCLEAR Is the Point

Most checking systems are secretly two-state, and their failure mode is the silent default:
what cannot be evaluated falls through to "no issue found," and absence of evidence exits the
pipeline dressed as compliance. Four-state readiness forbids that costume. **Missing input
never defaults to OPEN**; it surfaces as UNCLEAR, with the missing thing named. The practical
effect is that a readiness report's silence is abolished — every checked field says either
what is known, or that it is not known, and an UNCLEAR verdict is itself actionable
information: fetch the document, resolve the contradiction, re-run the check.

The fourth state also disciplines the checker. A system permitted to say "unclear" has no need
to guess, so its OPEN verdicts mean more — each one is a positive, evidenced finding rather
than the absence of an alarm. That is what makes the verdicts fit for the uses TradeWatch puts
them to: filed from by licensed professionals, relied on by finance teams, and standing behind
[a reviewer's signature](/publications/reviewer-of-record/) in an audit years later.

## Where the Verdicts Live

A four-state verdict never travels alone. In the evidence packet, each verdict binds to its
**citation** — the rule, clause or document line it rests on — and to the evidence examined,
so a reader can trace any verdict from conclusion back to source. Concretely: a BLOCKED on an
invoice-number field points at the exact mismatch and the rule that makes it fatal (the
[SB005 mechanics](/publications/sb005-igst-refund-blocked/) are a working example of the
category); a CONDITIONAL on a declaration names the clock still running; an UNCLEAR on a
weight names the two documents that disagree. The packet a reviewer signs is, in this sense,
a list of small, cited judgments — which is what makes it defensible where a score or a
green tick is not.
