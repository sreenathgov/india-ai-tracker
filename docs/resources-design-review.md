# Resources: layout and spacing review

Updated 6 September 2026. Applies to the Resources page; article content, cover artwork, and the standard homepage footer remain intact.

## Assessment

The page had several individually designed components, but no shared layout rules tying them together. The screenshot's main problem was inconsistency, not simply a shortage of empty space.

| Area | Previous problem | Applied change |
| --- | --- | --- |
| Subscription invitation | A second full-width conversion band interrupted the article-to-advisory flow and competed with the application CTA. | Removed the newsletter band. A small, dismissible wine card slides in from the right after the second article row; the application banner remains the only conversion band. |
| Application banner | The eyebrow added a third level of text and made the lower banner feel heavier. | Removed “Applications open” on Resources. Retained the headline, explanatory byline, application link, phone and WhatsApp links. |
| Advisory section | Right-aligned paragraphs created an uneven reading edge. The animated cards extended beyond the space allocated to them, visually crowding adjacent sections. | Left-aligned copy, 16px text with 1.65 line height, 24px paragraph grouping, and explicit room around and below the stack. |
| Article grid | Small summaries and tight rows made cards compete with adjacent rows. | 26px titles, 15px summaries, 24px between artwork and copy, 16px between related text elements, and wider gaps between cards and rows. |
| Featured article | Its division did not share a proportional system with the rest of the page. | Approximately 62:38 image-to-copy columns on desktop, with a larger gutter and clear separation before the grid. Original cover aspect ratios are preserved. |
| Whole page | Heading, catalog, banners and advisory content used different horizontal alignment lines. | A shared 1200px maximum content width and responsive page gutters. The standard footer retains its established layout. |
| Responsive behavior | The advisory cards retained their initial pixel dimensions when the viewport changed. | Resize the existing cards with their column, preserve their links, and allow more text height on narrow screens. |

## What professional guidance supports

GOV.UK's design system distinguishes small, stable spaces from larger spaces that adapt to the viewport. The useful principle here is a consistent responsive scale, rather than copying its exact government-service styling. The Resources scale uses 16px and 24px inside groups, 32–64px for larger separations, and 64–112px between major sections. [GOV.UK: Spacing](https://design-system.service.gov.uk/styles/spacing/)

Nielsen Norman Group explains that whitespace can communicate grouping and hierarchy without adding visual containers. This supports keeping the components of one article relatively close while separating adjacent articles and distinct sections more clearly. It also explains why enlarging every margin equally would not solve the page's hierarchy. [NN/G: Visual Hierarchy](https://www.nngroup.com/articles/visual-hierarchy-ux-definition/), [NN/G: Common Region](https://www.nngroup.com/articles/common-region/)

NN/G describes the golden ratio as a possible reference for grids and typography, while acknowledging that responsive websites cannot maintain it at every viewport and that designers disagree about its special value. This review therefore uses it as a compositional aid, not a guarantee of beauty or conversion. [NN/G: The Golden Ratio and User-Interface Design](https://www.nngroup.com/articles/golden-ratio-ui-design/)

## How the golden ratio is used

The golden ratio is approximately 1.618:1, or 61.8% to 38.2% when dividing available space. The desktop featured area allocates the larger share to the artwork. The application banner allocates it to the message. The advisory area allocates it to the illustrated handbook stack. These ratios apply to the space left after the column gutter is deducted.

Body text uses a practical 1.65 line height, close to 1.618 but chosen for legibility. The 16px base text and 26px card headings also sit near this scale. Display headings use tighter line heights so multiline titles read as a unit. Cover images keep their existing 16:9 proportions, and form controls use comfortable interaction dimensions rather than golden rectangles.

Below the desktop breakpoint, columns stack. We preserve alignment, readable text and grouping instead of squeezing a mathematical ratio into a phone. The three-column catalog becomes two columns and then one.

## Subscription card: timing and reader control

Nielsen Norman Group distinguishes nonmodal invitations, which leave the underlying page usable, from dialogs that disable it. It also warns that newsletter overlays can interrupt reading even without a backdrop. The design response is restraint: delay the invitation until readers have browsed content, keep it compact, provide an obvious exit, and avoid repeated prompting. [NN/G: Modal & Nonmodal Dialogs](https://www.nngroup.com/articles/modal-nonmodal-dialog/), [NN/G: Popups—Problematic Trends and Alternatives](https://www.nngroup.com/articles/popups/)

The exact trigger and dimensions below are our implementation choices, informed by that guidance; they are not a research-proven conversion formula.

- The banner is removed from the page flow. Existing catalog/advisory spacing is retained without doubling the gap at their new junction.
- A 336px-wide card sits 24px from the desktop right/bottom edges; phone insets are 16px and its width is capped to the viewport.
- It uses the approved wine background `#762c36`, cream copy, serif heading, rounded email field, and white pill CTA with a burgundy arrow circle.
- On downward scroll, the bottom of the second visual article row must pass 128px from the viewport top. That is six cards on a three-column desktop, four on a two-column tablet, and two on a phone. The featured article is separate.
- Row positions are read from the current grid, so filtering, pagination, resizing, and different title lengths cannot leave a stale trigger.
- No timer, exit intent, backdrop, scroll lock, autofocus, or focus trap. The invitation is a labelled complementary region, not a modal dialog.
- The 400ms slide eases out without bounce. Close reverses it. Reduced-motion preferences disable the transition.
- The close control has a 44px target. Escape also dismisses it. Keyboard dismissal returns focus to an article; outside focus stays where it is. If the card would cover a newly focused control, it retracts.
- One impression per tab session, including reloads. Session storage contains only a seen flag; if storage is unavailable, the current page still enforces the cap.
- The invitation defers while cookie consent, the site menu, or the contact panel is open, or while another form is being edited. It does not launch after the reader has left the catalog or when the catalog is empty, unbuilt, or damaged.
- The existing Brevo form and its in-place success/error feedback remain. Requests in progress cannot be submitted twice. The confirmation remains readable until the reader closes the card.

## Application banner

The application banner retains its wine background, 32–42px serif title, 15px byline, shared 1200px page measure, rounded white CTA, phone and WhatsApp links. “Applications open” remains removed on Resources. Its minimum height accommodates text growth rather than clipping it. The standard homepage footer is unchanged.

## Verification and limits

The publication build succeeds. Automated tests cover responsive row detection, dismissal and session persistence, reduced motion, focus behavior, deferred prompting, unavailable storage, and catalog changes. The newsletter success/failure test verifies that changing its status preserves the button label and arrow. This test uses a stub; it does not send a subscription or email.

The original 40 articles remain in the 41-entry catalog. Browser checks at 1280px, 768px, 390px, and 320px verified the invitation stays within the viewport and creates no horizontal overflow. The card measured 336px wide on desktop/tablet and 288px at a 320px viewport. Click, Escape, and reload checks confirmed dismissal and the session cap. Cream copy on wine has an 8.08:1 contrast ratio; button text on white is 12.32:1. All 44 automated tests pass, and all 128 publication source/artwork files match the preservation baseline.

The Brevo request path remains unchanged: the card calls the shared subscription utility, which posts to the existing serverless endpoint. No production deployment or real subscription was performed.

These are design and functional checks, not user research or a conversion-rate experiment. A future usability review should observe whether readers can find a relevant article, distinguish published handbooks from upcoming ones, and complete the intended subscription or application journey.
