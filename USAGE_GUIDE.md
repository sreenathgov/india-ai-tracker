# India AI Tracker - Complete Usage Guide

## 🚀 Quick Start (First Time)

### 1. Start Services
```bash
# Terminal 1: Start Flask Backend
cd /Users/sreenathgovindarajan/Documents/india-ai-tracker/backend
PYTHONPATH=. venv/bin/python3 app.py

# Terminal 2: Start Frontend
cd /Users/sreenathgovindarajan/Documents/india-ai-tracker
python3 -m http.server 8080
```

### 2. Access URLs
- **Admin Panel:** http://localhost:5001/admin/login
- **Public Site:** http://localhost:8080/index.html
- **API Health:** http://localhost:5001/api/health

### 3. Run Daily Update
```bash
cd backend
bash scripts/daily_update.sh
```

---

## 📰 Daily Workflow

### Option 1: Admin Panel (Easiest)

1. **Login:** http://localhost:5001/admin/login
2. **Click "Run Scraper"** button (top left)
3. **Wait for modal** showing progress
4. **See results:** "X new articles found"
5. **Click "Close & Refresh"**
6. **Run processing:**
   ```bash
   cd backend
   PYTHONPATH=. venv/bin/python3 ai/integrated_pipeline.py
   ```
7. **Refresh admin** - new AI articles appear (auto-approved)

### Option 2: Unified Script (Recommended)

Single command runs everything:
```bash
cd backend
bash scripts/daily_update.sh
```

This will:
- ✅ Run scraper
- ✅ Process with 3-layer pipeline
- ✅ Show summary stats
- ✅ Display latest report

### Option 3: Manual Control

```bash
cd backend

# Step 1: Scrape
PYTHONPATH=. venv/bin/python3 scripts/scrape_rss.py

# Step 2: Process
PYTHONPATH=. venv/bin/python3 ai/integrated_pipeline.py

# Step 3: Check results
PYTHONPATH=. venv/bin/python3 -c "
from app import app, db, Update
from datetime import datetime

with app.app_context():
    today = datetime.now().date().isoformat()
    ai_relevant = Update.query.filter(
        Update.date_scraped >= today,
        Update.is_ai_relevant == True
    ).count()
    print(f'Today: {ai_relevant} AI-relevant articles auto-approved')
"
```

---

## 🔧 Understanding the System

### What Happens Automatically

**Scraper:**
- Fetches from all RSS sources
- Checks for duplicates (14-day window)
- Saves as `SCRAPED` state

**3-Layer Pipeline:**
- **Layer 1 (Rule Filter):** Rejects obvious non-AI content (fast, free)
- **Layer 2 (Groq AI):** Categorizes, summarizes AI-relevant articles
- **Layer 3 (Gemini Premium):** Refines top 50 most important articles

**Auto-Approval:**
- AI-relevant articles: `is_approved = True` (appear on site)
- Non-AI articles: `is_approved = False` (hidden)

**Admin Panel:**
- Shows ONLY AI-relevant articles
- All already auto-approved
- You review optionally (quality check)

---

## 📊 Processing States

| State | Meaning | Action Required |
|-------|---------|-----------------|
| `SCRAPED` | Fresh from scraper | Run pipeline |
| `PROCESSING` | Being processed | Wait |
| `PROCESSED` | AI categorized, auto-approved if relevant | None (automatic) |
| `FAILED` | Processing error | Check logs |

---

## 🎯 Expected Results

### Typical Daily Run (3,000 articles scraped)

```
3,000 scraped
  ↓
Layer 1: ~1,200 pass (40%)
  ↓
Layer 2: ~1,000 AI-relevant (33%)
  ↓
  ├─ 1,000 auto-approved ✅
  └─ 2,000 auto-rejected ❌
  ↓
Layer 3: Top 50 get premium processing
```

**Admin Panel Shows:**
- ~1,000 AI-relevant articles
- All auto-approved
- Ready to publish

**API Calls Used:**
- Layer 2: ~120 calls (batch of 10)
- Layer 3: ~50 calls (individual)
- Total: ~170 calls (vs 12,000 in old system)

---

## 🔍 Checking System Status

### Quick Check
```bash
bash backend/scripts/check_services.sh
```

