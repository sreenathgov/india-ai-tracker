"""
AI Processor (Step 2 of 2): Process SCRAPED Articles in Batches

This script processes articles with state=SCRAPED through the AI pipeline.

Pipeline:
1. Load articles with state=SCRAPED
2. Process in batches of 3 (all AI tasks in single combined call)
3. Mark successful articles as PROCESSED
4. Retry failed articles individually (3 attempts with exponential backoff)
5. Mark permanently failed articles as FAILED

AI Tasks Combined in Single Batch Call:
- Relevance check
- Categorization
- Geographic attribution
- Summarization

Usage:
    python3 run_processor.py

Configuration:
    BATCH_SIZE = 3 articles per API call
    MAX_RETRIES = 3 attempts
    BACKOFF_DELAYS = [5s, 15s, 45s]
"""

from datetime import datetime
import time
import json
from app import app, db, Update


# Configuration
BATCH_SIZE = 3  # Process 3 articles per API call
MAX_RETRIES = 3  # Retry failed articles up to 3 times
BACKOFF_DELAYS = [5, 15, 45]  # Seconds to wait between retries


def process_batch_with_gemini(articles):
    """
    Process a batch of articles with Gemini API (all AI tasks combined).

    This sends a single prompt containing up to 3 articles, clearly delimited,
    and requests structured output for all AI tasks per article.

    Args:
        articles: List of Update objects (max 3)

    Returns:
        List of processing results, one per article:
        {
            'is_relevant': bool,
            'relevance_score': float,
            'category': str,
            'state_codes': list,
            'summary': str,
            'success': bool,
            'error': str (if failed)
        }
    """
    import os

    # Check which AI provider to use
    ai_provider = os.getenv('AI_PROVIDER', 'groq').lower()

    if ai_provider == 'gemini':
        # Use Gemini API (batch processing)
        from ai.gemini_api import GeminiProcessor

        processor = GeminiProcessor()

        # Convert Update objects to dicts for Gemini
        article_dicts = [
            {
                'title': article.title,
                'content': article.content or ''
            }
            for article in articles
        ]

        return processor.process_batch(article_dicts)

    else:
        # Fallback to Groq (sequential processing)
        from ai.filter import AIFilter
        from ai.categoriser import Categoriser
        from ai.geo_attributor import GeoAttributor
        from ai.summarizer import AISummarizer

        ai_filter = AIFilter()
        categoriser = Categoriser()
        geo_attributor = GeoAttributor()
        summarizer = AISummarizer()

        results = []

        for article in articles:
            try:
                # Step 1: Relevance check
                is_relevant, score = ai_filter.check_relevance(
                    article.title,
                    article.content or ''
                )

                if not is_relevant:
                    results.append({
                        'is_relevant': False,
                        'relevance_score': score,
                        'success': True
                    })
                    continue

                # Step 2: Categorization
                category, event_type = categoriser.categorise(
                    article.title,
                    article.content or '',
                    category_hint=None
                )

                # Step 3: Geographic attribution
                state_codes, geo_explanation = geo_attributor.attribute(
                    article.title,
                    article.content or '',
                    source_state=article.source_name
                )

                # Step 4: Summarization
                summary = summarizer.summarize(
                    article.title,
                    article.content or ''
                )

                results.append({
                    'is_relevant': True,
                    'relevance_score': score,
                    'category': category,
                    'state_codes': state_codes,
                    'summary': summary,
                    'success': True
                })

            except Exception as e:
                results.append({
                    'success': False,
                    'error': str(e)
                })

        return results


def process_article_with_retries(article):
    """
    Process a single article with retry logic (exponential backoff).

    Args:
        article: Update object

    Returns:
        tuple: (success: bool, result: dict or error_message: str)
    """
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            # Mark as PROCESSING
            article.processing_state = 'PROCESSING'
            article.processing_attempts = attempt
            article.last_processing_attempt = datetime.utcnow()
            db.session.commit()

            # Process batch of 1
            results = process_batch_with_gemini([article])
            result = results[0]

            if result.get('success'):
                return True, result
            else:
                raise Exception(result.get('error', 'Unknown error'))

        except Exception as e:
            error_msg = str(e)
            article.last_processing_error = error_msg
            db.session.commit()

            # If not last attempt, wait and retry
            if attempt < MAX_RETRIES:
                wait_time = BACKOFF_DELAYS[attempt - 1]
                print(f"    ⚠️  Attempt {attempt} failed: {error_msg}")
                print(f"    ⏳ Waiting {wait_time}s before retry...")
                time.sleep(wait_time)
            else:
                print(f"    ❌ All {MAX_RETRIES} attempts failed")
                return False, error_msg

    return False, "Max retries exceeded"


