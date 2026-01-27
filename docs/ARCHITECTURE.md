# System Architecture

**India AI Policy Tracker - 3-Layer Hybrid Processing Pipeline**

Last Updated: January 27, 2026

---

## 🎯 Design Goals

1. **Minimize Cost**: Target $0/month (within free tiers)
2. **Maintain Quality**: Keep sophisticated filtering logic
3. **Mac-Friendly**: No heavy GPU requirements
4. **Resilient**: Automatic fallbacks if services fail
5. **Transparent**: Clear reporting at each stage

---

## 📊 High-Level Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                     DAILY SCRAPING                            │
│  220 sources → 2,000-3,500 new articles                      │
│  (RSS feeds + web scrapers)                                   │
└────────────────────────┬─────────────────────────────────────┘
                         ↓
┌──────────────────────────────────────────────────────────────┐
│ LAYER 1: RULE-BASED FILTER                                   │
│ ════════════════════════════════════════════════════════════ │
│ Module: ai/rule_filter.py                                     │
│ Config: config/filters.yaml                                   │
│                                                               │
│ ✓ 125+ AI keywords (from existing filter.py)                │
│ ✓ 5-tier India relevance scoring (50/40/30/20/10 pts)       │
│ ✓ False positive prevention                                  │
│ ✓ Confidence zones: HIGH / MEDIUM / BORDERLINE              │
│                                                               │
│ Cost:  $0 (pure Python)                                      │
│ Time:  <1 second                                             │
│ Pass Rate: ~40-45% (1,200-1,400 articles)                   │
└────────────────────────┬─────────────────────────────────────┘
                         ↓
┌──────────────────────────────────────────────────────────────┐
│ LAYER 2: BULK AI PROCESSING                                  │
│ ════════════════════════════════════════════════════════════ │
│ Module: ai/layer2_processor.py                               │
│ Provider: Groq (primary) → Ollama (fallback)                │
│                                                               │
│ Processes in batches of 10 articles:                         │
│ ✓ AI relevance check (reuses filter.py logic)               │
│ ✓ Category assignment (reuses categoriser.py)               │
│ ✓ State attribution (reuses geo_attributor.py)              │
│ ✓ Basic summary (reuses summarizer.py)                      │
│                                                               │
│ Checkpointing: Saves progress every 50 articles              │
│ Auto-fallback: Groq → Ollama on rate limit                  │
│                                                               │
│ Cost:  $0 (Groq free tier: 14,400/day)                      │
│ Time:  15-20 minutes (Groq) or 2-3 hours (Ollama)           │
│ Pass Rate: ~70-80% AI-relevant (900-1,100 articles)         │
└────────────────────────┬─────────────────────────────────────┘
                         ↓
┌──────────────────────────────────────────────────────────────┐
│ LAYER 3: PREMIUM POLISH                                      │
│ ════════════════════════════════════════════════════════════ │
│ Module: ai/importance_scorer.py + ai/premium_client.py       │
│ Provider: Gemini 1.5 Flash                                   │
│                                                               │
│ Importance Scoring:                                          │
│ ✓ Union/Central government mentions (+30 pts)               │
│ ✓ Ministry/Parliament/PM (+25 pts)                          │
│ ✓ Funding > ₹10 crore (+20 pts)                            │
│ ✓ Policy keywords from YAML (+15 pts)                       │
│ ✓ National scope (+10 pts)                                  │
│ ✓ Major institutions (+10 pts)                              │
│                                                               │
│ Top 30-50 articles get:                                      │
│ ✓ Refined categorization                                    │
│ ✓ Cross-checked state attribution                           │
│ ✓ Polished 2-3 line summary                                 │
│                                                               │
│ Cost:  $0 (Gemini free tier: 1,500/day, use ~40)           │
│ Time:  1-2 minutes                                           │
│ Output: 30-50 premium articles                               │
└────────────────────────┬─────────────────────────────────────┘
                         ↓
