# TradeWatch Demo Film — Build Bible v1

**Replaces:** the `REQUEST 0147` collaboration block in `india-ai-tracker/tradewatch.html` (lines ~992–2290 CSS, ~6722–7097 HTML, ~7620–7921 JS).
**Does not touch:** the 7-scene Nax film (`initAct4Film`), except one surgical label patch in Phase 5.
**Authored:** 31 Jul 2026. Status: locked. Do not renegotiate these decisions mid-build.

---

## 0. Why the current animation fails

The existing block is eight independent cards, each entering with `gsap.fromTo(autoAlpha 0→1, y 18→0)` over a static layout, held for 2.0–2.8 seconds, then swapped. There is no camera, no cursor, no persistence of any object across a scene boundary. That is the definition of a slideshow. It cannot be rescued by tuning easings, because there is nothing continuous to ease.

Two structural changes make it a film:

1. **One world, one camera.** Every beat lives in a single large scene graph. Transitions are camera moves — push, pull, lateral track — never card swaps. Objects persist and travel; the viewer's eye is carried rather than reset.
2. **Causality on screen.** Something is detected, something is composed, something is authorised, something returns and closes the loop. Each beat is the consequence of the previous one. Slideshows have sequence; films have consequence.

---

## 1. Locked decisions

| Decision | Value |
|---|---|
| Domain spine | Two-packet flow (Shipping Bill Readiness → CHA; Marine Cargo Insurance → IRDAI broker) |
| Render target | Remotion → MP4 (+ WebM), embedded on the page |
| Scope | Replace the `REQUEST 0147` block only; Nax film survives |
| Hero beat | Agentic supplier loop — UN 38.3 Test Summary from the cell supplier |
| Runtime | 45 s, 1920×1080, 60 fps |
| Audio | **None.** No voice, no music, no sound design. Muted autoplay on scroll. |
| Register | Fast, peppy, upbeat — but institutional. No bounce, no neon, no elastic overshoot except the seal stamp. |
| Human on screen | Two cursor beats (~1.5 s each): approve supplier request, sign-and-seal |
| Flags | (1) SB005 invoice-number mismatch, (2) UN 38.3 unverified → UNCLEAR |
| Nax film | Patched to align its SB005 label (Phase 5) |

### Scope guardrail — what this film must never depict

Sourced from `TradeWatch_Intermediary_Boundary_Map_v1.md` §5 and `ClaudeDesign_PROMPT_TradeWatch_Demo_Video.md`. These are not style notes; they are legal exposure.

- **No preferential-origin / CoO origin assessment.** That workflow sits behind an open founder gate (`kanan-ops/founder_inbox/2026-07-16-coo-origin-scope-expansion.md`, status `OPEN`). The COO in this film is non-preferential, Chamber-of-Commerce issued, and appears only as one document among seven.
- **No filing.** TradeWatch never files a Shipping Bill, never touches ICEGATE or e-SANCHIT on the exporter's behalf. It prepares a packet *for* a licensed CHA.
- **No insurance advice.** Never names an insurer, never recommends an ICC clause variant, never says cover is adequate.
- **No numeric confidence anywhere on screen.** Doctrine 2: "Confidence is semantic, never numeric." Use OPEN / CONDITIONAL / BLOCKED / UNCLEAR and nothing else.
- **No autonomous outbound communication.** Nax *drafts*; a human authorises before anything leaves. This is why Beat 4b exists.
- **Vocabulary:** use *deterministic, audit-ready, defensible, source-linked, reconciled, prepared*. Never *court-ready, black box, automated clearance, guaranteed compliance, zero-touch*.
- **Verb discipline:** review / observe / evaluate / cross-check / flag / compile / draft / prepare. Not audit / judge / certify / file / authorise-on-behalf / advise.

---

## 2. Canonical dataset — do not invent a single value

Source of truth: `sector-watch/platform/backend/tests/fixtures/golden_bundle_v1/` (`bundle_data.py`, `README.md`, `expected_outcomes.json`). Four mutually inconsistent demo datasets exist across the repo; this is the only one that is machine-generated, deterministic and smoke-tested.

