# Kanan Supplier Programme — implementation acceptance

Date: 5 September 2026

Release candidate: `supplier-programme.v2`
Status: code-complete; production release awaits the external gates below.

## Implemented surface

- Responsive Supplier Programme landing page and immersive application overlay.
- Official Kanan wordmark and a dedicated social-preview asset.
- Direct call and WhatsApp routes that work without JavaScript.
- Six-screen full application in English, Hindi, Marathi, Gujarati and Tamil.
- Shortened contact flow for the other eighteen scheduled-language preferences.
- Versioned, source-linked localization registry with a deterministic validation/build gate.
- Local Noto Sans subsets for Devanagari, Gujarati and Tamil; no external font or translation service.
- Working-capital and non-working-capital branches.
- Server-side validation, normalization, route assignment and authoritative 18/22/24-hour timestamps.
- Independent Make and Brevo delivery paths.
- Site-wide Privacy Policy, Terms of Use, Supplier Programme Terms and Disclaimers.
- Supplier Programme links in the shared main menu and primary site footer.
- Host-based Vercel rewrite for `apply.kananlabs.in`, with a kananlabs.in fallback page.
- Private `Supplier Intake Raw`, `Supplier Applications` and `Supplier Programme Dashboard` tabs inside `Project Origin — Control Tower`.

## Acceptance evidence

| Area | Result | Evidence |
|---|---|---|
| Production build | Pass | Full static build and sitemap generation completed after locale validation on 5 September 2026. |
| Automated tests | Pass | 27/27 tests pass, covering all five full journeys, all contact-only languages, canonical identifiers, v1 compatibility, v2 server authority, response clock and delivery fallbacks. |
| Desktop | Pass | Reviewed at 1280, 1440 and 1920 pixels. |
| Tablet | Pass | Reviewed at 768 × 1024; two-pane overlay remains usable. |
| Mobile | Pass | Reviewed at 360 × 800 and 390 × 844; full-screen form and 48px+ controls. |
| Keyboard/history | Pass | Focus enters the overlay; Escape and browser Back close it before page departure. |
| Language governance | Pass | Only the five founder-approved locales can render the complete form; the API owns locale status and bundle version. |
| Short language route | Pass | All 18 non-launch preferences use the three-screen contact route. |
| Localized risk boundary | Pass | Tamil walkthrough confirmed the research copy, supplier-specific causal-path rule and the non-instant/non-predictive/non-credit-score limitation render separately. |
| Localized consent boundary | Pass | Tamil walkthrough confirmed the complete lender boundary and contact-only consent are visible before submission; consent is not preselected. |
| Narrow-screen script rendering | Pass | Tamil reviewed at 320 × 800 and 390 × 844 with no horizontal overflow; local Tamil font loaded and mixed Latin/Indic terms remained legible. |
| Language switching | Pass | Switching between full-form languages preserves working-capital answers and selected purposes. |
| History behaviour | Pass | Browser Back removes `#apply` and closes the overlay before leaving the programme page. |
| Direct contact | Pass | `tel:` and `wa.me` destinations resolve from semantic links without script. |
| Sensitive browser state | Pass | No application answers are written to URL parameters, analytics events, local storage or session storage. |
| TradeWatch isolation | Pass | `request-demo.html` has no implementation diff. |
| Build artifacts | Pass | Programme page, terms, styles, script and social preview are present in `dist`. |
| Control Tower structure | Pass | Private native workbook; dedicated segmented dashboard, live-only formulas, data validation, frozen headers and a non-counting template row. |

## External production gates

These are intentionally not marked as complete because they require owner credentials, external service state or human authority:

1. Founder/legal approval of the four legal pages and consent language.
2. Configure the Make webhook to write `Record Type = Live` rows from row 2 of `Supplier Intake Raw`, notify the owner, deduplicate and schedule/cancel reminders.
3. Configure and verify the Brevo sender `raya@kananlabs.in` and production notification address.
4. Add `apply.kananlabs.in` to the correct Vercel project and apply the DNS record returned by Vercel.
5. Run one consenting internal test in each published language through Make, Brevo and the private dashboard.

Qualified native commercial review of Hindi, Marathi, Gujarati and Tamil was founder-confirmed on 5 September 2026. Reviewer identities were not supplied and have not been invented. Do not publish the production form before gates 1–4 pass. Gate 5 is the final controlled smoke test.

## Deliberate constraints

- No applicant score, approval prediction or automated bankability decision.
- No lender ranking, finance guarantee, bank affiliation or handling of funds.
- No live AI translation or voice capture in this release.
- No sensitive-document upload in the initial application.
- No automatic applicant email or WhatsApp message; first contact remains human.
- No applicant data is embedded in the static website or social-preview asset.
