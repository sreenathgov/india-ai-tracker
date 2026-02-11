# Archive

This directory contains deprecated code that's no longer in active use but kept for reference.

## admin_old.html
- **Status**: Deprecated as of 2026-02-11
- **Reason**: Superseded by new admin interface at `backend/local_admin.py`
- **Original Location**: Root directory (`/admin.html`)
- **Purpose**: Database-based admin interface (no longer operational)
- **Replacement**: File-based admin with git sync at `http://localhost:5002`
- **Features**:
  - Database queries via SQLAlchemy
  - Authentication required (login system)
  - Port 5001 (main Flask app)
  - Single-page JavaScript application

## Why Archived?
The new admin interface (`backend/local_admin.py`) offers:
- File-based data management (JSON files)
- Git sync and push functionality
- Simpler localhost-only access (no authentication needed)
- Better integration with the static site generation workflow
- Port 5002 (separate Flask app)

## Usage
**Do not use code from this directory in production.**

If you need to reference the old admin implementation, you can find it here. After 3-6 months of stable operation with the new admin, this archive can be permanently deleted.

## How to Access New Admin
```bash
cd backend
python local_admin.py
```
Then open: http://localhost:5002