| Field | Value |
|---|---|
| Shipment | `SHIP-2026-001` (display) / `ship.golden.hs850760.in-eu.v1` (internal) |
| Exporter | Voltcore Energy Cells India Pvt. Ltd., Chakan, Pune 410501 |
| GSTIN / IEC | `27ABCCV1234F1ZL` / `ABCCV1234F` |
| Buyer | EuroVolt Mobility GmbH, Hafenstrasse 22, 20457 Hamburg |
| Lane | Nhava Sheva `INNSA` → Hamburg `DEHAM`, CIF Hamburg |
| Commodity | Lithium-ion cells (NMC) 3.7 V 5000 mAh, EV traction-pack grade |
| HS | `8507.60.00` |
| Quantity | 5,000 NOS @ USD 12.00 |
| Values | FOB 60,000.00 · Freight 2,750.00 · Insurance 313.00 · **CIF 63,063.00** |
| Sum insured | 69,369 (CIF × 1.10 = 69,369.30; certificate rounds down) |
| Vessel / BL | `MV NORDIC EXPRESS V.214W` / `MAEU-NSAHAM-77310` |
| COO / COI | `COO/IN/2026/55217` / `MCC/2026/0042` |
| Dates | CI 20-Feb-2026 · SB 25-Feb-2026 · BL on-board 28-Feb-2026 |
| Scheme flag | `RODTEPY` |
| Reviewer of record | Kavya Reddy *(as built in the product demo)* |

**The SB005 trap, verbatim from the fixture:** commercial invoice raised in Tally as `EXP/2026/0042`; re-keyed on the Shipping Bill in ICEGATE hyphen format as `EXP-2026-0042`. The `code_upper` normalizer preserves separators, so `/` ≠ `-` → **SB005 · Invalid Invoice Number · BLOCKED**. The SB cannot be amended after EGM, so the IGST refund is forfeited.

### Two values the fixture does not yet contain

These must be **added to the fixture first**, not invented in the film. Phase 1 opens with this.

1. **Cell supplier identity.** The UN 38.3 loop needs a named counterparty. Propose `Anode Cell Systems Pvt. Ltd., Hosur` — but add it to `bundle_data.py` as the manufacturer of record for the cell, so the film and the backend agree.
2. **UN 38.3 return payload.** Two fields: `watt_hours_per_cell` and `test_report_reference`. Propose `18.5 Wh` and `T-2025-11-4471`. Same rule: land them in the fixture first.

### The field count

Do **not** use "22 fields" (marketing storyboard) or "24" (design doc) — they contradict each other. Run the fixture, count the extracted `FieldObservation` records across the seven documents, and use that number. If it can't be run, render the film with a `{{FIELD_COUNT}}` token and fill it before final render. A wrong number here is exactly the kind of thing a domain-literate viewer catches.

---

## 3. Visual system

**Use the page's live tokens, not the older storyboard hex.** The film embeds inches away from the Nax film on the same page; a palette mismatch will read as a mistake. Storyboard values `#002448 / #FCF0CC / #D84824` are superseded.

```
--navy          #0a2f52     --navy-deep     #061f38
--cream         #eeebe3     --rule          rgba(10,47,82,.12)
--vermilion     #db4a2b     --ink           rgba(10,47,82,.90)
--ink-dim       rgba(10,47,82,.52)          --slate  #94a3b8

Four-state (fixed, no substitutions):
OPEN         #1f7b54        CONDITIONAL   #b07512
BLOCKED      #c0392b        UNCLEAR       #5c6e82
```

Vermilion is the **single reserved hero accent**. It marks scan sweeps, the active cursor target, and nothing else. It is never UI chrome.

**Type**
- Cormorant Garamond — display and Nax's speaking register (captions, headlines)
- Telegraf Regular — all working UI. **Never synthesized bold.** Hierarchy comes from size, case and tracking only.
- IBM Plex Mono — invoice numbers, HS codes, hashes, rule IDs. Anything that must be read character-exact.

**Radius ladder:** stamp 2px · pill 6px · chip 8px · card 12px · frame 18px.

**Master easing:** `cubic-bezier(0.22, 1, 0.36, 1)` for every camera move and state change. The seal stamp is the one overshoot in the film: `scale 0.82 → 1.04 → 1.0` over 520 ms.

**AuthorityMark glyphs** (from the built demo — use them, they are the strongest single design idea in the corpus):
`◆` signed (solid navy) · `◇` qualified (hairline outline) · `◌` computed, unsigned (dashed, faint).

---

## 4. Camera language — the non-negotiables

