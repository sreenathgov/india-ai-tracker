"""
Generate static JSON API files from database for Vercel deployment.

CRITICAL ARCHITECTURE CHANGE (2026-01-31):
======================================
The JSON files in api/ are now the CANONICAL STORE for historical data.
This script implements MERGE logic (not overwrite) to preserve data integrity.

KEY INVARIANTS:
1. JSON files are the source of truth (not SQLite database)
2. Each run MERGES new articles into existing JSON (never reduces count)
3. Uses canonical URL-based keys for global deduplication
4. "Latest wins" policy: newer date_published overwrites older for same URL

This script exports the database to JSON files that can be served
as a static API, eliminating the need for a backend server.
"""

import os
import json
import sys
from datetime import datetime, timezone, timedelta

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app import app, db, Update
from utils.canonical_key import get_canonical_key

def generate_static_api():
    """Generate all static JSON API files."""

    print("=" * 60)
    print("GENERATING STATIC JSON API FILES")
    print("=" * 60)

    # Create api directory structure
    api_root = os.path.join(os.path.dirname(os.path.dirname(__file__)), '..', 'api')
    os.makedirs(api_root, exist_ok=True)
    os.makedirs(os.path.join(api_root, 'states'), exist_ok=True)
    os.makedirs(os.path.join(api_root, 'all-india'), exist_ok=True)

    with app.app_context():
        # Info check: Show database stats (no longer blocking)
        total_updates = Update.query.count()
        print(f"\n📊 Database statistics:")
        print(f"   Database has {total_updates} total updates")

        # Load existing API to show current state
        existing_count = 0
        try:
            existing_api_path = os.path.join(api_root, 'all-india', 'categories.json')
            if os.path.exists(existing_api_path):
                with open(existing_api_path, 'r') as f:
                    existing_data = json.load(f)
                    existing_count = sum(len(cat) for cat in existing_data.get('categories', {}).values())
                print(f"   Existing canonical JSON has {existing_count} national updates")
        except Exception as e:
            print(f"   Could not read existing API: {e}")

        print(f"\n🔄 Starting merge process (JSON is canonical, will merge DB articles into JSON)...")

        # Generate last-updated.json (metadata, not article data)
        generate_last_updated(api_root)

        # Generate states/recent-counts.json (metadata, not article data)
        generate_recent_counts(api_root)

        # Merge state categories for all states
        generate_all_state_categories(api_root)

        # Merge all-india/categories.json
        generate_all_india_categories(api_root)

    print("\n✅ Static API generation complete!")
    print(f"📁 Files saved to: {api_root}")

def generate_last_updated(api_root):
    """Generate last-updated.json"""
    print("\n📅 Generating last-updated.json...")

    latest = Update.query.filter(
        Update.is_approved == True,
        (Update.is_deleted == False) | (Update.is_deleted == None)
    ).order_by(Update.date_scraped.desc()).first()

    if latest and latest.date_scraped:
        utc_time = latest.date_scraped.replace(tzinfo=timezone.utc)
        ist_offset = timedelta(hours=5, minutes=30)
        ist_time = utc_time + ist_offset

        data = {
            'last_updated': ist_time.isoformat(),
            'formatted': ist_time.strftime('%d %b %Y, %H:%M') + ' IST'
        }
    else:
        data = {
            'last_updated': None,
            'formatted': None
        }

    save_json(api_root, 'last-updated.json', data)

def generate_recent_counts(api_root):
    """Generate states/recent-counts.json"""
    print("📊 Generating states/recent-counts.json...")

    seven_days_ago = datetime.utcnow() - timedelta(days=7)

    updates = Update.query.filter(
        Update.date_scraped >= seven_days_ago,
        Update.is_approved == True,
        (Update.is_deleted == False) | (Update.is_deleted == None),
        Update.processing_state == 'PROCESSED'
    ).all()

    state_counts = {}

    for update in updates:
        try:
            state_codes = json.loads(update.state_codes) if isinstance(update.state_codes, str) else update.state_codes
            if state_codes:
                for code in state_codes:
                    state_counts[code] = state_counts.get(code, 0) + 1
        except:
            continue

    data = {'counts': state_counts, 'period_days': 7}
    save_json(os.path.join(api_root, 'states'), 'recent-counts.json', data)

