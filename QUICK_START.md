# India AI Tracker - Quick Start Guide

## 🚀 Starting the System

### 1. Start Backend (Flask API + Admin)
```bash
cd /Users/sreenathgovindarajan/Documents/india-ai-tracker/backend
PYTHONPATH=. venv/bin/python3 app.py &
```

### 2. Start Frontend (Public Site)
```bash
cd /Users/sreenathgovindarajan/Documents/india-ai-tracker
python3 -m http.server 8080 &
```

### 3. Check Status
```bash
bash backend/scripts/check_services.sh
```

---

## 🔗 Access URLs

### Public Website
- **URL:** http://localhost:8080/index.html
- **Shows:** Approved AI articles on interactive map
- **No login required**

### Admin Panel
- **URL:** http://localhost:5001/admin/login
- **Login:** Use your admin credentials
- **Features:**
  - Run scraper
  - Review articles
  - Approve/reject articles
  - Manage sources

### API Health Check
- **URL:** http://localhost:5001/api/health

---

## 📰 Daily Workflow

### Option 1: Using Admin Panel (EASIEST - Fully Automated)

1. Go to: http://localhost:5001/admin/login
2. Login with your credentials
3. Click **"Run Scraper"** button
4. Wait for the complete pipeline to finish (3-7 minutes):
   - ✓ Scraping RSS feeds
   - ✓ Processing with 3-layer AI pipeline
   - ✓ Auto-approving AI-relevant articles
5. Click "Close & Refresh" when done
6. **That's it!** Articles are automatically on the site
7. **Optionally** review articles in admin panel (not required)

**Everything is automated.** Human review is optional quality control.

### Option 2: Command Line (Single Script)

```bash
cd backend

# Run complete workflow (scrape + process + report)
bash scripts/daily_update.sh
```

This automatically runs:
- Scraper
- 3-layer pipeline
- Summary report

### Option 3: Manual Step-by-Step (Advanced)

```bash
cd backend

# Step 1: Scrape
PYTHONPATH=. venv/bin/python3 scripts/scrape_rss.py

# Step 2: Process with 3-layer pipeline
PYTHONPATH=. venv/bin/python3 ai/integrated_pipeline.py

# Step 3: Check results
PYTHONPATH=. venv/bin/python3 -c "
from app import app, db, Update
from datetime import datetime

with app.app_context():
    today = datetime.now().date().isoformat()

    scraped = Update.query.filter(Update.date_scraped >= today).count()
    processed = Update.query.filter(
        Update.date_scraped >= today,
        Update.processing_state == 'PROCESSED'
    ).count()
    ai_relevant = Update.query.filter(
        Update.date_scraped >= today,
        Update.is_ai_relevant == True
    ).count()

    print(f'Today ({today}):')
    print(f'  Scraped: {scraped}')
    print(f'  Processed: {processed}')
    print(f'  AI-Relevant: {ai_relevant}')
"

# Step 4: Review latest report
ls -lt reports/ | head -5
```

---

## 🔧 Troubleshooting

### Backend not responding
```bash
# Kill old processes
pkill -f "python.*app.py"

# Restart
cd backend
PYTHONPATH=. venv/bin/python3 app.py &
```

### Port already in use
```bash
# Check what's using port 5001
lsof -ti:5001

# Kill it
kill -9 $(lsof -ti:5001)

# Restart backend
cd backend
PYTHONPATH=. venv/bin/python3 app.py &
```

### Check service status
```bash
bash backend/scripts/check_services.sh
```

---

## 📊 Pipeline Options

### Process limited articles (testing)
```bash
PYTHONPATH=. venv/bin/python3 ai/integrated_pipeline.py --limit 100
```

### Change top N for premium processing
```bash
PYTHONPATH=. venv/bin/python3 ai/integrated_pipeline.py --layer3-top-n 30
```

### Force Ollama (local processing)
```bash
PYTHONPATH=. venv/bin/python3 ai/integrated_pipeline.py --layer2-provider ollama
```

---

## 📝 Important Notes

- **Admin URL is on port 5001**, not 8080!
- Public site is on port 8080
- Both need to be running
- Articles need approval before appearing on public site
