#!/usr/bin/env python3
"""
Local Admin Tool - Entry Point
Simple localhost-only admin interface for managing India AI Tracker data

Usage:
    cd backend
    python local_admin.py

Then open: http://localhost:5002
"""

import os
import sys

# Add backend directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from flask import Flask, render_template, request, redirect, url_for, jsonify, flash, send_file, abort
from admin.services.data_manager import DataManager
from admin.services.git_manager import GitManager
from admin.request_guard import check_request
from datetime import datetime

# Initialize Flask app
app = Flask(__name__, template_folder='admin/templates')
app.secret_key = os.urandom(24)  # For flash messages only


@app.before_request
def _guard_request():
    """Block DNS-rebinding and cross-site CSRF before any route runs.

    This tool has no login and can git-push to production, so a malicious page
    the developer visits must not be able to drive it. See admin/request_guard.py.
    """
    allowed, reason = check_request(
        request.method,
        request.host,
        request.headers.get('Origin'),
        request.headers.get('Sec-Fetch-Site'),
    )
    if not allowed:
        abort(403, description=reason)

# Configuration
REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Initialize managers
data_mgr = DataManager(REPO_ROOT)
git_mgr = GitManager(REPO_ROOT)

# Load data on startup
print("Loading data...")
load_result = data_mgr.load_all_data()
print(f"✓ Loaded {load_result['total_articles']} articles and {load_result['sources']} sources")


# Routes (no authentication - localhost only)


@app.route('/')
def dashboard():
    """Dashboard - show stats, git status, pending changes"""
    # Reload data from disk to catch any external changes
    data_mgr.load_all_data()

    stats = data_mgr.get_stats()
    git_status = git_mgr.get_full_status()  # Use full status including remote
    last_commit = git_mgr.get_last_commit()
    pending = data_mgr.get_pending_changes_summary()

    return render_template('dashboard.html',
                         stats=stats,
                         git_status=git_status,
                         last_commit=last_commit,
                         pending=pending)


@app.route('/updates')
def updates_list():
    """List all articles with search/filter"""
    # Reload data from disk to catch any external changes
    data_mgr.load_all_data()

    # Get filter parameters
    search = request.args.get('search', '')
    category = request.args.get('category', '')
    state = request.args.get('state', '')
    sort_order = request.args.get('sort', 'newest')  # 'newest' or 'oldest'

    filters = {}
    if search:
        filters['search'] = search
    if category:
        filters['category'] = category
    if state:
        filters['state'] = state

    articles = data_mgr.get_all_articles(filters, sort_order=sort_order)

    # Pagination
    page = int(request.args.get('page', 1))
    per_page = 50
    total = len(articles)
    start = (page - 1) * per_page
    end = start + per_page
    articles_page = articles[start:end]

    return render_template('updates.html',
                         articles=articles_page,
                         page=page,
                         per_page=per_page,
                         total=total,
                         search=search,
                         category=category,
                         state=state,
                         sort_order=sort_order,
                         categories=DataManager.VALID_CATEGORIES,
                         states=DataManager.VALID_STATES,
                         state_names=DataManager.STATE_NAMES)


@app.route('/updates/<path:article_url>/edit', methods=['GET', 'POST'])
def edit_article(article_url):
    """Edit a single article (full form with geography)"""
    # Capture return-state query params (GET or POST hidden fields)
    back_page     = request.args.get('back_page') or request.form.get('back_page', '1')
    back_search   = request.args.get('back_search') or request.form.get('back_search', '')
    back_category = request.args.get('back_category') or request.form.get('back_category', '')
    back_state    = request.args.get('back_state') or request.form.get('back_state', '')
    back_sort     = request.args.get('back_sort') or request.form.get('back_sort', 'newest')

    if request.method == 'POST':
        state_codes = request.form.getlist('state_codes')
        updates = {
            'url':        request.form.get('url'),
            'title':      request.form.get('title'),
            'summary':    request.form.get('summary'),
            'category':   request.form.get('category'),
            'state_codes': state_codes,
        }

        success, message = data_mgr.update_article(article_url, updates)
        if success:
            # Also save to disk immediately
            data_mgr.save_changes()
            flash(message, 'success')
            return redirect(url_for('updates_list', page=back_page, search=back_search,
                                    category=back_category, state=back_state, sort=back_sort))
        else:
            flash(message, 'error')

    article = data_mgr.get_article_by_url(article_url)
    if not article:
        flash('Article not found', 'error')
        return redirect(url_for('updates_list'))

    return render_template('edit_article.html',
                           article=article,
                           categories=DataManager.VALID_CATEGORIES,
                           states=DataManager.VALID_STATES,
                           state_names=DataManager.STATE_NAMES,
                           back_page=back_page,
                           back_search=back_search,
                           back_category=back_category,
                           back_state=back_state,
                           back_sort=back_sort)


