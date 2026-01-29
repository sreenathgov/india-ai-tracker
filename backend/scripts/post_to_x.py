#!/usr/bin/env python3
"""
Post to X (Twitter) Script

Selects and posts articles from the India AI Tracker to X.

Usage:
    python scripts/post_to_x.py                    # Dry run - shows all articles that would be posted
    python scripts/post_to_x.py --live             # Actually post ALL articles to X (5 min intervals)
    python scripts/post_to_x.py --max-posts 10     # Limit to 10 posts (0 = unlimited, default)
    python scripts/post_to_x.py --verify           # Just verify credentials
    python scripts/post_to_x.py --stats            # Show posting statistics

Environment variables required for live posting:
    X_API_KEY          - Your X API key (Consumer Key)
    X_API_SECRET       - Your X API secret (Consumer Secret)
    X_ACCESS_TOKEN     - Your X access token
    X_ACCESS_TOKEN_SECRET - Your X access token secret
"""

import os
import sys
import argparse
import logging
import time
from datetime import datetime
from pathlib import Path

# Add backend to path for imports
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from dotenv import load_dotenv
load_dotenv(backend_dir / '.env')

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)


def setup_app_context():
    """Setup Flask app context for database access."""
    from app import app, db, Update
    return app, db, Update


def verify_credentials():
    """Verify X API credentials are valid."""
    from social.x_client import create_x_client

    client = create_x_client()

    if not client.is_configured():
        logger.error("X API credentials not configured!")
        logger.error("Please set these environment variables:")
        logger.error("  X_API_KEY")
        logger.error("  X_API_SECRET")
        logger.error("  X_ACCESS_TOKEN")
        logger.error("  X_ACCESS_TOKEN_SECRET")
        return False

    logger.info("Verifying X API credentials...")
    result = client.verify_credentials()

    if result['valid']:
        logger.info(f"Credentials valid! Connected as @{result['username']}")
        return True
    else:
        logger.error(f"Credential verification failed: {result['error']}")
        return False


def show_stats(db, Update):
    """Show posting statistics."""
    from social.post_selector import create_selector

    selector = create_selector()
    stats = selector.get_posting_stats(db.session, Update, days=30)

    print("\n" + "=" * 50)
    print("X POSTING STATISTICS (Last 30 days)")
    print("=" * 50)
    print(f"Total posted:        {stats['total_posted']}")
    print(f"Daily average:       {stats['daily_average']}")
    print(f"Available to post:   {stats['available_to_post']}")
    print("\nBy category:")
    for cat, count in stats['by_category'].items():
        print(f"  {cat}: {count}")
    print("=" * 50 + "\n")


