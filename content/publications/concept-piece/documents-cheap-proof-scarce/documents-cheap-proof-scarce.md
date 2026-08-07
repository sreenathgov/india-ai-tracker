---
title: "When Documents Get Cheap, Proof Becomes the Product"
slug: "documents-cheap-proof-scarce"
description: "Trade verification has always tested documents for plausibility. When plausible documents cost nothing to produce, plausibility stops carrying information."
author: "Sreenath Govindarajan"

type: "concept-piece"
cluster: "trade-architecture"
entities: [documentary-verification, provenance, union-customs-code, article-15, validated-at-source, evidence-packet, tradewatch, reviewer-of-record, cha]

takeaways:
  summary: >-
    Documentary trade rests on an assumption that producing a convincing document costs effort,
    so appearance carries information about legitimacy. Generative tools weaken that assumption.
    What survives is not the document but the chain behind it: where each fact originated, which
    rule was applied, and who attested to it.
  points:
    - "The verification model is inherited from paper: examiners test **internal consistency, arithmetic and appearance** under standards such as **UCP 600** and customs document checks, because a convincing forgery historically required skill, time and access."
    - "**Article 15(2) of the Union Customs Code** allocates responsibility for **accuracy and completeness** to the person lodging, with **no knowledge requirement** — a well-made false document supplied by a counterparty becomes the declarant's problem, not the counterparty's."
    - "**Section 114AA of the Customs Act, 1962** penalises **knowing or intentional** use of materially false particulars — so an honest trader's defence rests entirely on being able to show what was checked and when."
    - "The durable asset shifts from the artefact to its **provenance record**: the source each field came from, the governing instrument at the version in force, and a named reviewer — properties a generated document cannot manufacture."

date: "2026-08-07"
reviewed: "2026-08-07"

sources:
  - id: "ucc-952-2013"
    title: "Regulation (EU) No 952/2013 laying down the Union Customs Code"
    authority: "eu"
    url: "https://eur-lex.europa.eu/eli/reg/2013/952/oj"
    anchor: "Art. 15(2) (the person lodging a declaration, notification or application is responsible for the accuracy and completeness of the information given, the authenticity, accuracy and validity of any supporting document, and compliance with all obligations relating to the procedure) — strict allocation without a mental-state condition"
    retrieved: "2026-08-07"
  - id: "customs-act-114aa"
    title: "Section 114AA, Customs Act, 1962 — penalty for use of false and incorrect material"
    authority: "india-statute"
    url: "https://www.indiacode.nic.in/handle/123456789/1362"
    anchor: "s.114AA operative words ('knowingly or intentionally makes, signs or uses, or causes to be made, signed or used, any declaration … false or incorrect in any material particular'), inserted by the Taxation Laws (Amendment) Act, 2006, s.27, w.e.f. 13.07.2006 — the mental-state threshold that separates the honest trader from the culpable one"
    retrieved: "2026-08-07"
  - id: "cblr-2018"
    title: "Customs Brokers Licensing Regulations, 2018 (Notification No. 41/2018-Customs (N.T.), 14.05.2018)"
    authority: "cbic"
    url: "https://taxinformation.cbic.gov.in/content/html/tax_repository/customs/regulations/customs_brokers_licensing_regulations_2018/active/regulation10_v1.00.html"
    anchor: "Regulation 10(e) (exercise due diligence to ascertain the correctness of any information imparted to a client) and Regulation 10(n) (verification of the client's identity and functioning at the declared address using reliable, independent, authentic documents, data or information) — conduct standards provable only by contemporaneous record"
    retrieved: "2026-08-07"
reviewer: "Sreenath Govindarajan"

boundary: [cha, irdai]

image: "assets/cover.png"
tags: [documentary verification, provenance, trade fraud, evidence, trade architecture]
---

# An Assumption Trade Was Built On

Documentary trade rests on a proposition nobody states because it has been true for four hundred
years: **a convincing document is expensive to produce.** Printing, letterheads, stamps,
consistent typography, plausible commercial language, an understanding of what a real bill of
lading looks like — each was a barrier, and together they meant that a document which *looked*
right was probabilistically likely to *be* right. Verification practice was built on top of that
economics. Examiners check internal consistency, format, arithmetic and appearance, because
historically those were correlated with legitimacy.

Generative tools attack the correlation rather than the checks. When producing a
professional-looking commercial invoice, packing list or certificate becomes close to costless,
**appearance stops carrying information about legitimacy**. The checks still run and still catch
careless work; what they no longer do is separate the diligent from the fabricated, because the
fabricated is no longer careless.