@app.route('/updates/add', methods=['GET', 'POST'])
def add_article_form():
    """Add a new article"""
    if request.method == 'POST':
        # Get state_codes as list (checkboxes return multiple values)
        state_codes = request.form.getlist('state_codes')

        # Validate that at least one state is selected
        if not state_codes:
            flash('Please select at least one geographic location', 'error')
            return render_template('add_article.html',
                                 categories=DataManager.VALID_CATEGORIES,
                                 states=DataManager.VALID_STATES,
                                 state_names=DataManager.STATE_NAMES)

        article_data = {
            'url': request.form.get('url'),
            'title': request.form.get('title'),
            'summary': request.form.get('summary'),
            'category': request.form.get('category'),
            'state_codes': state_codes,
            'date_published': datetime.now().strftime('%Y-%m-%d'),
            'source_name': 'Manual Entry - Admin Tool',
            'is_approved': True,
            'is_deleted': False
        }

        success, message = data_mgr.add_article(article_data)
        if success:
            flash(message, 'success')
            return redirect(url_for('updates_list'))
        else:
            flash(message, 'error')

    return render_template('add_article.html',
                         categories=DataManager.VALID_CATEGORIES,
                         states=DataManager.VALID_STATES,
                         state_names=DataManager.STATE_NAMES)


@app.route('/sources')
def sources_list():
    """List all sources"""
    sources = data_mgr.get_sources()

    return render_template('sources.html',
                         sources=sources)


@app.route('/api/git-status', methods=['GET'])
def git_status_api():
    """Get full git status including remote sync state"""
    status = git_mgr.get_full_status()
    return jsonify(status)


@app.route('/api/git-sync', methods=['POST'])
def git_sync():
    """Sync local repo with remote (stash, pull, pop)"""
    success, message = git_mgr.sync_with_remote()
    if success:
        # Reload data after sync
        data_mgr.load_all_data()
        return jsonify({'success': True, 'message': message})
    return jsonify({'success': False, 'error': message}), 500


@app.route('/api/publish', methods=['POST'])
def publish():
    """Save changes and publish to git"""
    dry_run = request.json.get('dry_run', False)

    # Validate changes
    valid, errors = data_mgr.validate_changes()
    if not valid:
        return jsonify({'success': False, 'errors': errors}), 400

    if dry_run:
        # Show preview without actually committing
        pending = data_mgr.get_pending_changes_summary()
        preview = git_mgr.dry_run_preview(
            ['api/all-india/categories.json', 'backend/sources.json'],
            f"Admin edit: {pending['article_updates']} updates"
        )
        return jsonify({'success': True, 'preview': preview, 'dry_run': True})

    # Create backup
    backup_success, backup_path, backup_msg = data_mgr.create_backup()
    if not backup_success:
        return jsonify({'success': False, 'error': backup_msg}), 500

    # Get pending changes summary BEFORE save (it gets cleared after)
    pending = data_mgr.get_pending_changes_summary()

    if pending['has_changes']:
        # Traditional in-memory pending changes → save to disk
        save_success, modified_files, save_msg = data_mgr.save_changes()
        if not save_success:
            return jsonify({'success': False, 'error': save_msg}), 500
    else:
        # AJAX operations already saved directly to disk — ask git what changed
        modified_files = git_mgr.get_modified_api_files()

    # Filter to only files that exist
    import os
    files_to_stage = [f for f in modified_files if os.path.exists(os.path.join(REPO_ROOT, f))]

    if not files_to_stage:
        return jsonify({'success': False, 'error': 'No modified API files found to publish. Make sure you have unsaved edits or recently deleted/edited articles.'}), 400

    # Git operations
    # Stage files
    stage_success, stage_msg = git_mgr.stage_files(files_to_stage)
    if not stage_success:
        return jsonify({'success': False, 'error': stage_msg}), 500

    # Check if anything was actually staged
    if not git_mgr.has_staged_changes():
        return jsonify({
            'success': True,
            'message': 'No changes to publish (files unchanged)',
            'modified_files': []
        })

    # Commit
    if pending['has_changes']:
        commit_msg = f"Admin edit: {pending['article_updates']} article updates, {pending['article_adds']} new articles, {pending['article_deletes']} deletions"
    else:
        commit_msg = f"Admin: data update ({len(files_to_stage)} file(s) modified)"
    commit_success, commit_hash, commit_result = git_mgr.commit(commit_msg)
    if not commit_success:
        return jsonify({'success': False, 'error': commit_result}), 500

    # Push
    push_success, push_msg = git_mgr.push()
    if not push_success:
        return jsonify({'success': False, 'error': push_msg}), 500

    # Clear the pending changes tracking after successful publish
    data_mgr.discard_changes()

    return jsonify({
        'success': True,
        'backup_path': backup_path,
        'commit_hash': commit_hash,
        'modified_files': files_to_stage,
        'message': 'Published successfully! Vercel will deploy in ~30 seconds.'
    })


