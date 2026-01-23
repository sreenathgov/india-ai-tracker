# Disabled Sources - Implementation Guide

This document lists all sources that are currently disabled in `sources.json` and provides guidance on how to enable them.

## Overview

Sources are disabled for one of these reasons:
1. **Custom Scraper Required** - Not RSS, needs HTML parsing
2. **JavaScript-Heavy** - Requires headless browser (Playwright/Selenium)
3. **Bot Protection** - Behind Incapsula/Cloudflare/CAPTCHA

---

## 1. Sources Requiring Custom Scrapers (Moderate Effort)

These sources have static HTML that can be parsed with BeautifulSoup but need custom scraping logic.

### Karnataka Digital (3 pages)
- **URLs**:
  - `https://karnatakadigital.in/events/`
  - `https://karnatakadigital.in/policies/`
  - `https://karnatakadigital.in/newsletter-2024/`
- **Type**: Static HTML
- **Difficulty**: Easy
- **Implementation**:
  ```python
  # In backend/scrapers/web_scraper.py, add:
  def scrape_karnataka_digital(self, url):
      soup = self._fetch_page(url)
      articles = []
      # Events page: Look for event cards with title, date, location
      # Policies page: Look for policy document links
      # Newsletter: Look for newsletter archive links
      return articles
  ```
- **Notes**: Official Karnataka government digital initiative. High-quality state-specific content.

### NITI Aayog Reports ✅ ENABLED
- **URL**: `https://niti.gov.in/publications/division-reports?page=0`
- **Type**: Static HTML table
- **Status**: **ENABLED** - Scraper implemented and working
- **Difficulty**: Easy
- **Implementation**: Scraper `_scrape_niti_aayog()` implemented in `web_scraper.py`
- **Notes**: Critical for AI policy reports. Table structure with columns: S.No, Title, Date, Division, Download

### India Briefing (Legal/Regulatory)
- **URL**: `https://www.india-briefing.com/news/category/legal-regulatory`
- **Type**: Static HTML with pagination
- **Difficulty**: Easy
- **Notes**: Already has scraper implemented and enabled

### TN Government Press Releases
- **URL**: `https://www.tn.gov.in/press_release.php`
- **Type**: Static HTML (already has scraper)
- **Status**: Enabled but scraper needs testing
- **Notes**: Tamil Nadu government official press releases

### PIB Regional (Tamil Nadu)
- **URL**: `https://www.pib.gov.in/allRel.aspx?reg=6&lang=1`
- **Type**: ASP.NET web forms
- **Difficulty**: Medium
- **Implementation**: Handle ASP.NET ViewState, parse press release table
- **Notes**: Press Information Bureau regional office

### IIT Madras Research Park
- **URL**: `https://respark.iitm.ac.in/newsroom`
- **Type**: Static HTML
- **Difficulty**: Easy
- **Notes**: Already has scraper stub, always TN-relevant

---

## 2. Sources Requiring Headless Browser (High Effort)

These sources use JavaScript to load content dynamically.

### IndiaAI.gov.in
- **URL**: `https://indiaai.gov.in/news/all`
- **Type**: React/Next.js SPA
- **Difficulty**: High
- **Requirements**: Playwright or Selenium
- **Implementation**:
  ```python
  from playwright.sync_api import sync_playwright

  def scrape_indiaai_gov(url):
      with sync_playwright() as p:
          browser = p.chromium.launch()
          page = browser.new_page()
          page.goto(url)
          page.wait_for_selector('.news-card')
          # Extract content
  ```
- **Notes**: Official government AI portal. Very valuable but JavaScript-heavy.

### Deccan Herald Karnataka
- **URL**: `https://www.deccanherald.com/india/karnataka`
- **Type**: React SPA with CSS-in-JS (classes like `_9oMnb`)
- **Difficulty**: High
- **Requirements**: Playwright or Selenium
- **Notes**: Major Karnataka newspaper. Initial HTML contains minimal content - most articles loaded via JavaScript.

