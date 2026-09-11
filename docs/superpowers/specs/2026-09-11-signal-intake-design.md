# Signal Intake — Design Spec

**Date**: 2026-09-11
**Status**: Approved
**Workstream**: Continuous Intelligence architecture, Workstream 1 of 4 ("Drona Protocol")
**Run record**: [kanan-ops/drona-protocol/runs/2026/2026-09-11-signal-intake-v1/run.md](../../../kanan-ops/drona-protocol/runs/2026/2026-09-11-signal-intake-v1/run.md)

## Context

`india-ai-tracker` already runs a scraper pipeline (`backend/sources.json`,
`backend/scrapers/`, `.github/workflows/daily-scrape.yml`) feeding the public
India AI Regulation Tracker. That pipeline's RSS-ingestion *pattern*
(feedparser + dedup + time-window filter + cron-to-JSON) is a useful
architectural starting point. Its specific ~70-source list, HTML scrapers,
and AI-relevance-filter prompts are India-AI-policy-specific and are not
reused here.

This workstream builds a new, separate capture layer — Signal Intake — that
ingests global trade/supply-chain/AI-governance signals for the Continuous
Intelligence program. It captures raw signals only (no interpretation,
linkage, or corroboration — those are later workstreams).

## Non-goals / boundaries

- No imports from `backend/`, no shared state, no shared output files.
- No modification of `backend/sources.json`, any scraper, `daily-scrape.yml`,
  or `backend/ai/deduplicator.py`.
- No scheduled automation in v1 — manual CLI invocation only.
- No AI/LLM relevance filtering in v1 — keyword-based only.
- No cross-source corroboration — `authority.corroboration_state` stays
  `UNCORROBORATED` for every record in this workstream.

## Source registry (v1: 28 sources)

Every URL below was verified live via direct HTTP GET (browser User-Agent,
response body inspected — not just status code, since several candidates
returned HTTP 200 Cloudflare challenge pages or generic 404 HTML). No URL
was invented. Full registry with justification lives in
`signal-intake/sources.json`; summary by cluster:

| Cluster | Sources | Tier mix |
|---|---|---|
| `trade_policy_tariffs` | USTR, Federal Register (USTR), UK DBT, EU Presscorner (TRADE), Nikkei Asia | 4×T1, 1×T2 |
| `export_control_sanctions` | Federal Register (BIS, OFAC, CBP), UK OFSI/Treasury | 4×T1 |
| `working_capital_trade_finance` | Federal Reserve, Bank of England, ECB, ICC, RBI | 5×T1 |
| `supply_chain_disruption_inputs` | Supply Chain Dive, FreightWaves, gCaptain, The Loadstar, Nikkei Asia (dual) | 5×T2 |
| `esg_cbam_labour_compliance` | EU Presscorner (TAXUD), EU Presscorner (CLIMATE_ACTION), Federal Register (Labor), Fashion Revolution | 3×T1, 1×T3 |
| `market_funding_competition` | Crunchbase News, TechCrunch AI, Supply Chain Dive (dual) | 2×T3, 1×T2 |
| `ai_governed_technology` | EU Digital Strategy, NIST, UK DSIT, MIT Technology Review | 3×T1, 1×T3 |

Geographic mix: US (10), EU (7), UK (3), pan-Asia (2, dual-tagged), global
trade press (4), India (1 — RBI, kept deliberately: RBI is the direct
regulator of TReDS, the anchor instrument for `working_capital_trade_finance`).
This corrects the existing tracker's India-heavy source list rather than
mirroring it.

**Known v1 gap**: no working public RSS feed found for Japan METI, China
MOFCOM/Customs, GTR, Trade Finance Global, ILO, or World Bank — each either
publishes no feed or blocks non-browser requests. Not papered over with a
guessed URL; Nikkei Asia partially covers the Asia-Pacific gap for now.

