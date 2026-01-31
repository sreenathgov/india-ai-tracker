# India AI Tracker - System Architecture

**Last Updated:** 2026-01-31

## Critical Architecture Change

On 2026-01-31, the system underwent a major architectural redesign to fix recurring data loss issues and establish a robust, professional data pipeline.

## Core Invariants

The system now operates under these **immutable invariants** that must be preserved:

### 1. JSON is the Canonical Store

**The JSON files in `api/` are the single source of truth for all historical data.**

- SQLite database is a **temporary working store only**
- Database may be rebuilt, corrupted, or lost - this is acceptable
- All historical data preservation depends on JSON files
- Frontend reads from JSON, never from database

### 2. Daily Runs MERGE, Never Overwrite

**Each daily scrape run merges new articles into existing JSON, never reduces total count.**

- Loading existing JSON → merging new articles → writing combined result
- "Never reduce count" is enforced with safety checks
- If merge would reduce count, it aborts and keeps existing data
- This prevents data loss from database persistence failures

### 3. Global Deduplication

**Deduplication checks against ALL historical data in canonical JSON, not just current batch.**

- Before AI processing, articles are deduplicated against canonical store
- Uses normalized URLs as canonical keys
- Prevents same article from appearing multiple times across different days
- "Latest wins" policy: if same URL appears, keep article with newer `date_published`

### 4. 24-Hour Time Window

**Only articles published in the last 24 hours are scraped (configurable to 24-48h).**

- RSS feeds often contain 7-14 days of content
- Time window prevents old articles from being treated as "new"
- Configurable via `SCRAPE_TIME_WINDOW_HOURS` environment variable
- Default: 24 hours, can extend to 48 for tolerance

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    DAILY SCRAPE RUN                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ↓
                    ┌─────────────────┐
                    │  1. Scrape RSS  │
                    │  & Web Sources  │
                    └─────────────────┘
                              │
                              ↓
                    ┌─────────────────┐
                    │  2. Extract &   │
                    │  Validate Dates │
                    └─────────────────┘
                              │
                              ↓
                    ┌─────────────────────────┐
                    │  3. Time Window Filter  │
                    │  (Last 24h only)        │
                    └─────────────────────────┘
                              │
                              ↓
                    ┌─────────────────────────────┐
                    │  4. Global Deduplication    │
                    │  (Load canonical JSON,      │
                    │   check against all         │
                    │   historical URLs)          │
                    └─────────────────────────────┘
                              │
                              ↓
                    ┌─────────────────┐
                    │  5. AI Pipeline │
                    │  - Relevance    │
                    │  - Category     │
                    │  - Geography    │
                    │  - Summary      │
                    └─────────────────┘
                              │
                              ↓
                    ┌─────────────────┐
                    │  6. Save to DB  │
                    │  (temp store)   │
                    └─────────────────┘
                              │
                              ↓
                    ┌─────────────────────────────┐
                    │  7. MERGE into JSON         │
                    │  - Load existing JSON       │
                    │  - Build canonical index    │
                    │  - Merge new articles       │
                    │  - Safety: never reduce     │
                    │  - Write to api/ files      │
                    └─────────────────────────────┘
                              │
                              ↓
                    ┌─────────────────┐
                    │  8. Git Commit  │
                    │  & Push to Repo │
                    └─────────────────┘
                              │
                              ↓
                    ┌─────────────────┐
                    │  9. Vercel      │
                    │  Auto-Deploy    │
                    └─────────────────┘
```

---

## File Structure

### Canonical Data Store (Source of Truth)

```
api/
├── last-updated.json              # Metadata: last update timestamp
├── all-india/
│   └── categories.json            # National-level articles
└── states/
    ├── recent-counts.json         # State activity metrics (last 7 days)
    ├── KA/
    │   └── categories.json        # Karnataka articles
    ├── TG/
    │   └── categories.json        # Telangana articles
    └── [... 35 more states/UTs]
