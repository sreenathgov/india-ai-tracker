"""
Scheduled Scraping - Daily at 10 AM IST

This script runs the scraping pipeline on a schedule.
Can be run as a background process or configured with cron/launchd.

Usage:
  Option 1: Run directly (keeps running in terminal)
    python3 scheduler.py

  Option 2: Use cron (add to crontab -e):
    30 4 * * * cd /path/to/backend && python3 -m scrapers.orchestrator >> logs/scraper.log 2>&1
    (4:30 AM UTC = 10:00 AM IST)

  Option 3: Use macOS launchd (see README)
"""

import schedule
import time
from datetime import datetime
import os
import sys

# Ensure we can import from parent directory
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


def run_scraper():
    """Run the scraping pipeline."""
    print(f"\n{'='*60}")
    print(f"SCHEDULED SCRAPE - {datetime.now().strftime('%Y-%m-%d %H:%M:%S IST')}")
    print(f"{'='*60}")

    try:
        from scrapers.orchestrator import run_all_scrapers
        stats = run_all_scrapers()

        # Log results
        print(f"\nScrape completed: {stats.get('final_processed', 0)} articles saved")

    except Exception as e:
        print(f"Scraper error: {e}")


def main():
    """Main scheduler loop."""
    print("=" * 60)
    print("INDIA AI TRACKER - SCHEDULER")
    print("=" * 60)
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    print("Schedule: Daily at 10:00 AM IST")
    print("Press Ctrl+C to stop")
    print()

    # Schedule daily at 10:00 AM IST
    # Note: 'schedule' library uses local time, so this works if your system is in IST
    # If system is in UTC, use 04:30 (10:00 IST = 04:30 UTC)
    schedule.every().day.at("10:00").do(run_scraper)

    # Also run immediately on start (optional - remove if not wanted)
    print("Running initial scrape now...")
    run_scraper()

    print("\nScheduler active. Waiting for next scheduled run...")

    while True:
        schedule.run_pending()
        time.sleep(60)  # Check every minute


if __name__ == '__main__':
    main()