┌──────────────────────────────────────────────────────────────┐
│                   FINAL OUTPUT                                │
│  900-1,100 processed articles ready for website              │
│  (30-50 with premium polish)                                 │
└──────────────────────────────────────────────────────────────┘
```

---

## 🗂️ Module Relationships

### **Existing Modules (Preserved)**

These are your painstakingly built modules that contain all the sophisticated logic:

```
ai/filter.py (28KB)
├── STRONG_AI_KEYWORDS [125+ patterns]
├── CONTEXT_DEPENDENT_KEYWORDS
├── TIER2_INDIAN_COMPANIES [100+ companies]
├── TIER2_GLOBAL_INDIA
├── TIER3_INSTITUTIONS
├── TIER4_CURRENCY
├── check_relevance(title, content)
└── Used by: Layer 1 (extraction) + Layer 2 (AI call)

ai/deduplicator.py (24KB)
├── DEDUP_WINDOW_DAYS = 14
├── Fuzzy title matching
├── URL canonicalization
├── Entity extraction
└── Used by: Scraper (before Layer 1)

ai/geo_attributor.py (50KB)
├── State pattern matching
├── City-to-state mapping
├── Company HQ detection
└── Used by: Layer 2 + Layer 3

ai/categoriser.py (27KB)
├── Category assignment logic
├── Policy vs tech vs startup classification
└── Used by: Layer 2 + Layer 3

ai/summarizer.py (3KB)
├── Summary generation prompts
└── Used by: Layer 2 + Layer 3

ai/date_extractor.py (7KB)
├── Date parsing from content
└── Used by: Scraper
```

### **New Modules (To Be Created)**

These are thin wrappers and orchestrators that use your existing modules:

```
ai/rule_filter.py (NEW)
├── Extracts keywords from filter.py into fast lookup
├── Implements scoring without AI calls
├── Confidence zones: HIGH/MEDIUM/BORDERLINE
└── Purpose: Fast pre-filter (Layer 1)

ai/layer2_processor.py (NEW)
├── Orchestrates filter.py + categoriser.py + geo_attributor.py + summarizer.py
├── Batches 10 articles per API call
├── Handles checkpointing and resume
├── Automatic Groq → Ollama fallback
└── Purpose: Efficient bulk processing (Layer 2)

ai/importance_scorer.py (NEW)
├── Reuses importance_boost hints from filters.yaml
├── Content analysis (govt mentions, funding, etc.)
├── Manual overrides (force_premium flag)
└── Purpose: Select top articles (Layer 3 input)

ai/premium_client.py (NEW)
├── Unified interface for Gemini/Groq
├── Calls filter + categoriser + geo + summarizer again with premium model
├── Cross-checks and refines Layer 2 results
└── Purpose: Polish top articles (Layer 3)

ai/providers/groq_client.py (NEW)
├── Groq API wrapper
├── Batch processing support
└── Rate limit handling

ai/providers/ollama_client.py (NEW)
├── Ollama local model wrapper
├── Same interface as groq_client
└── Fallback option

ai/providers/gemini_client.py (UPDATE EXISTING)
├── Already exists (gemini_api.py)
├── Update for Layer 3 batch processing
└── Provider for premium polish

ai/checkpoint_manager.py (NEW)
├── Save/restore processing state
├── Resume interrupted jobs
└── Idempotent operations

