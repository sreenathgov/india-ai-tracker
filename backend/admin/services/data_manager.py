"""
Data Manager - Handle JSON file operations for the admin tool
Manages article data from api/ directory with backup and validation
"""

import json
import os
import shutil
from datetime import datetime
from typing import Dict, List, Optional, Tuple
from pathlib import Path


class DataManager:
    """Manages article and metadata JSON files with backup and validation"""

    # Valid categories from the site
    VALID_CATEGORIES = [
        "Policies and Initiatives",
        "Events",
        "Major AI Developments",
        "AI Start-Up News"
    ]

    # Valid state codes (abbreviated - matching JSON state_codes field)
    VALID_STATES = [
        "IN",   # National / All-India
        "TN",   # Tamil Nadu
        "KA",   # Karnataka
        "MH",   # Maharashtra
        "TG",   # Telangana
        "AP",   # Andhra Pradesh
        "GJ",   # Gujarat
        "DL",   # Delhi
        "UP",   # Uttar Pradesh
        "RJ",   # Rajasthan
        "WB",   # West Bengal
        "KL",   # Kerala
        "OR",   # Odisha
        "AS",   # Assam
        "HP",   # Himachal Pradesh
        "UK",   # Uttarakhand
        "PB",   # Punjab
        "HR",   # Haryana
        "MP",   # Madhya Pradesh
        "JH",   # Jharkhand
        "CT",   # Chhattisgarh
        "BR",   # Bihar
        "GA",   # Goa
        "MN",   # Manipur
        "TR",   # Tripura
        "NL",   # Nagaland
        "MZ",   # Mizoram
        "AR",   # Arunachal Pradesh
        "ML",   # Meghalaya
    ]

    # Display names for states
    STATE_NAMES = {
        "IN": "National (All India)",
        "TN": "Tamil Nadu",
        "KA": "Karnataka",
        "MH": "Maharashtra",
        "TG": "Telangana",
        "AP": "Andhra Pradesh",
        "GJ": "Gujarat",
        "DL": "Delhi",
        "UP": "Uttar Pradesh",
        "RJ": "Rajasthan",
        "WB": "West Bengal",
        "KL": "Kerala",
        "OR": "Odisha",
        "AS": "Assam",
        "HP": "Himachal Pradesh",
        "UK": "Uttarakhand",
        "PB": "Punjab",
        "HR": "Haryana",
        "MP": "Madhya Pradesh",
        "JH": "Jharkhand",
        "CT": "Chhattisgarh",
        "BR": "Bihar",
        "GA": "Goa",
        "MN": "Manipur",
        "TR": "Tripura",
        "NL": "Nagaland",
        "MZ": "Mizoram",
        "AR": "Arunachal Pradesh",
        "ML": "Meghalaya",
    }

    # Mapping for sources.json (uses full names) to abbreviated codes
    SOURCE_STATE_MAP = {
        "national": "IN",
        "tamil_nadu": "TN",
        "karnataka": "KA",
        "maharashtra": "MH",
        "telangana": "TG",
        "andhra_pradesh": "AP",
        "gujarat": "GJ",
        "delhi": "DL",
        "uttar_pradesh": "UP",
        "rajasthan": "RJ",
        "west_bengal": "WB",
        "kerala": "KL",
        "odisha": "OR",
        "assam": "AS",
        "himachal_pradesh": "HP",
        "uttarakhand": "UK",
        "punjab": "PB",
        "haryana": "HR",
        "madhya_pradesh": "MP",
        "jharkhand": "JH",
        "chhattisgarh": "CT",
        "bihar": "BR",
        "goa": "GA",
        "manipur": "MN",
        "tripura": "TR",
        "nagaland": "NL",
        "mizoram": "MZ",
        "arunachal_pradesh": "AR",
        "meghalaya": "ML",
        "ladakh": "LA",
        "jammu_kashmir": "JK",
    }

    def __init__(self, repo_root: str):
        self.repo_root = repo_root
        self.api_dir = os.path.join(repo_root, "api")
        self.backup_dir = os.path.join(repo_root, "api", "backups")
        self.sources_file = os.path.join(repo_root, "backend", "sources.json")

        # In-memory data cache
        self.all_india_data = None
        self.states_data = {}
        self.sources_data = None

        # Track pending changes
        self.pending_changes = {
            'articles': {},  # article_id -> updated_data
            'sources': {},   # source_id -> updated_data
            'deleted_articles': set(),
            'new_articles': [],
            'new_sources': []
        }

        # Ensure backup directory exists
        os.makedirs(self.backup_dir, exist_ok=True)

    def load_all_data(self) -> Dict[str, any]:
        """
        Load all article data from JSON files

        Returns:
            Dict with loading status and counts
        """
        result = {
            'success': True,
            'national_articles': 0,
            'state_articles': 0,
            'total_articles': 0,
            'sources': 0,
            'errors': []
        }

        try:
            # Load national (all-india) data
            all_india_path = os.path.join(self.api_dir, "all-india", "categories.json")
            if os.path.exists(all_india_path):
                with open(all_india_path, 'r', encoding='utf-8') as f:
                    self.all_india_data = json.load(f)
                    # Count articles
                    for category, articles in self.all_india_data.get('categories', {}).items():
                        result['national_articles'] += len(articles)
            else:
                result['errors'].append("All-India categories.json not found")

            # Load state data
            states_dir = os.path.join(self.api_dir, "states")
            if os.path.exists(states_dir):
                for state_code in os.listdir(states_dir):
                    state_path = os.path.join(states_dir, state_code)
                    if os.path.isdir(state_path):
                        cat_file = os.path.join(state_path, "categories.json")
                        if os.path.exists(cat_file):
                            with open(cat_file, 'r', encoding='utf-8') as f:
                                self.states_data[state_code] = json.load(f)
                                for category, articles in self.states_data[state_code].get('categories', {}).items():
                                    result['state_articles'] += len(articles)

            # Load sources
            if os.path.exists(self.sources_file):
                with open(self.sources_file, 'r', encoding='utf-8') as f:
                    self.sources_data = json.load(f)
                    # Count sources
                    result['sources'] = len(self.sources_data.get('national', []))
                    for state_code in self.VALID_STATES:
                        if state_code in self.sources_data:
                            result['sources'] += len(self.sources_data[state_code])

            result['total_articles'] = result['national_articles'] + result['state_articles']

        except Exception as e:
            result['success'] = False
            result['errors'].append(f"Error loading data: {str(e)}")

        return result

    def get_all_articles(self, filters: Optional[Dict] = None, sort_order: str = 'newest') -> List[Dict]:
        """
        Get all articles with optional filtering and sorting

        Args:
            filters: Dict with optional 'category', 'state', 'search' keys
            sort_order: 'newest' (default) or 'oldest' - controls date sorting

        Returns:
            List of article dictionaries with metadata
        """
        articles = []

        # Get national articles
        if self.all_india_data:
            for category, cat_articles in self.all_india_data.get('categories', {}).items():
                for article in cat_articles:
                    articles.append({
                        **article,
                        '_category': category,
                        '_geography': 'National',
                        '_source_file': 'all-india'
                    })

        # Get state articles
        for state_code, state_data in self.states_data.items():
            for category, cat_articles in state_data.get('categories', {}).items():
                for article in cat_articles:
                    articles.append({
                        **article,
                        '_category': category,
                        '_geography': f'State: {state_code}',
                        '_source_file': f'states/{state_code}'
                    })

        # Apply filters
        if filters:
            if 'category' in filters and filters['category']:
                articles = [a for a in articles if a['_category'] == filters['category']]

            if 'state' in filters and filters['state']:
                state_code = filters['state']
                articles = [
                    a for a in articles
                    if 'state_codes' in a and state_code in a.get('state_codes', [])
                ]

            if 'search' in filters and filters['search']:
                search_term = filters['search'].lower()
                articles = [
                    a for a in articles
                    if search_term in a.get('title', '').lower()
                    or search_term in a.get('url', '').lower()
                    or search_term in a.get('summary', '').lower()
                ]

        # Sort by date - newest first (reverse=True) or oldest first (reverse=False)
        # Try 'date_published' first, fall back to 'date' for compatibility
        reverse = (sort_order == 'newest')
        articles.sort(key=lambda x: x.get('date_published', x.get('date', '')), reverse=reverse)

        return articles

    def get_article_by_url(self, url: str) -> Optional[Dict]:
        """
        Find an article by its URL

        Args:
            url: Article URL to search for

        Returns:
            Article dict if found, None otherwise
        """
        articles = self.get_all_articles()
        for article in articles:
            if article.get('url') == url:
                return article
        return None

    def update_article(self, url: str, updates: Dict) -> Tuple[bool, str]:
        """
        Update an article in memory (changes not written to disk yet)

        Args:
            url: URL of the article to update
            updates: Dict of fields to update

        Returns:
            Tuple of (success: bool, message: str)
        """
        article = self.get_article_by_url(url)
        if not article:
            return False, f"Article not found: {url}"

        # Validate updates
        if 'category' in updates and updates['category'] not in self.VALID_CATEGORIES:
            return False, f"Invalid category: {updates['category']}"

        if 'state_codes' in updates:
            invalid_states = [s for s in updates['state_codes'] if s not in self.VALID_STATES]
            if invalid_states:
                return False, f"Invalid state codes: {', '.join(invalid_states)}"

        # Track pending change
        self.pending_changes['articles'][url] = {
            'original': article.copy(),
            'updates': updates
        }

        return True, "Article updated (not saved to disk yet)"

    def delete_article(self, url: str) -> Tuple[bool, str]:
        """
        Mark an article for deletion (not removed from disk yet)

        Args:
            url: URL of the article to delete

        Returns:
            Tuple of (success: bool, message: str)
        """
        article = self.get_article_by_url(url)
        if not article:
            return False, f"Article not found: {url}"

        self.pending_changes['deleted_articles'].add(url)
        return True, "Article marked for deletion (not removed from disk yet)"

    def add_article(self, article_data: Dict) -> Tuple[bool, str]:
        """
        Add a new article (not written to disk yet)

        Args:
            article_data: Article data dictionary

        Returns:
            Tuple of (success: bool, message: str)
        """
        # Validate required fields
        required = ['url', 'title', 'category']
        missing = [f for f in required if f not in article_data or not article_data[f]]
        if missing:
            return False, f"Missing required fields: {', '.join(missing)}"

        # Validate category
        if article_data['category'] not in self.VALID_CATEGORIES:
            return False, f"Invalid category: {article_data['category']}"

        # Check for duplicate URL
        if self.get_article_by_url(article_data['url']):
            return False, f"Article with this URL already exists"

        self.pending_changes['new_articles'].append(article_data)
        return True, "Article added (not saved to disk yet)"

    def get_sources(self, filters: Optional[Dict] = None) -> List[Dict]:
        """
        Get all scraper sources with optional filtering

        Args:
            filters: Dict with optional filter criteria

        Returns:
            List of source dictionaries
        """
        if not self.sources_data:
            return []

        sources = []

        # National sources
        for source in self.sources_data.get('national', []):
            sources.append({
                **source,
                '_scope': 'National',
                '_state': None
            })

        # State sources (sources.json uses full names like "tamil_nadu")
        for source_state_name, state_code in self.SOURCE_STATE_MAP.items():
            if source_state_name in self.sources_data and source_state_name != 'national':
                for source in self.sources_data[source_state_name]:
                    sources.append({
                        **source,
                        '_scope': f'State: {state_code}',
                        '_state': state_code
                    })

        # Apply filters
        if filters:
            if 'status' in filters and filters['status']:
                sources = [s for s in sources if s.get('enabled', True) == (filters['status'] == 'active')]

            if 'type' in filters and filters['type']:
                sources = [s for s in sources if s.get('type') == filters['type']]

        return sources

    def create_backup(self) -> Tuple[bool, str, str]:
        """
        Create timestamped backup of all data files

        Returns:
            Tuple of (success: bool, backup_dir: str, message: str)
        """
        timestamp = datetime.now().strftime('%Y-%m-%d_%H-%M-%S')
        backup_path = os.path.join(self.backup_dir, timestamp)

        try:
            os.makedirs(backup_path, exist_ok=True)

            # Backup all-india data
            all_india_src = os.path.join(self.api_dir, "all-india", "categories.json")
            if os.path.exists(all_india_src):
                all_india_dst = os.path.join(backup_path, "all-india_categories.json")
                shutil.copy2(all_india_src, all_india_dst)

            # Backup state data
            states_backup = os.path.join(backup_path, "states")
            os.makedirs(states_backup, exist_ok=True)

            states_dir = os.path.join(self.api_dir, "states")
            if os.path.exists(states_dir):
                for state_code in os.listdir(states_dir):
                    state_src = os.path.join(states_dir, state_code, "categories.json")
                    if os.path.exists(state_src):
                        state_dst = os.path.join(states_backup, f"{state_code}_categories.json")
                        shutil.copy2(state_src, state_dst)

            # Backup sources
            if os.path.exists(self.sources_file):
                sources_dst = os.path.join(backup_path, "sources.json")
                shutil.copy2(self.sources_file, sources_dst)

            # Clean old backups (keep last 10)
            self._cleanup_old_backups()

            return True, backup_path, f"Backup created at {backup_path}"

        except Exception as e:
            return False, "", f"Backup failed: {str(e)}"

    def _cleanup_old_backups(self, keep_count: int = 10):
        """Remove old backups, keeping only the most recent N"""
        try:
            backups = []
            for item in os.listdir(self.backup_dir):
                item_path = os.path.join(self.backup_dir, item)
                if os.path.isdir(item_path):
                    backups.append((item, os.path.getctime(item_path)))

            # Sort by creation time (newest first)
            backups.sort(key=lambda x: x[1], reverse=True)

            # Remove old backups
            for backup_name, _ in backups[keep_count:]:
                backup_path = os.path.join(self.backup_dir, backup_name)
                shutil.rmtree(backup_path)

        except Exception as e:
            print(f"Warning: Failed to cleanup old backups: {e}")

    def validate_changes(self) -> Tuple[bool, List[str]]:
        """
        Validate all pending changes before saving

        Returns:
            Tuple of (valid: bool, errors: List[str])
        """
        errors = []

        # Validate article updates
        for url, change in self.pending_changes['articles'].items():
            updates = change['updates']

            if 'category' in updates and updates['category'] not in self.VALID_CATEGORIES:
                errors.append(f"{url}: Invalid category '{updates['category']}'")

            if 'title' in updates and not updates['title'].strip():
                errors.append(f"{url}: Title cannot be empty")

            if 'url' in updates and not updates['url'].startswith('http'):
                errors.append(f"{url}: Invalid URL format")

        # Validate new articles
        for article in self.pending_changes['new_articles']:
            if not article.get('title'):
                errors.append("New article: Title required")
            if not article.get('url', '').startswith('http'):
                errors.append("New article: Invalid URL")
            if article.get('category') not in self.VALID_CATEGORIES:
                errors.append(f"New article: Invalid category '{article.get('category')}'")

        return len(errors) == 0, errors

    def get_pending_changes_summary(self) -> Dict[str, any]:
        """
        Get a summary of all pending changes

        Returns:
            Dict with counts and details of pending changes
        """
        return {
            'has_changes': (
                len(self.pending_changes['articles']) > 0
                or len(self.pending_changes['deleted_articles']) > 0
                or len(self.pending_changes['new_articles']) > 0
                or len(self.pending_changes['sources']) > 0
                or len(self.pending_changes['new_sources']) > 0
            ),
            'article_updates': len(self.pending_changes['articles']),
            'article_deletes': len(self.pending_changes['deleted_articles']),
            'article_adds': len(self.pending_changes['new_articles']),
            'source_updates': len(self.pending_changes['sources']),
            'source_adds': len(self.pending_changes['new_sources']),
            'details': self.pending_changes
        }

    def save_changes(self) -> Tuple[bool, List[str], str]:
        """
        Save all pending changes to disk - ACTUALLY writes to JSON files

        Returns:
            Tuple of (success: bool, modified_files: List[str], message: str)
        """
        modified_files = []

        try:
            # 1. Create backup first
            backup_success, backup_path, backup_msg = self.create_backup()
            if not backup_success:
                return False, [], f"Backup failed: {backup_msg}"

            # 2. Reload data to ensure we have latest
            self.load_all_data()

            # 3. Apply article updates to in-memory data
            for url, change in self.pending_changes['articles'].items():
                article = self.get_article_by_url(url)
                if not article:
                    continue

                # Apply each update field
                for key, value in change['updates'].items():
                    # Skip internal metadata fields
                    if not key.startswith('_'):
                        article[key] = value

            # 4. Apply article deletions AND add to blacklist
            deleted_urls = []
            for url_to_delete in self.pending_changes['deleted_articles']:
                article = self.get_article_by_url(url_to_delete)
                if article:
                    source_file = article['_source_file']
                    category = article['_category']

                    # Remove from appropriate data structure
                    if source_file == 'all-india':
                        if category in self.all_india_data.get('categories', {}):
                            self.all_india_data['categories'][category] = [
                                a for a in self.all_india_data['categories'][category]
                                if a.get('url') != url_to_delete
                            ]
                    elif source_file.startswith('states/'):
                        state_code = source_file.replace('states/', '')
                        if state_code in self.states_data:
                            if category in self.states_data[state_code].get('categories', {}):
                                self.states_data[state_code]['categories'][category] = [
                                    a for a in self.states_data[state_code]['categories'][category]
                                    if a.get('url') != url_to_delete
                                ]

                    # Track deleted URL for blacklist
                    deleted_urls.append(url_to_delete)

            # 4b. Add deleted URLs to blacklist (prevents re-scraping)
            if deleted_urls:
                self._add_to_blacklist(deleted_urls)
                modified_files.append("api/blacklist.json")

            # 5. Add new articles
            for new_article in self.pending_changes['new_articles']:
                category = new_article.get('category')
                geography = new_article.get('geography', 'national')

                # Remove internal fields before saving
                clean_article = {k: v for k, v in new_article.items() if not k.startswith('_')}

                if geography == 'national':
                    # Add to all-india
                    if category not in self.all_india_data.get('categories', {}):
                        self.all_india_data['categories'][category] = []
                    self.all_india_data['categories'][category].append(clean_article)
                else:
                    # Add to appropriate state
                    state_codes = new_article.get('state_codes', [])
                    for state_code in state_codes:
                        if state_code not in self.states_data:
                            continue
                        if category not in self.states_data[state_code].get('categories', {}):
                            self.states_data[state_code]['categories'][category] = []
                        self.states_data[state_code]['categories'][category].append(clean_article)

            # 6. Write all-india JSON to disk
            all_india_path = os.path.join(self.api_dir, "all-india", "categories.json")
            if self.all_india_data:
                with open(all_india_path, 'w', encoding='utf-8') as f:
                    json.dump(self.all_india_data, f, indent=2, ensure_ascii=False)
                modified_files.append("api/all-india/categories.json")

            # 7. Write state JSONs to disk
            for state_code, state_data in self.states_data.items():
                state_path = os.path.join(self.api_dir, "states", state_code, "categories.json")
                with open(state_path, 'w', encoding='utf-8') as f:
                    json.dump(state_data, f, indent=2, ensure_ascii=False)
                modified_files.append(f"api/states/{state_code}/categories.json")

            # 8. Clear pending changes
            changes_made = (
                len(self.pending_changes['articles']) +
                len(self.pending_changes['deleted_articles']) +
                len(self.pending_changes['new_articles'])
            )

            self.pending_changes = {
                'articles': {},
                'sources': {},
                'deleted_articles': set(),
                'new_articles': [],
                'new_sources': []
            }

            return True, modified_files, f"Successfully saved {changes_made} change(s) to {len(modified_files)} file(s)"

        except Exception as e:
            import traceback
            error_details = traceback.format_exc()
            return False, [], f"Failed to save changes: {str(e)}\n{error_details}"

    def discard_changes(self):
        """Discard all pending changes"""
        self.pending_changes = {
            'articles': {},
            'sources': {},
            'deleted_articles': set(),
            'new_articles': [],
            'new_sources': []
        }

    def get_stats(self) -> Dict[str, any]:
        """
        Get statistics about the data

        Returns:
            Dict with various statistics
        """
        articles = self.get_all_articles()

        # Category counts
        category_counts = {}
        for article in articles:
            cat = article.get('_category', 'Unknown')
            category_counts[cat] = category_counts.get(cat, 0) + 1

        # State counts
        state_counts = {}
        for article in articles:
            geo = article.get('_geography', 'Unknown')
            if geo.startswith('State: '):
                state = geo.replace('State: ', '')
                state_counts[state] = state_counts.get(state, 0) + 1
            elif geo == 'National':
                state_counts['National'] = state_counts.get('National', 0) + 1

        return {
            'total_articles': len(articles),
            'national_articles': state_counts.get('National', 0),
            'state_articles': len(articles) - state_counts.get('National', 0),
            'by_category': category_counts,
            'by_state': state_counts,
            'total_sources': len(self.get_sources()),
            'pending_changes': self.get_pending_changes_summary()
        }

    def _add_to_blacklist(self, urls: list):
        """
        Add URLs to the blacklist to prevent re-scraping.
        This ensures deleted articles don't come back via daily scrapes.

        Args:
            urls: List of URLs to blacklist
        """
        blacklist_path = os.path.join(self.api_dir, "blacklist.json")

        try:
            # Load existing blacklist
            if os.path.exists(blacklist_path):
                with open(blacklist_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
            else:
                data = {
                    "_description": "Articles manually deleted - do not re-add via scraper",
                    "_updated": "",
                    "urls": []
                }

            # Add new URLs
            existing = set(data.get('urls', []))
            for url in urls:
                if url not in existing:
                    data['urls'].append(url)

            # Update timestamp
            data['_updated'] = datetime.now().strftime('%Y-%m-%d %H:%M')

            # Write back
            with open(blacklist_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)

            print(f"  Added {len(urls)} URL(s) to blacklist")

        except Exception as e:
            print(f"  Warning: Could not update blacklist: {e}")
