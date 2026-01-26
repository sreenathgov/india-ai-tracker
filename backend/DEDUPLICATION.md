# Duplicate Detection System

## Overview

The India AI Tracker uses a sophisticated multi-layered duplicate detection system to prevent the same news event from appearing multiple times when reported by different outlets.

## Rolling Window Approach

**Key Configuration:** `DEDUP_WINDOW_DAYS = 14 days`

The deduplicator only compares new articles against articles from the **last 14 days**. This design choice offers several benefits:

### Why 14 Days?

1. **Performance**: Prevents expensive full-database scans as the dataset grows
2. **Relevance**: News events are typically reported across outlets within 2 weeks
3. **Scalability**: Query time remains constant regardless of total database size
4. **Memory efficiency**: Only loads recent articles into memory

### How It Works

```
New Article Scraped
        ↓
Compare against:
  ✓ Articles from last 14 days (129 articles)
  ✗ Older articles ignored (prevents bloat)
        ↓
Duplicate detected → Reject
Not duplicate → Accept
```

## Duplicate Detection Layers

### Layer 1: Exact URL Match
- **Fast path**: O(1) lookup
- Catches republished content with same URL

### Layer 2: Normalized URL Match
- Removes tracking parameters (utm_*, fbclid, gclid, ref)
- Standardizes domain (www removal, https normalization)
- Catches same article with different tracking links

**Example:**
```
https://www.example.com/article?utm_source=twitter&ref=123
→ Normalized to: https://example.com/article
```

### Layer 3: Fuzzy Text Similarity
Uses multiple algorithms from `fuzzywuzzy` library:

- **Token Set Ratio** (88% threshold): Handles word order differences
- **Partial Ratio** (90% threshold): Detects when one title is a subset
- **Token Sort Ratio**: Ignores word order completely
- **Weighted Average** (82% threshold): Combined score

**Example duplicates caught:**
```
"UPC Volt sets up Rs 5k cr data centre"
"UPC Volt to invest 5000 crore in data centre"
→ Detected as duplicate (same event, same company, same amount)
```

### Layer 4: Entity Extraction
Pure Python regex-based extraction:

- **Monetary amounts**: "₹5,000 crore" → normalized to "5000cr"
- **Company names**: Extracts capitalized entities
- **Key terms**: Filters out 197 stop words

### Layer 5: Smart Differentiation
Prevents false positives by detecting **different events**:

- Different amounts → Different rounds (Series A vs Series B)
- Different companies → Different subjects
- <30% entity overlap → Different topics

**Example non-duplicates (correctly allowed):**
```
"Startup X raises Series A $10M"
"Startup X raises Series B $50M"
→ Not duplicates (different funding rounds)
```

## Database Optimization

### Indexes for Performance

The system uses database indexes to ensure fast rolling-window queries:

```sql
-- Primary index for rolling window queries
CREATE INDEX idx_updates_date_scraped ON updates(date_scraped DESC);

-- Composite index for common query pattern
CREATE INDEX idx_updates_date_deleted ON updates(date_scraped DESC, is_deleted);

-- Index for date-range filtering
CREATE INDEX idx_updates_date_published ON updates(date_published DESC);
```

**Performance Impact:**
- Without index: O(n) full table scan
- With index: O(log n) + O(k) where k = results within window
- Typical query time: <10ms for 14-day window

### Running the Migration

If indexes don't exist, run:
```bash
cd backend
python3 migrations/add_date_indexes.py
```

## Configuration

### Adjusting the Rolling Window

To change the deduplication window, edit `backend/ai/deduplicator.py`:

```python
class Deduplicator:
    # Change this value (in days)
    DEDUP_WINDOW_DAYS = 14  # Default: 14 days
```

**Recommended values:**
- **7 days**: Fast-moving tech news (trade speed for duplicates)
- **14 days**: Balanced (current default)
- **30 days**: Conservative (catches late republications, slower queries)

### Other Configurable Thresholds

```python
# Fuzzy matching thresholds
TOKEN_SET_THRESHOLD = 88    # Higher = stricter matching
PARTIAL_THRESHOLD = 90      # Higher = stricter matching
COMBINED_THRESHOLD = 82     # Higher = stricter matching
```

## Testing

### Verify Rolling Window Implementation

```bash
cd backend
python3 test_dedup_window.py
```

**Expected output:**
```
✅ TEST PASSED: Loaded correct number of articles (14-day window)
✅ TEST PASSED: All articles within 14-day window
✅ TEST PASSED: Recent article detected as duplicate
✅ TEST PASSED: All required indexes exist
```

### Manual Testing

```python
from ai.deduplicator import Deduplicator

dedup = Deduplicator()
dedup._load_database_titles()

print(f"Loaded articles: {len(dedup._db_titles)}")
print(f"Window: {dedup.DEDUP_WINDOW_DAYS} days")
```

## Monitoring

### Key Metrics to Track

1. **Deduplication rate**: % of scraped articles marked as duplicates
2. **False positives**: Different events incorrectly flagged as duplicates
3. **False negatives**: Same event not detected (appears multiple times)
4. **Query performance**: Time to load rolling window from database

### Expected Behavior

- **Dedup rate**: 5-15% (varies by news cycle)
- **Window load time**: <50ms for 14-day window with indexes
- **Memory usage**: ~1-2MB for 500 articles in window

## Architecture Notes

### Why No AI/LLM for Deduplication?

The system uses **pure algorithmic matching** (no LLM calls) because:

1. **Cost**: Would add 1,000+ API calls per scrape cycle
2. **Speed**: Fuzzy matching is 1000x faster than LLM inference
3. **Reliability**: Deterministic behavior, no API downtime risk
4. **Accuracy**: Calibrated thresholds work well for news titles

### Future Improvements

Potential enhancements:
- [ ] Add semantic embeddings for deeper similarity (optional LLM layer)
- [ ] Track cross-outlet reporting patterns (same event, different angles)
- [ ] Auto-tune thresholds based on false positive feedback
- [ ] Add "related articles" feature using similarity scores

## Troubleshooting

### Issue: Too many duplicates blocked

**Solution**: Lower the similarity thresholds
```python
TOKEN_SET_THRESHOLD = 90  # Was 88
COMBINED_THRESHOLD = 85   # Was 82
```

### Issue: Same event appearing multiple times

**Solution**: Increase rolling window or lower thresholds
```python
DEDUP_WINDOW_DAYS = 21    # Was 14
TOKEN_SET_THRESHOLD = 85  # Was 88
```

### Issue: Slow queries on large database

**Solution**: Ensure indexes exist
```bash
python3 migrations/add_date_indexes.py
```

### Issue: Articles from >14 days detected as duplicates

This shouldn't happen. Run the test to verify:
```bash
python3 test_dedup_window.py
```

If test fails, check `_load_database_titles()` cutoff date logic.

---

**Last Updated**: January 2026
**Version**: 1.0
**Configuration**: 14-day rolling window with database indexes
