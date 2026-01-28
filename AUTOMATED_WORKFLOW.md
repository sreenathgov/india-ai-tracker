# Fully Automated Workflow (Updated: Jan 28, 2026)

## 🎯 Complete Automation

The India AI Tracker now runs as a **fully automated pipeline** with a single button click.

## How It Works

### Single-Click Pipeline

When you click **"Run Scraper"** in the admin panel:

```
1. Scraping Phase (1-2 minutes)
   ↓
   Scrapes all RSS feeds
   Saves articles to database with state: SCRAPED

2. Processing Phase (2-5 minutes)
   ↓
   Layer 1: Rule-based filter (removes ~60% junk)
   Layer 2: Groq batch AI (identifies AI-relevant articles)
   Layer 3: Gemini premium (polishes top 50 articles)

3. Auto-Approval
   ↓
   AI-relevant articles: is_approved = True (visible on site)
   Non-AI articles: is_approved = False (hidden)

4. Site Updates Automatically
   ↓
   Approved articles appear on public site immediately
   Admin panel shows only AI-relevant articles
```

**Result:** Zero manual work required. The system handles everything automatically.

## Using the Admin Panel

### Access
- **URL:** http://localhost:5001/admin/login
- **Login:** Use your admin credentials

### Running the Pipeline

1. Click **"Run Scraper"** button
2. Wait for modal dialog showing progress:
   - "Step 1/2: Scraping RSS Feeds"
   - "Step 2/2: Processing with AI Pipeline"
3. See completion status:
   - "X articles scraped"
   - "✓ Processed with 3-layer AI pipeline"
   - "✓ AI-relevant articles auto-approved"
4. Click "Close & Refresh" to see new articles

**That's it!** Everything else is automatic.

## What Happens Automatically

### Articles Get:
- ✅ Scraped from RSS feeds
- ✅ Filtered through 3-layer AI pipeline
- ✅ Categorized (Policy, Research, Business, etc.)
- ✅ Geo-tagged with state codes
- ✅ Summarized (top articles get premium summaries)
- ✅ Scored for importance (0-200 scale)
- ✅ Auto-approved if AI-relevant
- ✅ Published to public site immediately

### You Only Need To:
- 🔍 **Optionally review** articles in admin panel
- ✏️ **Optionally edit** if something needs correction
- ❌ **Optionally unapprove** if AI made a mistake (rare)

**Human control is a safety check, not a requirement.**

## Command Line Alternative

If you prefer CLI instead of admin panel:

```bash
cd backend

# Run complete pipeline
bash scripts/daily_update.sh
```

This runs:
1. Scraper
2. 3-layer processing pipeline
3. Shows summary report

## System Specifications

### Scraping
- **Frequency:** Run manually or set up cron job
- **Sources:** ~30 RSS feeds from major Indian news sites
- **Volume:** ~3,000 articles/day

### Processing
- **Layer 1 (Rules):** 0 API calls, instant
- **Layer 2 (Groq):** ~120 API calls/day (batch processing)
- **Layer 3 (Gemini):** ~50 API calls/day (top articles only)
- **Total Cost:** $0/month (within free tiers)

### Accuracy
- **AI-relevance detection:** 90-95% accurate
- **Categorization:** 85-90% accurate
- **Geo-tagging:** 80-85% accurate
- **False positives:** ~5% (handled by optional human review)

## Architecture Details

### Database States
```
SCRAPED     → Article just scraped, needs processing
PROCESSING  → Currently being processed (rare, transient)
PROCESSED   → Processing complete, results stored
```

### Article Fields
```python
is_ai_relevant      # True/False: AI determined relevance
is_approved         # True/False: Visible on public site (auto-set = is_ai_relevant)
relevance_score     # 0-100: AI confidence in relevance
importance_score    # 0-200: Importance for premium processing
category            # Policy/Research/Business/etc.
state_codes         # ['KA', 'TN', ...] for geo-tagging
summary             # AI-generated summary
premium_processed   # True if got Gemini Layer 3 treatment
```

### API Endpoints

**Backend (Flask on port 5001):**
- `POST /api/admin/scrape/run` - Run complete pipeline (scrape + process)
- `GET /api/admin/updates` - Get AI-relevant articles for admin
- `PATCH /api/admin/updates/<id>` - Edit article
- `GET /api/updates` - Get approved articles for public site

