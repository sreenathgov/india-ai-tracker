#!/bin/bash

#
# Daily Update Script
# Runs scraper + 3-layer processing pipeline
#

cd "$(dirname "$0")/.." || exit 1

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║         India AI Tracker - Daily Update                   ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "Started at: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# Step 1: Run Scraper
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 1: SCRAPING RSS FEEDS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

PYTHONPATH=. venv/bin/python3 scripts/scrape_rss.py

SCRAPE_EXIT=$?

if [ $SCRAPE_EXIT -ne 0 ]; then
    echo ""
    echo "❌ Scraper failed with exit code $SCRAPE_EXIT"
    exit 1
fi

echo ""
echo "✅ Scraping complete!"
echo ""

# Step 2: Run 3-Layer Pipeline
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 2: PROCESSING WITH 3-LAYER PIPELINE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

PYTHONPATH=. venv/bin/python3 ai/integrated_pipeline.py

PIPELINE_EXIT=$?

if [ $PIPELINE_EXIT -ne 0 ]; then
    echo ""
    echo "❌ Pipeline failed with exit code $PIPELINE_EXIT"
    exit 1
fi

echo ""
echo "✅ Processing complete!"
echo ""

# Step 3: Show Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

PYTHONPATH=. venv/bin/python3 -c "
from app import app, db, Update
from datetime import datetime

with app.app_context():
    today = datetime.now().date().isoformat()

    # Today's stats
    today_total = Update.query.filter(Update.date_scraped >= today).count()
    today_ai = Update.query.filter(
        Update.date_scraped >= today,
        Update.is_ai_relevant == True
    ).count()
    today_approved = Update.query.filter(
        Update.date_scraped >= today,
        Update.is_approved == True
    ).count()
    today_premium = Update.query.filter(
        Update.date_scraped >= today,
        Update.premium_processed == True
    ).count()

    # Overall stats
    total = Update.query.count()
    total_approved = Update.query.filter_by(is_approved=True).count()

    print(f'Today ({today}):')
    print(f'  Scraped: {today_total}')
    print(f'  AI-relevant: {today_ai}')
    print(f'  Auto-approved: {today_approved}')
    print(f'  Premium processed: {today_premium}')
    print()
    print(f'Total database:')
    print(f'  All articles: {total}')
    print(f'  Published (approved): {total_approved}')
    print()
" 2>&1 | grep -v "Warning\|FutureWarning\|Database initialized"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ DAILY UPDATE COMPLETE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Finished at: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# Show latest report
echo "📊 Latest pipeline report:"
ls -t reports/pipeline_*.json 2>/dev/null | head -1

echo ""
