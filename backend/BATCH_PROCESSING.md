# Batch Processing Pipeline

## Overview

The India AI Tracker uses a **decoupled, state-based processing pipeline** optimized for Gemini API's free tier.

**Key Innovation**: Scraping and AI processing are completely separated, with articles processed in batches of 3 to minimize API calls while maintaining robust error handling.

---

## Why This Architecture?

### Problem (Old System)
- Scraping and AI processing tightly coupled
- Each article = 4 separate API calls (filter, categorize, geo-attribute, summarize)
- 2000 articles/day × 4 calls = **8,000 API calls/day**
- Exceeds Gemini free tier (60 RPM, 1M tokens/min)
- Single failure blocks entire pipeline

### Solution (New System)
- Scraping and processing decoupled (separate commands)
- Batch processing: 3 articles per API call
- All AI tasks combined in single prompt
- 2000 articles/day ÷ 3 × 1 call = **~667 API calls/day**
- **67% reduction in API usage**
- Failures isolated to individual articles

---

## Processing States

Articles flow through 4 distinct states:

```
SCRAPED → PROCESSING → PROCESSED
              ↓
           FAILED (after 3 retries)
```

### State Definitions

| State | Meaning | Visible to Users? | Visible in Admin? |
|-------|---------|-------------------|-------------------|
| **SCRAPED** | Fetched from source, awaiting AI processing | ❌ No | ✅ Yes |
| **PROCESSING** | Currently being processed by AI pipeline | ❌ No | ✅ Yes |
| **PROCESSED** | Fully processed and ready to display | ✅ Yes | ✅ Yes |
| **FAILED** | Failed after 3 retry attempts | ❌ No | ✅ Yes (for manual review) |

### State Transition Rules

1. ✅ Scraper **only** creates `SCRAPED` articles (no AI processing)
2. ✅ Processor **only** picks up `SCRAPED` articles
3. ✅ `PROCESSED` articles are **never** reprocessed
4. ✅ `FAILED` articles remain visible in admin for manual action
5. ✅ Only `PROCESSED` articles appear on public website

---

## New Pipeline Flow

### Step 1: Scraping (run_scraper_only.py)

```bash
python3 run_scraper_only.py
```

**What it does:**
1. Fetch articles from RSS feeds and web scrapers
2. Deduplicate against last 14 days (URL + fuzzy title matching)
3. Save to database with `processing_state='SCRAPED'`
4. **Exit** (no AI processing)

**Output:**
```
SCRAPED articles: 2,300 new articles ready for processing
```

### Step 2: AI Processing (run_processor.py)

```bash
python3 run_processor.py
```

**What it does:**
1. Load all articles with `processing_state='SCRAPED'`
2. Process in batches of 3 articles
3. For each batch:
   - Send single combined prompt to Gemini API
   - Get relevance check + categorization + geo-attribution + summary
   - Mark successful articles as `PROCESSED`
4. If batch fails:
   - Retry each article individually (up to 3 attempts)
   - Use exponential backoff: 5s → 15s → 45s
   - Mark permanently failed articles as `FAILED`

**Output:**
```
✅ Successfully processed: 2,100
❌ Not AI-relevant:        150
❌ Failed permanently:     50

API Efficiency:
  API calls made:  700
  Calls saved:     1,400 (thanks to batching)
  Reduction:       66.7%
```

---

## Batch Processing Details

### Batch Size: 3 Articles

**Why 3?**
- Small enough for manageable error handling
- Large enough for meaningful API reduction (67% fewer calls)
- Fits within Gemini's context window comfortably
- If 1 article fails, only retry that 1 (not the whole batch)

### Combined AI Tasks

All 4 AI tasks are sent in a **single prompt**:

```
Process these 3 articles:

ARTICLE 1:
Title: [title]
Content: [content excerpt]

ARTICLE 2:
Title: [title]
Content: [content excerpt]

ARTICLE 3:
Title: [title]
Content: [content excerpt]

For each article, provide:
1. Is it AI-relevant? (yes/no + score)
2. Category (Policies/Events/Developments/Startups)
3. Geographic attribution (state codes)
4. Summary (2-3 sentences)

Output format: [structured JSON per article]
```

