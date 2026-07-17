---
title: "Open Cover vs Certificate of Insurance: Reconciling CIF+10%"
slug: "open-cover-coi-cif-plus-10"
description: "A Certificate of Insurance draws on the open cover only if declared, in time, at 110% of CIF. Under-insurance leaves the assured his own insurer for the gap."
author: "Sreenath Govindarajan"

type: "operational-note"
cluster: "marine-evidence"
entities: [open-cover, coi, cif, ucp-600, marine-insurance-act-1963, section-64vb, commercial-invoice, bill-of-lading, incoterms, floating-policy]

takeaways:
  summary: >-
    An open cover insures only what is declared into it, and a Certificate of Insurance is only
    as good as its declared value. UCP 600 Article 28(f)(ii) sets the floor at 110% of CIF;
    Section 81 of the Marine Insurance Act 1963 makes the under-insured assured his own insurer
    for the shortfall; Section 64VB governs attachment.
  points:
    - "**UCP 600 Art. 28(f)(ii)**: absent a stated requirement, insurance 'must be at least **110% of the CIF or CIP value** of the goods' — and where CIF cannot be determined from the documents, banks compute it from the higher of the drawing or the gross invoice value."
    - "**Marine Insurance Act 1963, s. 81**: an assured insured for less than the insurable value 'is deemed to be **his own insurer in respect of the uninsured balance**' — under-declaration converts every partial loss into a shared loss."
    - "A floating arrangement insures **declared shipments only**: s. 31 requires declarations in order of dispatch, covering all consignments within the cover's terms, honestly valued — an undeclared sailing has nothing to claim on."
    - "**Section 64VB, Insurance Act 1938** adds the premium clock: risk attaches not earlier than the date premium is paid, subject to the relaxations prescribed by rules — the COI's issue date is not the attachment analysis."

date: "2026-07-17"
reviewed: "2026-07-17"

sources:
  - id: "ucp-600-art-28"
    title: "ICC Uniform Customs and Practice for Documentary Credits, ICC Publication No. 600 (2007) — Article 28"
    authority: "icc"
    url: "https://cpeapp.icai.org/downloadBGM/65c1c211b0373.pdf"
    anchor: "Art. 28(f)(i) (a stated percentage is deemed the minimum cover required); Art. 28(f)(ii) (minimum 110% of CIF or CIP value; fallback to the greater of the drawing amount or gross invoice value)"
    retrieved: "2026-07-17"
  - id: "mia-1963"
    title: "The Marine Insurance Act, 1963"
    authority: "india-statute"
    url: "https://www.indiacode.nic.in/bitstream/123456789/1520/5/A1963-11.pdf"
    anchor: "s. 31 (floating policy: declarations by endorsement or customary manner, in order of dispatch, comprising all consignments, values honestly stated; late value declaration treated as unvalued); s. 81 (under-insurance: assured deemed his own insurer for the uninsured balance)"
    retrieved: "2026-07-17"
  - id: "insurance-act-64vb"
    title: "Insurance Act, 1938 — Section 64VB"
    authority: "india-statute"
    url: "https://www.indiacode.nic.in/show-data?actid=AC_CEN_2_33_00044_193804_1523351752525&orderno=165"
    anchor: "s. 64VB(1)–(2) (no risk assumed until premium received; risk not earlier than the date premium is paid); s. 64VB(5) (relaxations by rules — Insurance Rules, 1939, rule 58: bank-guaranteed premium or sufficient advance deposit with the insurer)"
    retrieved: "2026-07-17"
  - id: "icc-a-clauses-2009"
    title: "Institute Cargo Clauses (A), CL382, 01/01/2009"
    authority: "icc"
    url: "https://insurance.archgroup.com/wp-content/uploads/sites/2/Institute-Cargo-Clauses-A-1-01-09-CL382.pdf"
    anchor: "clause 8 (transit clause — attachment from first movement for loading, terminating at delivery or 60 days after discharge, whichever first)"
    retrieved: "2026-07-17"
reviewer: "Sreenath Govindarajan"

boundary: [irdai]

image: "assets/cover.png"
tags: [open cover, certificate of insurance, cif, under-insurance, marine cargo]
---

# The Certificate Is Not the Cover

An open cover and a Certificate of Insurance are two different promises, and exporters routinely
treat the second as if it were the first. The open cover is a standing arrangement: it defines
commodities, voyages, limits and conditions under which the insurer agrees to insure the
exporter's future shipments. The **Certificate of Insurance (COI)** is the per-shipment
instrument that draws on that arrangement — and it is only as good as three inputs the exporter
controls: whether the shipment was **declared** into the cover in the manner the cover requires,
whether the **insured value** was computed correctly, and whether the **premium mechanics**
satisfied Section 64VB of the Insurance Act, 1938.