ai/report_generator.py (NEW)
├── Console output with colors
├── JSON report generation
├── Provider usage tracking
└── Fallback event logging
```

---

## 🔄 Data Flow

### **1. Scraping Phase**

```
run_scraper_only.py
│
├─> Load sources from sources.json (220 sources)
│
├─> For each source:
│   ├─> RSS scraper OR web scraper
│   ├─> Extract: title, url, content, date, source
│   └─> Output: Raw article data
│
├─> Deduplication (ai/deduplicator.py)
│   ├─> Check against last 14 days
│   ├─> Fuzzy title matching
│   ├─> Entity extraction
│   └─> Output: 2,000-3,500 unique articles
│
└─> Save to database with processing_state='SCRAPED'
```

### **2. Layer 1: Rule Filter**

```
ai/rule_filter.py
│
├─> Load config/filters.yaml
│   ├─> 125+ AI keywords with weights
│   └─> India markers (states, companies, govt)
│
├─> For each SCRAPED article:
│   │
│   ├─> Score AI relevance (0-150 pts)
│   │   ├─> Check title for keywords
│   │   ├─> Check first 500 chars of content
│   │   └─> Weight: strong (100) > medium (50) > policy (150)
│   │
│   ├─> Score India relevance (0-60 pts)
│   │   ├─> Tier 1: States in title (50 pts)
│   │   ├─> Tier 2: Indian companies (40 pts)
│   │   ├─> Tier 3: Govt/institutions (60 pts)
│   │   └─> Tier 4: Currency mentions (20 pts)
│   │
│   ├─> Total score = AI score + India score
│   │
│   └─> Decision:
│       ├─> Score >= 80: HIGH confidence → Pass to Layer 2
│       ├─> Score 40-79: MEDIUM confidence → Pass to Layer 2
│       ├─> Score 30-39: BORDERLINE → Log for review + Pass to Layer 2
│       └─> Score < 30: REJECT → Mark as not relevant
│
└─> Output: 1,200-1,400 articles with rule_filter_score + confidence
```

### **3. Layer 2: Bulk Processing**

```
ai/layer2_processor.py
│
├─> Load SCRAPED articles that passed Layer 1
│
├─> Check for checkpoint (resume if interrupted)
│
├─> Process in batches of 10:
│   │
│   ├─> Try Groq API:
│   │   │
│   │   ├─> Build combined prompt:
│   │   │   ├─> Article 1: [title + content]
│   │   │   ├─> Article 2: [title + content]
│   │   │   ├─> ...
│   │   │   ├─> Article 10: [title + content]
│   │   │   │
│   │   │   └─> "For EACH article, provide:
│   │   │       1. AI relevance (YES/NO + score)
│   │   │       2. Category
│   │   │       3. State codes (JSON array)
│   │   │       4. Summary (2-3 sentences)"
│   │   │
│   │   ├─> Parse structured JSON response
│   │   │
│   │   └─> Save results to database
│   │
│   ├─> On RateLimitError:
│   │   ├─> Log fallback event
│   │   ├─> Switch to Ollama
│   │   └─> Continue processing
│   │
│   └─> Checkpoint every 50 articles
│
├─> Filter out non-AI-relevant articles
│
└─> Output: 900-1,100 AI-relevant articles with Layer 2 processing
```

### **4. Layer 3: Premium Polish**

```
ai/importance_scorer.py
│
├─> Load all articles that passed Layer 2
│
├─> For each article:
│   │
│   ├─> Calculate importance score:
│   │   ├─> Union govt mentions: +30
│   │   ├─> Ministry/Parliament/PM: +25
│   │   ├─> Funding > ₹10 crore: +20
│   │   ├─> Policy keywords (from YAML): +15
│   │   ├─> National scope: +10
│   │   ├─> Major institutions: +10
│   │   └─> importance_boost from YAML metadata
│   │
│   ├─> Check manual overrides:
│   │   ├─> force_premium flag: score = 999
│   │   └─> skip_premium flag: score = -999
│   │
│   └─> Save importance_score to database
│
├─> Sort by importance_score DESC
│
├─> Select top 30-50 articles
│
└─> Pass to Premium Client
    │
    ai/premium_client.py
    │
    ├─> For each top article:
    │   │
    │   ├─> Call Gemini 1.5 Flash with refined prompt:
    │   │   ├─> "This is a high-importance article"
    │   │   ├─> "Cross-check the category"
    │   │   ├─> "Verify state attribution"
    │   │   └─> "Produce polished summary"
    │   │
    │   ├─> Update database with refined results
    │   │
    │   └─> Mark premium_processed = True
    │
    └─> Output: 30-50 premium-polished articles
