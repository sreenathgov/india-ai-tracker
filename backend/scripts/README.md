# Daily Operations Guide

**How to Run Your India AI Tracker - Plain English**

Last Updated: January 27, 2026

---

## 🎯 What You Need to Know

The India AI Tracker runs a daily batch process to:
1. Scrape articles from 220 news sources
2. Filter them through 3 processing layers
3. Publish the best ones to your website

**Total time:** 20-30 minutes per day
**Your involvement:** Run one command (or set up automation)

---

## 🚀 Quick Start - Run Everything

### **Option 1: Single Command (Recommended)**

```bash
cd /Users/sreenathgovindarajan/Documents/india-ai-tracker/backend
./scripts/daily_update.sh
```

That's it! This runs all steps automatically.

---

## 📋 What Happens Behind the Scenes

### **Step 1: Scraping (10 minutes)**

```bash
./scripts/01_scrape.sh
```

**What it does:**
- Visits 220 news sources
- Downloads 2,000-3,500 new articles
- Removes duplicates (checks last 14 days)
- Saves articles to database with status "SCRAPED"

**Output:**
```
Scraped: 2,813 articles
Duplicates: 530 articles
New articles: 2,283 (state=SCRAPED)
```

**Can you run this multiple times?** Yes! It's safe to re-run. Duplicates are automatically detected.

---

### **Step 2: Processing (15-20 minutes)**

```bash
./scripts/02_process.sh
```

**What it does:**
- **Layer 1:** Filters with keywords (instant)
  - Input: 2,283 articles
  - Output: ~1,200 articles pass filter

- **Layer 2:** AI processing in batches (15 min)
  - Uses Groq API (free) to analyze all articles
  - Determines: Is it AI-related? What category? Which state?
  - Falls back to local Ollama if Groq has issues
  - Output: ~900 AI-relevant articles

- **Layer 3:** Premium polish (1-2 min)
  - Picks top 30-50 most important articles
  - Uses Gemini API (free) to create polished summaries
  - Output: 30-50 premium articles

**Output:**
```
════════════════════════════════════════════════════
📊 DAILY PROCESSING REPORT - 2026-01-27
════════════════════════════════════════════════════

LAYER 1: Rule-Based Filter
  Input:      2,283 articles
  Passed:     1,247 articles (54.6%)
  Time:       0.8 seconds

LAYER 2: Bulk Processing
  Provider:   Groq ✅
  Input:      1,247 articles
  Relevant:   1,038 articles (83.2%)
  Time:       18.4 minutes

LAYER 3: Premium Polish
  Provider:   Gemini ✅
  Input:      Top 42 articles
  Processed:  42 articles
  Time:       1.2 minutes

FINAL: 1,038 new articles published
Total time: 20.4 minutes
════════════════════════════════════════════════════
```

**Can you run this multiple times?** Yes! It has "checkpoints" so if it stops halfway, it can resume where it left off.

**What if it gets stuck?** It saves progress every 50 articles. Just run it again and it continues.

---

### **Step 3: Export for Website (5 seconds)**

```bash
./scripts/03_export.sh
```

**What it does:**
- Reads processed articles from database
- Creates JSON files for your website
- Puts them in `frontend/data/` folder

**Output:**
```
Exported 1,038 articles to:
  - frontend/data/articles_latest.json
  - frontend/data/stats.json
```

---

### **Step 4: Deploy to Website (Optional)**

```bash
./scripts/04_deploy.sh
```

**What it does:**
- Pushes the new JSON files to Vercel/Netlify
- Your website updates automatically
- Visitors see new articles

**Do you need to do this?** Only if you want to publish updates immediately. Otherwise, you can deploy manually later.

---

## 🎮 Running Individual Steps

You don't have to run everything together. You can run steps separately:

### **Just Scrape (No Processing)**

```bash
cd backend
python3 run_scraper_only.py
```

