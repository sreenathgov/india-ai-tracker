"""
Scraper Orchestrator - Main Pipeline

Pipeline Flow:
1. Load sources from configuration
2. Scrape articles from each source
3. Apply AI relevance filter (STRICT - prefer false negatives)
4. Deduplicate articles
5. Categorise into 4 categories
6. Attribute to states (geographic attribution)
7. Generate summaries
8. Save to database

Design Philosophy:
- Prefer false negatives over false positives
- Do not invent relevance, geography, or category
- Rejection of an item is a valid and expected outcome
"""

from scrapers.rss_scraper import RSScraper
from scrapers.web_scraper import WebScraper
from ai.filter import AIFilter
from ai.categoriser import Categoriser
from ai.geo_attributor import GeoAttributor
from ai.summarizer import AISummarizer
from ai.deduplicator import Deduplicator
from ai.date_extractor import DateExtractor
from datetime import datetime
import json
import os


def cleanup_database_session(db):
    """
    Ensure database changes are persisted to disk.

    Critical for Flask-SQLAlchemy 3.x with SQLite:
    - commit() writes to WAL (Write-Ahead Log)
    - close() closes the session
    - dispose() ensures all connections are closed and WAL is checkpointed

    Without this, changes remain in memory/WAL and aren't persisted to the .db file.
    """
    try:
        db.session.commit()
        db.session.close()
        db.engine.dispose()
        return True
    except Exception as e:
        print(f"⚠️  Database cleanup error: {e}")
        return False