@app.route('/api/discard', methods=['POST'])
def discard_changes():
    """Discard all pending changes"""
    data_mgr.discard_changes()
    return jsonify({'success': True, 'message': 'All changes discarded'})


@app.route('/api/export', methods=['GET'])
def export_articles():
    """
    Export articles from JSON files with time-range filtering

    Query Parameters:
        - days: int (7, 14, 21, or 30) - Look back N days from today
        - start_date: str (YYYY-MM-DD) - Custom start date
        - end_date: str (YYYY-MM-DD) - Custom end date
        - format: str ('csv' or 'xlsx') - Export format (default: 'csv')
        - approved_only: str ('true' or 'false') - Filter to approved articles (default: 'true')
        - category: str - Optional category filter
        - state: str - Optional state filter

    Returns:
        File download with appropriate Content-Type and Content-Disposition headers
    """
    try:
        # Lazy import to avoid circular dependency
        from admin.services.export_service import ExportService

        # Parse query parameters
        days = request.args.get('days', type=int)
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        format_type = request.args.get('format', 'csv').lower()
        approved_only = request.args.get('approved_only', 'true').lower() == 'true'
        category = request.args.get('category')
        state = request.args.get('state')

        # Validate parameters
        if not any([days, (start_date and end_date)]):
            return jsonify({
                'error': 'Must specify either "days" parameter or both "start_date" and "end_date"',
                'examples': [
                    '/api/export?days=7&format=csv',
                    '/api/export?start_date=2026-01-01&end_date=2026-01-31&format=xlsx'
                ]
            }), 400

        if format_type not in ['csv', 'xlsx']:
            return jsonify({
                'error': f'Invalid format: {format_type}. Must be "csv" or "xlsx"'
            }), 400

        # Load data from JSON files
        data_mgr.load_all_data()

        # Generate export
        try:
            file_buffer, stats = ExportService.generate_export_from_json(
                data_manager=data_mgr,
                format=format_type,
                days=days,
                start_date=start_date,
                end_date=end_date,
                approved_only=approved_only,
                category=category,
                state=state
            )
        except ValueError as e:
            return jsonify({'error': f'Invalid parameters: {str(e)}'}), 400
        except RuntimeError as e:
            return jsonify({'error': str(e)}), 500

        # Generate filename with timestamp and date range
        timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
        filename = f"india_ai_tracker_export_{stats['start_date']}_to_{stats['end_date']}_{timestamp}.{format_type}"

        # Set appropriate Content-Type
        content_type = 'text/csv' if format_type == 'csv' else 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

        # Return file with download headers
        return send_file(
            file_buffer,
            mimetype=content_type,
            as_attachment=True,
            download_name=filename
        )

    except Exception as e:
        # Log error for debugging
        print(f"Export error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Export failed: {str(e)}'}), 500


@app.route('/updates/<path:article_url>/delete', methods=['POST'])
def delete_article_route(article_url):
    """Delete an article (form-based, preserves page state via query params)"""
    # Preserve filter/page state
    page     = request.form.get('page', '1')
    search   = request.form.get('search', '')
    category = request.form.get('category', '')
    state    = request.form.get('state', '')
    sort     = request.form.get('sort', 'newest')

    success, message = data_mgr.delete_article_immediate(article_url)
    flash(message, 'success' if success else 'error')
    return redirect(url_for('updates_list', page=page, search=search,
                            category=category, state=state, sort=sort))


# ============================================================
# AJAX Article API
# ============================================================

@app.route('/api/articles/batch-delete', methods=['POST'])
def api_batch_delete():
    """AJAX: delete one or more articles immediately."""
    body = request.get_json() or {}
    urls = body.get('urls', [])
    if not urls:
        return jsonify({'success': False, 'error': 'No URLs provided'}), 400
    success, count, msg = data_mgr.batch_delete_immediate(urls)
    if success:
        return jsonify({'success': True, 'deleted': count, 'message': msg})
    return jsonify({'success': False, 'error': msg}), 400


@app.route('/api/articles/update', methods=['POST'])
def api_update_article():
    """AJAX: quick-update article (title, summary, url, category). No geography change."""
    body = request.get_json() or {}
    original_url = body.get('original_url')
    if not original_url:
        return jsonify({'success': False, 'error': 'original_url required'}), 400

    updates = {k: v for k, v in {
        'url':      body.get('url'),
        'title':    body.get('title'),
        'summary':  body.get('summary'),
        'category': body.get('category'),
    }.items() if v is not None}

    success, msg = data_mgr.update_article_simple(original_url, updates)
    if success:
        return jsonify({'success': True, 'message': msg})
    return jsonify({'success': False, 'error': msg}), 400


# ============================================================
# AJAX Sources API
# ============================================================

@app.route('/api/sources/add', methods=['POST'])
def api_add_source():
    """AJAX: add a new source."""
    body = request.get_json() or {}
    success, msg = data_mgr.add_source(body)
    if success:
        save_ok, save_msg = data_mgr.save_sources()
        if save_ok:
            return jsonify({'success': True, 'message': msg})
        return jsonify({'success': False, 'error': save_msg}), 500
    return jsonify({'success': False, 'error': msg}), 400


@app.route('/api/sources/toggle', methods=['POST'])
def api_toggle_source():
    """AJAX: enable/disable a source by URL."""
    body = request.get_json() or {}
    source_url = body.get('url')
    if not source_url:
        return jsonify({'success': False, 'error': 'url required'}), 400
    success, msg = data_mgr.toggle_source(source_url)
    if success:
        save_ok, save_msg = data_mgr.save_sources()
        if save_ok:
            return jsonify({'success': True, 'message': msg})
        return jsonify({'success': False, 'error': save_msg}), 500
    return jsonify({'success': False, 'error': msg}), 400


@app.route('/api/sources/delete', methods=['POST'])
def api_delete_source():
    """AJAX: delete a source by URL."""
    body = request.get_json() or {}
    source_url = body.get('url')
    if not source_url:
        return jsonify({'success': False, 'error': 'url required'}), 400
    success, msg = data_mgr.delete_source(source_url)
    if success:
        save_ok, save_msg = data_mgr.save_sources()
        if save_ok:
            return jsonify({'success': True, 'message': msg})
        return jsonify({'success': False, 'error': save_msg}), 500
    return jsonify({'success': False, 'error': msg}), 400


@app.route('/api/sources/update', methods=['POST'])
def api_update_source():
    """AJAX: update source fields by original URL."""
    body = request.get_json() or {}
    original_url = body.get('original_url')
    if not original_url:
        return jsonify({'success': False, 'error': 'original_url required'}), 400
    updates = {k: v for k, v in {
        'name':          body.get('name'),
        'url':           body.get('url'),
        'type':          body.get('type'),
        'priority':      body.get('priority'),
        'category_hint': body.get('category_hint'),
        'notes':         body.get('notes'),
    }.items() if v is not None}
    success, msg = data_mgr.update_source(original_url, updates)
    if success:
        save_ok, save_msg = data_mgr.save_sources()
        if save_ok:
            return jsonify({'success': True, 'message': msg})
        return jsonify({'success': False, 'error': save_msg}), 500
    return jsonify({'success': False, 'error': msg}), 400


@app.route('/api/sources/test', methods=['POST'])
def api_test_source():
    """AJAX: check whether a URL is a reachable RSS/Atom feed."""
    import urllib.request as ureq
    import xml.etree.ElementTree as ET
    body = request.get_json() or {}
    url = body.get('url', '').strip()
    if not url:
        return jsonify({'success': False, 'error': 'url required'}), 400
    try:
        req = ureq.Request(url, headers={'User-Agent': 'Mozilla/5.0 (India AI Tracker feed tester)'})
        with ureq.urlopen(req, timeout=12) as resp:
            content = resp.read()
        try:
            root = ET.fromstring(content)
            # RSS 2.0
            channel = root.find('channel')
            if channel is not None:
                title = channel.findtext('title', 'Unknown')
                items = channel.findall('item')
                return jsonify({'success': True, 'type': 'rss', 'title': title,
                                'item_count': len(items), 'message': f'Valid RSS feed — "{title}" ({len(items)} items)'})
            # Atom
            ns = '{http://www.w3.org/2005/Atom}'
            title_el = root.find(f'{ns}title')
            entries = root.findall(f'{ns}entry')
            if title_el is not None:
                return jsonify({'success': True, 'type': 'atom', 'title': title_el.text or '',
                                'item_count': len(entries), 'message': f'Valid Atom feed — "{title_el.text}" ({len(entries)} entries)'})
            return jsonify({'success': True, 'type': 'xml', 'title': 'XML document',
                            'item_count': 0, 'message': 'URL reachable — XML document (not RSS/Atom)'})
        except ET.ParseError:
            return jsonify({'success': True, 'type': 'html', 'title': 'HTML page',
                            'item_count': 0, 'message': 'URL reachable but not an RSS/Atom feed'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e),
                        'message': f'Cannot reach URL: {str(e)}'}), 200


