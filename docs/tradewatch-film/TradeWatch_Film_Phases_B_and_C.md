# TradeWatch Film — Phase B and Phase C prompts

Companion to `TradeWatch_Film_Build_Bible_v1.md`. Run **Phase A.1** (rig corrections) before Phase B.

---

## Values resolved in Phase A — use these, they are now canon

| Constant | Value | Where it appears |
|---|---|---|
| `DOCUMENT_COUNT` | **7** | Beat 1 stat line |
| `FIELD_COUNT` | **52** | Beat 1 stat line (intake, six classified docs) |
| `FIELD_COUNT_AFTER_SUPPLIER_LOOP` | **54** | Beat 5 stat line (after UN 38.3 returns 2 verified fields) |
| Cell supplier | Anode Cell Systems Pvt. Ltd., Hosur | Beat 4a request card |
| UN 38.3 return | 18.5 Wh · `T-2025-11-4471` | Beat 4d extracted fields |

All three counts are **derived** in `film/src/data/shipment.ts`, never hardcoded. If a component needs a number, import it. Do not type a digit.

The stat line therefore reads `7 documents · 52 fields · source-linked` at Beat 1 and ticks to `54 fields` at Beat 5. That tick is a real event in the film — it is the supplier loop paying off numerically — so do not let it happen off-screen.

---

## Phase B prompt — components and choreography

> Run after Phase A.1 renders clean. This is the long phase. Consider letting the model fan out the component work across parallel subagents — they are independent, and the interface between them is just `progress` plus the depth API.

```
Read docs/tradewatch-film/TradeWatch_Film_Build_Bible_v1.md in full, then read
film/src/data/shipment.ts, film/src/design/tokens.ts, film/src/design/type.ts
and film/src/camera/Camera.tsx before writing anything.

The camera rig is built and signed off. Do not modify it. Build the film on it.

═══ PART 1 — world components ═══

Build under film/src/world/ and film/src/chrome/:

  IntakeColumn      DocumentCard      ScanSweep       MatchPane
  MatchGlyph        RuleCard          SupplierSurface RequestCard
  ReadinessMatrix   SealSurface       PacketTray      Caption
  StatLine          AuthorityMark

ARCHITECTURAL RULE, non-negotiable: components own NO timing. Each takes a
`progress` prop (0..1) and renders correctly at any frozen value. All timing
lives in Film.tsx. This is what makes the Part 2 polish pass possible — if
timing leaks into components it becomes untunable and the film will stay
mechanical.

Each component declares its depth plane via the API added in Phase A.1.
Background chrome sits back, cards sit mid, the cursor and the active focus
target sit forward.

Copy and values: every on-screen string imports from data/shipment.ts. Exact
wording is in Bible §5 — follow it literally, it has been checked against the
boundary constraints. If you need a value that is not in shipment.ts, STOP and
ask. Do not invent one.

HARD CONSTRAINTS
- No numeric confidence anywhere. States are OPEN / CONDITIONAL / BLOCKED /
  UNCLEAR only. (Doctrine 2 — confidence is semantic, never numeric.)
- Telegraf Regular only, never a weight above 400. Hierarchy comes from size,
  case and tracking.
- IBM Plex Mono for invoice numbers, HS codes, hashes, rule IDs, bbox refs.
- Cormorant Garamond for captions and the end card only.
- Vermilion appears ONLY on scan sweeps and the active cursor target.
- Nothing bounces. The seal stamp (scale 0.82 → 1.04 → 1.0 over 520ms) is the
  single overshoot in the entire film.
- Radius ladder: stamp 2 / pill 6 / chip 8 / card 12 / frame 18.

Write a Remotion Still for each component so it can be reviewed in isolation.

═══ PART 2 — the film ═══

Build film/src/Film.tsx: 2700 frames at 60fps, seven beats at the exact frame
ranges in Bible §5, assembled into ONE persistent world the camera moves over.

The bar:
- No beat begins with a card fading in. Every transition is a camera move on
  persistent content, or an object physically travelling.
- Objects that cross a boundary travel: the supplier request crosses the gap,
  the returned PDF crosses back, the two packets separate and exit toward
  their endpoints.
- Beat 4 is the ONLY moment the world widens. Do not spend that move elsewhere.
- Beat 3's caption ("It does not guess. It asks.") holds for its full 4
  seconds. The film breathes exactly once, here.
- Beats 1, 2 and 4 are fast and dense. Beats 3 and 6 hold.
- Vignette and blur ramp WITH the push, not after it.
- The stat line ticks 52 → 54 on screen at Beat 5. That tick is the supplier
  loop's numeric payoff — make it visible.

═══ PART 3 — the timing pass ═══

Render at 60fps, watch it, then fix what reads as mechanical. Hunt specifically
for:
  - beats of suspiciously uniform length
  - elements entering simultaneously that should be staggered
  - camera moves starting or stopping on the same frame as a state change
    (offset them 80–120ms — simultaneity is the single strongest tell)
  - any moment where the eye has nowhere to go
  - the pull-back at Beat 5 landing at the same instant the matrix finishes
    filling (it should land slightly after, so the eye follows the result)

Render the master. Report the path, the duration, and the file size.
Render with --muted; verify with ffprobe that no audio stream exists.
```

