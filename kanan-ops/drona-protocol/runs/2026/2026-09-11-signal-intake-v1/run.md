# Drona Protocol Run — Signal Intake v1

Parent run: `kanan-main`'s
`kanan-ops/drona-protocol/runs/2026/2026-09-10-ceo-intelligence-brief-redesign/`

**Workstream**: 1 of 4, Continuous Intelligence architecture
**Repo**: `india-ai-tracker`
**Date**: 2026-09-11
**Design spec**: [docs/superpowers/specs/2026-09-11-signal-intake-design.md](../../../../docs/superpowers/specs/2026-09-11-signal-intake-design.md)

## Mandate

Build a new, separate capture layer for global trade-policy / export-control
/ trade-finance / supply-chain / ESG / market / AI-governance signals,
reusing the RSS-ingestion *pattern* from the existing India AI Tracker
scraper (not its source list, scrapers, or filters), without touching or
sharing state with that pipeline.

## Decisions

- **No convention existed** in this repo for `kanan-ops/` or
  `drona-protocol/` prior to this run — this run record establishes it
  fresh under `kanan-ops/drona-protocol/runs/YYYY/`.
- **Module location**: fully separate top-level directory `/signal-intake/`
  at repo root (not nested under `backend/`) — zero imports from `backend/`.
- **Output**: newline-delimited `SignalRecord` JSON, git-tracked
  single append-only file at `signal-intake/data/signals.jsonl`.
- **Snapshot depth (v1)**: raw RSS entry only, one JSON file per capture
  under `signal-intake/data/snapshots/`.
- **Automation**: manual CLI invocation only for v1 — no new GitHub
  Actions workflow yet.
- **`SignalRecord` schema**: all seven blocks (`signal_meta`, `capture`,
  `authority`, `assessment`, `graph_links`, `weaver_handoff`,
  `lifecycle`) are present on the dataclass from v1. Only the first three
  are populated this workstream; the remaining four are explicit `None`
  fields so the shape doesn't need to change when a later workstream
  fills them in.
- **`source_tier`**: plain `int`, not a fixed-value enum, so the 1–3
  scheme used here can extend to a fuller tier scale later without a
  rename.
- **Dedup**: simple exact-URL + `content_hash` check against
  `signals.jsonl` — deliberately not reusing
  `backend/ai/deduplicator.py`'s fuzzy matcher, to avoid coupling the two
  systems.
- **Relevance filtering**: keyword/phrase matching per declared cluster,
  no LLM call — consistent with "keep v1 small."

## What was built

See design spec for full architecture. Summary:

- `signal-intake/sources.json` — 28 verified global sources across all 7
  required function-axis clusters, each tiered 1–3 with a stated
  justification.
- `signal-intake/signal_intake/` — `models.py`, `source_registry.py`,
  `fetch.py`, `relevance.py`, `capture.py`, `dedup.py`, `run.py`.
- `signal-intake/tests/` — TDD test suite, one file per module.
- `signal-intake/data/signals.jsonl` — output store (git-tracked).
- `signal-intake/requirements.txt`, `signal-intake/pytest.ini`,
  `signal-intake/README.md`.

## Verification

- TDD throughout: RED (failing test) confirmed before implementation for
  every module, then GREEN.
- 81 tests, 94% coverage (`pytest --cov=signal_intake`), every module
  individually ≥80%.
- Live smoke run against the real 28-source registry: 23 signals captured
  on first pass, 0 on an immediate re-run (dedup confirmed end-to-end
  against real feed data, not just mocks).
- Committed as `b7f9ff3` on `main`.

## What's left (future workstreams)

- Workstreams 2-4 of the Continuous Intelligence architecture: AI
  interpretation/linkage (`assessment`), cross-signal graph
  (`graph_links`), weaver handoff, and lifecycle tracking — all four
  currently `None` placeholders on `SignalRecord`.
- Cross-publisher corroboration (`authority.corroboration_state` stays
  `UNCORROBORATED` for all v1 records).
- Scheduled automation (currently manual-only).
- Asia-Pacific source gap (Japan METI, China MOFCOM/Customs — no working
  public RSS found; not papered over with a guessed URL).