### Detailed Status
```bash
cd backend
PYTHONPATH=. venv/bin/python3 -c "
from app import app, db, Update
from sqlalchemy import func

with app.app_context():
    states = db.session.query(
        Update.processing_state,
        func.count(Update.id)
    ).group_by(Update.processing_state).all()

    print('Processing States:')
    for state, count in states:
        print(f'  {state}: {count}')

    print()
    total = Update.query.count()
    approved = Update.query.filter_by(is_approved=True).count()
    ai_relevant = Update.query.filter_by(is_ai_relevant=True).count()

    print(f'Total: {total}')
    print(f'AI-relevant: {ai_relevant}')
    print(f'Published (approved): {approved}')
"
```

---

## 🚨 Troubleshooting

### "No articles to process"

**Cause:** All articles already processed
**Solution:** Run scraper first
```bash
PYTHONPATH=. venv/bin/python3 scripts/scrape_rss.py
```

### "Admin shows too many articles"

**Cause:** Admin filter not working
**Solution:** Fixed in commit 11449a0 - pull latest code

### "Articles not appearing on public site"

**Cause:** Not approved
**Solution:** Check if auto-approval is working
```bash
PYTHONPATH=. venv/bin/python3 -c "
from app import app, db, Update

with app.app_context():
    recent = Update.query.order_by(Update.date_scraped.desc()).first()
    print(f'Most recent:')
    print(f'  AI-relevant: {recent.is_ai_relevant}')
    print(f'  Approved: {recent.is_approved}')
"
```

### "Scraper status disappeared"

**Cause:** Old toast-based notification
**Solution:** Fixed in commit f0857f1 - now shows modal dialog

### "Backend not responding"

```bash
# Restart Flask
kill -9 $(lsof -ti:5001)
cd backend
PYTHONPATH=. venv/bin/python3 app.py &
```

---

## 📝 Pipeline Options

### Process Limited Articles (Testing)
```bash
PYTHONPATH=. venv/bin/python3 ai/integrated_pipeline.py --limit 100
```

### Change Premium Count
```bash
PYTHONPATH=. venv/bin/python3 ai/integrated_pipeline.py --layer3-top-n 30
```

### Force Local Processing (Ollama)
```bash
PYTHONPATH=. venv/bin/python3 ai/integrated_pipeline.py --layer2-provider ollama
```

### Skip Report Generation
```bash
PYTHONPATH=. venv/bin/python3 ai/integrated_pipeline.py --no-report
```

---

## 📂 Important Files

### Configuration
- `backend/.env` - API keys, settings
- `backend/config/filters.yaml` - Keywords for Layer 1

### Scripts
- `backend/scripts/daily_update.sh` - Complete workflow
- `backend/scripts/scrape_rss.py` - Scraper only
- `backend/scripts/check_services.sh` - Status check

### Logs
- `backend/flask.log` - Flask backend logs
- `backend/reports/` - Pipeline reports (JSON)

### Documentation
- `QUICK_START.md` - Quick reference
- `FIXES_APPLIED.md` - Recent fixes explained
- `USAGE_GUIDE.md` - This file
- `docs/ARCHITECTURE.md` - Technical details

---

## 🎓 Understanding Admin Panel

### Dashboard Tab
- Shows all AI-relevant articles
- All auto-approved (green badges)
- Click "Edit" to modify if needed
- Click "Delete" to remove (soft delete)

### Sources Tab
- Manage RSS feeds
- Add new sources
- Pause/unpause sources
- View scraping stats

### Workflow
1. Scraper runs → articles appear as "PENDING"
2. Pipeline runs → articles become "APPROVED" (AI-relevant only)
3. You review → edit/delete if needed (optional)
4. Public site shows approved articles automatically

---

## 💡 Tips

1. **Run daily_update.sh in the morning** - processes overnight news
2. **Check admin once a day** - quick quality review (optional)
3. **Monitor reports/** folder - track pipeline performance
4. **Edit filters.yaml** - tune keywords without coding
5. **Use --limit for testing** - try on 50 articles first

---

## 📞 Quick Commands Cheat Sheet

```bash
# Daily workflow
cd backend && bash scripts/daily_update.sh

# Check status
bash scripts/check_services.sh

# Manual scrape + process
PYTHONPATH=. venv/bin/python3 scripts/scrape_rss.py
PYTHONPATH=. venv/bin/python3 ai/integrated_pipeline.py

# Test with limited articles
PYTHONPATH=. venv/bin/python3 ai/integrated_pipeline.py --limit 50

# Restart backend
kill -9 $(lsof -ti:5001) && PYTHONPATH=. venv/bin/python3 app.py &

# View latest report
cat reports/pipeline_*.json | tail -100
```

---

**Last Updated:** January 28, 2026
**System Version:** 3-Layer Hybrid Pipeline v1.0