def process_scraped_articles():
    """
    Main function: Process all SCRAPED articles in batches.

    Returns:
        dict with processing statistics
    """
    print("=" * 70)
    print("INDIA AI TRACKER - AI PROCESSING (BATCH MODE)")
    print("=" * 70)
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    print(f"Configuration:")
    print(f"  Batch size:    {BATCH_SIZE} articles per API call")
    print(f"  Max retries:   {MAX_RETRIES} attempts")
    print(f"  Retry delays:  {BACKOFF_DELAYS} seconds")
    print()

    stats = {
        'total_scraped_articles': 0,
        'processed_successfully': 0,
        'not_relevant': 0,
        'failed_permanently': 0,
        'api_calls_made': 0,
        'api_calls_saved': 0  # Thanks to batching
    }

    with app.app_context():
        # Load all SCRAPED articles
        scraped_articles = Update.query.filter_by(
            processing_state='SCRAPED'
        ).all()

        stats['total_scraped_articles'] = len(scraped_articles)

        if not scraped_articles:
            print("✅ No SCRAPED articles found. Nothing to process.")
            return stats

        print(f"Found {len(scraped_articles)} articles with state=SCRAPED")
        print()

        # Process in batches
        print("-" * 70)
        print("PROCESSING IN BATCHES")
        print("-" * 70)

        for i in range(0, len(scraped_articles), BATCH_SIZE):
            batch = scraped_articles[i:i + BATCH_SIZE]
            batch_num = (i // BATCH_SIZE) + 1
            total_batches = (len(scraped_articles) + BATCH_SIZE - 1) // BATCH_SIZE

            print(f"\nBatch {batch_num}/{total_batches} ({len(batch)} articles)")

            try:
                # Mark batch as PROCESSING
                for article in batch:
                    article.processing_state = 'PROCESSING'
                    article.processing_attempts += 1
                    article.last_processing_attempt = datetime.utcnow()
                db.session.commit()

                # Process entire batch in single API call
                results = process_batch_with_gemini(batch)
                stats['api_calls_made'] += 1
                stats['api_calls_saved'] += (len(batch) - 1)  # Would have been N calls

                # Update each article based on result
                for article, result in zip(batch, results):
                    if not result.get('success'):
                        # Batch call failed for this article - retry individually
                        print(f"  ⚠️  Batch processing failed for: {article.title[:50]}...")
                        success, retry_result = process_article_with_retries(article)

                        if success:
                            result = retry_result
                        else:
                            # Mark as FAILED after retries
                            article.processing_state = 'FAILED'
                            article.last_processing_error = retry_result
                            stats['failed_permanently'] += 1
                            print(f"    ❌ FAILED: {article.title[:50]}...")
                            db.session.commit()
                            continue

                    # Check if article is relevant
                    if not result.get('is_relevant'):
                        # Not AI-relevant - delete from database
                        print(f"  ❌ Not relevant: {article.title[:50]}...")
                        db.session.delete(article)
                        stats['not_relevant'] += 1
                        continue

                    # Success - update article with AI results
                    article.processing_state = 'PROCESSED'
                    article.is_ai_relevant = True
                    article.relevance_score = result.get('relevance_score')
                    article.category = result.get('category')
                    article.state_codes = json.dumps(result.get('state_codes', []))
                    article.summary = result.get('summary')
                    article.last_processing_error = None

                    stats['processed_successfully'] += 1
                    print(f"  ✅ Processed: {article.title[:50]}...")

                db.session.commit()

            except Exception as e:
                print(f"  ❌ Batch failed entirely: {e}")

                # Retry each article individually
                for article in batch:
                    print(f"  🔄 Retrying individually: {article.title[:50]}...")
                    success, result = process_article_with_retries(article)

                    if success:
                        # Update with result
                        if not result.get('is_relevant'):
                            db.session.delete(article)
                            stats['not_relevant'] += 1
                        else:
                            article.processing_state = 'PROCESSED'
                            article.is_ai_relevant = True
                            article.relevance_score = result.get('relevance_score')
                            article.category = result.get('category')
                            article.state_codes = json.dumps(result.get('state_codes', []))
                            article.summary = result.get('summary')
                            stats['processed_successfully'] += 1
                    else:
                        # Mark as FAILED
                        article.processing_state = 'FAILED'
                        article.last_processing_error = result
                        stats['failed_permanently'] += 1

                    db.session.commit()

    # Summary
    print()
    print("=" * 70)
    print("PROCESSING COMPLETED")
    print("=" * 70)
    print(f"Articles processed:    {stats['total_scraped_articles']}")
    print(f"✅ Successfully processed: {stats['processed_successfully']}")
    print(f"❌ Not AI-relevant:        {stats['not_relevant']}")
    print(f"❌ Failed permanently:     {stats['failed_permanently']}")
    print()
    print(f"API Efficiency:")
    print(f"  API calls made:  {stats['api_calls_made']}")
    print(f"  Calls saved:     {stats['api_calls_saved']} (thanks to batching)")
    reduction = (stats['api_calls_saved'] / (stats['api_calls_made'] + stats['api_calls_saved']) * 100) if (stats['api_calls_made'] + stats['api_calls_saved']) > 0 else 0
    print(f"  Reduction:       {reduction:.1f}%")
    print("=" * 70)

    return stats


if __name__ == '__main__':
    """Run processor when executed directly"""
    try:
        stats = process_scraped_articles()
        exit(0)
    except Exception as e:
        print(f"❌ Processor failed: {e}")
        import traceback
        traceback.print_exc()
        exit(1)