---

## Phase C prompt — cutdowns, encode, embed, and the Nax patch

```
Read Bible §6.

═══ 1 — compositions ═══
Add to film/src/Root.tsx:
  Master16x9   1920x1080 @60fps, 2700 frames
  Hero30       1920x1080 @60fps, 1800 frames — beats 0,1,2,4,6,7 compressed;
               beat 3 cut to 1.5s; beat 5 cut
  Social9x16   1080x1920 @60fps — beats 2, 4 and 7 only, reframed (not
               letterboxed: re-lay the world for vertical)

═══ 2 — encode ═══
Render Master to H.264 MP4 and VP9 WebM. Target under 8MB for the MP4.
Render with --muted. Verify with ffprobe that no audio stream exists on any
output. Report actual sizes. If the MP4 exceeds 8MB, re-encode the page cut
at 30fps (the master stays 60) and report both numbers.

═══ 3 — assets ═══
Poster frame from f1500 (mid-hero) → added-assets/tw-film-poster.jpg.
Place outputs in added-assets/ following the existing naming convention there
(see the existing "TW - KL - WEBVID" files).

═══ 4 — page embed ═══
In tradewatch.html, replace the <section class="tw-collaboration"> block
(HTML approx lines 6722-7097) with the video embed in Bible §6.

PRESERVE .tw-collab-fallback (approx lines 6735-6759) as the
prefers-reduced-motion fallback. Do not delete it — it is a better degraded
experience than a poster frame and removing it is a regression.

Play/pause via IntersectionObserver at 0.4 threshold. Never `autoplay` in
markup — it costs bandwidth on scroll-past.

Then remove the now-dead code:
  CSS  approx 992-2290
  JS   COLLABORATION_SCENES, COLLABORATION_MOBILE_ACTS,
       initCollaborationMotion (approx 7620-7921) and its call site in boot()

CRITICAL: tradewatch.html is 399KB. Do NOT read it whole — it will consume
most of your context and you will make worse edits than with less information.
Use sed with line ranges to inspect, and exact-string Edit calls to modify.

Verify: page loads, the Nax film (initAct4Film) is untouched and still runs,
reduced-motion fallback still renders. Report tradewatch.html byte size before
and after.

═══ 5 — the Nax film label patch ═══
The surviving 7-scene Nax film labels SB005 as a VALUE mismatch (Δ USD 150,
commercial invoice vs packing list). That attribution was deliberately
corrected in the backend: per
sector-watch/platform/backend/app/tradewatch/reconciliation/sb005.py, the real
ICEGATE codes are SB003 = GSTIN mismatch and SB005 = Invalid Invoice Number.
The new film shows the correct SB005, so the page now contradicts itself two
sections apart.

Find the scene-5 copy in SCENE_CONTENT (approx 7957-8069) and the DOM in
.tw-scene[data-scene="5"] (approx line 6423). Change the catch to the
invoice-number mismatch: EXP/2026/0042 (commercial invoice, Tally) vs
EXP-2026-0042 (shipping bill, ICEGATE) → SB005 · Invalid Invoice Number ·
BLOCKED.

Keep every other label, timing, class name and animation identical. This is a
copy patch, not a refactor. Do not touch initAct4Film's logic. Show the diff.
```

---

## Review gates

| After | What I check |
|---|---|
| A.1 | Does the push read as movement through space, or a rectangle scaling? Is the veil edge findable? Audio stripped? |
| B Part 1 | Any invented value, any numeric confidence, any Telegraf above 400, any stray vermilion, any timing baked into a component. |
| B Part 3 | The only gate that matters: does it read as a film? Uniform beat lengths and simultaneous entries are the tells. |
| C | File size, page weight delta, Nax film intact, reduced-motion fallback intact, no audio stream, diff is copy-only. |

## Still open

- **Nothing is committed.** Phase A left `feat/tw-film-v1` at the same SHA as main, and four fixture files modified but unstaged in sector-watch. Commit the fixture work separately from the film work — they are different repos and different review surfaces, and the fixture change touches tested backend code that someone may want to review on its own.
- **`oracle.py` was modified** in Phase A beyond the brief's literal scope. It looks correct and the determinism gate passes, but flag it in the fixture commit message so it is not a surprise in review.
- **Boundary statements remain legally unreviewed.** Beat 7's micro-lines derive from them. Before this is public-facing at scale, that counsel review is a hard requirement per the Deliverable Spec's own risk register.