```

Each `categories.json` file has this structure:

```json
{
  "state": "IN",
  "categories": {
    "Policies and Initiatives": [...],
    "Events": [...],
    "Major AI Developments": [...],
    "AI Start-Up News": [...]
  },
  "today_updates": ["Events"]
}
```

### Working Files (Not Source of Truth)

```
backend/
├── tracker.db                     # SQLite temp store (not canonical)
└── reports/
    └── daily_counts.log           # Historical run statistics
```

---

## Canonical Key Strategy

**Primary Key:** Normalized URL

### Normalization Rules

1. Convert to lowercase
2. Remove query parameters (everything after `?`)
3. Remove fragments (everything after `#`)
4. Remove trailing slashes
5. Keep only: scheme + netloc + path

### Example

```
Original:  https://Example.com/Article?utm_source=twitter#section
Canonical: https://example.com/article
```

### Why URLs?

- Most stable identifier across database rebuilds
- Already unique in practice for news articles
- Easy to normalize for consistent matching
- Database IDs are unstable (change on rebuild)

### Implementation

```python
from utils.canonical_key import get_canonical_key

article = {'url': 'https://Example.com/News?id=123', ...}
key = get_canonical_key(article)  # 'https://example.com/news'
```

---

## Merge Logic Details

### How Merging Works

When `generate_static_api.py` runs:

1. **Load Existing Data**
   ```python
   existing_data = json.load(open('api/all-india/categories.json'))
   existing_articles = [article for articles in existing_data['categories'].values()
                        for article in articles]
   ```

2. **Build Canonical Index**
   ```python
   canonical_index = {}
   for article in existing_articles:
       key = get_canonical_key(article)  # normalized URL
       canonical_index[key] = article
   ```

3. **Merge New Articles**
   ```python
   for new_article in db_articles:
       key = get_canonical_key(new_article)

       if key in canonical_index:
           # Article exists - apply "latest wins"
           if new_article['date_published'] > canonical_index[key]['date_published']:
               canonical_index[key] = new_article  # Update to newer
       else:
           # New article - add it
           canonical_index[key] = new_article
   ```

4. **Rebuild Categories**
   ```python
   merged_categories = {cat: [] for cat in CATEGORIES}
   for article in canonical_index.values():
       category = article['category']
       merged_categories[category].append(article)
   ```

5. **Safety Check**
   ```python
   old_count = len(existing_articles)
   new_count = sum(len(articles) for articles in merged_categories.values())

   if new_count < old_count:
       raise Exception("ABORT: Would reduce count - violates invariant!")
   ```

6. **Write Merged Data**
   ```python
   with open('api/all-india/categories.json', 'w') as f:
       json.dump(merged_data, f)
   ```

### "Latest Wins" Policy

When the same article (same canonical URL) appears in multiple runs:

- Keep the version with the **newer `date_published`**
- This handles cases where article date was corrected
- Prevents overwriting with older/stale data

### Scope Preservation

- Articles can appear in BOTH national (all-india) AND state files
- Deduplication is scoped: within each file, URLs are unique
- Same article in different scopes is intentional (e.g., KA-specific event also national)
- Canonical key prevents duplicates WITHIN each scope, not ACROSS scopes

---

## Time Window Enforcement

### Why 24 Hours?

RSS feeds typically contain 7-14 days of historical articles. Without filtering:
- Day 1: Scrape 50 articles (40 are old)
- Day 2: Same 40 old articles appear again (duplicates)
- Result: Massive duplicate detection burden, wasted AI processing

### Implementation

**In RSS Scraper:**
```python
import os
from datetime import datetime, timedelta

time_window_hours = int(os.getenv('SCRAPE_TIME_WINDOW_HOURS', '24'))
cutoff_time = datetime.now() - timedelta(hours=time_window_hours)
cutoff_date = cutoff_time.date()

for entry in feed.entries:
    article = {...}
    if article['date_published'] < cutoff_date:
        skipped_old += 1
        continue  # Skip old articles
    articles.append(article)
```

