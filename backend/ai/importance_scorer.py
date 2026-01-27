"""
Importance Scorer for Layer 3 Premium Processing

Scores articles based on importance to select top 30-50 for premium processing.

Scoring Factors:
1. Government/Policy signals (from YAML importance_boost)
2. Union/Central government mentions (+30 pts)
3. Ministry/Parliament/PM mentions (+25 pts)
4. Funding amounts > ₹10 crore (+20 pts)
5. Policy keywords (+15 pts)
6. National scope (+10 pts)
7. Major institutions (+10 pts)
8. Manual overrides (force_premium flag = 999 pts)
"""

import re
import yaml
from typing import Dict, Any, List
from pathlib import Path


class ImportanceScorer:
    """
    Score article importance for Layer 3 premium processing.

    Reuses keyword metadata from filters.yaml to avoid duplication.
    """

    def __init__(self, config_path: str = None):
        """
        Initialize importance scorer.

        Args:
            config_path: Path to filters.yaml (defaults to backend/config/filters.yaml)
        """
        if config_path is None:
            config_path = Path(__file__).parent.parent / 'config' / 'filters.yaml'

        self.config_path = Path(config_path)
        self.config = self._load_config()

        # Compile importance patterns
        self._compile_patterns()

    def _load_config(self) -> Dict:
        """Load YAML configuration file."""
        try:
            with open(self.config_path, 'r') as f:
                return yaml.safe_load(f)
        except FileNotFoundError:
            raise FileNotFoundError(f"Config not found: {self.config_path}")

    def _compile_patterns(self):
        """Compile patterns for importance scoring."""
        # Government/policy patterns (high importance)
        self.govt_patterns = {
            'union_govt': re.compile(
                r'\b(union government|central government|government of india|'
                r'centre|central govt|union govt)\b',
                re.IGNORECASE
            ),
            'ministry': re.compile(
                r'\b(ministry of|minister|meity)\b',
                re.IGNORECASE
            ),
            'parliament': re.compile(
                r'\b(parliament|lok sabha|rajya sabha|mp|mps)\b',
                re.IGNORECASE
            ),
            'pm': re.compile(
                r'\b(prime minister|pm modi|pm|president)\b',
                re.IGNORECASE
            ),
            'niti': re.compile(
                r'\bniti aayog\b',
                re.IGNORECASE
            )
        }

        # Funding amount patterns
        self.funding_patterns = [
            re.compile(r'₹\s*(\d+)\s*crore', re.IGNORECASE),
            re.compile(r'rs\.?\s*(\d+)\s*crore', re.IGNORECASE),
            re.compile(r'inr\s*(\d+)\s*crore', re.IGNORECASE),
            re.compile(r'\$\s*(\d+)\s*million', re.IGNORECASE),
        ]

        # Policy keywords (from YAML)
        self.policy_patterns = []
        for category in self.config.get('ai_keywords', {}).get('policy', []):
            try:
                pattern = re.compile(category['keyword'], re.IGNORECASE)
                self.policy_patterns.append({
                    'pattern': pattern,
                    'boost': category.get('importance_boost', 15)
                })
            except re.error:
                pass

        # Major institutions
        self.institution_patterns = re.compile(
            r'\b(iit|iisc|iim|isro|drdo|csir|tifr|nasscom)\b',
            re.IGNORECASE
        )

    def extract_funding_amount(self, text: str) -> float:
        """
        Extract maximum funding amount from text.

        Args:
            text: Article content

        Returns:
            Amount in crores (0 if none found)
        """
        max_amount = 0.0

        for pattern in self.funding_patterns:
            matches = pattern.findall(text)
            for match in matches:
                try:
                    amount = float(match.replace(',', ''))
                    # Convert USD millions to INR crores (rough: $1M ≈ ₹8 crore)
                    if '$' in pattern.pattern:
                        amount = amount * 8
                    max_amount = max(max_amount, amount)
                except ValueError:
                    pass

        return max_amount

    def calculate_score(
        self,
        article: Dict[str, Any],
        layer1_results: Dict[str, Any] = None,
        layer2_results: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Calculate importance score for an article.

        Args:
            article: Dict with 'title', 'content', 'category', 'state_codes', etc.
            layer1_results: Results from Layer 1 filter (optional)
            layer2_results: Results from Layer 2 processing (optional)

        Returns:
            Dict with score and breakdown
        """
        title = article.get('title', '')
        content = article.get('content', '')
        full_text = f"{title} {content}".lower()

        score = 0
        breakdown = {}

        # 1. YAML importance boosts (from Layer 1)
        if layer1_results and 'importance_hints' in layer1_results:
            yaml_boost = sum(hint.get('boost', 0) for hint in layer1_results['importance_hints'])
            if yaml_boost > 0:
                score += yaml_boost
                breakdown['yaml_keywords'] = yaml_boost

        # 2. Government mentions
        govt_score = 0

        if self.govt_patterns['union_govt'].search(full_text):
            govt_score += 30
            breakdown['union_govt'] = 30

        if self.govt_patterns['ministry'].search(full_text):
            govt_score += 25
            breakdown['ministry'] = 25

        if self.govt_patterns['parliament'].search(full_text):
            govt_score += 25
            breakdown['parliament'] = 25

        if self.govt_patterns['pm'].search(full_text):
            govt_score += 25
            breakdown['pm'] = 25

        if self.govt_patterns['niti'].search(full_text):
            govt_score += 20
            breakdown['niti_aayog'] = 20

        score += govt_score

        # 3. Funding amount
        funding_amount = self.extract_funding_amount(full_text)
        if funding_amount >= 10:  # ≥ ₹10 crore
            funding_score = min(20, int(funding_amount / 10) * 2)  # Scale up to 20 pts
            score += funding_score
            breakdown['funding'] = funding_score
            breakdown['funding_amount'] = f"₹{funding_amount:.1f} crore"

        # 4. Policy keywords (beyond YAML boost)
        policy_score = 0
        for pattern_info in self.policy_patterns:
            if pattern_info['pattern'].search(full_text):
                policy_score = max(policy_score, 15)  # Max 15 pts for policy
                break

        if policy_score > 0 and 'yaml_keywords' not in breakdown:
            # Only add if not already counted in YAML boost
            score += policy_score
            breakdown['policy_keywords'] = policy_score

        # 5. National scope (from state_codes)
        state_codes = article.get('state_codes', [])
        if isinstance(state_codes, str):
            try:
                import json
                state_codes = json.loads(state_codes)
            except:
                state_codes = []

        if 'IN' in state_codes or len(state_codes) > 2:
            score += 10
            breakdown['national_scope'] = 10

        # 6. Major institutions
        if self.institution_patterns.search(full_text):
            score += 10
            breakdown['major_institution'] = 10

        # 7. Category importance
        category = article.get('category', '')
        if 'Policy' in category or 'Regulation' in category:
            score += 5
            breakdown['policy_category'] = 5
        elif 'Major' in category or 'Developments' in category:
            score += 3
            breakdown['major_category'] = 3

        # 8. Manual overrides (from database flags)
        if article.get('force_premium'):
            score = 999
            breakdown = {'manual_override': 'force_premium'}
        elif article.get('skip_premium'):
            score = -999
            breakdown = {'manual_override': 'skip_premium'}

        return {
            'importance_score': score,
            'breakdown': breakdown,
            'is_premium_worthy': score >= 70  # Threshold for premium processing
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
            List of top N articles with scores
        """
        # Score all articles
        scored = []
        for article in articles:
            score_result = self.calculate_score(
                article,
                layer1_results=article.get('layer1_results'),
                layer2_results=article.get('layer2_results')
            )

            scored.append({
                **article,
                **score_result
            })

        # Sort by importance score (descending)
        scored.sort(key=lambda x: x['importance_score'], reverse=True)

        # Return top N
        return scored[:top_n]


def test_importance_scorer():
    """Test importance scorer with sample articles."""
    print("\n" + "="*70)
    print("IMPORTANCE SCORER TEST")
    print("="*70 + "\n")

    scorer = ImportanceScorer()

    test_articles = [
        {
            'id': 1,
            'title': 'NITI Aayog releases AI policy framework',
            'content': 'The government think tank published comprehensive guidelines for AI governance in India...',
            'category': 'AI Policy & Regulation',
            'state_codes': ['IN']
        },
        {
            'id': 2,
            'title': 'AI startup raises ₹50 crore funding',
            'content': 'Indian AI startup Krutrim has raised ₹50 crore in Series A funding...',
            'category': 'AI Start-Up News',
            'state_codes': ['KA']
        },
        {
            'id': 3,
            'title': 'Google expands AI team in Bangalore',
            'content': 'Google India is expanding its machine learning team in Bangalore...',
            'category': 'AI Products & Applications',
            'state_codes': ['KA']
        },
        {
            'id': 4,
            'title': 'Parliament introduces AI regulation bill',
            'content': 'The union government introduced a comprehensive AI regulation bill in Parliament...',
            'category': 'AI Policy & Regulation',
            'state_codes': ['IN']
        },
        {
            'id': 5,
            'title': 'IIT Madras AI research',
            'content': 'IIT Madras researchers develop new AI algorithm for healthcare...',
            'category': 'AI Research & Innovation',
            'state_codes': ['TN']
        }
    ]

    print("Scoring articles...\n")

    for article in test_articles:
        result = scorer.calculate_score(article)
        print(f"Article {article['id']}: {article['title'][:50]}...")
        print(f"  Score: {result['importance_score']}")
        print(f"  Premium worthy: {result['is_premium_worthy']}")
        if result['breakdown']:
            print(f"  Breakdown: {result['breakdown']}")
        print()

    # Test ranking
    print("="*70)
    print("TOP 3 ARTICLES BY IMPORTANCE")
    print("="*70 + "\n")

    top_articles = scorer.rank_articles(test_articles, top_n=3)

    for i, article in enumerate(top_articles, 1):
        print(f"{i}. {article['title'][:60]}...")
        print(f"   Score: {article['importance_score']}")
        print()

    print("✅ Importance scorer test complete!")


if __name__ == "__main__":
    test_importance_scorer()