def generate_all_state_categories(api_root):
    """
    Generate categories.json for each state using MERGE logic.

    IMPORTANT: This now merges database articles into existing JSON rather
    than overwriting. Each state's JSON file is the canonical source for that state.
    """
    print("🗺️  Merging state categories...")

    # List of all Indian states and UTs
    state_codes = [
        'AN', 'AP', 'AR', 'AS', 'BR', 'CH', 'CG', 'DD', 'DL', 'DN', 'GA',
        'GJ', 'HP', 'HR', 'JH', 'JK', 'KA', 'KL', 'LA', 'LD', 'MH', 'ML',
        'MN', 'MP', 'MZ', 'NL', 'OD', 'PB', 'PY', 'RJ', 'SK', 'TN', 'TG',
        'TR', 'UP', 'UT', 'WB'
    ]

    # Track statistics across all states
    total_new = 0
    total_updated = 0
    states_with_data = 0

    for state_code in state_codes:
        # Get all approved updates from database
        all_updates = Update.query.filter(
            Update.is_approved == True,
            (Update.is_deleted == False) | (Update.is_deleted == None),
            Update.processing_state == 'PROCESSED'
        ).order_by(Update.date_published.desc()).all()

        # Filter for exact state code match in JSON array
        updates = []
        for update in all_updates:
            try:
                state_list = json.loads(update.state_codes) if isinstance(update.state_codes, str) else update.state_codes
                if state_list and state_code in state_list:
                    updates.append(update)
            except:
                continue

        # Skip states with no data
        if not updates:
            continue

        # Convert to dictionaries for merging
        new_articles = [update.to_dict() for update in updates]

        # Merge into existing JSON (canonical store)
        state_dir = os.path.join(api_root, 'states', state_code)
        os.makedirs(state_dir, exist_ok=True)
        filepath = os.path.join(state_dir, 'categories.json')

        stats = merge_articles_into_json(filepath, new_articles, state_code)

        # Update the 'state' field in the merged file
        if os.path.exists(filepath):
            with open(filepath, 'r', encoding='utf-8') as f:
                data = json.load(f)
            data['state'] = state_code
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)

        # Track overall statistics
        if stats['total'] > 0:
            states_with_data += 1
            total_new += stats['new']
            total_updated += stats['updated']

    print(f"\n  📊 State summary: {states_with_data} states with data, "
          f"{total_new} new articles, {total_updated} updated across all states")

def generate_all_india_categories(api_root):
    """
    Generate all-india/categories.json using MERGE logic.

    IMPORTANT: This now merges database articles into existing JSON rather
    than overwriting. The JSON file is the canonical source of truth.
    """
    print("🇮🇳 Merging all-india/categories.json...")

    # Get all approved updates from database
    all_updates = Update.query.filter(
        Update.is_approved == True,
        (Update.is_deleted == False) | (Update.is_deleted == None),
        Update.processing_state == 'PROCESSED'
    ).order_by(Update.date_published.desc()).all()

    # Filter for exact "IN" match in state codes array
    updates = []
    for update in all_updates:
        try:
            state_list = json.loads(update.state_codes) if isinstance(update.state_codes, str) else update.state_codes
            if state_list and 'IN' in state_list:
                updates.append(update)
        except:
            continue

    # Convert to dictionaries for merging
    new_articles = [update.to_dict() for update in updates]
    print(f"  📥 Database has {len(new_articles)} national articles to merge")

    # Merge into existing JSON (canonical store)
    filepath = os.path.join(api_root, 'all-india', 'categories.json')
    stats = merge_articles_into_json(filepath, new_articles, "All India")

    # Update the 'state' field in the merged file
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        data['state'] = 'IN'
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

