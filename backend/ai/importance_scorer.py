"""
Importance Scorer for Layer 3 Premium Processing

Scores articles 0-100 to select the most significant stories for Gemini
premium refinement. Designed to work on title + summary (not raw content,
which is almost always empty from RSS feeds).

Scoring Model:
  Category Base (always given):
    Policies and Initiatives → 30 pts
    Major AI Developments    → 20 pts
    AI Start-Up News         → 20 pts
    Events                   → 10 pts

  Geographic Signal (pick highest):
    Multi-state (>2 states)  → +15 pts
    National scope (IN)      → +10 pts
    Single state             → +5 pts

  Significance Signals (stackable):
    Parliament/PM/Union Govt → +20 pts
    Ministry/State CM        → +15 pts
    Major institution        → +10 pts
    International angle      → +10 pts
    Large funding ≥₹50cr/$5M → +15 pts
    Notable funding ₹10-50cr → +10 pts

  Recency Bonus:
    Published today          → +10 pts
    Published yesterday      → +7 pts
    Published 2-3 days ago   → +4 pts

Premium threshold: 35 points (achievable for any significant article)
"""

import re
import json
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List


class ImportanceScorer:
    """
    Score article importance for Layer 3 premium processing.

    Scores from title + summary (not raw content, which is typically
    empty from RSS feeds). This ensures all articles can receive
    meaningful scores regardless of content availability.
    """

    def __init__(self, config_path: str = None):
        """
        Initialize importance scorer.

        Args:
            config_path: Unused (kept for API compatibility). Previously
                         pointed to filters.yaml but that config is no
                         longer needed for the new scoring model.
        """
        # Compile all patterns once at startup
        self._compile_patterns()

    def _compile_patterns(self):
        """Compile all regex patterns for efficient repeated use."""

        # Significance: Parliament / PM / Union Government
        self.pattern_parliament_pm = re.compile(
            r'\b(parliament|lok sabha|rajya sabha|prime minister|pm modi|'
            r'union government|central government|government of india|'
            r'union budget|central budget|niti aayog)\b',
            re.IGNORECASE
        )

        # Significance: Ministry / State CM
        self.pattern_ministry_cm = re.compile(
            r'\b(ministry of|minister|meity|chief minister|cm |'
            r'state government|state govt)\b',
            re.IGNORECASE
        )

        # Significance: Major institutions
        self.pattern_institutions = re.compile(
            r'\b(iit |iits|iisc|iim |iims|isro|drdo|nasscom|csir|tifr|'
            r'iit madras|iit bombay|iit delhi|iit kharagpur|iit roorkee|'
            r'iisc bangalore|iiit hyderabad)\b',
            re.IGNORECASE
        )

        # Significance: International angle
        self.pattern_international = re.compile(
            r'\b(mou|memorandum of understanding|bilateral|'
            r'us-india|india-us|japan|germany|france|uk-india|'
            r'world bank|imf|united nations|g20|g7)\b',
            re.IGNORECASE
        )

        # Funding: Large (≥ ₹50 crore or $5M+)
        # Matches: ₹50 crore, Rs 200 crore, $10 million, $5 billion
        self.pattern_large_funding = [
            # ₹N crore where N >= 50
            re.compile(r'[₹rs\.]{1,3}\s*([5-9]\d|\d{3,})\s*crore', re.IGNORECASE),
            # $N million where N >= 5
            re.compile(r'\$\s*([5-9]\d*|\d{2,})\s*million', re.IGNORECASE),
            # $N billion (any)
            re.compile(r'\$\s*\d+\.?\d*\s*billion', re.IGNORECASE),
            # ₹N billion (any)
            re.compile(r'[₹rs\.]{1,3}\s*\d+\.?\d*\s*billion', re.IGNORECASE),
        ]

        # Funding: Notable (₹10-49 crore or $1-4M)
        self.pattern_notable_funding = [
            re.compile(r'[₹rs\.]{1,3}\s*([1-4]\d)\s*crore', re.IGNORECASE),
            re.compile(r'\$\s*([1-4])\s*million', re.IGNORECASE),
            re.compile(r'\b(seed|pre-seed|angel)\s*(round|funding)\b', re.IGNORECASE),
        ]

    def _get_recency_bonus(self, article: Dict[str, Any]) -> int:
        """
        Calculate recency bonus based on publication date.

        Returns 10, 7, 4, or 0 depending on how fresh the article is.
        """
        date_published = article.get('date_published', '')
        if not date_published:
            return 0

        try:
            # Parse date string — handle various formats
            if isinstance(date_published, str):
                # Try ISO format first
                try:
                    pub_dt = datetime.fromisoformat(
                        date_published.replace('Z', '+00:00')
                    )
                except ValueError:
                    # Try date-only format
                    pub_dt = datetime.strptime(
                        date_published[:10], '%Y-%m-%d'
                    ).replace(tzinfo=timezone.utc)
            elif isinstance(date_published, datetime):
                pub_dt = date_published
                if pub_dt.tzinfo is None:
                    pub_dt = pub_dt.replace(tzinfo=timezone.utc)
            else:
                return 0

            now = datetime.now(timezone.utc)
            age_days = (now - pub_dt).days

            if age_days == 0:
                return 10   # Published today
            elif age_days == 1:
                return 7    # Published yesterday
            elif age_days <= 3:
                return 4    # Published 2-3 days ago
            else:
                return 0    # Older

        except (ValueError, TypeError):
            return 0

    def calculate_score(
        self,
        article: Dict[str, Any],
        layer1_results: Dict[str, Any] = None,
        layer2_results: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Calculate importance score for an article.

        Args:
            article: Dict with 'title', 'summary', 'category',
                     'state_codes', 'date_published', etc.
            layer1_results: Results from Layer 1 filter (unused, kept for
                            API compatibility)
            layer2_results: Results from Layer 2 (unused, kept for
                            API compatibility)

        Returns:
            Dict with:
                importance_score (int): 0-100+
                breakdown (dict): Points by component
                is_premium_worthy (bool): Score >= 35
        """
        # Manual overrides take absolute priority
        if article.get('force_premium'):
            return {
                'importance_score': 999,
                'breakdown': {'manual_override': 'force_premium'},
                'is_premium_worthy': True
            }
        if article.get('skip_premium'):
            return {
                'importance_score': -999,
                'breakdown': {'manual_override': 'skip_premium'},
                'is_premium_worthy': False
            }

        score = 0
        breakdown = {}

        # ── 1. CATEGORY BASE SCORE ──────────────────────────────────────────
        category = article.get('category', '')
        category_scores = {
            'Policies and Initiatives': 30,
            'Major AI Developments': 20,
            'AI Start-Up News': 20,
            'Events': 10,
        }
        base = category_scores.get(category, 10)
        score += base
        breakdown['category_base'] = base

        # ── 2. GEOGRAPHIC SIGNAL ────────────────────────────────────────────
        state_codes = article.get('state_codes', [])
        if isinstance(state_codes, str):
            try:
                state_codes = json.loads(state_codes)
            except (json.JSONDecodeError, ValueError):
                state_codes = []

        if not isinstance(state_codes, list):
            state_codes = []

        if len(state_codes) > 2:
            geo_score = 15  # Multi-state story
            breakdown['geo_multi_state'] = 15
        elif 'IN' in state_codes:
            geo_score = 10  # National scope
            breakdown['geo_national'] = 10
        elif len(state_codes) >= 1:
            geo_score = 5   # Single state
            breakdown['geo_single_state'] = 5
        else:
            geo_score = 0

        score += geo_score

        # ── 3. SIGNIFICANCE SIGNALS (stackable) ────────────────────────────
        # Score against title + summary (summary is always present and
        # information-dense; content is almost always empty from RSS)
        title = article.get('title', '')
        summary = article.get('summary', '')
        text = f"{title} {summary}".lower()

        if self.pattern_parliament_pm.search(text):
            score += 20
            breakdown['parliament_pm_govt'] = 20

        if self.pattern_ministry_cm.search(text):
            score += 15
            breakdown['ministry_cm'] = 15

        if self.pattern_institutions.search(text):
            score += 10
            breakdown['major_institution'] = 10

        if self.pattern_international.search(text):
            score += 10
            breakdown['international'] = 10

        # Funding: large wins over notable (no double-counting)
        has_large_funding = any(p.search(text) for p in self.pattern_large_funding)
        has_notable_funding = any(p.search(text) for p in self.pattern_notable_funding)

        if has_large_funding:
            score += 15
            breakdown['large_funding'] = 15
        elif has_notable_funding:
            score += 10
            breakdown['notable_funding'] = 10

        # ── 4. RECENCY BONUS ────────────────────────────────────────────────
        recency = self._get_recency_bonus(article)
        if recency > 0:
            score += recency
            breakdown['recency'] = recency

        # Cap at 100 for clean display (overrides can exceed this)
        score = min(score, 100)

        return {
            'importance_score': score,
            'breakdown': breakdown,
            'is_premium_worthy': score >= 35
        }

    def rank_articles(
        self,
        articles: List[Dict[str, Any]],
        top_n: int = 50
    ) -> List[Dict[str, Any]]:
        """
        Rank articles by importance and return top N.

        Args:
            articles: List of article dicts
            top_n: Number of top articles to return

        Returns:
            List of top N articles with scores, sorted by score descending
        """
        scored = []
        for article in articles:
            score_result = self.calculate_score(
                article,
                layer1_results=article.get('layer1_results'),
                layer2_results=article.get('layer2_results')
            )
            scored.append({**article, **score_result})

        # Sort by importance score descending
        scored.sort(key=lambda x: x['importance_score'], reverse=True)

        return scored[:top_n]


def test_importance_scorer():
    """Test importance scorer with sample articles covering all score paths."""
    print("\n" + "=" * 70)
    print("IMPORTANCE SCORER TEST (new: title+summary, threshold=35)")
    print("=" * 70 + "\n")

    scorer = ImportanceScorer()

    test_articles = [
        {
            'id': 1,
            'title': 'Karnataka launches AI skilling scheme',
            'summary': 'Karnataka government allocates ₹200 crore for AI training across 50 colleges in the state.',
            'category': 'Policies and Initiatives',
            'state_codes': ['KA'],
            'date_published': datetime.now(timezone.utc).isoformat()
        },
        {
            'id': 2,
            'title': 'AI startup raises ₹50 crore in Series A funding',
            'summary': 'Bengaluru-based AI startup Neysa secured ₹50 crore in Series A led by Sequoia.',
            'category': 'AI Start-Up News',
            'state_codes': ['KA'],
            'date_published': datetime.now(timezone.utc).isoformat()
        },
        {
            'id': 3,
            'title': 'Parliament introduces AI regulation bill',
            'summary': 'Union government tabled a comprehensive AI regulation bill in Parliament for public comment.',
            'category': 'Policies and Initiatives',
            'state_codes': ['IN'],
            'date_published': datetime.now(timezone.utc).isoformat()
        },
        {
            'id': 4,
            'title': 'IIT Madras and IISc launch joint AI research initiative',
            'summary': 'IIT Madras and IISc Bangalore announced a joint research centre for healthcare AI diagnostics.',
            'category': 'Major AI Developments',
            'state_codes': ['TN', 'KA'],
            'date_published': datetime.now(timezone.utc).isoformat()
        },
        {
            'id': 5,
            'title': 'India signs AI MoU with Japan',
            'summary': 'Prime Minister Modi signed a bilateral MoU with Japan on AI research collaboration and chip supply.',
            'category': 'Major AI Developments',
            'state_codes': ['IN'],
            'date_published': datetime.now(timezone.utc).isoformat()
        },
        {
            'id': 6,
            'title': 'Local AI meetup in Pune',
            'summary': 'Pune startup community hosts monthly AI networking event at CoWork space.',
            'category': 'Events',
            'state_codes': ['MH'],
            'date_published': datetime.now(timezone.utc).isoformat()
        },
    ]

    print("Scoring articles...\n")
    for article in test_articles:
        result = scorer.calculate_score(article)
        status = "✅ PREMIUM" if result['is_premium_worthy'] else "   routine"
        print(f"{status}  Article {article['id']}: {article['title']}")
        print(f"         Score: {result['importance_score']}  |  "
              f"Breakdown: {result['breakdown']}")
        print()

    print("=" * 70)
    print("TOP 3 BY IMPORTANCE")
    print("=" * 70 + "\n")

    top_articles = scorer.rank_articles(test_articles, top_n=3)
    for i, article in enumerate(top_articles, 1):
        print(f"{i}. [{article['importance_score']} pts] {article['title']}")

    print("\n✅ Importance scorer test complete!")
    print(f"   Premium threshold: 35 pts")
    premium_count = sum(1 for a in test_articles
                        if scorer.calculate_score(a)['is_premium_worthy'])
    print(f"   {premium_count}/{len(test_articles)} articles are premium-worthy")


if __name__ == "__main__":
    test_importance_scorer()