**In Orchestrator (Central Filter):**
```python
# After date extraction, before AI processing
time_window_hours = int(os.getenv('SCRAPE_TIME_WINDOW_HOURS', '24'))
cutoff_date = (datetime.now() - timedelta(hours=time_window_hours)).date()

filtered_articles = []
for article in all_articles:
    if article['date_published'] >= cutoff_date:
        filtered_articles.append(article)
```

### Configuration

Set via environment variable:

```yaml
env:
  SCRAPE_TIME_WINDOW_HOURS: "24"  # Default
  # SCRAPE_TIME_WINDOW_HOURS: "48"  # More tolerance
```

---

## Global Deduplication

### Why Global?

**Old Approach (Broken):**
- Deduplicator loaded database at start of run
- Database only had today's scraped articles (persistence failed)
- Yesterday's articles weren't in database → appeared as "new"
- Result: Same article processed multiple days in a row

**New Approach (Robust):**
- Deduplicator loads canonical JSON (all historical data)
- Checks scraped articles against ALL history
- Prevents processing articles that already exist

### Implementation

**Load Canonical URLs:**
```python
def load_canonical_urls_from_json():
    canonical_urls = set()

    # Load from all-india
    with open('api/all-india/categories.json') as f:
        data = json.load(f)
        for articles in data['categories'].values():
            for article in articles:
                canonical_urls.add(get_canonical_key(article))

    # Load from all states
    for state_code in STATE_CODES:
        # ... same logic for each state file

    return canonical_urls
```

**Deduplicate:**
```python
def deduplicate_against_canonical(scraped_articles):
    canonical_urls = load_canonical_urls_from_json()

    deduplicated = []
    for article in scraped_articles:
        key = get_canonical_key(article)
        if key not in canonical_urls:
            deduplicated.append(article)  # New article

    return deduplicated
```

**Pipeline Integration:**
```python
# In orchestrator.py, BEFORE AI pipeline
all_articles = deduplicate_against_canonical(all_articles)

# Now AI pipeline only processes truly new articles
```

---

## Safety Mechanisms

### 1. Never Reduce Count

**Enforcement:** `generate_static_api.py`

```python
old_count = len(existing_articles)
new_total = len(merged_articles)

if new_total < old_count:
    print(f"SAFETY ABORT: Would reduce from {old_count} to {new_total}")
    return  # Keep existing file unchanged
```

**Result:** If something goes wrong (e.g., database has incomplete data), the merge aborts instead of losing data.

### 2. Workflow Verification

**Enforcement:** `.github/workflows/daily-scrape.yml`

```bash
API_COUNT_BEFORE=$(count articles in JSON)
# ... run pipeline ...
API_COUNT_AFTER=$(count articles in JSON)

if [ "$API_COUNT_AFTER" -lt "$API_COUNT_BEFORE" ]; then
    echo "ERROR: Count decreased!"
    exit 1  # Don't commit
fi
```

**Result:** Git commit only happens if merge succeeded and count didn't decrease.

### 3. Database Detached

**Database file is NOT committed to Git.**

- Only canonical JSON is committed
- Database can be deleted, rebuilt, corrupted - doesn't matter
- Removes dependency on fragile SQLite persistence
- Database is just a temporary working store for AI pipeline

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `SCRAPE_TIME_WINDOW_HOURS` | `24` | Only scrape articles from last N hours |
| `GROQ_API_KEY` | Required | API key for Groq (batch AI processing) |
| `GEMINI_API_KEY` | Required | API key for Gemini (premium AI) |
| `OLLAMA_DISABLED` | `true` | Disable local Ollama in production |

---

## Key Files Reference

### Core Implementation

