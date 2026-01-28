"""
Integrated 3-Layer Processing Pipeline

Combines Layer 1 (rule-based), Layer 2 (batch AI), and Layer 3 (premium)
into a single workflow.

Flow:
1. Layer 1: Rule-based filter (fast, 0 cost) - reduces ~60%
2. Layer 2: Groq batch processing (10 articles/call) - processes survivors
3. Layer 3: Top 30-50 articles get Gemini premium polish
4. Update database with all results

Usage:
    PYTHONPATH=. venv/bin/python3 ai/integrated_pipeline.py
"""

import os
import sys
import json
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any

# Add parent to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app import app, db, Update
from ai.rule_filter import RuleBasedFilter
from ai.layer2_processor import Layer2Processor
from ai.layer3_processor import Layer3Processor


class IntegratedPipeline:
    """
    3-layer hybrid processing pipeline.

    Orchestrates all processing layers and database updates.
    """

    def __init__(self,
                 layer2_provider: str = 'auto',
                 layer3_top_n: int = 50,
                 batch_size: int = 10):
        """
        Initialize integrated pipeline.

        Args:
            layer2_provider: 'groq', 'ollama', or 'auto' (default)
            layer3_top_n: Number of top articles for premium processing
            batch_size: Batch size for Layer 2
        """
        # Initialize layers
        self.layer1 = RuleBasedFilter()
        self.layer2 = Layer2Processor(
            provider=layer2_provider,
            batch_size=batch_size
        )
        self.layer3 = Layer3Processor(provider='gemini', top_n=layer3_top_n)

        # Stats
        self.stats = {
            'started_at': datetime.now().isoformat(),
            'layer1': {'total': 0, 'passed': 0, 'rejected': 0, 'borderline': 0},
            'layer2': {'total': 0, 'relevant': 0, 'irrelevant': 0, 'provider_used': {}},
            'layer3': {'total_scored': 0, 'premium_selected': 0, 'premium_processed': 0},
            'database': {'updated': 0, 'errors': 0},
            'finished_at': None,
            'total_duration_seconds': 0
        }

    def fetch_unprocessed_articles(self, limit: int = None) -> List[Dict[str, Any]]:
        """
        Fetch articles from database that need processing.

        Args:
            limit: Maximum number of articles to process (None for all)

        Returns:
            List of article dicts
        """
        with app.app_context():
            # Prioritize articles with substantial content
            from sqlalchemy import func, case

            query = Update.query.filter(
                Update.processing_state == 'SCRAPED',
                (Update.is_deleted == False) | (Update.is_deleted == None)
            ).order_by(
                # Prioritize articles with content > 200 chars
                case(
                    (func.length(Update.content) > 200, 0),
                    else_=1
                ),
                Update.date_scraped.desc()
            )

            if limit:
                query = query.limit(limit)

            updates = query.all()

            articles = []
            for update in updates:
                articles.append({
                    'id': update.id,
                    'title': update.title,
                    'content': update.content or '',
                    'url': update.url,
                    'source_name': update.source_name,
                    'date_published': update.date_published
                })

            return articles

    def update_database(self, results: List[Dict[str, Any]]):
        """
        Update database with processing results.

        Args:
            results: List of result dicts from processing
        """
        with app.app_context():
            for result in results:
                try:
                    article_id = result.get('article_id')
                    if not article_id:
                        continue

                    update = Update.query.get(article_id)
                    if not update:
                        continue

                    # Update fields
                    update.is_ai_relevant = result.get('is_relevant', False)
                    update.relevance_score = result.get('confidence', 0)
                    update.category = result.get('category', 'Uncategorized')
                    update.state_codes = json.dumps(result.get('state_codes', []))
                    update.summary = result.get('summary', '')
                    update.importance_score = result.get('importance_score', 0)
                    update.premium_processed = result.get('premium_processed', False)
                    update.processing_state = 'PROCESSED'
                    update.last_processing_attempt = datetime.utcnow()

                    # AUTO-APPROVE AI-relevant articles (like the old system)
                    # Only AI-relevant articles appear in admin/public site
                    update.is_approved = result.get('is_relevant', False)

                    db.session.commit()
                    self.stats['database']['updated'] += 1

                except Exception as e:
                    print(f"❌ Failed to update article {article_id}: {e}")
                    self.stats['database']['errors'] += 1
                    db.session.rollback()

    def run(self, limit: int = None, save_report: bool = True) -> Dict[str, Any]:
        """
        Run the complete 3-layer pipeline.

        Args:
            limit: Maximum articles to process (None for all)
            save_report: Save JSON report to file

        Returns:
            Final statistics
        """
        print("\n" + "="*70)
        print("INTEGRATED 3-LAYER PROCESSING PIPELINE")
        print("="*70 + "\n")

        # Fetch articles
        print("📥 Fetching unprocessed articles from database...")
        articles = self.fetch_unprocessed_articles(limit=limit)

        if not articles:
            print("✅ No articles to process!")
            return self.stats

        print(f"✅ Found {len(articles)} articles to process\n")
        self.stats['layer1']['total'] = len(articles)

        # LAYER 1: Rule-based filtering
        print("="*70)
        print("LAYER 1: RULE-BASED FILTERING")
        print("="*70 + "\n")

        layer1_results = []
        for article in articles:
            result = self.layer1.filter_article(article)
            layer1_results.append({
                'article': article,
                'filter_result': result,
                'passed': result['confidence'] in ['high', 'medium']
            })

        passed = [r for r in layer1_results if r['passed']]
        rejected = [r for r in layer1_results if not r['passed']]

        self.stats['layer1']['passed'] = len(passed)
        self.stats['layer1']['rejected'] = len(rejected)

        print(f"✅ Layer 1 Complete:")
        print(f"   Passed: {len(passed)} ({len(passed)/len(articles)*100:.1f}%)")
        print(f"   Rejected: {len(rejected)} ({len(rejected)/len(articles)*100:.1f}%)")
        print()

        if not passed:
            print("⚠️  No articles passed Layer 1 filter!")
            self.stats['finished_at'] = datetime.now().isoformat()
            return self.stats

        # LAYER 2: Batch AI processing
        print("="*70)
        print("LAYER 2: BATCH AI PROCESSING")
        print("="*70 + "\n")

        layer2_articles = [r['article'] for r in passed]

        # Add Layer 1 results for context
        for i, article in enumerate(layer2_articles):
            article['layer1_results'] = passed[i]['filter_result']

        layer2_results = self.layer2.process_articles(
            layer2_articles,
            job_id=f"pipeline_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        )

        self.stats['layer2']['total'] = len(layer2_articles)
        self.stats['layer2']['relevant'] = len([r for r in layer2_results['results'] if r.get('is_relevant', False)])
        self.stats['layer2']['irrelevant'] = len([r for r in layer2_results['results'] if not r.get('is_relevant', False)])
        self.stats['layer2']['provider_used'] = layer2_results.get('stats', {})

        print(f"\n✅ Layer 2 Complete:")
        print(f"   Relevant: {self.stats['layer2']['relevant']}")
        print(f"   Irrelevant: {self.stats['layer2']['irrelevant']}")
        print()

        # LAYER 3: Premium processing
        print("="*70)
        print("LAYER 3: PREMIUM PROCESSING")
        print("="*70 + "\n")

        # Prepare articles with Layer 2 results
        relevant_articles = []
        for article, result in zip(layer2_articles, layer2_results['results']):
            if result.get('is_relevant', False):
                # Merge article with Layer 2 results
                merged = {**article, **result}
                relevant_articles.append(merged)

        if not relevant_articles:
            print("⚠️  No relevant articles for Layer 3!")
        else:
            layer3_results = self.layer3.process_premium_articles(relevant_articles)

            self.stats['layer3']['total_scored'] = layer3_results['stats']['total_scored']
            self.stats['layer3']['premium_selected'] = layer3_results['stats']['premium_selected']
            self.stats['layer3']['premium_processed'] = layer3_results['stats']['premium_processed']

        # DATABASE UPDATE
        print("="*70)
        print("DATABASE UPDATE")
        print("="*70 + "\n")

        print("💾 Updating database with results...")

        # Combine all results
        all_results = []

        # Add Layer 2 results
        for article, result in zip(layer2_articles, layer2_results['results']):
            all_results.append({
                'article_id': article['id'],
                **result,
                'importance_score': 0,
                'premium_processed': False
            })

        # Override with Layer 3 results for premium articles
        if 'layer3_results' in locals():
            for result in layer3_results['results']:
                # Find and update the corresponding result
                for i, r in enumerate(all_results):
                    if r['article_id'] == result['article_id']:
                        all_results[i] = {
                            'article_id': result['article_id'],
                            **result
                        }
                        break

        # Update rejected articles
        for r in rejected:
            all_results.append({
                'article_id': r['article']['id'],
                'is_relevant': False,
                'confidence': 0,
                'category': 'Rejected',
                'state_codes': [],
                'summary': '',
                'importance_score': 0,
                'premium_processed': False
            })

        # Update database
        self.update_database(all_results)

        print(f"✅ Updated {self.stats['database']['updated']} articles")
        if self.stats['database']['errors'] > 0:
            print(f"❌ {self.stats['database']['errors']} errors")
        print()

        # FINAL SUMMARY
        self.stats['finished_at'] = datetime.now().isoformat()
        started = datetime.fromisoformat(self.stats['started_at'])
        finished = datetime.fromisoformat(self.stats['finished_at'])
        self.stats['total_duration_seconds'] = (finished - started).total_seconds()

        print("="*70)
        print("PIPELINE COMPLETE")
        print("="*70 + "\n")

        print(f"Total articles processed: {len(articles)}")
        print(f"Layer 1 passed: {self.stats['layer1']['passed']}")
        print(f"Layer 2 relevant: {self.stats['layer2']['relevant']}")
        print(f"Layer 3 premium: {self.stats['layer3']['premium_processed']}")
        print(f"Database updated: {self.stats['database']['updated']}")
        print(f"Total duration: {self.stats['total_duration_seconds']:.1f}s")
        print()

        # Save report
        if save_report:
            report_path = Path(__file__).parent.parent / 'reports' / f"pipeline_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            report_path.parent.mkdir(exist_ok=True)

            with open(report_path, 'w') as f:
                json.dump(self.stats, f, indent=2)

            print(f"📄 Report saved: {report_path}")
            print()

        return self.stats


def main():
    """Run pipeline with command-line arguments."""
    import argparse

    parser = argparse.ArgumentParser(description='Run 3-layer processing pipeline')
    parser.add_argument('--limit', type=int, help='Limit number of articles to process')
    parser.add_argument('--layer2-provider', default='auto', choices=['groq', 'ollama', 'auto'],
                        help='Layer 2 provider (default: auto)')
    parser.add_argument('--layer3-top-n', type=int, default=50,
                        help='Number of top articles for Layer 3 (default: 50)')
    parser.add_argument('--no-report', action='store_true',
                        help='Skip saving JSON report')

    args = parser.parse_args()

    # Run pipeline
    pipeline = IntegratedPipeline(
        layer2_provider=args.layer2_provider,
        layer3_top_n=args.layer3_top_n
    )

    stats = pipeline.run(
        limit=args.limit,
        save_report=not args.no_report
    )

    # Exit with success
    sys.exit(0)


if __name__ == "__main__":
    main()