Use this when:
- You want to collect articles but process them later
- Testing if scraping is working
- Running overnight scraping only

---

### **Just Process (No Scraping)**

```bash
cd backend
python3 run_processor_hybrid.py
```

Use this when:
- You already scraped earlier
- You want to re-process existing articles
- Testing the AI processing

---

### **Check Status (No Changes)**

```bash
cd backend
python3 check_status.py
```

Shows you:
- How many articles are scraped but not processed
- How many passed each layer
- Current quota usage for APIs

---

## 🔄 Automation Options

### **Option A: Run Manually Each Day**

```bash
cd /Users/sreenathgovindarajan/Documents/india-ai-tracker/backend
./scripts/daily_update.sh
```

**Pros:** You control when it runs
**Cons:** You have to remember to do it

---

### **Option B: Set Up Daily Automation (macOS)**

Create a daily reminder or use macOS automation:

**Using cron (runs automatically):**
```bash
# Edit crontab
crontab -e

# Add this line (runs at 6 AM daily):
0 6 * * * cd /Users/sreenathgovindarajan/Documents/india-ai-tracker/backend && ./scripts/daily_update.sh >> logs/cron.log 2>&1
```

**Using Calendar Reminder:**
1. Open Calendar app
2. Create daily event at 6 AM
3. Set alert with "Open File" → select `daily_update.sh`

**Pros:** Completely automatic
**Cons:** Your Mac must be awake and running

---

## 🆘 Troubleshooting

### **"Command not found: daily_update.sh"**

**Fix:**
```bash
# Make script executable
chmod +x /Users/sreenathgovindarajan/Documents/india-ai-tracker/backend/scripts/*.sh
```

---

### **"Groq rate limit exceeded"**

**What happened:** You hit the free tier limit (unlikely - limit is 14,400/day)

**Fix:** The system automatically switches to Ollama (local processing). You'll see:
```
⚠️  Groq quota exceeded, switching to Ollama
```

It will take longer (2-3 hours instead of 15 minutes) but will complete successfully.

---

### **"Ollama connection refused"**

**What happened:** Ollama isn't running (only matters if Groq fails)

**Fix:**
```bash
# Install Ollama (one-time setup)
brew install ollama

# Start Ollama service
ollama serve

# In another terminal, pull the model
ollama pull llama3.2:3b
```

---

### **"Processing seems stuck"**

**What to do:**
1. Check `reports/daily_report_YYYY-MM-DD.json` for latest status
2. Look at checkpoint: `cat checkpoints/layer2_YYYY-MM-DD.json`
3. Wait 5 minutes - it might just be processing slowly
4. If truly stuck, press Ctrl+C and run again (it will resume)

---

### **"Too many articles to process"**

**Normal:** 2,000-3,500 articles per day is expected

**If it seems excessive:**
- Check `sources.json` - maybe a source is providing duplicates
- Check deduplication is working: Look for "Duplicates removed: XXX" in output

---

## 📊 Understanding the Reports

After processing, you get a report in `reports/daily_report_YYYY-MM-DD.json`:

```json
{
  "date": "2026-01-27",
  "layers": {
    "layer1": {
      "input": 2283,
      "passed": 1247,
      "rejected": 1036,
      "pass_rate": 0.546,
      "time_seconds": 0.8
    },
    "layer2": {
      "provider": "groq",
      "fallback_triggered": false,
      "input": 1247,
      "ai_relevant": 1038,
      "not_relevant": 209,
      "time_seconds": 1104,
      "quota_used": {
        "groq": "1247/14400 (8.7%)"
      }
    },
    "layer3": {
      "provider": "gemini",
      "input": 42,
      "processed": 42,
      "failed": 0,
      "time_seconds": 72,
      "quota_used": {
        "gemini": "42/1500 (2.8%)"
      }
    }
  },
  "summary": {
    "total_input": 2283,
    "total_output": 1038,
    "premium_articles": 42,
    "total_time_seconds": 1177,
    "total_cost": 0.00
  }
}
```