This section is the difference between the new film and the old one. Treat every line as a hard rule.

1. **One continuous world.** All seven documents, the readiness matrix, the packet tray and the supplier surface exist in a single coordinate space from frame 0. The camera reveals them; they are never created by a card swap.
2. **No cross-dissolves between beats.** Two exceptions only: the cold-open fade in, and the end card.
3. **Push-ins:** scale 1.0 → 1.9 maximum. Every push is paired with a vignette — non-focal content drops to 12% opacity and takes a 6–10 px blur. Focus is subtractive, not additive.
4. **Reframe duration:** 450–700 ms. At 45 seconds nothing may take longer.
5. **Motion blur on reframes only.** Use Remotion's shutter-angle / `<CameraMotionBlur>` on camera moves faster than 1.4× scale-per-second. Never on text.
6. **Cursor timing (peppy variant):** travel 380 ms → hover 140 ms → press 120 ms → ripple → response. The existing Nax film uses 560/220/160; we are 30% faster.
7. **Typing:** 12 ms per character. The existing film uses 16 ms.
8. **Objects travel, they do not teleport.** The supplier request physically crosses the gap. The returned PDF physically crosses back. The two packets physically separate and exit toward their endpoints.
9. **One expansion move only.** Beat 4 is the single moment the world gets wider (the supplier surface enters from the right). Spending this move anywhere else weakens the hero.
10. **Numbers count up; states flip; nothing bounces** — except the seal.

---

## 5. Shot list — 45 s @ 60 fps (2700 frames)

### Beat 0 · Cold open — `f0–240` (0:00–0:04)
Wide, camera at 1.0, imperceptible 2% drift-in. Workspace at rest.
Chrome reads: `TradeWatch · SHIP-2026-001 · Voltcore Energy Cells → EuroVolt Mobility GmbH · Nhava Sheva → Hamburg`.
Caption (Cormorant, lower left): **09:31 · Seven documents arrive.**
Seven document cards sit unclassified in the intake column, greyed.

### Beat 1 · Intake and the scan wall — `f240–780` (0:04–0:13) — 9 s
Camera pushes to **1.18** on the intake column, then tracks laterally down the list.
Each card, staggered 90 ms apart: filename appears → vermilion scan sweep crosses it (380 ms) → classification chip and field count snap in.

```
Commercial_Invoice_EXP-2026-0042.pdf   → Commercial Invoice        ◆  n fields
Packing_List_VOLT-PL-0042.pdf          → Packing List              ◆  n fields
BL_MAEU-NSAHAM-77310.pdf               → Bill of Lading            ◆  n fields
SB_Draft_INNSA_2026-02-25.pdf          → Shipping Bill (draft)     ◆  n fields
COO_IN_2026_55217.pdf                  → Certificate of Origin     ◆  n fields   [non-preferential]
COI_MCC_2026_0042.pdf                  → Insurance Certificate     ◆  n fields
UN38_3_Test_Summary.pdf                → UN 38.3 Test Summary      ◌  0 verified  ← UNCLEAR, slate
```

Five land green and fast. The Shipping Bill card lands green, then — a beat later, after reconciliation runs — flips to **BLOCKED** crimson. The UN 38.3 card never goes green; it lands slate.
Stat line ticks up: `7 documents · n fields · source-linked`.
Caption: **Classified deterministically. Every field linked to page, line and bounding box.**

### Beat 2 · The SB005 catch — `f780–1200` (0:13–0:20) — 7 s
Hard push to **1.9**. Everything outside the two panes drops to 12% and blurs 8 px.

Two panes, IBM Plex Mono, large:
```
Commercial Invoice · Tally · p1        EXP/2026/0042
Shipping Bill draft · ICEGATE · p1     EXP-2026-0042
```
The `/` and the `-` isolate and scale to 1.6×, vermilion. MatchGlyph shows **≠** in oxblood between them.

Chip: `ICEGATE SB005 · Invalid Invoice Number · BLOCKED`
Consequence line, Cormorant: **The Shipping Bill cannot be amended after EGM. The IGST refund is forfeited.**

Resolution (no full cursor ceremony — 900 ms): Nax's prepared correction types in below; a reviewer chip slides in — `Reviewer: K. Reddy · re-key error at ICEGATE entry · 09:44` — and the MatchGlyph flips **≠ → =** with the stamp easing. Card goes green.