def run_all_scrapers(target_states=None):
    """
    Main function to run all scrapers.

    Args:
        target_states: List of state codes to scrape for (e.g., ['TN', 'KA'])
                      If None, scrapes all configured states plus national sources.

    Returns:
        dict with scraping statistics
    """
    print("=" * 60)
    print("INDIA AI TRACKER - SCRAPING PIPELINE")
    print("=" * 60)
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()

    # Initialize components
    rss_scraper = RSScraper()
    web_scraper = WebScraper()
    ai_filter = AIFilter()
    categoriser = Categoriser()
    geo_attributor = GeoAttributor()
    summarizer = AISummarizer()
    deduplicator = Deduplicator()
    date_extractor = DateExtractor()

    # Load sources
    sources = load_sources(target_states)
    print(f"Loaded {len(sources)} sources to scrape")
    print()

    # Statistics
    stats = {
        'total_scraped': 0,
        'ai_relevant': 0,
        'duplicates_removed': 0,
        'final_processed': 0,
        'by_state': {},
        'by_category': {},
        'timestamp': datetime.now().isoformat()
    }

    all_articles = []

    # STEP 1: Scrape from each source
    print("-" * 40)
    print("STEP 1: SCRAPING SOURCES")
    print("-" * 40)

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

            # Add source metadata to each article
            for article in articles:
                article['source_name'] = source['name']
                article['source_state'] = source.get('state')
                article['is_state_specific_source'] = source.get('is_state_specific', False)
                article['geo_mode'] = source.get('geo_mode', 'default')
                article['category_hint'] = source.get('category_hint')

            all_articles.extend(articles)
            print(f"  Found {len(articles)} articles")

        except Exception as e:
            print(f"  Error: {e}")
            continue

    stats['total_scraped'] = len(all_articles)
    print(f"\nTotal articles scraped: {stats['total_scraped']}")

    if not all_articles:
        print("\nNo articles to process. Exiting.")
        return stats

    # STEP 1.5: Extract/improve dates
    print()
    print("-" * 40)
    print("STEP 1.5: DATE EXTRACTION")
    print("-" * 40)

    for article in all_articles:
        if not article.get('date_published'):
            # Try to extract from content
            extracted_date = date_extractor.extract(
                article.get('content', ''),
                fallback_date=datetime.now().date()
            )
            article['date_published'] = extracted_date

    print(f"Processed dates for {len(all_articles)} articles")

    # STEP 2: AI Relevance Filter (STRICT)
    print()
    print("-" * 40)
    print("STEP 2: AI RELEVANCE FILTER")
    print("-" * 40)
    print("Applying strict AI relevance filter...")
    print()

    ai_relevant_articles = []
    for article in all_articles:
        is_relevant, score = ai_filter.check_relevance(
            article['title'],
            article.get('content', '')
        )

        if is_relevant:
            article['relevance_score'] = score
            ai_relevant_articles.append(article)

    stats['ai_relevant'] = len(ai_relevant_articles)
    rejected = stats['total_scraped'] - stats['ai_relevant']
    print(f"\nAI Relevant: {stats['ai_relevant']} | Rejected: {rejected}")

    if not ai_relevant_articles:
        print("\nNo AI-relevant articles found. This is expected - prefer false negatives.")
        cleanup_database_session(db)
        return stats

    # STEP 3: Deduplication
    print()
    print("-" * 40)
    print("STEP 3: DEDUPLICATION")
    print("-" * 40)

    unique_articles = []
    for article in ai_relevant_articles:
        if not deduplicator.is_duplicate(article['url'], article['title']):
            unique_articles.append(article)
        else:
            stats['duplicates_removed'] += 1

    print(f"Unique articles: {len(unique_articles)} | Duplicates removed: {stats['duplicates_removed']}")

    if not unique_articles:
        print("\nAll articles were duplicates. Exiting.")
        cleanup_database_session(db)
        return stats

    # STEP 4: Categorisation
    print()
    print("-" * 40)
    print("STEP 4: CATEGORISATION")
    print("-" * 40)

    for article in unique_articles:
        category, event_type = categoriser.categorise(
            article['title'],
            article.get('content', ''),
            article.get('category_hint')
        )
        article['category'] = category
        article['event_type'] = event_type

        # Track category stats
        stats['by_category'][category] = stats['by_category'].get(category, 0) + 1

    print(f"\nCategories: {stats['by_category']}")

    # STEP 5: Geographic Attribution
    print()
    print("-" * 40)
    print("STEP 5: GEOGRAPHIC ATTRIBUTION")
    print("-" * 40)

    for article in unique_articles:
        states = geo_attributor.attribute(
            article['title'],
            article.get('content', ''),
            article.get('source_state'),
            article.get('is_state_specific_source', False),
            article.get('geo_mode', 'default')
        )
        article['state_codes'] = states

        # Handle event location rules
        if article['category'] == 'Events' and article.get('event_type'):
            if article['event_type'] == 'online':
                # Online events go to All India only
                article['state_codes'] = ['IN']
            elif article['event_type'] == 'hybrid':
                # Hybrid events go to both state and All India
                if 'IN' not in article['state_codes']:
                    article['state_codes'].append('IN')

        # Track state stats
        for state in article['state_codes']:
            stats['by_state'][state] = stats['by_state'].get(state, 0) + 1

        state_names = [geo_attributor.get_state_name(s) for s in article['state_codes']]
        print(f"  [{', '.join(state_names)}] {article['title'][:50]}...")

    print(f"\nStates: {stats['by_state']}")

    # STEP 6: Generate Summaries
    print()
    print("-" * 40)
    print("STEP 6: GENERATING SUMMARIES")
    print("-" * 40)

    for i, article in enumerate(unique_articles):
        print(f"  Summarizing {i+1}/{len(unique_articles)}...", end='\r')
        article['summary'] = summarizer.summarize(
            article['title'],
            article.get('content', '')
        )

    print(f"\nGenerated {len(unique_articles)} summaries")

    # STEP 7: Save to Database
    print()
    print("-" * 40)
    print("STEP 7: SAVING TO DATABASE")
    print("-" * 40)

    saved_count = save_to_database(unique_articles)
    stats['final_processed'] = saved_count

    # Final Summary
    print()
    print("=" * 60)
    print("PIPELINE COMPLETE")
    print("=" * 60)
    print(f"Total Scraped:     {stats['total_scraped']}")
    print(f"AI Relevant:       {stats['ai_relevant']}")
    print(f"Duplicates:        {stats['duplicates_removed']}")
    print(f"Final Saved:       {stats['final_processed']}")
    print(f"By Category:       {stats['by_category']}")
    print(f"By State:          {stats['by_state']}")
    print("=" * 60)

    # CRITICAL: Ensure database changes are persisted to disk
    if cleanup_database_session(db):
        print("\n✅ Database connection closed and changes persisted")

    return stats


