---
title: "Invoice Number Formatting: How Tally and ICEGATE Disagree"
slug: "invoice-number-format-tally-icegate"
description: "Rule 46(b) allows 16 characters and only hyphen and slash in a GST invoice number. Formats that drift between Tally, GSTR-1 and the Shipping Bill trigger SB005."
author: "Sreenath Govindarajan"

type: "operational-note"
cluster: "igst-customs"
entities: [rule-46, sb005, icegate, ices, tally, gstr-1-table-6a, commercial-invoice, gst-invoice, egm, cha]

takeaways:
  summary: >-
    Rule 46(b) of the CGST Rules limits a tax invoice number to sixteen characters from letters,
    numerals, hyphen and slash. Accounting-software formats and the Shipping Bill entry routinely
    diverge — a dropped prefix, a slash swapped for a hyphen — and ICES matches invoice numbers
    exactly, so any divergence returns SB005 and stalls the IGST refund.
  points:
    - "Rule 46(b), CGST Rules 2017: an invoice serial number may not exceed **16 characters** and may contain only **alphabets, numerals, hyphen (-) and slash (/)** — unique within a financial year."
    - "A 17-character invoice number cannot be entered in GSTR-1 at all, and characters like **&, #, full stops or spaces** in a voucher format sit outside Rule 46(b)'s permitted set."
    - "ICES matches at invoice level as exact strings: **EXP/2026/0042 filed in GSTR-1 against EXP-2026-0042 keyed in the Shipping Bill** returns SB005."
    - "CBIC Circular 05/2018-Customs, para 2(ix), identifies the structural cause: **two invoice sets for one supply** — a GST tax invoice and a separately numbered commercial invoice."

date: "2026-07-16"
reviewed: "2026-07-16"

sources:
  - id: "cgst-rule-46"
    title: "Rule 46, CGST Rules, 2017 — Tax invoice"
    authority: "cbic"
    url: "https://taxinformation.cbic.gov.in/content/html/tax_repository/gst/rules/cgst_rules/active/chapter6/rule46_v1.00.html"
    anchor: "clause (b) (sixteen-character limit; permitted characters: alphabets, numerals, hyphen and slash; uniqueness per financial year); export-endorsement proviso"
    retrieved: "2026-07-16"
  - id: "gstn-igst-refund-faq"
    title: "GST Portal — FAQs: Refund on Account of Export of Goods (With Payment of Tax)"
    authority: "gstn"
    url: "https://tutorial.gst.gov.in/userguide/refund/Refund_on_Account_of_Export_of_Goods_(With_Payment_of_Tax).htm"
    anchor: "FAQ 9(ii) (invoice numbers in Table 6A same as in the Shipping Bill); FAQ 10 (Table 9A amendment route)"
    retrieved: "2026-07-16"
  - id: "cbic-circular-05-2018"
    title: "CBIC Circular No. 05/2018-Customs — Refund of IGST on Export: Invoice mis-match cases, Alternative Mechanism with Officer Interface"
    authority: "cbic"
    url: "https://www.cbic.gov.in/resources/htdocs-cbec/customs/cs-circulars/cs-circulars-2018/circ05-2018cs.pdf"
    anchor: "para 2(ix) (two invoice sets as the root cause of invoice mismatch; instruction that GSTR-1 and Shipping Bill invoice details match)"
    retrieved: "2026-07-16"
  - id: "chennai-customs-igst-error-codes"
    title: "Chennai Customs — IGST Refund Response/Error Codes and Rectification Procedure"
    authority: "cbic"
    url: "https://chennaicustoms.gov.in/wp-content/uploads/2025/08/IGST-Refund-Response.pdf"
    anchor: "SB005 row (typographical error and two-invoice-set causes; post-EGM non-amendability of the Shipping Bill)"
    retrieved: "2026-07-16"
  - id: "dgos-igst-refund-guide"
    title: "Directorate General of Systems, CBIC — Guide on IGST Refunds in ICES"
    authority: "cbic"
    url: "https://jawaharcustoms.gov.in/pdf/GST_REFUND.pdf"
    anchor: "para 2 (invoice-level matching of laid-down parameters); para 4(vi) (SB005 discussion; GST-compliant invoice to be declared at both ends)"
    retrieved: "2026-07-16"
  - id: "cgst-rule-96"
    title: "Rule 96, CGST Rules, 2017 — Refund of integrated tax paid on goods exported out of India"
    authority: "cbic"
    url: "https://taxinformation.cbic.gov.in/content/html/tax_repository/gst/rules/cgst_rules/active/chapter10/rule96_v1.00.html"
    anchor: "proviso to sub-rule (1)(b) (refund application deemed filed only when the Shipping Bill–GSTR-1 mismatch is rectified)"
    retrieved: "2026-07-16"