> This honours Doctrine 4 (friction-by-design: every override carries a reason, a reviewer, a timestamp) without spending a third cursor beat we don't have.

### Beat 3 · UNCLEAR, not guessed — `f1200–1440` (0:20–0:24) — 4 s
Pull back to 1.0, then push **1.4** onto the UN 38.3 row.
Rule card: `L2-R03 · Li-ion UN 3480 · IMDG Section IA · Wh-threshold trigger` — state **UNCLEAR** (slate).
Missing-input line, enumerated: `Test summary registered · no verified Wh observation`.
Caption, held: **It does not guess. It asks.**

This is the thematic hinge. Give it the full 4 s and let the caption breathe.

### Beat 4 · The supplier loop — HERO — `f1440–2040` (0:24–0:34) — 10 s
The one expansion move. Camera pulls and pans right; a second surface slides in — the supplier side — so both are on screen with a visible gap between them.

**4a · Nax composes (2.5 s).** Mono text types into a request card at 12 ms/char:
```
To          Anode Cell Systems Pvt. Ltd. · Hosur
Requested   UN 38.3 Test Summary — cell NMC-5000-37
Required for  IMDG Section IA verification · marine cargo cover
Scope       Linked to SHIP-2026-001 only
```
Note the request states *why* — that is the product's manners, and it reads on screen.

**4b · HUMAN BEAT 1 (1.5 s).** Cursor travels in (380 ms), hovers `Approve and send`, presses, ripple. Chip: `Approved · A. Sreenath · 09:47`. The card lifts and fires right.

**4c · The supplier responds (3 s).** The request crosses the gap. On the supplier surface, a compact agentic responder resolves it: locates the cell record, attaches `UN38_3_TestSummary_NMC5000.pdf`, returns. Keep this surface deliberately plain — it is someone else's system, not ours.

**4d · The loop closes (3 s).** The PDF crosses back, auto-classifies, takes a scan sweep, and two fields extract with provenance pins:
```
Watt-hours per cell    18.5 Wh          ◆  p2 · bbox
Test report reference  T-2025-11-4471   ◆  p1 · bbox
```
The `L2-R03` card flips **UNCLEAR → OPEN**, slate to green.
Caption across the gap: **One request. Source-linked. Rule closed.**

### Beat 5 · Readiness resolves — `f2040–2280` (0:34–0:38) — 4 s
Pull to **0.92** — slightly wider than the opening, the "it's all in view now" move.
Readiness matrix fills in a fast cascade, rows flipping green left to right.
Aggregate chip: **PASS**. Defensibility floor: `full`. Override log: `1`.
Stat: `7 documents · n fields · 1 override recorded · 0 unclear`.

### Beat 6 · Seal — `f2280–2520` (0:38–0:42) — 4 s
Push **1.5** onto the seal surface.
**HUMAN BEAT 2:** cursor to `Sign and seal`, press.
The stamp: `scale 0.82 → 1.04 → 1.0`, 520 ms, master easing. Two certificate badges impact.
Hash scrambles in mono and settles: `8a7f29c4…b4f6a8`.
Line: `Kavya Reddy · 10:14 IST · 25 Feb 2026 · SHA-256 sealed · no further edits possible`.

### Beat 7 · Dual dispatch and end card — `f2520–2700` (0:42–0:45) — 3 s
Pull wide. The two packets separate and travel to opposite endpoints.
```
Packet 01 · Shipping Bill Readiness  →  your licensed Customs House Agent
Packet 02 · Marine Cargo Insurance   →  your IRDAI-registered broker
```
Micro-line under each, small, ink-dim: `Prepared for filing by your CHA. TradeWatch does not file.` / `Prepared for your registered broker. TradeWatch does not place cover.`

End card (the one permitted dissolve): **TradeWatch** wordmark in Cormorant over navy, rule in vermilion, sub-line *Trade intelligence infrastructure for a contested world.*

---

## 6. Technical architecture

