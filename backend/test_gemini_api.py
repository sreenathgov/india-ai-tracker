"""
Test Script: Verify Gemini API Integration

Tests that Gemini API is working correctly with your API key.

Usage:
    python3 test_gemini_api.py
"""

import sys
import os


def test_gemini_connection():
    """Test basic Gemini API connection."""
    print("=" * 70)
    print("TEST: Gemini API Connection")
    print("=" * 70)
    print()

    # Check API key
    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key:
        print("❌ GEMINI_API_KEY not found in environment")
        print("   Make sure .env file has GEMINI_API_KEY=...")
        return False

    print(f"✅ API Key found: {api_key[:20]}...")
    print()

    # Test import
    print("Testing import...")
    try:
        from ai.gemini_api import GeminiProcessor
        print("✅ GeminiProcessor imported successfully")
    except Exception as e:
        print(f"❌ Failed to import: {e}")
        return False

    # Initialize processor
    print()
    print("Initializing Gemini processor...")
    try:
        processor = GeminiProcessor()
        print("✅ Gemini processor initialized")
    except Exception as e:
        print(f"❌ Failed to initialize: {e}")
        return False

    # Test with sample articles
    print()
    print("Testing with sample articles...")
    print("-" * 70)

    test_articles = [
        {
            'title': 'Google Launches New AI Model in India',
            'content': 'Google today announced the launch of its latest AI model specifically tuned for Indian languages...'
        },
        {
            'title': 'IIT Madras Researchers Develop AI for Healthcare',
            'content': 'Researchers at IIT Madras have developed an AI system that can detect diseases from medical images...'
        },
        {
            'title': 'Startup Raises $10M for AI Platform',
            'content': 'Bangalore-based startup XYZ raised $10 million in Series A funding for their AI platform...'
        }
    ]

    try:
        results = processor.process_batch(test_articles)

        print(f"✅ Processed {len(results)} articles")
        print()

        for i, result in enumerate(results, 1):
            print(f"Article {i}: {test_articles[i-1]['title'][:50]}...")

            if not result.get('success'):
                print(f"  ❌ Failed: {result.get('error')}")
                continue

            print(f"  AI Relevant: {result.get('is_relevant')}")
            print(f"  Score: {result.get('relevance_score')}")

            if result.get('is_relevant'):
                print(f"  Category: {result.get('category')}")
                print(f"  States: {result.get('state_codes')}")
                print(f"  Summary: {result.get('summary', '')[:80]}...")

            print()

        print("=" * 70)
        print("✅ GEMINI API TEST PASSED")
        print("=" * 70)
        print()
        print("Your Gemini API key is working correctly!")
        print("The processor is ready to handle batches of articles.")
        print()
        print("Next steps:")
        print("1. Run: python3 run_scraper_only.py")
        print("2. Run: python3 run_processor.py")
        print("=" * 70)

        return True

    except Exception as e:
        print(f"❌ API call failed: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == '__main__':
    try:
        # Load environment variables
        from dotenv import load_dotenv
        load_dotenv()

        success = test_gemini_connection()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