### MeitY Press Releases
- **URL**: `https://www.meity.gov.in/documents/press-release?page=1`
- **Type**: JavaScript-heavy (returns minimal HTML)
- **Difficulty**: High
- **Requirements**: Headless browser
- **Notes**: Ministry of Electronics and IT - critical for policy news but needs browser rendering.

### Conference Alerts India
- **URL**: `https://www.conferencealerts.in/india/ai`
- **Type**: AJAX-loaded content
- **Difficulty**: High
- **Requirements**: Headless browser or reverse-engineer API
- **Notes**: Good for AI events calendar

---

## 3. Sources Behind Bot Protection (Not Recommended)

These sources actively block automated access. Attempting to bypass may violate ToS.

### CII Events & Newsroom
- **URLs**:
  - `https://www.cii.in/Events.aspx`
  - `https://www.cii.in/NewsRoom.aspx?gid=N`
- **Protection**: Incapsula (Imperva)
- **Difficulty**: Very High / Not Recommended
- **Notes**: Returns Incapsula challenge page instead of content
- **Alternative**: Monitor CII's Twitter/LinkedIn for event announcements

### Economic Times AI Section
- **URL**: `https://economictimes.indiatimes.com/tech/artificial-intelligence`
- **Protection**: Rate limiting + bot detection
- **Notes**: Use ET RSS feeds instead (already configured)

### Indian Express AI Section
- **URL**: `https://indianexpress.com/section/technology/artificial-intelligence/`
- **Protection**: Bot detection
- **Notes**: No RSS feed available, consider monitoring via Google News

### The Hindu Tamil Nadu RSS
- **URL**: `https://www.thehindu.com/news/national/tamil-nadu/feeder/default.rss`
- **Protection**: Access blocked
- **Notes**: The Hindu Bangalore RSS works (already enabled)

### New Indian Express TN
- **URL**: `https://www.newindianexpress.com/states/tamil-nadu`
- **Protection**: Bot detection
- **Notes**: No viable workaround

---

## Implementation Priority

### ✅ Already Enabled
1. **NITI Aayog Reports** - Scraper implemented and working
2. **India Briefing** - Already has working scraper
3. **IIT Madras Research Park** - Already has working scraper

### High Priority (Enable Next)
1. **Karnataka Digital** - Easy implementation, official state source (static HTML)

### Requires Headless Browser (Future Phase)
These sources need Playwright/Selenium and are deferred to a future implementation phase:
1. **IndiaAI.gov.in** - React SPA, very valuable government portal
2. **MeitY Press Releases** - JavaScript-heavy, critical for policy news
3. **Deccan Herald Karnataka** - React SPA, good regional coverage

### Low Priority / Not Recommended
1. **CII Events/Newsroom** - Behind Incapsula protection, impractical
2. **Conference Alerts** - Complex AJAX, low priority

---

## How to Enable a Source

1. Implement the scraper function in `backend/scrapers/web_scraper.py`
2. Add the scraper type to the `scrape()` method's dispatch logic
3. Set `"enabled": true` in `backend/sources.json`
4. Test with: `python -c "from scrapers.web_scraper import WebScraper; ws = WebScraper(); print(ws.scrape('URL', 'scraper_type'))"`

---

## Testing Scrapers

```bash
# Test a single source
cd backend
python -c "
from scrapers.rss_scraper import RSScraper
rss = RSScraper()
articles = rss.scrape('https://analyticsindiamag.com/feed/')
print(f'Found {len(articles)} articles')
for a in articles[:3]:
    print(f'  - {a[\"title\"][:60]}...')
"
```

---

## Notes for Screenshots

If you have screenshots of the disabled sources, the key things to identify are:
1. **Page structure** - How articles/items are organized (cards, lists, tables)
2. **CSS selectors** - Class names for article containers, titles, dates
3. **Pagination** - How to navigate to older content
4. **Dynamic content** - Whether content loads via JavaScript

For Karnataka Digital specifically, a screenshot would help identify:
- Event card structure
- Date format used
- Location field placement
- Link structure for detail pages
