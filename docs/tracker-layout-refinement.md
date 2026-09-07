# Tracker opening layout — implementation and verification

Implemented locally on 6 September 2026. Preview: http://127.0.0.1:4181/tracker.html.
No publication performed.

The delivered preview is a build snapshot served from `/private/tmp/india-ai-tracker-layout-preview` so concurrent workspace builds cannot remove its routes. The source changes remain in this repository; subsequent edits require rebuilding and refreshing the snapshot or using the usual development preview.

## Scope

- `tracker.html`: one opening wrapper, the empty grid strip, stylesheet/script references and the page flag.
- `css/tracker-layout.css`: all new layout and title rules. The local Telegraf UltraBold font is used; the existing slightly warm light theme and animated grid remain.
- `js/tracker-layout.js`: the small, tested coordinator for settled Leaflet sizing.
- `js/app-final.js`: connects current view/panel state to the coordinator; guards stale fetches; adapts open panels and the existing feed when crossing the mobile breakpoint.
- `test/tracker-layout.test.js`: focused regressions for framing, transitions, stale responses, direct state links, rollback and carousel touch pauses.

The existing map instance, feature collection, Esri tiles, cache settings, colours, map nesting and interaction controls are preserved. Leaflet's own immediate window-resize handler is disabled only in the new layout, allowing the coordinator to perform one settled recalculation. The existing zoom snapping is preserved; fitBounds can therefore leave more than 24px of space around India. The previous desktop/mobile overview levels remain upper limits.

The coordinator uses `invalidateSize({animate:false, pan:false})` followed by `fitBounds`, supported by [Leaflet's API](https://leafletjs.com/reference.html#map-invalidatesize). It waits for the existing 450ms transitions plus a 50ms settling allowance, coalesces resize events, reads current state at execution time and ignores hidden maps.

The title hierarchy follows the approved size/weight/spacing approach in [NN/g's visual hierarchy guidance](https://www.nngroup.com/articles/visual-hierarchy-ux-definition/). The empty bottom strip is an interaction area; it intentionally does not expose the next heading. As the approved plan acknowledges, whitespace alone is a weaker continuation cue than those in [NN/g's discussion of completeness](https://www.nngroup.com/articles/illusion-of-completeness/).

## Reversal

Remove `data-tracker-layout="compact"` from the root `<html>` in `tracker.html`, then rebuild and reload. This restores the earlier light-theme layout and fixed overview behaviour together. The wrapper becomes `display: contents`, the strip disappears, and the new sizing coordinator does not initialize. Generated state and All India routes inherit this flag from the template during the build.

No Git reset, stash, checkout or commit was used. Existing uncommitted work is retained. `docs/tracker-layout-refinement.patch` records only this refinement relative to the working files captured before the change, including the previously uncommitted light theme. Prefer the flag for rollback, because reversing a patch after later edits needs a fresh review.

## Browser results

Measured in the Codex local preview browser, in CSS pixels:

| Viewport | Title top | Leaflet height | Empty strip | Next heading top |
| --- | ---: | ---: | ---: | ---: |
| 1440 × 900 | 80 | 603.3 | 72 | 924 |
| 1366 × 768 | 80 | 484.5 | 61.4 | 792 |
| 1280 × 720 | 80 | 443.5 | 57.6 | 744 |
| 1310 × 1243 (supplied proportions) | 80 | 923.5 | 99.4 | 1267 |
| 1024 × 768 | 68 | 505.8 | 61.4 | 792 |
| 1280 × 500 | 80 | 320 | 48 | 610.9 |
| 844 × 390 (landscape) | 68 | 320 | 48 | 592.5 |

- No horizontal page overflow or header overlap in those sizes, 390 × 844, 414 × 896 or 720 × 450.
- On normal desktop heights the strip ends at the initial viewport edge and the heading starts 24px below it. Short windows retain the 320px map and allow normal page overflow.
- Wheel input in the empty strip scrolls the document. The animated grid remains visible there.
- Full-country overview, including islands, visually checked on desktop and mobile. Zoom controls, overview return and map information tooltip checked.
- Maharashtra opening/closing and its generated `/states/maharashtra/` deep link checked. Desktop/mobile resizing preserves the open state panel and restores the appropriate map/feed arrangement.
- Rapid State View / All India toggles end with the correct visible panel and feed. All India scroll locking correctly enters/exits when crossing the mobile breakpoint.
- Desktop feed hover holds scroll position; leaving resumes scrolling. Looping and mobile auto-advance observed. Mobile Page 2 selection survives resizing without resetting the carousel. The eight-second touch pause and prevention of a late desktop carousel restart are covered by the focused test.
- Lower-section reveal animations, light header detection and the flag-off layout checked. No warnings/errors in the final preview console observation.

Native browser 200% zoom could not be invoked through the available preview controls. The equivalent 720 × 450 CSS viewport was checked for reflow and overflow, but this is not a substitute for a native zoom check. Touch handlers are regression-tested; physical-device touch/pinch behaviour was not exercised. These remain manual checks before publication.

## Commands

`node --test test/tracker-layout.test.js` — 12 passing tests.

`npm run build` — successful production build, including generated jurisdiction routes.

`node --check js/app-final.js` and `node --check js/tracker-layout.js` — passed.
