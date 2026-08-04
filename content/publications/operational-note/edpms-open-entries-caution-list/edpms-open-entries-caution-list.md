---
title: "EDPMS Open Entries and Caution-Listing: How Exporters Get Flagged"
slug: "edpms-open-entries-caution-list"
description: "Caution-listing stopped being automatic in 2020: AD banks recommend it on adverse notice or evasion. From October 2026, one year overdue means advance-or-LC."
author: "Sreenath Govindarajan"

type: "operational-note"
cluster: "export-realization"
entities: [edpms, caution-list, rbi, ad-bank, fema-23r-2026, realization-period, enforcement-directorate, letter-of-credit]

takeaways:
  summary: >-
    Caution-listing stopped being automatic in October 2020: the AD bank recommends it to RBI on
    adverse agency notice (ED, CBI, DRI), untraceability, or lack of sincere realization
    efforts. A listed exporter ships only against advance payment or irrevocable LC — and from
    1 October 2026, Regulation 13 applies that consequence mechanically at one year past due.
  points:
    - "**A.P. (DIR Series) Circular 03 of 09.10.2020** withdrew the old two-year automatic rule: caution-listing now happens 'based on the recommendations of the AD bank concerned', on adverse notice of **ED/CBI/DRI**, untraceability, or lack of sincere realization efforts."
    - "The operative consequence: AD banks handle a caution-listed exporter's documents only against **advance payment or an irrevocable Letter of Credit** covering the full export value."
    - "**Reg. 13 of the 2026 Regulations** (from 01.10.2026) hard-codes the edge: proceeds unrealised **beyond one year past the due date** → further exports only against full advance or irrevocable LC — no listing decision required."
    - "De-caution runs the same channel in reverse: **the AD bank recommends de-listing** to RBI's Regional Office once realization or genuine effort is demonstrated."

date: "2026-07-22"
reviewed: "2026-07-22"

sources:
  - id: "rbi-apdir-03-2020-caution"
    title: "RBI A.P. (DIR Series) Circular No. 03 — EDPMS Module for 'Caution/De-caution Listing of Exporters' – Review, 09.10.2020"
    authority: "rbi"
    url: "https://www.rbi.org.in/Scripts/BS_ViewMasDirections.aspx?id=10395"
    anchor: "withdrawal of paras 3(1)(i)–(ii) of A.P. (DIR Series) Circular 74 of 26.05.2016 (automatic listing at two years); revised procedure — caution-listing by RBI on the AD bank's recommendation, on adverse notice of ED/CBI/DRI or other agencies, untraceability, or absence of sincere efforts; de-caution on AD recommendation (as consolidated in Master Direction 16/2015-16)"
    retrieved: "2026-07-22"
  - id: "rbi-apdir-74-2016"
    title: "RBI A.P. (DIR Series) Circular No. 74 — EDPMS: caution-listing and handling of documents, 26.05.2016"
    authority: "rbi"
    url: "https://www.rbi.org.in/Scripts/NotificationUser.aspx?Id=10423&Mode=0"
    anchor: "para 3.2 (documents of caution-listed exporters handled against advance payment or irrevocable letter of credit for the full export value) — the handling rule that survived the 2020 review"
    retrieved: "2026-07-22"
  - id: "fema-23r-2026"
    title: "Foreign Exchange Management (Export and Import of Goods and Services) Regulations, 2026 — FEMA 23(R)/2026-RB, 13.01.2026 (in force 01.10.2026)"
    authority: "rbi"
    url: "https://www.rbi.org.in/Scripts/NotificationUser.aspx?Id=13277&Mode=0"
    anchor: "Reg. 13 (exporter with proceeds unrealised beyond one year from the due date, or extended period, shall undertake further exports only against receipt of full advance or an irrevocable Letter of Credit)"
    retrieved: "2026-07-22"
  - id: "rbi-md-16-export"
    title: "RBI Master Direction No. 16/2015-16 — Export of Goods and Services (updated)"
    authority: "rbi"
    url: "https://www.rbi.org.in/Scripts/BS_ViewMasDirections.aspx?id=10395"
    anchor: "consolidated caution/de-caution procedure and extension-of-time provisions (AD banks may extend realization on reasonable cause, in blocks)"
    retrieved: "2026-07-22"
reviewer: "Sreenath Govindarajan"

boundary: [irdai]

image: "assets/cover.png"
tags: [edpms, caution list, export realization, rbi, ad bank]
---

# The Flag Is Discretionary; the Consequence Is Not

Caution-listing is the enforcement edge of India's export-realization regime, and it is widely
misunderstood in both directions. Exporters fear an automatic trip-wire that no longer exists —
the old rule that two years of unrealised proceeds put you on the list mechanically was
**withdrawn in October 2020**. And exporters relax about a consequence that is entirely real:
once caution-listed, an AD bank handles your export documents **only against advance payment or
an irrevocable Letter of Credit** covering the full value — which, for a business selling on
open account or DA terms, is functionally an export freeze.