```

---

## 💾 Database Schema

### **Update Model (Enhanced)**

```python
class Update(db.Model):
    # Existing fields (unchanged)
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(500), nullable=False)
    url = db.Column(db.String(1000), unique=True)
    content = db.Column(db.Text)
    date_published = db.Column(db.Date)
    date_scraped = db.Column(db.DateTime)
    source_name = db.Column(db.String(200))

    # Layer 1 results (NEW)
    rule_filter_score = db.Column(db.Float)
    rule_filter_confidence = db.Column(db.String(20))  # high, medium, borderline
    matched_categories = db.Column(db.String(500))  # JSON array

    # Layer 2 results (ENHANCED)
    processing_state = db.Column(db.String(20))  # SCRAPED, PROCESSING, PROCESSED, FAILED
    layer2_processed = db.Column(db.Boolean, default=False)
    layer2_provider = db.Column(db.String(20))  # groq, ollama
    layer2_confidence = db.Column(db.Float)

    # AI results (from Layer 2 or existing system)
    is_ai_relevant = db.Column(db.Boolean)
    relevance_score = db.Column(db.Float)
    category = db.Column(db.String(100))
    state_codes = db.Column(db.String(200))  # JSON
    summary = db.Column(db.Text)

    # Layer 3 results (NEW)
    importance_score = db.Column(db.Float)
    premium_processed = db.Column(db.Boolean, default=False)
    premium_provider = db.Column(db.String(20))  # gemini, groq

    # Manual overrides (NEW)
    force_premium = db.Column(db.Boolean, default=False)
    skip_premium = db.Column(db.Boolean, default=False)

    # Admin (existing)
    is_approved = db.Column(db.Boolean, default=False)
    is_deleted = db.Column(db.Boolean, default=False)
    admin_notes = db.Column(db.Text)
```

### **BorderlineArticle Model (NEW)**

```python
class BorderlineArticle(db.Model):
    """Track borderline cases for filter refinement"""
    id = db.Column(db.Integer, primary_key=True)
    article_id = db.Column(db.Integer, db.ForeignKey('updates.id'))
    rule_score = db.Column(db.Float)  # Score from Layer 1
    layer2_decision = db.Column(db.String(20))  # relevant, not_relevant
    false_positive = db.Column(db.Boolean)  # Set after manual review
    false_negative = db.Column(db.Boolean)
    reviewed = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
```

---

## 📂 File Structure

```
india-ai-tracker/
├── backend/
│   ├── ai/
│   │   ├── filter.py                 ← EXISTING: Your sophisticated filter
│   │   ├── deduplicator.py          ← EXISTING: 14-day dedup
│   │   ├── geo_attributor.py        ← EXISTING: State detection
│   │   ├── categoriser.py           ← EXISTING: Categorization
│   │   ├── summarizer.py            ← EXISTING: Summaries
│   │   ├── date_extractor.py        ← EXISTING: Date parsing
│   │   ├── gemini_api.py            ← EXISTING: Gemini integration
│   │   │
│   │   ├── rule_filter.py           ← NEW: Layer 1
│   │   ├── layer2_processor.py      ← NEW: Layer 2 orchestrator
│   │   ├── importance_scorer.py     ← NEW: Layer 3 scoring
│   │   ├── premium_client.py        ← NEW: Layer 3 client
│   │   ├── checkpoint_manager.py    ← NEW: Resume logic
│   │   ├── report_generator.py      ← NEW: Daily reports
│   │   │
│   │   └── providers/
│   │       ├── groq_client.py       ← NEW
│   │       ├── ollama_client.py     ← NEW
│   │       └── gemini_client.py     ← WRAPPER for gemini_api.py
│   │
│   ├── config/
│   │   └── filters.yaml             ← NEW: Extracted keywords
│   │
│   ├── models/
│   │   └── update.py                ← ENHANCED: Add layer fields
│   │
│   ├── scripts/
│   │   ├── daily_update.sh          ← NEW: Master script
│   │   ├── 01_scrape.sh             ← NEW
│   │   ├── 02_process.sh            ← NEW
│   │   └── README.md                ← NEW
│   │
│   ├── reports/                     ← NEW: Daily reports
│   │   └── daily_report_{date}.json
│   │
│   └── checkpoints/                 ← NEW: Resume files
│       └── layer2_{date}.json
│
└── docs/
    ├── CONFIG_OVERVIEW.md           ← THIS FILE
    ├── ARCHITECTURE.md              ← YOU ARE HERE
    └── TROUBLESHOOTING.md           ← To be created
