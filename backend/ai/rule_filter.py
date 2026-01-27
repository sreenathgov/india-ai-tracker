"""
Layer 1: Rule-Based Filter

Fast keyword-based filtering using YAML configuration.
NO AI API calls - pure Python pattern matching.

Purpose:
- Reduce 2,000-3,500 articles to ~1,200-1,400 (40-45% pass rate)
- Extract keywords from existing filter.py logic
- Confidence zones: HIGH (80+), MEDIUM (40-79), BORDERLINE (30-39)
- Reuse keyword metadata for Layer 3 importance scoring
"""

import re
import yaml
from pathlib import Path
from typing import Dict, List, Tuple, Any
from datetime import datetime


class RuleBasedFilter:
    """
    Rule-based filter using weighted keyword matching.
    Extracts logic from existing filter.py into fast, configurable format.
    """

    def __init__(self, config_path: str = None):
        """
        Initialize filter with configuration.

        Args:
            config_path: Path to filters.yaml (defaults to backend/config/filters.yaml)
        """
        if config_path is None:
            config_path = Path(__file__).parent.parent / 'config' / 'filters.yaml'

        self.config_path = Path(config_path)
        self.config = self._load_config()

        # Compile regex patterns for performance
        self._compile_patterns()

        # Thresholds
        self.pass_threshold = self.config['thresholds']['pass_filter']
        self.high_confidence = self.config['thresholds']['high_confidence']
        self.borderline_min = self.config['thresholds']['borderline_min']

    def _load_config(self) -> Dict:
        """Load YAML configuration file."""
        try:
            with open(self.config_path, 'r') as f:
                return yaml.safe_load(f)
        except FileNotFoundError:
            raise FileNotFoundError(
                f"Filter configuration not found: {self.config_path}\n"
                f"Please ensure config/filters.yaml exists"
            )
        except yaml.YAMLError as e:
            raise ValueError(f"Invalid YAML in {self.config_path}: {e}")

    def _compile_patterns(self):
        """Pre-compile all regex patterns for performance."""
        self.ai_patterns = []
        self.india_patterns = []

        # Compile AI keyword patterns
        for category_name, category_items in self.config['ai_keywords'].items():
            for item in category_items:
                try:
                    pattern = re.compile(item['keyword'], re.IGNORECASE)
                    self.ai_patterns.append({
                        'pattern': pattern,
                        'weight': item['weight'],
                        'categories': item.get('categories', []),
                        'importance_boost': item.get('importance_boost', 0),
                        'description': item.get('description', item['keyword'])
                    })
                except re.error as e:
                    print(f"⚠️  Invalid regex pattern: {item['keyword']}: {e}")

        # Compile India marker patterns
        # Tier 1: States
        for state in self.config['india_markers']['tier1_states']['items']:
            for alias in state['aliases']:
                try:
                    pattern = re.compile(alias, re.IGNORECASE)
                    self.india_patterns.append({
                        'pattern': pattern,
                        'weight': self.config['india_markers']['tier1_states']['weight'],
                        'tier': 1,
                        'name': state['name'],
                        'importance_boost': state.get('importance_boost', 0)
                    })
                except re.error as e:
                    print(f"⚠️  Invalid regex pattern: {alias}: {e}")

        # Tier 2: Companies
        for company in self.config['india_markers']['tier2_companies']['items']:
            try:
                pattern = re.compile(company['pattern'], re.IGNORECASE)
                self.india_patterns.append({
                    'pattern': pattern,
                    'weight': self.config['india_markers']['tier2_companies']['weight'],
                    'tier': 2,
                    'name': company['name'],
                    'type': company.get('type'),
                    'importance_boost': company.get('importance_boost', 0)
                })
            except re.error as e:
                print(f"⚠️  Invalid regex pattern for {company['name']}: {e}")

        # Tier 3: Government & Institutions
        for entity in self.config['india_markers']['tier3_government']['items']:
            try:
                pattern = re.compile(entity['pattern'], re.IGNORECASE)
                self.india_patterns.append({
                    'pattern': pattern,
                    'weight': self.config['india_markers']['tier3_government']['weight'],
                    'tier': 3,
                    'name': entity['name'],
                    'importance_boost': entity.get('importance_boost', 0)
                })
            except re.error as e:
                print(f"⚠️  Invalid regex pattern for {entity['name']}: {e}")

        print(f"✅ Compiled {len(self.ai_patterns)} AI patterns and {len(self.india_patterns)} India patterns")

    def calculate_score(self, title: str, content: str = "") -> Dict[str, Any]:
        """
        Calculate relevance score for an article.

        Args:
            title: Article title
            content: Article content (first 500 chars recommended for speed)

        Returns:
            Dict with score, breakdown, confidence, and hints for Layer 3
        """
        # Truncate content for performance (first 500 chars usually enough)
        content_sample = content[:500] if content else ""

        # Combine title and content for matching
        full_text = f"{title} {content_sample}".lower()

        # Calculate AI score
        ai_score = 0
        ai_matches = []
        ai_categories = set()
        importance_hints = []

        for pattern_info in self.ai_patterns:
            if pattern_info['pattern'].search(full_text):
                ai_score += pattern_info['weight']
                ai_matches.append(pattern_info['description'])
                ai_categories.update(pattern_info['categories'])

                # Collect importance boost hints for Layer 3
                if pattern_info['importance_boost'] > 0:
                    importance_hints.append({
                        'keyword': pattern_info['description'],
                        'boost': pattern_info['importance_boost'],
                        'categories': pattern_info['categories']
                    })

        # Cap AI score at 150 (max from policy keywords)
        ai_score = min(ai_score, 150)

        # Calculate India score
        india_score = 0
        india_matches = []
        india_tiers = set()

        for pattern_info in self.india_patterns:
            if pattern_info['pattern'].search(full_text):
                india_score += pattern_info['weight']
                india_matches.append({
                    'name': pattern_info['name'],
                    'tier': pattern_info['tier'],
                    'weight': pattern_info['weight']
                })
                india_tiers.add(pattern_info['tier'])

                # Government/institution matches are important
                if pattern_info.get('importance_boost', 0) > 0:
                    importance_hints.append({
                        'entity': pattern_info['name'],
                        'boost': pattern_info['importance_boost'],
                        'type': 'government' if pattern_info['tier'] == 3 else 'company'
                    })

        # Cap India score at 60 (max from tier 3)
        india_score = min(india_score, 60)

        # Total score
        total_score = ai_score + india_score

        # CRITICAL RULE: Must have BOTH AI relevance AND India connection
        # Replicates filter.py logic: require minimum AI score AND India score
        has_ai_signal = ai_score >= 60  # At least one strong AI keyword
        has_india_signal = india_score >= 20  # At least some India connection

        # Determine confidence level
        if total_score >= self.high_confidence and has_ai_signal and has_india_signal:
            confidence = 'high'
        elif total_score >= self.pass_threshold and has_ai_signal and has_india_signal:
            confidence = 'medium'
        elif total_score >= self.borderline_min and (has_ai_signal or has_india_signal):
            confidence = 'borderline'
        else:
            confidence = 'low'

        # Decision: Must pass threshold AND have both AI + India signals
        passed = total_score >= self.pass_threshold and has_ai_signal and has_india_signal

        return {
            'passed': passed,
            'total_score': total_score,
            'ai_score': ai_score,
            'india_score': india_score,
            'confidence': confidence,
            'ai_matches': ai_matches[:5],  # Top 5 matches
            'india_matches': india_matches[:3],  # Top 3 matches
            'matched_categories': list(ai_categories),
            'importance_hints': importance_hints,  # For Layer 3 scoring
            'breakdown': {
                'ai_keywords_found': len(ai_matches),
                'india_markers_found': len(india_matches),
                'india_tiers_matched': list(india_tiers)
            }
        }

    def filter_article(self, article: Dict[str, str]) -> Dict[str, Any]:
        """
        Filter a single article.

        Args:
            article: Dict with 'title' and 'content' keys

        Returns:
            Dict with filtering results
        """
        title = article.get('title', '')
        content = article.get('content', '')

        result = self.calculate_score(title, content)

        # Add article reference
        result['article_url'] = article.get('url', '')
        result['article_title'] = title

        return result

    def filter_batch(self, articles: List[Dict[str, str]]) -> Tuple[List[Dict], List[Dict], List[Dict]]:
        """
        Filter a batch of articles.

        Args:
            articles: List of article dicts with 'title', 'content', 'url'

        Returns:
            Tuple of (passed_articles, rejected_articles, borderline_articles)
        """
        passed = []
        rejected = []
        borderline = []

        for article in articles:
            result = self.filter_article(article)

            if result['confidence'] == 'borderline':
                borderline.append({**article, **result})
            elif result['passed']:
                passed.append({**article, **result})
            else:
                rejected.append({**article, **result})

        return passed, rejected, borderline

    def get_stats(self, articles: List[Dict[str, str]]) -> Dict[str, Any]:
        """
        Get filtering statistics for a batch of articles.

        Args:
            articles: List of articles to analyze

        Returns:
            Statistics dict
        """
        passed, rejected, borderline = self.filter_batch(articles)

        return {
            'total': len(articles),
            'passed': len(passed),
            'rejected': len(rejected),
            'borderline': len(borderline),
            'pass_rate': len(passed) / len(articles) if articles else 0,
            'confidence_distribution': {
                'high': len([a for a in passed if a['confidence'] == 'high']),
                'medium': len([a for a in passed if a['confidence'] == 'medium']),
                'borderline': len(borderline),
                'low': len(rejected)
            }
        }