*This is not primarily a fraud story, and framing it as one leads to the wrong response.* The
serious consequence falls on honest traders, whose defence has always rested implicitly on the
plausibility of the documents they were handed by counterparties.

## The Legal Position Is Unforgiving About Where Error Lands

Trade law does not distribute the cost of a convincing false document toward the party that made
it. It concentrates the cost on the party that lodged it.

**Article 15(2) of the Union Customs Code** makes the person lodging a declaration responsible
for the accuracy and completeness of the information given, for the authenticity, accuracy and
validity of any supporting document, and for compliance with the obligations of the procedure.
The provision carries **no knowledge requirement**. An importer who receives a well-made false
certificate from a supplier, believes it, and lodges on the strength of it has still lodged
inaccurate information — and the responsibility sits where the Regulation puts it.

India's structure differs in a way that makes the record even more important. **Section 114AA of
the Customs Act, 1962** reaches a person who **knowingly or intentionally** makes, signs or uses
a declaration false in any material particular. The mental-state threshold is genuine protection
for an honest trader — *but only a trader who can demonstrate the honesty.* And demonstration is
documentary: what was checked, against what, when, and by whom. **A trader with a complete record
of verification has a defence. A trader with the same good faith and no record has an assertion.**

The same logic reaches the intermediary. **Regulation 10(e) of CBLR 2018** requires a customs
broker to exercise due diligence to ascertain the correctness of information imparted to a client,
and **Regulation 10(n)** requires verification of the client's identity and functioning at the
declared address **using reliable, independent, authentic documents, data or information**. Both
are conduct standards. Conduct is proven contemporaneously or not at all.

## What Retains Value When Artefacts Do Not

If the document cannot be trusted on its face, the question becomes what can. The answer is
structural rather than technological: **the properties that survive are the ones a generated
artefact cannot manufacture, because they refer to events outside the artefact.**

**Origin.** Not what the document says, but where the datum entered the record — which system,
which party, at what point in the transaction. A fabricated invoice can assert any value; it
cannot retroactively insert itself into a purchase order raised months earlier, a payment
instruction, or a carrier's booking record.

**Grounding.** Which rule was applied, at the version in force on that date, and what it required.
This is checkable independently of the document and of whoever supplied it.

**Attestation.** A named person who examined the set and signed, at a recorded time, with a record
of what they changed. *Attribution has a cost that generation does not — the signer is exposed if
the signature is wrong, and that exposure is exactly what makes it informative.*

**Consistency across independent records.** A single document can be produced to order. A
consistent story across an invoice, a transport document, a bank instruction, a customs
declaration and a carrier's own manifest is a considerably harder thing to fabricate, because each
element is held by a different party with different incentives.

### The Response That Does Not Work

The intuitive response — better detection of generated documents — is worth doing and cannot be
the strategy. *Detection is an arms race between two systems of the same kind, and the defender
has to win continuously while the attacker needs to win once per shipment.* Any detection
technique that becomes standard becomes a training target.

The structural response is different in kind: **stop asking whether the document looks real, and
start asking whether the fact it asserts is corroborated by records that were not produced for
this purpose.** That reframing does not require winning a detection race, because it does not test
the artefact at all. It tests the chain.

## Where This Leads

The shift is already visible in the direction regulation is travelling. The newest documentary
regimes ask for the fact behind the certificate — the plot coordinates, the installation-level
emissions, the audited origin — rather than for the certificate itself. *Regulators are, in
effect, moving from artefact-verification to provenance-verification for their own reasons, and
the same move is what protects a trader against convincing counterparty documents.*

**The commercial implication is that the durable asset in trade compliance is no longer the file
of documents; it is the record of what was verified, against which rule, on what evidence, signed
by whom.** Documents will keep being produced, faster and more cheaply than ever. Proof will not,
and proof is what a customs authority, a bank, an insurer and an auditor are each actually asking
for.

This is why [TradeWatch](/publications/validated-at-source-vs-inferred/) builds from the
shipment's own documents rather than from external signals, why every check carries the
instrument that governs it, why unresolved evidence is
[recorded as unresolved](/publications/four-state-readiness/) rather than assumed away, and why a
named [reviewer-of-record](/publications/reviewer-of-record/) signs. Kanan Labs prepares a
readiness packet. It does not file Shipping Bills and holds no customs credentials — your licensed
CHA files. Kanan Labs prepares claim-admissible evidence. It does not advise on, select, or bind
insurance — your IRDAI-licensed broker does.