```
india-ai-tracker/
  film/                              ← new Remotion workspace, isolated
    remotion.config.ts
    src/
      Root.tsx                       ← compositions: Master16x9, Hero30, Social9x16
      Film.tsx                       ← the sequence spine, 2700 frames
      camera/
        Camera.tsx                   ← the rig: scale + x/y + vignette + blur
        useCameraTrack.ts            ← keyframe interpolation, master easing
        MotionBlur.tsx
      world/
        World.tsx                    ← the single persistent scene graph
        IntakeColumn.tsx  DocumentCard.tsx  ScanSweep.tsx
        MatchPane.tsx     MatchGlyph.tsx    RuleCard.tsx
        SupplierSurface.tsx  RequestCard.tsx
        ReadinessMatrix.tsx  SealSurface.tsx  PacketTray.tsx
      chrome/  Cursor.tsx  Caption.tsx  StatLine.tsx  AuthorityMark.tsx
      data/    shipment.ts           ← the ONLY place values live; mirrors the fixture
      design/  tokens.ts  type.ts    ← imported, never hardcoded
  added-assets/
    tw-film-45s.mp4                  ← H.264 + HEVC pair, matching existing convention
    tw-film-45s.webm
    tw-film-poster.jpg
```

**Page embed** replaces the `.tw-collaboration` section:
```html
<video class="tw-film" poster="added-assets/tw-film-poster.jpg"
       muted playsinline loop preload="none" disablepictureinpicture>
  <source src="added-assets/tw-film-45s.webm" type="video/webm">
  <source src="added-assets/tw-film-45s.mp4"  type="video/mp4">
</video>
```
Play/pause driven by IntersectionObserver at 0.4 threshold (never `autoplay` in markup — it costs bandwidth on scroll-past). `prefers-reduced-motion` → show the poster frame and the existing three-act static fallback, which already exists at lines 6735–6759 and should be preserved.

**Budget:** keep the MP4 under 8 MB. At 45 s / 1080p60 that is roughly 1.4 Mbps — achievable because the content is flat colour and type, which encodes extremely well. Verify before shipping; if it overruns, drop the page cut to 30 fps (the master stays 60).

---

## 7. Build phases and the prompts to run

Run these in Claude Code, in the `india-ai-tracker` repo, on branch `feat/tw-film-v1`. Give the agent this Build Bible as a file it can read — do not paste it into the prompt.

### Model assignment

| Phase | Model | Why |
|---|---|---|
| 0 · Spec | **Opus** — done, this document | Cross-document synthesis under legal and brand constraints. Judgment, not typing. |
| 1 · Fixture + rig | **Opus** | The camera rig decides whether this is a film or a slideshow. It is the one piece where taste is load-bearing. |
| 2 · Scene components | **Sonnet**, fanned out | Eight self-contained components against a locked spec. Mechanical, parallelisable, and Sonnet is faster and cheaper without being worse here. |
| 3 · Choreography pass | **Opus** | Timing, holds, vignette curves, the feel. This is where the quality actually lands. |
| 4 · Render + embed | **Sonnet** | Encoding flags, file plumbing, one HTML swap. |
| 5 · Nax film patch | **Sonnet** | Surgical text edits at known line numbers. |
| Review after each phase | **Opus** (me) | Checking against the bible and the guardrails. |

**Rule of thumb for you:** Opus where a wrong judgment call is expensive to discover later; Sonnet where the answer is already written down and the work is execution. Running Opus on Phase 2 wastes money; running Sonnet on Phase 3 costs you the film.

**Context warning:** `tradewatch.html` is 399 KB. Never let an agent read it whole — it will consume most of a context window and produce worse edits. Phases 4 and 5 must use `sed`/`grep` with line ranges, and edit by exact-string match.

---

### Phase 1 prompt — fixture reconciliation + camera rig (Opus)

