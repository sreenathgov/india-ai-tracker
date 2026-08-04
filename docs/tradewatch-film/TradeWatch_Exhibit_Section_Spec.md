# Phase C (revised) — The Evidence Exhibit section

Replaces `.tw-collaboration` on `tradewatch.html` entirely. Companion to `TradeWatch_Film_Build_Bible_v1.md`.

---

## 1. What's being replaced and what survives

The existing `.tw-collaboration` section is a full-bleed navy band with a masked hairline grid, cream text and a 1240px inner. **That shell is correct — keep it.** What goes is everything inside it: the 8-step ledger rail, the integration chips, the eight scene articles, the mobile 3-act variant, and all of `initCollaborationMotion`.

Rename the section to `.tw-exhibit` so the new structure isn't carrying the old block's class names.

**Values to preserve verbatim from the old CSS (lines ~997–1023):**

```
background            var(--tw-navy)
color                 var(--tw-cream)
border-top            1px solid rgba(238, 235, 227, 0.12)
border-bottom         1px solid rgba(238, 235, 227, 0.14)
padding               clamp(5.25rem, 10vh, 8.75rem) clamp(1.25rem, 4vw, 4rem) clamp(5.75rem, 11vh, 9rem)
inner max-width       1240px
grid overlay          two linear-gradients, rgba(238,235,227,0.038), 56px 56px,
                      radial mask: ellipse at 52% 54%, black 22%, transparent 86%
eyebrow               var(--tw-mono), 0.62rem, 700, letter-spacing 0.26em, uppercase, var(--tw-red)
status chip           0.38rem 0.55rem 0.34rem, cream 0.64, 1px border cream 0.2, tracking 0.13em
```

Note the resonance worth preserving deliberately: the section's 56px hairline grid and the film's own background depth plane are the same visual language. Position the exhibit so the two grids read as continuous — the film should look like a window cut into the section, not a video pasted on top of it.

---

## 2. Layout

Asymmetric two-column at ≥1024px. Text left, exhibit right.

```
grid-template-columns: minmax(0, 0.62fr) minmax(0, 1fr);
gap: clamp(2.5rem, 5vw, 5rem);
align-items: start;
```

Below 1024px: stack — text block, then exhibit full width.

### Left column, in order

**Eyebrow** (mono, vermilion): `ONE SHIPMENT · END TO END`
**Status chip** (bordered, cream 0.64): `Design-partner workflow`

