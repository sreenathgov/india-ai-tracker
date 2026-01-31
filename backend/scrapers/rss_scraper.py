"""
RSS Feed Scraper
Scrapes from RSS feeds (easiest and most reliable)

TIME WINDOW ENFORCEMENT:
- Only scrapes articles from last 24 hours (configurable via env var)
- Prevents old articles from RSS feeds (which often contain 7-14 days of content)
- Configurable window: SCRAPE_TIME_WINDOW_HOURS (default: 24)
"""

import feedparser
import requests
import os
from datetime import datetime, timedelta
from scrapers.base_scraper import BaseScraper


class RSScraper(BaseScraper):
    """Scrape RSS feeds"""

    def scrape(self, source_url):
        """
        Scrape articles from RSS feed with timeout
        Returns: List of articles
        """
        try:
            # Fetch feed content with requests (has proper timeout support)
            response = requests.get(
                source_url,
                timeout=15,  # 15 second timeout
                headers={'User-Agent': 'Mozilla/5.0 (compatible; India-AI-Tracker/1.0)'}
            )
            response.raise_for_status()

            # Parse the fetched content
            feed = feedparser.parse(response.content)
            articles = []

            # Check if feed was parsed successfully
            if hasattr(feed, 'bozo_exception') and feed.bozo:
                print(f"⚠️  Feed warning: {feed.bozo_exception}")
                # Continue anyway - feed might still be usable

            # TIME WINDOW ENFORCEMENT: Only scrape articles from last N hours
            # Configurable via environment variable (default: 24 hours)
            time_window_hours = int(os.getenv('SCRAPE_TIME_WINDOW_HOURS', '24'))
            cutoff_time = datetime.now() - timedelta(hours=time_window_hours)
            cutoff_date = cutoff_time.date()

            skipped_old = 0

            for entry in feed.entries[:20]:  # Limit to 20 most recent
                article = {
                    'title': entry.get('title', ''),
                    'url': entry.get('link', ''),
                    'content': entry.get('summary', ''),
                    'date_published': self._parse_date(entry.get('published', '')),
                    'source_url': source_url
                }

                # Enforce time window: skip articles older than cutoff
                if article['date_published'] and article['date_published'] < cutoff_date:
                    skipped_old += 1
                    continue

                if article['title'] and article['url']:
                    articles.append(article)

            print(f"✅ Scraped {len(articles)} articles from RSS feed "
                  f"(skipped {skipped_old} older than {time_window_hours}h)")
            return articles

        except requests.Timeout:
            print(f"❌ Timeout scraping RSS feed (>15s)")
            return []
        except requests.RequestException as e:
            print(f"❌ Request error: {e}")
            return []
        except Exception as e:
            print(f"❌ Error scraping RSS feed: {e}")
            return []

    def _parse_date(self, date_string):
        """Parse various date formats"""
        if not date_string:
            return datetime.now().date()

        try:
            # Try parsing common RSS date formats
            from email.utils import parsedate_to_datetime
            return parsedate_to_datetime(date_string).date()
        except:
            return datetime.now().date()
