"""
Database Migration: Add Indexes for Date-Based Queries

This migration adds indexes to optimize the 14-day rolling window duplicate detection.

Performance Impact:
- Before: Full table scan for date filtering (O(n))
- After: Index-based lookup (O(log n))

Run this migration once to improve deduplication performance.
"""

import sqlite3
import os
from datetime import datetime


def run_migration(db_path=None):
    """
    Add indexes for date-based queries.

    Args:
        db_path: Path to SQLite database (auto-detects if None)
    """
    if db_path is None:
        # Auto-detect database path
        script_dir = os.path.dirname(os.path.abspath(__file__))
        db_path = os.path.join(script_dir, '../instance/tracker.db')

    if not os.path.exists(db_path):
        print(f"❌ Database not found at: {db_path}")
        return False

    print("=" * 60)
    print("DATABASE MIGRATION: Adding Date Indexes")
    print("=" * 60)
    print(f"Database: {db_path}")
    print(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        # Check existing indexes
        cursor.execute("SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='updates';")
        existing_indexes = [row[0] for row in cursor.fetchall()]
        print(f"Existing indexes on 'updates' table: {existing_indexes}")
        print()

        # Create index on date_scraped (for rolling window queries)
        if 'idx_updates_date_scraped' not in existing_indexes:
            print("Creating index: idx_updates_date_scraped...")
            cursor.execute("""
                CREATE INDEX idx_updates_date_scraped
                ON updates(date_scraped DESC)
            """)
            print("✅ Index created: idx_updates_date_scraped")
        else:
            print("ℹ️  Index already exists: idx_updates_date_scraped")

        # Create composite index for common query pattern
        if 'idx_updates_date_deleted' not in existing_indexes:
            print("Creating composite index: idx_updates_date_deleted...")
            cursor.execute("""
                CREATE INDEX idx_updates_date_deleted
                ON updates(date_scraped DESC, is_deleted)
            """)
            print("✅ Index created: idx_updates_date_deleted")
        else:
            print("ℹ️  Index already exists: idx_updates_date_deleted")

        # Create index on date_published (for future date-range queries)
        if 'idx_updates_date_published' not in existing_indexes:
            print("Creating index: idx_updates_date_published...")
            cursor.execute("""
                CREATE INDEX idx_updates_date_published
                ON updates(date_published DESC)
            """)
            print("✅ Index created: idx_updates_date_published")
        else:
            print("ℹ️  Index already exists: idx_updates_date_published")

        # Commit changes
        conn.commit()

        # Verify indexes
        print()
        print("Verifying indexes...")
        cursor.execute("SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='updates';")
        all_indexes = [row[0] for row in cursor.fetchall()]
        print(f"All indexes on 'updates' table: {all_indexes}")

        # Get table stats
        cursor.execute("SELECT COUNT(*) FROM updates")
        total_rows = cursor.fetchone()[0]
        print()
        print(f"Total articles in database: {total_rows}")

        print()
        print("=" * 60)
        print("✅ MIGRATION COMPLETED SUCCESSFULLY")
        print("=" * 60)
        print(f"Finished: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

        return True

    except Exception as e:
        print(f"❌ Migration failed: {e}")
        conn.rollback()
        return False

    finally:
        conn.close()


if __name__ == '__main__':
    """Run migration when executed directly"""
    import sys

    # Allow custom database path as argument
    db_path = sys.argv[1] if len(sys.argv) > 1 else None

    success = run_migration(db_path)
    sys.exit(0 if success else 1)
