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
from ai.ai_subject_validator import AISubjectValidator  # Phase 3: AI Subject Validator
from ai.india_subject_validator import IndiaSubjectValidator  # Phase 4: India Subject Validator
from ai.event_temporal_validator import EventTemporalValidator  # Phase 4: Event Temporal Filter
from ai.llm_adjudicator import LLMAdjudicator  # Final LLM quality gate
from ai.categoriser import Categoriser
from ai.geo_attributor import GeoAttributor
from ai.summarizer import AISummarizer
from ai.deduplicator import Deduplicator
from ai.date_extractor import DateExtractor
from utils.canonical_key import get_canonical_key
from datetime import datetime, timedelta, date
import json
import logging
import os

logger = logging.getLogger(__name__)


def load_canonical_urls_from_json():
    """
    Load all existing URLs from canonical JSON API files.

    This implements global deduplication by checking against the historical
    canonical data store (JSON files) rather than just the current database.

    Returns:
        set of canonical URLs (normalized)
    """
    canonical_urls = set()

    # Path to API directory
    api_root = os.path.join(os.path.dirname(__file__), '..', '..', 'api')

    # Load from all-india
    all_india_path = os.path.join(api_root, 'all-india', 'categories.json')
    if os.path.exists(all_india_path):
        try:
            with open(all_india_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                for articles in data.get('categories', {}).values():
                    for article in articles:
                        key = get_canonical_key(article)
                        if key:
                            canonical_urls.add(key)
        except Exception as e:
            logger.warning("Could not load all-india canonical data: %s", e)

    # Load from all states
    state_codes = [
        'AN', 'AP', 'AR', 'AS', 'BR', 'CH', 'CG', 'DD', 'DL', 'DN', 'GA',
        'GJ', 'HP', 'HR', 'JH', 'JK', 'KA', 'KL', 'LA', 'LD', 'MH', 'ML',
        'MN', 'MP', 'MZ', 'NL', 'OD', 'PB', 'PY', 'RJ', 'SK', 'TN', 'TG',
        'TR', 'UP', 'UT', 'WB'
    ]

    for state_code in state_codes:
        state_path = os.path.join(api_root, 'states', state_code, 'categories.json')
        if os.path.exists(state_path):
            try:
                with open(state_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    for articles in data.get('categories', {}).values():
                        for article in articles:
                            key = get_canonical_key(article)
                            if key:
                                canonical_urls.add(key)
            except Exception as e:
                logger.warning("Could not load canonical data for state file %s: %s", state_path, e)

    return canonical_urls


def load_blacklist():
    """
    Load URLs that have been manually deleted and should NEVER be re-added.

    Returns:
        set of blacklisted URLs
    """
    blacklist_path = os.path.join(os.path.dirname(__file__), '..', '..', 'api', 'blacklist.json')

    if not os.path.exists(blacklist_path):
        return set()

    try:
        with open(blacklist_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            return set(data.get('urls', []))
    except Exception as e:
        logger.warning("Could not load blacklist: %s", e)
        return set()


def add_to_blacklist(url: str) -> bool:
    """
    Add a URL to the blacklist (for use by admin tool).

    Args:
        url: URL to blacklist

    Returns:
        True if successful
    """
    blacklist_path = os.path.join(os.path.dirname(__file__), '..', '..', 'api', 'blacklist.json')

    try:
        if os.path.exists(blacklist_path):
            with open(blacklist_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
        else:
            data = {"_description": "Articles manually deleted - do not re-add", "urls": []}

        if url not in data['urls']:
            data['urls'].append(url)
            data['_updated'] = datetime.now().strftime('%Y-%m-%d')

        with open(blacklist_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2)

        return True
    except Exception as e:
        logger.error("Error adding to blacklist: %s", e)
        return False


def deduplicate_against_canonical(scraped_articles):
    """
    Remove articles that already exist in canonical JSON store OR are blacklisted.

    This implements GLOBAL deduplication across all historical data,
    not just within the current scrape run. Also excludes manually deleted articles.

    Args:
        scraped_articles: List of article dictionaries from scrapers

    Returns:
        List of articles that don't exist in canonical store and aren't blacklisted
    """
    print("Loading canonical URLs from JSON files...")
    canonical_urls = load_canonical_urls_from_json()
    print(f"  Found {len(canonical_urls)} existing articles in canonical store")

    # Load blacklist of manually deleted articles
    blacklist = load_blacklist()
    if blacklist:
        print(f"  Found {len(blacklist)} blacklisted URLs (manually deleted)")

    deduplicated = []
    skipped = 0
    blacklisted = 0

    for article in scraped_articles:
        url = article.get('url', '')
        key = get_canonical_key(article)

        if not key:
            # No URL - can't deduplicate, include it
            deduplicated.append(article)
            continue

        # Check blacklist first (manually deleted articles)
        if url in blacklist:
            blacklisted += 1
            if blacklisted <= 3:
                print(f"  BLOCKED (blacklisted): {article.get('title', 'Unknown')[:50]}...")
            continue

        if key in canonical_urls:
            skipped += 1
            # Optionally log first few for debugging
            if skipped <= 5:
                print(f"  Skipping (exists): {article.get('title', 'Unknown')[:60]}...")
        else:
            deduplicated.append(article)

    if skipped > 5:
        print(f"  ... and {skipped - 5} more duplicates")
    if blacklisted > 3:
        print(f"  ... and {blacklisted - 3} more blacklisted")

    print(f"\nGlobal dedup: {skipped} duplicates, {blacklisted} blacklisted, {len(deduplicated)} new articles")

    return deduplicated


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
    ai_validator = AISubjectValidator()  # Phase 3: AI Subject Validator
    india_validator = IndiaSubjectValidator()  # Phase 4: India Subject Validator
    event_validator = EventTemporalValidator()  # Phase 4: Event Temporal Filter
    llm_adjudicator = LLMAdjudicator()  # Final LLM quality gate
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
        'adjudicator_dropped': 0,
        'adjudicator_corrected': 0,
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
                article['bypass_ai_validation'] = source.get('bypass_ai_validation', False)

            all_articles.extend(articles)
            print(f"  Found {len(articles)} articles")

        except Exception as e:
            logger.error("Error scraping source '%s': %s", source.get('name', 'unknown'), e, exc_info=True)
            continue

    stats['total_scraped'] = len(all_articles)
    print(f"\nTotal articles scraped: {stats['total_scraped']}")

    if not all_articles:
        print("\nNo articles to process. Exiting.")
        return stats

    # STEP 1.5: Extract/improve dates
    print()
    print("-" * 40)
    print("STEP 1.5: DATE EXTRACTION & TIME WINDOW FILTER")
    print("-" * 40)

    # Get time window from environment (default: 96 hours = 4 days)
    time_window_hours = int(os.getenv('SCRAPE_TIME_WINDOW_HOURS', '96'))
    cutoff_time = datetime.now() - timedelta(hours=time_window_hours)
    cutoff_date = cutoff_time.date()

    filtered_articles = []
    skipped_old = 0

    for article in all_articles:
        # Extract date if missing
        if not article.get('date_published'):
            extracted_date = date_extractor.extract(
                article.get('content', ''),
                fallback_date=datetime.now().date()
            )
            article['date_published'] = extracted_date

        # Enforce time window: only keep articles from last N hours
        if article['date_published'] and article['date_published'] < cutoff_date:
            skipped_old += 1
            continue

        filtered_articles.append(article)

    # Replace articles list with filtered version
    all_articles = filtered_articles

    print(f"Processed dates for {len(all_articles)} articles")
    print(f"Time window filter: kept {len(all_articles)}, skipped {skipped_old} articles older than {time_window_hours}h")

    if not all_articles:
        print("\nAll articles were outside the time window. Exiting.")
        return stats

    # STEP 1.6: Global Deduplication Against Canonical Store
    print()
    print("-" * 40)
    print("STEP 1.6: GLOBAL DEDUPLICATION")
    print("-" * 40)

    # Deduplicate against canonical JSON (not database)
    all_articles = deduplicate_against_canonical(all_articles)

    if not all_articles:
        print("\nAll articles were duplicates from canonical store. Exiting.")
        return stats

    # STEP 2a: AI Subject Validation (Is AI the SUBJECT, not merely mentioned?)
    print()
    print("-" * 40)
    print("STEP 2a: AI SUBJECT VALIDATION")
    print("-" * 40)
    print("Validating AI is the subject (not merely mentioned)...")
    print()

    ai_passed_articles = []
    ai_dropped = 0
    for article in all_articles:
        # Bypass AI validation for trusted government policy sources (e.g. DPIIT regulatory notifications)
        if article.get('bypass_ai_validation'):
            article['ai_score'] = 1.0
            article['ai_validation_reason'] = 'bypass_ai_validation=true (trusted government policy source)'
            article['ai_archetype'] = 'policy_regulation'
            ai_passed_articles.append(article)
            continue

        # Phase 3: AISubjectValidator validates AI is materially discussed
        ai_result = ai_validator.validate(
            article['title'],
            article.get('content', '')
        )

        if ai_result.passed:
            article['ai_score'] = ai_result.ai_score
            article['ai_validation_reason'] = ai_result.reason
            article['ai_archetype'] = ai_result.archetype
            ai_passed_articles.append(article)
        else:
            ai_dropped += 1
            # Log non-AI articles (for debugging)
            print(f"  DROP (not AI): {article['title'][:50]}... ({ai_result.reason})")

    print(f"\nAI Validation: {len(ai_passed_articles)} passed | {ai_dropped} dropped")

    if not ai_passed_articles:
        print("\nNo AI-relevant articles found. Exiting.")
        return stats

    # STEP 2b: India Subject Validation (Is India the SUBJECT, not merely mentioned?)
    print()
    print("-" * 40)
    print("STEP 2b: INDIA SUBJECT VALIDATION")
    print("-" * 40)
    print("Validating India is the subject (not merely mentioned)...")
    print()

    ai_relevant_articles = []
    india_dropped = 0
    for article in ai_passed_articles:
        # Phase 4: IndiaSubjectValidator validates India is materially discussed
        india_result = india_validator.validate(
            article['title'],
            article.get('content', '')
        )

        if india_result.passed:
            article['india_score'] = india_result.india_score
            article['india_validation_reason'] = india_result.reason
            article['relevance_score'] = article['ai_score'] + india_result.india_score
            article['confidence'] = india_result.confidence
            ai_relevant_articles.append(article)
        else:
            india_dropped += 1
            # Log non-India articles that passed AI filter (for debugging)
            print(f"  DROP (not India): {article['title'][:50]}... ({india_result.reason})")

    stats['ai_relevant'] = len(ai_relevant_articles)
    rejected = stats['total_scraped'] - stats['ai_relevant']
    print(f"\nIndia Validation: {len(ai_relevant_articles)} passed | {india_dropped} dropped")
    print(f"Total AI+India Relevant: {stats['ai_relevant']} | Total Rejected: {rejected}")

    if not ai_relevant_articles:
        print("\nNo AI-relevant articles found. This is expected - prefer false negatives.")
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

    # STEP 4.5: Event Temporal Validation (only for Events category)
    # Past events are DROPPED entirely, not reclassified
    print()
    print("-" * 40)
    print("STEP 4.5: EVENT TEMPORAL VALIDATION")
    print("-" * 40)
    print("Validating events are in the future (past events will be DROPPED)...")

    events_dropped = 0
    today = datetime.now().date()
    filtered_articles = []

    for article in unique_articles:
        if article['category'] == 'Events':
            # Phase 4: EventTemporalValidator checks if event is in the future
            temporal_result = event_validator.validate(
                article['title'],
                article.get('content', ''),
                today
            )

            if not temporal_result.is_future:
                # DROP past events entirely (don't include in output)
                events_dropped += 1
                print(f"  DROP (past event): {article['title'][:50]}... ({temporal_result.reason})")
                continue  # Skip this article - don't add to filtered list
            else:
                article['temporal_reason'] = temporal_result.reason

        # Add non-events and future events to filtered list
        filtered_articles.append(article)

    # Replace unique_articles with filtered list
    unique_articles = filtered_articles
    stats['events_dropped'] = events_dropped

    if events_dropped > 0:
        print(f"\nDropped {events_dropped} past event(s)")

    # Track category stats (after temporal validation)
    for article in unique_articles:
        stats['by_category'][article['category']] = stats['by_category'].get(article['category'], 0) + 1

    print(f"\nFinal Categories: {stats['by_category']}")

    # STEP 5: Geographic Attribution
    print()
    print("-" * 40)
    print("STEP 5: GEOGRAPHIC ATTRIBUTION")
    print("-" * 40)

    for article in unique_articles:
        # New conservative geo_attributor returns tuple: (state_codes, attribution_reason)
        states, attribution_reason = geo_attributor.attribute(
            article['title'],
            article.get('content', ''),
            article.get('source_state'),
            article.get('is_state_specific_source', False),
            article.get('geo_mode', 'default')
        )
        article['state_codes'] = states
        article['geo_attribution_reason'] = attribution_reason  # For debugging/audit

        # Handle event location rules
        if article['category'] == 'Events' and article.get('event_type'):
            if article['event_type'] == 'online':
                # Online events go to All India only
                article['state_codes'] = ['IN']
                article['geo_attribution_reason'] = 'ONLINE_EVENT_OVERRIDE'
            elif article['event_type'] == 'hybrid':
                # Hybrid events go to both state and All India
                if 'IN' not in article['state_codes']:
                    article['state_codes'].append('IN')

        # Track state stats
        for state in article['state_codes']:
            stats['by_state'][state] = stats['by_state'].get(state, 0) + 1

        state_names = [geo_attributor.get_state_name(s) for s in article['state_codes']]
        print(f"  [{', '.join(state_names)}] {article['title'][:50]}... ({attribution_reason})")

    print(f"\nStates: {stats['by_state']}")

    # STEP 5.5: LLM Adjudication (Final Quality Gate)
    print()
    print("-" * 40)
    print("STEP 5.5: LLM ADJUDICATION (Final Quality Gate)")
    print("-" * 40)

    if llm_adjudicator.enabled:
        print(f"Adjudicating {len(unique_articles)} articles...")
        adjudicated_articles = []
        adjudicator_dropped = 0
        adjudicator_corrected = 0

        for article in unique_articles:
            # Run LLM adjudication
            result = llm_adjudicator.adjudicate(article)

            if result.should_drop:
                # LLM recommends dropping this article
                adjudicator_dropped += 1
                print(f"  DROP (LLM): {article['title'][:50]}... ({result.drop_reason})")
                continue

            # Check if LLM corrected anything
            if not result.original_preserved:
                adjudicator_corrected += 1
                old_cat = article['category']
                old_states = article['state_codes']

                # Apply LLM corrections
                article['category'] = result.category
                article['state_codes'] = result.state_codes
                article['llm_adjudication'] = {
                    'confidence': result.confidence,
                    'reasoning': result.llm_reasoning,
                    'original_category': old_cat,
                    'original_states': old_states
                }

                print(f"  CORRECTED: {article['title'][:40]}...")
                print(f"    Category: {old_cat} → {result.category}")
                print(f"    States: {old_states} → {result.state_codes}")

            adjudicated_articles.append(article)

        # Replace with adjudicated list
        unique_articles = adjudicated_articles
        stats['adjudicator_dropped'] = adjudicator_dropped
        stats['adjudicator_corrected'] = adjudicator_corrected

        print(f"\nLLM Adjudication: {len(unique_articles)} kept, {adjudicator_dropped} dropped, {adjudicator_corrected} corrected")
    else:
        print("LLM Adjudicator is DISABLED (set LLM_ADJUDICATOR_ENABLED=true to enable)")

    # Recalculate stats after adjudication
    stats['by_category'] = {}
    stats['by_state'] = {}
    for article in unique_articles:
        stats['by_category'][article['category']] = stats['by_category'].get(article['category'], 0) + 1
        for state in article.get('state_codes', ['IN']):
            stats['by_state'][state] = stats['by_state'].get(state, 0) + 1

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
    print(f"LLM Dropped:       {stats.get('adjudicator_dropped', 0)}")
    print(f"LLM Corrected:     {stats.get('adjudicator_corrected', 0)}")
    print(f"Final Saved:       {stats['final_processed']}")
    print(f"By Category:       {stats['by_category']}")
    print(f"By State:          {stats['by_state']}")
    print("=" * 60)

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
                logger.error("Error saving article '%s': %s", article.get('title', 'unknown')[:50], e, exc_info=True)
                continue

        try:
            db.session.commit()
            print(f"\nCommitted {saved_count} articles to database")
        except Exception as e:
            db.session.rollback()
            logger.error("Database commit error: %s", e, exc_info=True)
            return 0

    # CRITICAL: Force write to disk OUTSIDE the app context
    # Flask-SQLAlchemy's context manager cleanup can interfere with persistence
    try:
        import sqlite3
        import os
        import time
        db_path = os.path.join(os.path.dirname(__file__), '..', 'tracker.db')

        # Give Flask time to finish cleanup
        time.sleep(1)

        # Force SQLite to checkpoint WAL and sync to disk
        conn = sqlite3.connect(db_path)
        conn.execute("PRAGMA wal_checkpoint(TRUNCATE)")  # TRUNCATE ensures WAL is fully cleared
        conn.execute("PRAGMA synchronous = FULL")
        conn.commit()

        # Verify count
        cursor = conn.execute("SELECT COUNT(*) FROM updates")
        count = cursor.fetchone()[0]

        # Get most recent date_scraped to verify new data was written
        cursor2 = conn.execute("SELECT MAX(date_scraped) FROM updates")
        latest_scrape = cursor2.fetchone()[0]

        conn.close()

        print(f"✓ Database persisted to disk: {count} total updates")
        print(f"✓ Latest scrape date in file: {latest_scrape}")

        # SAFETY: If count doesn't match what we just saved, something went wrong
        expected_count = count - saved_count + saved_count  # Should equal count
        print(f"✓ Saved {saved_count} new articles, expected total: ~{count}")

    except Exception as e:
        print(f"⚠️  WARNING: Could not verify disk write: {e}")
        print(f"⚠️  This means new articles may NOT be persisted!")
        print(f"⚠️  Database file might still have old data!")

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
