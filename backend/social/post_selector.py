"""
Post Selector for X (Twitter)

Selects which articles to post based on:
- Importance score (higher is better)
- Category diversity (not all from one category)
- Geographic diversity (not all from one state)
- Not already posted to X
"""

import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from collections import defaultdict
import json

logger = logging.getLogger(__name__)


class PostSelector:
    """
    Selects articles for X posting with diversity constraints.

    Selection criteria:
    1. Must be approved and not deleted
    2. Must not have been posted to X already
    3. Prioritized by importance_score
    4. Balanced across categories (max 40% from any single category)
    5. Balanced across geography (max 40% from any single state)
    """

    # Maximum percentage of posts from any single category
    MAX_CATEGORY_RATIO = 0.4

    # Maximum percentage of posts from any single state
    MAX_STATE_RATIO = 0.4

    # Categories for reference
    CATEGORIES = [
        'Policies and Initiatives',
        'Events',
        'Major AI Developments',
        'AI Start-Up News'
    ]

    def __init__(self, max_posts_per_day: int = 0):
        """
        Initialize the selector.

        Args:
            max_posts_per_day: Maximum number of posts to select (0 = unlimited, post all)
        """
        self.max_posts_per_day = max_posts_per_day  # 0 means no limit

    def _parse_state_codes(self, state_codes) -> List[str]:
        """Parse state codes from string or list."""
        if not state_codes:
            return ['IN']  # Default to national

        if isinstance(state_codes, str):
            try:
                codes = json.loads(state_codes)
                return codes if codes else ['IN']
            except (json.JSONDecodeError, TypeError):
                return ['IN']

        return state_codes if state_codes else ['IN']

    def _get_primary_state(self, state_codes) -> str:
        """Get the primary state code for an article."""
        codes = self._parse_state_codes(state_codes)

        # If national scope, return 'IN'
        if 'IN' in codes:
            return 'IN'

        # Otherwise return first state
        return codes[0] if codes else 'IN'

    def select_articles(
        self,
        articles: List[Dict[str, Any]],
        already_posted_ids: Optional[set] = None
    ) -> List[Dict[str, Any]]:
        """
        Select articles for posting with diversity constraints.

        Args:
            articles: List of article dicts (from database query)
            already_posted_ids: Set of article IDs already posted (optional, as backup check)

        Returns:
            List of selected articles, ordered by posting priority
        """
        if already_posted_ids is None:
            already_posted_ids = set()

        # Filter: approved, not deleted, not already posted
        candidates = []
        for article in articles:
            # Skip if already posted
            if article.get('posted_to_x_at') is not None:
                continue
            if article.get('id') in already_posted_ids:
                continue

            # Skip if not approved or deleted
            if not article.get('is_approved', False):
                continue
            if article.get('is_deleted', False):
                continue

            candidates.append(article)

        logger.info(f"Found {len(candidates)} candidate articles for X posting")

        if not candidates:
            return []

        # Sort by importance score (descending), then by date (newest first)
        candidates.sort(
            key=lambda x: (x.get('importance_score') or 0, x.get('id') or 0),
            reverse=True
        )

        # If max_posts_per_day is 0 (unlimited), return all candidates
        if self.max_posts_per_day == 0:
            logger.info(f"Unlimited mode: selecting all {len(candidates)} candidates")
            # Still collect stats for logging
            category_counts = defaultdict(int)
            state_counts = defaultdict(int)
            for article in candidates:
                category_counts[article.get('category', 'Unknown')] += 1
                state_counts[self._get_primary_state(article.get('state_codes'))] += 1
            logger.info(f"Category distribution: {dict(category_counts)}")
            logger.info(f"State distribution: {dict(state_counts)}")
            return candidates

        # Select with diversity constraints (only when max_posts > 0)
        selected = []
        category_counts = defaultdict(int)
        state_counts = defaultdict(int)

        max_per_category = int(self.max_posts_per_day * self.MAX_CATEGORY_RATIO)
        max_per_state = int(self.max_posts_per_day * self.MAX_STATE_RATIO)

        # Ensure at least 1 per category/state even with small max_posts
        max_per_category = max(max_per_category, 2)
        max_per_state = max(max_per_state, 2)

        for article in candidates:
            if len(selected) >= self.max_posts_per_day:
                break

            category = article.get('category', 'Unknown')
            state = self._get_primary_state(article.get('state_codes'))

            # Check category diversity (allow some flexibility)
            if category_counts[category] >= max_per_category:
                # Still consider if very high importance and we haven't filled quota
                if len(selected) < self.max_posts_per_day * 0.7:
                    continue

            # Check state diversity (allow some flexibility)
            if state_counts[state] >= max_per_state:
                # Still consider if very high importance
                if len(selected) < self.max_posts_per_day * 0.7:
                    continue

            # Select this article
            selected.append(article)
            category_counts[category] += 1
            state_counts[state] += 1

        # Log selection summary
        logger.info(f"Selected {len(selected)} articles for X posting")
        logger.info(f"Category distribution: {dict(category_counts)}")
        logger.info(f"State distribution: {dict(state_counts)}")

        return selected

    def select_from_db(
        self,
        db_session,
        Update,
        lookback_days: int = 7,
        min_importance: float = 0
    ) -> List[Dict[str, Any]]:
        """
        Select articles directly from database.

        Args:
            db_session: SQLAlchemy session
            Update: Update model class
            lookback_days: How many days back to look for articles
            min_importance: Minimum importance score to consider

        Returns:
            List of selected article dicts
        """
        cutoff_date = datetime.utcnow() - timedelta(days=lookback_days)

        # Query recent, approved, not-yet-posted articles
        query = Update.query.filter(
            Update.is_approved == True,
            Update.is_deleted == False,
            Update.posted_to_x_at == None,
            Update.date_scraped >= cutoff_date
        )

        if min_importance > 0:
            query = query.filter(Update.importance_score >= min_importance)

        # Order by importance
        query = query.order_by(Update.importance_score.desc())

        # Fetch articles (no limit if max_posts_per_day is 0)
        if self.max_posts_per_day == 0:
            articles = query.all()
        else:
            articles = query.limit(self.max_posts_per_day * 3).all()

        # Convert to dicts and select
        article_dicts = [article.to_dict() for article in articles]
        return self.select_articles(article_dicts)

    def get_posting_stats(
        self,
        db_session,
        Update,
        days: int = 30
    ) -> Dict[str, Any]:
        """
        Get statistics about recent X posting activity.

        Args:
            db_session: SQLAlchemy session
            Update: Update model class
            days: Number of days to look back

        Returns:
            Dict with posting statistics
        """
        cutoff_date = datetime.utcnow() - timedelta(days=days)

        # Count posted in period
        posted_count = Update.query.filter(
            Update.posted_to_x_at != None,
            Update.posted_to_x_at >= cutoff_date
        ).count()

        # Count available for posting
        available_count = Update.query.filter(
            Update.is_approved == True,
            Update.is_deleted == False,
            Update.posted_to_x_at == None,
            Update.date_scraped >= cutoff_date
        ).count()

        # Get recent posts by category
        recent_posts = Update.query.filter(
            Update.posted_to_x_at != None,
            Update.posted_to_x_at >= cutoff_date
        ).all()

        category_breakdown = defaultdict(int)
        for post in recent_posts:
            category_breakdown[post.category or 'Unknown'] += 1

        return {
            'period_days': days,
            'total_posted': posted_count,
            'available_to_post': available_count,
            'by_category': dict(category_breakdown),
            'daily_average': round(posted_count / days, 1) if days > 0 else 0
        }


def create_selector(max_posts_per_day: int = 0) -> PostSelector:
    """Factory function to create a PostSelector. Default 0 = unlimited (post all)."""
    return PostSelector(max_posts_per_day=max_posts_per_day)
