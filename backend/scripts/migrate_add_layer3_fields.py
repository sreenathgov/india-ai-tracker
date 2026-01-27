"""
Database Migration: Add Layer 3 Fields

Adds importance_score and premium_processed columns to the updates table.

Run with: PYTHONPATH=. venv/bin/python3 scripts/migrate_add_layer3_fields.py
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app import app, db
from sqlalchemy import text

def migrate():
    """Add Layer 3 columns to updates table."""

    print("\n" + "="*70)
    print("DATABASE MIGRATION: Add Layer 3 Fields")
    print("="*70 + "\n")

    with app.app_context():
        try:
            # Check if columns already exist
            result = db.session.execute(text("PRAGMA table_info(updates)"))
            columns = {row[1] for row in result}

            print(f"Current columns: {sorted(columns)}\n")

            # Add importance_score column
            if 'importance_score' not in columns:
                print("Adding column: importance_score (FLOAT, default 0.0)")
                db.session.execute(text(
                    "ALTER TABLE updates ADD COLUMN importance_score FLOAT DEFAULT 0.0"
                ))
                db.session.commit()
                print("✅ Added importance_score column")
            else:
                print("⏭️  Column already exists: importance_score")

            # Add premium_processed column
            if 'premium_processed' not in columns:
                print("Adding column: premium_processed (BOOLEAN, default FALSE)")
                db.session.execute(text(
                    "ALTER TABLE updates ADD COLUMN premium_processed BOOLEAN DEFAULT 0"
                ))
                db.session.commit()
                print("✅ Added premium_processed column")
            else:
                print("⏭️  Column already exists: premium_processed")

            # Verify
            result = db.session.execute(text("PRAGMA table_info(updates)"))
            new_columns = {row[1] for row in result}

            print("\n" + "="*70)
            print("MIGRATION COMPLETE")
            print("="*70 + "\n")
            print(f"Total columns: {len(new_columns)}")

            if 'importance_score' in new_columns and 'premium_processed' in new_columns:
                print("✅ All Layer 3 fields added successfully!")
            else:
                print("❌ Migration failed - some fields missing")
                return False

            return True

        except Exception as e:
            print(f"❌ Migration failed: {e}")
            db.session.rollback()
            return False

if __name__ == "__main__":
    success = migrate()
    sys.exit(0 if success else 1)