def post_to_x(
    max_posts: int = 0,
    dry_run: bool = True,
    lookback_days: int = 7,
    delay_between_posts: int = 300
):
    """
    Select and post articles to X.

    Args:
        max_posts: Maximum number of posts (0 = unlimited, post all)
        dry_run: If True, don't actually post
        lookback_days: How many days back to look for articles
        delay_between_posts: Seconds to wait between posts (default 300 = 5 minutes)
    """
    from social.x_client import create_x_client
    from social.post_selector import create_selector
    from social.post_formatter import create_formatter

    app, db, Update = setup_app_context()

    with app.app_context():
        # Initialize components
        client = create_x_client()
        selector = create_selector(max_posts_per_day=max_posts)
        formatter = create_formatter()

        # Check credentials (unless dry run)
        if not dry_run:
            if not client.is_configured():
                logger.error("Cannot post: X API credentials not configured")
                return {'success': False, 'error': 'Credentials not configured'}

        # Select articles
        limit_msg = "all" if max_posts == 0 else f"up to {max_posts}"
        logger.info(f"Selecting {limit_msg} articles from last {lookback_days} days...")
        articles = selector.select_from_db(
            db.session,
            Update,
            lookback_days=lookback_days
        )

        if not articles:
            logger.info("No articles available for posting")
            return {'success': True, 'posted': 0, 'message': 'No articles to post'}

        logger.info(f"Selected {len(articles)} articles for posting")

        # Format and post
        results = {
            'success': True,
            'posted': 0,
            'failed': 0,
            'dry_run': dry_run,
            'posts': []
        }

        mode_label = "[DRY RUN] " if dry_run else ""

        for i, article in enumerate(articles, 1):
            # Format the tweet
            formatted = formatter.format_article(article)

            logger.info(f"\n{mode_label}Post {i}/{len(articles)}:")
            logger.info(f"  Article: {article.get('title', '')[:60]}...")
            logger.info(f"  Tweet ({formatted['char_count']} chars): {formatted['text'][:100]}...")

            # Post to X
            post_result = client.post_tweet(formatted['text'], dry_run=dry_run)

            post_record = {
                'article_id': article['id'],
                'article_title': article.get('title', ''),
                'tweet_text': formatted['text'],
                'success': post_result['success'],
                'tweet_id': post_result.get('tweet_id'),
                'error': post_result.get('error')
            }
            results['posts'].append(post_record)

            if post_result['success']:
                results['posted'] += 1

                # Update database (unless dry run)
                if not dry_run:
                    try:
                        update_record = Update.query.get(article['id'])
                        if update_record:
                            update_record.posted_to_x_at = datetime.utcnow()
                            db.session.commit()
                            logger.info(f"  Marked article {article['id']} as posted")
                    except Exception as e:
                        logger.error(f"  Failed to update database: {e}")

            else:
                results['failed'] += 1
                logger.error(f"  Failed: {post_result.get('error')}")

                # Check for rate limiting
                if post_result.get('rate_limited'):
                    logger.warning("Rate limited! Stopping posting.")
                    break

            # Delay between posts (5 minutes by default)
            if not dry_run and i < len(articles):
                minutes = delay_between_posts // 60
                seconds = delay_between_posts % 60
                if minutes > 0:
                    logger.info(f"  Waiting {minutes}m {seconds}s before next post...")
                else:
                    logger.info(f"  Waiting {seconds}s before next post...")
                time.sleep(delay_between_posts)

        # Summary
        print("\n" + "=" * 50)
        print(f"{mode_label}POSTING SUMMARY")
        print("=" * 50)
        print(f"Total selected:  {len(articles)}")
        print(f"Posted:          {results['posted']}")
        print(f"Failed:          {results['failed']}")
        print("=" * 50 + "\n")

        return results


def main():
    parser = argparse.ArgumentParser(
        description='Post articles to X (Twitter)',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__
    )

    parser.add_argument(
        '--live',
        action='store_true',
        help='Actually post to X (default is dry-run mode)'
    )
    parser.add_argument(
        '--max-posts',
        type=int,
        default=0,
        help='Maximum number of posts (0 = unlimited, default: 0)'
    )
    parser.add_argument(
        '--lookback-days',
        type=int,
        default=7,
        help='Days to look back for articles (default: 7)'
    )
    parser.add_argument(
        '--delay',
        type=int,
        default=300,
        help='Seconds between posts (default: 300 = 5 minutes)'
    )
    parser.add_argument(
        '--verify',
        action='store_true',
        help='Only verify credentials, don\'t post'
    )
    parser.add_argument(
        '--stats',
        action='store_true',
        help='Show posting statistics'
    )

    args = parser.parse_args()

    # Handle verify-only mode
    if args.verify:
        success = verify_credentials()
        sys.exit(0 if success else 1)

    # Handle stats mode
    if args.stats:
        app, db, Update = setup_app_context()
        with app.app_context():
            show_stats(db, Update)
        sys.exit(0)

    # Main posting flow
    dry_run = not args.live

    if dry_run:
        logger.info("=" * 50)
        logger.info("DRY RUN MODE - No actual posts will be made")
        logger.info("Use --live to actually post to X")
        logger.info("=" * 50)

    results = post_to_x(
        max_posts=args.max_posts,
        dry_run=dry_run,
        lookback_days=args.lookback_days,
        delay_between_posts=args.delay
    )

    # Exit with appropriate code
    if results['success']:
        sys.exit(0)
    else:
        sys.exit(1)


if __name__ == '__main__':
    main()