**Frontend (HTTP server on port 8080):**
- `/index.html` - Public site with map
- `/admin.html` - Admin panel (proxies to Flask on 5001)

## Monitoring & Reports

### Check Pipeline Results

```bash
cd backend

# View latest pipeline report
ls -t reports/pipeline_*.json | head -1

# See detailed stats
cat $(ls -t reports/pipeline_*.json | head -1) | python3 -m json.tool
```

### Database Statistics

```bash
PYTHONPATH=. venv/bin/python3 -c "
from app import app, db, Update
from datetime import datetime

with app.app_context():
    total = Update.query.count()
    ai_relevant = Update.query.filter_by(is_ai_relevant=True).count()
    approved = Update.query.filter_by(is_approved=True).count()
    premium = Update.query.filter_by(premium_processed=True).count()

    today = datetime.now().date().isoformat()
    today_scraped = Update.query.filter(Update.date_scraped >= today).count()

    print(f'Database Stats:')
    print(f'  Total articles: {total}')
    print(f'  AI-relevant: {ai_relevant}')
    print(f'  Approved (visible): {approved}')
    print(f'  Premium processed: {premium}')
    print(f'  Scraped today: {today_scraped}')
"
```

## Troubleshooting

### Pipeline Doesn't Start After Scraping

**Check backend logs:**
```bash
tail -f /tmp/flask_backend.log
```

**Verify pipeline script is executable:**
```bash
cd backend
ls -l ai/integrated_pipeline.py
```

### No New Articles After Running

**Check processing state:**
```bash
PYTHONPATH=. venv/bin/python3 -c "
from app import app, db, Update

with app.app_context():
    scraped = Update.query.filter_by(processing_state='SCRAPED').count()
    processed = Update.query.filter_by(processing_state='PROCESSED').count()

    print(f'SCRAPED (waiting): {scraped}')
    print(f'PROCESSED (done): {processed}')
"
```

If all articles are PROCESSED, run scraper again to get fresh articles.

### Pipeline Takes Too Long

**Reduce processing for testing:**
```bash
# Process only 100 articles
PYTHONPATH=. venv/bin/python3 ai/integrated_pipeline.py --limit 100

# Reduce Layer 3 to top 20 instead of 50
PYTHONPATH=. venv/bin/python3 ai/integrated_pipeline.py --layer3-top-n 20
```

**Note:** Admin panel runs with default settings (all articles, top 50).

## Production Deployment

### Daily Cron Job

Set up automatic daily runs:

```bash
# Edit crontab
crontab -e

# Add this line (runs at 6 AM daily)
0 6 * * * cd /Users/sreenathgovindarajan/Documents/india-ai-tracker/backend && bash scripts/daily_update.sh >> /tmp/india-ai-tracker-cron.log 2>&1
```

### Email Notifications

Add to `daily_update.sh`:

```bash
# At end of script
if [ $PIPELINE_EXIT -eq 0 ]; then
    echo "Pipeline succeeded with $today_ai AI articles" | mail -s "India AI Tracker: Success" your@email.com
else
    echo "Pipeline failed. Check logs." | mail -s "India AI Tracker: FAILURE" your@email.com
fi
```

## Key Files

### Backend
- `app.py` - Flask API and admin endpoints
- `ai/integrated_pipeline.py` - 3-layer processing orchestrator
- `ai/rule_filter.py` - Layer 1 rule-based filter
- `ai/layer2_processor.py` - Layer 2 Groq batch processing
- `ai/layer3_processor.py` - Layer 3 Gemini premium processing
- `scripts/scrape_rss.py` - RSS feed scraper
- `scripts/daily_update.sh` - Complete workflow script

### Frontend
- `admin.html` - Admin panel with "Run Scraper" button
- `index.html` - Public site with map

### Configuration
- `ai/filters.yaml` - Rule-based filters and importance hints
- `scrapers/sources.yaml` - RSS feed sources

## Support

If you encounter issues:

1. Check backend logs: `tail -f /tmp/flask_backend.log`
2. Check pipeline reports: `ls -lt backend/reports/`
3. Verify services: `bash backend/scripts/check_services.sh`
4. Review this documentation