reviewer: "Sreenath Govindarajan"

boundary: [cha]

image: "assets/cover.png"
tags: [invoice number, rule 46, tally, sb005, gstr-1, shipping bill]
---

# One Identifier, Three Systems, No Tolerance

The invoice number is the linkage key of the Indian export refund pipeline: the same string must
appear on the tax invoice issued in the exporter's accounting system, in GSTR-1 Table 6A on the
GST portal, and in the invoice table of the Shipping Bill filed on ICEGATE. The Indian Customs EDI
System (ICES) compares the GSTR-1 string and the Shipping Bill string **exactly, at invoice
level**. There is no fuzzy matching, no normalisation of case or punctuation, and no materiality
threshold: *a hyphen where the return has a slash is as fatal to the match as a different number
entirely*.

Each of the three systems, however, has its own idea of what an invoice number looks like. The
CGST Rules define the legal format. The GST portal enforces that format at data entry. The
accounting software that actually generates the number — Tally in most Indian MSME exporters, or
Zoho Books, Busy, Marg or a custom Excel template — applies whatever voucher-numbering convention
was configured, often years ago and for domestic invoicing. The Shipping Bill entry, keyed by the
Customs House Agent's EDI software from the commercial invoice PDF, adds a fourth hand to the
string. The disagreements between these are not exotic: they are single characters, and **a single
character is an [SB005 refund block](/publications/sb005-igst-refund-blocked/)**.

## What Rule 46(b) Permits

Rule 46(b) of the CGST Rules, 2017 defines the lawful shape of a tax-invoice serial number: "a
consecutive serial number **not exceeding sixteen characters**, in one or multiple series,
containing alphabets or numerals or special characters- hyphen or dash and slash symbolised as
'-' and '/' respectively, and any combination thereof, **unique for a financial year**." Four
constraints follow: at most 16 characters; letters and digits; *exactly two permitted special
characters*, hyphen and slash; and uniqueness within the financial year, which in practice means
restarting or re-seriesing each 1 April.

Everything else commonly found in voucher formats sits outside the rule. **Ampersands, hash signs,
full stops, apostrophes, commas and spaces are not in the permitted set.** A number longer than
16 characters — easily produced by a format like **KLPL/EXP/2026-27/0042**, which runs 21 — is
not a valid serial number at all, and the GST portal's Table 6A entry rejects it, leaving the exporter
unable to file the return consistently with the document already issued. For export invoices, the
same rule adds the endorsement requirement — "SUPPLY MEANT FOR EXPORT/SUPPLY TO SEZ UNIT OR SEZ
DEVELOPER FOR AUTHORISED OPERATIONS ON PAYMENT OF INTEGRATED TAX", or its
without-payment-under-bond-or-LUT counterpart — which is how one invoice serves both the GST and
the customs record.

## What Accounting Software Actually Emits

Voucher-numbering conventions in Indian accounting software were designed for internal series
control, not for cross-system string matching, and the divergence patterns are consistent.
Prefix-and-suffix formats encode company, series and financial year around the sequence number —
**EXP/2026-27/042** — and *every element is a chance to differ* from what another system holds:
the financial year written **2026-27** in one place and **26-27** in another, the sequence
zero-padded to three digits in the ledger and four on the printed invoice, the prefix present in
the accounting record and dropped at re-entry.

A second pattern is the domestic/export duality. Exporters commonly run one Tally series for
GST-compliant domestic tax invoices and generate a separately numbered commercial invoice for the
foreign buyer — the exact practice CBIC Circular 05/2018-Customs, para 2(ix), identifies as the
root cause of invoice mismatch: "**exporters are using two sets of invoices, one invoice for GST
and another invoice for Customs**." After GST, that duality has no legal basis; the DG Systems guide is
explicit that the invoice declared in the Shipping Bill must be the GST-compliant invoice, since
IGST is paid on the actual transaction value between exporter and consignee. But the duality
persists operationally, because the commercial invoice carries buyer-facing formatting the tax
series does not.