Each input fails independently, and each failure surfaces only at claim time, when nothing can
be repaired. The undeclared shipment has no cover to draw on. The under-declared value pays
proportionately, because the statute makes the assured his own insurer for the gap. The premium
that cleared late puts attachment itself in question. All three are pre-shipment checks; none is
a claims argument. This note takes the three in turn, with the arithmetic that banks and
adjusters actually apply. The wider denial landscape sits in the
[marine claim-denial taxonomy](/publications/marine-cargo-claim-denial-taxonomy/).

## The Declaration: What a Floating Arrangement Actually Insures

A floating arrangement insures declared shipments, not the exporter's trade in general. The
Marine Insurance Act, 1963 states the discipline for floating policies in terms that carry
directly to open-cover practice: declarations "must be made in the order of dispatch or
shipment," must "comprise **all consignments** within the terms of the policy," and values
"must be honestly stated" — though a good-faith omission or error "may be rectified even after
loss" (s. 31(3)). Two consequences follow. First, the exporter is not free to select which
shipments to declare — selective declaration breaches the all-consignments discipline the
arrangement is priced on. Second, the good-faith rectification valve for a missed declaration
exists in statute for the floating policy, but *its availability under a specific open cover is
a function of that cover's own declaration clause* — which is why the declaration deadline and
method (per sailing, per bordereau, before shipment or within stated days) belong on the
per-shipment checklist verbatim from the cover's text, not from memory.

The timestamp discipline is the practical core: **declaration date against the Bill of Lading's
shipped-on-board date**. A COI generated after sailing, from a declaration made after sailing,
invites the attachment question in exactly the shipments where a loss has already occurred —
adverse selection is the risk the insurer's wording is built to refuse.

## The Value: How CIF+10% Is Actually Computed

The insured value is a computed figure with a defined floor, not a copied invoice total. Where a
documentary credit is silent on cover, **UCP 600 Article 28(f)(ii)** requires insurance of "at
least 110% of the CIF or CIP value of the goods" — and where CIF cannot be determined from the
documents themselves, the bank computes the minimum from **the greater of the amount drawn or
the gross invoice value**. A stated percentage in the credit is a *minimum*, not a target
(Art. 28(f)(i)). The 10% uplift exists to cover the buyer's imagined profit and incidental
costs; the operative word is *CIF* — cost, insurance **and freight**.

That word is where Indian MSME documentation goes wrong, because the invoice is frequently cut
on FOB or EXW terms and the insured value is computed off the invoice total as printed. An FOB
invoice total × 1.10 is not CIF+10%; it omits freight and the insurance itself, and it
systematically under-insures every shipment by roughly the freight margin. The statutory
consequence is Section 81 of the Marine Insurance Act, 1963: where the assured "is insured for
an amount less than the insurable value," he "is deemed to be **his own insurer in respect of
the uninsured balance**." Under-insurance does not void the policy; it silently converts every
partial loss into a co-insured loss — a ₹80-lakh cover on a ₹1-crore exposure recovers 80% of
any damage, with the assured absorbing the rest.

### The Computation, Reconciled Across Documents

The correct sequence is mechanical once stated: establish CIF (invoice value per its Incoterm,
plus freight to destination, plus insurance where not already inside the term), multiply by
1.10, and declare **at least** that figure — then verify that the COI's insured amount, the
invoice's terms line, and any credit's Field 45A/46A requirements agree. Each element must trace
to a document: freight to the carrier's invoice or B/L freight notation, terms to the invoice's
Incoterm line, the uplift to the credit or the UCP default. This is the same field-family logic
as the customs-side [pre-LEO reconciliation](/publications/pre-leo-document-reconciliation/) —
a value story told once, consistently, across every paper the claim file will contain.

## The Premium: Attachment Before Everything

Premium timing is the threshold the other two checks stand on. **Section 64VB(1)** forbids the
insurer from assuming any risk until the premium is received or guaranteed, and s. 64VB(2)
fixes attachment "not earlier than the date on which the premium has been paid." Open-cover
practice lives inside the relaxations sub-section (5) contemplates: **Rule 58 of the Insurance
Rules, 1939** permits risk to be assumed before premium receipt where the premium is
**guaranteed by a banking company** or where **an advance deposit sufficient to cover it stands
with the insurer** — the cash-deposit (CD) account mechanics on which marine open covers run. The operational check is therefore not "was a COI
issued" but **"under which 64VB arrangement did risk attach for this declaration, and does the
paper trail show it"** — deposit balance, adjustment invoice, or payment within the prescribed
window. A COI date proves a document was generated; it does not prove attachment.

TradeWatch runs the three checks as one packet item: declaration timestamp against the B/L date,
CIF+10% recomputed from the underlying documents rather than copied from the invoice, and the
premium/attachment trail under the cover's 64VB arrangement — each with a four-state verdict and
the clause or section it rests on, delivered to the broker before sailing. Kanan Labs prepares
claim-admissible evidence. It does not advise on, select, or bind insurance — your IRDAI-licensed
broker places and advises.
