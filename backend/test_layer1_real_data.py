"""
Test Layer 1 Rule Filter with Real Articles from Database
"""

from app import app, db, Update
from ai.rule_filter import RuleBasedFilter
import json
from datetime import datetime


def test_layer1_with_real_data():
    """Test rule filter with existing articles in database."""

    print("\n" + "="*70)
    print("LAYER 1 RULE FILTER - REAL DATA TEST")
    print("="*70 + "\n")

    # Initialize filter
    filter = RuleBasedFilter()

    with app.app_context():
        # Get all PROCESSED articles (existing articles)
        articles = Update.query.filter_by(processing_state='PROCESSED').all()

        print(f"Found {len(articles)} existing articles in database\n")

        if len(articles) == 0:
            print("⚠️  No articles found. Run scraper first.")
            return

        # Convert to dict format for filter
        article_dicts = []
        for article in articles[:100]:  # Test with first 100 for speed
            article_dicts.append({
                'title': article.title,
                'content': article.content or '',
                'url': article.url,
                'id': article.id
            })

        print(f"Testing with {len(article_dicts)} articles...\n")

        # Filter articles
        passed, rejected, borderline = filter.filter_batch(article_dicts)

        # Get stats
        stats = filter.get_stats(article_dicts)

        # Print results
        print("="*70)
        print("RESULTS")
        print("="*70)
        print(f"Total tested:    {stats['total']}")
        print(f"Passed:          {stats['passed']} ({stats['pass_rate']*100:.1f}%)")
        print(f"Rejected:        {stats['rejected']}")
        print(f"Borderline:      {stats['borderline']}")
        print()

        print("Confidence Distribution:")
        print(f"  High:       {stats['confidence_distribution']['high']}")
        print(f"  Medium:     {stats['confidence_distribution']['medium']}")
        print(f"  Borderline: {stats['confidence_distribution']['borderline']}")
        print(f"  Low:        {stats['confidence_distribution']['low']}")
        print()

        # Show sample passed articles
        print("="*70)
        print("SAMPLE PASSED ARTICLES (Top 5)")
        print("="*70)
        for i, article in enumerate(passed[:5], 1):
            print(f"{i}. {article['article_title'][:60]}...")
            print(f"   Score: {article['total_score']} (AI: {article['ai_score']}, India: {article['india_score']})")
            print(f"   Confidence: {article['confidence']}")
            print(f"   AI keywords: {', '.join(article['ai_matches'][:3])}")
            if article['india_matches']:
                print(f"   India markers: {', '.join([m['name'] for m in article['india_matches'][:2]])}")
            print()

        # Show sample rejected articles
        if rejected:
            print("="*70)
            print("SAMPLE REJECTED ARTICLES (Top 5)")
            print("="*70)
            for i, article in enumerate(rejected[:5], 1):
                print(f"{i}. {article['article_title'][:60]}...")
                print(f"   Score: {article['total_score']} (AI: {article['ai_score']}, India: {article['india_score']})")
                print(f"   Confidence: {article['confidence']}")
                print()

        # Show borderline articles
        if borderline:
            print("="*70)
            print("BORDERLINE ARTICLES (Need Review)")
            print("="*70)
            for i, article in enumerate(borderline[:5], 1):
                print(f"{i}. {article['article_title'][:60]}...")
                print(f"   Score: {article['total_score']} (AI: {article['ai_score']}, India: {article['india_score']})")
                print()

        # Save detailed report
        report_path = f"reports/layer1_test_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        report = {
            'timestamp': datetime.now().isoformat(),
            'total_tested': stats['total'],
            'stats': stats,
            'passed_sample': [
                {
                    'title': a['article_title'],
                    'score': a['total_score'],
                    'confidence': a['confidence']
                } for a in passed[:10]
            ],
            'rejected_sample': [
                {
                    'title': a['article_title'],
                    'score': a['total_score'],
                    'confidence': a['confidence']
                } for a in rejected[:10]
            ],
            'borderline_all': [
                {
                    'title': a['article_title'],
                    'score': a['total_score'],
                    'url': a['article_url']
                } for a in borderline
            ]
        }

        # Create reports directory if needed
        import os
        os.makedirs('reports', exist_ok=True)

        with open(report_path, 'w') as f:
            json.dump(report, f, indent=2)

        print(f"\n✅ Detailed report saved to: {report_path}\n")

        # Estimate for full dataset
        if len(articles) > 100:
            print("="*70)
            print("ESTIMATION FOR FULL DATASET")
            print("="*70)
            print(f"Total articles in database: {len(articles)}")
            print(f"Estimated pass rate: {stats['pass_rate']*100:.1f}%")
            print(f"Estimated articles that would pass: {int(len(articles) * stats['pass_rate'])}")
            print()


if __name__ == "__main__":
    test_layer1_with_real_data()
