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

from flask import Flask, render_template, request, redirect, url_for, jsonify, flash
from admin.services.data_manager import DataManager
from admin.services.git_manager import GitManager
from datetime import datetime

# Initialize Flask app
app = Flask(__name__, template_folder='admin/templates')
app.secret_key = os.urandom(24)  # For flash messages only

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
    """Edit a single article"""
    if request.method == 'POST':
        # Get state_codes as list (checkboxes return multiple values)
        state_codes = request.form.getlist('state_codes')

        updates = {
            'url': request.form.get('url'),
            'title': request.form.get('title'),
            'summary': request.form.get('summary'),
            'category': request.form.get('category'),
            'state_codes': state_codes  # List like ['IN', 'TN', 'KA']
        }

        success, message = data_mgr.update_article(article_url, updates)
        if success:
            flash(message, 'success')
            return redirect(url_for('updates_list'))
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
                         state_names=DataManager.STATE_NAMES)


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

    # Note: We no longer block on uncommitted changes since the admin only
    # commits API files. Local working files (tracker.db, sources.json, etc.)
    # are not pushed to git anyway.

    # Create backup
    backup_success, backup_path, backup_msg = data_mgr.create_backup()
    if not backup_success:
        return jsonify({'success': False, 'error': backup_msg}), 500

    # Get pending changes summary BEFORE save (it gets cleared after)
    pending = data_mgr.get_pending_changes_summary()

    # Save changes to disk
    save_success, modified_files, save_msg = data_mgr.save_changes()
    if not save_success:
        return jsonify({'success': False, 'error': save_msg}), 500

    # Filter to only files that exist (some state files may not exist yet)
    import os
    files_to_stage = [f for f in modified_files if os.path.exists(os.path.join(REPO_ROOT, f))]

    if not files_to_stage:
        return jsonify({'success': False, 'error': 'No files were modified'}), 400

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
    commit_msg = f"Admin edit: {pending['article_updates']} article updates, {pending['article_adds']} new articles, {pending['article_deletes']} deletions"
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


@app.route('/updates/<path:article_url>/delete', methods=['POST'])
def delete_article_route(article_url):
    """Delete an article"""
    success, message = data_mgr.delete_article(article_url)
    if success:
        flash(message, 'success')
    else:
        flash(message, 'error')
    return redirect(url_for('updates_list'))


if __name__ == '__main__':
    print("\n" + "="*60)
    print("India AI Tracker - Local Admin Tool")
    print("="*60)
    print(f"\nAdmin panel at: http://localhost:5002")
    print(f"🔓 No login required - localhost only")
    print(f"\nRepo root: {REPO_ROOT}")
    print(f"Articles loaded: {load_result['total_articles']}")
    print(f"Sources loaded: {load_result['sources']}")
    print("\nPress Ctrl+C to stop\n")

    # Run on localhost only (not accessible from other machines)
    app.run(
        host='127.0.0.1',
        port=5002,
        debug=True
    )
