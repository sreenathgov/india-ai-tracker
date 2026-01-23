"""
RSS Feed Scraper
Scrapes from RSS feeds (easiest and most reliable)
"""

import feedparser
from datetime import datetime
from scrapers.base_scraper import BaseScraper


class RSScraper(BaseScraper):
    """Scrape RSS feeds"""
    
    def scrape(self, source_url):
        """
        Scrape articles from RSS feed
        Returns: List of articles
        """
        try:
            feed = feedparser.parse(source_url)
            articles = []
            
            for entry in feed.entries[:20]:  # Limit to 20 most recent
                article = {
                    'title': entry.get('title', ''),
                    'url': entry.get('link', ''),
                    'content': entry.get('summary', ''),
                    'date_published': self._parse_date(entry.get('published', '')),
                    'source_url': source_url
                }
                
                if article['title'] and article['url']:
                    articles.append(article)
            
            print(f"✅ Scraped {len(articles)} articles from RSS feed")
            return articles
            
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