| File | Purpose |
|------|---------|
| `backend/utils/canonical_key.py` | URL normalization & canonical key generation |
| `backend/scripts/generate_static_api.py` | Merge logic (JSON → JSON) |
| `backend/scrapers/orchestrator.py` | Main pipeline with global dedup & time window |
| `backend/scrapers/rss_scraper.py` | RSS scraping with 24h filter |
| `.github/workflows/daily-scrape.yml` | Automated daily workflow |

### Data Files

| File | Purpose |
|------|---------|
| `api/all-india/categories.json` | **Canonical** national articles |
| `api/states/{CODE}/categories.json` | **Canonical** state articles |
| `backend/tracker.db` | **Temporary** working database |

---

## What Changed and Why

### Before (Broken Architecture)

```
Scraper → Database → API Generator (OVERWRITE) → JSON Files
              ↓
         Persistence fails
         (data lost)
              ↓
         API overwrites with stale DB
         (massive data loss)
```

**Problems:**
- Database was canonical but didn't persist reliably
- API generator overwrote JSON completely (no merge)
- No cross-day deduplication (processed same article multiple times)
- No time window (scraped 14-day-old articles as "new")
- Result: 60-89% data loss on every run

### After (Robust Architecture)

```
Scraper → Time Filter (24h) → Global Dedup (vs JSON) → AI Pipeline → DB → MERGE into JSON
                                                                              ↓
                                                                         JSON (canonical)
```

**Improvements:**
1. **JSON is canonical** - Database can fail, doesn't matter
2. **Merge logic** - Never overwrites, only adds/updates
3. **Global dedup** - Checks all history, not just current batch
4. **Time window** - Only last 24h, ignores old RSS content
5. **Safety checks** - Aborts if count would decrease

**Result:** Robust, professional data pipeline with zero data loss

---

## Testing the System

### Verify Merge Logic

```bash
cd backend

# Check current count
python3 -c "
import json
with open('../api/all-india/categories.json') as f:
    data = json.load(f)
    total = sum(len(v) for v in data['categories'].values())
    print(f'Current: {total} articles')
"

# Run merge
python3 scripts/generate_static_api.py

# Check after merge (should be same or higher, never lower)
```

### Verify Global Deduplication

```bash
cd backend

# Run orchestrator (it loads canonical JSON for dedup)
PYTHONPATH=. python3 -c "
from scrapers.orchestrator import load_canonical_urls_from_json
urls = load_canonical_urls_from_json()
print(f'Loaded {len(urls)} canonical URLs for deduplication')
"
```

### Verify Time Window

```bash
cd backend

# Run with 48h window instead of 24h
SCRAPE_TIME_WINDOW_HOURS=48 PYTHONPATH=. python3 -c "
from scrapers.orchestrator import run_all_scrapers
run_all_scrapers()
"
# Should scrape more articles than 24h window
```

---

## Maintenance Notes

### When You See Safety Aborts

If merge aborts with "Would reduce count":

1. **This is expected** - safety mechanism working correctly
2. Database likely has incomplete data (persistence issue)
3. JSON is protected - no data loss occurred
4. Check: Why does database have fewer articles than JSON?
5. Safe to investigate - canonical JSON is unchanged

### Increasing Time Window

If scraping misses some articles:

```yaml
# In .github/workflows/daily-scrape.yml
env:
  SCRAPE_TIME_WINDOW_HOURS: "48"  # Increase from 24 to 48
```

### Manual Data Recovery

If historical data is lost from JSON (shouldn't happen):

```bash
# Restore from Git history
git log --all --oneline -- api/all-india/categories.json
git show COMMIT_HASH:api/all-india/categories.json > recovered.json

# Manually merge recovered data into current JSON
```

---

## Architecture Principles

1. **Immutability** - Invariants cannot be violated
2. **Idempotency** - Running merge multiple times = same result
3. **Fail-Safe** - On error, preserve data (don't delete)
4. **Single Source of Truth** - JSON files are canonical
5. **Explicit Over Implicit** - Safety checks are explicit, not assumed

---

**End of Architecture Documentation**