The current architecture is discretionary at the front and mechanical at the back. The *listing*
decision runs through human judgment: the AD bank recommends, RBI's Regional Office lists. The
*consequence* of being listed is fixed policy. And from 1 October 2026, the new export
regulations add a second, judgment-free edge that reaches exporters who were never listed at
all. This note maps who flags, on what grounds, with what effect, and how the flag is removed —
the enforcement companion to
[the realization-clock hub](/publications/export-realization-fema-2026/).

## Who Flags, and On What Grounds

Since RBI's A.P. (DIR Series) Circular 03 of 9 October 2020, an exporter "would be caution-listed
by the Reserve Bank **based on the recommendations of the AD bank concerned**, depending upon
the exporter's track record with the AD bank and investigative agencies." The circular names the
grounds: the exporter "has come to the adverse notice of the **Enforcement Directorate (ED) /
Central Bureau of Investigation (CBI) / Directorate of Revenue Intelligence (DRI)** / any such
other law enforcement agency," and/or "is **not traceable**," and/or "is **not making sincere
efforts** to realise the export proceeds." The AD bank routes its recommendation to the
concerned Regional Office of RBI's Foreign Exchange Department.

Each ground rewards a different behaviour. Adverse agency notice is largely outside a compliant
exporter's control, but *traceability* and *sincere efforts* are documentation questions: an
exporter who answers the bank's EDPMS follow-ups, files extension requests with reasons, and
keeps a written record of recovery efforts (buyer correspondence, legal notices, credit-insurer
claims) is building the file that keeps the bank's recommendation unwritten. The bank's
discretion runs on what it can see — *an undocumented effort is, for this purpose, no effort*.

## What Being Listed Does — and the 2026 Bright Line

The handling rule that survives from the 2016 framework is blunt: for a caution-listed exporter,
AD banks accept export documents only against **advance payment or an irrevocable LC** for the
full export value — with the bank scrutinising the LC's conditions before shipment. Open-account
trade, the default settlement mode of merchandise exporting, is off the table until de-listing.
The collateral effects compound quietly: banks apply enhanced diligence across the relationship,
and counterparties read the terms change as a credit signal.

From **1 October 2026**, the consolidated regime — the 2026 Regulations with their operational
Directions in A.P. (DIR Series) Circular No. 20 of 16.01.2026, which supersede the legacy
Master Direction on exports — installs the same consequence on a purely mechanical trigger:
Regulation 13 provides that where "export proceeds of an exporter remain unrealised for a
period **beyond one year from the due date of realisation** or extended period," the exporter
"shall undertake further exports only against receipt of **full advance or an irrevocable
Letter of Credit**." No recommendation, no listing decision — the ledger itself imposes the
terms. Read with the clock's four buckets on the hub page, the practical rule for finance teams
is: *due date + one year = the advance-or-LC line*, and every extension granted by the AD bank
moves that line explicitly.

### De-Listing: The Same Channel, in Reverse

Removal is procedural, not automatic: "the AD bank would also make recommendations … for
de-caution-listing an exporter as per the laid down procedure" — the same bank, the same
Regional Office, on evidence that the outstanding entries are realized, closed under the
₹10-lakh declaration route, written off within limits, or covered by granted extensions. The
practical sequencing matters: clean the EDPMS ledger *first* (every closure route is documented
on [the hub page](/publications/export-realization-fema-2026/)), then ask the bank to carry the
recommendation. A de-listing request against a still-ragged ledger asks the bank to spend
credibility it has no basis to spend.

## The File That Prevents the Flag

The preventive posture reduces to keeping two artefacts current. The first is the **EDPMS ageing
view by bucket** — every open bill against its correct due date under the instrument in force on
its shipment date, with the one-year Regulation 13 line computed per bill. The second is the
**effort file per overdue buyer** — dated correspondence, extension applications, recovery
steps — which is simultaneously the answer to the bank's "sincere efforts" question and the
evidence a future de-listing recommendation would rest on. Both artefacts are cheap to maintain
continuously and expensive to reconstruct after a bank query.

TradeWatch maintains both as part of its readiness intelligence: per-bill due dates and
Regulation 13 lines, EDPMS ageing, and the documented-effort record, each anchored to the
governing circular or regulation. Kanan Labs prepares evidence and readiness; recommendations,
listings and extensions are acts of the AD bank and the Reserve Bank, and remain so. Where a
recovery effort runs through a credit-insurance claim, Kanan Labs does not advise on, select, or
bind that cover — your IRDAI-licensed broker acts on it.
