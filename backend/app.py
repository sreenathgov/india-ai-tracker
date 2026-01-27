"""
India AI Policy Tracker - Backend
"""

from flask import Flask, jsonify, request, session, redirect, url_for, render_template_string
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from functools import wraps
from datetime import datetime, timedelta, timezone
import os
import json
from dotenv import load_dotenv
from pathlib import Path

load_dotenv()

app = Flask(__name__)
CORS(app,
     supports_credentials=True,
     origins=["http://localhost:8080", "http://127.0.0.1:8080", "http://localhost:5001", "http://127.0.0.1:5001"],
     allow_headers=["Content-Type", "Authorization"],
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///tracker.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-key-change-in-production')
app.config['SESSION_COOKIE_SECURE'] = False  # Set to True in production with HTTPS
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(hours=24)

# Admin credentials (hardcoded as requested)
ADMIN_USERNAME = 'admin'
ADMIN_PASSWORD = 'sreenath'

db = SQLAlchemy(app)


# ==================== AUTHENTICATION ====================

def login_required(f):
    """Decorator to require authentication for admin routes."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not session.get('authenticated'):
            # For API routes, return 401
            if request.path.startswith('/api/admin'):
                return jsonify({'error': 'Authentication required', 'redirect': '/admin/login'}), 401
            # For page routes, redirect to login
            return redirect('/admin/login')
        return f(*args, **kwargs)
    return decorated_function


@app.route('/admin/login', methods=['GET', 'POST'])
def admin_login():
    """Admin login page and handler."""
    if request.method == 'POST':
        data = request.get_json() if request.is_json else request.form
        username = data.get('username', '')
        password = data.get('password', '')

        if username == ADMIN_USERNAME and password == ADMIN_PASSWORD:
            session['authenticated'] = True
            session.permanent = True
            if request.is_json:
                return jsonify({'success': True, 'redirect': '/admin'})
            return redirect('/admin')
        else:
            if request.is_json:
                return jsonify({'error': 'Invalid credentials'}), 401
            return render_template_string(LOGIN_PAGE, error='Invalid username or password')

    # GET request - show login page
    if session.get('authenticated'):
        return redirect('/admin')
    return render_template_string(LOGIN_PAGE, error=None)


@app.route('/admin/logout')
def admin_logout():
    """Log out the admin user."""
    session.clear()
    return redirect('/admin/login')


@app.route('/api/admin/auth/status')
def auth_status():
    """Check if user is authenticated."""
    return jsonify({'authenticated': session.get('authenticated', False)})


# Login page template
LOGIN_PAGE = '''
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - India AI Policy Tracker Admin</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary: #29353C;
            --secondary: #44576D;
            --accent: #AAC7D8;
            --light: #DFEBF6;
            --lightest: #E6E6E6;
            --white: #FFFFFF;
            --danger: #e74c3c;
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Inter', sans-serif;
            background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .login-container {
            background: var(--white);
            border-radius: 16px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            width: 100%;
            max-width: 400px;
            overflow: hidden;
        }
        .login-header {
            background: var(--primary);
            color: var(--white);
            padding: 2rem;
            text-align: center;
        }
        .login-header h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
        .login-header p { opacity: 0.8; font-size: 0.9rem; }
        .login-body { padding: 2rem; }
        .form-group { margin-bottom: 1.5rem; }
        .form-group label {
            display: block;
            margin-bottom: 0.5rem;
            font-weight: 500;
            color: var(--secondary);
        }
        .form-group input {
            width: 100%;
            padding: 0.875rem 1rem;
            border: 2px solid var(--light);
            border-radius: 8px;
            font-size: 1rem;
            transition: border-color 0.2s;
        }
        .form-group input:focus {
            outline: none;
            border-color: var(--accent);
        }
        .btn-login {
            width: 100%;
            padding: 1rem;
            background: var(--primary);
            color: var(--white);
            border: none;
            border-radius: 8px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.2s;
        }
        .btn-login:hover { background: var(--secondary); }
        .error-message {
            background: #fde8e8;
            color: var(--danger);
            padding: 0.75rem 1rem;
            border-radius: 6px;
            margin-bottom: 1.5rem;
            font-size: 0.9rem;
        }
    </style>
</head>
<body>
    <div class="login-container">
        <div class="login-header">
            <h1>🇮🇳 India AI Policy Tracker</h1>
            <p>Admin Panel Login</p>
        </div>
        <div class="login-body">
            {% if error %}
            <div class="error-message">{{ error }}</div>
            {% endif %}
            <form method="POST" action="/admin/login">
                <div class="form-group">
                    <label for="username">Username</label>
                    <input type="text" id="username" name="username" required autocomplete="username">
                </div>
                <div class="form-group">
                    <label for="password">Password</label>
                    <input type="password" id="password" name="password" required autocomplete="current-password">
                </div>
                <button type="submit" class="btn-login">Sign In</button>
            </form>
        </div>
    </div>
</body>
</html>
'''

class Update(db.Model):
    __tablename__ = 'updates'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(500), nullable=False)
    url = db.Column(db.String(1000), unique=True, nullable=False)
    summary = db.Column(db.Text)
    content = db.Column(db.Text)
    date_published = db.Column(db.Date)
    date_scraped = db.Column(db.DateTime, default=datetime.utcnow)
    source_name = db.Column(db.String(200))
    category = db.Column(db.String(100))
    state_codes = db.Column(db.String(200))
    is_ai_relevant = db.Column(db.Boolean, default=False)
    relevance_score = db.Column(db.Float)
    is_approved = db.Column(db.Boolean, default=False)
    is_deleted = db.Column(db.Boolean, default=False)  # Soft delete flag

    # Processing State Management (added for batch processing)
    processing_state = db.Column(db.String(20), default='PROCESSED', index=True)
    processing_attempts = db.Column(db.Integer, default=0)
    last_processing_error = db.Column(db.Text)
    last_processing_attempt = db.Column(db.DateTime)

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'url': self.url,
            'summary': self.summary,
            'date_published': self.date_published.isoformat() if self.date_published else None,
            'source_name': self.source_name,
            'category': self.category,
            'state_codes': json.loads(self.state_codes) if self.state_codes else [],
            'is_approved': self.is_approved,
            'is_deleted': self.is_deleted,
            'processing_state': self.processing_state,
            'processing_attempts': self.processing_attempts
        }


class ScraperSource(db.Model):
    """Model for managing scraper sources."""
    __tablename__ = 'scraper_sources'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    url = db.Column(db.String(1000), nullable=False, unique=True)
    source_type = db.Column(db.String(50), default='rss')  # rss or web
    scope = db.Column(db.String(50), default='national')  # national or state
    state_codes = db.Column(db.String(500))  # JSON array of state codes
    category_hint = db.Column(db.String(100))  # Category hint for this source
    priority = db.Column(db.String(50), default='medium')  # high, medium, low
    remarks = db.Column(db.Text)  # Internal notes
    status = db.Column(db.String(50), default='active')  # active or paused
    last_scraped = db.Column(db.DateTime)
    articles_count = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'url': self.url,
            'source_type': self.source_type,
            'scope': self.scope,
            'state_codes': json.loads(self.state_codes) if self.state_codes else [],
            'category_hint': self.category_hint,
            'priority': self.priority,
            'remarks': self.remarks,
            'status': self.status,
            'last_scraped': self.last_scraped.isoformat() if self.last_scraped else None,
            'articles_count': self.articles_count,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

with app.app_context():
    db.create_all()
    print("✅ Database initialized!")

@app.route('/')
def home():
    return jsonify({'message': 'India AI Policy Tracker API', 'status': 'running'})

@app.route('/api/health')
def health_check():
    try:
        count = Update.query.count()
        return jsonify({'status': 'healthy', 'updates_count': count})
    except Exception as e:
        return jsonify({'status': 'error', 'error': str(e)})


@app.route('/api/last-updated')
def get_last_updated():
    """Get the timestamp of the most recently scraped/added update."""
    try:
        latest = Update.query.filter(
            Update.is_approved == True,
            (Update.is_deleted == False) | (Update.is_deleted == None)
        ).order_by(Update.date_scraped.desc()).first()

        if latest and latest.date_scraped:
            # Convert UTC to IST (UTC+5:30)
            utc_time = latest.date_scraped.replace(tzinfo=timezone.utc)
            ist_offset = timedelta(hours=5, minutes=30)
            ist_time = utc_time + ist_offset

            return jsonify({
                'last_updated': ist_time.isoformat(),
                'formatted': ist_time.strftime('%d %b %Y, %H:%M') + ' IST'
            })
        else:
            return jsonify({
                'last_updated': None,
                'formatted': None
            })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/states/<state_code>/categories')
def get_state_categories(state_code):
    """Get all updates for a state, grouped by category."""
    try:
        updates = Update.query.filter(
            Update.state_codes.contains(state_code),
            Update.is_approved == True,
            (Update.is_deleted == False) | (Update.is_deleted == None),
            Update.processing_state == 'PROCESSED'  # Only show fully processed articles
        ).order_by(Update.date_published.desc()).all()

        # New category structure
        categories = {
            'Policies and Initiatives': [],
            'Events': [],
            'Major AI Developments': [],
            'AI Start-Up News': [],
        }

        for update in updates:
            if update.category in categories:
                categories[update.category].append(update.to_dict())

        return jsonify({'state': state_code, 'categories': categories})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/all-india/categories')
def get_all_india_categories():
    """Get all updates for All India (national level)."""
    try:
        updates = Update.query.filter(
            Update.state_codes.contains('IN'),
            Update.is_approved == True,
            (Update.is_deleted == False) | (Update.is_deleted == None),
            Update.processing_state == 'PROCESSED'  # Only show fully processed articles
        ).order_by(Update.date_published.desc()).all()

        categories = {
            'Policies and Initiatives': [],
            'Events': [],
            'Major AI Developments': [],
            'AI Start-Up News': [],
        }

        for update in updates:
            if update.category in categories:
                categories[update.category].append(update.to_dict())

        return jsonify({'state': 'IN', 'categories': categories})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/states/recent-counts')
def get_recent_update_counts():
    """Get count of updates added in the past 7 days for all states."""
    try:
        # Calculate date 7 days ago
        seven_days_ago = datetime.utcnow().date() - timedelta(days=7)

        # Get all approved updates from the past 7 days
        recent_updates = Update.query.filter(
            Update.is_approved == True,
            Update.date_published >= seven_days_ago,
            (Update.is_deleted == False) | (Update.is_deleted == None),
            Update.processing_state == 'PROCESSED'  # Only show fully processed articles
        ).all()

        # Count updates per state
        state_counts = {}
        for update in recent_updates:
            if update.state_codes:
                try:
                    states = json.loads(update.state_codes)
                    for state_code in states:
                        if state_code not in state_counts:
                            state_counts[state_code] = 0
                        state_counts[state_code] += 1
                except json.JSONDecodeError:
                    pass

        return jsonify({'counts': state_counts, 'period_days': 7})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/scrape/run', methods=['POST'])
@login_required
def run_scraper():
    try:
        from scrapers.orchestrator import run_all_scrapers
        result = run_all_scrapers()
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/admin/clean-summaries', methods=['POST'])
@login_required
def clean_summaries():
    """Clean preamble patterns from existing summaries."""
    try:
        from scrapers.orchestrator import clean_existing_summaries
        cleaned_count = clean_existing_summaries()
        return jsonify({'success': True, 'cleaned': cleaned_count})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ==================== ADMIN API ENDPOINTS ====================

@app.route('/api/admin/updates')
@login_required
def admin_get_updates():
    """Get all updates for admin panel with stats."""
    try:
        # Exclude soft-deleted items by default
        show_deleted = request.args.get('show_deleted', 'false').lower() == 'true'
        query = Update.query
        if not show_deleted:
            query = query.filter((Update.is_deleted == False) | (Update.is_deleted == None))
        updates = query.order_by(Update.date_scraped.desc()).all()

        # Calculate stats
        total = len(updates)
        approved = sum(1 for u in updates if u.is_approved)

        # Count today's updates
        today = datetime.utcnow().date()
        today_count = sum(1 for u in updates if u.date_scraped and u.date_scraped.date() == today)

        # Count unique states
        all_states = set()
        for u in updates:
            if u.state_codes:
                try:
                    states = json.loads(u.state_codes)
                    all_states.update(states)
                except:
                    pass

        return jsonify({
            'updates': [u.to_dict() for u in updates],
            'total': total,
            'approved': approved,
            'today': today_count,
            'states_count': len(all_states)
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/admin/updates', methods=['POST'])
@login_required
def admin_create_update():
    """Create a new update manually."""
    try:
        data = request.get_json()

        # Parse date if provided
        date_published = None
        if data.get('date_published'):
            try:
                date_published = datetime.strptime(data['date_published'], '%Y-%m-%d').date()
            except:
                pass

        new_update = Update(
            title=data['title'],
            url=data['url'],
            summary=data.get('summary', ''),
            content=data.get('content', ''),
            date_published=date_published,
            source_name=data.get('source_name', 'Manual Entry'),
            category=data.get('category', 'Major AI Developments'),
            state_codes=json.dumps(data.get('state_codes', ['IN'])),
            is_ai_relevant=True,
            relevance_score=100.0,
            is_approved=data.get('is_approved', True)
        )

        db.session.add(new_update)
        db.session.commit()

        return jsonify({'success': True, 'id': new_update.id})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/admin/updates/<int:update_id>', methods=['GET'])
@login_required
def admin_get_update(update_id):
    """Get a single update by ID."""
    try:
        update = Update.query.get_or_404(update_id)
        return jsonify(update.to_dict())
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/admin/updates/<int:update_id>', methods=['PUT'])
@login_required
def admin_update_update(update_id):
    """Update an existing update."""
    try:
        update = Update.query.get_or_404(update_id)
        data = request.get_json()

        if 'title' in data:
            update.title = data['title']
        if 'url' in data:
            update.url = data['url']
        if 'summary' in data:
            update.summary = data['summary']
        if 'category' in data:
            update.category = data['category']
        if 'state_codes' in data:
            update.state_codes = json.dumps(data['state_codes'])
        if 'source_name' in data:
            update.source_name = data['source_name']
        if 'is_approved' in data:
            update.is_approved = data['is_approved']

        if 'date_published' in data and data['date_published']:
            try:
                update.date_published = datetime.strptime(data['date_published'], '%Y-%m-%d').date()
            except:
                pass

        db.session.commit()
        return jsonify({'success': True})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/admin/updates/<int:update_id>', methods=['DELETE'])
@login_required
def admin_delete_update(update_id):
    """Soft delete an update."""
    try:
        update = Update.query.get_or_404(update_id)
        update.is_deleted = True  # Soft delete
        db.session.commit()
        return jsonify({'success': True})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/admin/updates/bulk', methods=['POST'])
@login_required
def admin_bulk_action():
    """Perform bulk actions on multiple updates."""
    try:
        data = request.get_json()
        ids = data.get('ids', [])
        action = data.get('action')

        if not ids or not action:
            return jsonify({'error': 'Missing ids or action'}), 400

        updates = Update.query.filter(Update.id.in_(ids)).all()

        if action == 'approve':
            for u in updates:
                u.is_approved = True
        elif action == 'unapprove':
            for u in updates:
                u.is_approved = False
        elif action == 'delete':
            # Soft delete only
            for u in updates:
                u.is_deleted = True
        elif action == 'move_category':
            new_category = data.get('category')
            if new_category:
                for u in updates:
                    u.category = new_category
        elif action == 'move_state':
            new_states = data.get('states', [])
            if new_states:
                for u in updates:
                    u.state_codes = json.dumps(new_states)

        db.session.commit()
        return jsonify({'success': True, 'affected': len(updates)})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ==================== SCRAPER SOURCE MANAGEMENT ====================

@app.route('/api/admin/sources')
@login_required
def admin_get_sources():
    """Get all scraper sources."""
    try:
        sources = ScraperSource.query.order_by(ScraperSource.priority.desc(), ScraperSource.name).all()

        # Calculate stats
        total = len(sources)
        active = sum(1 for s in sources if s.status == 'active')
        paused = total - active

        return jsonify({
            'sources': [s.to_dict() for s in sources],
            'total': total,
            'active': active,
            'paused': paused
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/admin/sources', methods=['POST'])
@login_required
def admin_create_source():
    """Create a new scraper source."""
    try:
        data = request.get_json()

        new_source = ScraperSource(
            name=data['name'],
            url=data['url'],
            source_type=data.get('source_type', 'rss'),
            scope=data.get('scope', 'national'),
            state_codes=json.dumps(data.get('state_codes', [])),
            category_hint=data.get('category_hint'),
            priority=data.get('priority', 'medium'),
            remarks=data.get('remarks', ''),
            status=data.get('status', 'active')
        )

        db.session.add(new_source)
        db.session.commit()

        return jsonify({'success': True, 'id': new_source.id})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/admin/sources/<int:source_id>', methods=['GET'])
@login_required
def admin_get_source(source_id):
    """Get a single source by ID."""
    try:
        source = ScraperSource.query.get_or_404(source_id)
        return jsonify(source.to_dict())
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/admin/sources/<int:source_id>', methods=['PUT'])
@login_required
def admin_update_source(source_id):
    """Update an existing source."""
    try:
        source = ScraperSource.query.get_or_404(source_id)
        data = request.get_json()

        if 'name' in data:
            source.name = data['name']
        if 'url' in data:
            source.url = data['url']
        if 'source_type' in data:
            source.source_type = data['source_type']
        if 'scope' in data:
            source.scope = data['scope']
        if 'state_codes' in data:
            source.state_codes = json.dumps(data['state_codes'])
        if 'category_hint' in data:
            source.category_hint = data['category_hint']
        if 'priority' in data:
            source.priority = data['priority']
        if 'remarks' in data:
            source.remarks = data['remarks']
        if 'status' in data:
            source.status = data['status']

        db.session.commit()
        return jsonify({'success': True})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/admin/sources/<int:source_id>', methods=['DELETE'])
@login_required
def admin_delete_source(source_id):
    """Delete a source."""
    try:
        source = ScraperSource.query.get_or_404(source_id)
        db.session.delete(source)
        db.session.commit()
        return jsonify({'success': True})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/admin/sources/<int:source_id>/toggle', methods=['POST'])
@login_required
def admin_toggle_source(source_id):
    """Toggle source status between active and paused."""
    try:
        source = ScraperSource.query.get_or_404(source_id)
        source.status = 'paused' if source.status == 'active' else 'active'
        db.session.commit()
        return jsonify({'success': True, 'status': source.status})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/admin/sources/<int:source_id>/test', methods=['POST'])
@login_required
def admin_test_source(source_id):
    """Test a single source without saving results."""
    try:
        source = ScraperSource.query.get_or_404(source_id)

        # Import and run a test scrape
        from scrapers.rss_scraper import test_feed
        from scrapers.web_scraper import test_web_source

        if source.source_type == 'rss':
            result = test_feed(source.url)
        else:
            result = test_web_source(source.url)

        return jsonify({
            'success': True,
            'source': source.name,
            'result': result
        })
    except ImportError:
        # If test functions don't exist, return a basic response
        return jsonify({
            'success': True,
            'source': source.name if source else 'Unknown',
            'result': {'message': 'Test function not implemented', 'items': 0}
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/admin/sources/import', methods=['POST'])
@login_required
def admin_import_sources():
    """Import sources from sources.json file."""
    try:
        sources_file = Path(__file__).parent / 'sources.json'
        if not sources_file.exists():
            return jsonify({'error': 'sources.json not found'}), 404

        with open(sources_file, 'r') as f:
            data = json.load(f)

        imported = 0
        skipped = 0

        # Import national sources
        for source_data in data.get('national', []):
            existing = ScraperSource.query.filter_by(url=source_data['url']).first()
            if existing:
                skipped += 1
                continue

            new_source = ScraperSource(
                name=source_data['name'],
                url=source_data['url'],
                source_type=source_data.get('type', 'rss'),
                scope='national',
                state_codes=json.dumps([]),
                category_hint=source_data.get('category_hint'),
                priority=source_data.get('priority', 'medium'),
                remarks=source_data.get('notes', ''),
                status='active' if source_data.get('enabled', True) else 'paused'
            )
            db.session.add(new_source)
            imported += 1

        # Import state-specific sources
        for state_code, sources in data.items():
            if state_code in ['_comments', 'national'] or not isinstance(sources, list):
                continue

            for source_data in sources:
                existing = ScraperSource.query.filter_by(url=source_data['url']).first()
                if existing:
                    skipped += 1
                    continue

                new_source = ScraperSource(
                    name=source_data['name'],
                    url=source_data['url'],
                    source_type=source_data.get('type', 'rss'),
                    scope='state',
                    state_codes=json.dumps([state_code]),
                    category_hint=source_data.get('category_hint'),
                    priority=source_data.get('priority', 'medium'),
                    remarks=source_data.get('notes', ''),
                    status='active' if source_data.get('enabled', True) else 'paused'
                )
                db.session.add(new_source)
                imported += 1

        db.session.commit()
        return jsonify({'success': True, 'imported': imported, 'skipped': skipped})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ==================== ADMIN PAGE ROUTE ====================

@app.route('/admin')
@login_required
def admin_page():
    """Serve the admin panel (redirect to static file or serve template)."""
    # Read and serve the admin.html file
    admin_html_path = Path(__file__).parent.parent / 'admin.html'
    if admin_html_path.exists():
        with open(admin_html_path, 'r') as f:
            return f.read()
    return redirect('/admin/login')


if __name__ == '__main__':
    port = int(os.getenv('PORT', 5001))
    print(f"Starting server on http://localhost:{port}")
    app.run(host='0.0.0.0', port=port, debug=True)