### Where the Extra Characters Come From

Field observation across MSME export documentation shows the label drift as well as the value
drift: the same identifier appears as "Invoice No.", "Inv. No.", "Bill No.", "Export Inv." or
"Document No." across templates, and PDF exports from misconfigured accounting software can
truncate right-hand columns or flatten text layers, so the string the CHA's operator reads and
re-keys is not always the string the system stored. Re-keying is where case changes, spaces
appear around slashes, and **O and 0 trade places**. *None of these observations is a regulatory
requirement; each is a mechanical origin of a string that no longer equals its GSTR-1 twin.*

# Where the Disagreement Becomes a Blocked Refund

The disagreement stops being cosmetic at the moment ICES runs the Rule 96 validation: the invoice
number transmitted by GSTN from Table 6A is compared, as a string, with the invoice number in the
Shipping Bill's invoice table. **EXP/2026/0042 against EXP-2026-0042 fails. INV-42 against
INV-042 fails. EXP/2026/0042 against exp/2026/0042 fails.** Each failure returns SB005, and the
refund for that invoice stalls until the mismatch is resolved — under the proviso to Rule
96(1)(b), *the refund application is not even deemed filed until rectification*.

The timing makes the formatting error expensive out of proportion to its size. The comparison runs
only after the Export General Manifest is filed — after sailing — and the Shipping Bill's invoice
entry cannot be amended once the EGM exists. A GSTR-1-side slip can still be amended through Table
9A of a subsequent return. A Shipping-Bill-side divergence can only be bridged by the Concordance
Table procedure at **₹1,000 per Shipping Bill**, mapping the GST invoice to the customs invoice
for an officer's verification. The full clearance mechanics are covered in the
[SB005 operational note](/publications/sb005-igst-refund-blocked/); where SB005 sits among the
other six validation codes is mapped in
[SB001–SB006: The ICEGATE Shipping Bill Error Codes, Explained](/publications/icegate-sb-error-codes/).

## The Shipping Bill Side of the String

The Shipping Bill's invoice number is a **re-keyed copy**, and that is its vulnerability. The CHA's
EDI software takes the invoice identifier from the commercial documents the exporter sends —
frequently a PDF, sometimes a scan or a photographed copy — and a human operator or an import
routine writes it into the draft Shipping Bill. The GST portal validates its string against Rule
46(b) at entry; the customs draft has no knowledge of what GSTR-1 will later say. *Nothing in the
filing path compares the two strings before the Let Export Order*, unless someone deliberately
performs that comparison at the draft-checklist stage.

That checklist moment is the single point where the error is still free to fix. The draft comes
back from the CHA for approval; the invoice number on it either equals the tax-invoice string in
the accounting system, character for character, or it does not. The GST Portal's own guidance
states the standard — invoice numbers in Table 6A "are same as that given in Shipping Bill" — and
the comparison takes seconds per invoice when it is actually performed against the issued invoice
rather than against memory.

# The Formatting Discipline That Prevents SB005

The preventive posture is **a single invoice series, shaped by Rule 46(b), used identically on
every surface**. One GST-compliant export invoice per supply, carrying the export endorsement, numbered
within 16 characters from letters, digits, hyphen and slash — and that exact string, not a
reformatted cousin, declared in GSTR-1 Table 6A and keyed into the Shipping Bill. Where a company
insists on a buyer-facing commercial invoice layout, the identifier on it must still be the tax
invoice's identifier, not a parallel series.

A format that survives all three systems is *boring by design*: short enough to never approach
the **16-character ceiling** even with a financial-year element, restricted to *one separator
used consistently*, and stable across the accounting ledger, the printed document and the PDF
export.
The financial-year reset required by Rule 46(b)'s uniqueness condition belongs in the series
definition, written the same way everywhere it appears.

TradeWatch performs this check as part of its Shipping Bill Readiness Packet: the invoice number
on the draft Shipping Bill is reconciled character-for-character against the GST invoice at
source, and any divergence is flagged before filing, with the verdict cited to Rule 46(b) and the
matching requirement it would breach. Kanan Labs prepares a readiness packet. It does not file
Shipping Bills and holds no customs credentials — your licensed CHA files.
