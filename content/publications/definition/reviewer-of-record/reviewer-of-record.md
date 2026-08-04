---
title: "Reviewer-of-record"
slug: "reviewer-of-record"
description: "The reviewer-of-record is the named human who examines and signs every evidence packet — identity, timestamp, override log and hash — before it is relied on."
author: "Sreenath Govindarajan"

type: "definition"
cluster: "trade-architecture"
entities: [reviewer-of-record, evidence-packet, four-state-readiness, tradewatch, sign-off-hash, override-log]

takeaways:
  summary: >-
    The reviewer-of-record is the named human professional who examines an evidence packet and
    signs it before anyone relies on it. The signature is structural: the packet carries the
    reviewer's identity, timestamp, a log of every override made, and a sign-off hash — so
    accountability for machine-assisted work lands on a person, permanently and inspectably.
  points:
    - "Every packet bears four artefacts of review: the reviewer's **identity**, the **timestamp** of sign-off, the **override log** recording every machine verdict the reviewer changed and why, and a **sign-off hash** sealing what was signed."
    - "The role reverses the automation default: machines **prepare and cite**; the reviewer-of-record **decides and signs** — no packet reaches a CHA, broker or finance team unsigned."
    - "The **override log** is the honesty mechanism: human corrections are first-class records, not silent edits, so disagreement between reviewer and machine is visible and auditable."
    - "The role is packet-wide, not sample-based: every **Shipping Bill Readiness Packet** and every **Marine Cargo Insurance Broker Packet** carries exactly one reviewer-of-record before either is relied upon — never zero, never a delegated fraction."

date: "2026-07-22"
reviewed: "2026-07-22"

reviewer: "Sreenath Govindarajan"

boundary: [cha]

image: "assets/cover.png"
tags: [reviewer-of-record, definitions, accountability, evidence]
---

# What Reviewer-of-record Means

The reviewer-of-record is the named human professional who examines an evidence packet and
signs it before anyone acts on it. The term borrows its weight from older professions:
buildings have an engineer of record, lawsuits an attorney of record — "of record" meaning the
identifiable person who answers for the work. TradeWatch imports that semantics into trade
evidence: however much machinery prepared a packet — extraction, reconciliation, rule
evaluation — the packet becomes usable only when a person has reviewed it and put their name
on it, and the packet itself records who, when, and what they changed.

## The Four Artefacts of a Signature

A reviewer-of-record's sign-off is not a checkbox; it deposits four artefacts into the packet.
The **identity** of the reviewer — a name, not a system account. The **timestamp** of the
sign-off, fixing what the reviewer could have known when. The **override log** — every machine
verdict the reviewer altered, with the alteration and its reason recorded as data, not as a
silent edit. And the **sign-off hash** — a cryptographic seal over the packet as signed, so
that what was reviewed and what was later relied on are provably the same document. Together
they answer the questions an auditor, a counterparty or a court asks of any assisted judgment:
*who decided, on what basis, and is this the thing they saw?*

## Why the Role Exists

The reviewer-of-record exists because unaccountable automation fails in a specific, predictable
way: when machine output is wrong, responsibility evaporates — the vendor points at the model,
the user points at the tool, and the error has no owner. In regulatory work that structure is
disqualifying, because filings, claims and audits all presuppose an answerable party. The
role reinstates one, without pretending the machine away. The division is clean: **machines
prepare** — extract fields, run reconciliations, apply
[four-state verdicts](/publications/four-state-readiness/) with citations — and the **reviewer
decides**, confirming, overriding or escalating, with the override log keeping the
disagreement honest in both directions. A reviewer who rubber-stamps leaves a visible trail of
zero overrides against imperfect inputs; a machine that errs leaves the correction on the
record.

The role also answers a quieter question: what makes machine-assisted evidence *trustworthy
enough to file from*? Not accuracy claims — those are assertions. The answer is structure: a
named professional with something to lose, a sealed record of what they approved, and the
ability of any reader to inspect the chain. Trust here is not a feeling; it is an
architecture.

## What the Term Does Not Mean

Two boundaries keep the definition honest. The reviewer-of-record is **not the licensed
actor**: in TradeWatch's workflows the reviewer signs the *evidence packet*, and the licensed
professionals — the Customs House Agent who files, the IRDAI-licensed broker who places —
perform their own regulated acts on their own authority. The signature vouches for the
evidence, not for the filing. And the reviewer-of-record is **not a quality-control sample**:
the role attaches to every packet, not to an audited fraction — a packet without a signature
is, by definition, not finished. The term is written lowercase and hyphenated —
reviewer-of-record — because it names a standing role in the architecture, not a job title on
a business card.