def load_sources(target_states=None):
    """
    Load sources from JSON configuration.

    Args:
        target_states: Optional list of state codes to filter sources

    Returns:
        List of source configurations
    """
    sources_file = os.path.join(os.path.dirname(__file__), '..', 'sources.json')

    if not os.path.exists(sources_file):
        print(f"Warning: sources.json not found at {sources_file}")
        return []

    with open(sources_file, 'r') as f:
        data = json.load(f)

    sources = []

    # Always include national sources
    national = data.get('national', [])
    sources.extend([s for s in national if s.get('enabled', True)])

    # Include state-specific sources
    if target_states:
        # Only include specified states
        for state in target_states:
            state_key = state.lower().replace(' ', '_')
            # Try common key variations
            for key in [state_key, f"{state_key}_sources", state.lower()]:
                if key in data:
                    state_sources = data[key]
                    sources.extend([s for s in state_sources if s.get('enabled', True)])
                    break
    else:
        # Include all states
        for key, value in data.items():
            if key.startswith('_') or key == 'national':
                continue
            if isinstance(value, list):
                sources.extend([s for s in value if s.get('enabled', True)])

    return sources


def save_to_database(articles):
    """
    Save processed articles to database.

    Articles are saved with is_approved=True for now (auto-approve).
    This can be changed to False for manual review workflow.
    """
    if not articles:
        print("No articles to save")
        return 0

    # Import here to avoid circular imports
    from app import app, db, Update
    import json as json_lib

    saved_count = 0

    with app.app_context():
        for article in articles:
            try:
                # Check if URL already exists
                existing = db.session.query(Update).filter_by(url=article['url']).first()
                if existing:
                    print(f"  Skipping (exists): {article['title'][:50]}...")
                    continue

                # Create new update record
                new_update = Update(
                    title=article['title'],
                    url=article['url'],
                    summary=article.get('summary', ''),
                    content=article.get('content', ''),
                    date_published=article.get('date_published'),
                    source_name=article.get('source_name'),
                    category=article.get('category'),
                    state_codes=json_lib.dumps(article.get('state_codes', ['IN'])),
                    is_ai_relevant=True,
                    relevance_score=article.get('relevance_score', 0),
                    is_approved=True  # Auto-approve for now
                )

                db.session.add(new_update)
                saved_count += 1
                print(f"  Saved: {article['title'][:50]}...")

            except Exception as e:
                print(f"  Error saving: {e}")
                continue

        try:
            db.session.commit()
            print(f"\nCommitted {saved_count} articles to database")
        except Exception as e:
            db.session.rollback()
            print(f"\nDatabase commit error: {e}")
            return 0

    return saved_count


def clean_existing_summaries():
    """
    Clean preamble patterns from existing summaries in the database.
    Run this once to fix already-saved records.
    """
    import re
    from app import app, db, Update

    preamble_patterns = [
        r"^here is a \d+-?\d* sentence summary of the article[:\s]*",
        r"^here is a \d+-?\d* sentence summary[:\s]*",
        r"^here is a summary of the article in \d+-?\d* (?:concise )?sentences?[:\s]*",
        r"^here is a summary of the article[:\s]*",
        r"^here is a summary[:\s]*",
        r"^here is the summary[:\s]*",
        r"^here's a (?:\d+-?\d* sentence )?summary[:\s]*",
        r"^summary of the article[:\s]*",
        r"^summary[:\s]*",
        r"^the article (?:discusses|describes|reports|explains)[:\s]*",
        r"^this article (?:discusses|describes|reports|explains)[:\s]*",
        r"^in summary[,:\s]*",
        r"^to summarize[,:\s]*",
    ]

    print("Cleaning existing summaries...")

    with app.app_context():
        updates = Update.query.all()
        cleaned_count = 0

        for update in updates:
            if not update.summary:
                continue

            original = update.summary
            cleaned = update.summary

            for pattern in preamble_patterns:
                cleaned = re.sub(pattern, '', cleaned, flags=re.IGNORECASE).strip()

            if cleaned != original:
                update.summary = cleaned
                cleaned_count += 1
                print(f"  Cleaned: {update.title[:50]}...")

        if cleaned_count > 0:
            db.session.commit()
            print(f"\nCleaned {cleaned_count} summaries")
        else:
            print("\nNo summaries needed cleaning")

    return cleaned_count


# CLI entry point for testing
if __name__ == '__main__':
    import sys

    if len(sys.argv) > 1 and sys.argv[1] == '--clean-summaries':
        clean_existing_summaries()
    else:
        # Allow specifying states via command line
        states = sys.argv[1:] if len(sys.argv) > 1 else None

        if states:
            print(f"Scraping for states: {states}")
        else:
            print("Scraping all configured sources")

        run_all_scrapers(states)