```
Read docs/tradewatch-film/TradeWatch_Film_Build_Bible_v1.md in full before doing anything.

Two tasks, in order.

TASK A — close the fixture gaps.
In the sector-watch repo at /Users/sreenathgovindarajan/Documents/sector-watch,
read platform/backend/tests/fixtures/golden_bundle_v1/bundle_data.py and
expected_outcomes.json. Then:
1. Report the exact count of extracted field observations across the seven
   documents. This is the film's field number. Do not estimate it.
2. Add the cell supplier as a named entity (proposed: Anode Cell Systems Pvt.
   Ltd., Hosur) and the UN 38.3 return payload (watt_hours_per_cell 18.5,
   test_report_reference T-2025-11-4471) to the fixture, following the file's
   existing conventions exactly. Run the determinism gate (generate.py --verify).
3. Write film/src/data/shipment.ts as a typed export mirroring the fixture
   values verbatim. Every string that appears on screen comes from this file.
   No value may be duplicated anywhere else in the codebase.

TASK B — build the camera rig.
Scaffold a Remotion workspace at india-ai-tracker/film/ (Node 22, React 19
already present in the repo). Then build ONLY these, and build them well:

- design/tokens.ts and design/type.ts, from Bible §3. Every colour and font
  reference in the entire film resolves through these.
- camera/Camera.tsx — a rig that takes {scale, x, y, focusRect} and applies:
  a transform on a single persistent child scene graph; a vignette that drops
  non-focal content to a configurable opacity; and a blur on the out-of-focus
  plane. It must be capable of a 1.0 → 1.9 push with the focus subtracting
  attention from everything else, per Bible §4.3.
- camera/useCameraTrack.ts — keyframe interpolation on the master easing
  cubic-bezier(0.22, 1, 0.36, 1), driven by frame number.
- camera/MotionBlur.tsx — applied to reframes faster than 1.4x scale/second,
  never to text.
- chrome/Cursor.tsx — travel 380ms, hover 140ms, press 120ms, ripple. Takes a
  target element ref and a timeline position.

Prove it: build a 6-second throwaway composition that pushes from a wide shot
into a single mono string and back out, with the vignette and blur working.
Render it to MP4 and tell me the path. Do not build any scene content yet.

Constraints: no hardcoded colours or fonts. No audio. Nothing may bounce.
```

### Phase 2 prompt — scene components (Sonnet, fan out)

```
Read docs/tradewatch-film/TradeWatch_Film_Build_Bible_v1.md and
film/src/data/shipment.ts before starting.

Build the world components listed in Bible §6 under film/src/world/ and
film/src/chrome/. Each is a pure presentational React component driven by a
`progress` prop (0..1) — they must NOT own timing. Timing is assigned in
Phase 3. Each must render correctly at any frozen progress value.

Build these, one per component, following Bible §5 for exact on-screen copy:
  IntakeColumn, DocumentCard, ScanSweep, MatchPane, MatchGlyph, RuleCard,
  SupplierSurface, RequestCard, ReadinessMatrix, SealSurface, PacketTray,
  Caption, StatLine, AuthorityMark

Hard rules:
- Every value on screen imports from data/shipment.ts. If a value you need is
  not there, stop and ask — do not invent it.
- Every colour and font imports from design/tokens.ts and design/type.ts.
- Telegraf Regular only. Never font-weight above 400 on Telegraf.
- IBM Plex Mono for: invoice numbers, HS codes, hashes, rule IDs, bbox refs.
- No numeric confidence percentages anywhere. States are OPEN / CONDITIONAL /
  BLOCKED / UNCLEAR only.
- Vermilion (--vermilion) appears ONLY on scan sweeps and the active cursor
  target. Nowhere else.
- The seal stamp is the only overshoot: scale 0.82 → 1.04 → 1.0 over 520ms.

For each component write a Remotion Still so I can review it in isolation.
Report the list of stills when done.
```

### Phase 3 prompt — choreography (Opus)

```
Read docs/tradewatch-film/TradeWatch_Film_Build_Bible_v1.md §4 and §5 closely.
The components exist and are correct in isolation. Your job is the film.

Build film/src/Film.tsx: 2700 frames at 60fps, the seven beats at the exact
frame ranges in Bible §5, assembled into ONE persistent world with the camera
moving over it.

The bar you are being held to:
- No beat may begin with a card fading in. Every transition is a camera move
  on persistent content, or an object physically travelling.
- Objects that cross a boundary must travel: the supplier request crosses the
  gap, the returned PDF crosses back, the two packets separate and exit.
- Beat 4 is the only moment the world widens. Do not spend that move elsewhere.
- Beat 3's caption ("It does not guess. It asks.") gets a full held 4 seconds.
  It is the thematic hinge and the film breathes exactly once, here.
- Beats 1, 2 and 4 are fast and dense. Beats 3 and 6 hold.
- Vignette opacity and blur ramp WITH the push, not after it.

Then do a timing pass. Render at 60fps, watch it, and fix what reads as
mechanical. Specifically hunt for: uniform beat lengths, simultaneous element
entries that should be staggered, camera moves that start and stop at the same
instant as a state change (offset them 80–120ms), and any moment where the eye
has nowhere to go.

Render the master and tell me the path. I will review against the bible.
```