def save_json(directory, filename, data):
    """
    Save data as JSON file with proper formatting.

    NOTE: This is used for metadata files (last-updated.json, recent-counts.json).
    For article data files, use merge_articles_into_json() instead to preserve history.
    """
    filepath = os.path.join(directory, filename)

    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def merge_articles_into_json(filepath, new_articles, scope_name):
    """
    Merge new articles into existing JSON file (NEVER reduce count).

    This implements the core merge logic that makes JSON the canonical store:
    1. Load existing JSON file if it exists
    2. Index existing articles by canonical key (normalized URL)
    3. Merge new articles: add new ones, update existing if newer
    4. Safety check: NEVER reduce total count
    5. Write merged data back to file

    Args:
        filepath: Full path to JSON file (e.g., api/all-india/categories.json)
        new_articles: List of article dictionaries from database
        scope_name: Human-readable name for logging (e.g., "All India", "KA")

    Returns:
        Dict with stats: {"new": N, "updated": M, "total": T, "skipped_older": K}
    """

    # 1. Load existing canonical data
    existing_data = None
    existing_articles = []

    if os.path.exists(filepath):
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                existing_data = json.load(f)

            # Extract all existing articles from categories
            for category, articles in existing_data.get('categories', {}).items():
                existing_articles.extend(articles)

            print(f"  📂 Loaded {len(existing_articles)} existing articles from {scope_name}")
        except Exception as e:
            print(f"  ⚠️  Could not load existing data for {scope_name}: {e}")
            existing_data = None

    # If no existing data, create structure
    if existing_data is None:
        existing_data = {
            'state': 'IN',  # Will be overwritten with correct value
            'categories': {
                'Policies and Initiatives': [],
                'Events': [],
                'Major AI Developments': [],
                'AI Start-Up News': [],
            },
            'today_updates': []
        }

    # 2. Build canonical index: URL -> article (existing articles)
    canonical_index = {}
    for article in existing_articles:
        key = get_canonical_key(article)
        if key:  # Only index if we can generate a valid key
            canonical_index[key] = article

    # 3. Merge new articles
    stats = {
        'new': 0,
        'updated': 0,
        'skipped_older': 0,
        'total': 0
    }

    for new_article in new_articles:
        key = get_canonical_key(new_article)

        if not key:
            print(f"  ⚠️  Skipping article with no URL: {new_article.get('title', 'Unknown')[:50]}")
            continue

        if key in canonical_index:
            # Article exists - apply "latest wins" policy
            existing = canonical_index[key]
            new_date = new_article.get('date_published', '')
            existing_date = existing.get('date_published', '')

            if new_date > existing_date:
                # New article is newer - update
                canonical_index[key] = new_article
                stats['updated'] += 1
            else:
                # Existing article is newer or same - keep it
                stats['skipped_older'] += 1
        else:
            # New article - add to index
            canonical_index[key] = new_article
            stats['new'] += 1

    # 4. Rebuild categories structure from merged index
    merged_categories = {
        'Policies and Initiatives': [],
        'Events': [],
        'Major AI Developments': [],
        'AI Start-Up News': [],
    }

    for article in canonical_index.values():
        category = article.get('category', 'Major AI Developments')
        if category in merged_categories:
            merged_categories[category].append(article)

    # 5. Sort each category by date_published (newest first)
    for category in merged_categories:
        merged_categories[category].sort(
            key=lambda x: x.get('date_published', ''),
            reverse=True
        )

    # 6. Calculate today's updates
    today = datetime.utcnow().date()
    today_categories = set()

    for category, articles in merged_categories.items():
        for article in articles:
            # Check if article was scraped today
            if article.get('date_published'):
                try:
                    pub_date = datetime.fromisoformat(article['date_published'].replace('Z', '+00:00')).date()
                    if pub_date == today:
                        today_categories.add(category)
                except:
                    pass

    # 7. Build final data structure
    merged_data = existing_data.copy()
    merged_data['categories'] = merged_categories
    merged_data['today_updates'] = list(today_categories)

    # 8. CRITICAL SAFETY CHECK: Never reduce count
    old_count = len(existing_articles)
    new_total = sum(len(articles) for articles in merged_categories.values())
    stats['total'] = new_total

    if new_total < old_count:
        print(f"  ⚠️  SAFETY ABORT for {scope_name}:")
        print(f"     Would reduce count from {old_count} to {new_total}")
        print(f"     This violates the 'never reduce count' invariant.")
        print(f"     Keeping existing data unchanged.")
        return stats

    # 9. Write merged data to file
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(merged_data, f, ensure_ascii=False, indent=2)

    # 10. Log results
    print(f"  ✅ {scope_name}: {stats['new']} new, {stats['updated']} updated, "
          f"{stats['skipped_older']} skipped (older), {stats['total']} total")

    return stats

if __name__ == '__main__':
    generate_static_api()
