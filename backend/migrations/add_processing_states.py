"""
Database Migration: Add Processing State Management

This migration adds columns to track article processing state and retry attempts.

New Pipeline:
SCRAPED → PROCESSING → PROCESSED
              ↓
           FAILED (after 3 retries)

Run this migration once before deploying the new batch processing system.
"""

import sqlite3
import os
from datetime import datetime


def run_migration(db_path=None):
    """
    Add processing state columns to updates table.

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

    print("=" * 70)
    print("DATABASE MIGRATION: Adding Processing State Management")
    print("=" * 70)
    print(f"Database: {db_path}")
    print(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        # Check if columns already exist
        cursor.execute("PRAGMA table_info(updates)")
        existing_columns = [row[1] for row in cursor.fetchall()]

        print(f"Existing columns: {len(existing_columns)}")
        print()

        # Add processing_state column
        if 'processing_state' not in existing_columns:
            print("Adding column: processing_state...")
            cursor.execute("""
                ALTER TABLE updates
                ADD COLUMN processing_state TEXT DEFAULT 'PROCESSED'
            """)
            print("✅ Column added: processing_state")

            # Create index for efficient state queries
            print("Creating index: idx_updates_processing_state...")
            cursor.execute("""
                CREATE INDEX idx_updates_processing_state
                ON updates(processing_state)
            """)
            print("✅ Index created: idx_updates_processing_state")
        else:
            print("ℹ️  Column already exists: processing_state")

        # Add processing_attempts column
        if 'processing_attempts' not in existing_columns:
            print("Adding column: processing_attempts...")
            cursor.execute("""
                ALTER TABLE updates
                ADD COLUMN processing_attempts INTEGER DEFAULT 0
            """)
            print("✅ Column added: processing_attempts")
        else:
            print("ℹ️  Column already exists: processing_attempts")

        # Add last_processing_error column
        if 'last_processing_error' not in existing_columns:
            print("Adding column: last_processing_error...")
            cursor.execute("""
                ALTER TABLE updates
                ADD COLUMN last_processing_error TEXT
            """)
            print("✅ Column added: last_processing_error")
        else:
            print("ℹ️  Column already exists: last_processing_error")

        # Add last_processing_attempt column
        if 'last_processing_attempt' not in existing_columns:
            print("Adding column: last_processing_attempt...")
            cursor.execute("""
                ALTER TABLE updates
                ADD COLUMN last_processing_attempt DATETIME
            """)
            print("✅ Column added: last_processing_attempt")
        else:
            print("ℹ️  Column already exists: last_processing_attempt")

        # Commit changes
        conn.commit()

        # Set existing articles to PROCESSED state
        print()
        print("Migrating existing articles to PROCESSED state...")
        cursor.execute("""
            UPDATE updates
            SET processing_state = 'PROCESSED'
            WHERE processing_state IS NULL OR processing_state = ''
        """)
        migrated_count = cursor.rowcount
        conn.commit()
        print(f"✅ Migrated {migrated_count} existing articles to PROCESSED")

        # Get statistics
        print()
        print("Current state distribution:")
        cursor.execute("""
            SELECT processing_state, COUNT(*)
            FROM updates
            GROUP BY processing_state
        """)
        for state, count in cursor.fetchall():
            print(f"  {state}: {count}")

        print()
        print("=" * 70)
        print("✅ MIGRATION COMPLETED SUCCESSFULLY")
        print("=" * 70)
        print(f"Finished: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print()
        print("Next steps:")
        print("1. Update your Update model to include new fields")
        print("2. Use separate scraping and processing commands")
        print("3. Monitor FAILED articles in admin panel")

        return True

    except Exception as e:
        print(f"❌ Migration failed: {e}")
        conn.rollback()
        import traceback
        traceback.print_exc()
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
