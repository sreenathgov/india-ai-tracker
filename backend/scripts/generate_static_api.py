"""
Generate static JSON API files from database for Vercel deployment.

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
        # CRITICAL SAFETY CHECK: Verify database has data before regenerating API
        # This prevents data loss if database hasn't been written to disk properly
        total_updates = Update.query.count()
        print(f"\n🔍 Pre-generation safety check:")
        print(f"   Database has {total_updates} total updates")

        # Load existing API to compare counts
        existing_count = 0
        try:
            existing_api_path = os.path.join(api_root, 'all-india', 'categories.json')
            if os.path.exists(existing_api_path):
                with open(existing_api_path, 'r') as f:
                    existing_data = json.load(f)
                    existing_count = sum(len(cat) for cat in existing_data.get('categories', {}).values())
                print(f"   Existing API has {existing_count} national updates")
        except Exception as e:
            print(f"   Could not read existing API: {e}")

        # SAFETY: If database has significantly fewer records than existing API,
        # this likely means database wasn't persisted properly. ABORT to prevent data loss.
        if existing_count > 0 and total_updates < existing_count * 0.8:  # 20% margin
            print(f"\n⚠️  SAFETY ABORT: Database has {total_updates} records but existing API has {existing_count}!")
            print(f"   This suggests database wasn't persisted properly.")
            print(f"   REFUSING to overwrite API files to prevent data loss.")
            print(f"   Fix the database persistence issue first, then regenerate API.")
            return

        # Generate last-updated.json
        generate_last_updated(api_root)

        # Generate states/recent-counts.json
        generate_recent_counts(api_root)

        # Generate state categories for all states
        generate_all_state_categories(api_root)

        # Generate all-india/categories.json
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
    """Generate categories.json for each state"""
    print("🗺️  Generating state categories...")

    # List of all Indian states and UTs
    state_codes = [
        'AN', 'AP', 'AR', 'AS', 'BR', 'CH', 'CG', 'DD', 'DL', 'DN', 'GA',
        'GJ', 'HP', 'HR', 'JH', 'JK', 'KA', 'KL', 'LA', 'LD', 'MH', 'ML',
        'MN', 'MP', 'MZ', 'NL', 'OD', 'PB', 'PY', 'RJ', 'SK', 'TN', 'TG',
        'TR', 'UP', 'UT', 'WB'
    ]

    for state_code in state_codes:
        # Get all approved updates and filter in Python for exact JSON array match
        # contains() does substring match which causes false positives
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

        categories = {
            'Policies and Initiatives': [],
            'Events': [],
            'Major AI Developments': [],
            'AI Start-Up News': [],
        }

        # Track today's updates
        today = datetime.utcnow().date()
        categories_with_today_updates = set()

        for update in updates:
            if update.category in categories:
                categories[update.category].append(update.to_dict())

                if update.date_scraped and update.date_scraped.date() == today:
                    categories_with_today_updates.add(update.category)

        data = {
            'state': state_code,
            'categories': categories,
            'today_updates': list(categories_with_today_updates)
        }

        # Save to states/<STATE_CODE>/categories.json
        state_dir = os.path.join(api_root, 'states', state_code)
        os.makedirs(state_dir, exist_ok=True)
        save_json(state_dir, 'categories.json', data)

        # Print progress
        total_updates = sum(len(v) for v in categories.values())
        if total_updates > 0:
            print(f"  ✓ {state_code}: {total_updates} updates")

def generate_all_india_categories(api_root):
    """Generate all-india/categories.json"""
    print("🇮🇳 Generating all-india/categories.json...")

    # Get all approved updates and filter in Python for exact JSON array match
    # contains() does substring match which causes false positives (TN contains IN)
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

    categories = {
        'Policies and Initiatives': [],
        'Events': [],
        'Major AI Developments': [],
        'AI Start-Up News': [],
    }

    # Track today's updates
    today = datetime.utcnow().date()
    categories_with_today_updates = set()

    for update in updates:
        if update.category in categories:
            categories[update.category].append(update.to_dict())

            if update.date_scraped and update.date_scraped.date() == today:
                categories_with_today_updates.add(update.category)

    data = {
        'state': 'IN',
        'categories': categories,
        'today_updates': list(categories_with_today_updates)
    }

    save_json(os.path.join(api_root, 'all-india'), 'categories.json', data)

    total_updates = sum(len(v) for v in categories.values())
    print(f"  ✓ All India: {total_updates} updates")

def save_json(directory, filename, data):
    """Save data as JSON file with proper formatting."""
    filepath = os.path.join(directory, filename)

    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

if __name__ == '__main__':
    generate_static_api()
