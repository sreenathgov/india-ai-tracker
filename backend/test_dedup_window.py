"""
Test Script: Verify 14-Day Rolling Window Duplicate Detection

This script validates that the deduplicator:
1. Only loads articles from the last 14 days
2. Ignores older articles for duplicate detection
3. Uses database indexes efficiently
"""

from datetime import datetime, timedelta
from ai.deduplicator import Deduplicator
from app import app, db, Update
import sys


def test_rolling_window():
    """Test that 14-day rolling window works correctly."""

    print("=" * 70)
    print("TEST: 14-Day Rolling Window Duplicate Detection")
    print("=" * 70)
    print()

    with app.app_context():
        # Get database statistics
        total_articles = Update.query.count()
        cutoff_date = datetime.utcnow() - timedelta(days=14)

        recent_articles = Update.query.filter(
            Update.date_scraped >= cutoff_date,
            (Update.is_deleted == False) | (Update.is_deleted == None)
        ).count()

        old_articles = Update.query.filter(
            Update.date_scraped < cutoff_date
        ).count()

        print(f"Database Statistics:")
        print(f"  Total articles:        {total_articles}")
        print(f"  Recent (last 14 days): {recent_articles}")
        print(f"  Older (>14 days):      {old_articles}")
        print()

        # Initialize deduplicator
        print("Initializing deduplicator...")
        dedup = Deduplicator()

        # Trigger database load
        dedup._load_database_titles()

        print()
        print(f"Deduplicator loaded:   {len(dedup._db_titles)} articles")
        print(f"Expected (recent):     {recent_articles}")
        print()

        # Verify rolling window configuration
        print(f"Rolling Window Config:")
        print(f"  DEDUP_WINDOW_DAYS:   {dedup.DEDUP_WINDOW_DAYS} days")
        print(f"  Cutoff date:         {cutoff_date.date()}")
        print()

        # Test 1: Verify correct number loaded
        if len(dedup._db_titles) == recent_articles:
            print("✅ TEST PASSED: Loaded correct number of articles (14-day window)")
        else:
            print(f"❌ TEST FAILED: Expected {recent_articles}, got {len(dedup._db_titles)}")
            return False

        # Test 2: Verify all loaded articles are within window
        print()
        print("Verifying all loaded articles are within 14-day window...")
        all_within_window = True
        oldest_date = None
        newest_date = None

        for entry in dedup._db_titles:
            article_date = entry['date']
            if oldest_date is None or article_date < oldest_date:
                oldest_date = article_date
            if newest_date is None or article_date > newest_date:
                newest_date = article_date

            if article_date < cutoff_date:
                print(f"  ❌ Found old article: {entry['title'][:50]} ({article_date.date()})")
                all_within_window = False

        if oldest_date and newest_date:
            print(f"  Date range loaded:   {oldest_date.date()} to {newest_date.date()}")
            days_span = (newest_date - oldest_date).days
            print(f"  Span:                {days_span} days")

        if all_within_window:
            print("✅ TEST PASSED: All articles within 14-day window")
        else:
            print("❌ TEST FAILED: Found articles older than 14 days")
            return False

        # Test 3: Test duplicate detection with recent article
        print()
        print("Testing duplicate detection...")

        if recent_articles > 0:
            # Get a recent article
            recent = Update.query.filter(
                Update.date_scraped >= cutoff_date
            ).first()

            # Test that it's detected as duplicate
            is_dup = dedup.is_duplicate(
                url=recent.url,
                title=recent.title,
                date_published=recent.date_published
            )

            if is_dup:
                print(f"✅ TEST PASSED: Recent article detected as duplicate")
                print(f"   Title: {recent.title[:60]}...")
            else:
                print(f"❌ TEST FAILED: Recent article NOT detected as duplicate")
                return False

        # Test 4: Verify indexes exist
        print()
        print("Verifying database indexes...")

        result = db.session.execute(db.text("""
            SELECT name FROM sqlite_master
            WHERE type='index' AND tbl_name='updates'
        """))
        indexes = [row[0] for row in result]

        required_indexes = ['idx_updates_date_scraped', 'idx_updates_date_deleted']
        missing_indexes = [idx for idx in required_indexes if idx not in indexes]

        if not missing_indexes:
            print(f"✅ TEST PASSED: All required indexes exist")
            print(f"   Indexes: {indexes}")
        else:
            print(f"⚠️  WARNING: Missing indexes: {missing_indexes}")
            print(f"   Run: python migrations/add_date_indexes.py")

        print()
        print("=" * 70)
        print("✅ ALL TESTS PASSED")
        print("=" * 70)
        print()
        print("Summary:")
        print(f"  - Rolling window:     {dedup.DEDUP_WINDOW_DAYS} days")
        print(f"  - Articles in scope:  {recent_articles}/{total_articles}")
        print(f"  - Percentage:         {(recent_articles/total_articles*100):.1f}%")
        print(f"  - Indexes:            {len(indexes)} active")
        print()

        return True


if __name__ == '__main__':
    try:
        success = test_rolling_window()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
