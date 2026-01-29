#!/usr/bin/env python3
"""
Database Migration: Add X Posting Field

Adds the posted_to_x_at column to the updates table for tracking
which articles have been posted to X (Twitter).

Run this once before using the X posting feature.

Usage:
    python scripts/migrate_add_x_posting.py
"""

import sys
import sqlite3
from pathlib import Path


def migrate_single_db(db_path: Path) -> bool:
    """Migrate a single database file."""
    if not db_path.exists():
        return False

    print(f"\nMigrating: {db_path}")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Check if column already exists
    cursor.execute("PRAGMA table_info(updates)")
    columns = [col[1] for col in cursor.fetchall()]

    if 'posted_to_x_at' in columns:
        print("  Column 'posted_to_x_at' already exists. Skipping.")
        conn.close()
        return True

    # Add the column
    print("  Adding 'posted_to_x_at' column...")

    try:
        cursor.execute("""
            ALTER TABLE updates
            ADD COLUMN posted_to_x_at DATETIME
        """)
        conn.commit()
        print("  Migration successful!")
        return True
    except Exception as e:
        print(f"  Migration failed: {e}")
        conn.rollback()
        return False
    finally:
        conn.close()


def migrate():
    """Add posted_to_x_at column to updates table."""
    backend_dir = Path(__file__).parent.parent

    # Check both possible database locations
    # Flask-SQLAlchemy may use instance/ folder or root backend/ folder
    db_paths = [
        backend_dir / 'tracker.db',
        backend_dir / 'instance' / 'tracker.db'
    ]

    found_any = False
    for db_path in db_paths:
        if db_path.exists():
            found_any = True
            migrate_single_db(db_path)

    if not found_any:
        print("No database files found!")
        print("Looked in:")
        for p in db_paths:
            print(f"  - {p}")
        sys.exit(1)


if __name__ == '__main__':
    migrate()
