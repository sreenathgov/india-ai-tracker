"""
Scraper (Step 1 of 2): Fetch and Store Articles

This script ONLY scrapes articles and stores them with state=SCRAPED.
NO AI processing happens here.

Pipeline:
1. Fetch articles from RSS feeds and web scrapers
2. Deduplicate against last 14 days (URL + fuzzy title matching)
3. Save to database with processing_state='SCRAPED'
4. Exit

AI processing happens separately via run_processor.py

Usage:
    python3 run_scraper_only.py
"""

from scrapers.rss_scraper import RSScraper
from scrapers.web_scraper import WebScraper
from ai.deduplicator import Deduplicator
from ai.date_extractor import DateExtractor
from datetime import datetime
import json
import os
from app import app, db, Update


def load_sources(target_states=None):
    """Load source configuration from sources.json"""
    config_path = os.path.join(os.path.dirname(__file__), 'sources.json')

    with open(config_path, 'r') as f:
        config = json.load(f)

    # Combine all sources
    all_sources = []
    for category in config.values():
        if isinstance(category, list):
            all_sources.extend(category)

    # Filter by target states if specified
    if target_states:
        all_sources = [
            s for s in all_sources
            if s.get('state') is None or s.get('state') in target_states
        ]

    # Only enabled sources
    all_sources = [s for s in all_sources if s.get('enabled', True)]

    return all_sources


def run_scraper_only(target_states=None):
    """
    Scrape articles and save with state=SCRAPED (no AI processing).

    Args:
        target_states: List of state codes to scrape (None = all states)

    Returns:
        dict with statistics
    """
    print("=" * 70)
    print("INDIA AI TRACKER - SCRAPING ONLY")
    print("=" * 70)
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()

    # Initialize components
    rss_scraper = RSScraper()
    web_scraper = WebScraper()
    deduplicator = Deduplicator()
    date_extractor = DateExtractor()

    # Load sources
    sources = load_sources(target_states)
    print(f"Loaded {len(sources)} sources to scrape")
    print()

    # Statistics
    stats = {
        'total_scraped': 0,
        'duplicates_removed': 0,
        'new_articles_saved': 0,
        'timestamp': datetime.now().isoformat()
    }

    all_articles = []

    # STEP 1: Scrape from each source
    print("-" * 70)
    print("STEP 1: SCRAPING SOURCES")
    print("-" * 70)

    for source in sources:
        if not source.get('enabled', True):
            continue

        print(f"\nSource: {source['name']}")

        try:
            if source['type'] == 'rss':
                articles = rss_scraper.scrape(source['url'])
            elif source['type'] == 'web':
                scraper_type = source.get('scraper')
                articles = web_scraper.scrape(source['url'], scraper_type)
            else:
                print(f"  Skipping: Unknown type '{source['type']}'")
                continue

            # Add source metadata
            for article in articles:
                article['source_name'] = source['name']
                article['source_url'] = source['url']
                article['source_state'] = source.get('state')

            all_articles.extend(articles)
            print(f"  Found {len(articles)} articles")

        except Exception as e:
            print(f"  Error: {e}")
            continue

    stats['total_scraped'] = len(all_articles)
    print(f"\n✅ Total articles scraped: {stats['total_scraped']}")

    if not all_articles:
        print("\n⚠️  No articles to process. Exiting.")
        return stats

    # STEP 2: Extract/normalize dates
    print()
    print("-" * 70)
    print("STEP 2: DATE EXTRACTION")
    print("-" * 70)

    for article in all_articles:
        if not article.get('date_published'):
            extracted_date = date_extractor.extract(
                article.get('content', ''),
                fallback_date=datetime.now().date()
            )
            article['date_published'] = extracted_date

    print(f"✅ Processed dates for {len(all_articles)} articles")

    # STEP 3: Deduplication (14-day rolling window)
    print()
    print("-" * 70)
    print("STEP 3: DEDUPLICATION (14-DAY WINDOW)")
    print("-" * 70)

    unique_articles = []
    for article in all_articles:
        if not deduplicator.is_duplicate(article['url'], article['title']):
            unique_articles.append(article)
        else:
            stats['duplicates_removed'] += 1

    print(f"✅ Unique articles: {len(unique_articles)}")
    print(f"❌ Duplicates removed: {stats['duplicates_removed']}")

    if not unique_articles:
        print("\n⚠️  All articles were duplicates. Exiting.")
        return stats

    # STEP 4: Save to database with state=SCRAPED
    print()
    print("-" * 70)
    print("STEP 4: SAVING TO DATABASE (state=SCRAPED)")
    print("-" * 70)

    with app.app_context():
        for article in unique_articles:
            try:
                # Create update with SCRAPED state
                update = Update.Model(
                    title=article['title'],
                    url=article['url'],
                    content=article.get('content', ''),
                    date_published=article.get('date_published'),
                    date_scraped=datetime.utcnow(),
                    source_name=article.get('source_name'),
                    source_url=article.get('source_url'),
                    processing_state='SCRAPED',  # NOT processed yet
                    processing_attempts=0
                )

                db.session.add(update)
                stats['new_articles_saved'] += 1

            except Exception as e:
                print(f"  ❌ Error saving article: {e}")
                continue

        db.session.commit()

    print(f"✅ Saved {stats['new_articles_saved']} articles with state=SCRAPED")

    # Summary
    print()
    print("=" * 70)
    print("SCRAPING COMPLETED")
    print("=" * 70)
    print(f"Scraped:     {stats['total_scraped']}")
    print(f"Duplicates:  {stats['duplicates_removed']}")
    print(f"New articles: {stats['new_articles_saved']} (state=SCRAPED)")
    print()
    print("Next step: Run python3 run_processor.py to process SCRAPED articles")
    print("=" * 70)

    return stats


if __name__ == '__main__':
    """Run scraper when executed directly"""
    import sys

    # Optional: filter by state codes
    target_states = sys.argv[1:] if len(sys.argv) > 1 else None

    try:
        stats = run_scraper_only(target_states)
        sys.exit(0)
    except Exception as e:
        print(f"❌ Scraper failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
