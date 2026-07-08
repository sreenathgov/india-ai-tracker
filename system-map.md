# India AI Tracker — System Map
> Shallow structural pass. Source: directory tree + config files only. No internal logic inspected.

## Platform Context

**Kananlabs.in Multi-Product Platform.** This repository contains the entire kananlabs.in platform:

| Product | Status | Purpose | Owned By |
|---------|--------|---------|----------|
| **India AI Tracker** | ✓ Active | Track AI developments, policies, and startup news across Indian states and union territories. Automated daily scraping, AI-based filtering/categorization, and static JSON publishing via Vercel. | Core product |
| **Publications** | ✓ In development | Long-form research articles with progressive disclosure UI. Curated research content accessible via table-of-contents sidebar layout. | New product |
| **Sector Watch** | 🔄 Planned | Detailed sector analysis and industry trends. | Future product |

**Key detail:** All three products share a single Vercel deployment and are deployed from this repository. For product-specific scoping, consult `.product-map.yaml`.

---

## Purpose
The system map documents subsystems and data flows for all Kananlabs.in products. India AI Tracker is the primary product; Publications and Sector Watch are peer products under the same umbrella.

---

## Major Subsystems

### 1. Frontend (Static Site on Vercel)
| File | Role | Product |
|---|---|---|
| `index.html` / `index-new.html` | Main tracker — interactive Leaflet.js map | India AI Tracker |
| `about.html` | Institutional info / disclosures | India AI Tracker |
| `publications.html` | Long-form research articles (progressive disclosure UI) | Publications |
| `admin.html` | Admin panel (dark theme, embedded CSS) | India AI Tracker |
| `scroll-test.html` | Diagnostic page | India AI Tracker |
| `js/app-final.js` | Production JS — uses relative `/api` paths | India AI Tracker |
| `js/app.js`, `app-new.js`, `app-working.js` | Dev/experimental variants — use `localhost:5001` | India AI Tracker |
| `js/publications.js` | Publication reader state machine | Publications |
| `js/india-states.geojson` | 3 MB GeoJSON for map rendering | India AI Tracker |
| `css/styles-v2.css` | Primary stylesheet (Cormorant Garamond font defs) | India AI Tracker |
| `css/styles.css` | Legacy/admin color system | India AI Tracker |
| `css/publications.css` | Publication layout (TOC + content + reading pane) | Publications |

### 2. Backend (Python / Flask)
| Component | Path | Role |
|---|---|---|
| Flask server | `backend/app.py` (33 KB) | REST API, session mgmt, auth wrapper |
| Local admin | `backend/local_admin.py` | Localhost-only admin on port 5002 |
| Scheduler | `backend/scheduler.py` | Daily 10 AM IST trigger |
| Scraper runner | `backend/run_scraper_only.py` | Step 1: fetch → dedup → save as SCRAPED |
| Processor runner | `backend/run_processor.py` | Step 2: AI pipeline → mark PROCESSED |
| Models | `backend/models/` | SQLAlchemy models: `update.py`, `source.py`, `state.py` |
| Utils | `backend/utils/` | `canonical_key.py`, `helpers.py` |

### 3. Scrapers (`backend/scrapers/`)
| File | Role |
|---|---|
| `orchestrator.py` (29 KB) | Main pipeline: load sources → scrape → filter → dedup → categorize → geo-attribute |
| `base_scraper.py` | Abstract base class |
| `rss_scraper.py` | RSS feed scraper |
| `web_scraper.py` (167 KB) | Web scraper (largest single file in project) |

### 4. AI Processing Pipeline (`backend/ai/`)
| File | Role |
|---|---|
| `rule_filter.py` | Layer 1: keyword/rule-based relevance filter (free) |
| `filter.py` | Additional filtering |
| `categoriser.py` | Priority-ordered categorization (Events > Policies > Startups > Major AI) |
| `geo_attributor.py` | Map articles to Indian state codes |
| `summarizer.py` | Generate article summaries |
| `importance_scorer.py` | Score article importance |
| `deduplicator.py` | Cross-cycle duplicate detection (14-day window) |
| `date_extractor.py` | Extract/validate publication dates |
| `india_subject_validator.py` | Validate India relevance |
| `ai_subject_validator.py` | Validate AI relevance |
| `event_temporal_validator.py` | Validate event dates |
| `llm_adjudicator.py` | LLM-based decision layer |
| `integrated_pipeline.py` | Orchestrates multi-layer pipeline |
| `layer2_processor.py` | Bulk AI processing (Groq/Ollama) |
| `layer3_processor.py` | Premium polish (Gemini 1.5 Flash) |
| `checkpoint_manager.py` | Resume interrupted processing |
| `gemini_api.py` | Gemini API client |
| `providers/` | AI provider integrations |

### 5. Data / API Layer (`api/`)
| Path | Role | Product |
|---|---|---|
| `api/all-india/categories.json` | National-level aggregated articles | India AI Tracker |
| `api/states/{CODE}/categories.json` | Per-state article data (37 states/UTs, 77 files total) | India AI Tracker |
| `api/last-updated.json` | Timestamp metadata | India AI Tracker |
| `api/blacklist.json` | Manually excluded URLs | India AI Tracker |
| `api/backups/` | 10 timestamped backup snapshots | India AI Tracker |