Tiering: `source_tier` is a plain `int` (1 = primary/official government or
regulator feed, descending toward general news media), not a fixed enum —
so the scheme can extend to a fuller tier scale later without a schema
rename.

## Output schema

Newline-delimited JSON, one `SignalRecord` per line, appended to
`signal-intake/data/signals.jsonl` (git-tracked, append-only). All types are
immutable frozen dataclasses (`signal_intake/models.py`).

```python
SignalRecord:
    signal_meta: SignalMeta   # signal_id, intel_cluster, thread_id=None, watchlist_item=None
    capture: Capture          # capture_id, url, publisher, published_at, retrieved_at,
                               # content_hash (sha256), snapshot_path, verbatim_excerpt
    authority: Authority      # source_tier: int, corroboration_state="UNCORROBORATED"
    assessment: dict | None = None       # populated by a later workstream
    graph_links: dict | None = None      # populated by a later workstream
    weaver_handoff: dict | None = None   # populated by a later workstream
    lifecycle: dict | None = None        # populated by a later workstream
```

The last four blocks are carried on `SignalRecord` from v1 onward as
explicit `None` fields (not omitted) specifically so later workstreams can
populate them without changing `SignalRecord`'s shape. Their internal
structure is intentionally left undefined here — no schema is invented for
concepts this workstream doesn't build.

`content_hash` = sha256 of the normalized (lowercased, whitespace-collapsed)
`url + title + summary` from the raw feed entry. It detects "already
captured this exact item in a prior run," not cross-publisher
corroboration — different outlets covering the same event hash differently
by design; corroboration is explicitly a later workstream.

## Architecture

```
signal-intake/                     (repo-root, fully separate from backend/)
  sources.json                     source registry: name/url/tier/clusters/notes
  signal_intake/
    models.py         frozen dataclasses: SignalMeta, Capture, Authority, SignalRecord
    source_registry.py load + schema-validate sources.json
    fetch.py           feedparser + time-window filter (adapted, not imported,
                        from backend/scrapers/rss_scraper.py's pattern)
    relevance.py       per-cluster keyword filter, gated by source's declared clusters
    capture.py         builds SignalRecord: hash, retrieved_at, snapshot write, excerpt
    dedup.py           exact URL + content_hash check against signals.jsonl
    run.py             CLI: sources -> fetch -> relevance -> capture -> dedup -> append
  data/
    signals.jsonl       git-tracked, append-only output
    snapshots/           one JSON file per captured item (raw RSS entry only)
  tests/                pytest, one test file per module
  requirements.txt      feedparser==6.0.10, requests==2.33.0 (pinned to match backend/'s),
                         pytest, pytest-cov
  pytest.ini             own config — root pytest.ini's testpaths=backend/tests
                          does not cover this directory
```

Dedup is deliberately simple (exact URL + content_hash against
`signals.jsonl`) rather than reusing `backend/ai/deduplicator.py`'s fuzzy
title-similarity matcher — reusing it would create a runtime coupling
between the two systems that the separation requirement rules out.

Relevance filtering is keyword/phrase matching against title+summary per
declared cluster, no LLM call — sources are already narrow by construction
(especially Tier 1 government feeds), so this mainly disambiguates the
broader general-press feeds (Fed/ECB/BoE general press, Federal Register
DOL, Nikkei Asia, TechCrunch, MIT Tech Review). An LLM adjudicator is
explicitly out of scope for v1.

## Testing

TDD per project standard: failing test written first for each module, then
minimal implementation, then refactor. Target 80%+ coverage via
`pytest --cov=signal_intake --cov-report=term-missing`.

## Traceability

This spec and the Drona Protocol run record
(`kanan-ops/drona-protocol/runs/2026/2026-09-11-signal-intake-v1/run.md`)
are companion documents: this spec is the durable design reference; the run
record tracks what was decided and built for this specific workstream run,
and links back to the parent Continuous Intelligence run.
