# Signal Intake

A standalone capture layer for the Continuous Intelligence program. Pulls
global trade-policy, export-control, trade-finance, supply-chain, ESG/CBAM,
market/funding, and AI-governance signals from a curated RSS/Atom source
registry and writes them as immutable `SignalRecord` JSON lines.

This module is fully separate from the existing India AI Tracker scraper
pipeline (`backend/`): no shared code, no shared state, no shared output
files. See the design doc for the full rationale:
[`docs/superpowers/specs/2026-09-11-signal-intake-design.md`](../docs/superpowers/specs/2026-09-11-signal-intake-design.md).

## Setup

`feedparser==6.0.10` imports the stdlib `cgi` module, which was removed in
Python 3.13. Use Python 3.11 or 3.12 to build the virtualenv:

```bash
cd signal-intake
python3.12 -m venv .venv
.venv/bin/pip install -r requirements.txt
```

## Running tests

```bash
.venv/bin/python -m pytest --cov=signal_intake --cov-report=term-missing
```

## Running a capture pass

Manual invocation only — v1 has no scheduled automation.

```bash
.venv/bin/python -m signal_intake.run
```

New signals are appended to `data/signals.jsonl` (git-tracked, append-only);
one raw-entry snapshot per captured item is written to `data/snapshots/`.
Re-running is safe: already-captured signals (by `signal_id`, which
encodes content + cluster) are skipped.

## Module layout

| File | Responsibility |
|---|---|
| `signal_intake/models.py` | Frozen `SignalRecord` dataclasses and schema validation |
| `signal_intake/source_registry.py` | Loads and validates `sources.json` |
| `signal_intake/relevance.py` | Keyword-based cluster matching (no LLM) |
| `signal_intake/fetch.py` | RSS/Atom fetch + time-window filter |
| `signal_intake/capture.py` | Builds a `SignalRecord` from a fetched entry |
| `signal_intake/dedup.py` | Exact-identity dedup against `data/signals.jsonl` |
| `signal_intake/run.py` | CLI orchestration of the pipeline above |