def test_filter():
    """Test the rule-based filter with sample articles."""
    filter = RuleBasedFilter()

    test_articles = [
        {
            'title': 'IIT Madras launches new AI research center in Chennai',
            'content': 'The Indian Institute of Technology Madras announced a new artificial intelligence research center...',
            'url': 'https://example.com/1'
        },
        {
            'title': 'Google expands AI operations in Bangalore',
            'content': 'Google India is expanding its machine learning team in Bangalore to work on generative AI products...',
            'url': 'https://example.com/2'
        },
        {
            'title': 'Weather forecast for Mumbai tomorrow',
            'content': 'Mumbai will see heavy rains tomorrow according to IMD forecast...',
            'url': 'https://example.com/3'
        },
        {
            'title': 'NITI Aayog releases AI policy framework',
            'content': 'The government think tank has published comprehensive guidelines for AI governance in India...',
            'url': 'https://example.com/4'
        }
    ]

    print("\n" + "="*70)
    print("RULE-BASED FILTER TEST")
    print("="*70 + "\n")

    for article in test_articles:
        result = filter.filter_article(article)
        print(f"Title: {article['title']}")
        print(f"  Score: {result['total_score']} (AI: {result['ai_score']}, India: {result['india_score']})")
        print(f"  Confidence: {result['confidence']}")
        print(f"  Decision: {'✅ PASS' if result['passed'] else '❌ REJECT'}")
        print(f"  AI matches: {', '.join(result['ai_matches'][:3])}")
        if result['india_matches']:
            print(f"  India matches: {', '.join([m['name'] for m in result['india_matches'][:3]])}")
        print()

    # Get overall stats
    stats = filter.get_stats(test_articles)
    print("="*70)
    print("OVERALL STATISTICS")
    print("="*70)
    print(f"Total articles: {stats['total']}")
    print(f"Passed: {stats['passed']} ({stats['pass_rate']*100:.1f}%)")
    print(f"Rejected: {stats['rejected']}")
    print(f"Borderline: {stats['borderline']}")
    print()


if __name__ == "__main__":
    test_filter()