**Result:** 1 API call instead of 12 (3 articles × 4 tasks)

### Error Handling

**Scenario 1: Entire batch fails**
- Retry each article individually (3 attempts each)
- Successful articles → `PROCESSED`
- Failed articles → `FAILED`

**Scenario 2: One article in batch fails**
- Only retry the failed article
- Other 2 articles remain `PROCESSED` (not reprocessed)

**Scenario 3: Article not AI-relevant**
- Delete from database (not saved)
- Don't count as failure

---

## Retry Logic

### Exponential Backoff

Failures are retried with increasing delays:

| Attempt | Wait Time | Total Elapsed |
|---------|-----------|---------------|
| 1       | Immediate | 0s            |
| 2       | 5 seconds | 5s            |
| 3       | 15 seconds| 20s           |
| Final   | 45 seconds| 65s           |

**After 3 failed attempts** → Mark as `FAILED`

### Why Exponential Backoff?

- **Transient errors** (network blips, temporary API issues) usually resolve quickly
- **Rate limits** (429 errors) need longer waits
- **Permanent errors** (malformed content) fail fast after 3 attempts

---

## Configuration

### Key Constants

```python
# run_processor.py

BATCH_SIZE = 3          # Articles per API call
MAX_RETRIES = 3         # Retry attempts per article
BACKOFF_DELAYS = [5, 15, 45]  # Seconds between retries
```

### Adjusting Batch Size

To change batch size, edit `run_processor.py`:

```python
BATCH_SIZE = 5  # Process 5 articles per batch (more aggressive)
BATCH_SIZE = 2  # Process 2 articles per batch (more conservative)
```

**Trade-offs:**
- **Larger batches** = Fewer API calls, but harder to debug failures
- **Smaller batches** = More API calls, but easier error isolation

**Recommendation:** Keep at 3 for optimal balance.

---

## Database Schema

### New Fields

```sql
ALTER TABLE updates ADD COLUMN processing_state TEXT DEFAULT 'PROCESSED';
ALTER TABLE updates ADD COLUMN processing_attempts INTEGER DEFAULT 0;
ALTER TABLE updates ADD COLUMN last_processing_error TEXT;
ALTER TABLE updates ADD COLUMN last_processing_attempt DATETIME;

CREATE INDEX idx_updates_processing_state ON updates(processing_state);
```

### Migration

Run the migration to add these fields:

```bash
python3 migrations/add_processing_states.py
```

**What it does:**
- Adds 4 new columns
- Creates index on `processing_state`
- Sets existing articles to `PROCESSED` (backward compatible)

---

## Usage

### Daily Workflow (Manual)

```bash
# Step 1: Scrape articles (no AI processing)
python3 run_scraper_only.py

# Step 2: Process scraped articles with AI
python3 run_processor.py
```

### Automated (GitHub Actions)

```yaml
# .github/workflows/daily-scraping.yml

name: Daily Scraping and Processing

on:
  schedule:
    - cron: '30 4 * * *'  # 10:00 AM IST

jobs:
  scrape-and-process:
    runs-on: ubuntu-latest
    steps:
      - name: Scrape articles
        run: python3 run_scraper_only.py

      - name: Process articles
        run: python3 run_processor.py
```

---

## Testing

### Test Processing Pipeline

```bash
python3 test_processing_pipeline.py
```

**What it tests:**
1. ✅ Articles are scraped with state=SCRAPED
2. ✅ State transitions work correctly
3. ✅ Only PROCESSED articles visible in public API
4. ✅ SCRAPED/PROCESSING/FAILED articles hidden from users
5. ✅ Processing attempts tracked correctly

### Manual State Verification

```bash
# Check state distribution
sqlite3 instance/tracker.db "
  SELECT processing_state, COUNT(*)
  FROM updates
  GROUP BY processing_state
"
```

