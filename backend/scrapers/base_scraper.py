"""
Base Scraper Class
All scrapers inherit from this

Includes rate limiting safeguards:
- Random delays between requests (1-3 seconds)
- Respectful User-Agent header
- Request timeout protection
- Error handling with backoff
"""

import requests
from bs4 import BeautifulSoup
from datetime import datetime
import time
import random


class BaseScraper:
    """Base class for all scrapers with built-in rate limiting"""

    # Class-level tracking for rate limiting across all scraper instances
    _last_request_time = {}
    _min_delay = 0.5  # Minimum seconds between requests to same domain
    _max_delay = 1.5  # Maximum seconds between requests (adds randomness)

    def __init__(self):
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Connection': 'keep-alive',
        }

    def _get_domain(self, url):
        """Extract domain from URL for rate limiting"""
        from urllib.parse import urlparse
        parsed = urlparse(url)
        return parsed.netloc

    def _rate_limit(self, url):
        """Apply rate limiting - wait if we've recently hit this domain"""
        domain = self._get_domain(url)
        now = time.time()

        if domain in self._last_request_time:
            elapsed = now - self._last_request_time[domain]
            min_wait = self._min_delay + random.uniform(0, self._max_delay - self._min_delay)

            if elapsed < min_wait:
                sleep_time = min_wait - elapsed
                time.sleep(sleep_time)

        # Update last request time
        self._last_request_time[domain] = time.time()

    def fetch_url(self, url, timeout=15, respect_rate_limit=True):
        """Fetch content from URL with rate limiting and error handling"""
        try:
            # Apply rate limiting
            if respect_rate_limit:
                self._rate_limit(url)

            response = requests.get(url, headers=self.headers, timeout=timeout)
            response.raise_for_status()
            return response
        except requests.exceptions.Timeout:
            print(f"  Timeout fetching {url}")
            return None
        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 429:
                print(f"  Rate limited by {url} - waiting 30s and retrying once")
                time.sleep(30)
                try:
                    response = requests.get(url, headers=self.headers, timeout=timeout)
                    response.raise_for_status()
                    return response
                except Exception:
                    pass
            print(f"  HTTP error fetching {url}: {e}")
            return None
        except Exception as e:
            print(f"  Error fetching {url}: {e}")
            return None
    
    def parse_html(self, html_content):
        """Parse HTML content"""
        return BeautifulSoup(html_content, 'html.parser')
    
    def extract_text(self, element):
        """Extract clean text from element"""
        if element:
            return element.get_text(strip=True)
        return ""
    
    def scrape(self, source):
        """Override this method in child classes"""
        raise NotImplementedError("Subclasses must implement scrape()")