### Phase 4 prompt — render pipeline and page embed (Sonnet)

```
Read Bible §6.

1. Add compositions to film/src/Root.tsx:
   - Master16x9  1920x1080 @60fps, 2700 frames
   - Hero30      1920x1080 @60fps, beats 0-2 and 4-7 compressed to 1800 frames
   - Social9x16  1080x1920 @60fps, beats 2, 4 and 7 only, reframed
2. Render Master to H.264 MP4 and VP9 WebM. Target under 8MB for the MP4.
   Report actual sizes. If over budget, re-encode at 30fps and report both.
3. Extract a poster frame from f1500 (mid-hero) to added-assets/tw-film-poster.jpg.
4. Place outputs in added-assets/ following the existing naming convention
   there (see the existing TW - KL - WEBVID files).
5. In tradewatch.html, replace the <section class="tw-collaboration"> block
   (HTML approximately lines 6722-7097) with the video embed in Bible §6.
   PRESERVE the .tw-collab-fallback markup (approx lines 6735-6759) as the
   prefers-reduced-motion fallback.
6. Remove the now-dead CSS (approx 992-2290) and JS (COLLABORATION_SCENES,
   COLLABORATION_MOBILE_ACTS, initCollaborationMotion — approx 7620-7921, plus
   its call site in boot()).

CRITICAL: tradewatch.html is 399KB. Do NOT read it whole. Use sed with line
ranges to inspect, and exact-string Edit calls to modify. Verify the page still
loads and the Nax film (initAct4Film) is untouched and still works.

Report the byte size of tradewatch.html before and after.
```

### Phase 5 prompt — Nax film label patch (Sonnet)

```
In india-ai-tracker/tradewatch.html, the surviving 7-scene Nax film labels
SB005 as a VALUE mismatch (Δ USD 150 between commercial invoice and packing
list). That attribution was deliberately corrected in the backend: per
sector-watch/platform/backend/app/tradewatch/reconciliation/sb005.py, the real
ICEGATE codes are SB003 = GSTIN mismatch and SB005 = Invalid Invoice Number.
The new film shows the correct SB005, so the page currently contradicts itself.

Find the scene-4/scene-5 copy in the SCENE_CONTENT array (approx lines
7957-8069) and the corresponding DOM in the .tw-scene[data-scene="5"] block
(approx line 6423). Change the catch from a value mismatch to the invoice-number
mismatch: EXP/2026/0042 (commercial invoice, Tally) vs EXP-2026-0042 (shipping
bill, ICEGATE), labelled SB005 · Invalid Invoice Number · BLOCKED.

Keep every other label, timing, class name and animation identical. This is a
copy patch, not a refactor. Do not touch initAct4Film's logic.

Use sed to inspect line ranges. Do NOT read the file whole. Show me the diff.
```

---

## 8. Review gates

I check each phase before the next starts. What I check for:

| After | Gate |
|---|---|
| Phase 1 | Does the 6 s proof-of-motion actually feel like a camera, or like a CSS scale? Is the field count real? |
| Phase 2 | Any invented value, any numeric confidence, any synthesized bold, any stray vermilion. |
| Phase 3 | The only gate that matters: does it read as a film? Uniform beat lengths and simultaneous entries are the tells. |
| Phase 4 | File size, page weight delta, Nax film intact, reduced-motion fallback intact. |
| Phase 5 | Diff is copy-only. No logic touched. |

## 9. Open risks

- **Fixture edits touch a tested backend.** Phase 1 Task A modifies `bundle_data.py`, which has a determinism gate and downstream tests. If `generate.py --verify` fails, stop and bring it to me rather than forcing it.
- **The cell supplier name is new.** Once it's in the fixture it becomes canon across four demos. Worth thirty seconds of thought before committing to `Anode Cell Systems`.
- **Boundary statements are legally unreviewed.** The Deliverable Spec flags that no IRDAI or customs counsel has reviewed them. The film's micro-lines in Beat 7 are derived from them. Before this goes public-facing at scale, that review is a hard requirement, not a nice-to-have.
- **`prefers-reduced-motion` users get a poster frame.** That is a downgrade from today's three-act static fallback. Phase 4 preserves the fallback markup specifically so this doesn't regress — verify it.
