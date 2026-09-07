# Kanan Supplier Programme — launch and operations runbook

Status: implementation-ready; external connections require owner configuration.

## What is already implemented

- Public page: `supplier-programme.html`
- Canonical public address: `https://apply.kananlabs.in/`
- Fallback address: `https://kananlabs.in/supplier-programme.html`
- Submission endpoint: `POST /api/supplier-programme`
- Primary routing: Make custom webhook
- Recovery fallback: internal Brevo email notification only when Make does not confirm a Sheet write
- Response clock: server-authoritative receipt, +18-hour reminder, +22-hour escalation and +24-hour deadline
- Applicant reference: client-generated stable ID, validated and reused for safe retries
- Deduplication keys exposed to Make: `applicationId` first; normalized `whatsapp` second
- Current schema: `supplier-programme.v2`; cached `supplier-programme.v1` clients remain accepted temporarily
- Published full-form locales: `en-IN`, `hi-IN`, `mr-IN`, `gu-IN`, `ta-IN`
- Locale authority: the API derives `localeCode`, `languageExperience` and `localizationVersion` from the checked-in manifest

The page does not store applicant answers in the URL, analytics events, local storage or session storage. No applicant score or automatic bankability classification exists.

## Required Vercel settings

Set these environment variables for Production and Preview:

| Variable | Purpose | Required |
|---|---|---|
| `ORIGIN_MAKE_WEBHOOK_URL` | Dedicated Make webhook for the Supplier Programme | Strongly recommended |
| `ORIGIN_MAKE_WEBHOOK_API_KEY` | Secret sent to Make as `X-Make-Apikey` | Strongly recommended |
| `BREVO_API_KEY` | Independent internal-notification fallback | Strongly recommended |
| `ORIGIN_NOTIFY_EMAIL` | Internal destination; defaults to `sreenath@kananlabs.in` | Optional |
| `ORIGIN_SENDER_EMAIL` | Verified Brevo sender; defaults to `raya@kananlabs.in` | Optional |

Local Make administration uses `MAKE_API_TOKEN` and `MAKE_ZONE`. The management
token belongs only in the ignored local `.env`; it must never be added to Vercel
or exposed to browser code. The production website receives only the dedicated
webhook URL and webhook API key.

Make must return HTTP 200 with `{"ok":true,"recorded":true}` after the Google Sheet write. A Brevo recovery alert does not produce a successful applicant receipt; the applicant is asked to retry, call or use WhatsApp. This avoids treating an alert email as the authoritative application record.

## Custom domain

1. Add `apply.kananlabs.in` to the existing Vercel project.
2. Add the DNS record Vercel specifies at the domain provider.
3. Confirm Vercel issues TLS and the root resolves to `supplier-programme.html` through the host-based rewrite.
4. Verify the fallback URL continues to work.
5. Confirm `https://apply.kananlabs.in` is accepted by `/api/supplier-programme` CORS.

## Make scenario

Current production intake scenario: `KSP — Application Intake — Production`.
It runs immediately, writes every automatic field from the original webhook
payload, and acknowledges a repeated `applicationId` without adding a second
row. Google Sheets uses user-entered parsing so amounts remain numeric; the
WhatsApp value is explicitly written as text so its leading `+91` is preserved.

Create one dedicated intake scenario with the following modules:

1. Custom webhook receives `formType: supplier-programme`.
2. Data validation rejects any record without `applicationId`, `receivedAt`, `responseDueAt`, `companyName`, `contactName` or normalized `whatsapp`.
3. Google Sheets searches by `applicationId`; if absent, it searches normalized `whatsapp` for an unresolved recent application.
4. Create or update the row idempotently.
5. Notify the owner immediately.
6. Return HTTP 200 with `{"ok":true,"recorded":true}` only after the row and notification modules complete.

Create a second scenario, scheduled hourly, that:

1. Sends the 18-hour reminder only when `First Contact At` and `Reminder Sent At` are blank.
2. Writes the delivery time into `Reminder Sent At`.
3. Sends the 22-hour escalation only when `First Contact At` and `Escalation Sent At` are blank.
4. Writes the delivery time into `Escalation Sent At`.
5. Ignores contacted applications.

Do not hold an intake execution open with a long delay. The canonical mapping and safe sample are in `data/supplier-programme/integration/`.

Do not automatically email or message the applicant. First contact remains a human action from an approved Kanan channel.

## Restricted Google Sheet

The intake system is integrated into the existing private native workbook:

- Workbook: `Project Origin — Control Tower`
- Machine-ingestion tab: `Supplier Intake Raw`
- Human-readable overview tab: `Supplier Applications`
- URL: `https://docs.google.com/spreadsheets/d/1g3cj-8rBK87YbUTVKLwjKPGAmmlzAmExKd1m4h38jMQ/edit`

Make writes to `Supplier Intake Raw`, whose canonical headers occupy row 1 and whose live records begin at row 2. This separate machine-ingestion tab is required because Make's standard Google Sheets modules treat row 1 as the header row. The existing `Supplier Applications` tab remains the human-readable overview and is not used as Make's write target.

### `Supplier Intake Raw` columns

`Record Type`, `Application ID`, `Received At`, `Response Due At`, `First Contact At`, `SLA Status`, `Route`, `Language`, `Locale Code`, `Language Experience`, `Localization Version`, `Schema Version`, `Company`, `Manufactures`, `Working Capital`, `Purposes`, `State`, `City / Cluster`, `Requested Amount INR`, `Customer Demand State`, `Contact Name`, `WhatsApp`, `Consent Version`, `Referrer`, `UTM Source`, `UTM Medium`, `UTM Campaign`, `UTM Content`, `Owner`, `Call Completed At`, `Disposition`, `Disposition Reason`, `Case ID`, `Notes Link`, `Reminder At`, `Reminder Sent At`, `Escalation At`, `Escalation Sent At`.

The existing `Financing Cases` tab remains authoritative for requested, qualified, submitted, accepted, sanctioned and disbursed amounts. These stages must remain separate. Never create an ambiguous “capital routed” total.

### Dashboard views

- Total applications and weekly trend
- Language, state/cluster and acquisition source
- Working-capital versus other enquiries
- Requested amount and customer-demand stage
- First-contact response rate within 24 calendar hours
- Calls completed and pursued/parked/outside-scope disposition
- Qualified, submitted, accepted, sanctioned and disbursed amounts as separate totals

Access is need-to-know; the workbook remains private. Do not place bank statements, tax returns, PAN, Aadhaar, identity files or confidential production records in it.

## Operating definition of the 24-hour promise

The deadline is 24 calendar hours from `receivedAt`, including weekends. `first_contact_at` records the first substantive human call or WhatsApp response, not an automated receipt. If the applicant cannot be reached, record the attempt and next action; do not falsify contact completion.

## Legal release gate

Before public launch, the founder/legal owner must approve the published Privacy Policy, Terms of Use, Supplier Programme Terms and Disclaimers. Hindi, Marathi, Gujarati and Tamil form copy is recorded as approved after founder confirmation of qualified native commercial review on 5 September 2026. Expansion-language copy remains unpublished and cannot be promoted merely because it exists in research files.
