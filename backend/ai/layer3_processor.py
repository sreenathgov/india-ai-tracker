"""
Layer 3: Premium Processing

Selects top 30-50 most important articles and refines them with Gemini 1.5 Flash.

Flow:
1. Load articles that passed Layer 2
2. Score importance using ImportanceScorer
3. Select top N articles
4. Refine with Gemini for premium quality
5. Update database with premium results
"""

import os
from typing import List, Dict, Any
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(env_path)

from ai.importance_scorer import ImportanceScorer
from ai.providers.gemini_client import GeminiClient


class Layer3Processor:
    """
    Layer 3 premium processor for high-importance articles.
    """

    def __init__(self, provider: str = None, top_n: int = None):
        """
        Initialize Layer 3 processor.

        Args:
            provider: 'gemini' or 'groq' (defaults to env LAYER3_PROVIDER)
            top_n: Number of top articles to process (defaults to env LAYER3_TOP_N)
        """
        self.provider_preference = provider or os.getenv('LAYER3_PROVIDER', 'gemini')
        self.top_n = top_n or int(os.getenv('LAYER3_TOP_N', '50'))

        # Initialize scorer
        self.scorer = ImportanceScorer()

        # Initialize client
        if self.provider_preference == 'gemini':
            try:
                self.client = GeminiClient()
                print(f"✅ Gemini client initialized for Layer 3")
            except Exception as e:
                print(f"⚠️  Failed to initialize Gemini: {e}")
                self.client = None
        else:
            # Could add Groq fallback here
            raise ValueError(f"Provider {self.provider_preference} not supported for Layer 3")

        # Stats
        self.stats = {
            'total_scored': 0,
            'premium_selected': 0,
            'premium_processed': 0,
            'errors': []
        }

    def process_premium_articles(self, articles: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Process premium articles.

        Args:
            articles: List of article dicts that passed Layer 2

        Returns:
            Processing results
        """
        if not articles:
            return {'processed': 0, 'stats': self.stats}

        print(f"\n{'='*70}")
        print(f"LAYER 3: PREMIUM PROCESSING")
        print(f"{'='*70}\n")
        print(f"Input articles: {len(articles)}")
        print(f"Top N to process: {self.top_n}")
        print(f"Provider: {self.provider_preference}")
        print()

        # Step 1: Score importance
        print(f"📊 Scoring article importance...")
        top_articles = self.scorer.rank_articles(articles, top_n=self.top_n)

        self.stats['total_scored'] = len(articles)
        self.stats['premium_selected'] = len(top_articles)

        print(f"✅ Selected {len(top_articles)} articles for premium processing")
        print()

        # Show top articles
        print(f"{'='*70}")
        print(f"TOP {min(5, len(top_articles))} ARTICLES BY IMPORTANCE")
        print(f"{'='*70}\n")

        for i, article in enumerate(top_articles[:5], 1):
            print(f"{i}. {article.get('title', '')[:60]}...")
            print(f"   Score: {article['importance_score']}")
            if article.get('breakdown'):
                factors = ', '.join(f"{k}:{v}" for k, v in list(article['breakdown'].items())[:3])
                print(f"   Key factors: {factors}")
            print()

        # Step 2: Refine with premium model
        if not self.client:
            print("❌ No premium client available")
            return {
                'processed': 0,
                'results': [],
                'stats': self.stats
            }

        print(f"{'='*70}")
        print(f"PREMIUM REFINEMENT")
        print(f"{'='*70}\n")

        results = []

        for i, article in enumerate(top_articles, 1):
            print(f"[{i}/{len(top_articles)}] Refining: {article.get('title', '')[:50]}...")

            try:
                # Get Layer 2 results if available
                layer2_results = {
                    'category': article.get('category'),
                    'state_codes': article.get('state_codes'),
                    'confidence': article.get('confidence', 95)
                }

                # Refine with premium model
                result = self.client.refine_article(article, layer2_results)

                # Add metadata
                result['article_id'] = article.get('id')
                result['importance_score'] = article['importance_score']
                result['premium_processed'] = True

                results.append(result)
                self.stats['premium_processed'] += 1

                print(f"  ✅ Refined (confidence: {result['confidence']}%)")

            except Exception as e:
                print(f"  ❌ Failed: {e}")
                self.stats['errors'].append({
                    'article_id': article.get('id'),
                    'error': str(e)
                })

                # Keep original Layer 2 results
                results.append({
                    'article_id': article.get('id'),
                    'is_relevant': article.get('is_ai_relevant', True),
                    'confidence': article.get('relevance_score', 90),
                    'category': article.get('category', 'Uncategorized'),
                    'state_codes': article.get('state_codes', []),
                    'summary': article.get('summary', ''),
                    'importance_score': article['importance_score'],
                    'premium_processed': False,
                    'error': str(e)
                })

        # Summary
        print(f"\n{'='*70}")
        print(f"LAYER 3 COMPLETE")
        print(f"{'='*70}\n")
        print(f"Articles scored: {self.stats['total_scored']}")
        print(f"Selected for premium: {self.stats['premium_selected']}")
        print(f"Successfully processed: {self.stats['premium_processed']}")
        if self.stats['errors']:
            print(f"Errors: {len(self.stats['errors'])}")
        print()

        return {
            'processed': len(results),
            'results': results,
            'stats': self.stats,
            'top_articles': top_articles  # Include all top articles (not just processed)
        }


def test_layer3_processor():
    """Test Layer 3 processor."""
    print("\n" + "="*70)
    print("LAYER 3 PROCESSOR TEST")
    print("="*70 + "\n")

    processor = Layer3Processor(provider='gemini', top_n=3)

    # Simulate articles that passed Layer 2
    test_articles = [
        {
            'id': 1,
            'title': 'Parliament introduces AI regulation bill',
            'content': 'The Indian Parliament introduced a comprehensive AI regulation bill...',
            'category': 'AI Policy & Regulation',
            'state_codes': ['IN'],
            'is_ai_relevant': True,
            'relevance_score': 98,
            'summary': 'Parliament introduces AI bill'
        },
        {
            'id': 2,
            'title': 'NITI Aayog releases AI framework',
            'content': 'NITI Aayog published guidelines for AI governance...',
            'category': 'AI Policy & Regulation',
            'state_codes': ['IN'],
            'is_ai_relevant': True,
            'relevance_score': 96,
            'summary': 'NITI releases framework'
        },
        {
            'id': 3,
            'title': 'Krutrim raises ₹100 crore',
            'content': 'Indian AI startup Krutrim raised ₹100 crore in funding...',
            'category': 'AI Start-Up News',
            'state_codes': ['KA'],
            'is_ai_relevant': True,
            'relevance_score': 90,
            'summary': 'Krutrim funding round'
        },
        {
            'id': 4,
            'title': 'Google AI team expansion',
            'content': 'Google expands AI team in Bangalore...',
            'category': 'AI Products & Applications',
            'state_codes': ['KA'],
            'is_ai_relevant': True,
            'relevance_score': 85,
            'summary': 'Google team grows'
        },
        {
            'id': 5,
            'title': 'IIT research on AI',
            'content': 'IIT Madras researchers develop AI algorithm...',
            'category': 'AI Research & Innovation',
            'state_codes': ['TN'],
            'is_ai_relevant': True,
            'relevance_score': 82,
            'summary': 'IIT research'
        }
    ]

    results = processor.process_premium_articles(test_articles)

    print("\n" + "="*70)
    print("SAMPLE REFINED RESULTS")
    print("="*70 + "\n")

    for i, result in enumerate(results['results'][:3], 1):
        print(f"{i}. Article ID {result['article_id']}")
        print(f"   Importance: {result['importance_score']}")
        print(f"   Category: {result['category']}")
        print(f"   Summary: {result['summary'][:80]}...")
        print()

    print("✅ Layer 3 processor test complete!")


if __name__ == "__main__":
    test_layer3_processor()