**Expected output:**
```
SCRAPED    |  150
PROCESSING |    2
PROCESSED  | 2,100
FAILED     |   48
```

---

## Admin Panel Integration

### View Articles by State

```python
# Admin panel filters
scraped_articles = Update.query.filter_by(processing_state='SCRAPED').all()
processing_articles = Update.query.filter_by(processing_state='PROCESSING').all()
processed_articles = Update.query.filter_by(processing_state='PROCESSED').all()
failed_articles = Update.query.filter_by(processing_state='FAILED').all()
```

### Retry Failed Articles

```python
# Mark FAILED article as SCRAPED to retry
article.processing_state = 'SCRAPED'
article.processing_attempts = 0
article.last_processing_error = None
db.session.commit()

# Then run processor again
python3 run_processor.py
```

---

## Monitoring

### Key Metrics

1. **Processing rate**: % of SCRAPED articles successfully processed
2. **Failure rate**: % of articles marked as FAILED
3. **API efficiency**: API calls saved via batching
4. **Retry success**: % of failures recovered via retries

### Expected Behavior

- **Success rate**: 85-95% (SCRAPED → PROCESSED)
- **Not AI-relevant**: 5-10% (filtered out)
- **Permanent failures**: <5% (FAILED after retries)
- **API reduction**: 65-70% (thanks to batching)

---

## Troubleshooting

### Issue: Articles stuck in PROCESSING state

**Cause:** Processor crashed mid-batch

**Solution:**
```sql
-- Reset stuck articles to SCRAPED
UPDATE updates
SET processing_state = 'SCRAPED',
    processing_attempts = 0
WHERE processing_state = 'PROCESSING';
```

Then re-run processor.

### Issue: High FAILED rate (>10%)

**Possible causes:**
1. Gemini API rate limits (60 RPM exceeded)
2. Malformed article content
3. Network issues

**Solution:**
1. Check Gemini API quota usage
2. Inspect `last_processing_error` for failed articles
3. Consider increasing `BACKOFF_DELAYS`

### Issue: Articles not appearing on website

**Cause:** Articles not marked as PROCESSED

**Check:**
```sql
SELECT processing_state, is_approved, COUNT(*)
FROM updates
GROUP BY processing_state, is_approved;
```

**Remember:** Only articles with:
- `processing_state = 'PROCESSED'`
- `is_approved = TRUE`
- `is_deleted = FALSE` (or NULL)

...are visible to users.

---

## Migration from Old System

### Step 1: Migrate Existing Articles

All existing articles are automatically marked as `PROCESSED` during migration.

### Step 2: Update Cron Jobs

**Old (deprecated):**
```bash
python3 scrapers/orchestrator.py
```

**New:**
```bash
python3 run_scraper_only.py
python3 run_processor.py
```

### Step 3: Update Admin Panel

Add state filter dropdown:
```html
<select onchange="filterByState(this.value)">
  <option value="SCRAPED">Pending Processing</option>
  <option value="PROCESSING">Currently Processing</option>
  <option value="PROCESSED">Published</option>
  <option value="FAILED">Failed (needs review)</option>
</select>
```

---

## Performance Impact

### Before (Old System)

- **API calls**: 8,000/day
- **Processing time**: 4-6 hours (sequential)
- **Failure impact**: Entire pipeline blocks
- **Cost**: Exceeds Gemini free tier

### After (New System)

- **API calls**: 700/day (67% reduction)
- **Processing time**: 1-2 hours (batched)
- **Failure impact**: Isolated to individual articles
- **Cost**: Well within Gemini free tier

---

## Future Improvements

Potential enhancements:
- [ ] Dynamic batch sizing based on API quota
- [ ] Priority queue (process high-relevance articles first)
- [ ] Automatic retry of FAILED articles after 24 hours
- [ ] Real-time processing (webhook-triggered)
- [ ] Multi-model support (fallback to different APIs)

---

**Last Updated**: January 2026
**Version**: 1.0
**Configuration**: Batch size = 3, Max retries = 3, Exponential backoff
**API Optimization**: 67% reduction in API calls