```

---

## 🔄 Error Handling & Fallbacks

### **Layer 2: Groq → Ollama Fallback**

```python
try:
    results = groq_client.process_batch(articles)
except (RateLimitError, TimeoutError, QuotaExceededError) as e:
    logger.warning(f"Groq failed: {e}")
    logger.info("Switching to Ollama fallback...")

    report.add_fallback_event(
        from_provider="groq",
        to_provider="ollama",
        remaining_count=len(articles),
        error=str(e)
    )

    results = ollama_client.process_batch(articles)
```

### **Checkpoint & Resume**

```python
# Save checkpoint every 50 articles
if processed_count % 50 == 0:
    checkpoint_manager.save({
        'last_processed_id': article.id,
        'processed_count': processed_count,
        'total': total_count,
        'provider': current_provider,
        'started_at': start_time
    })

# Resume from checkpoint
if checkpoint_manager.exists(today):
    checkpoint = checkpoint_manager.load(today)
    start_from_id = checkpoint['last_processed_id']
    logger.info(f"Resuming from article {start_from_id}")
```

---

## 📊 Performance Characteristics

| Metric | Value |
|--------|-------|
| **Daily Input** | 2,000-3,500 articles |
| **Layer 1 Output** | 1,200-1,400 articles (40% pass) |
| **Layer 2 Output** | 900-1,100 articles (75% pass) |
| **Layer 3 Output** | 30-50 premium articles |
| **Total Time** | 20-30 minutes (Groq) or 2-3 hours (Ollama) |
| **Cost** | $0/month (within free tiers) |
| **API Calls** | ~120-140 (Layer 2) + 30-50 (Layer 3) |

---

## 🎯 Design Decisions

### **Why 3 Layers?**

1. **Layer 1 (Rules):** Eliminate obvious non-matches fast (60% reduction)
2. **Layer 2 (Bulk AI):** Process remaining articles efficiently
3. **Layer 3 (Premium):** Polish only the most important articles

**Alternative considered:** All AI processing → Too expensive (~1,200 × 4 calls = 4,800 calls/day)

### **Why Groq for Layer 2?**

- ✅ 14,400 free requests/day (plenty for 120-140 batch calls)
- ✅ Fast (100+ tokens/sec)
- ✅ Llama 3.1 70B quality
- ❌ Ollama is slower (10 tokens/sec = 2-3 hours)

### **Why Gemini for Layer 3?**

- ✅ Better at nuanced summaries
- ✅ 1,500 free requests/day (use <50)
- ✅ Higher quality than Groq for polish
- ⚠️  Groq also works as alternative

### **Why Batch Processing?**

Old system: 4 calls per article × 1,200 = 4,800 calls
New system: 1 call per 10 articles = 120 calls

**91.7% API call reduction!**

---

## 🔐 Security Considerations

1. **API Keys:** Stored in `.env` file (gitignored)
2. **Admin Access:** Basic auth (hardcoded for now)
3. **Database:** Local SQLite (no network exposure)
4. **Frontend:** Static files (no backend attack surface)

---

## 📈 Future Enhancements

**Potential improvements (not in current scope):**

1. **Learning System:** Track false positives/negatives to auto-tune thresholds
2. **Multi-language:** Support regional language sources
3. **Real-time Webhooks:** Push updates to website instantly
4. **Advanced Scoring:** ML-based importance scoring
5. **A/B Testing:** Compare different summarization prompts

---

## ✅ Summary

**This architecture achieves:**

✅ **Cost:** $0/month (within free tiers)
✅ **Quality:** Preserves your sophisticated filtering logic
✅ **Speed:** 20-30 minutes total processing
✅ **Resilience:** Automatic fallbacks
✅ **Transparency:** Clear reporting at each stage
✅ **Maintainability:** Config files you can edit without coding

**Next Steps:**
- Read `scripts/README.md` for daily operations
- Read `CONFIG_OVERVIEW.md` for service setup