**Headline** (Cormorant Garamond, the section's h2):
> Agentic collaboration across your value chain.

**Body** (Telegraf Regular, cream ~0.78, max ~46ch):
> TradeWatch works the shipment end to end — classifying documents, reconciling them against the applicable requirement, and requesting what is missing from the party who holds it. Your team authorises every outbound request and signs before anything is released.

> *That second sentence is load-bearing, not filler. The headline claims agency; this is what keeps the claim inside the boundary. Nax drafts and prepares; humans authorise and sign. Do not cut it, and do not soften it into a footnote.*

**Ledger** (below the body, generous space above — reads as a caption set, not a competing column). Four rows, mono left / cream-dim right, hairline rules between:

```
01   Seven documents classified        52 fields · source-linked
02   One mismatch caught               SB005 · invoice number
03   One answer missing                asked, not assumed
04   Two packets sealed                CHA · marine broker
```

The ledger exists for a specific reason: a silent film that autoplays needs the page to tell a scroll-past visitor why to stop. Four lines do that without narrating over the film. Keep it static — no JS, no animation on these rows.

---

## 3. The exhibit object

A cream page holding the video, framed as a dossier exhibit.

```
┌─ EXHIBIT A ─────────────────────────────────┐   ← tab breaks the border line
│                                    SILENT·45s│
│                                              │
│            [ the film · 16:9 ]               │
│                                              │
│ ──────────────────────────────────────────── │   ← vermilion hairline
│ SHIP-2026-001 · Voltcore Energy Cells →       │
│ EuroVolt Mobility GmbH · Nhava Sheva → Hamburg│
│ Synthetic shipment · no real party            │
└──────────────────────────────────────────────┘
```

**Frame**
- Background `var(--tw-cream)`, radius 18px (frame tier of the ladder)
- Hairline border `1px solid rgba(238, 235, 227, 0.28)`
- Soft lift: `0 28px 60px -30px rgba(0,0,0,0.55)`
- Inner padding `clamp(0.75rem, 1.4vw, 1.15rem)`

**The corner tab** — the detail that makes this an exhibit rather than a video card. A small mono label sitting *on* the top border so it visually breaks the frame line, the way a tabbed divider breaks a dossier edge.
- Text `EXHIBIT A`, IBM Plex Mono, 0.58rem, letter-spacing 0.22em, uppercase
- Colour `var(--tw-red)`, background `var(--tw-cream)`, padding `0.2rem 0.5rem`
- Positioned `top: -0.55rem; left: 1.5rem` with the frame's border showing either side

**State chip**, top-right, opposite the tab: `SILENT · 45s`, mono, ink-dim. Tells the visitor there's no audio before they go looking for a mute button.

**Provenance slug**, beneath the video, inside the frame, above a vermilion hairline rule:
- Line 1: `SHIP-2026-001 · Voltcore Energy Cells → EuroVolt Mobility GmbH · Nhava Sheva → Hamburg`
- Line 2, dimmer: `Synthetic shipment · no real party · prepared for demonstration`

Line 2 is the synthetic-data disclosure. Putting it in the exhibit's own provenance line rather than a footnote is on-doctrine — the built demo's design principle is that *the system discloses its own simulation boundary, in-product, unprompted*. It reads as rigour here, not as a disclaimer.

---

## 4. Behaviour

- **Play/pause** via IntersectionObserver at `0.4` threshold. Never `autoplay` in markup.
- `muted playsinline loop preload="none"`, poster set.
- **No player chrome by default.** On hover or focus, a minimal mono `PAUSE` / `PLAY` affordance fades in bottom-right *inside* the frame. No large centre play button — it would compete with the film's own composition.
- **Click anywhere on the exhibit** toggles play/pause. Keyboard: the exhibit is focusable, Space and Enter toggle.
- **`prefers-reduced-motion`**: do not autoplay. Show the poster with the `PLAY` affordance persistent, and keep the existing `.tw-collab-fallback` three-act static markup (old lines ~6735–6759) as the described-workflow fallback beneath it. That fallback is a better degraded experience than a poster alone — preserve it, restyled to the new section.

---

## 5. Encode — this is currently blocking

`film/out/tw-film-45s-v2.mp4` is **12.35 MB**. The bible ceiling is 8 MB. Current bitrate 2248 kbps against a 1456 kbps budget.

The content is flat colour and type, which encodes extremely well, so this is comfortably reachable:

1. **VP9 WebM first** in source order — typically 25–35% smaller than H.264 at matched quality on this kind of content. Two-pass, target ~1100 kbps.
2. **H.264 MP4** as fallback. Two-pass at ~1350 kbps, `-preset slower`, `-profile:v high`, `-movflags +faststart`.
3. Both `-an` — verify with ffprobe that neither output has an audio stream.
4. If 60 fps won't fit the budget at acceptable quality, drop the **web cut** to 30 fps. Keep the 60 fps master on disk for the sales/investor version. Report both numbers rather than silently choosing.
5. **Poster** from a frame in the hero beat (around f1700, mid supplier loop) → `added-assets/tw-film-poster.jpg`, plus an `.avif` if the existing `kanan-hero-poster.avif` pattern is worth matching.

Place outputs in `added-assets/` following the existing `TW - KL - WEBVID` naming convention already there.

---

## 6. Build prompt

```
Read docs/tradewatch-film/TradeWatch_Exhibit_Section_Spec.md and
docs/tradewatch-film/TradeWatch_Film_Build_Bible_v1.md §3 and §6.

Work on feat/tw-film-v1 in india-ai-tracker.

═══ 1 — ENCODE ═══
film/out/tw-film-45s-v2.mp4 is 12.35MB against an 8MB ceiling. Re-encode per
spec §5: VP9 WebM (~1100kbps two-pass) and H.264 MP4 (~1350kbps two-pass,
preset slower, +faststart). Both with -an. Verify with ffprobe that neither
has an audio stream. If 60fps cannot meet budget at acceptable quality, drop
the web cut to 30fps, keep the 60fps master, and REPORT BOTH SIZES rather
than choosing silently.

Extract the poster from ~f1700 (mid supplier loop) → added-assets/
tw-film-poster.jpg. Place all outputs in added-assets/ following the existing
"TW - KL - WEBVID" naming convention.

Give every render a unique filename — a version suffix or short content hash.
Reusing one path caused a stale-cache misread earlier in this build.

═══ 2 — THE SECTION ═══
Replace <section class="tw-collaboration"> (HTML approx 6722-7097) with the
new .tw-exhibit section per spec §2, §3 and §4.

KEEP the band shell values listed in spec §1 verbatim — background, borders,
padding, inner max-width, and the 56px masked hairline grid overlay. Position
the exhibit so the section grid and the film's own background grid read as
continuous.

PRESERVE the .tw-collab-fallback markup (approx 6735-6759) as the
reduced-motion fallback, restyled to the new section. Do not delete it.

Copy is in spec §2 and §3 — use it exactly. In particular do not cut or
soften the second body sentence about authorisation; it is what keeps the
headline inside the product's stated boundary.

Then remove the dead code:
  CSS  approx 992-2290 (all .tw-collab-* rules)
  JS   COLLABORATION_SCENES, COLLABORATION_MOBILE_ACTS,
       initCollaborationMotion (approx 7620-7921) and the boot() call site

CRITICAL: tradewatch.html is 399KB. Do NOT read it whole. Use sed with line
ranges to inspect and exact-string Edit calls to modify.

═══ 3 — VERIFY ═══
- page loads; the Nax film (initAct4Film) is untouched and still runs
- exhibit plays on scroll-in, pauses on scroll-out, click and keyboard toggle
- reduced-motion path shows poster + fallback, does not autoplay
- no audio stream on any output
- report tradewatch.html byte size before and after, and total page weight delta
```

---

## 7. Open

- **"Agentic" appears in the headline directly below `tw-difference`'s "Agentic. Traceable. Defensible."** Survivable because the two sections look nothing alike — one is cream and abstract, one is navy and demonstrative. Worth a look on the live page before merge; if it reads as a repeat, the fix is the eyebrow, not the headline.
- **Still uncommitted** across three phases and two repos.
- **Boundary statements remain legally unreviewed** per the Deliverable Spec's own risk register. The provenance slug's "synthetic shipment · no real party" line helps, but it is not a substitute for that review before this is public-facing at scale.