### 6. Configuration
| File | Role |
|---|---|
| `backend/.env` | API keys (Groq, Gemini), DB URL, admin creds, X/Twitter creds |
| `backend/config/filters.yaml` | Keyword weights, scoring thresholds, India relevance markers (629 lines) |
| `backend/sources.json` (87 KB) | RSS/web source definitions |
| `vercel.json` | Vercel deployment: CORS headers, 5-min cache on `/api/*` |
| `.vercelignore` | Excludes `backend/`, `.git/`, `venv/` from deploy |
| `.gitignore` | Protects `.env`, `*.db`, `venv/`, `__pycache__/` |

### 7. Scripts & Automation (`backend/scripts/`)
| File | Role |
|---|---|
| `daily_update.sh` | Shell wrapper for daily pipeline |
| `daily_summary.py` | Generate daily summary |
| `generate_static_api.py` | DB → JSON export (merge, never overwrite) |
| `check_services.sh` | Health check |
| `post_to_x.py` | Post articles to X/Twitter |
| `migrate_*.py` | Database migration scripts |

### 8. GitHub Actions (`.github/workflows/`)
Automated CI/CD — triggers daily scraping, verifies counts, commits JSON, deploys via Vercel. | India AI Tracker |

### 9. Shared Resources (All Products)
| Resource | Purpose |
|----------|---------|
| `assets/images/`, `assets/fonts/` | Kanan Labs branding (logos, Cormorant Garamond font) |
| `vercel.json`, `.vercelignore`, `.gitignore` | Deployment and repository configuration |
| `.product-map.yaml` | Product ownership registry (scoping guide for Claude and developers) |
| `system-map.md`, `CLAUDE_RULES.md`, `ARCHITECTURE.md`, and documentation | Structural map and governance |

**Important:** Shared resources are used by all products. Changes to shared resources affect the entire platform. Use escalation protocol in `CLAUDE_RULES.md` before modifying shared files.

---

## Data Flow

```
RSS Feeds / Web Sources
        │
        ▼
   ┌─────────────┐
   │  Scrapers    │  (rss_scraper, web_scraper via orchestrator)
   └──────┬──────┘
          │ raw articles
          ▼
   ┌─────────────────┐
   │ Layer 1: Rules   │  rule_filter.py + filters.yaml
   │ (2000-3500 → ~1200)
   └──────┬──────────┘
          ▼
   ┌─────────────────┐
   │ Layer 2: Bulk AI │  Groq / Ollama (layer2_processor)
   │ (~1200 → ~900)   │
   └──────┬──────────┘
          ▼
   ┌─────────────────┐
   │ Layer 3: Premium │  Gemini 1.5 Flash (layer3_processor)
   │ (top 30-50 only) │
   └──────┬──────────┘
          ▼
   ┌──────────────┐
   │ SQLite DB     │  tracker.db (temporary working store)
   └──────┬───────┘
          ▼
   ┌──────────────────────┐
   │ generate_static_api  │  MERGE into JSON (never overwrite)
   └──────┬───────────────┘
          ▼
   ┌──────────────┐
   │ api/*.json    │  ← CANONICAL SOURCE OF TRUTH
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │ Git commit    │  GitHub Actions
   │ + push        │
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │ Vercel CDN    │  Auto-deploy on push
   └──────┬───────┘
          ▼
   ┌──────────────┐
   │ Frontend      │  Leaflet map + JS fetch from /api/*
   └──────────────┘
```

---

## Known Coupling Points

1. **`orchestrator.py` ↔ all AI modules** — orchestrator imports and sequences every AI processor; change to any AI module interface breaks orchestrator
2. **`filters.yaml` ↔ `rule_filter.py`** — keyword weights and thresholds are config-driven; schema changes require code changes
3. **`sources.json` (87 KB) ↔ scrapers** — source definitions drive which scrapers run and how; large surface area
4. **`generate_static_api.py` ↔ JSON schema** — defines the shape of all `/api/*.json` files that frontend consumes
5. **Frontend JS ↔ `/api/` JSON schema** — `app-final.js` (and variants) expect specific JSON structure from `categories.json`
6. **`.env` ↔ multiple modules** — API keys referenced across `gemini_api.py`, `providers/`, `app.py`, `post_to_x.py`
7. **Jurisdiction mapping** — frontend/build routes now share `data/jurisdictions.json`; backend geo attribution still has separate jurisdiction logic
8. **`app.py` (33 KB)** — large monolith serving as API server, likely a coupling bottleneck (not inspected internally)
9. **GitHub Actions ↔ `generate_static_api.py`** — workflow depends on script exit codes and count verification

---

## Explicit Unknowns

1. **`backend/app.py` internals** — 33 KB monolith; route count, middleware chain, and internal coupling unknown (not inspected per constraints)
2. **`backend/scrapers/web_scraper.py`** — 167 KB is abnormally large for a single scraper; internal structure unknown
3. **`backend/social/` contents** — directory exists but contents not enumerated beyond top-level
4. **`backend/admin/` structure** — has `routes/`, `services/`, `templates/` subdirs; internal wiring unknown
5. **GitHub Actions workflow files** — exist in `.github/workflows/` but contents not read
6. **`backend/ai/providers/` contents** — provider abstraction layer exists; which providers are active unknown
7. **Database schema** — SQLAlchemy models exist in `backend/models/` but table definitions not inspected
8. **`index.html` vs `index-new.html`** — two versions of main page; which is canonical/deployed unknown
9. **Root `tracker.db` (0 B) vs `instance/tracker.db` (24 KB) vs `backend/tracker.db` (2.7 MB)** — three database files; active one unclear without reading code
10. **Test coverage** — test files exist both at `backend/test_*.py` and `backend/tests/`; coverage and CI integration unknown

**Uncertainty estimate: ~15%** — within the 20% threshold. Primary unknowns are internal logic of large files, which are out of scope for this structural pass.