**What to look for:**
- **pass_rate:** Should be ~40-55%
- **fallback_triggered:** Should be false (if true, Groq had issues)
- **quota_used:** Should be well under limits
- **total_cost:** Should be $0.00

---

## 🎯 Daily Workflow

### **Morning Routine (5 minutes of your time):**

1. **Run the update:**
   ```bash
   cd backend
   ./scripts/daily_update.sh
   ```

2. **Go make coffee** ☕ (it runs in background for 20 minutes)

3. **Come back and check the report:**
   ```bash
   cat reports/daily_report_$(date +%Y-%m-%d).json | grep "total_output"
   ```

4. **Deploy to website (optional):**
   ```bash
   ./scripts/04_deploy.sh
   ```

Done! Your website now has fresh articles.

---

## 📅 Weekly Maintenance

### **Once a week, check:**

1. **API quotas** (make sure you're not approaching limits)
   - Groq dashboard: https://console.groq.com/usage
   - Gemini dashboard: https://console.cloud.google.com/

2. **Borderline articles** (refine your filters)
   - Log into admin panel: http://localhost:5001/admin
   - Review "Borderline Articles" section
   - Mark false positives/negatives

3. **Reports folder** (delete old reports if too many)
   ```bash
   cd backend/reports
   # Keep last 30 days, delete older
   find . -name "*.json" -mtime +30 -delete
   ```

---

## 🔧 Configuration Changes

### **Change Number of Premium Articles**

Edit `backend/.env`:
```bash
LAYER3_TOP_N=50  # Change from 50 to your preferred number
```

---

### **Change Batch Size**

Edit `backend/.env`:
```bash
LAYER2_BATCH_SIZE=10  # Process 10 articles at a time
```

Larger = faster but more risk if API fails
Smaller = slower but safer

---

### **Force Local Processing (No APIs)**

Edit `backend/.env`:
```bash
LAYER2_PROVIDER=ollama  # Use local instead of Groq
LAYER3_PROVIDER=groq    # Use Groq instead of Gemini (or skip Layer 3)
```

---

## 📚 Related Documentation

- **Setup & Configuration:** See `docs/CONFIG_OVERVIEW.md`
- **System Architecture:** See `docs/ARCHITECTURE.md`
- **Troubleshooting:** See `docs/TROUBLESHOOTING.md` (coming soon)

---

## ✅ Quick Reference

| Command | What It Does | Time |
|---------|--------------|------|
| `./scripts/daily_update.sh` | Everything (recommended) | 20-30 min |
| `./scripts/01_scrape.sh` | Scraping only | 10 min |
| `./scripts/02_process.sh` | Processing only | 15-20 min |
| `./scripts/03_export.sh` | Export JSON | 5 sec |
| `./scripts/04_deploy.sh` | Deploy to website | 1 min |
| `python3 run_scraper_only.py` | Scrape (Python) | 10 min |
| `python3 run_processor_hybrid.py` | Process (Python) | 15-20 min |
| `python3 check_status.py` | Check status | 1 sec |

---

## 💡 Tips

1. **Run in the morning** so articles are fresh for the day
2. **Check the report** to make sure everything worked
3. **Don't run multiple times** in one day (unnecessary)
4. **Let it finish** - don't interrupt unless stuck (it checkpoints anyway)
5. **Keep your Mac awake** during processing (it needs internet)

---

## 🆘 Need Help?

1. Check the report: `reports/daily_report_*.json`
2. Check the logs: `backend/logs/processor.log`
3. Read the troubleshooting section above
4. Check CONFIG_OVERVIEW.md for API setup issues
5. Restore from backup if needed: `git checkout backup-before-hybrid-pipeline`

**Remember:** The system is designed to be resilient. If something fails, it will:
1. Try again automatically
2. Switch to fallback provider
3. Save progress so you can resume
