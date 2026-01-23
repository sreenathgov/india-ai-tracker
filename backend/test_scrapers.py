"""
Scraper Diagnostic Tool

Tests each configured scraper to see which ones are actually working.
Run this to verify your sources are accessible.

Usage:
  cd backend
  python3 test_scrapers.py
"""

import os
import sys
import json
from datetime import datetime

# Ensure imports work
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from scrapers.rss_scraper import RSScraper
from scrapers.web_scraper import WebScraper


def test_all_scrapers():
    """Test each scraper and report status."""
    print("=" * 70)
    print("SCRAPER DIAGNOSTIC TOOL")
    print("=" * 70)
    print(f"Testing at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()

    # Load sources
    sources_file = os.path.join(os.path.dirname(__file__), 'sources.json')
    with open(sources_file, 'r') as f:
        data = json.load(f)

    # Initialize scrapers
    rss_scraper = RSScraper()
    web_scraper = WebScraper()

    results = []

    # Collect all sources
    all_sources = []
    for key, value in data.items():
        if key.startswith('_'):
            continue
        if isinstance(value, list):
            for source in value:
                if source.get('enabled', True):
                    all_sources.append(source)

    print(f"Found {len(all_sources)} enabled sources to test\n")
    print("-" * 70)

    for i, source in enumerate(all_sources, 1):
        name = source.get('name', 'Unknown')
        url = source.get('url', '')
        source_type = source.get('type', '')
        scraper_type = source.get('scraper', '')

        print(f"\n[{i}/{len(all_sources)}] Testing: {name}")
        print(f"    URL: {url}")
        print(f"    Type: {source_type}" + (f" ({scraper_type})" if scraper_type else ""))

        try:
            if source_type == 'rss':
                articles = rss_scraper.scrape(url)
            elif source_type == 'web':
                articles = web_scraper.scrape(url, scraper_type)
            else:
                print(f"    Status: SKIPPED (unknown type)")
                results.append({'name': name, 'status': 'SKIPPED', 'count': 0, 'error': 'Unknown type'})
                continue

            if articles and len(articles) > 0:
                print(f"    Status: ✅ WORKING ({len(articles)} articles found)")
                # Show first article as sample
                sample = articles[0]
                print(f"    Sample: \"{sample.get('title', 'No title')[:60]}...\"")
                results.append({'name': name, 'status': 'WORKING', 'count': len(articles)})
            else:
                print(f"    Status: ⚠️  NO ARTICLES (site may have changed structure)")
                results.append({'name': name, 'status': 'NO_ARTICLES', 'count': 0})

        except Exception as e:
            print(f"    Status: ❌ ERROR - {str(e)[:60]}")
            results.append({'name': name, 'status': 'ERROR', 'count': 0, 'error': str(e)})

    # Summary
    print("\n")
    print("=" * 70)
    print("SUMMARY")
    print("=" * 70)

    working = [r for r in results if r['status'] == 'WORKING']
    no_articles = [r for r in results if r['status'] == 'NO_ARTICLES']
    errors = [r for r in results if r['status'] == 'ERROR']
    skipped = [r for r in results if r['status'] == 'SKIPPED']

    print(f"\n✅ Working:     {len(working)}")
    for r in working:
        print(f"   - {r['name']} ({r['count']} articles)")

    if no_articles:
        print(f"\n⚠️  No Articles: {len(no_articles)}")
        for r in no_articles:
            print(f"   - {r['name']}")

    if errors:
        print(f"\n❌ Errors:      {len(errors)}")
        for r in errors:
            print(f"   - {r['name']}: {r.get('error', 'Unknown')[:50]}")

    if skipped:
        print(f"\n⏭️  Skipped:    {len(skipped)}")

    total_articles = sum(r['count'] for r in results)
    print(f"\nTotal articles found: {total_articles}")
    print("=" * 70)


if __name__ == '__main__':
    test_all_scrapers()