@app.route('/consultations')
def consultations_list():
    """List all consultation submissions from Brevo list #6"""
    import urllib.request
    import json as json_lib

    api_key = os.environ.get('BREVO_API_KEY', '')
    contacts = []
    error = None

    if not api_key:
        error = 'BREVO_API_KEY environment variable not set. Run: export BREVO_API_KEY=your_key'
    else:
        try:
            url = 'https://api.brevo.com/v3/contacts/lists/6/contacts?limit=100&sort=desc'
            req = urllib.request.Request(url, headers={
                'api-key': api_key,
                'Accept': 'application/json'
            })
            with urllib.request.urlopen(req) as response:
                data = json_lib.loads(response.read().decode())
                raw_contacts = data.get('contacts', [])

            # For each contact, fetch full details including attributes
            enriched = []
            for c in raw_contacts:
                try:
                    detail_url = f"https://api.brevo.com/v3/contacts/{urllib.request.quote(c['email'])}"
                    detail_req = urllib.request.Request(detail_url, headers={
                        'api-key': api_key,
                        'Accept': 'application/json'
                    })
                    with urllib.request.urlopen(detail_req) as detail_response:
                        detail = json_lib.loads(detail_response.read().decode())
                        attrs = detail.get('attributes', {})
                        enriched.append({
                            'email': c['email'],
                            'created_at': c.get('createdAt', ''),
                            'engagement_type': attrs.get('ENGAGEMENT_TYPE', ''),
                            'company': attrs.get('COMPANY', ''),
                            'website': attrs.get('WEBSITE', ''),
                            'sector': attrs.get('SECTOR', ''),
                            'stage': attrs.get('STAGE', ''),
                            'role': attrs.get('ROLE', ''),
                            'context': attrs.get('CONTEXT', ''),
                            'submitted_at': attrs.get('SUBMITTED_AT', c.get('createdAt', '')),
                            'firstname': attrs.get('FIRSTNAME', ''),
                            'lastname': attrs.get('LASTNAME', ''),
                        })
                except Exception:
                    # Fall back to basic info if detail fetch fails
                    enriched.append({
                        'email': c['email'],
                        'created_at': c.get('createdAt', ''),
                        'engagement_type': '', 'company': '', 'website': '',
                        'sector': '', 'stage': '', 'role': '', 'context': '',
                        'submitted_at': c.get('createdAt', ''),
                        'firstname': '', 'lastname': '',
                    })
            contacts = enriched
        except Exception as e:
            error = f'Failed to fetch from Brevo: {str(e)}'

    return render_template('consultations.html', contacts=contacts, error=error)


if __name__ == '__main__':
    print("\n" + "="*60)
    print("India AI Tracker - Local Admin Tool")
    print("="*60)
    print(f"\nAdmin panel at: http://localhost:5002")
    print(f"🔒 Localhost only — Host-allowlist + cross-site request guard active")
    print(f"\nRepo root: {REPO_ROOT}")
    print(f"Articles loaded: {load_result['total_articles']}")
    print(f"Sources loaded: {load_result['sources']}")
    print("\nPress Ctrl+C to stop\n")

    # Run on localhost only (not accessible from other machines).
    # debug=False: the Werkzeug interactive debugger is a remote-code-execution
    # surface and must never be enabled on a tool that can git-push to production.
    app.run(
        host='127.0.0.1',
        port=5002,
        debug=False
    )
